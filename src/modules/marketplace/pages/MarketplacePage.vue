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
          <template v-if="entitlementFor(p.code)">
            <div class="meta-row">
              <span class="meta-label">Источник:</span>
              <span class="meta-value">{{ entitlementFor(p.code)?.source }}</span>
            </div>
          </template>
        </div>

        <div class="history" v-if="historyFor(p.code).length">
          <div class="history-title">История</div>

          <div v-for="e in historyFor(p.code)" :key="e.id" class="history-row">
            <span class="history-type">{{ eventLabel(e.type) }}</span>
            <span class="history-date">{{ formatDate(e.at) }}</span>
            <span class="history-receipt mono">{{ e.receiptId }}</span>
          </div>
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
            class="btn ghost"
            type="button"
            :disabled="isTrialDisabled(p.code, p.status)"
            @click="startTrial(p.code)"
          >
            {{ trialButtonLabel(p.code, p.status) }}
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

  if(it.source === 'trial') {
    return it.expiresAt
        ? `Триал до ${formatDate(it.expiresAt)}`
        : 'Триал активен';
  }
  return `Куплено ${formatDate(it.purchasedAt)}`;
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

  // если пришли из locked и это нужная фича — возвращаем обратно
  if(locked.value === code && from.value) {
    router.push(from.value);
  }
}

function isTrialDisabled(code: FeatureCode, status: FeatureStatus) {
  // trial есть смысл только на AVAILABLE
  if(status !== 'AVAILABLE') return true;

  const it = entitlements.get(code);

  // если триал уже используется - блокируем
  if(it?.trialUsed) return true;

  // если уже есть доступ - триал не нужен
  return entitlements.has(code);

}

