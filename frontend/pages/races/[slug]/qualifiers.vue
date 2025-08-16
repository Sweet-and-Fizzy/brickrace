<template>
  <div class="min-h-screen bg-white dark:bg-gray-900">
    <div class="container mx-auto px-4 py-8">
      <!-- Breadcrumb Navigation -->
      <BreadcrumbWrapper :items="breadcrumbItems" />

      <!-- Loading State -->
      <div v-if="pending" class="flex justify-center py-12">
        <ProgressSpinner />
      </div>

      <!-- Error State -->
      <div v-else-if="error" class="text-center py-12">
        <i class="pi pi-exclamation-triangle text-6xl text-red-400 mb-4" />
        <h2 class="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-2">Race Not Found</h2>
        <p class="text-gray-600 dark:text-gray-300 mb-6">
          The race you're looking for doesn't exist or has been removed.
        </p>
        <NuxtLink to="/races">
          <Button label="Back to All Races" icon="pi pi-arrow-left" severity="primary" />
        </NuxtLink>
      </div>

      <!-- Access Denied -->
      <div v-else-if="!authStore.isRaceAdmin" class="text-center py-12">
        <i class="pi pi-ban text-6xl text-red-400 mb-4" />
        <h2 class="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-2">Access Denied</h2>
        <p class="text-gray-600 dark:text-gray-300 mb-6">
          You need race admin privileges to manage qualifying times.
        </p>
        <NuxtLink to="/races">
          <Button label="Back to All Races" icon="pi pi-arrow-left" severity="primary" />
        </NuxtLink>
      </div>

      <!-- Qualifiers Interface -->
      <div v-else-if="race">
        <!-- Header -->
        <div class="mb-8">
          <div class="flex flex-col md:flex-row md:items-start md:justify-between">
            <div>
              <h1 class="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                Qualifiers: {{ race.name }}
              </h1>
              <div class="flex items-center gap-4 text-gray-600 dark:text-gray-300">
                <span>{{
                  new Date(race.date).toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })
                }}</span>
                <span class="font-semibold text-blue-600 dark:text-blue-400"
                  >{{ qualifiers.length }} qualifying runs</span
                >
              </div>
            </div>
            <div class="mt-4 md:mt-0">
              <AdminMenu :race-id="raceId" />
            </div>
          </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <!-- Main Content - Racer List -->
          <div class="lg:col-span-2 space-y-6">
            <!-- Search Bar -->
            <Card>
              <template #content>
                <div class="flex flex-col md:flex-row gap-4">
                  <div class="flex-1">
                    <label
                      for="search"
                      class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                    >
                      Search Racers
                    </label>
                    <InputText
                      id="search"
                      v-model="searchQuery"
                      placeholder="Search by name or racer number..."
                      class="w-full"
                    />
                  </div>
                  <div class="flex items-end">
                    <Button severity="secondary" outlined label="Clear" @click="clearSearch" />
                  </div>
                </div>
              </template>
            </Card>

            <!-- Racers List -->
            <div class="space-y-4">
              <Card v-for="racer in filteredCheckedInRacers" :key="racer.id">
                <template #content>
                  <!-- Racer Header -->
                  <div
                    class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4"
                  >
                    <div class="flex items-center gap-3">
                      <Image
                        v-if="racer.image_url"
                        :src="racer.image_url"
                        :alt="racer.name"
                        image-class="w-12 h-12 object-cover rounded-full border-2 border-gray-300"
                        class="w-12 h-12"
                        preview
                      />
                      <div
                        v-else
                        class="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-full border-2 border-gray-300 dark:border-gray-600 flex items-center justify-center"
                      >
                        <i class="pi pi-car text-gray-500 dark:text-gray-400" />
                      </div>
                      <div>
                        <h3 class="font-semibold text-gray-900 dark:text-white">
                          {{ racer.name }}
                        </h3>
                        <p class="text-sm text-gray-600 dark:text-gray-300">
                          Racer #{{ racer.racer_number }}
                        </p>
                        <p
                          v-if="racer.team_members"
                          class="text-xs text-gray-500 dark:text-gray-400"
                        >
                          Team: {{ racer.team_members }}
                        </p>
                      </div>
                    </div>
                    <div class="text-left sm:text-right space-y-2">
                      <div>
                        <p class="text-sm text-gray-500 dark:text-gray-400">Fastest Time</p>
                        <p class="text-lg font-bold text-green-600 dark:text-green-400">
                          {{ getBestTime(racer.id) || 'No runs' }}
                        </p>
                      </div>
                      <div>
                        <p class="text-sm text-gray-500 dark:text-gray-400">Slowest Time</p>
                        <p class="text-lg font-bold text-red-600 dark:text-red-400">
                          {{ getWorstTime(racer.id) || 'No runs' }}
                        </p>
                      </div>
                    </div>
                  </div>

                  <!-- Add New Qualifying Time and Previous Runs -->
                  <div class="space-y-4">
                    <!-- Add Time Section -->
                    <div class="flex flex-col sm:flex-row sm:items-end gap-3">
                      <div class="flex-shrink-0 sm:w-32">
                        <label
                          :for="`time-${racer.id}`"
                          class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                        >
                          Time (sec)
                        </label>
                        <InputNumber
                          :id="`time-${racer.id}`"
                          v-model="newTimes[racer.id]"
                          mode="decimal"
                          :min-fraction-digits="0"
                          :max-fraction-digits="3"
                          :min="0"
                          :step="0.001"
                          placeholder="0.000"
                          class="w-full"
                          :input-style="{
                            borderRadius: '0.375rem',
                            padding: '0.5rem 0.75rem',
                            width: '100%',
                            maxWidth: '100%',
                            boxSizing: 'border-box'
                          }"
                        />
                      </div>
                      <Button
                        :disabled="!newTimes[racer.id] || processing === `add-${racer.id}`"
                        :loading="processing === `add-${racer.id}`"
                        severity="info"
                        class="w-full sm:w-auto"
                        @click="addQualifyingTime(racer)"
                      >
                        <i class="pi pi-plus mr-2" />
                        Add Time
                      </Button>
                    </div>

                    <!-- Previous Runs -->
                    <div v-if="getRacerQualifiers(racer.id).length > 0" class="w-full">
                      <h4 class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Previous Runs:
                      </h4>
                      <div class="flex flex-wrap gap-2">
                        <div
                          v-for="qualifier in getRacerQualifiers(racer.id)"
                          :key="qualifier.id"
                          class="flex items-center gap-2 px-3 py-1 bg-blue-100 dark:bg-blue-900/30 border border-blue-300 dark:border-blue-700 rounded-full text-sm text-blue-800 dark:text-blue-200"
                        >
                          <span class="font-medium">{{ formatTime(qualifier.time) }}</span>
                          <Button
                            v-tooltip.top="'Delete qualifying time'"
                            :disabled="processing === qualifier.id"
                            severity="danger"
                            text
                            rounded
                            size="small"
                            icon="pi pi-times"
                            @click="deleteQualifier(qualifier.id, racer.name)"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </template>
              </Card>
            </div>

            <!-- No Racers Found -->
            <div v-if="filteredCheckedInRacers.length === 0" class="text-center py-12">
              <i class="pi pi-search text-6xl text-gray-300 dark:text-gray-600 mb-4" />
              <h3 class="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-2">
                No Racers Found
              </h3>
              <p class="text-gray-600 dark:text-gray-300">
                {{
                  searchQuery
                    ? 'Try adjusting your search terms.'
                    : 'No checked-in racers available for qualifying.'
                }}
              </p>
              <NuxtLink :to="`/races/${race.id}/checkin`" class="inline-block mt-4">
                <Button severity="success">
                  <i class="pi pi-arrow-right mr-2" />
                  Go to Check-in
                </Button>
              </NuxtLink>
            </div>
          </div>

          <!-- Sidebar - Leaderboard -->
          <div class="space-y-6">
            <!-- Fastest Times Standings -->
            <Card>
              <template #title>
                <h3
                  class="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2"
                >
                  <i class="pi pi-trophy text-green-600" />
                  Fastest Times
                </h3>
              </template>
              <template #content>
                <DataTable
                  v-if="leaderboard.length > 0"
                  :value="leaderboard"
                  class="p-datatable-sm"
                  :pt="{
                    table: { style: 'min-width: 100%' },
                    header: { class: 'border-none p-0' }
                  }"
                >
                  <template #empty>
                    <div class="text-center py-6 text-gray-500 dark:text-gray-400">
                      <i class="pi pi-clock text-3xl mb-2" />
                      <p>No qualifying times yet</p>
                    </div>
                  </template>

                  <Column header="Pos" class="w-16">
                    <template #body="{ index }">
                      <div
                        class="flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm"
                        :class="{
                          'bg-yellow-400 text-yellow-900': index === 0,
                          'bg-gray-400 text-gray-900': index === 1,
                          'bg-orange-400 text-orange-900': index === 2,
                          'bg-gray-200 text-gray-700 dark:bg-gray-600 dark:text-gray-200': index > 2
                        }"
                      >
                        {{ index + 1 }}
                      </div>
                    </template>
                  </Column>

                  <Column header="Racer">
                    <template #body="{ data }">
                      <div>
                        <p class="font-medium text-gray-900 dark:text-white">
                          {{ data.racer_name }}
                        </p>
                        <p class="text-sm text-gray-600 dark:text-gray-300">
                          #{{ data.racer_number }}
                        </p>
                      </div>
                    </template>
                  </Column>

                  <Column header="Time" class="text-right">
                    <template #body="{ data }">
                      <div class="text-right">
                        <p class="font-bold text-blue-600 dark:text-blue-400">
                          {{ formatTime(data.best_time) }}
                        </p>
                        <p class="text-xs text-gray-500 dark:text-gray-400">
                          {{ data.run_count }} runs
                        </p>
                      </div>
                    </template>
                  </Column>
                </DataTable>

                <div v-else class="text-center py-6 text-gray-500 dark:text-gray-400">
                  <i class="pi pi-clock text-3xl mb-2" />
                  <p>No qualifying times yet</p>
                </div>
              </template>
            </Card>

            <!-- Slowest Times Standings -->
            <Card>
              <template #title>
                <h3
                  class="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2"
                >
                  <i class="pi pi-trophy text-red-600" />
                  Slowest Times
                </h3>
              </template>
              <template #content>
                <DataTable
                  v-if="slowestLeaderboard.length > 0"
                  :value="slowestLeaderboard"
                  class="p-datatable-sm"
                  :pt="{
                    table: { style: 'min-width: 100%' },
                    header: { class: 'border-none p-0' }
                  }"
                >
                  <template #empty>
                    <div class="text-center py-6 text-gray-500 dark:text-gray-400">
                      <i class="pi pi-clock text-3xl mb-2" />
                      <p>No qualifying times yet</p>
                    </div>
                  </template>

                  <Column header="Pos" class="w-16">
                    <template #body="{ index }">
                      <div
                        class="flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm"
                        :class="{
                          'bg-yellow-400 text-yellow-900': index === 0,
                          'bg-gray-400 text-gray-900': index === 1,
                          'bg-orange-400 text-orange-900': index === 2,
                          'bg-gray-200 text-gray-700 dark:bg-gray-600 dark:text-gray-200': index > 2
                        }"
                      >
                        {{ index + 1 }}
                      </div>
                    </template>
                  </Column>

                  <Column header="Racer">
                    <template #body="{ data }">
                      <div>
                        <p class="font-medium text-gray-900 dark:text-white">
                          {{ data.racer_name }}
                        </p>
                        <p class="text-sm text-gray-600 dark:text-gray-300">
                          #{{ data.racer_number }}
                        </p>
                      </div>
                    </template>
                  </Column>

                  <Column header="Time" class="text-right">
                    <template #body="{ data }">
                      <div class="text-right">
                        <p class="font-bold text-red-600 dark:text-red-400">
                          {{ formatTime(data.slowest_time) }}
                        </p>
                        <p class="text-xs text-gray-500 dark:text-gray-400">
                          {{ data.run_count }} runs
                        </p>
                      </div>
                    </template>
                  </Column>
                </DataTable>

                <div v-else class="text-center py-6 text-gray-500 dark:text-gray-400">
                  <i class="pi pi-clock text-3xl mb-2" />
                  <p>No qualifying times yet</p>
                </div>
              </template>
            </Card>

            <!-- Quick Stats -->
            <Card>
              <template #title>Race Stats</template>
              <template #content>
                <div class="space-y-4">
                  <div class="flex justify-between">
                    <span class="text-gray-600 dark:text-gray-300">Checked In</span>
                    <span class="font-semibold text-gray-900 dark:text-white">{{
                      checkedInRacers.length
                    }}</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-gray-600 dark:text-gray-300">Qualified</span>
                    <span class="font-semibold text-gray-900 dark:text-white">{{
                      leaderboard.length
                    }}</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-gray-600 dark:text-gray-300">Total Runs</span>
                    <span class="font-semibold text-gray-900 dark:text-white">{{
                      qualifiers.length
                    }}</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-gray-600 dark:text-gray-300">Fastest Time</span>
                    <span class="font-semibold text-gray-900 dark:text-white">{{
                      fastestTime || 'N/A'
                    }}</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-gray-600 dark:text-gray-300">Slowest Time</span>
                    <span class="font-semibold text-gray-900 dark:text-white">{{
                      slowestTime || 'N/A'
                    }}</span>
                  </div>
                </div>
              </template>
            </Card>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useAuthStore } from '~/stores/auth'
