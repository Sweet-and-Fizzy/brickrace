<template>
  <div class="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
    <div>
      <h1 class="text-3xl font-bold text-gray-900 dark:text-white mb-2">{{ title }}</h1>
      <p v-if="subtitle" class="text-gray-600 dark:text-gray-300">{{ subtitle }}</p>
    </div>

    <div v-if="actions.length > 0" class="flex gap-2 mt-4 md:mt-0">
      <template v-for="action in actions" :key="action.label">
        <NuxtLink v-if="action.to" :to="action.to">
          <Button
            :label="action.label"
            :icon="action.icon"
            :class="action.class || 'btn-brick'"
            :severity="action.severity"
            :outlined="action.outlined"
            @click="action.onClick"
          />
        </NuxtLink>
        <Button
          v-else
          :label="action.label"
          :icon="action.icon"
          :class="action.class || 'btn-brick'"
          :severity="action.severity"
          :outlined="action.outlined"
          @click="action.onClick"
        />
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
interface ActionButton {
  label: string
  icon?: string
  onClick?: () => void
  to?: string
  class?: string
  severity?: string
  outlined?: boolean
}

interface Props {
  title: string
  subtitle?: string
  actions?: ActionButton[]
}

withDefaults(defineProps<Props>(), {
  subtitle: undefined,
  actions: () => []
})
</script>
