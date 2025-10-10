<template>
  <div class="min-h-screen bg-white">
    <div class="container mx-auto px-4 py-8">
      <PageHeader title="Awards" :actions="headerActions" />

      <!-- Active Race Display -->
      <div v-if="activeRace" class="mb-8">
        <Card>
          <template #content>
            <div class="flex items-center justify-between">
              <div>
                <h3 class="text-2xl font-bold text-black mb-1">
                  {{ activeRace.name }}
                </h3>
                <p class="text-gray-600 font-medium">
                  {{
                    new Date(activeRace.race_datetime).toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })
                  }}
                </p>
              </div>
              <div class="text-right">
                <div class="text-gray-600 text-sm font-medium">Total Awards</div>
                <div class="text-3xl font-bold text-black">
                  {{ voteableAwards.length + filteredAssignedAwards.length }}
                </div>
              </div>
            </div>
          </template>
        </Card>
      </div>

      <!-- Loading State -->
      <div v-if="loading || awardsLoading" class="space-y-12">
        <!-- Voteable Awards Skeleton -->
        <div>
          <Skeleton width="15rem" height="2rem" class="mb-6" />
          <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card
              v-for="n in 3"
              :key="n"
              class="hover:shadow-2xl hover:scale-[1.02] transition-all duration-300 border-2 border-gray-200 rounded-lg overflow-hidden bg-white"
            >
              <template #header>
                <div class="relative">
                  <Skeleton width="100%" height="20rem" />
                </div>
              </template>
              <template #title>
                <div class="px-6 pt-6">
                  <Skeleton width="80%" height="1.5rem" class="mb-2" />
                </div>
              </template>
              <template #subtitle>
                <div class="px-6 pb-4">
                  <Skeleton width="100%" height="1rem" />
                </div>
              </template>
              <template #content>
                <div class="px-6 pb-6 space-y-3">
                  <Skeleton width="60%" height="1rem" />
                  <Skeleton width="100%" height="2.5rem" />
                  <Skeleton width="70%" height="2rem" />
                </div>
              </template>
            </Card>
          </div>
        </div>

        <!-- Assigned Awards Skeleton -->
        <div>
          <Skeleton width="18rem" height="2rem" class="mb-6" />
          <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card
              v-for="n in 2"
              :key="n + 10"
              class="border-2 border-brand-gold bg-white hover:shadow-2xl transition-all duration-300 overflow-hidden"
            >
              <template #header>
                <div class="relative">
                  <Skeleton width="100%" height="20rem" />
                  <!-- Winner Badge Skeleton -->
                  <div class="absolute top-3 right-3">
                    <Skeleton width="4rem" height="1.5rem" />
                  </div>
                </div>
              </template>
              <template #title>
                <div class="px-6 pt-6">
                  <Skeleton width="75%" height="1.5rem" class="mb-2" />
                </div>
              </template>
              <template #content>
                <div class="px-6 pb-6 space-y-3">
                  <!-- Winner display skeleton -->
                  <div class="flex items-center gap-3 p-3 bg-yellow-100/50/20 rounded-lg">
                    <Skeleton width="3rem" height="3rem" class="rounded-full" />
                    <div class="space-y-1 flex-1">
                      <Skeleton width="60%" height="1rem" />
                      <Skeleton width="40%" height="0.75rem" />
                    </div>
                  </div>
                </div>
              </template>
            </Card>
          </div>
        </div>
      </div>

      <!-- Awards Content -->
      <div v-if="selectedRace">
        <!-- Voteable Awards -->
        <div v-if="voteableAwards.length" class="mb-12">
          <h2 class="text-3xl font-bold text-black mb-8">Vote for Awards</h2>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card
              v-for="award in voteableAwards"
              :key="award.id"
              class="hover:shadow-lg hover:scale-[1.01] transition-all duration-200 border-2 border-gray-200 hover:border-red-400 rounded-lg overflow-hidden bg-white"
              style="
                box-shadow:
                  0 4px 12px rgba(0, 0, 0, 0.1),
                  inset 2px 2px 4px rgba(255, 255, 255, 0.3),
                  inset -2px -2px 4px rgba(0, 0, 0, 0.05);
              "
            >
              <template #header>
                <div class="relative">
                  <Image
                    v-if="award.image_url"
                    :src="award.image_url"
                    :alt="award.name"
                    image-class="w-full h-80 object-cover"
                    class="w-full h-80"
                    preview
                  />
                  <div
                    v-else
                    class="w-full h-80 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center border-b-2 border-gray-300"
                  >
                    <i
                      class="pi pi-trophy text-8xl text-red-500"
                      style="text-shadow: 0 2px 4px rgba(197, 48, 48, 0.3)"
                    />
                  </div>
                </div>
              </template>

              <template #title>
                <div class="px-6 pt-6">
                  <h3 class="text-xl font-bold text-black">
                    {{ award.name }}
                  </h3>
                </div>
              </template>
              <template #subtitle>
                <div class="px-6 pb-4">
                  <p class="text-sm text-gray-600 leading-relaxed">
                    {{ award.description }}
                  </p>
                </div>
              </template>

              <template #content>
                <div class="px-6 pb-6">
                  <div v-if="authStore.user && activeRace">
                    <div v-if="racers.length > 0">
                      <label class="block text-sm font-bold text-gray-700 mb-3">
                        Cast Your Vote:
                      </label>
                      <Select
                        v-model="votes[award.id]"
                        :options="racers"
                        option-label="name"
                        option-value="id"
                        placeholder="Select a racer..."
                        filter
                        :filter-placeholder="'Type to search...'"
                        show-clear
                        class="w-full mb-4"
                        style="border: 2px solid #e5e7eb; border-radius: 6px"
                      >
                        <template #option="slotProps">
                          <div class="flex items-center gap-3 py-2">
                            <!-- Thumbnail Image -->
                            <div class="flex-shrink-0">
                              <img
                                v-if="slotProps.option.image_url"
                                :src="slotProps.option.image_url"
                                :alt="slotProps.option.name"
                                class="w-10 h-10 rounded-full object-cover border-2 border-gray-200"
                              />
                              <div
                                v-else
                                class="w-10 h-10 rounded-full bg-red-600 text-white flex items-center justify-center text-xs font-mono font-bold"
                              >
                                #{{ slotProps.option.racer_number }}
                              </div>
                            </div>

                            <!-- Racer Info -->
                            <div class="flex flex-col min-w-0 flex-1">
                              <div class="flex items-center gap-2">
                                <span class="font-medium text-black">{{
                                  slotProps.option.name
                                }}</span>
                                <span
                                  class="text-xs font-mono text-gray-500 px-2 py-1 bg-gray-100 rounded"
                                >
                                  #{{ slotProps.option.racer_number }}
                                </span>
                              </div>
                            </div>
                          </div>
                        </template>

                        <template #value="slotProps">
                          <div v-if="slotProps.value" class="flex items-center gap-2">
                            <img
                              v-if="getSelectedRacer(slotProps.value)?.image_url"
                              :src="getSelectedRacer(slotProps.value)?.image_url"
                              :alt="getSelectedRacer(slotProps.value)?.name"
                              class="w-6 h-6 rounded-full object-cover"
                            />
                            <div
                              v-else
                              class="w-6 h-6 rounded-full bg-red-600 text-white flex items-center justify-center text-xs font-mono font-bold"
                            >
                              #{{ getSelectedRacer(slotProps.value)?.racer_number || '?' }}
                            </div>
                            <span class="font-medium">{{
                              getSelectedRacer(slotProps.value)?.name
                            }}</span>
                            <span
                              class="text-xs font-mono text-gray-500 px-1 py-0.5 bg-gray-100 rounded"
                            >
                              #{{ getSelectedRacer(slotProps.value)?.racer_number || '?' }}
                            </span>
                          </div>
                          <span v-else class="text-gray-500">Select a racer...</span>
                        </template>
                      </Select>
                      <Button
                        :disabled="!votes[award.id] || submittingVotes[award.id]"
                        :loading="submittingVotes[award.id]"
                        class="btn-primary w-full font-bold"
                        @click="handleVoteSubmission(award.id)"
                      >
                        <i class="pi pi-check mr-2" />
                        {{
                          hasUserVotedForAward(award.id, activeRace?.id)
                            ? 'Update Vote'
                            : 'Submit Vote'
                        }}
                      </Button>
                    </div>
                    <div v-else class="text-center text-gray-500 py-6">
                      <i class="pi pi-exclamation-triangle text-2xl mb-2 text-amber-500" />
                      <div class="font-medium">No racers have checked in yet</div>
                      <div class="text-sm">Racers must check in before voting opens</div>
                    </div>
                  </div>
                  <div v-else class="text-center text-gray-500 py-6">
                    <i class="pi pi-lock text-2xl mb-2 text-gray-400" />
                    <div class="font-medium">Please log in to vote</div>
                  </div>
                </div>
              </template>
            </Card>
          </div>
        </div>

        <!-- Current Winners / Assigned Awards -->
        <div v-if="filteredAssignedAwards.length">
          <h2 class="text-3xl font-bold text-black mb-8">Award Winners</h2>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card
              v-for="award in filteredAssignedAwards"
              :key="award.id"
              class="border-2 border-brand-gold bg-white hover:shadow-2xl transition-all duration-300 overflow-hidden"
              style="
                box-shadow:
                  0 8px 20px rgba(245, 158, 11, 0.2),
                  inset 2px 2px 4px rgba(255, 255, 255, 0.4),
                  inset -2px -2px 4px rgba(245, 158, 11, 0.1);
              "
            >
              <template #header>
                <div class="relative">
                  <Image
                    v-if="award.award_definition?.image_url"
                    :src="award.award_definition?.image_url"
                    :alt="award.award_definition?.name"
                    image-class="w-full h-80 object-cover"
                    class="w-full h-80"
                    preview
                  />
                  <div
                    v-else
                    class="w-full h-80 bg-gradient-to-br from-yellow-200 to-amber-300 flex items-center justify-center border-b-2 border-yellow-400"
                  >
                    <i
                      class="pi pi-trophy text-8xl text-yellow-700"
                      style="text-shadow: 0 2px 4px rgba(245, 158, 11, 0.4)"
                    />
                  </div>
                  <!-- Winner Badge -->
                  <div
                    class="absolute top-3 right-3 px-3 py-1 bg-brand-gold text-black font-black text-sm"
                  >
                    WINNER
                  </div>
                </div>
              </template>

              <template #title>
                <div class="px-6 pt-6">
                  <h3 class="text-xl font-bold text-black">
                    {{ award.award_definition?.name }}
                  </h3>
                </div>
              </template>
              <template #subtitle>
                <div class="px-6 pb-4">
                  <RacerLink
                    :racer-id="award.racer.id"
                    :racer-slug="award.racer.slug"
                    class="flex items-center gap-4 p-3 rounded-lg bg-white/50/50 hover:bg-white/70/70 transition-all duration-200 border border-yellow-300"
                  >
                    <!-- Racer Photo -->
                    <div class="flex-shrink-0">
                      <img
                        v-if="award.racer.image_url"
                        :src="award.racer.image_url"
                        :alt="award.racer.name"
                        class="w-16 h-16 rounded-full object-cover border-2 border-yellow-400"
                      />
                      <div
                        v-else
                        class="w-16 h-16 bg-yellow-600 text-white flex items-center justify-center text-sm font-bold border-2 border-yellow-400 rounded-full"
                      >
                        #{{ award.racer.racer_number || '?' }}
                      </div>
                    </div>

                    <!-- Racer Info -->
                    <div class="flex-1">
                      <p
                        class="text-lg font-black text-yellow-800"
                        style="
                          font-family: 'Courier New', monospace;
                          text-shadow: 0 1px 2px rgba(245, 158, 11, 0.2);
                        "
                      >
                        {{ award.racer.name }}
                      </p>
                      <p class="text-sm font-bold text-yellow-700 mt-1">
                        Racer #{{ award.racer.racer_number || 'N/A' }}
                      </p>
                    </div>

                    <!-- Link Indicator -->
                    <div class="flex-shrink-0">
                      <i class="pi pi-external-link text-yellow-600" />
                    </div>
                  </RacerLink>
                </div>
              </template>

              <template #content>
                <div class="px-6 pb-6">
                  <div
                    v-if="award.notes"
                    class="text-sm text-gray-700 leading-relaxed bg-white/50/50 p-3 rounded border"
                  >
                    {{ award.notes }}
                  </div>
                </div>
              </template>
            </Card>
          </div>
        </div>

        <!-- Vote Results -->
        <div v-if="voteableAwards.length" class="mt-12">
          <h2 class="text-3xl font-bold text-black mb-8">Vote Results</h2>
          <div class="space-y-8">
            <Card
              v-for="award in voteableAwards"
              :key="award.id"
              class="overflow-hidden border-2 border-gray-200 rounded-lg"
              style="
                box-shadow:
                  0 4px 12px rgba(0, 0, 0, 0.1),
                  inset 2px 2px 4px rgba(255, 255, 255, 0.3),
                  inset -2px -2px 4px rgba(0, 0, 0, 0.05);
              "
            >
              <template #title>
                <div class="flex items-center gap-3 px-6 pt-6">
                  <div
                    class="w-8 h-8 bg-brand-blue text-white rounded-full flex items-center justify-center font-bold"
                  >
                    <i class="pi pi-chart-bar text-sm" />
                  </div>
                  <h3 class="text-xl font-bold text-black">
                    {{ award.name }}
                  </h3>
                </div>
              </template>
              <template #content>
                <div class="px-6 pb-6">
                  <DataTable
                    :value="getAwardLeaderboard(award.id, activeRace?.id)"
                    class="p-datatable-sm border rounded"
                    :pt="{
                      table: { style: 'min-width: 100%' },
                      header: { class: 'border-none p-0' }
                    }"
                  >
                    <Column header="Position" class="w-20">
                      <template #body="{ index }">
                        <div
                          class="flex items-center justify-center w-10 h-10 rounded font-black text-sm"
                          :class="{
                            'bg-brand-gold text-black': index === 0,
                            'bg-gray-400 text-white': index === 1,
                            'bg-orange-500 text-white': index === 2,
                            'bg-gray-200 text-gray-700': index > 2
                          }"
                        >
                          {{ index + 1 }}
                        </div>
                      </template>
                    </Column>

                    <Column field="racer_name" header="Racer" sortable>
                      <template #body="{ data }">
                        <RacerLink
                          :racer-id="data.racer_id"
                          :racer-name="data.racer_name"
                          class="font-bold hover:text-brand-blue hover:underline transition-colors duration-200"
                        />
                      </template>
                    </Column>

                    <Column header="Votes" class="text-right">
                      <template #body="{ data }">
                        <Badge
                          :value="`${data.vote_count} votes`"
                          class="font-bold bg-brand-blue text-white"
                        />
                      </template>
                    </Column>
                  </DataTable>
                </div>
              </template>
            </Card>
          </div>
        </div>
      </div>

      <!-- No Active Race -->
      <div v-else class="text-center py-12">
        <i class="pi pi-trophy text-6xl text-brand-gold mb-4" />
        <h3 class="text-2xl font-bold text-gray-700 mb-2">No Active Race</h3>
        <p class="text-gray-500">Check back later for voting opportunities!</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useAuthStore } from '~/stores/auth'
