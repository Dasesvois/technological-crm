export type CurrencyCode = 'RUB' | 'USD' | 'EUR';

export type RatesResponse = {
    base: CurrencyCode;
    date?: string;
    rates: Record<string, number>;
};

