<template>
  <div class="challonge-bracket-container">
    <!-- Loading State -->
    <div v-if="loading" class="text-center py-12">
      <ProgressSpinner />
      <p class="mt-4 text-gray-600">Loading tournament bracket...</p>
    </div>
    
    <!-- Error State -->
    <div v-else-if="error" class="text-center py-12">
      <i class="pi pi-exclamation-triangle text-4xl text-red-500 mb-4" />
      <h3 class="text-xl font-semibold text-red-700 mb-2">Tournament Error</h3>
      <p class="text-red-600 mb-4">{{ error }}</p>
      <Button 
        severity="secondary"
        size="small"
        @click="refreshBracket"
      >
        <i class="pi pi-refresh mr-2" />
        Retry
      </Button>
    </div>
    
    <!-- Tournament Display -->
    <div v-else-if="tournament && embedUrl" class="bracket-wrapper">
      <!-- Bracket Header -->
      <div class="bracket-header">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <i class="pi pi-trophy text-white text-xl" />
            <div>
              <h3 class="text-xl font-bold text-white">Tournament Bracket</h3>
              <p class="text-blue-100 text-sm">
                {{ tournament.tournament_type.replace('_', ' ').toUpperCase() }}
                <span v-if="tournament.status === 'active'" class="ml-2">
                  <i class="pi pi-circle-fill text-green-400" /> LIVE
                </span>
              </p>
            </div>
          </div>
          
          <div class="flex items-center gap-2">
            <Button 
              size="small" 
              severity="secondary"
              :loading="refreshing"
              class="bg-white/20 border-white/30 text-white hover:bg-white/30"
              @click="refreshBracket"
            >
              <i class="pi pi-refresh mr-1" />
              <span class="hidden sm:inline">Refresh</span>
            </Button>
            <Button 
              size="small" 
              severity="secondary"
              class="bg-white/20 border-white/30 text-white hover:bg-white/30"
              @click="openFullBracket"
            >
              <i class="pi pi-external-link mr-1" />
              <span class="hidden sm:inline">Full View</span>
            </Button>
          </div>
        </div>
        
        <!-- Tournament Stats -->
        <div v-if="tournamentStatus" class="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div class="bg-white/10 rounded-lg p-3">
            <div class="text-lg font-bold text-white">{{ tournamentStatus.participants?.count || 0 }}</div>
            <div class="text-blue-100 text-xs">Participants</div>
          </div>
          <div class="bg-white/10 rounded-lg p-3">
            <div class="text-lg font-bold text-white capitalize">{{ tournament.status }}</div>
            <div class="text-blue-100 text-xs">Status</div>
          </div>
          <div class="bg-white/10 rounded-lg p-3">
            <div class="text-lg font-bold text-white">
              {{ tournament.tournament_type === 'double_elimination' ? 'Double' : 'Single' }}
            </div>
            <div class="text-blue-100 text-xs">Format</div>
          </div>
          <div class="bg-white/10 rounded-lg p-3">
            <div class="text-lg font-bold text-white">
              <i class="pi pi-trophy" />
            </div>
            <div class="text-blue-100 text-xs">Tournament</div>
          </div>
        </div>
      </div>
      
      <!-- Iframe Container -->
      <div class="iframe-container">
        <iframe 
          :src="embedUrl"
          width="100%" 
          height="600" 
          frameborder="0" 
          scrolling="auto" 
          allowtransparency="true"
          class="challonge-iframe"
          :class="{ 'opacity-50': refreshing }"
          @load="onIframeLoad"
        />
        
        <!-- Iframe Loading Overlay -->
        <div v-if="iframeLoading" class="iframe-loading-overlay">
          <ProgressSpinner />
          <p class="mt-2 text-gray-600">Loading bracket...</p>
        </div>
      </div>
      
      <!-- Tournament Footer -->
      <div class="bracket-footer">
        <div class="flex items-center justify-between text-sm">
          <div class="flex items-center gap-2 text-gray-600">
            <i class="pi pi-info-circle" />
            <span>Powered by Challonge</span>
          </div>
          <div class="flex items-center gap-4 text-gray-600">
            <div class="flex items-center gap-1">
              <i class="pi pi-clock" />
              <span>Last updated: {{ formatLastUpdate() }}</span>
            </div>
            <div v-if="tournament.status === 'active'" class="flex items-center gap-1 text-green-600">
              <i class="pi pi-circle-fill animate-pulse" />
              <span class="font-medium">Live Updates</span>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- No Tournament State -->
    <div v-else class="text-center py-12 bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg">
      <i class="pi pi-trophy text-4xl text-gray-400 mb-4" />
      <h3 class="text-xl font-semibold text-gray-700 mb-2">No Tournament Available</h3>
      <p class="text-gray-600 mb-4">The tournament bracket has not been created yet.</p>
      <div v-if="showAdminLink" class="mt-4">
        <Button 
          class="btn-primary"
          @click="navigateTo(`/races/${raceSlug}/admin/challonge`)"
        >
          <i class="pi pi-plus mr-2" />
          Create Tournament
        </Button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Race } from '~/types/database'

