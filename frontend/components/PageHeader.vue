<template>
  <div class="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
    <div>
      <h1 class="text-3xl font-bold text-black mb-2">{{ title }}</h1>
      <p v-if="subtitle" class="text-gray-600">{{ subtitle }}</p>
    </div>

    <div v-if="actions.length > 0" class="flex gap-2 mt-4 md:mt-0">
      <template v-for="action in actions" :key="action.label">
        <Button
          v-if="action.to"
          :class="action.class || 'btn-primary'"
          @click="() => navigateTo(action.to)"
        >
          <i v-if="action.icon" :class="action.icon + ' mr-2'" />
          {{ action.label }}
        </Button>
        <Button v-else :class="action.class || 'btn-primary'" @click="action.onClick">
          <i v-if="action.icon" :class="action.icon + ' mr-2'" />
          {{ action.label }}
        </Button>
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
