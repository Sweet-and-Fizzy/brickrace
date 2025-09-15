<template>
  <div :class="gridClass">
    <Card
      v-for="n in count"
      :key="n"
      class="group border-2 border-gray-100 rounded-2xl overflow-hidden bg-white h-full relative"
      style="box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05)"
    >
      <template #header>
        <div class="relative overflow-hidden">
          <Skeleton :width="'100%'" :height="headerHeight" />
          <!-- Conditional badges based on variant -->
          <div v-if="variant === 'racer'" class="absolute top-3 right-3">
            <!-- Racer number badge -->
            <Skeleton width="2rem" height="1.5rem" />
          </div>
          <div v-else-if="variant === 'race'" class="absolute top-2 left-2">
            <!-- Active race badge -->
            <Skeleton width="4rem" height="1.5rem" />
          </div>
        </div>
      </template>
      <template v-if="variant === 'race'" #title>
        <div class="px-4 pt-4">
          <Skeleton :width="'80%'" height="1.5rem" />
        </div>
      </template>

      <template v-if="variant === 'race'" #subtitle>
        <div class="px-4 pb-2">
          <Skeleton :width="'60%'" height="1rem" />
        </div>
      </template>

      <template v-if="variant === 'race'" #footer>
        <div class="px-4 pb-4 space-y-3">
          <div class="flex justify-between items-center">
            <div class="flex gap-2">
              <Skeleton width="4rem" height="1.5rem" />
              <Skeleton v-if="showFooter" width="5rem" height="1.5rem" />
            </div>
            <Skeleton width="1rem" height="1rem" />
          </div>
        </div>
      </template>

      <template v-if="variant === 'racer'" #content>
        <div>
          <!-- Racer Name Skeleton -->
          <div>
            <Skeleton :width="'70%'" height="1.5rem" class="mb-2" />
          </div>

          <!-- Times and Awards Section -->
          <div class="mt-3 space-y-2">
            <!-- Times Badge Skeleton -->
            <div class="flex gap-2 flex-wrap">
              <Skeleton width="6rem" height="1rem" />
            </div>

            <!-- Awards Badges Skeleton -->
            <div class="flex gap-2 flex-wrap">
              <Skeleton width="4rem" height="1rem" />
              <Skeleton v-if="showFooter" width="5rem" height="1rem" />
            </div>

            <!-- Vote Counts Skeleton -->
            <div v-if="showFooter" class="flex gap-2 flex-wrap">
              <Skeleton width="3rem" height="1rem" />
              <Skeleton width="4rem" height="1rem" />
            </div>
          </div>
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
  variant?: 'racer' | 'race'
}

const props = withDefaults(defineProps<Props>(), {
  count: 8,
  columns: 3,
  headerHeight: '12rem',
  showFooter: false,
  class: '',
  variant: 'racer'
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
