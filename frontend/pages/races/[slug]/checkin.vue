<template>
  <div class="min-h-screen bg-white">
    <ConfirmDialog />
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
        <h2 class="text-2xl font-semibold text-gray-800 mb-2">Race Not Found</h2>
        <p class="text-gray-600 mb-6">
          The race you're looking for doesn't exist or has been removed.
        </p>
        <NuxtLink to="/races">
          <Button severity="primary"> Back to All Races </Button>
        </NuxtLink>
      </div>

      <!-- Access Denied -->
      <div v-else-if="!authStore.isRaceAdmin" class="text-center py-12">
        <i class="pi pi-ban text-6xl text-red-400 mb-4" />
        <h2 class="text-2xl font-semibold text-gray-800 mb-2">Access Denied</h2>
        <p class="text-gray-600 mb-6">
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
          <div class="flex flex-col md:flex-row md:items-start md:justify-between">
            <div>
              <h1 class="text-3xl font-bold text-black mb-2">Check-in: {{ race.name }}</h1>
              <div class="flex items-center gap-4 text-gray-600">
                <span>{{
                  race.race_datetime
                    ? new Date(race.race_datetime).toLocaleDateString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })
                    : 'Date TBD'
                }}</span>
                <span class="font-semibold text-green-600">{{ checkedInCount }} checked in</span>
              </div>
            </div>
            <div class="mt-4 md:mt-0">
              <AdminMenu :race-id="race?.slug" />
            </div>
          </div>
        </div>

        <!-- Search Bar -->
        <Card class="mb-6">
          <template #content>
            <div class="flex flex-col md:flex-row gap-4">
              <div class="flex-1">
                <label for="search" class="block text-sm font-medium text-gray-700 mb-2">
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
              'bg-green-50 border-green-200/30': isCheckedIn(racer.id),
              'bg-white border-gray-200 hover:bg-gray-50': !isCheckedIn(racer.id)
            }"
          >
            <!-- Racer Info -->
            <div class="flex items-center justify-between mb-3">
              <div>
                <h3 class="font-semibold text-black">{{ racer.name }}</h3>
                <p class="text-sm text-gray-600">Racer #{{ racer.racer_number }}</p>
                <p v-if="racer.team_members" class="text-xs text-gray-500 mt-1">
                  Team: {{ racer.team_members }}
                </p>
              </div>
              <div class="flex items-center">
                <i
                  v-if="isCheckedIn(racer.id)"
                  class="pi pi-check-circle text-2xl text-green-600"
                />
                <i v-else class="pi pi-circle text-2xl text-gray-300" />
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
            <div v-if="isCheckedIn(racer.id)" class="text-sm text-green-700 mb-3">
              <i class="pi pi-check mr-1" />
              Checked in at {{ getCheckinTime(racer.id) }}
            </div>

            <!-- Withdrawal Status -->
            <div
              v-if="isWithdrawn(racer.id)"
              class="bg-red-50/20 border border-red-200 rounded-md p-2 mb-3"
            >
              <div class="flex items-center text-red-700">
                <i class="pi pi-exclamation-triangle mr-2" />
                <span class="text-sm font-medium">Withdrawn from race</span>
              </div>
            </div>

            <!-- Action Buttons -->
            <div class="space-y-2">
              <!-- Check-in Button -->
              <Button
                :loading="processing === racer.id"
                :severity="isCheckedIn(racer.id) ? 'danger' : 'success'"
                :disabled="isWithdrawn(racer.id)"
                class="w-full"
                @click="toggleCheckin(racer)"
              >
                <i v-if="isCheckedIn(racer.id)" class="pi pi-times mr-2" />
                <i v-else class="pi pi-check mr-2" />
                {{ isCheckedIn(racer.id) ? 'Check Out' : 'Check In' }}
              </Button>

              <!-- Withdrawal Button (Admin or Racer Owner) -->
              <Button
                v-if="canUserWithdrawRacer(racer.id, race?.id)"
                :loading="processingWithdrawal === racer.id"
                :severity="isWithdrawn(racer.id) ? 'success' : 'warning'"
                class="w-full"
                outlined
                @click="toggleWithdrawal(racer)"
              >
                <i v-if="isWithdrawn(racer.id)" class="pi pi-user-plus mr-2" />
                <i v-else class="pi pi-user-minus mr-2" />
                {{ isWithdrawn(racer.id) ? 'Reinstate' : 'Withdraw' }}
              </Button>
            </div>
          </div>
        </div>

        <!-- No Racers Found -->
        <div v-if="filteredRacers.length === 0" class="text-center py-12">
          <i class="pi pi-search text-6xl text-gray-300 mb-4" />
          <h3 class="text-xl font-semibold text-gray-800 mb-2">No Racers Found</h3>
          <p class="text-gray-600">
            {{
              searchQuery
                ? 'Try adjusting your search terms.'
                : 'No racers available for this race.'
            }}
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useAuthStore } from '~/stores/auth'
import { useToast } from 'primevue/usetoast'
import { useConfirm } from 'primevue/useconfirm'
import { useCheckins } from '~/composables/useCheckins'
import { useRaces } from '~/composables/useRaces'

