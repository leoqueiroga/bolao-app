import api from "@/services/api";
import { supabase } from "@/services/supabase";
import { defineStore } from "pinia";
import { computed, ref } from "vue";

export const useAuthStore = defineStore("auth", () => {
    const user = ref(null);
    const session = ref(null);
    const loading = ref(false);
    const error = ref(null);
    const initialized = ref(false);
    let initPromise = null;

    const isAuthenticated = computed(() => !!session.value);
    const isAdmin = computed(() => user.value?.role === "admin");

    async function login(credentials) {
        loading.value = true;
        error.value = null;

        try {
            const { data, error: authError } =
                await supabase.auth.signInWithPassword({
                    email: credentials.email,
                    password: credentials.password,
                });

            if (authError) {
                error.value = authError.message;
                return false;
            }

            session.value = data.session;

            // Buscar perfil do usuário via API
            await fetchUser();

            return true;
        } catch (err) {
            error.value = err.message || "Erro ao fazer login";
            return false;
        } finally {
            loading.value = false;
        }
    }

    async function register(userData) {
        loading.value = true;
        error.value = null;

        try {
            const { data, error: authError } = await supabase.auth.signUp({
                email: userData.email,
                password: userData.password,
                options: {
                    data: {
                        name: userData.name,
                    },
                },
            });

            if (authError) {
                error.value = authError.message;
                return false;
            }

            session.value = data.session;

            // Buscar perfil do usuário via API
            if (data.session) {
                await fetchUser();
            }

            return true;
        } catch (err) {
            error.value = err.message || "Erro ao registrar";
            return false;
        } finally {
            loading.value = false;
        }
    }

    async function logout() {
        try {
            await supabase.auth.signOut();
        } catch (err) {
            console.error("Erro ao fazer logout", err);
        } finally {
            user.value = null;
            session.value = null;
        }
    }

    async function loginWithGoogle() {
        loading.value = true;
        error.value = null;

        try {
            const { error: authError } = await supabase.auth.signInWithOAuth({
                provider: "google",
                options: {
                    redirectTo: `${window.location.origin}/`,
                },
            });

            if (authError) {
                error.value = authError.message;
                return false;
            }

            // O redirecionamento acontece automaticamente
            return true;
        } catch (err) {
            error.value = err.message || "Erro ao fazer login com Google";
            return false;
        } finally {
            loading.value = false;
        }
    }

    async function fetchUser() {
        if (!session.value) return;

        try {
            const response = await api.get("/auth/me");
            user.value = response.data;
        } catch (err) {
            console.error("Erro ao buscar usuário", err);
            // Se o backend não estiver disponível, criar um usuário básico a partir da sessão
            if (session.value?.user) {
                user.value = {
                    id: session.value.user.id,
                    email: session.value.user.email,
                    name:
                        session.value.user.user_metadata?.name ||
                        session.value.user.user_metadata?.full_name ||
                        session.value.user.email?.split("@")[0] ||
                        "Usuário",
                    role: "user",
                };
            }
        }
    }

    async function initialize() {
        // Retornar mesma promise se já iniciou
        if (initPromise) return initPromise;

        initPromise = (async () => {
            try {
                // Verificar sessão existente
                const {
                    data: { session: currentSession },
                } = await supabase.auth.getSession();

                if (currentSession) {
                    session.value = currentSession;
                    await fetchUser();
                }
            } catch (err) {
                console.warn("Erro ao inicializar auth:", err);
            } finally {
                initialized.value = true;
            }

            // Escutar mudanças de autenticação (apenas uma vez)
            supabase.auth.onAuthStateChange(async (event, newSession) => {
                // Ignorar eventos durante inicialização
                if (!initialized.value) return;

                console.log("Auth state changed:", event);

                // Evitar processar o mesmo estado
                const sessionChanged =
                    newSession?.access_token !== session.value?.access_token;

                if (event === "SIGNED_IN" && newSession && sessionChanged) {
                    session.value = newSession;
                    await fetchUser();
                } else if (event === "SIGNED_OUT") {
                    user.value = null;
                    session.value = null;
                } else if (event === "TOKEN_REFRESHED" && newSession) {
                    session.value = newSession;
                }
            });
        })();

        return initPromise;
    }

    return {
        user,
        session,
        loading,
        error,
        initialized,
        isAuthenticated,
        isAdmin,
        login,
        loginWithGoogle,
        register,
        logout,
        fetchUser,
        initialize,
    };
});