import { useToast } from 'primevue/usetoast'
import { useConfirm } from 'primevue/useconfirm'
import { isUUID } from '~/utils/slug-helpers'

const route = useRoute()
const authStore = useAuthStore()
const toast = useToast()
const confirm = useConfirm()

// Use composables
const {
  getRaceById,
  getRaceBySlug,
  fetchRaceById,
  fetchRaceBySlug,
  initialize: initializeRaces
} = useRaces()

const { getCheckinsForRace, racers: allRacers, initialize: initializeCheckins } = useCheckins()

// Qualifiers composable - will be initialized after race loads
const qualifiersComposable = ref(null)
const qualifiers = computed(() => {
  if (!qualifiersComposable.value) return []
  return unref(qualifiersComposable.value.qualifiers) || []
})
const formatTime = (time) => qualifiersComposable.value?.formatTime(time) || 'N/A'
const getQualifiersByRacerComposable = (racerId) =>
  qualifiersComposable.value?.getQualifiersByRacer(racerId) || []
const getBestTimeForRacer = (racerId) =>
  qualifiersComposable.value?.getBestTimeForRacer(racerId) || null
const addQualifier = (data) => qualifiersComposable.value?.addQualifier(data)
const deleteQualifierComposable = (id) => qualifiersComposable.value?.deleteQualifier(id)

