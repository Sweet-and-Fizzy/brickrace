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
        <Button severity="primary"> Back to All Races </Button>
      </NuxtLink>
    </div>

    <!-- Access Denied -->
    <div v-else-if="!authStore.isRaceAdmin" class="text-center py-12">
      <i class="pi pi-ban text-6xl text-red-400 mb-4" />
      <h2 class="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-2">Access Denied</h2>
      <p class="text-gray-600 dark:text-gray-300 mb-6">
        You need race admin privileges to access the check-in system.
      </p>
      <NuxtLink to="/races">
        <Button severity="primary"> Back to All Races </Button>
      </NuxtLink>
    </div>

    <!-- Check-in Interface -->
    <div v-else-if="race">
      <!-- Header -->
      <div class="mb-8">
        <h1 class="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Check-in: {{ race.name }}
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
          <span class="font-semibold text-green-600 dark:text-green-400"
            >{{ checkedInRacers.length }} checked in</span
          >
        </div>
      </div>

      <!-- Search Bar -->
      <Card class="mb-6">
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
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div
          v-for="racer in filteredRacers"
          :key="racer.id"
          class="border rounded-lg p-4 transition-all duration-200"
          :class="{
            'bg-green-50 border-green-200 dark:bg-green-900/30 dark:border-green-700': isCheckedIn(
              racer.id
            ),
            'bg-white border-gray-200 hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-600 dark:hover:bg-gray-700':
              !isCheckedIn(racer.id)
          }"
        >
          <!-- Racer Info -->
          <div class="flex items-center justify-between mb-3">
            <div>
              <h3 class="font-semibold text-gray-900 dark:text-white">{{ racer.name }}</h3>
              <p class="text-sm text-gray-600 dark:text-gray-300">
                Racer #{{ racer.racer_number }}
              </p>
              <p v-if="racer.team_members" class="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Team: {{ racer.team_members }}
              </p>
            </div>
            <div class="flex items-center">
              <i
                v-if="isCheckedIn(racer.id)"
                class="pi pi-check-circle text-2xl text-green-600 dark:text-green-400"
              />
              <i v-else class="pi pi-circle text-2xl text-gray-300 dark:text-gray-500" />
            </div>
          </div>

          <!-- Racer Image -->
          <div v-if="racer.image_url" class="mb-3">
            <Image
              :src="racer.image_url"
              :alt="racer.name"
              image-class="w-full h-32 object-cover rounded"
              class="w-full h-32"
              preview
            />
          </div>

          <!-- Check-in Status -->
          <div v-if="isCheckedIn(racer.id)" class="text-sm text-green-700 dark:text-green-300 mb-3">
            <i class="pi pi-check mr-1" />
            Checked in at {{ getCheckinTime(racer.id) }}
          </div>

          <!-- Action Button -->
          <Button
            :loading="processing === racer.id"
            :severity="isCheckedIn(racer.id) ? 'danger' : 'success'"
            class="w-full"
            @click="toggleCheckin(racer)"
          >
            <i v-if="isCheckedIn(racer.id)" class="pi pi-times mr-2" />
            <i v-else class="pi pi-check mr-2" />
            {{ isCheckedIn(racer.id) ? 'Check Out' : 'Check In' }}
          </Button>
        </div>
      </div>

      <!-- No Racers Found -->
      <div v-if="filteredRacers.length === 0" class="text-center py-12">
        <i class="pi pi-search text-6xl text-gray-300 dark:text-gray-600 mb-4" />
        <h3 class="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-2">No Racers Found</h3>
        <p class="text-gray-600 dark:text-gray-300">
          {{
            searchQuery ? 'Try adjusting your search terms.' : 'No racers available for this race.'
          }}
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useAuthStore } from '~/stores/auth'
import { useToast } from 'primevue/usetoast'

const route = useRoute()
const authStore = useAuthStore()
const toast = useToast()
const { $supabase } = useNuxtApp()

// Reactive data
const race = ref(null)
const racers = ref([])
const checkins = ref([])
const pending = ref(true)
const error = ref(null)
const processing = ref(null)
const searchQuery = ref('')

// Breadcrumb navigation
const breadcrumbItems = computed(() => [
  { label: 'Home', url: '/' },
  { label: 'Races', url: '/races' },
  { label: race.value?.name || 'Race', url: `/races/${route.params.id}` },
  { label: 'Check-in' } // Current page, no navigation
])

// Computed properties
const checkedInRacers = computed(() => checkins.value || [])

const filteredRacers = computed(() => {
  if (!searchQuery.value) return racers.value

  const query = searchQuery.value.toLowerCase()
  return racers.value.filter(
    (racer) =>
      racer.name.toLowerCase().includes(query) ||
      racer.racer_number.toString().includes(query) ||
      (racer.team_members && racer.team_members.toLowerCase().includes(query))
  )
})

// Helper functions
const isCheckedIn = (racerId) => {
  return checkedInRacers.value.some((checkin) => checkin.racer_id === racerId)
}

const getCheckinTime = (racerId) => {
  const checkin = checkedInRacers.value.find((c) => c.racer_id === racerId)
  return checkin ? new Date(checkin.time).toLocaleTimeString() : ''
}

const clearSearch = () => {
  searchQuery.value = ''
}

// Fetch race and racers data
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

    // Fetch all racers (not filtered by race, since any racer can participate)
    const { data: racersData, error: racersError } = await $supabase
      .from('racers')
      .select('*')
      .order('racer_number', { ascending: true })

    if (racersError) throw racersError
    racers.value = racersData || []

    // Fetch existing checkins for this race
    const { data: checkinsData, error: checkinsError } = await $supabase
      .from('checkins')
      .select('*')
      .eq('race_id', route.params.id)
      .order('time', { ascending: false })

    if (checkinsError) throw checkinsError
    checkins.value = checkinsData || []
  } catch (err) {
    console.error('Error fetching data:', err)
    error.value = err
  } finally {
    pending.value = false
  }
}

// Toggle checkin status
const toggleCheckin = async (racer) => {
  if (processing.value) return

  processing.value = racer.id

  try {
    const isCurrentlyCheckedIn = isCheckedIn(racer.id)

    if (isCurrentlyCheckedIn) {
      // Check out - remove checkin record
      const { error: deleteError } = await $supabase
        .from('checkins')
        .delete()
        .eq('racer_id', racer.id)
        .eq('race_id', route.params.id)

      if (deleteError) throw deleteError

      // Update local state
      checkins.value = checkins.value.filter((c) => c.racer_id !== racer.id)

      toast.add({
        severity: 'info',
        summary: 'Checked Out',
        detail: `${racer.name} has been checked out`,
        life: 3000
      })
    } else {
      // Check in - create checkin record
      const { data: newCheckin, error: insertError } = await $supabase
        .from('checkins')
        .insert({
          racer_id: racer.id,
          race_id: route.params.id,
          time: new Date().toISOString()
        })
        .select()
        .single()

      if (insertError) throw insertError

      // Update local state
      checkins.value = [newCheckin, ...checkins.value]

      toast.add({
        severity: 'success',
        summary: 'Checked In',
        detail: `${racer.name} has been checked in`,
        life: 3000
      })
    }
  } catch (err) {
    console.error('Error toggling checkin:', err)
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: err.message || 'Failed to update check-in status',
      life: 5000
    })
  } finally {
    processing.value = null
  }
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
      ? `Check-in: ${race.value.name} - Brick Race Championship`
      : 'Check-in - Brick Race Championship'
  )
})
</script>