const route = useRoute()
const authStore = useAuthStore()
const toast = useToast()
const confirm = useConfirm()
const supabase = useSupabaseClient()

// Use checkins composable
const {
  checkedInRacers,
  processing,
  initialize,
  toggleCheckin: toggleCheckinComposable,
  isCheckedIn: isCheckedInComposable,
  getCheckinTime: getCheckinTimeComposable,
  filterRacers
} = useCheckins()

// Use races composable
const { getRaceBySlug, fetchRaceBySlug, initialize: initializeRaces } = useRaces()

// Use racers composable for withdrawal functionality
const {
  previewWithdrawalImpact,
  withdrawRacerFromRace,
  reinstateRacerToRace,
  isRacerWithdrawnFromRace,
  canUserWithdrawRacer
} = useRacers()

// Local reactive data
const race = ref(null)
const pending = ref(true)
const error = ref(null)
const searchQuery = ref('')
const withdrawnRacers = ref(new Set()) // Track withdrawn racers for this race
const processingWithdrawal = ref(null) // Track which racer withdrawal is being processed

// Breadcrumb navigation
const breadcrumbItems = computed(() => [
  { label: 'Home', url: '/' },
  { label: 'Races', url: '/races' },
  { label: race.value?.name || 'Race', url: `/races/${route.params.slug}` },
  { label: 'Check-in' } // Current page, no navigation
])

// Computed properties
const filteredRacers = computed(() => filterRacers(searchQuery.value))

const checkedInCount = computed(() => {
  return checkedInRacers.value.filter((c) => c.race_id === race.value?.id).length
})

// Helper functions
const isCheckedIn = (racerId) => {
  return isCheckedInComposable(racerId, race.value?.id)
}

const getCheckinTime = (racerId) => {
  return getCheckinTimeComposable(racerId, race.value?.id)
}

const clearSearch = () => {
  searchQuery.value = ''
}

