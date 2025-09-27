<template>
  <div class="min-h-screen bg-gray-50">
    <div class="max-w-4xl mx-auto p-6">
      <!-- Page Header -->
      <div class="mb-8">
        <div class="flex items-center gap-3 mb-4">
          <NuxtLink 
            :to="`/races/${route.params.slug}`"
            class="text-gray-500 hover:text-gray-700"
          >
            <i class="pi pi-arrow-left text-lg" />
          </NuxtLink>
          <h1 class="text-3xl font-bold text-black">Challonge Tournament Management</h1>
        </div>
        
        <div v-if="race" class="bg-white border-2 border-gray-200 rounded-lg p-4">
          <div class="flex items-center gap-3">
            <i class="pi pi-flag text-brand-blue text-xl" />
            <div>
              <h2 class="font-semibold text-lg">{{ race.name }}</h2>
              <p class="text-gray-600 text-sm">{{ formatDate(race.race_datetime) }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="pageLoading" class="text-center py-12">
        <ProgressSpinner />
        <p class="mt-4 text-gray-600">Loading tournament data...</p>
      </div>

      <!-- Error State -->
      <div v-else-if="pageError" class="text-center py-12">
        <i class="pi pi-exclamation-triangle text-4xl text-red-500 mb-4" />
        <p class="text-red-600 font-medium">{{ pageError }}</p>
        <Button 
          class="mt-4"
          severity="secondary"
          @click="initializePage"
        >
          <i class="pi pi-refresh mr-2" />
          Retry
        </Button>
      </div>

      <!-- Main Content -->
      <div v-else>
        <!-- No Tournament - Creation Form -->
        <Card v-if="!tournament" class="mb-6">
          <template #title>
            <div class="flex items-center gap-2">
              <i class="pi pi-plus-circle text-brand-green" />
              Create Challonge Tournament
            </div>
          </template>
          <template #content>
            <div class="space-y-6">
              <p class="text-gray-700">
                Create a professional tournament bracket on Challonge for your qualified racers.
                This will provide a beautiful, interactive bracket that spectators can follow in real-time.
              </p>

              <!-- Tournament Readiness Summary -->
              <div v-if="eligibleRacers" class="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
                <div class="flex items-center gap-3 mb-3">
                  <i class="pi pi-users text-blue-600 text-lg" />
                  <h3 class="font-semibold text-blue-900">Tournament Readiness</h3>
                </div>
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div class="text-center">
                    <div class="text-2xl font-bold text-green-600">{{ eligibleRacers.eligible_racers?.length || 0 }}</div>
                    <div class="text-gray-600">Ready for Brackets</div>
                    <div class="text-xs text-gray-500 mt-1">Has qualifying times</div>
                  </div>
                  <div class="text-center">
                    <div class="text-2xl font-bold text-blue-600">{{ eligibleRacers.summary?.total_checked_in || 0 }}</div>
                    <div class="text-gray-600">Checked In</div>
                    <div class="text-xs text-gray-500 mt-1">Present at race</div>
                  </div>
                  <div class="text-center">
                    <div class="text-2xl font-bold text-amber-600">{{ eligibleRacers.summary?.not_qualified || 0 }}</div>
                    <div class="text-gray-600">Need Qualifying</div>
                    <div class="text-xs text-gray-500 mt-1">No times recorded yet</div>
                  </div>
                </div>
              </div>

              <!-- Tournament Form -->
              <form class="space-y-4" @submit.prevent="createChallongeTournament">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">Tournament Name</label>
                  <InputText 
                    v-model="tournamentForm.name" 
                    class="w-full"
                    placeholder="e.g., The 2025 Brick Race - Elimination Brackets"
                    required
                  />
                </div>
                
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">Description</label>
                  <Textarea 
                    v-model="tournamentForm.description" 
                    class="w-full" 
                    rows="3"
                    placeholder="Brief description of the tournament"
                  />
                </div>

                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">Tournament Type</label>
                  <Select 
                    v-model="tournamentForm.tournament_type"
                    :options="tournamentTypes"
                    option-label="label"
                    option-value="value"
                    class="w-full"
                  />
                </div>

                <div class="flex justify-end gap-3 pt-4">
                  <Button 
                    type="submit"
                    :loading="challongeLoading"
                    :disabled="!canCreateTournament"
                    class="btn-primary"
                  >
                    <i class="pi pi-plus mr-2" />
                    Create Tournament
                  </Button>
                </div>
              </form>
            </div>
          </template>
        </Card>

        <!-- Existing Tournament - Management Interface -->
        <div v-else class="space-y-6">
          <!-- Tournament Info -->
          <Card>
            <template #title>
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <i class="pi pi-trophy text-brand-gold" />
                  Tournament Details
                </div>
                <Badge 
                  :value="tournament.status" 
                  :severity="getStatusSeverity(tournament.status)"
                />
              </div>
            </template>
            <template #content>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div class="space-y-3">
                  <div>
                    <label class="text-sm font-medium text-gray-600">Tournament Name</label>
                    <p class="font-semibold">{{ tournament.challonge_url }}</p>
                  </div>
                  <div>
                    <label class="text-sm font-medium text-gray-600">Type</label>
                    <p class="font-semibold capitalize">{{ tournament.tournament_type.replace('_', ' ') }}</p>
                  </div>
                  <div>
                    <label class="text-sm font-medium text-gray-600">Status</label>
                    <p class="font-semibold capitalize">{{ tournament.status }}</p>
                  </div>
                </div>
                <div class="space-y-3">
                  <div>
                    <label class="text-sm font-medium text-gray-600">Public URL</label>
                    <div class="flex items-center gap-2">
                      <code class="text-sm bg-gray-100 px-2 py-1 rounded">challonge.com/{{ tournament.challonge_url }}</code>
                      <Button 
                        size="small"
                        severity="secondary"
                        @click="openChallongeUrl"
                      >
                        <i class="pi pi-external-link" />
                      </Button>
                    </div>
                  </div>
                  <div v-if="tournamentStatus">
                    <label class="text-sm font-medium text-gray-600">Participants</label>
                    <p class="font-semibold">{{ tournamentStatus.participants?.count || 0 }}</p>
                  </div>
                </div>
              </div>
            </template>
          </Card>

          <!-- Participant Management -->
          <Card v-if="tournament.status === 'pending'">
            <template #title>
              <div class="flex items-center gap-2">
                <i class="pi pi-users text-brand-blue" />
                Participant Management
              </div>
            </template>
            <template #content>
              <div class="space-y-4">
                <div v-if="!participantsAdded" class="flex items-center justify-between p-4 bg-amber-50 border border-amber-200 rounded-lg">
                  <div class="flex items-center gap-3">
                    <i class="pi pi-info-circle text-amber-600" />
                    <div>
                      <p class="font-medium text-amber-800">Ready to add racers to tournament</p>
                      <p class="text-sm text-amber-700">{{ eligibleRacers?.eligible_racers?.length || 0 }} racers have qualifying times and can be added to the elimination brackets.</p>
                    </div>
                  </div>
                  <Button 
                    :loading="challongeLoading"
                    class="btn-primary"
                    @click="addEligibleRacers"
                  >
                    <i class="pi pi-plus mr-2" />
                    Add {{ eligibleRacers?.eligible_racers?.length || 0 }} Racers
                  </Button>
                </div>

                <div v-else class="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div class="flex items-center gap-3">
                    <i class="pi pi-check-circle text-green-600" />
                    <div>
                      <p class="font-medium text-green-800">Participants Added</p>
                      <p class="text-sm text-green-700">{{ tournamentStatus?.participants?.count || 0 }} racers have been added to the tournament.</p>
                    </div>
                  </div>
                </div>
              </div>
            </template>
          </Card>

          <!-- Tournament Controls -->
          <Card v-if="tournament.status === 'pending' && participantsAdded">
            <template #title>
              <div class="flex items-center gap-2">
                <i class="pi pi-play text-brand-green" />
                Tournament Controls
              </div>
            </template>
            <template #content>
              <div class="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-lg">
                <div class="flex items-center gap-3">
                  <i class="pi pi-rocket text-green-600" />
                  <div>
                    <p class="font-medium text-green-800">Ready to Start</p>
                    <p class="text-sm text-green-700">All participants have been added. You can now start the tournament brackets.</p>
                  </div>
                </div>
                <Button 
                  :loading="challongeLoading"
                  severity="success"
                  class="font-semibold"
                  @click="startChallongeTournament"
                >
                  <i class="pi pi-play mr-2" />
                  Start Tournament
                </Button>
              </div>
            </template>
          </Card>

          <!-- Active Tournament Display -->
          <Card v-if="tournament.status === 'active'">
            <template #title>
              <div class="flex items-center gap-2">
                <i class="pi pi-trophy text-brand-gold" />
                Live Tournament
              </div>
            </template>
            <template #content>
              <div class="text-center py-6">
                <i class="pi pi-external-link text-4xl text-brand-blue mb-4" />
                <h3 class="text-xl font-semibold mb-2">Tournament is Live!</h3>
                <p class="text-gray-600 mb-6">The tournament brackets are now active and can be viewed by spectators.</p>
                <div class="flex justify-center gap-3">
                  <Button 
                    class="btn-primary"
                    @click="openChallongeUrl"
                  >
                    <i class="pi pi-external-link mr-2" />
                    View Live Bracket
                  </Button>
                  <Button 
                    severity="secondary"
                    @click="navigateTo(`/races/${route.params.slug}/brackets`)"
                  >
                    <i class="pi pi-arrow-right mr-2" />
                    Back to Race Page
                  </Button>
                </div>
              </div>
            </template>
          </Card>

          <!-- Sync Status and Controls -->
          <Card v-if="tournament.status === 'active'" class="mt-6">
            <template #title>
              <div class="flex items-center gap-2">
                <i class="pi pi-refresh text-blue-600" />
                Bracket Sync Status
              </div>
            </template>
            <template #content>
              <div class="space-y-4">
                <!-- Sync Summary -->
                <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div class="flex items-center justify-between">
                    <div class="flex items-center gap-3">
                      <i class="pi pi-info-circle text-blue-600" />
                      <div>
                        <p class="font-medium text-blue-800">Auto-Sync Active</p>
                        <p class="text-sm text-blue-700">
                          Bracket results are automatically synced to Challonge when timing system records times.
                          <span v-if="syncStatus">
                            {{ syncStatus.total_synced || 0 }}/{{ syncStatus.total_completed || 0 }} brackets synced
                            ({{ syncStatus.sync_coverage || '0%' }})
                          </span>
                        </p>
                      </div>
                    </div>
                    <Button
                      :loading="syncLoading"
                      severity="secondary"
                      size="small"
                      @click="refreshSyncStatus"
                    >
                      <i class="pi pi-refresh mr-2" />
                      Refresh
                    </Button>
                  </div>
                </div>

                <!-- Manual Sync Controls -->
                <div class="flex gap-3 flex-wrap">
                  <Button
                    :loading="syncLoading"
                    severity="secondary"
                    @click="manualSync(false)"
                  >
                    <i class="pi pi-sync mr-2" />
                    Sync Missing Brackets
                  </Button>
                  <Button
                    :loading="syncLoading"
                    severity="warning"
                    @click="manualSync(true)"
                  >
                    <i class="pi pi-replay mr-2" />
                    Force Re-sync All
                  </Button>
                  <Button
                    :loading="syncLoading"
                    severity="danger"
                    @click="regenerateBrackets"
                  >
                    <i class="pi pi-refresh mr-2" />
                    Regenerate Brackets
                  </Button>
                </div>

                <!-- Sync Details -->
                <div v-if="syncStatus && syncStatus.sync_records?.length > 0" class="border-t pt-4">
                  <details class="cursor-pointer">
                    <summary class="text-sm font-medium text-gray-700 hover:text-gray-900">
                      Recent Sync Activity ({{ syncStatus.sync_records.length }} records)
                    </summary>
                    <div class="mt-2 max-h-32 overflow-y-auto">
                      <div
                        v-for="record in syncStatus.sync_records.slice(0, 10)"
                        :key="record.bracket_id"
                        class="text-xs text-gray-600 py-1 flex justify-between"
                      >
                        <span>Bracket {{ record.bracket_id.substring(0, 8) }}...</span>
                        <span>{{ formatTime(record.synced_at) }}</span>
                      </div>
                    </div>
                  </details>
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
definePageMeta({
  middleware: 'admin'
})

const route = useRoute()
const { createTournament, addParticipants, startTournament, getTournamentStatus, getEligibleRacers, loading: challongeLoading, error: challongeError } = useChallonge()
const notifications = useNotifications()

// Page state
const pageLoading = ref(true)
const pageError = ref(null)
const race = ref(null)
const tournament = ref(null)
const tournamentStatus = ref(null)
const eligibleRacers = ref(null)
const participantsAdded = ref(false)

// Sync state
const syncStatus = ref(null)
const syncLoading = ref(false)

// Form data
const tournamentForm = ref({
  name: '',
  description: '',
  tournament_type: 'double elimination'
})

const tournamentTypes = [
  { label: 'Double Elimination', value: 'double elimination' },
  { label: 'Single Elimination', value: 'single elimination' }
]

// Computed
const canCreateTournament = computed(() => {
  return tournamentForm.value.name.trim() && 
         eligibleRacers.value?.eligible_racers?.length >= 2
})

const getStatusSeverity = (status) => {
  switch (status) {
    case 'pending': return 'warn'
    case 'active': return 'success'
    case 'completed': return 'info'
    default: return 'secondary'
  }
}

// Methods
const initializePage = async () => {
  pageLoading.value = true
  pageError.value = null
  
  try {
    // Get race data
    const { data: raceData } = await $fetch(`/api/races/by-slug/${route.params.slug}`)
    race.value = raceData

    // Set default tournament name
    tournamentForm.value.name = `${race.value.name} - Elimination Brackets`
    tournamentForm.value.description = `Double elimination tournament for ${race.value.name}`

    // Get eligible racers
    eligibleRacers.value = await getEligibleRacers(route.params.slug)

    // Check for existing tournament
    try {
      const tournamentData = await $fetch(`/api/challonge/tournaments/by-race/${race.value.id}`)
      tournament.value = tournamentData.data
      
      if (tournament.value) {
        tournamentStatus.value = await getTournamentStatus(tournament.value.id)
        participantsAdded.value = (tournamentStatus.value.participants?.count || 0) > 0
        
        // Load sync status if tournament is active
        if (tournament.value.status === 'active') {
          await refreshSyncStatus()
        }
      }
    } catch (err) {
      // No tournament exists yet, which is fine
      if (err.status !== 404) {
        throw err
      }
    }
  } catch (error) {
    console.error('Page initialization error:', error)
    pageError.value = error.data?.message || error.message || 'Failed to load page data'
  } finally {
    pageLoading.value = false
  }
}

const createChallongeTournament = async () => {
  try {
    const result = await createTournament(race.value.id, tournamentForm.value)
    tournament.value = result.tournament
    
    // Refresh tournament status
    await refreshTournamentStatus()
    
    // Show success message
    // Show success message
    notifications.success('Tournament created successfully!')
  } catch (error) {
    console.error('Tournament creation error:', error)
    // Show error message
    notifications.error(challongeError.value || 'Failed to create tournament')
  }
}

const addEligibleRacers = async () => {
  try {
    const result = await addParticipants(tournament.value.id, eligibleRacers.value.eligible_racers)
    participantsAdded.value = true
    
    // Refresh tournament status
    await refreshTournamentStatus()
    
    notifications.success(`Added ${result.summary?.added || 0} participants to tournament`)
  } catch (error) {
    console.error('Add participants error:', error)
    notifications.error(challongeError.value || 'Failed to add participants')
  }
}

const startChallongeTournament = async () => {
  try {
    const result = await startTournament(tournament.value.id)
    tournament.value = result.tournament
    
    // Generate brackets from Challonge tournament structure
    console.log('Generating brackets from Challonge tournament structure...')
    try {
      const bracketResult = await $fetch(`/api/challonge/tournaments/${tournament.value.id}/generate-brackets`, {
        method: 'POST'
      })
      
      console.log(`Generated ${bracketResult.summary.brackets_generated} brackets`)
      notifications.success(`Tournament started! Generated ${bracketResult.summary.brackets_generated} brackets from Challonge structure.`)
    } catch (bracketError) {
      console.error('Failed to generate brackets:', bracketError)
      notifications.warn('Tournament started but bracket generation failed. Please try manual sync.')
    }
    
    // Refresh tournament status
    await refreshTournamentStatus()
    
  } catch (error) {
    console.error('Tournament start error:', error)
    notifications.error(challongeError.value || 'Failed to start tournament')
  }
}

const refreshTournamentStatus = async () => {
  if (tournament.value) {
    try {
      tournamentStatus.value = await getTournamentStatus(tournament.value.id)
      
      // Also refresh sync status if tournament is active
      if (tournament.value.status === 'active') {
        await refreshSyncStatus()
      }
    } catch (error) {
      console.error('Failed to refresh tournament status:', error)
    }
  }
}

const openChallongeUrl = () => {
  if (tournament.value?.challonge_url) {
    window.open(`https://challonge.com/${tournament.value.challonge_url}`, '_blank')
  }
}

const formatDate = (dateString) => {
  if (!dateString) return 'Date not set'
  const date = new Date(dateString)
  if (Number.isNaN(date.getTime())) return 'Invalid date'
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

const formatTime = (dateString) => {
  if (!dateString) return 'N/A'
  const date = new Date(dateString)
  if (Number.isNaN(date.getTime())) return 'Invalid date'
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// Sync functions
const refreshSyncStatus = async () => {
  if (!tournament.value) return
  
  syncLoading.value = true
  try {
    const response = await $fetch(`/api/challonge/tournaments/${tournament.value.id}/sync-brackets`, {
      method: 'POST',
      body: { 
        force_resync: false
      }
    })
    syncStatus.value = response.summary
    syncStatus.value.sync_records = response.sync_records
  } catch (error) {
    console.error('Failed to get sync status:', error)
    notifications.error('Failed to refresh sync status')
  } finally {
    syncLoading.value = false
  }
}

const manualSync = async (forceResync = false) => {
  if (!tournament.value) return
  
  syncLoading.value = true
  try {
    const response = await $fetch(`/api/challonge/tournaments/${tournament.value.id}/sync-brackets`, {
      method: 'POST',
      body: { 
        force_resync: forceResync
      }
    })
    
    syncStatus.value = response.summary
    syncStatus.value.sync_records = response.sync_records
    
    const action = forceResync ? 'Re-synced' : 'Synced'
    const count = response.sync_results?.length || 0
    notifications.success(`${action} ${count} bracket(s) to Challonge`)
    
  } catch (error) {
    console.error('Manual sync failed:', error)
    notifications.error('Failed to sync brackets to Challonge')
  } finally {
    syncLoading.value = false
  }
}

const regenerateBrackets = async () => {
  if (!tournament.value) return
  
  const confirmed = confirm(
    'This will replace all existing brackets with new ones from Challonge tournament structure. ' +
    'Any recorded times will be lost. Are you sure?'
  )
  
  if (!confirmed) return
  
  syncLoading.value = true
  try {
    const response = await $fetch(`/api/challonge/tournaments/${tournament.value.id}/generate-brackets`, {
      method: 'POST'
    })
    
    notifications.success(
      `Regenerated ${response.summary.brackets_generated} brackets from Challonge structure`
    )
    
    // Refresh sync status
    await refreshSyncStatus()
    
  } catch (error) {
    console.error('Bracket regeneration failed:', error)
    notifications.error('Failed to regenerate brackets from Challonge')
  } finally {
    syncLoading.value = false
  }
}

// Initialize page
onMounted(() => {
  initializePage()
})

// SEO
useHead({
  title: `Challonge Tournament Management - ${route.params.slug}`,
  meta: [
    {
      name: 'description',
      content: 'Manage Challonge tournament brackets for race participants'
    }
  ]
})
</script>