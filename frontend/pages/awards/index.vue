<template>
  <div class="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50 dark:bg-gradient-to-br dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
    <div class="container mx-auto px-4 py-8">
    <div class="flex justify-between items-center mb-8">
      <h1 class="text-3xl font-bold text-gray-900 dark:text-white">Awards</h1>
      <NuxtLink v-if="authStore.isRaceAdmin" to="/awards/manage">
        <Button class="btn-brick">
          <i class="pi pi-cog mr-2" />
          Manage Awards
        </Button>
      </NuxtLink>
    </div>

    <!-- Active Race Display -->
    <div v-if="activeRace" class="mb-8">
      <div
        class="border-2 border-red-500 rounded-lg p-6 bg-white dark:bg-gray-800 shadow-sm"
        style="
          background: linear-gradient(135deg, #fef2f2 0%, #ffffff 100%);
          border-color: #c53030;
          box-shadow:
            0 4px 12px rgba(0, 0, 0, 0.1),
            inset 2px 2px 4px rgba(255, 255, 255, 0.3),
            inset -2px -2px 4px rgba(197, 48, 48, 0.1);
        "
      >
        <div class="flex items-center justify-between">
          <div>
            <h3
              class="text-2xl font-black text-gray-900 mb-1"
              style="font-family: 'Courier New', monospace"
            >
              {{ activeRace.name }}
            </h3>
            <p class="text-gray-600 font-medium">
              {{
                new Date(activeRace.date).toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })
              }}
            </p>
          </div>
          <div class="text-right">
            <div class="text-gray-600 text-sm font-medium uppercase tracking-wide">
              Total Awards
            </div>
            <div
              class="text-3xl font-black text-red-600"
              style="
                font-family: 'Courier New', monospace;
                text-shadow: 0 1px 2px rgba(197, 48, 48, 0.3);
              "
            >
              {{ voteableAwards.length + assignedAwards.length }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="pending" class="space-y-12">
      <!-- Voteable Awards Skeleton -->
      <div>
        <Skeleton width="15rem" height="2rem" class="mb-6" />
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card v-for="n in 3" :key="n" class="overflow-hidden">
            <template #header>
              <Skeleton width="100%" height="8rem" />
            </template>
            <template #title>
              <Skeleton width="80%" height="1.5rem" class="mb-2" />
            </template>
            <template #subtitle>
              <Skeleton width="100%" height="1rem" class="mb-4" />
            </template>
            <template #content>
              <div class="space-y-3">
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
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card v-for="n in 2" :key="n + 10" class="overflow-hidden">
            <template #header>
              <Skeleton width="100%" height="8rem" />
            </template>
            <template #title>
              <Skeleton width="75%" height="1.5rem" class="mb-2" />
            </template>
            <template #content>
              <div class="space-y-2">
                <Skeleton width="90%" height="1rem" />
                <Skeleton width="60%" height="1rem" />
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
        <h2
          class="text-3xl font-black text-gray-900 dark:text-white mb-8 uppercase tracking-wide"
          style="font-family: 'Courier New', monospace; text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1)"
        >
          Vote for Awards
        </h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
          <Card
            v-for="award in voteableAwards"
            :key="award.id"
            class="hover:shadow-2xl hover:scale-[1.02] transition-all duration-300 border-2 border-gray-200 dark:border-gray-600 hover:border-red-400 dark:hover:border-red-500 rounded-lg overflow-hidden bg-white dark:bg-gray-800"
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
                  class="w-full h-80 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 flex items-center justify-center border-b-2 border-gray-300 dark:border-gray-600"
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
                <h3
                  class="text-xl font-black text-gray-900 dark:text-white uppercase tracking-wide"
                  style="font-family: 'Courier New', monospace; letter-spacing: 1px"
                >
                  {{ award.name }}
                </h3>
              </div>
            </template>
            <template #subtitle>
              <div class="px-6 pb-4">
                <p class="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                  {{ award.description }}
                </p>
              </div>
            </template>

            <template #content>
              <div class="px-6 pb-6">
                <div v-if="authStore.user && activeRace">
                  <div v-if="racers.length > 0">
                    <label
                      class="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-3 uppercase tracking-wide"
                      style="font-family: 'Courier New', monospace; letter-spacing: 0.5px"
                    >
                      Cast Your Vote:
                    </label>
                    <Dropdown
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
                              class="w-10 h-10 rounded-full object-cover border-2 border-gray-200 dark:border-gray-600"
                            >
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
                              <span class="font-medium text-gray-900 dark:text-white">{{
                                slotProps.option.name
                              }}</span>
                              <span
                                class="text-xs font-mono text-gray-500 dark:text-gray-400 px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded"
                                style="font-family: 'Courier New', monospace"
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
                          >
                          <div
                            v-else
                            class="w-6 h-6 rounded-full bg-red-600 text-white flex items-center justify-center text-xs font-mono font-bold"
                          >
                            #{{ getSelectedRacer(slotProps.value)?.racer_number }}
                          </div>
                          <span class="font-medium">{{
                            getSelectedRacer(slotProps.value)?.name
                          }}</span>
                          <span
                            class="text-xs font-mono text-gray-500 px-1 py-0.5 bg-gray-100 rounded"
                            style="font-family: 'Courier New', monospace"
                          >
                            #{{ getSelectedRacer(slotProps.value)?.racer_number }}
                          </span>
                        </div>
                        <span v-else class="text-gray-500">Select a racer...</span>
                      </template>
                    </Dropdown>
                    <Button
                      :disabled="!votes[award.id] || submittingVotes[award.id]"
                      :loading="submittingVotes[award.id]"
                      class="w-full font-bold uppercase tracking-wide border-2 border-red-600 hover:border-red-700"
                      severity="primary"
                      style="
                        background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
                        box-shadow:
                          0 4px 8px rgba(220, 38, 38, 0.3),
                          inset 1px 1px 2px rgba(255, 255, 255, 0.2),
                          inset -1px -1px 2px rgba(0, 0, 0, 0.1);
                        font-family: 'Courier New', monospace;
                        letter-spacing: 1px;
                      "
                      @click="submitVote(award.id)"
                    >
                      {{ userVotes[award.id] ? '🔄 Update Vote' : '🗳️ Submit Vote' }}
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
      <div v-if="assignedAwards.length">
        <h2
          class="text-3xl font-black text-gray-900 dark:text-white mb-8 uppercase tracking-wide"
          style="font-family: 'Courier New', monospace; text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1)"
        >
          🏆 Award Winners
        </h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
          <Card
            v-for="award in assignedAwards"
            :key="award.id"
            class="border-2 border-yellow-400 bg-gradient-to-br from-yellow-50 to-amber-50 dark:from-yellow-900/30 dark:to-amber-900/30 dark:border-yellow-500 hover:shadow-2xl transition-all duration-300 rounded-lg overflow-hidden"
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
                  v-if="award.award_definition.image_url"
                  :src="award.award_definition.image_url"
                  :alt="award.award_definition.name"
                  image-class="w-full h-80 object-cover"
                  class="w-full h-80"
                  preview
                />
                <div
                  v-else
                  class="w-full h-80 bg-gradient-to-br from-yellow-200 to-amber-300 dark:from-yellow-700 dark:to-amber-700 flex items-center justify-center border-b-2 border-yellow-400 dark:border-yellow-500"
                >
                  <i
                    class="pi pi-trophy text-8xl text-yellow-700 dark:text-yellow-300"
                    style="text-shadow: 0 2px 4px rgba(245, 158, 11, 0.4)"
                  />
                </div>
                <!-- Winner Badge -->
                <div
                  class="absolute top-3 right-3 px-3 py-1 text-white font-black text-sm rounded"
                  style="
                    background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
                    box-shadow:
                      0 4px 8px rgba(245, 158, 11, 0.4),
                      inset 1px 1px 2px rgba(255, 255, 255, 0.3),
                      inset -1px -1px 2px rgba(0, 0, 0, 0.1);
                    font-family: 'Courier New', monospace;
                    letter-spacing: 1px;
                  "
                >
                  🏆 WINNER
                </div>
              </div>
            </template>

            <template #title>
              <div class="px-6 pt-6">
                <h3
                  class="text-xl font-black text-gray-900 dark:text-white uppercase tracking-wide"
                  style="font-family: 'Courier New', monospace; letter-spacing: 1px"
                >
                  {{ award.award_definition.name }}
                </h3>
              </div>
            </template>
            <template #subtitle>
              <div class="px-6 pb-4">
                <p
                  class="text-lg font-black text-yellow-800 dark:text-yellow-200"
                  style="
                    font-family: 'Courier New', monospace;
                    text-shadow: 0 1px 2px rgba(245, 158, 11, 0.2);
                  "
                >
                  🏁 {{ award.racer.name }}
                </p>
              </div>
            </template>

            <template #content>
              <div class="px-6 pb-6">
                <div
                  v-if="award.notes"
                  class="text-sm text-gray-700 dark:text-gray-300 leading-relaxed bg-white/50 dark:bg-gray-800/50 p-3 rounded border"
                >
                  {{ award.notes }}
                </div>
              </div>
            </template>
          </Card>
        </div>
      </div>

      <!-- Vote Results -->
      <div v-if="voteResults.length" class="mt-12">
        <h2
          class="text-3xl font-black text-gray-900 dark:text-white mb-8 uppercase tracking-wide"
          style="font-family: 'Courier New', monospace; text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1)"
        >
          📊 Vote Results
        </h2>
        <div class="space-y-8">
          <Card
            v-for="result in voteResults"
            :key="result.award_name"
            class="overflow-hidden border-2 border-gray-200 dark:border-gray-600 rounded-lg"
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
                  class="w-8 h-8 bg-blue-600 text-white rounded flex items-center justify-center font-bold"
                  style="box-shadow: 0 2px 6px rgba(37, 99, 235, 0.3)"
                >
                  <i class="pi pi-chart-bar text-sm" />
                </div>
                <h3
                  class="text-xl font-black text-gray-900 dark:text-white uppercase tracking-wide"
                  style="font-family: 'Courier New', monospace; letter-spacing: 1px"
                >
                  {{ result.award_name }}
                </h3>
              </div>
            </template>
            <template #content>
              <div class="px-6 pb-6">
                <DataTable
                  :value="result.votes"
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
                          'bg-yellow-400 text-yellow-900': index === 0,
                          'bg-gray-400 text-gray-900': index === 1,
                          'bg-orange-400 text-orange-900': index === 2,
                          'bg-gray-200 text-gray-700': index > 2
                        }"
                        style="
                          box-shadow:
                            0 2px 4px rgba(0, 0, 0, 0.2),
                            inset 1px 1px 2px rgba(255, 255, 255, 0.3);
                          font-family: 'Courier New', monospace;
                        "
                      >
                        {{
                          index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : index + 1
                        }}
                      </div>
                    </template>
                  </Column>

                  <Column field="racer_name" header="Racer" sortable>
                    <template #body="{ data }">
                      <span class="font-bold" style="font-family: 'Courier New', monospace">
                        {{ data.racer_name }}
                      </span>
                    </template>
                  </Column>

                  <Column header="Votes" class="text-right">
                    <template #body="{ data }">
                      <Badge
                        :value="`❤️ ${data.vote_count}`"
                        severity="info"
                        class="font-bold"
                        style="
                          background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
                          font-family: 'Courier New', monospace;
                        "
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
      <i class="pi pi-trophy text-6xl text-red-300 mb-4" />
      <h3
        class="text-2xl font-black text-gray-700 mb-2 uppercase tracking-wide"
        style="font-family: 'Courier New', monospace"
      >
        No Active Race
      </h3>
      <p class="text-gray-500">Check back later for voting opportunities!</p>
    </div>
    </div>
  </div>
