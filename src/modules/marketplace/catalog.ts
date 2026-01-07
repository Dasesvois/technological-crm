import type { FeatureProduct } from './types';

export const FEATURE_CATALOG: FeatureProduct[] = [
    {
        code: 'CURRENCY',
        title: 'Live Currency + Converter',
        description: 'Курсы валют в реальном времени + конвертер внутри CRM.',
        price: 199,
        currency: 'RUB',
        billing: 'monthly',
        status: 'AVAILABLE',
    },
    {
        code: 'CHAT',
        title: 'Team Chat',
        description: 'Чат между пользователями CRM с историей и уведомлениями.',
        price: 499,
        currency: 'RUB',
        billing: 'monthly',
        status: 'IN_DEV',
    },
    {
        code: 'REPORTS',
        title: 'Advanced Reports',
        description: 'Отчёты по сделкам и финансам, графики, экспорт.',
        price: 899,
        currency: 'RUB',
        billing: 'monthly',
        status: 'COMING_SOON',
    },
    {
        code: 'AI_ASSIST',
        title: 'AI Assistant',
        description: 'Подсказки по сделкам, автосводки и идеи для upsell.',
        price: 1499,
        currency: 'RUB',
        billing: 'monthly',
        status: 'COMING_SOON',
    },
];