function trialButtonLabel(code: FeatureCode, status: FeatureStatus) {
  if(status !== 'AVAILABLE') return 'Trial недоступен';

  const it = entitlements.get(code);
  // если есть активный доступ по покупке - trial не нужен
  if (entitlements.has(code) && it?.source === 'purchase') return 'Куплено';
  if(entitlements.has(code) && it?.source === 'trial') return 'Trial активен';
  if(it?.trialUsed) return 'Trial уже был использован';

  return 'Trial 30 дней';

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

function historyFor(code: FeatureCode) {
  return entitlements.history(code);
}

function eventLabel(t: 'purchase' | 'trial' | 'cancel') {
  if (t === 'purchase') return 'Покупка';
  if (t === 'trial') return 'Trial';
  return 'Отмена';
}


onMounted(async () => {
  entitlements.syncExpired();

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
.page-title {
  margin: 0 0 6px;
  font-size: clamp(20px, 2.2vw, 28px);
  font-weight: 700;
  color: #0f172a;
  letter-spacing: -0.02em;
}

.hint {
  margin: 0 0 14px;
  font-size: 13px;
  color: #6b7280;
  line-height: 1.4;
}

/* GRID */
.grid {
  display: grid;
  gap: 12px;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  align-items: start;
}

@media (max-width: 640px) {
  .grid {
    grid-template-columns: 1fr;
  }
}

/* CARD */
.card {
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 16px;
  padding: 14px;
  display: grid;
  gap: 12px;
  box-shadow: 0 1px 0 rgba(15, 23, 42, 0.04);
  transition: transform 120ms ease, box-shadow 120ms ease, border-color 120ms ease;
}

.card:hover {
  transform: translateY(-1px);
  box-shadow: 0 10px 22px rgba(15, 23, 42, 0.08);
}

.card.highlight {
  border-color: #2563eb;
  box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.12), 0 10px 22px rgba(15, 23, 42, 0.08);
}

/* CARD TOP */
.card-top {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 10px;
  align-items: start;
}

.title {
  font-weight: 800;
  color: #0f172a;
  line-height: 1.25;
}

.desc {
  font-size: 13px;
  color: #6b7280;
  margin-top: 4px;
  line-height: 1.35;
}

.badge {
  font-size: 12px;
  padding: 6px 10px;
  border-radius: 999px;
  border: 1px solid #e5e7eb;
  height: fit-content;
  white-space: nowrap;
  justify-self: end;
}

.badge[data-status="AVAILABLE"] { border-color: #22c55e; color: #16a34a; background: rgba(34, 197, 94, 0.06); }
.badge[data-status="COMING_SOON"] { border-color: #f59e0b; color: #b45309; background: rgba(245, 158, 11, 0.08); }
.badge[data-status="IN_DEV"] { border-color: #94a3b8; color: #475569; background: rgba(148, 163, 184, 0.12); }

@media (max-width: 420px) {
  .card-top {
    grid-template-columns: 1fr;
  }
  .badge {
    justify-self: start;
  }
}

/* PRICE */
.price {
  display: flex;
  align-items: baseline;
  gap: 6px;
  font-size: 20px;
  font-weight: 900;
  color: #0f172a;
}

.billing {
  font-size: 12px;
  font-weight: 700;
  color: #6b7280;
}

/* META */
.meta {
  display: grid;
  gap: 8px;
  padding: 12px;
  border: 1px dashed #e5e7eb;
  border-radius: 14px;
  background: #fafafa;
}

.meta-row {
  display: grid;
  grid-template-columns: 90px 1fr;
  gap: 10px;
  align-items: baseline;
}

.meta-label {
  font-size: 12px;
  color: #6b7280;
}

.meta-value {
  font-size: 12px;
  color: #0f172a;
  font-weight: 700;
  text-align: right;
  overflow-wrap: anywhere;
}

.mono {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
  font-weight: 700;
}

/* HISTORY */
.history {
  display: grid;
  gap: 6px;
  padding: 10px;
  border: 1px dashed #e5e7eb;
  border-radius: 12px;
}

.history-title {
  font-size: 12px;
  font-weight: 800;
  color: #0f172a;
}

.history-row {
  display: grid;
  grid-template-columns: auto auto 1fr;
  gap: 8px;
  align-items: baseline;
}

.history-type {
  font-size: 12px;
  font-weight: 700;
  color: #0f172a;
}

.history-date {
  font-size: 12px;
  color: #6b7280;
}

.history-receipt {
  font-size: 12px;
  text-align: right;
  color: #0f172a;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}


/* ACTIONS */
.actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  align-items: stretch; /* важно: пусть элементы тянутся */
}

@media (max-width: 900px) {
  .actions {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 520px) {
  .actions {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 420px) {
  .actions {
    grid-template-columns: 1fr;
  }
}

/* BUTTONS */
.btn {
  width: 100%;
  padding: 10px 12px;
  border-radius: 12px;
  border: 1px solid transparent;
  cursor: pointer;
  font-size: 13px;
  font-weight: 800;
  transition: transform 120ms ease, opacity 120ms ease, background 120ms ease, border-color 120ms ease;
}

.btn:active { transform: translateY(1px); }

.btn:disabled {
  opacity: 0.55;
  cursor: not-allowed;
  transform: none;
}

.btn {
  width: 100%;
  display: inline-flex;         /* центрируем текст красиво */
  align-items: center;
  justify-content: center;
  text-align: center;

  padding: 10px 12px;
  min-height: 42px;             /* чтобы 2 строки помещались */
  line-height: 1.2;             /* чтобы текст не “резало” */
  white-space: normal;          /* разрешаем перенос */
  word-break: break-word;       /* на всякий случай */
  overflow-wrap: anywhere;      /* если попадётся длинное слово */

  border-radius: 12px;
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

.btn.ghost {
  background: #fff;
  color: #2563eb;
  border-color: #cbd5e1;
}

.btn.ghost:hover {
  border-color: #2563eb;
  background: rgba(37, 99, 235, 0.06);
}

.btn.danger {
  background: #fff;
  color: #b91c1c;
  border-color: #fecaca;
}

.btn.danger:hover {
  background: rgba(185, 28, 28, 0.06);
  border-color: #fca5a5;
}

/* LINK */
.link {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  padding: 10px 12px;
  border-radius: 12px;
  border: 1px solid #e5e7eb;
  grid-column: 1;
  font-size: 13px;
  color: #2563eb;
  text-decoration: none;
  font-weight: 800;
  background: #fff;
  transition: background 120ms ease, border-color 120ms ease;
}

.link:hover {
  background: rgba(37, 99, 235, 0.06);
  border-color: #2563eb;
  text-decoration: underline;
}

/* LOCKED BANNER */
.locked-banner {
  margin: 0 0 14px;
  padding: 14px;
  border-radius: 16px;
  border: 1px solid #f59e0b;
  background: #fffbeb;
  color: #92400e;
  display: grid;
  gap: 8px;
}

.locked-banner.ok {
  border-color: #22c55e;
  background: #f0fdf4;
  color: #166534;
}

.locked-title {
  font-weight: 900;
  color: inherit;
}

.locked-sub {
  font-size: 13px;
  opacity: 0.92;
}

.btn.small {
  width: fit-content;
  padding: 8px 12px;
  border-radius: 12px;
  font-size: 13px;
}
</style>