</template>

<script setup>
import { useAuthStore } from '~/stores/auth'
import Dropdown from 'primevue/dropdown'

const authStore = useAuthStore()
const { $supabase } = useNuxtApp()

const activeRace = ref(null)
const selectedRace = computed(() => activeRace.value?.id)
const voteableAwards = ref([])
const assignedAwards = ref([])
const racers = ref([])
const votes = ref({})
const userVotes = ref({})
const submittingVotes = ref({})
const voteResults = ref([])
const pending = ref(false)

// Fetch active race
const fetchActiveRace = async () => {
  try {
    const { data, error } = await $supabase
      .from('races')
      .select('id, name, date, active')
      .eq('active', true)
      .single()

    if (error && error.code !== 'PGRST116') throw error // PGRST116 is "no rows found"

    activeRace.value = data || null

    // Auto-load active race data if available
    if (activeRace.value) {
      await loadRaceData()
    }
  } catch (error) {
    console.error('Error fetching active race:', error)
  }
}

// Load race data (extracted for reuse)
const loadRaceData = async () => {
  if (!selectedRace.value) return

  pending.value = true
  await Promise.all([
    fetchRacers(),
    fetchAwardDefinitions(),
    fetchAssignedAwards(),
    fetchUserVotes(),
    fetchVoteResults()
  ])
  pending.value = false
}

