<template>
  <div :class="gridClass">
    <Card v-for="n in count" :key="n" class="overflow-hidden">
      <template #header>
        <Skeleton :width="'100%'" :height="headerHeight" />
      </template>
      <template #content>
        <div class="space-y-3">
          <Skeleton :width="'80%'" height="1.5rem" />
          <Skeleton :width="'60%'" height="1rem" />
          <Skeleton v-if="showFooter" :width="'40%'" height="1rem" />
        </div>
      </template>
      <template v-if="showFooter" #footer>
        <div class="flex justify-between items-center">
          <Skeleton width="5rem" height="2rem" />
          <Skeleton width="3rem" height="1rem" />
        </div>
      </template>
    </Card>
  </div>
</template>

<script setup lang="ts">
interface Props {
  count?: number
  columns?: 1 | 2 | 3 | 4 | 6
  headerHeight?: string
  showFooter?: boolean
  class?: string
}

const props = withDefaults(defineProps<Props>(), {
  count: 8,
  columns: 3,
  headerHeight: '12rem',
  showFooter: false,
  class: ''
})

const gridClass = computed(() => {
  const baseClass = 'grid gap-6'
  const columnClass = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
    6: 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6'
  }

  return `${baseClass} ${columnClass[props.columns]} ${props.class}`
})
</script>