// Types
interface ChallongeTournament {
  id: string
  tournament_type: string
  status: string
  embed_url?: string
  challonge_url: string
}

interface TournamentStatus {
  participants?: {
    count: number
  }
}

// Props
interface Props {
  raceSlug: string
  raceId?: string
  autoRefresh?: boolean
  showAdminLink?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  raceId: undefined,
  autoRefresh: true,
  showAdminLink: true
})

// Composables
const { getTournamentByRace, getTournamentStatus } = useChallonge()

// State
const loading = ref(true)
const refreshing = ref(false)
const iframeLoading = ref(true)
const error = ref<string | null>(null)
const tournament = ref<ChallongeTournament | null>(null)
const tournamentStatus = ref<TournamentStatus | null>(null)
const lastUpdate = ref(new Date())

// Auto-refresh interval
let refreshInterval: NodeJS.Timeout | null = null

// Computed
const embedUrl = computed(() => {
  if (!tournament.value?.embed_url) return null
  
  // Add custom parameters for better integration
  const params = new URLSearchParams({
    multiplier: '0.9',
    match_width_multiplier: '1.2',
    show_final_results: '1',
    theme: '1',
    show_standings: '1'
  })
  
  return `${tournament.value.embed_url}?${params.toString()}`
})

// Methods
const loadTournament = async () => {
  loading.value = true
  error.value = null
  
  try {
    // Get race ID if not provided
    let raceId = props.raceId
    if (!raceId) {
      const { data: raceData } = await $fetch(`/api/races/by-slug/${props.raceSlug}`)
      raceId = (raceData as Race).id
    }
    
    // Get tournament data
    tournament.value = await getTournamentByRace(raceId)
    
    if (tournament.value?.id) {
      // Get tournament status
      tournamentStatus.value = await getTournamentStatus(tournament.value.id)
      lastUpdate.value = new Date()
    }
  } catch (err: any) {
    console.error('Failed to load tournament:', err)
    if (err.status !== 404) {
      error.value = err.data?.message || err.message || 'Failed to load tournament'
    }
  } finally {
    loading.value = false
  }
}

const refreshBracket = async () => {
  if (!tournament.value) {
    await loadTournament()
    return
  }
  
  refreshing.value = true
  iframeLoading.value = true
  
  try {
    // Refresh tournament status
    tournamentStatus.value = await getTournamentStatus(tournament.value.id)
    lastUpdate.value = new Date()
    
    // Force iframe reload by updating src
    const iframe = document.querySelector('.challonge-iframe') as HTMLIFrameElement
    if (iframe && iframe.src) {
      const currentSrc = iframe.src
      iframe.src = ''
      await nextTick()
      iframe.src = currentSrc
    }
  } catch (err: any) {
    console.error('Failed to refresh bracket:', err)
    error.value = err.data?.message || err.message || 'Failed to refresh bracket'
  } finally {
    refreshing.value = false
  }
}

const openFullBracket = () => {
  if (tournament.value?.challonge_url) {
    window.open(`https://challonge.com/${tournament.value.challonge_url}`, '_blank')
  }
}

const onIframeLoad = () => {
  iframeLoading.value = false
}

const formatLastUpdate = () => {
  return lastUpdate.value.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  })
}

const setupAutoRefresh = () => {
  if (props.autoRefresh && tournament.value?.status === 'active') {
    refreshInterval = setInterval(() => {
      refreshBracket()
    }, 30000) // Refresh every 30 seconds for active tournaments
  }
}

const clearAutoRefresh = () => {
  if (refreshInterval) {
    clearInterval(refreshInterval)
    refreshInterval = null
  }
}

// Lifecycle
onMounted(async () => {
  await loadTournament()
  setupAutoRefresh()
})

onUnmounted(() => {
  clearAutoRefresh()
})

// Watch for tournament status changes
watch(() => tournament.value?.status, (newStatus, oldStatus) => {
  if (newStatus !== oldStatus) {
    clearAutoRefresh()
    setupAutoRefresh()
  }
})
</script>

<style scoped>
.challonge-bracket-container {
  border: 2px solid #000;
  background: white;
  border-radius: 0;
  overflow: hidden;
  box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
}

.bracket-header {
  padding: 1.5rem;
  background: var(--brand-blue);
  color: white;
}

.bracket-footer {
  padding: 1rem 1.5rem;
  background: #f8fafc;
  border-top: 1px solid #e2e8f0;
}

.iframe-container {
  position: relative;
  background: white;
  min-height: 600px;
}

.challonge-iframe {
  border: none;
  background: white;
  display: block;
  transition: opacity 0.3s ease;
}

.iframe-loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.9);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 10;
}

.bracket-wrapper {
  position: relative;
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .bracket-header {
    padding: 1rem;
  }
  
  .bracket-footer {
    padding: 0.75rem 1rem;
  }
  
  .challonge-iframe {
    height: 500px;
  }
}

/* Animation for live indicator */
@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

.animate-pulse {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}
</style>