// Reactive data
const race = ref(null)
const raceId = ref(null)
const checkedInRacers = ref([])
const pending = ref(true)
const error = ref(null)
const processing = ref(null)
const searchQuery = ref('')
const newTimes = ref({})

// Breadcrumb navigation
const breadcrumbItems = computed(() => [
  { label: 'Home', url: '/' },
  { label: 'Races', url: '/races' },
  { label: race.value?.name || 'Race', url: `/races/${route.params.id}` },
  { label: 'Qualifiers' } // Current page, no navigation
])

// Computed properties
const filteredCheckedInRacers = computed(() => {
  if (!searchQuery.value) return checkedInRacers.value

  const query = searchQuery.value.toLowerCase()
  return checkedInRacers.value.filter(
    (racer) =>
      racer.name.toLowerCase().includes(query) ||
      racer.racer_number.toString().includes(query) ||
      (racer.team_members && racer.team_members.toLowerCase().includes(query))
  )
})

const leaderboard = computed(() => {
  if (!qualifiersComposable.value || !qualifiers.value.length) return []

  const racerBestTimes = {}

  // Calculate best time for each racer
  qualifiers.value.forEach((q) => {
    if (q.time && q.time > 0) {
      // Only consider valid times
      if (!racerBestTimes[q.racer_id] || q.time < racerBestTimes[q.racer_id].best_time) {
        racerBestTimes[q.racer_id] = {
          racer_id: q.racer_id,
          racer_name: q.racer_name,
          racer_number: q.racer_number,
          best_time: q.time,
          run_count: 0
        }
      }
    }
  })

  // Count runs for each racer
  qualifiers.value.forEach((q) => {
    if (racerBestTimes[q.racer_id]) {
      racerBestTimes[q.racer_id].run_count++
    }
  })

  return Object.values(racerBestTimes)
    .sort((a, b) => a.best_time - b.best_time)
    .slice(0, 10) // Top 10
})

