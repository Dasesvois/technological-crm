import { defineStore } from 'pinia';
import type { FeatureCode } from '@/modules/marketplace/types';
import { useAuthStore } from '@/modules/auth/stores/useAuthStore';

export type EntitlementsSource = 'purchase' | 'trial';
export type EntitlementsStatus = 'active' | 'canceled' | 'expired';

export type EntitlementItem = {
    code: FeatureCode;
    source: EntitlementsSource;
    status: EntitlementsStatus;
    purchasedAt: string; // ISO
    expiresAt?: string; // ISO (trial / подписка)
    canceledAt?: string; // ISO
    receiptId: string;
    trialUsed?: boolean; // чтобы “trial 1 раз”
};

// ✅ Новое: событие - атомарный факт “что произошло”
export type EntitlementEventType = 'purchase' | 'trial' | 'cancel' | 'expire';

export type EntitlementEvent = {
    id: string;            // уникальный id события
    code: FeatureCode;
    type: EntitlementEventType;
    at: string;            // ISO когда произошло
    receiptId: string;     // чек (для cancel тоже можно, как “документ”)
    // для trial: срок
    expiresAt?: string;
};

const STORAGE_KEY = 'crm_entitlements_v3';

function requireAdmin() {
    const auth = useAuthStore();
    return auth.userRole === 'admin';
}

function nowIso() {
    return new Date().toISOString();
}

function makeId(prefix: string) {
    return `${prefix}_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

function makeReceiptId() {
    return `rcpt_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

function isIsoExpired(expiresAt?: string) {
    if (!expiresAt) return false;
    return Date.now() > Date.parse(expiresAt);
}

function buildItemsFromEvents(events: EntitlementEvent[]): EntitlementItem[] {
    // важное: сортировка по времени, чтобы “история” применялась правильно
    const sorted = [...events].sort((a, b) => a.at.localeCompare(b.at));

    const map = new Map<FeatureCode, EntitlementItem>();

    for (const e of sorted) {
        const current = map.get(e.code);

        if (e.type === 'purchase') {
            map.set(e.code, {
                code: e.code,
                source: 'purchase',
                status: 'active',
                purchasedAt: e.at,
                receiptId: e.receiptId,
                trialUsed: current?.trialUsed ?? false, // не теряем факт “trial уже был”
            });
            continue;
        }

        if (e.type === 'trial') {
            // trial обычно даём, только если нет активной покупки.
            // тут просто применяем факт.
            map.set(e.code, {
                code: e.code,
                source: 'trial',
                status: 'active',
                purchasedAt: e.at,
                expiresAt: e.expiresAt,
                receiptId: e.receiptId,
                trialUsed: true, // как минимум факт “trial использован”
            });
            continue;
        }

        if (e.type === 'cancel') {
            if (!current) continue;

            map.set(e.code, {
                ...current,
                status: 'canceled',
                canceledAt: e.at,
            });
            continue;
        }

        if (e.type === 'expire') {
            if (!current) continue;

            map.set(e.code, {
                ...current,
                status: 'expired',
                // логично: если в событии есть expiresAt — сохраним
                expiresAt: e.expiresAt ?? current.expiresAt,
            });
            continue;
        }
    }

    // если active, но expiresAt истёк - expired
    for (const [code, it] of map.entries()) {
        if (it.status === 'active' && isIsoExpired(it.expiresAt)) {
            map.set(code, { ...it, status: 'expired' });
        }
    }

    return Array.from(map.values());
}

// --- Миграции ---
// v1: FeatureCode[]
// v2: EntitlementItem[]
// v3: { events: EntitlementEvent[] }
function normalizeToV3(parsed: unknown): { events: EntitlementEvent[] } {
    // уже v3
    if (
        parsed &&
        typeof parsed === 'object' &&
        'events' in (parsed as any) &&
        Array.isArray((parsed as any).events)
    ) {
        return parsed as { events: EntitlementEvent[] };
    }

    // v2: массив объектов EntitlementItem
    if (Array.isArray(parsed) && parsed.length > 0 && typeof parsed[0] === 'object') {
        const items = parsed as EntitlementItem[];
        const events: EntitlementEvent[] = items.map((it) => ({
            id: makeId('ev'),
            code: it.code,
            type: it.source === 'trial' ? 'trial' : 'purchase',
            at: it.purchasedAt,
            receiptId: it.receiptId || makeReceiptId(),
            expiresAt: it.expiresAt,
        }));

        // если было canceled - добавим cancel событие
        for (const it of items) {
            if (it.status === 'canceled' && it.canceledAt) {
                events.push({
                    id: makeId('ev'),
                    code: it.code,
                    type: 'cancel',
                    at: it.canceledAt,
                    receiptId: makeReceiptId(),
                });
            }
        }

        return { events };
    }

    // v1: массив строк FeatureCode
    if (Array.isArray(parsed) && parsed.length > 0 && typeof parsed[0] === 'string') {
        const codes = parsed as FeatureCode[];
        const at = nowIso();
        const events: EntitlementEvent[] = codes.map((code) => ({
            id: makeId('ev'),
            code,
            type: 'purchase',
            at,
            receiptId: makeReceiptId(),
        }));
        return { events };
    }

    return { events: [] };
}

function readFromStorageV3(): { events: EntitlementEvent[] } {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);

        // если v3 нет - попробуем подтянуть v2/v1
        if (!raw) {
            const legacyV2 = localStorage.getItem('crm_entitlements_v2');
            if (legacyV2) {
                const parsed = JSON.parse(legacyV2) as unknown;
                const v3 = normalizeToV3(parsed);
                localStorage.setItem(STORAGE_KEY, JSON.stringify(v3));
                return v3;
            }

            const legacyV1 = localStorage.getItem('crm_entitlements_v1');
            if (legacyV1) {
                const parsed = JSON.parse(legacyV1) as unknown;
                const v3 = normalizeToV3(parsed);
                localStorage.setItem(STORAGE_KEY, JSON.stringify(v3));
                return v3;
            }

            return { events: [] };
        }

        const parsed = JSON.parse(raw) as unknown;
        return normalizeToV3(parsed);
    } catch {
        return { events: [] };
    }
}

