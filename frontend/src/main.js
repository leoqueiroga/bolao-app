import { createPinia } from "pinia";
import { createApp } from "vue";
import App from "./App.vue";
import "./assets/main.css";
import router, { setupRouterGuards } from "./router";
import { useAuthStore } from "./stores/auth";

const app = createApp(App);
const pinia = createPinia();

app.use(pinia);

// Configurar guards ANTES de usar o router
const authStore = useAuthStore(pinia);
setupRouterGuards(authStore);

app.use(router);
app.mount("#app");

// Inicializar a sessão em background (o guard já aguarda o initialized)
authStore.initialize();
