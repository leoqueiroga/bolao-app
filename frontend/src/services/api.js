import { logger } from "@/utils/logger";
import axios from "axios";
import { supabase } from "./supabase";

// Cache do token para evitar chamadas repetidas ao Supabase
let cachedToken = null;
let tokenExpiry = null;
let isRefreshing = false;
let refreshPromise = null;

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || "http://localhost:3000/api",
    headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
    },
    withCredentials: false,
    timeout: 15000, // 15 segundos de timeout
});

// Função para obter token com cache
async function getAuthToken(forceRefresh = false) {
    const now = Date.now();

    // Se forçar refresh ou token expirado, buscar novo
    if (forceRefresh) {
        cachedToken = null;
        tokenExpiry = null;
    }

    // Se temos um token em cache e não expirou (5 min antes da expiração real)
    if (cachedToken && tokenExpiry && now < tokenExpiry - 300000) {
        return cachedToken;
    }

    // Evitar múltiplas chamadas simultâneas de refresh
    if (isRefreshing) {
        return refreshPromise;
    }

    isRefreshing = true;
    refreshPromise = (async () => {
        try {
            const {
                data: { session },
            } = await supabase.auth.getSession();

            if (session?.access_token) {
                cachedToken = session.access_token;
                // Calcular expiração baseada no expires_at da sessão
                tokenExpiry = session.expires_at
                    ? session.expires_at * 1000
                    : now + 3600000;
                return cachedToken;
            }
        } catch (error) {
            logger.warn("Erro ao obter sessão:", error);
        } finally {
            isRefreshing = false;
            refreshPromise = null;
        }

        return null;
    })();

    return refreshPromise;
}

// Limpar cache quando houver mudança de auth
supabase.auth.onAuthStateChange((event) => {
    if (
        event === "SIGNED_OUT" ||
        event === "TOKEN_REFRESHED" ||
        event === "SIGNED_IN"
    ) {
        cachedToken = null;
        tokenExpiry = null;
    }
});

// Interceptor para adicionar o token de autenticação do Supabase
api.interceptors.request.use(
    async (config) => {
        // Se já é um retry, não buscar token novamente
        if (config._retry) {
            return config;
        }

        const token = await getAuthToken();

        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        return config;
    },
    (error) => {
        return Promise.reject(error);
    },
);

// Interceptor para tratar respostas
api.interceptors.response.use(
    (response) => {
        return response;
    },
    async (error) => {
        const originalRequest = error.config;

        // Se for timeout ou erro de rede, não tentar refresh
        if (error.code === "ECONNABORTED" || !error.response) {
            logger.warn("Timeout ou erro de rede:", error.message);
            return Promise.reject(error);
        }

        // Evitar loop infinito de retries
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            // Limpar cache e tentar renovar o token
            cachedToken = null;
            tokenExpiry = null;

            try {
                const {
                    data: { session },
                    error: refreshError,
                } = await supabase.auth.refreshSession();

                if (refreshError || !session) {
                    logger.warn("Sessão expirada, redirecionando para login");
                    await supabase.auth.signOut();
                    window.location.href = "/login";
                    return Promise.reject(error);
                }

                // Atualizar cache
                cachedToken = session.access_token;
                tokenExpiry = session.expires_at
                    ? session.expires_at * 1000
                    : Date.now() + 3600000;

                // Retry the request with new token
                originalRequest.headers.Authorization = `Bearer ${session.access_token}`;
                return api.request(originalRequest);
            } catch (refreshError) {
                logger.error("Erro ao renovar token:", refreshError);
                await supabase.auth.signOut();
                window.location.href = "/login";
                return Promise.reject(refreshError);
            }
        }
        return Promise.reject(error);
    },
);

export default api;