const slowestLeaderboard = computed(() => {
  if (!qualifiersComposable.value || !qualifiers.value.length) return []

  const racerSlowestTimes = {}

  // Calculate slowest time for each racer
  qualifiers.value.forEach((q) => {
    if (q.time && q.time > 0) {
      // Only consider valid times
      if (!racerSlowestTimes[q.racer_id] || q.time > racerSlowestTimes[q.racer_id].slowest_time) {
        racerSlowestTimes[q.racer_id] = {
          racer_id: q.racer_id,
          racer_name: q.racer_name,
          racer_number: q.racer_number,
          slowest_time: q.time,
          run_count: 0
        }
      }
    }
  })

  // Count runs for each racer
  qualifiers.value.forEach((q) => {
    if (racerSlowestTimes[q.racer_id] && q.time && q.time > 0) {
      racerSlowestTimes[q.racer_id].run_count++
    }
  })

  return Object.values(racerSlowestTimes)
    .sort((a, b) => b.slowest_time - a.slowest_time) // Sort by slowest time, slowest first
    .slice(0, 10) // Top 10
})

const fastestTime = computed(() => {
  if (leaderboard.value.length === 0) return null
  return qualifiersComposable.value?.formatTime(leaderboard.value[0].best_time) || 'N/A'
})

