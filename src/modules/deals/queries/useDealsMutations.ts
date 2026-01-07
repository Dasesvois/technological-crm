import { useMutation, useQueryClient } from "@tanstack/vue-query";
import { dealsApi } from "../api/dealsApi";
import  { DEALS_QUERY_KEY } from "./useDealsQuery";
import type { CreateDealPayload, UpdateDealPayload } from "@/modules/deals/types";

export function useCreateDealMutation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (payload: CreateDealPayload) => dealsApi.createDeal(payload),

        // После успешного создания обновляем список сделок
        onSuccess: async () => {
            await queryClient.invalidateQueries({queryKey: DEALS_QUERY_KEY});
        }
    });
}

export function useUpdateDealMutation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (payload: UpdateDealPayload) => dealsApi.updateDeal(payload),

        onSuccess: async () => {
            await queryClient.invalidateQueries({queryKey: DEALS_QUERY_KEY});
        },
    });
}

export function useDeleteDealMutation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => dealsApi.deleteDeal(id),

        onSuccess: async () => {
            await queryClient.invalidateQueries({queryKey: DEALS_QUERY_KEY});
        },
    });
}