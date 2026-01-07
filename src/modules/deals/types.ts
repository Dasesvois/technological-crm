// Валюты, которые поддерживаем на старте.
// Потом расширим (и добавим реальные курсы).
export type CurrencyCode = 'RUB' | 'USD' | 'EUR';

// Статусы сделки — минимальный набор для CRM.
// OPEN = в работе, WON = успешно, LOST = отказ.
export type DealStatus = 'OPEN' | 'WON' | 'LOST';

// Основная сущность "Сделка".
export interface Deal {
    id: string;            // строка, потому что удобно генерировать (uuid/Date.now)
    title: string;         // название сделки (например "Поставка оборудования")
    status: DealStatus;    // статус
    amount: number;        // сумма (важно: number, не string)
    currency: CurrencyCode;// валюта
    createdAt: string;     // ISO-строка даты, удобно хранить и отправлять
    updatedAt: string;     // ISO-строка даты
}

// DTO для создания сделки (то, что вводит пользователь).
// id/createdAt/updatedAt создаются на "сервере" (пока в мок-API).
export interface CreateDealPayload {
    title: string;
    status: DealStatus;
    amount: number;
    currency: CurrencyCode;
}

// DTO для обновления сделки.
// Обычно обновление частичное: меняем только то, что нужно.
export interface UpdateDealPayload {
    id: string;
    title?: string;
    status?: DealStatus;
    amount?: number;
    currency?: CurrencyCode;
}