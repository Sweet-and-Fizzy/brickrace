<template>
  <div class="min-h-screen bg-white dark:bg-gray-900">
    <div class="container mx-auto px-4 py-8">
      <PageHeader title="All Races" :actions="headerActions" />

      <!-- Loading State -->
      <LoadingGrid
        v-if="racesLoading"
        :count="6"
        :columns="3"
        header-height="12rem"
        show-footer
        variant="race"
      />

      <!-- Races Grid -->
      <div v-else-if="races.length" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card
          v-for="race in races"
          :key="race.id"
          class="hover:shadow-xl hover:shadow-gray-200 dark:hover:shadow-gray-800/50 hover:-translate-y-1 focus:outline-none focus:ring-2 focus:ring-brand-blue focus:ring-offset-2 dark:focus:ring-offset-gray-900 transition-all duration-300 relative overflow-hidden cursor-pointer group"
          :class="{
            'ring-2 ring-brand-green bg-white dark:bg-gray-800 hover:ring-brand-green': race.active,
            'border border-gray-300 dark:border-gray-600 hover:border-brand-blue dark:hover:border-brand-blue':
              !race.active
          }"
          tabindex="0"
          role="button"
          :aria-label="`View details for ${race.name} race on ${race.race_datetime ? new Date(race.race_datetime).toLocaleDateString() : 'TBD'}`"
          @click="navigateToRace(race, $event)"
          @keydown.enter="navigateToRace(race, $event)"
          @keydown.space.prevent="navigateToRace(race, $event)"
        >
          <template #header>
            <div class="relative">
              <Image
                v-if="race.image_url"
                :src="race.image_url"
                :alt="race.name"
                image-class="w-full h-48 object-cover rounded-t-lg group-hover:scale-105 transition-transform duration-300"
                class="w-full h-48 overflow-hidden rounded-t-lg"
              />
              <div
                v-else
                class="w-full h-48 bg-gray-200 dark:bg-gray-700 flex items-center justify-center rounded-t-lg"
              >
                <i class="pi pi-flag text-4xl text-gray-400 dark:text-gray-500" />
              </div>

              <!-- Active Badge -->
              <div
                v-if="race.active"
                class="absolute top-2 left-2 bg-brand-green text-white px-2 py-1 rounded text-sm font-semibold z-20"
              >
                <i class="pi pi-check-circle mr-1" />
                ACTIVE
              </div>
            </div>
          </template>

          <template #title>
            <div class="px-4 pt-4">
              <h3
                class="text-xl font-bold text-gray-900 dark:text-white group-hover:text-brand-blue dark:group-hover:text-brand-blue transition-colors duration-300"
              >
                {{ race.name }}
              </h3>
            </div>
          </template>

          <template #subtitle>
            <div class="px-4 pb-2">
              <div class="text-gray-700 dark:text-gray-300 font-medium">
                {{ formatRaceDateTime(race) }}
              </div>
            </div>
          </template>

          <template #footer>
            <div class="px-4 pb-4 space-y-3">
              <div class="flex justify-between items-center">
                <div class="flex gap-2">
                  <Badge :value="`${race.checkinCount || 0} racers`" severity="info" />
                  <Badge v-if="!race.active" value="Historical" severity="secondary" />
                </div>
                <div class="text-right">
                  <i
                    class="pi pi-arrow-right text-gray-400 dark:text-gray-500 group-hover:text-brand-blue group-hover:translate-x-1 transition-all duration-300"
                  />
                </div>
              </div>

            </div>
          </template>
        </Card>
      </div>

      <!-- No Races State -->
      <div v-else class="text-center py-12">
        <i class="pi pi-flag text-6xl text-gray-300 dark:text-gray-600 mb-4" />
        <h3 class="text-xl font-semibold text-gray-600 dark:text-gray-400 mb-2">No races yet</h3>
        <p class="text-gray-500 dark:text-gray-500 mb-6">
          Check back soon for upcoming racing events!
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useAuthStore } from '~/stores/auth'

const authStore = useAuthStore()

// Use the singleton races composable for cached data
const {
  races,
  loading: racesLoading,
  initialize: initializeRaces,
  setActiveRace: setActiveRaceComposable,
  formatRaceDateTime
} = useRaces()

// Use the composable's loading state instead of managing our own
// const pending = ref(true) - removed

// Header actions
const headerActions = computed(() => {
  if (authStore.isRaceAdmin) {
    return [
      {
        label: 'Add Race',
        icon: 'pi pi-plus',
        to: '/races/add',
        class: 'btn-primary'
      }
    ]
  }
  return []
})

// Races data is now handled by the useRaces composable

// Navigate to race (with event check to avoid conflicts with admin button)
const navigateToRace = (race, event) => {
  // Don't navigate if clicking on admin controls area
  if (event.target.closest('.z-20')) {
    return
  }
  // Use slug if available, fallback to ID
  const route = race.slug || race.id
  navigateTo(`/races/${route}`)
}



// Initialize auth and data - let composable handle everything
onMounted(async () => {
  await authStore.initAuth()

  // Let the composable decide whether to fetch or use cached data
  // The composable's initialize function has proper guards
  await initializeRaces()
})

useHead({
  title: 'All Races - The Great Holyoke Brick Race',
  meta: [
    {
      name: 'description',
      content: 'Browse all brick car racing events in the The Great Holyoke Brick Race.'
    }
  ]
})
</script>

<style scoped>
/* Dark mode skeleton styling for PrimeVue */
.skeleton-dark :deep(.p-skeleton) {
  background-color: #e5e7eb; /* gray-200 */
}

:global(.app-dark) .skeleton-dark :deep(.p-skeleton) {
  background-color: #374151; /* gray-700 */
}

.skeleton-dark :deep(.p-skeleton::after) {
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.4), transparent);
}

:global(.app-dark) .skeleton-dark :deep(.p-skeleton::after) {
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent);
}
</style>
