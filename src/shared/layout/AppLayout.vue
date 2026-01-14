<template>
  <div class="app-layout">
    <header class="app-header">
      <div class="logo">RevenueFlow CRM</div>
      <div class="user-area">
        <!-- Показываем пользователя и роль, если он есть -->
        <span class="user-name" v-if="authStore.user">
          {{ authStore.user.name }} ({{ authStore.user.role }})
        </span>

        <button class="logout-btn" type="button" @click="onLogout">
          Выйти
        </button>
      </div>
    </header>

    <div class="app-body">
      <aside class="sidebar">
        <nav>
          <ul>
            <li>
              <NavFeatureLink to="/app/dashboard">Dashboard</NavFeatureLink>
            </li>
            <li>
              <span class="sidebar-section-title">CRM</span>
            </li>
            <li>
              <NavFeatureLink to="/app/deals">Deals</NavFeatureLink>
            </li>
            <li>
              <NavFeatureLink to="/app/marketplace">Marketplace</NavFeatureLink>
            </li>
            <li>
              <NavFeatureLink to="/app/currency" feature="CURRENCY">Currency</NavFeatureLink>
            </li>
            <li>
              <NavFeatureLink to="/app/purchases">Purchases</NavFeatureLink>
            </li>
            <li>
              <a href="javascript:void(0)">Clients (скоро)</a>
            </li>
            <li>
              <span class="sidebar-section-title">Extra</span>
            </li>
            <li>
              <a href="javascript:void(0)">Modules (скоро)</a>
            </li>
            <li>
              <a href="javascript:void(0)">Chat (скоро)</a>
            </li>
          </ul>
        </nav>
      </aside>

      <main class="app-content">
        <RouterView />
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from "vue-router";
import {useAuthStore} from "@/modules/auth/stores/useAuthStore.ts";
import NavFeatureLink from '@/shared/components/NavFeatureLink.vue';

const router =  useRouter();
const authStore = useAuthStore();

const onLogout = () => {
  // Чистим стор и localStorage
  authStore.logout()

  // Перекидываем на логин
  router.push({ name: 'login'});
};
</script>

<style scoped>
.app-layout {
  display: flex;
  flex-direction: column;
  height: 100vh;
}

.app-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 16px;
  height: 56px;
  border-bottom: 1px solid #e5e7eb;
  background-color: #0f172a;
  color: #f9fafb;
}

.logo {
  font-weight: 600;
}

.user-area {
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 12px;
}

.logout-btn {
  padding: 6px 10px;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.35);
  background: transparent;
  color: #f9fafb;
  cursor: pointer;
  font-size: 13px;
}

.logout-btn:hover {
  border-color: rgba(255, 255, 255, 0.6);
}

.app-body {
  display: flex;
  flex: 1;
  min-height: 0;
}

.sidebar {
  width: 220px;
  border-right: 1px solid #e5e7eb;
  padding: 16px;
  background-color: #f9fafb;
}

.sidebar ul {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 8px;
}

.sidebar li {
  margin: 0;
}

.sidebar a,
.sidebar {
  text-decoration: none;
  color: #111827;
  font-size: 14px;
}

.sidebar {
  font-weight: 600;
}

.sidebar-section-title {
  display: block;
  margin-top: 12px;
  margin-bottom: 4px;
  font-size: 12px;
  text-transform: uppercase;
  color: #6b7280;
}

.app-content {
  flex: 1;
  padding: 16px;
  overflow: auto;
  background-color: #f3f4f6;
}

</style>