import { useToast } from 'primevue/usetoast'

const authStore = useAuthStore()
const toast = useToast()

// Use reactive composables
const { initialize: initializeRacers } = useRacers()
const { initialize: initializeCheckins, getCheckinsForRace } = useCheckins()
const {
  awards: assignedAwards,
  loading: awardsLoading,
  initialize: initializeAwards,
  getAwardLeaderboard,
  voteableAwards,
  submitVote,
  removeVote: _removeVote,
  toggleVote: _toggleVote,
  hasUserVoted: _hasUserVoted,
  hasUserVotedForAward,
  getUserVoteForAward,
  getVoteCount: _getVoteCount,
  voteCounts: _voteCounts
} = useAwards()

const activeRace = ref(null)
const selectedRace = computed(() => activeRace.value?.id)
const submittingVotes = ref({})
const votes = ref({})

// Get racers who are checked in for the active race
const racers = computed(() => {
  if (!activeRace.value?.id) return []

  const raceCheckins = getCheckinsForRace(activeRace.value.id)
  const checkedInRacers = []
  const seen = new Set()

  raceCheckins.forEach((checkin) => {
    if (checkin.racer && checkin.racer.id && !seen.has(checkin.racer.id)) {
      seen.add(checkin.racer.id)
      checkedInRacers.push({
        id: checkin.racer.id,
        name: checkin.racer.name,
        racer_number: checkin.racer.racer_number,
        image_url: checkin.racer.image_url
      })
    }
  })

  // Sort by racer number for consistent ordering
  const sortedRacers = checkedInRacers.sort((a, b) => (a.racer_number || 0) - (b.racer_number || 0))

  return sortedRacers
})

