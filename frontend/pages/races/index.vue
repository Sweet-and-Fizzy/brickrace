<template>
  <div class="container mx-auto px-4 py-8">
    <div class="flex justify-between items-center mb-8">
      <h1 class="text-3xl font-bold text-gray-900 dark:text-white">All Races</h1>
      <NuxtLink v-if="authStore.isRaceAdmin" to="/races/add">
        <Button severity="primary">
          <i class="pi pi-plus mr-2" />
          Add Race
        </Button>
      </NuxtLink>
    </div>

    <!-- Loading State -->
    <div v-if="pending" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <Card v-for="n in 6" :key="n" class="overflow-hidden skeleton-dark">
        <template #header>
          <Skeleton width="100%" height="12rem" />
        </template>
        <template #title>
          <Skeleton width="80%" height="1.5rem" class="mb-2" />
        </template>
        <template #subtitle>
          <Skeleton width="60%" height="1rem" class="mb-4" />
        </template>
        <template #content>
          <div class="space-y-2">
            <Skeleton width="100%" height="1rem" />
            <Skeleton width="70%" height="1rem" />
          </div>
        </template>
        <template #footer>
          <Skeleton width="40%" height="2.5rem" />
        </template>
      </Card>
    </div>

    <!-- Races Grid -->
    <div v-else-if="races.length" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <Card
        v-for="race in races"
        :key="race.id"
        class="hover:shadow-xl hover:shadow-gray-200 dark:hover:shadow-gray-800/50 hover:-translate-y-1 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900 transition-all duration-300 relative overflow-hidden cursor-pointer group"
        :class="{
          'ring-2 ring-green-500 bg-green-50 dark:bg-green-900/20 hover:ring-green-600':
            race.active,
          'border border-gray-300 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-500':
            !race.active
        }"
        tabindex="0"
        role="button"
        :aria-label="`View details for ${race.name} race on ${new Date(race.date).toLocaleDateString()}`"
        @click="navigateToRace(race.id, $event)"
        @keydown.enter="navigateToRace(race.id, $event)"
        @keydown.space.prevent="navigateToRace(race.id, $event)"
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
              class="absolute top-2 left-2 bg-green-600 text-white px-2 py-1 rounded text-sm font-semibold z-20"
            >
              <i class="pi pi-check-circle mr-1" />
              ACTIVE
            </div>
          </div>
        </template>

        <template #title>
          <div class="px-4 pt-4">
            <h3
              class="text-xl font-bold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-300"
            >
              {{ race.name }}
            </h3>
          </div>
        </template>

        <template #subtitle>
          <div class="px-4 pb-2">
            <div class="text-gray-700 dark:text-gray-300 font-medium">
              {{
                new Date(race.date).toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })
              }}
            </div>
          </div>
        </template>

        <template #footer>
          <div class="px-4 pb-4 space-y-3">
            <div class="flex justify-between items-center">
              <div class="flex gap-2">
                <Badge :value="`${race.checkin_count || 0} racers`" severity="info" />
                <Badge v-if="!race.active" value="Historical" severity="secondary" />
              </div>
              <div class="text-right">
                <i
                  class="pi pi-arrow-right text-gray-400 dark:text-gray-500 group-hover:text-blue-500 group-hover:translate-x-1 transition-all duration-300"
                />
              </div>
            </div>

            <!-- Admin Controls -->
            <div
              v-if="authStore.isRaceAdmin && !race.active"
              class="pt-2 border-t border-gray-200 dark:border-gray-700"
            >
              <Button
                :loading="settingActive === race.id"
                severity="success"
                outlined
                size="small"
                class="relative z-20 w-full"
                @click.stop="setActiveRace(race.id)"
              >
                <i class="pi pi-play mr-1" />
                Set as Active
              </Button>
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
</template>

<script setup>
import { useAuthStore } from '~/stores/auth'

const authStore = useAuthStore()
const { $supabase } = useNuxtApp()

const races = ref([])
const pending = ref(true)
const settingActive = ref(null)

// Fetch races from Supabase
const fetchRaces = async () => {
  try {
    const { data, error } = await $supabase
      .from('races')
      .select(
        `
        *,
        checkins(count)
      `
      )
      .order('active', { ascending: false })
      .order('date', { ascending: false })

    if (error) throw error

    // Transform data to include checkin count
    races.value = (data || []).map((race) => ({
      ...race,
      checkin_count: race.checkins?.[0]?.count || 0
    }))
  } catch (error) {
    console.error('Error fetching races:', error)
    races.value = []
  } finally {
    pending.value = false
  }
}

// Navigate to race (with event check to avoid conflicts with admin button)
const navigateToRace = (raceId, event) => {
  // Don't navigate if clicking on admin controls area
  if (event.target.closest('.z-20')) {
    return
  }
  navigateTo(`/races/${raceId}`)
}

// Set active race
const setActiveRace = async (raceId) => {
  settingActive.value = raceId

  try {
    const { error } = await $supabase.from('races').update({ active: true }).eq('id', raceId)

    if (error) throw error

    // Refresh races to show updated active status
    await fetchRaces()
  } catch (error) {
    console.error('Error setting active race:', error)
  } finally {
    settingActive.value = null
  }
}

// Initialize auth and fetch data
onMounted(async () => {
  await authStore.initAuth()
  await fetchRaces()
})

useHead({
  title: 'All Races - Brick Race Championship',
  meta: [
    {
      name: 'description',
      content: 'Browse all LEGO car racing events in the Brick Race Championship.'
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
