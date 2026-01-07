<template>
  <!-- Доступ есть - обычная ссылка -->
  <RouterLink v-if="allowed" :to="to" class="nav-link" active-class="active">
    <span class="text">
      <slot />
    </span>
  </RouterLink>

  <!-- Доступа нет - ведём в marketplace -->
  <RouterLink
      v-else
      :to="lockedTo"
      class="nav-link locked"
      :class="{ active: isCurrentLockedTarget }"
      title="Фича доступна после покупки"
  >
    <span class="lock">🔒</span>
    <span class="text">
      <slot />
    </span>
    <span class="pro">PRO</span>
  </RouterLink>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import { useEntitlementsStore } from '@/shared/stores/entitlements';
import type { FeatureCode } from '@/modules/marketplace/types';

const props = defineProps<{
  to: string;
  feature?: FeatureCode;
}>();

const route = useRoute();
const ent = useEntitlementsStore();

const allowed = computed(() => {
  if (!props.feature) return true;
  return ent.has(props.feature);
});

const lockedTo = computed(() => {
  const from = route.fullPath;
  return {
    path: '/app/marketplace',
    query: { locked: props.feature, from },
  };
});

// чтобы “locked” пункт не светился как активный из-за актив-класса
const isCurrentLockedTarget = computed(() => false);
</script>

<style scoped>
.nav-link {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 10px;
  border-radius: 12px;
  color: #0f172a;
  text-decoration: none;
  transition: background 0.15s ease, opacity 0.15s ease;
}

.nav-link:hover {
  background: #f1f5f9;
}

.nav-link.active {
  background: #e0f2fe;
  font-weight: 800;
}

.text {
  flex: 1;
}

/* Locked state */
.nav-link.locked {
  color: #64748b;
  background: transparent;
  border: 1px dashed #cbd5e1;
}

.nav-link.locked:hover {
  background: #f8fafc;
}

.lock {
  font-size: 14px;
  line-height: 1;
  opacity: 0.85;
}

.pro {
  font-size: 11px;
  font-weight: 800;
  padding: 3px 8px;
  border-radius: 999px;
  border: 1px solid #cbd5e1;
  color: #475569;
  background: #fff;
}
</style>