// Pre-populate votes with user's existing selections
const prePopulatedVotes = computed(() => {
  if (!activeRace.value?.id || !authStore.isAuthenticated) return {}

  const populated = {}
  voteableAwards.value.forEach((award) => {
    const existingVote = getUserVoteForAward(award.id, activeRace.value.id)
    if (existingVote) {
      populated[award.id] = existingVote
    }
  })
  return populated
})

// Watch for changes in pre-populated votes and update the votes ref
watch(
  prePopulatedVotes,
  (newVotes) => {
    Object.assign(votes.value, newVotes)
  },
  { immediate: true }
)

// Header actions
const headerActions = computed(() => {
  if (authStore.isRaceAdmin) {
    return [
      {
        label: 'Manage Awards',
        icon: 'pi pi-cog',
        to: '/awards/manage',
        class: 'btn-primary'
      }
    ]
  }
  return []
})

// Filter awards by active race
const filteredAssignedAwards = computed(() => {
  if (!activeRace.value) return []

  return assignedAwards.value.filter((award) => {
    return award.race_id === activeRace.value.id
  })
})

// Handle vote submission
const handleVoteSubmission = async (awardDefinitionId) => {
  const racerId = votes.value[awardDefinitionId]
  if (!racerId || !activeRace.value?.id) {
    return
  }

  submittingVotes.value[awardDefinitionId] = true

  try {
    await submitVote(racerId, awardDefinitionId, activeRace.value.id)

    // Clear the vote selection to show updated state
    votes.value[awardDefinitionId] = null

    // Show success message
    toast.add({
      severity: 'success',
      summary: 'Vote Submitted',
      detail: 'Your vote has been recorded!',
      life: 3000
    })
  } catch (error) {
    console.error('Error submitting vote:', error)

    // Show error message
    toast.add({
      severity: 'error',
      summary: 'Vote Failed',
      detail: error.message || 'Failed to submit vote',
      life: 5000
    })
  } finally {
    submittingVotes.value[awardDefinitionId] = false
  }
}