// Fetch racers for selected race (only checked-in racers)
const fetchRacers = async () => {
  if (!selectedRace.value) return

  try {
    console.log('Fetching racers for race:', selectedRace.value)

    const { data, error } = await $supabase
      .from('checkins')
      .select(
        `
        racer_id,
        racers(id, name, racer_number, image_url)
      `
      )
      .eq('race_id', selectedRace.value)

    if (error) throw error

    console.log('Checkins data:', data)

    const uniqueRacers = []
    const seen = new Set()

    data?.forEach((checkin) => {
      if (checkin.racers && !seen.has(checkin.racers.id)) {
        seen.add(checkin.racers.id)
        uniqueRacers.push(checkin.racers)
      }
    })

    racers.value = uniqueRacers
    console.log('Unique racers for voting:', racers.value.length, racers.value)
  } catch (error) {
    console.error('Error fetching racers:', error)
  }
}

// Fetch award definitions
const fetchAwardDefinitions = async () => {
  if (!selectedRace.value) return

  try {
    const { data, error } = await $supabase
      .from('award_definitions')
      .select('*')
      .eq('active', true)
      .order('name')

    if (error) throw error
    voteableAwards.value = (data || []).filter((award) => award.voteable)
  } catch (error) {
    console.error('Error fetching award definitions:', error)
  }
}

