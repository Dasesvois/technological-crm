<template>
  <div class="filters">
    <label class="label">
      Статус:
      <select class="select" :value="status" @change="onChange">
        <option value="ALL">Все</option>
        <option value="OPEN">OPEN</option>
        <option value="WON">WON</option>
        <option value="LOST">LOST</option>
      </select>
    </label>
  </div>
</template>

<script setup lang="ts">
import type { DealStatus } from "../types";

// Храним "ALL" отдельно, чтобы не путать его с DealStatus
export type StatusFilter = DealStatus | 'ALL';

const props = defineProps<{
  status: StatusFilter;
}>();

const emit = defineEmits<{
  (e: 'update:status', value: StatusFilter): void;
}>();

function onChange(e: Event) {
  const value = (e.target as HTMLSelectElement).value as StatusFilter;
  emit('update:status', value);
}
</script>

<style scoped>
.filters {
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 0 0 12px;
}

.label {
  font-size: 13px;
  color: #374151;
  display: flex;
  align-items: center;
  gap: 8px;
}

.select {
  padding: 6px 10px;
  border-radius: 8px;
  border: 1px solid #d1d5db;
  background: #fff;
  font-size: 13px;
}
</style>