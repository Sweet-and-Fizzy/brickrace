<template>
  <Breadcrumb
    :model="breadcrumbItems"
    :class="containerClass"
    :pt="{
      root: {
        class: '!bg-transparent !border-none !shadow-none'
      }
    }"
  >
    <template #item="{ item, props: itemProps }">
      <NuxtLink v-if="item.route" v-slot="{ href, navigate }" :to="item.route" custom>
        <a :href="href" v-bind="itemProps.action" @click="navigate">
          <span class="text-gray-600">{{ item.label }}</span>
        </a>
      </NuxtLink>
      <span v-else class="text-black">{{ item.label }}</span>
    </template>
  </Breadcrumb>
</template>

<script setup lang="ts">
interface BreadcrumbItem {
  label: string
  url?: string
}

interface Props {
  items: BreadcrumbItem[]
  class?: string
}

const props = withDefaults(defineProps<Props>(), {
  class: 'mb-6'
})

const containerClass = computed(() => props.class)

// Convert url-based items to route-based items for proper NuxtLink navigation
const breadcrumbItems = computed(() =>
  props.items.map((item) => ({
    label: item.label,
    route: item.url || undefined
  }))
)
</script>