// Fetch active race
const fetchActiveRace = async () => {
  try {
    const supabase = useSupabaseClient()
    const { data, error } = await supabase
      .from('races')
      .select('id, name, race_datetime, active')
      .eq('active', true)
      .single()

    if (error && error.code !== 'PGRST116') throw error // PGRST116 is""no rows found"

    activeRace.value = data || null

    // Auto-load active race data if available
    if (activeRace.value) {
      await loadRaceData()
    }
  } catch (error) {
    console.error('Error fetching active race:', error)
  }
}

// Load race data (simplified for composables)
const loadRaceData = async () => {
  if (!selectedRace.value) return
  // Composables will handle the real-time data
}

// Helper function to get selected racer details for display
const getSelectedRacer = (racerId) => {
  if (!racerId || !racers.value || racers.value.length === 0) {
    return null
  }
  return racers.value.find((racer) => racer.id === racerId) || null
}

// Initialize
onMounted(async () => {
  await authStore.initAuth()

  // First fetch the active race, then initialize awards with race filter
  await fetchActiveRace()

  await Promise.all([
    initializeRacers(),
    initializeCheckins(),
    initializeAwards({ raceId: activeRace.value?.id })
  ])
})

// Note: Removed cleanup calls to prevent composable reloading on navigation
// Composables will manage their own lifecycle and subscriptions

useHead({
  title: 'Awards - The Great Holyoke Brick Race',
  meta: [
    {
      name: 'description',
      content: 'Vote for awards and view winners in the The Great Holyoke Brick Race.'
    }
  ]
})
</script>
