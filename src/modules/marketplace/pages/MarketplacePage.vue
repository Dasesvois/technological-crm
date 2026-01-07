<template>
  <div>
    <h1 class="page-title">Marketplace</h1>
    <p class="hint">Покупаем “доп. модули” как товары. Это тренировочный модуль.</p>

    <div v-if="locked && !entitlements.has(locked)" class="locked-banner">
      <div class="locked-title">🔒 Модуль “{{ lockedTitle }}” недоступен</div>
      <div class="locked-sub">
        Купи его в Marketplace — и мы вернём тебя обратно.
      </div>
    </div>

    <div v-else-if="locked && entitlements.has(locked)" class="locked-banner ok">
      <div class="locked-title">✅ Модуль “{{ lockedTitle }}” уже куплен</div>
      <div class="locked-sub">
        Можешь открыть его из меню или вернуться назад.
      </div>

      <button
          v-if="from"
          class="btn small"
          type="button"
          @click="router.push(from)"
      >
        Вернуться назад →
      </button>
    </div>

    <div  class="grid">
      <div
          v-for="p in catalog"
          :key="p.code"
          class="card"
          :class="{ highlight: locked === p.code }"
          :ref="setCardRef(p.code)"
      >
        <div class="card-top">
          <div>
            <div class="title">{{ p.title }}</div>
            <div class="desc">{{ p.description }}</div>
          </div>

          <span class="badge" :data-status="p.status">
            {{ statusLabel(p.status) }}
          </span>
        </div>

        <div class="price">
          {{ formatMoney(p.price, p.currency) }}
          <span class="billing">/{{ billingLabel(p.billing) }}</span>
        </div>

        <div class="meta">
          <div class="meta-row">
            <span class="meta-label">Доступ:</span>
            <span class="meta-value">{{ accessLabel(p.code) }}</span>
          </div>

          <template v-if="entitlementFor(p.code)">
            <div class="meta-row">
              <span class="meta-label">Чек:</span>
              <span class="meta-value mono">{{ entitlementFor(p.code)?.receiptId }}</span>
            </div>
          </template>
        </div>

        <div class="actions">
          <button
            class="btn"
            type="button"
            :disabled="isDisabled(p.code, p.status)"
            @click="buy(p.code)"
          >
            {{ buttonLabel(p.code, p.status) }}
          </button>

          <!-- Trial: даём только если товар доступен и нет активного доступа -->
          <button
            v-if="p.status === 'AVAILABLE' && !entitlements.has(p.code)"
            class="btn ghost"
            type="button"
            @click="startTrial(p.code)"
          >
            Trial на 30 дней
          </button>

          <!-- Cancel: показываем если есть запись и она active -->
          <button
            v-if="entitlementFor(p.code)?.status === 'active'"
            class="btn danger"
            type="button"
            @click="cancel(p.code)"
          >
            Отменить
          </button>

          <RouterLink
              to="/app/currency"
              v-if="p.code === 'CURRENCY' && entitlements.has(p.code)"
              class="link"
          >
            Открыть модуль ->
          </RouterLink>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { FEATURE_CATALOG } from "../catalog";
import { useEntitlementsStore } from '@/shared/stores/entitlements';
import type { FeatureCode, FeatureStatus, BillingPeriod } from "../types";
import type { ComponentPublicInstance } from 'vue';
import type { EntitlementItem } from "@/shared/stores/entitlements";

const entitlements = useEntitlementsStore();

const route = useRoute();
const router = useRouter();

// Какую фичу пытались открыть (нас сюда редиректнул guard)
const locked = computed(() => route.query.locked as FeatureCode | undefined);

// Куда вернуть после покупки
const from = computed(() => route.query.from as string | undefined);

// для текста в банере
const lockedTitle = computed(() => {
  const code = locked.value;
  if(!code) return null;
  const p = FEATURE_CATALOG.find(x => x.code === code);
  return p?.title ?? code;
});

const catalog = computed(() => FEATURE_CATALOG);

function entitlementFor(code: FeatureCode): EntitlementItem | null {
  return entitlements.get(code);
}

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

function accessLabel(code: FeatureCode) {
  const it = entitlementFor(code);
  if(!it) return 'Нет доступа';

  // если истёк expiresAt, стор уже может считать недоступным,
  // но запись всё равно покажем.
  if(it.status === 'canceled') return `Отменено ${formatDate(it.canceledAt)}`;
  if(it.status === 'expired') return `Истекло ${formatDate(it.expiresAt)}`;

  if(it.source === 'trial') return `Триал активен до ${formatDate(it.expiresAt)}`;

  return `Активно до ${formatDate(it.purchasedAt)}`;
}

