<template>
  <div class="login-page">
    <div class="login-card">
      <h1 class="title">RevenueFlow CRM</h1>
      <p class="subtitle">Вход в систему</p>

      <form class="form" @submit.prevent="onSubmit">
        <label class="field">
          <span>Email</span>
          <input
              v-model="email"
              type="email"
              required
              placeholder="you@example.com"
          />
        </label>

        <label class="field">
          <span>Пароль</span>
          <input
              v-model="password"
              type="password"
              required
              placeholder="••••••••"
          />
        </label>

        <button
            type="submit"
            class="submit-btn"
            :disabled="authStore.isLoading"
        >
          <span v-if="!authStore.isLoading">Войти</span>
          <span v-else="authStore.isLoading">Входим...</span>
        </button>
      </form>

      <div class="quick-login">
        <button type="button" class="quick-btn" @click="fillAdmin">
          Заполнить Admin
        </button>
        <button type="button" class="quick-btn" @click="fillUser">
          Заполнить User
        </button>
      </div>

      <!-- Блок ошибки, если что-то пошло не так -->
      <p v-if="authStore.error" class="error">
        {{ authStore.error }}}
      </p>

      <p class="hint">
        Для входа сейчас используйте:
        <br />
        <strong>email:</strong> admin@example.com
        <br />
        <strong>password:</strong> 123
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import {ref, watch} from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/useAuthStore';

const fillAdmin = () => {
  email.value = 'admin@example.com';
  password.value = '123';
};

const fillUser = () => {
  email.value = 'user@example.com';
  password.value = '123';
};

const router = useRouter();
const authStore = useAuthStore();

const email = ref('admin@example.com'); // для удобства разработки
const password = ref('123');

// Следим за isAuthenticated — если пользователь залогинился, отправляем на dashboard
watch(
    () => authStore.isAuthenticated,
    (isAuth) => {
      if (isAuth) {
        router.push({ name: 'dashboard' });
      }
    }
);

const onSubmit = async () => {
  await authStore.login({
    email: email.value,
    password: password.value
  });
};
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: radial-gradient(circle at top, #e5f0ff, #f9fafb);
}

.login-card {
  width: 100%;
  max-width: 360px;
  background: #ffffff;
  padding: 24px 24px 20px;
  border-radius: 12px;
  box-shadow: 0 15px 35px rgba(15, 23, 42, 0.12);
}

.title {
  margin: 0 0 4px;
  font-size: 22px;
  font-weight: 600;
  color: #0f172a;
}

.subtitle {
  margin: 0 0 16px;
  font-size: 14px;
  color: #6b7280;
}

.form {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.field span {
  display: block;
  margin-bottom: 4px;
  font-size: 13px;
  color: #374151;
}

input {
  width: 100%;
  padding: 8px 10px;
  border-radius: 8px;
  border: 1px solid #d1d5db;
  font-size: 14px;
}

input:focus {
  outline: none;
  border-color: #2563eb;
  box-shadow: 0 0 0 1px rgba(37, 99, 235, 0.15);
}

.submit-btn {
  margin-top: 8px;
  width: 100%;
  padding: 9px 0;
  border-radius: 8px;
  border: none;
  background-color: #2563eb;
  color: #fff;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
}

.submit-btn:hover {
  background-color: #1d4ed8;
}

.hint {
  margin-top: 10px;
  font-size: 12px;
  color: #9ca3af;
}

.error {
  margin-top: 8px;
  font-size: 13px;
  color: #b91c1c;
}

.quick-login {
  margin-top: 10px;
  display: flex;
  gap: 8px
}

.quick-btn {
  flex: 1;
  padding: 7px 10px;
  border-radius: 8px;
  border: 1px solid #d1d5db;
  background: #fff;
  cursor: pointer;
  font-size: 13px;
}

.quick-btn:hover {
  background: #f3f4f6;
}
</style>
