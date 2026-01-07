import type { Deal, CreateDealPayload, UpdateDealPayload } from '../types';

// --- Внутреннее "хранилище" (как будто база данных) ---
// Важно: это модульная переменная — живёт, пока живёт страница (до перезагрузки).
let DEALS_DB: Deal[] = [
    {
        id: 'd1',
        title: 'Подписка Pro на CRM (первый клиент)',
        status: 'OPEN',
        amount: 9900,
        currency: 'RUB',
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(),
        updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(),
    },
    {
        id: 'd2',
        title: 'Интеграция чата для команды продаж',
        status: 'WON',
        amount: 300,
        currency: 'USD',
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10).toISOString(),
        updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
    },
    {
        id: 'd3',
        title: 'Модуль курсов валют + конвертер',
        status: 'LOST',
        amount: 120,
        currency: 'EUR',
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString(),
        updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 6).toISOString(),
    },
];

// Имитируем задержку сети, чтобы UI учился работать с loading-состоянием.
function sleep(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

// Генератор id (в реальном мире это обычно делает БД).
function generateId() {
    return `d_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

export const dealsApi = {
    // READ: получить список сделок
    async getDeals(): Promise<Deal[]> {
        await sleep(500);

        // Возвращаем копию массива, чтобы никто снаружи случайно не мутировал DB.
        return [...DEALS_DB].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    },

    // CREATE: создать сделку
    async createDeal(payload: CreateDealPayload): Promise<Deal> {
        await sleep(500);

        const now = new Date().toISOString();

        const deal: Deal = {
            id: generateId(),
            title: payload.title.trim(),
            status: payload.status,
            amount: payload.amount,
            currency: payload.currency,
            createdAt: now,
            updatedAt: now,
        };

        DEALS_DB = [deal, ...DEALS_DB];

        return deal;
    },

    // UPDATE: обновить сделку
    async updateDeal(payload: UpdateDealPayload): Promise<Deal> {
        await sleep(500);

        const current = DEALS_DB.find((d) => d.id === payload.id);
        if (!current) {
            throw new Error('Сделка не найдена');
        }

        const updated: Deal = {
            ...current,
            // Обновляем только те поля, которые передали
            title: payload.title !== undefined ? payload.title.trim() : current.title,
            status: payload.status ?? current.status,
            amount: payload.amount ?? current.amount,
            currency: payload.currency ?? current.currency,
            updatedAt: new Date().toISOString(),
        };

        // Заменяем элемент в "БД"
        DEALS_DB = DEALS_DB.map((d) => (d.id === payload.id ? updated : d));

        return updated;
    },

    // DELETE: удалить сделку
    async deleteDeal(id: string): Promise<void> {
        await sleep(400);

        const before = DEALS_DB.length;
        DEALS_DB = DEALS_DB.filter((d) => d.id !== id);

        // Если ничего не удалили — значит id неверный
        if (DEALS_DB.length === before) {
            throw new Error('Сделка не найдена');
        }
    },
};