// refs карточек по code (нужно для scrollIntoView)
const cardRefs = ref<Record<string, HTMLElement | null>>({});

function setCardRef(code: FeatureCode) {
  return (el: Element | ComponentPublicInstance |null) => {
    cardRefs.value[code] = el instanceof Element ? el as HTMLElement : null;
  };
}

function buy(code: FeatureCode) {
    entitlements.purchase(code);

  // Если нас сюда привёл guard и пользователь купил нужную фичу — возвращаем обратно
  if(locked.value === code && from.value) {
      router.push(from.value);
  }
}

function startTrial(code: FeatureCode) {
  entitlements.startTrial(code, 30);
}

function cancel(code: FeatureCode) {
  entitlements.cancel(code);
}

function isDisabled(code: FeatureCode, status: FeatureStatus) {
    if(status !== 'AVAILABLE') return true;
    return entitlements.has(code);
}

function buttonLabel(code: FeatureCode, status: FeatureStatus) {
    if(entitlements.has(code)) return 'Куплено';
    if(status === 'AVAILABLE') return 'Купить';
    return 'Недоступно';
}

function statusLabel(s: FeatureStatus) {
  if(s === 'AVAILABLE') return 'Доступно';
  if(s === 'IN_DEV') return 'В разработке';
  return 'Скоро'
}

function billingLabel(b: BillingPeriod) {
  if(b === 'monthly') return 'мес';
  if(b === 'yearly') return 'год';
  return 'разово';
}

function formatMoney(amount: number, currency: string) {
  return new Intl.NumberFormat('ru-Ru', { style: 'currency', currency }).format(amount);
}

onMounted(async () => {
  await nextTick(); // ждём, пока DOM отрендерит карточки
  const code = locked.value;
  if(!code) return;

  const el = cardRefs.value[code];
  if(el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
});

</script>

<style scoped>
.page-title { margin: 0 0 8px; font-size: 24px; font-weight: 600; color: #0f172a; }
.hint { margin: 0 0 14px; font-size: 13px; color: #6b7280; }

.grid {
  display: grid;
  gap: 12px;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
}

.card {
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 14px;
  padding: 12px;
  display: grid;
  gap: 10px;
}

.card-top {
  display: flex;
  justify-content: space-between;
  gap: 10px;
}

.title { font-weight: 700; color: #0f172a; }
.desc { font-size: 13px; color: #6b7280; margin-top: 4px; }

.badge {
  font-size: 12px;
  padding: 4px 8px;
  border-radius: 999px;
  border: 1px solid #e5e7eb;
  height: fit-content;
}
.badge[data-status="AVAILABLE"] { border-color: #22c55e; color: #16a34a; }
.badge[data-status="COMING_SOON"] { border-color: #f59e0b; color: #b45309; }
.badge[data-status="IN_DEV"] { border-color: #94a3b8; color: #475569; }

.price { font-size: 18px; font-weight: 800; color: #0f172a; }
.billing { font-size: 12px; font-weight: 600; color: #6b7280; margin-left: 4px; }

.actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
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
.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.link {
  font-size: 13px;
  color: #2563eb;
  text-decoration: none;
}
.link:hover { text-decoration: underline; }

.locked-banner {
  margin: 0 0 14px;
  padding: 12px 12px;
  border-radius: 14px;
  border: 1px solid #f59e0b;
  background: #fffbeb;
  color: #92400e;
  display: grid;
  gap: 6px;
}

.locked-banner.ok {
  border-color: #22c55e;
  background: #f0fdf4;
  color: #166534;
}

.locked-title {
  font-weight: 800;
  color: inherit;
}

.locked-sub {
  font-size: 13px;
  opacity: 0.9;
}

.btn.small {
  padding: 6px 10px;
  border-radius: 10px;
  font-size: 13px;
  width: fit-content;
}

.card.highlight {
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.15);
}

.meta {
  display: grid;
  gap: 6px;
  padding: 10px;
  border: 1px dashed #e5e7eb;
  border-radius: 12px;
}

.meta-row {
  display: flex;
  gap: 8px;
  justify-content: space-between;
  align-items: baseline;
}

.meta-label {
  font-size: 12px;
  color: #6b7280;
}

.meta-value {
  font-size: 12px;
  color: #0f172a;
  font-weight: 600;
  text-align: right;
}

.mono {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
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