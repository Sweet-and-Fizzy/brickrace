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
          <Button severity="primary"> Back to All Races </Button>
        </NuxtLink>
      </div>

      <!-- My Racers Status -->
      <div v-else-if="race">
        <!-- Header -->
        <div class="mb-8">
          <h1 class="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            My Racers Status: {{ race.name }}
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
              >{{ myRacersInRace.length }} of your racers</span
            >
          </div>
        </div>

        <!-- My Racers Cards -->
        <div v-if="myRacersInRace.length > 0" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card
            v-for="racer in myRacersInRace"
            :key="racer.id"
            class="border-2"
            :class="{
              'border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-800': isWithdrawn(racer.id),
              'border-gray-200 dark:border-gray-600': !isWithdrawn(racer.id)
            }"
          >
            <template #content>
              <!-- Racer Info -->
              <div class="flex items-center justify-between mb-4">
                <div>
                  <h3 class="font-semibold text-gray-900 dark:text-white">{{ racer.name }}</h3>
                  <p class="text-sm text-gray-600 dark:text-gray-300">
                    Racer #{{ racer.racer_number }}
                  </p>
                  <p v-if="racer.team_members" class="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Team: {{ racer.team_members }}
                  </p>
                </div>
              </div>

              <!-- Racer Image -->
              <div v-if="racer.image_url" class="mb-4">
                <Image
                  :src="racer.image_url"
                  :alt="racer.name"
                  image-class="w-full h-32 object-cover rounded"
                  class="w-full h-32"
                  preview
                />
              </div>

              <!-- Status Indicators -->
              <div class="space-y-3">
                <!-- Check-in Status -->
                <div class="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded">
                  <span class="text-sm text-gray-600 dark:text-gray-300">Check-in Status</span>
                  <div class="flex items-center">
                    <i
                      v-if="isCheckedIn(racer.id)"
                      class="pi pi-check-circle text-green-600 dark:text-green-400 mr-2"
                    />
                    <i v-else class="pi pi-circle text-gray-400 mr-2" />
                    <span 
                      class="text-sm font-medium"
                      :class="{
                        'text-green-600 dark:text-green-400': isCheckedIn(racer.id),
                        'text-gray-500 dark:text-gray-400': !isCheckedIn(racer.id)
                      }"
                    >
                      {{ isCheckedIn(racer.id) ? 'Checked In' : 'Not Checked In' }}
                    </span>
                  </div>
                </div>

                <!-- Withdrawal Status -->
                <div class="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded">
                  <span class="text-sm text-gray-600 dark:text-gray-300">Race Status</span>
                  <div class="flex items-center">
                    <i
                      v-if="isWithdrawn(racer.id)"
                      class="pi pi-exclamation-triangle text-red-600 dark:text-red-400 mr-2"
                    />
                    <i v-else class="pi pi-check text-green-600 dark:text-green-400 mr-2" />
                    <span 
                      class="text-sm font-medium"
                      :class="{
                        'text-red-600 dark:text-red-400': isWithdrawn(racer.id),
                        'text-green-600 dark:text-green-400': !isWithdrawn(racer.id)
                      }"
                    >
                      {{ isWithdrawn(racer.id) ? 'Withdrawn' : 'Active' }}
                    </span>
                  </div>
                </div>
              </div>

              <!-- Action Button -->
              <div class="mt-4">
                <Button
                  :loading="processingWithdrawal === racer.id"
                  :severity="isWithdrawn(racer.id) ? 'success' : 'warning'"
                  class="w-full"
                  outlined
                  @click="toggleWithdrawal(racer)"
                >
                  <i v-if="isWithdrawn(racer.id)" class="pi pi-user-plus mr-2" />
                  <i v-else class="pi pi-user-minus mr-2" />
                  {{ isWithdrawn(racer.id) ? 'Reinstate to Race' : 'Withdraw from Race' }}
                </Button>
              </div>
            </template>
          </Card>
        </div>

        <!-- No Racers -->
        <div v-else class="text-center py-12">
          <i class="pi pi-inbox text-6xl text-gray-300 dark:text-gray-600 mb-4" />
          <h3 class="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-2">
            No Racers Found
          </h3>
          <p class="text-gray-600 dark:text-gray-300 mb-6">
            You don't have any racers in this race.
          </p>
          <NuxtLink to="/racers/add">
            <Button severity="primary">
              <i class="pi pi-plus mr-2" />
              Add a Racer
            </Button>
          </NuxtLink>
        </div>
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
const supabase = useSupabaseClient()

