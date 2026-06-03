/**
 * Utilitário de sanitização para prevenir XSS
 */

/**
 * Escapa HTML para prevenir XSS
 * @param {string} text - Texto a ser escapado
 * @returns {string} - Texto escapado
 */
export function escapeHtml(text) {
    if (typeof text !== "string") return text;

    const map = {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;",
    };

    return text.replace(/[&<>"']/g, (m) => map[m]);
}

/**
 * Remove tags HTML
 * @param {string} html - HTML a ser limpo
 * @returns {string} - Texto sem tags
 */
export function stripTags(html) {
    if (typeof html !== "string") return html;
    return html.replace(/<[^>]*>/g, "");
}

/**
 * Sanitiza entrada de usuário
 * @param {string} input - Entrada do usuário
 * @returns {string} - Entrada sanitizada
 */
export function sanitizeInput(input) {
    if (typeof input !== "string") return input;

    // Remove espaços extras
    let sanitized = input.trim();

    // Remove caracteres de controle
    sanitized = sanitized.replace(/[\x00-\x1F\x7F]/g, "");

    // Limita tamanho
    sanitized = sanitized.substring(0, 1000);

    return sanitized;
}

/**
 * Valida email
 * @param {string} email - Email a validar
 * @returns {boolean} - true se válido
 */
export function isValidEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

/**
 * Valida senha forte
 * @param {string} password - Senha a validar
 * @returns {object} - {valid: boolean, errors: string[]}
 */
export function validateStrongPassword(password) {
    const errors = [];

    if (password.length < 8) {
        errors.push("A senha deve ter no mínimo 8 caracteres");
    }

    if (!/[a-z]/.test(password)) {
        errors.push("A senha deve conter pelo menos uma letra minúscula");
    }

    if (!/[A-Z]/.test(password)) {
        errors.push("A senha deve conter pelo menos uma letra maiúscula");
    }

    if (!/\d/.test(password)) {
        errors.push("A senha deve conter pelo menos um número");
    }

    return {
        valid: errors.length === 0,
        errors,
    };
}

/**
 * Formata número de forma segura
 * @param {any} value - Valor a formatar
 * @returns {number} - Número formatado ou 0
 */
export function safeNumber(value) {
    const num = Number(value);
    return isNaN(num) ? 0 : num;
}

/**
 * Formata data de forma segura
 * @param {any} date - Data a formatar
 * @returns {Date|null} - Data válida ou null
 */
export function safeDate(date) {
    if (!date) return null;
    const d = new Date(date);
    return isNaN(d.getTime()) ? null : d;
}

/**
 * Domínios permitidos para imagens externas
 */
const ALLOWED_IMAGE_DOMAINS = [
    // Repositórios de imagens conhecidos
    "upload.wikimedia.org",
    "i.imgur.com",
    "pbs.twimg.com",
    "instagram.com",
    "cdninstagram.com",
    // Supabase (seu próprio storage)
    "supabase.co",
    "supabase.in",
    // Avatares de provedores OAuth
    "lh3.googleusercontent.com",
    "avatars.githubusercontent.com",
    "platform-lookaside.fbsbx.com",
    "graph.facebook.com",
    // CDNs comuns de times de futebol
    "s.sde.globo.com",
    "logodetimes.com",
    "ssl.gstatic.com",
    "www.cbf.com.br",
    // Outros CDNs seguros
    "images.unsplash.com",
    "cdn.jsdelivr.net",
];

/**
 * Valida se uma URL de imagem é de um domínio permitido
 * @param {string} url - URL da imagem
 * @returns {boolean} - true se a URL é de um domínio permitido
 */
export function isValidImageUrl(url) {
    if (!url || typeof url !== "string") return false;

    try {
        const parsed = new URL(url);

        // Permitir data URLs para imagens base64
        if (parsed.protocol === "data:") {
            return url.startsWith("data:image/");
        }

        // Verificar se é HTTPS (segurança)
        if (parsed.protocol !== "https:") return false;

        // Verificar se o domínio está na whitelist
        return ALLOWED_IMAGE_DOMAINS.some(
            (domain) =>
                parsed.hostname === domain ||
                parsed.hostname.endsWith("." + domain),
        );
    } catch {
        return false;
    }
}

/**
 * Retorna uma URL de imagem segura ou uma URL de fallback
 * @param {string} url - URL da imagem
 * @param {string} fallback - URL de fallback (opcional)
 * @returns {string|null} - URL validada ou fallback
 */
export function getSafeImageUrl(url, fallback = null) {
    return isValidImageUrl(url) ? url : fallback;
}