// Fetch assigned awards
const fetchAssignedAwards = async () => {
  if (!selectedRace.value) return

  try {
    const { data, error } = await $supabase
      .from('awards')
      .select(
        `
        *,
        award_definition:award_definitions(*),
        racer:racers(name)
      `
      )
      .eq('race_id', selectedRace.value)

    if (error) throw error
    assignedAwards.value = data || []
  } catch (error) {
    console.error('Error fetching assigned awards:', error)
  }
}

// Fetch user's existing votes
const fetchUserVotes = async () => {
  if (!selectedRace.value || !authStore.user) return

  try {
    const { data, error } = await $supabase
      .from('award_votes')
      .select('award_definition_id, racer_id')
      .eq('race_id', selectedRace.value)
      .eq('voter_id', authStore.user.id)

    if (error) throw error

    const votesMap = {}

    data?.forEach((vote) => {
      votesMap[vote.award_definition_id] = vote.racer_id
    })

    userVotes.value = votesMap
    votes.value = { ...votesMap }
  } catch (error) {
    console.error('Error fetching user votes:', error)
  }
}

// Fetch vote results
const fetchVoteResults = async () => {
  if (!selectedRace.value) return

  try {
    const { data, error } = await $supabase
      .from('award_vote_counts')
      .select('*')
      .eq('race_id', selectedRace.value)
      .order('vote_count', { ascending: false })

    if (error) throw error

    // Group by award
    const grouped = {}
    data?.forEach((vote) => {
      if (!grouped[vote.award_name]) {
        grouped[vote.award_name] = {
          award_name: vote.award_name,
          votes: []
        }
      }
      grouped[vote.award_name].votes.push(vote)
    })

    voteResults.value = Object.values(grouped)
  } catch (error) {
    console.error('Error fetching vote results:', error)
  }
}

// Submit vote
const submitVote = async (awardId) => {
  if (!authStore.user || !votes.value[awardId] || !activeRace.value) return

  submittingVotes.value[awardId] = true

  try {
    // Delete existing vote first
    await $supabase
      .from('award_votes')
      .delete()
      .eq('award_definition_id', awardId)
      .eq('race_id', selectedRace.value)
      .eq('voter_id', authStore.user.id)

    // Insert new vote
    const { error } = await $supabase.from('award_votes').insert({
      award_definition_id: awardId,
      race_id: selectedRace.value,
      racer_id: votes.value[awardId],
      voter_id: authStore.user.id
    })

    if (error) throw error

    userVotes.value[awardId] = votes.value[awardId]
    await fetchVoteResults()
  } catch (error) {
    console.error('Error submitting vote:', error)
  } finally {
    submittingVotes.value[awardId] = false
  }
}

// Helper function to get selected racer details for display
const getSelectedRacer = (racerId) => {
  return racers.value.find((racer) => racer.id === racerId)
}

// Initialize
onMounted(async () => {
  await authStore.initAuth()
  await fetchActiveRace()
})

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
