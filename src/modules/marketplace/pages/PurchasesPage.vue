<template>
  <div>
    <div class="top">
      <h1 class="page-title">Purchases</h1>

      <!-- DEV-кнопка (чтобы быстро тестировать) -->
      <button class="btn danger" type="button" @click="resetAll">
        Сбросить все покупки
      </button>
    </div>

    <p class="hint">История покупок/триалов из localStorage (MVP)</p>

    <div v-if="sorted.length === 0" class="empty">
      Пока нет покупок или триалов.
    </div>

    <div v-else class="list">
      <div v-for="it in sorted" :key="it.receiptId" class="card">
        <div class="row">
          <div class="code">{{ it.code }}</div>

          <span class="badge" :data-status="it.status">{{ statusLabel(it.status) }}</span>
        </div>

        <div class="meta">
          <div class="meta-row">
            <span class="label">Источник:</span>
            <span class="value">{{ it.source }}</span>
          </div>

          <div class="meta-row">
            <span class="label">Дата:</span>
            <span class="value">{{ formatDate(it.purchasedAt) }}</span>
          </div>

          <div class="meta-row" v-if="it.expiresAt">
            <span class="label">Истекает:</span>
            <span class="value">{{ formatDate(it.expiresAt) }}</span>
          </div>

          <div class="meta-row" v-if="it.canceledAt">
            <span class="label">Отменено:</span>
            <span class="value">{{ formatDate(it.canceledAt) }}</span>
          </div>

          <div class="meta-row">
            <span class="label">Чек:</span>
            <span class="value mono">{{ it.receiptId }}</span>
          </div>
        </div>

        <div class="actions">
          <button
            v-if="it.status === 'active'"
            class="btn ghost"
            type="button"
            @click="cancel(it.code)"
          >
            Отменить
          </button>

          <span class="hint small" v-else>
            Действий нет
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useEntitlementsStore } from '@/shared/stores/entitlements';
import type { EntitlementsStatus } from "@/shared/stores/entitlements";
import type { FeatureCode } from '@/modules/marketplace/types';

const entitlements = useEntitlementsStore();

// чтобы expired подтянулось если долго не заходит
entitlements.syncExpired();

const sorted = computed(() => {
  return [...entitlements.items].sort((a, b) => {
    return Date.parse(b.purchasedAt) - Date.parse(a.purchasedAt);
  });
});

function formatDate(iso?: string) {
  if(!iso) return '';
  return new Intl.DateTimeFormat('ru-RU', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(iso));
}

function statusLabel(s: EntitlementsStatus) {
  if (s === 'active') return 'Активно';
  if (s === 'canceled') return 'Отменено';
  return 'Истекло';
}

function cancel(code: FeatureCode) {
  entitlements.cancel(code);
}

function resetAll() {
  entitlements.reset();
}
</script>

<style scoped>
.top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 10px;
}

.page-title {
  margin: 0;
  font-size: 24px;
  font-weight: 600;
  color: #0f172a;
}

.hint {
  margin: 0 0 12px;
  font-size: 13px;
  color: #6b7280;
}
.hint.small {
  margin: 0;
  font-size: 12px;
}

.empty {
  padding: 12px;
  border: 1px dashed #e5e7eb;
  border-radius: 14px;
  color: #6b7280;
}

.list {
  display: grid;
  gap: 12px;
}

.card {
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 14px;
  padding: 12px;
  display: grid;
  gap: 10px;
}

.row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.code {
  font-weight: 800;
  color: #0f172a;
}

.badge {
  font-size: 12px;
  padding: 4px 8px;
  border-radius: 999px;
  border: 1px solid #e5e7eb;
}

.badge[data-status="active"] { border-color: #22c55e; color: #16a34a; }
.badge[data-status="canceled"] { border-color: #f59e0b; color: #b45309; }
.badge[data-status="expired"] { border-color: #94a3b8; color: #475569; }

.meta {
  display: grid;
  gap: 6px;
  padding: 10px;
  border: 1px dashed #e5e7eb;
  border-radius: 12px;
}

.meta-row {
  display: flex;
  justify-content: space-between;
  gap: 8px;
}

.label {
  font-size: 12px;
  color: #6b7280;
}

.value {
  font-size: 12px;
  color: #0f172a;
  font-weight: 600;
  text-align: right;
}

.mono {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
}

.actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.btn {
  padding: 8px 12px;
  border-radius: 10px;
  border: 1px solid #2563eb;
  background: #2563eb;
  color: #fff;
  cursor: pointer;
  font-size: 13px;
  font-weight: 600;
}

.btn.ghost {
  background: #fff;
  color: #2563eb;
  border-color: #2563eb;
}

.btn.danger {
  background: #fff;
  color: #b91c1c;
  border-color: #b91c1c;
}
</style>