// Use composables
const { getRaceBySlug, fetchRaceBySlug, initialize: initializeRaces } = useRaces()
const { 
  myRacers, 
  withdrawRacerFromRace, 
  reinstateRacerToRace,
  initialize: initializeRacers
} = useRacers()
const { 
  isCheckedIn: isCheckedInComposable,
  initialize: initializeCheckins
} = useCheckins()

// Local reactive data
const race = ref(null)
const pending = ref(true)
const error = ref(null)
const withdrawnRacers = ref(new Set())
const processingWithdrawal = ref(null)

// Breadcrumb navigation
const breadcrumbItems = computed(() => [
  { label: 'Home', url: '/' },
  { label: 'Races', url: '/races' },
  { label: race.value?.name || 'Race', url: `/races/${route.params.slug}` },
  { label: 'My Status' }
])

// Computed properties
const myRacersInRace = computed(() => {
  // This would need to be filtered by race participation
  // For now, showing all user's racers
  return myRacers.value
})

// Helper functions
const isWithdrawn = (racerId) => {
  return withdrawnRacers.value.has(racerId)
}

const isCheckedIn = (racerId) => {
  return isCheckedInComposable(racerId, race.value?.id)
}

// Toggle withdrawal status for a racer
const toggleWithdrawal = async (racer) => {
  if (processingWithdrawal.value === racer.id) return

  processingWithdrawal.value = racer.id

  try {
    const isCurrentlyWithdrawn = isWithdrawn(racer.id)
    
    if (isCurrentlyWithdrawn) {
      // Reinstate racer
      await reinstateRacerToRace(racer.id, race.value.id)
      withdrawnRacers.value.delete(racer.id)
      
      toast.add({
        severity: 'success',
        summary: 'Racer Reinstated',
        detail: `${racer.name} has been reinstated to the race`,
        life: 3000
      })
    } else {
      // Withdraw racer
      await withdrawRacerFromRace(racer.id, race.value.id, 'Withdrawn by racer owner')
      withdrawnRacers.value.add(racer.id)
      
      toast.add({
        severity: 'info',
        summary: 'Racer Withdrawn',
        detail: `${racer.name} has been withdrawn from the race`,
        life: 3000
      })
    }
  } catch (err) {
    console.error('Error updating racer withdrawal status:', err)
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: err.message || 'Failed to update racer withdrawal status',
      life: 5000
    })
  } finally {
    processingWithdrawal.value = null
  }
}

// Load withdrawal status for user's racers
const loadWithdrawalStatus = async () => {
  if (!race.value) return

  try {
    const { data: raceWithdrawals, error } = await supabase
      .from('race_withdrawals')
      .select('racer_id')
      .eq('race_id', race.value.id)
      .in('racer_id', myRacers.value.map(r => r.id))

    if (error) throw error

    withdrawnRacers.value = new Set((raceWithdrawals || []).map(w => w.racer_id))
  } catch (err) {
    console.error('Error loading withdrawal status:', err)
  }
}

// Fetch race data
const fetchRaceData = async () => {
  try {
    await initializeRaces()
    
    const slug = route.params.slug
    let raceData = getRaceBySlug(slug)
    if (!raceData) {
      raceData = await fetchRaceBySlug(slug)
    }
    
    if (!raceData) {
      throw new Error('Race not found')
    }
    race.value = raceData
  } catch (err) {
    console.error('Error fetching race data:', err)
    error.value = err
  }
}

// Initialize
onMounted(async () => {
  await authStore.initAuth()
  await fetchRaceData()
  await initializeRacers()
  await initializeCheckins()
  await loadWithdrawalStatus()
  pending.value = false
})

// Page head
useHead({
  title: computed(() =>
    race.value
      ? `My Status: ${race.value.name} - The Great Holyoke Brick Race`
      : 'My Status - The Great Holyoke Brick Race'
  )
})
</script>