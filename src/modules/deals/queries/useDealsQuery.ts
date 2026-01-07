import { useQuery } from '@tanstack/vue-query'
import { dealsApi } from '../api/dealsApi';
import type { Deal } from '../types'

// Ключ — это имя кэша. По нему TanStack Query понимает, какие данные где лежат.
export const DEALS_QUERY_KEY = ['deals'] as const;

export function useDealsQuery() {
    return useQuery<Deal[], Error>({
        queryKey: DEALS_QUERY_KEY,
        queryFn: () => dealsApi.getDeals(),
    });
}

