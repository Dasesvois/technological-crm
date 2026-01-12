import { defineStore } from 'pinia';
import type { FeatureCode } from '@/modules/marketplace/types';

export type EntitlementsSource = 'purchase' | 'trial';
export type EntitlementsStatus = 'active' | 'canceled' | 'expired';

export type EntitlementItem = {
  code: FeatureCode;
  source: EntitlementsSource;
  status: EntitlementsStatus;
  trialUsed?: boolean; // можно взять trial только один раз
  purchasedAt: string; // ISO
  expiresAt?: string; // ISO (trial/ подписка)
  canceledAt?: string; // ISO
    receiptId: string; // Чек (MVP - идетиф.)
};

const STORAGE_KEY = 'crm_entitlements_v2';

function nowIso() {
    return new Date().toISOString();
}

function makeReceiptId() {
    return `rcpt_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

function isIsoExpired(expiresAt?: string) {
    if(!expiresAt) return false;
    return Date.now() > Date.parse(expiresAt);
}

// Миграция:
// новый формат: EntitlementItem[]
// старый формат: FeatureCode[]

function normalizeStorage(parsed: unknown): EntitlementItem[] {
    // новый формат (массив объектов)
    if(Array.isArray(parsed) && parsed.length > 0 && typeof parsed[0] === 'object') {
        return (parsed as EntitlementItem[]).map((it) => ({
           ...it,

            // если в старом v2 не было поля — будет undefined, это нормально
            trialUsed: it.trialUsed ?? (it.source === 'trial' ? true : undefined),
        }));
    }
    // старый формат (массив строк)
    if(Array.isArray(parsed) && parsed.length === 0 && typeof parsed[0] === 'string') {
        const codes = parsed as FeatureCode[];
        const purchasedAt = nowIso();

        return codes.map((code) => ({
            code,
            source: 'purchase',
            status: 'active',
            purchasedAt,
            receiptId: makeReceiptId(),
        }));
    }
    return [];
}

function readFromStorage(): EntitlementItem[] {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);

        // Если новый ключ пуст - попробуем мигрировать со старого v1
        if (!raw) {
            const legacyRaw = localStorage.getItem('crm_entitlements_v1');
            if (!legacyRaw) return [];
            const legacyParsed = JSON.parse(legacyRaw) as unknown;
            const migrated = normalizeStorage(legacyParsed);
            // сразу сохраняем миграцию в v2
            localStorage.setItem(STORAGE_KEY, JSON.stringify(migrated));
            return migrated;
        }

        const parsed = JSON.parse(raw) as unknown;
        return normalizeStorage(parsed);
    } catch {
        return [];
    }
}

function writeToStorage(items: EntitlementItem[]) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

export const useEntitlementsStore = defineStore('entitlements',{
    state: () => ({
        // Тут список купленных фитч
        items: readFromStorage(),
    }),

    getters: {
        // доступ к фиче
        has: (state) => (code: FeatureCode) => {
            const it = state.items.find((x) => x.code === code);
            if(!it) return false;

            if(it.status === 'canceled') return false;
            if(it.status === 'expired') return false;

            // если срок истёк — считаем недоступным (статус обновим отдельным action)
            return !isIsoExpired(it.expiresAt);
        },

        // получить запись (для UI: дата покупки, чек, expiresAt)
        get: (state) => (code: FeatureCode) => {
            return state.items.find((x) => x.code === code) ?? null;
        },
    },

    actions: {
        persist() {
            writeToStorage(this.items);
        },

        // помечаем как expired всё, что просрочилось
        syncExpired() {
            this.items = this.items.map((it) => {
                if(it.status === 'active' && isIsoExpired(it.expiresAt)) {
                    return {
                        ...it,
                        status: 'expired' as const,
                    };
                }
                return it;
            });
            this.persist();
        },
        purchase(code: FeatureCode) {
            const current = this.items.find((x) => x.code === code);

            // если уже активна подписка и не истекла, то ничего не делаем
            if(current && current.status === 'active' && !isIsoExpired(current.expiresAt)) return;

            const purchasedAt = nowIso();

            const item: EntitlementItem = {
                code,
                source: 'purchase',
                status: 'active',
                purchasedAt,
                receiptId: makeReceiptId(),

                // сохраняем факт использования триал, если он был
                trialUsed: current?.trialUsed ?? false,
            };

            // заменить запись по code
            this.items = [item, ...this.items.filter((x) => x.code !== code)];
            this.persist();
        },

        startTrial(code: FeatureCode, days = 30) {
            const current = this.items.find((x) => x.code === code);

            // Если trial уже использовали - больше не даём
            if (current?.trialUsed) return;

            // Если уже есть активная покупка - trial не нужен
            if (current?.source === 'purchase' && current.status === 'active' && !isIsoExpired(current.expiresAt)) return;

            const purchasedAt = nowIso();
            const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * days).toISOString();

            const item: EntitlementItem = {
                code,
                source: 'trial',
                status: 'active',
                purchasedAt,
                expiresAt,
                receiptId: makeReceiptId(),
                trialUsed:  true,
            };

            this.items = [item, ...this.items.filter((x) => x.code !== code)];
            this.persist();
        },

        cancel(code: FeatureCode) {
            const it = this.items.find((x) => x.code === code);
            if(!it) return;

            const canceledAt = nowIso();

            this.items =    this.items.map((x) => {
                if(x.code === code) {
                    return {
                        ...x,
                        status: 'canceled',
                        canceledAt,
                    };
                }
                return x;
            });
            this.persist();
        },

        reset() {
            this.items = [];
            this.persist();
        },
    },
});