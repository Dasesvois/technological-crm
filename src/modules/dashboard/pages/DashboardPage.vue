<template>
  <div class="dashboard">
    <h1 class="page-title">Dashboard</h1>

    <p class="welcome">
      Добро пожаловать в <strong>RevenueFlow CRM</strong> 👋
    </p>

    <p class="hint">
      На этом экране позже появятся:
      список доходов, графики, курсы валют и конвертер, быстрый доступ к
      сделкам, клиентам, модулям и чату.
    </p>

    <div class="placeholder-card">
      <p>Пока это заглушка первого этапа.</p>
      <p>Следующий шаг — добавить реальные данные и навигацию.</p>
    </div>
  </div>
</template>

<script setup lang="ts">
</script>

<style scoped>
.page-title {
  margin: 0 0 8px;
  font-size: 24px;
  font-weight: 600;
  color: #0f172a;
}

.welcome {
  margin: 0 0 8px;
  font-size: 14px;
  color: #374151;
}

.hint {
  margin: 0 0 16px;
  font-size: 13px;
  color: #6b7280;
}

.placeholder-card {
  padding: 16px;
  border-radius: 12px;
  background-color: #e5f0ff;
  border: 1px dashed #3b82f6;
  font-size: 14px;
  color: #1f2933;
}
</style>