function writeToStorageV3(payload: { events: EntitlementEvent[] }) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
}

export const useEntitlementsStore = defineStore('entitlements', {
    state: () => {
        const v3 = readFromStorageV3();
        const items = buildItemsFromEvents(v3.events);

        return {
            events: v3.events as EntitlementEvent[],
            items: items as EntitlementItem[],
        };
    },

    getters: {
        // доступ к фиче (на основе items)
        has: (state) => (code: FeatureCode) => {
            const it = state.items.find((x) => x.code === code);
            if (!it) return false;
            if (it.status !== 'active') return false;
            return !isIsoExpired(it.expiresAt);

        },

        get: (state) => (code: FeatureCode) => {
            return state.items.find((x) => x.code === code) ?? null;
        },

        // история по фиче (таймлайн)
        history: (state) => (code: FeatureCode) => {
            return [...state.events]
                .filter((e) => e.code === code)
                .sort((a, b) => b.at.localeCompare(a.at)); // показываем “последнее сверху”
        },
    },

    actions: {
        hasExpireEvent(code: FeatureCode) {
            return this.history(code).some((e) => e.type === 'expire');
        },

        persist() {
            writeToStorageV3({ events: this.events });
        },

        trialUsed(code: FeatureCode) {
            return this.history(code).some((e) => e.type === 'trial');
        },

        rebuildFromEvents() {
            this.items = buildItemsFromEvents(this.events);
        },

        pushEvent(payload: Omit<EntitlementEvent, 'id'> & { id?: string }) {
            this.events.unshift({
                id: payload.id ?? makeId('ev'),
                ...payload,
            });

            this.rebuildFromEvents();
            this.persist();
        },

        syncExpired() {
            const now = nowIso();

            // смотрим текущее состояние items (оно уже построено из events)
            const toExpire = this.items.filter((it) =>
                it.status === 'active' &&
                isIsoExpired(it.expiresAt) &&
                !this.hasExpireEvent(it.code)
            );

            for (const it of toExpire) {
                this.pushEvent({
                    code: it.code,
                    type: 'expire',
                    at: now,
                    receiptId: it.receiptId,      // норм для MVP
                    expiresAt: it.expiresAt,      // чтобы в таймлайне было красиво
                });
            }
        },

        purchase(code: FeatureCode) {
            if (!requireAdmin()) return;

            const current = this.get(code);
            if (current && current.source === 'purchase' && this.has(code)) return;

            this.pushEvent({
                code,
                type: 'purchase',
                at: nowIso(),
                receiptId: makeReceiptId(),
            });
        },

        startTrial(code: FeatureCode, days = 30) {
            if (!requireAdmin()) return;

            const current = this.get(code);

            // если уже есть активная покупка - trial не даём
            if (current && current.source === 'purchase' && this.has(code)) return;

            // trial 1 раз в жизни - по history
            if (this.trialUsed(code)) return;

            const at = nowIso();
            const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * days).toISOString();

            this.pushEvent({
                code,
                type: 'trial',
                at,
                expiresAt,
                receiptId: makeReceiptId(),
            });
        },

        cancel(code: FeatureCode) {
            if (!requireAdmin()) return;

            const current = this.get(code);
            if (!current) return;
            if (current.status !== 'active') return;

            this.pushEvent({
                code,
                type: 'cancel',
                at: nowIso(),
                receiptId: makeReceiptId(),
            });
        },

        reset() {
            this.events = [];
            this.items = [];
            this.persist();
        },
    },
});