// Check if racer is withdrawn from this race
const isWithdrawn = (racerId) => {
  return withdrawnRacers.value.has(racerId)
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
      // Preview withdrawal impact before confirming
      const preview = await previewWithdrawalImpact(racer.id, race.value.id)

      // Check if already withdrawn
      if (preview.already_withdrawn) {
        withdrawnRacers.value.add(racer.id)
        toast.add({
          severity: 'info',
          summary: 'Already Withdrawn',
          detail: `${racer.name} is already withdrawn from this race`,
          life: 3000
        })
        processingWithdrawal.value = null
        return
      }

      // Build impact message for confirmation dialog (plain text)
      const impact = preview.impact
      const bracketImpact = preview.bracket_impact
      const impactLines = []

      // Heat impact
      if (impact) {
        const scheduled = impact.scheduled_heats_to_remove || 0
        const inProgress = impact.in_progress_heats_to_continue || 0
        const completed = impact.completed_heats_to_preserve || 0

        if (scheduled > 0) {
          impactLines.push(`• ${scheduled} scheduled heat(s) will be removed`)
        }
        if (inProgress > 0) {
          impactLines.push(`• ${inProgress} in-progress heat(s) will continue`)
        }
        if (completed > 0) {
          impactLines.push(`• ${completed} completed result(s) will be preserved`)
        }

        if (scheduled === 0 && inProgress === 0 && completed === 0) {
          impactLines.push('No heats will be affected.')
        }
      } else {
        impactLines.push('No heats will be affected.')
      }

      // Bracket impact
      if (bracketImpact) {
        const totalForfeits = bracketImpact.total_forfeits || 0
        if (totalForfeits > 0) {
          impactLines.push(`• ${totalForfeits} bracket match(es) will be forfeited`)
        }
      }

      const impactMessage =
        impactLines.join('\n') + '\n\nThis action cannot be easily undone. Continue?'

      // Show confirmation dialog
      confirm.require({
        message: impactMessage,
        header: `Withdraw ${racer.name}?`,
        icon: 'pi pi-exclamation-triangle',
        acceptLabel: 'Yes, Withdraw',
        rejectLabel: 'Cancel',
        accept: async () => {
          try {
            // Perform the actual withdrawal
            const result = await withdrawRacerFromRace(
              racer.id,
              race.value.id,
              'Withdrawn by race admin'
            )
            withdrawnRacers.value.add(racer.id)

            // Build detailed message about heat and bracket impact
            let detailMessage = `${racer.name} has been withdrawn from the race`
            const details = []

            if (result.heatChanges) {
              const changes = result.heatChanges
              if (changes.scheduled_heats_removed > 0) {
                details.push(`${changes.scheduled_heats_removed} scheduled heat(s) removed`)
              }
              if (changes.completed_heats_preserved > 0) {
                details.push(`${changes.completed_heats_preserved} completed heat(s) preserved`)
              }
            }

            if (result.bracketChanges) {
              const changes = result.bracketChanges
              const totalForfeits =
                (changes.bracket_rounds_forfeited || 0) + (changes.brackets_forfeited || 0)
              if (totalForfeits > 0) {
                details.push(`${totalForfeits} bracket match(es) forfeited`)
              }
            }

            if (details.length > 0) {
              detailMessage += '. ' + details.join(', ')
            }

            toast.add({
              severity: 'info',
              summary: 'Racer Withdrawn',
              detail: detailMessage,
              life: 6000
            })
          } catch (err) {
            console.error('Error withdrawing racer:', err)
            toast.add({
              severity: 'error',
              summary: 'Error',
              detail: 'Failed to withdraw racer',
              life: 5000
            })
          }
        },
        reject: () => {
          // User cancelled, do nothing
        }
      })
    }
  } catch (err) {
    console.error('Error updating racer withdrawal status:', err)
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Failed to update racer withdrawal status',
      life: 5000
    })
  } finally {
    processingWithdrawal.value = null
  }
}

// Load withdrawal status for all racers
const loadWithdrawalStatus = async () => {
  if (!race.value) return

  try {
    const { data: raceWithdrawals, error } = await supabase
      .from('race_withdrawals')
      .select('racer_id')
      .eq('race_id', race.value.id)

    if (error) throw error

    // Update local withdrawal tracking
    withdrawnRacers.value = new Set((raceWithdrawals || []).map((w) => w.racer_id))
  } catch (err) {
    console.error('Error loading withdrawal status:', err)
  }
}

// Fetch race data
const fetchRaceData = async () => {
  try {
    await initializeRaces()

    // Get race by slug
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

// Toggle checkin status
const toggleCheckin = async (racer) => {
  if (processing.value) return

  try {
    const result = await toggleCheckinComposable(racer.id, race.value?.id)

    if (result.success) {
      const isCurrentlyCheckedIn = isCheckedIn(racer.id)

      toast.add({
        severity: isCurrentlyCheckedIn ? 'success' : 'info',
        summary: isCurrentlyCheckedIn ? 'Checked In' : 'Checked Out',
        detail: `${racer.name} has been ${isCurrentlyCheckedIn ? 'checked in' : 'checked out'}`,
        life: 3000
      })
    } else {
      toast.add({
        severity: 'error',
        summary: 'Error',
        detail: result.error || 'Failed to update check-in status',
        life: 5000
      })
    }
  } catch (err) {
    console.error('Error toggling checkin:', err)
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Failed to update check-in status',
      life: 5000
    })
  }
}

// Initialize
onMounted(async () => {
  await authStore.initAuth()
  await fetchRaceData()
  await initialize(race.value?.id)
  await loadWithdrawalStatus()
  pending.value = false
})

// Cleanup is handled automatically by useCheckins' onUnmounted hook

// Page head
useHead({
  title: computed(() =>
    race.value
      ? `Check-in: ${race.value.name} - The Great Holyoke Brick Race`
      : 'Check-in - The Great Holyoke Brick Race'
  )
})
</script>
