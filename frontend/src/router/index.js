import { createRouter, createWebHistory } from "vue-router";

const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    scrollBehavior(to, from, savedPosition) {
        if (savedPosition) return savedPosition;
        return { top: 0 };
    },
    routes: [
        {
            path: "/login",
            name: "login",
            component: () => import("@/views/LoginView.vue"),
            meta: { guest: true },
        },
        {
            path: "/register",
            name: "register",
            component: () => import("@/views/RegisterView.vue"),
            meta: { guest: true },
        },
        {
            path: "/",
            name: "dashboard",
            component: () => import("@/views/DashboardView.vue"),
            meta: { requiresAuth: true },
        },
        {
            path: "/games",
            name: "games",
            component: () => import("@/views/GamesView.vue"),
            meta: { requiresAuth: true },
        },
        {
            path: "/games/:id",
            name: "game-detail",
            component: () => import("@/views/GameDetailView.vue"),
            meta: { requiresAuth: true },
        },
        {
            path: "/bets",
            name: "bets",
            component: () => import("@/views/BetsView.vue"),
            meta: { requiresAuth: true },
        },
        {
            path: "/ranking",
            name: "ranking",
            component: () => import("@/views/RankingView.vue"),
            meta: { requiresAuth: true },
        },
        {
            path: "/profile",
            name: "profile",
            component: () => import("@/views/ProfileView.vue"),
            meta: { requiresAuth: true },
        },
        {
            path: "/admin",
            name: "admin",
            component: () => import("@/views/admin/AdminDashboard.vue"),
            meta: { requiresAuth: true, requiresAdmin: true },
        },
        {
            path: "/admin/games",
            name: "admin-games",
            component: () => import("@/views/admin/GamesManagement.vue"),
            meta: { requiresAuth: true, requiresAdmin: true },
        },
        {
            path: "/admin/competitions",
            name: "admin-competitions",
            component: () => import("@/views/admin/CompetitionsManagement.vue"),
            meta: { requiresAuth: true, requiresAdmin: true },
        },
        {
            path: "/admin/users",
            name: "admin-users",
            component: () => import("@/views/admin/UsersManagement.vue"),
            meta: { requiresAuth: true, requiresAdmin: true },
        },
    ],
});

export function setupRouterGuards(authStore) {
    router.beforeEach(async (to, from, next) => {
        // Aguardar inicialização do auth antes de qualquer decisão
        if (!authStore.initialized) {
            await authStore.initialize();
        }

        if (to.meta.requiresAuth && !authStore.isAuthenticated) {
            next("/login");
        } else if (to.meta.guest && authStore.isAuthenticated) {
            next("/");
        } else if (to.meta.requiresAdmin && !authStore.isAdmin) {
            next("/");
        } else {
            next();
        }
    });
}

export default router;