const slowestTime = computed(() => {
  if (leaderboard.value.length === 0) return null
  const slowest = leaderboard.value[leaderboard.value.length - 1]
  return qualifiersComposable.value?.formatTime(slowest.best_time) || 'N/A'
})

// Helper functions
const clearSearch = () => {
  searchQuery.value = ''
}

const getRacerQualifiers = (racerId) => {
  if (!qualifiersComposable.value) return []
  return qualifiersComposable.value.getQualifiersByRacer(racerId).sort((a, b) => a.time - b.time) // Sort by time, fastest first
}

const getBestTime = (racerId) => {
  if (!qualifiersComposable.value) return null
  const bestTime = qualifiersComposable.value.getBestTimeForRacer(racerId)
  if (!bestTime) return null
  return qualifiersComposable.value.formatTime(bestTime)
}

const getWorstTime = (racerId) => {
  if (!qualifiersComposable.value) return null
  const racerQualifiers = qualifiersComposable.value.getQualifiersByRacer(racerId)
  if (!racerQualifiers.length) return null

  const validTimes = racerQualifiers.filter((q) => q.time && q.time > 0).map((q) => q.time)
  if (!validTimes.length) return null

  const worstTime = Math.max(...validTimes)
  return qualifiersComposable.value.formatTime(worstTime)
}

