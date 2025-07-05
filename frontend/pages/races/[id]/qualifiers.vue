<template>
  <div class="container mx-auto px-4 py-8">
    <!-- Breadcrumb Navigation -->
    <Breadcrumb :model="breadcrumbItems" class="mb-6" />

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
            <div
              v-for="racer in filteredCheckedInRacers"
              :key="racer.id"
              class="border rounded-lg p-4 bg-white dark:bg-gray-800 dark:border-gray-600"
            >
              <!-- Racer Header -->
              <div class="flex items-center justify-between mb-4">
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
                    <h3 class="font-semibold text-gray-900 dark:text-white">{{ racer.name }}</h3>
                    <p class="text-sm text-gray-600 dark:text-gray-300">
                      Racer #{{ racer.racer_number }}
                    </p>
                    <p v-if="racer.team_members" class="text-xs text-gray-500 dark:text-gray-400">
                      Team: {{ racer.team_members }}
                    </p>
                  </div>
                </div>
                <div class="text-right">
                  <p class="text-sm text-gray-500 dark:text-gray-400">Best Time</p>
                  <p class="text-lg font-bold text-blue-600 dark:text-blue-400">
                    {{ getBestTime(racer.id) || 'No runs' }}
                  </p>
                </div>
              </div>

              <!-- Add New Qualifying Time and Previous Runs -->
              <div class="flex items-start gap-6">
                <div class="flex items-end gap-3">
                  <div class="w-32">
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
                    @click="addQualifyingTime(racer)"
                  >
                    <i class="pi pi-plus mr-2" />
                    Add Time
                  </Button>
                </div>

                <!-- Previous Runs -->
                <div v-if="getRacerQualifiers(racer.id).length > 0" class="flex-1">
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
            </div>
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
          <!-- Current Standings -->
          <Card>
            <template #title>
              <h3
                class="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2"
              >
                <i class="pi pi-trophy" />
                Current Standings
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
                      <p class="font-medium text-gray-900 dark:text-white">{{ data.racer_name }}</p>
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
              </div>
            </template>
          </Card>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useAuthStore } from '~/stores/auth'
import { useToast } from 'primevue/usetoast'
import { useConfirm } from 'primevue/useconfirm'

const route = useRoute()
const authStore = useAuthStore()
const toast = useToast()
const confirm = useConfirm()
const { $supabase } = useNuxtApp()

// Reactive data
const race = ref(null)
const checkedInRacers = ref([])
const qualifiers = ref([])
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
  const racerBestTimes = {}

  // Calculate best time for each racer
  qualifiers.value.forEach((q) => {
    if (!racerBestTimes[q.racer_id] || q.time < racerBestTimes[q.racer_id].best_time) {
      racerBestTimes[q.racer_id] = {
        racer_id: q.racer_id,
        racer_name: q.racer_name,
        racer_number: q.racer_number,
        best_time: q.time,
        run_count: 0
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

const fastestTime = computed(() => {
  if (leaderboard.value.length === 0) return null
  return formatTime(leaderboard.value[0].best_time)
})

// Helper functions
const clearSearch = () => {
  searchQuery.value = ''
}

const getRacerQualifiers = (racerId) => {
  return qualifiers.value.filter((q) => q.racer_id === racerId).sort((a, b) => a.time - b.time) // Sort by time, fastest first
}

const getBestTime = (racerId) => {
  const racerQualifiers = getRacerQualifiers(racerId)
  if (racerQualifiers.length === 0) return null
  return formatTime(racerQualifiers[0].time)
}

const formatTime = (time) => {
  if (!time) return 'N/A'
  return `${Number.parseFloat(time).toFixed(3)}s`
}

// Fetch race data and checked-in racers
const fetchData = async () => {
  try {
    // Fetch race data
    const { data: raceData, error: raceError } = await $supabase
      .from('races')
      .select('*')
      .eq('id', route.params.id)
      .single()

    if (raceError) throw raceError
    race.value = raceData

    // Fetch checked-in racers for this race
    const { data: checkinsData, error: checkinsError } = await $supabase
      .from('checkins')
      .select(
        `
        *,
        racers(*)
      `
      )
      .eq('race_id', route.params.id)

    if (checkinsError) throw checkinsError

    checkedInRacers.value = (checkinsData || []).map((c) => ({
      ...c.racers,
      checkin_time: c.time
    }))

    // Fetch existing qualifiers for this race
    const { data: qualifiersData, error: qualifiersError } = await $supabase
      .from('qualifiers')
      .select(
        `
        *,
        racers(name, racer_number)
      `
      )
      .eq('race_id', route.params.id)
      .order('created_at', { ascending: false })

    if (qualifiersError) throw qualifiersError

    qualifiers.value = (qualifiersData || []).map((q) => ({
      ...q,
      racer_name: q.racers?.name || `Racer #${q.racers?.racer_number || 'Unknown'}`,
      racer_number: q.racers?.racer_number
    }))
  } catch (err) {
    console.error('Error fetching data:', err)
    error.value = err
  } finally {
    pending.value = false
  }
}

// Add qualifying time
const addQualifyingTime = async (racer) => {
  const time = newTimes.value[racer.id]
  if (!time || time <= 0) return

  processing.value = `add-${racer.id}`

  try {
    const { data: newQualifier, error: insertError } = await $supabase
      .from('qualifiers')
      .insert({
        racer_id: racer.id,
        race_id: route.params.id,
        time: time
      })
      .select(
        `
        *,
        racers(name, racer_number)
      `
      )
      .single()

    if (insertError) throw insertError

    // Add to local state
    const formattedQualifier = {
      ...newQualifier,
      racer_name:
        newQualifier.racers?.name || `Racer #${newQualifier.racers?.racer_number || 'Unknown'}`,
      racer_number: newQualifier.racers?.racer_number
    }

    qualifiers.value = [formattedQualifier, ...qualifiers.value]

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

// Delete qualifying time
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
        const { error: deleteError } = await $supabase
          .from('qualifiers')
          .delete()
          .eq('id', qualifierId)

        if (deleteError) throw deleteError

        // Remove from local state
        qualifiers.value = qualifiers.value.filter((q) => q.id !== qualifierId)

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
