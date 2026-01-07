import { createRouter, createWebHistory } from 'vue-router';
import type { RouteRecordRaw } from 'vue-router';
import type { FeatureCode } from '@/modules/marketplace/types';

import { useAuthStore } from '@/modules/auth/stores/useAuthStore';
import { useEntitlementsStore } from '@/shared/stores/entitlements';

import LoginPage from '@/modules/auth/pages/LoginPage.vue';
import DashboardPage from '@/modules/dashboard/pages/DashboardPage.vue';
import AppLayout from '@/shared/layout/AppLayout.vue';
import DealsPage from '@/modules/deals/pages/DealsPage.vue';
import MarketplacePage from '@/modules/marketplace/pages/MarketplacePage.vue';
import CurrencyPage from '@/modules/currency/pages/CurrencyPage.vue';

const routes: RouteRecordRaw[] = [
    { path: '/', redirect: '/app/login' },

    {
        path: '/app/login',
        name: 'login',
        component: LoginPage,
    },

    {
        path: '/app',
        component: AppLayout,
        children: [
            { path: 'dashboard', name: 'dashboard', component: DashboardPage },
            { path: 'deals', name: 'deals', component: DealsPage },

            { path: 'marketplace', name: 'marketplace', component: MarketplacePage },

            {
                path: 'currency',
                name: 'currency',
                component: CurrencyPage,
                meta: { feature: 'CURRENCY' }, // <-- платная фича
            },

            // позже: chat, reports и т.д. (тоже с meta.feature)
        ],
    },
];

const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes,
});

router.beforeEach((to) => {
    const authStore = useAuthStore();

    const isAuth = authStore.isAuthenticated;
    const isLoginPage = to.name === 'login';

    // 1) AUTH GUARD
    if (!isAuth && to.path.startsWith('/app') && !isLoginPage) {
        return { name: 'login' };
    }

    if (isAuth && isLoginPage) {
        return { name: 'dashboard' };
    }

    // 2) FEATURE GUARD (платный доступ)
    // meta.feature ставим только на платные страницы
    const required = to.meta.feature as FeatureCode | undefined;
    if (required) {
        const ent = useEntitlementsStore();

        if (!ent.has(required)) {
            return {
                name: 'marketplace',
                query: { locked: required, from: to.fullPath },
            };
        }
    }

    // иначе пропускаем
    return true;
});

export default router;