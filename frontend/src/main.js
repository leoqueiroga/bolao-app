import { createPinia } from "pinia";
import { createApp } from "vue";
import App from "./App.vue";
import "./assets/main.css";
import router, { setupRouterGuards } from "./router";
import { useAuthStore } from "./stores/auth";

const app = createApp(App);
const pinia = createPinia();

app.use(pinia);
app.use(router);

// Inicializar auth store antes de montar a aplicação
const authStore = useAuthStore();

authStore.initialize().then(() => {
    // Configurar guards do router após inicialização da auth store
    setupRouterGuards(authStore);

    // Montar a aplicação
    app.mount("#app");

    // Após montar, verificar se veio de OAuth e redirecionar
    if (authStore.isAuthenticated) {
        const currentPath = window.location.pathname;
        // Se estiver na página de login ou registro e já autenticado, redirecionar
        if (currentPath === "/login" || currentPath === "/register") {
            router.push("/");
        }
    }
});