// Fetch race data and checked-in racers using composables
const fetchData = async () => {
  try {
    // Initialize all composables
    await initializeRaces()
    await initializeCheckins()
    // Initialize qualifiers composable
    if (qualifiersComposable.value) {
      await qualifiersComposable.value.initialize()
    }

    // Get race data from cached composable
    const param = route.params.slug || route.params.id
    let raceData = null

    // Check if it's a UUID (legacy support)
    if (isUUID(param)) {
      raceData = getRaceById(param)
      if (!raceData) {
        raceData = await fetchRaceById(param)
      }
    } else {
      raceData = getRaceBySlug(param)
      if (!raceData) {
        raceData = await fetchRaceBySlug(param)
      }
    }
    if (!raceData) {
      throw new Error('Race not found')
    }
    race.value = raceData
    raceId.value = raceData.id

    // Initialize qualifiers composable with the race ID
    qualifiersComposable.value = useQualifiers(raceData.id)

    // Get checked-in racers from composable and combine with racer data
    const raceCheckins = getCheckinsForRace(raceData.id)
    checkedInRacers.value = raceCheckins.map((checkin) => {
      const racer = allRacers.value.find((r) => r.id === checkin.racer_id)
      return {
        ...checkin,
        id: racer?.id || checkin.racer_id,
        name: racer?.name || `Racer #${racer?.racer_number || 'Unknown'}`,
        racer_number: racer?.racer_number,
        image_url: racer?.image_url,
        user_id: racer?.user_id
      }
    })

    // Qualifiers are already managed by the useQualifiers composable
    // No need to manually fetch them
  } catch (err) {
    console.error('Error fetching data:', err)
    error.value = err
  } finally {
    pending.value = false
  }
}

// Add qualifying time using composable
const addQualifyingTime = async (racer) => {
  const time = newTimes.value[racer.id]
  if (!time || time <= 0) return

  processing.value = `add-${racer.id}`

  try {
    await addQualifier({
      racer_id: racer.id,
      race_id: raceId.value,
      time: time
    })

    // Clear the input
    newTimes.value[racer.id] = null

    toast.add({
      severity: 'success',
      summary: 'Time Added',
      detail: `${formatTime(time)} recorded for ${racer.name}`,
      life: 3000
    })
  } catch (err) {
    console.error('Error adding qualifying time:', err)
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: err.message || 'Failed to add qualifying time',
      life: 5000
    })
  } finally {
    processing.value = null
  }
}

// Delete qualifying time using composable
const deleteQualifier = async (qualifierId, racerName) => {
  confirm.require({
    message: `Are you sure you want to delete this qualifying time for ${racerName}?`,
    header: 'Delete Qualifying Time',
    icon: 'pi pi-exclamation-triangle',
    rejectClass: 'p-button-secondary p-button-outlined',
    rejectLabel: 'Cancel',
    acceptLabel: 'Delete',
    accept: async () => {
      processing.value = qualifierId

      try {
        await deleteQualifierComposable(qualifierId)

        toast.add({
          severity: 'info',
          summary: 'Time Deleted',
          detail: `Qualifying time removed for ${racerName}`,
          life: 3000
        })
      } catch (err) {
        console.error('Error deleting qualifier:', err)
        toast.add({
          severity: 'error',
          summary: 'Error',
          detail: err.message || 'Failed to delete qualifying time',
          life: 5000
        })
      } finally {
        processing.value = null
      }
    }
  })
}

// Initialize
onMounted(async () => {
  await authStore.initAuth()
  await fetchData()
})

// Page head
useHead({
  title: computed(() =>
    race.value
      ? `Qualifiers: ${race.value.name} - The Great Holyoke Brick Race`
      : 'Qualifiers - The Great Holyoke Brick Race'
  )
})
</script>
