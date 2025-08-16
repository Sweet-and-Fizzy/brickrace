<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- Header -->
      <div class="mb-8">
        <div class="flex flex-col md:flex-row md:items-start md:justify-between">
          <div>
            <h1 class="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Heat Management
            </h1>
            <p class="text-gray-600 dark:text-gray-300">
              Manage qualifier heats and times
            </p>
          </div>
          <div class="mt-4 md:mt-0">
            <AdminMenu />
          </div>
        </div>
      </div>

      <!-- Current Race Info -->
      <div v-if="currentRace" class="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-6">
        <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Active Race: {{ currentRace.name }}
        </h2>
        
        <!-- Qualifying Mode Controls -->
        <div class="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <h3 class="text-md font-medium text-gray-900 dark:text-white mb-3">Qualifying Mode</h3>
          <div class="flex flex-wrap gap-3 mb-3">
            <button
              @click="setQualifyingMode('auto')"
              :disabled="loading"
              :class="qualifyingMode === 'auto' ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'"
              class="px-4 py-2 rounded-md font-medium transition-colors disabled:opacity-50"
            >
              <i class="pi pi-sync mr-2" />
              Auto Generate
            </button>
            <button
              @click="setQualifyingMode('manual')"
              :disabled="loading"
              :class="qualifyingMode === 'manual' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'"
              class="px-4 py-2 rounded-md font-medium transition-colors disabled:opacity-50"
            >
              <i class="pi pi-hand-paper mr-2" />
              Manual Control
            </button>
            <button
              @click="setQualifyingMode('brackets')"
              :disabled="loading"
              :class="qualifyingMode === 'brackets' ? 'bg-purple-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'"
              class="px-4 py-2 rounded-md font-medium transition-colors disabled:opacity-50"
            >
              <i class="pi pi-sitemap mr-2" />
              Ready for Brackets
            </button>
          </div>
          <div class="text-sm text-gray-600 dark:text-gray-400">
            <span v-if="qualifyingMode === 'auto'">
              <i class="pi pi-check-circle text-green-600 mr-1" />
              New heats will be automatically generated after each completion
            </span>
            <span v-else-if="qualifyingMode === 'manual'">
              <i class="pi pi-pause-circle text-blue-600 mr-1" />
              Heats must be manually generated using the button below
            </span>
            <span v-else-if="qualifyingMode === 'brackets'">
              <i class="pi pi-flag text-purple-600 mr-1" />
              Qualifying finished - ready to generate tournament brackets
            </span>
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="flex flex-wrap gap-4">
          <button
            @click="regenerateHeats"
            :disabled="loading"
            class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            Generate Additional Heats
          </button>
          <button
            v-if="!currentHeat && upcomingHeats.length > 0"
            @click="startNextHeat"
            :disabled="loading"
            class="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
          >
            Start First Heat
          </button>
          <div class="text-sm text-gray-600 dark:text-gray-400 flex items-center">
            <i class="pi pi-info-circle mr-2" />
            Generates heats prioritizing racers with fewer attempts
          </div>
        </div>

        <!-- Qualifying Stats -->
        <div v-if="qualifyingStats" class="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <h3 class="text-md font-medium text-gray-900 dark:text-white mb-3">Qualifying Progress</h3>
          <div class="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
            <div class="text-center">
              <p class="text-2xl font-bold text-blue-600 dark:text-blue-400">{{ qualifyingStats.total_racers }}</p>
              <p class="text-gray-600 dark:text-gray-400">Total Racers</p>
            </div>
            <div class="text-center">
              <p class="text-2xl font-bold text-green-600 dark:text-green-400">{{ qualifyingStats.total_attempts }}</p>
              <p class="text-gray-600 dark:text-gray-400">Total Attempts</p>
            </div>
            <div class="text-center">
              <p class="text-2xl font-bold text-orange-600 dark:text-orange-400">{{ qualifyingStats.min_attempts }}</p>
              <p class="text-gray-600 dark:text-gray-400">Fewest Attempts</p>
            </div>
            <div class="text-center">
              <p class="text-2xl font-bold text-purple-600 dark:text-purple-400">{{ qualifyingStats.max_attempts }}</p>
              <p class="text-gray-600 dark:text-gray-400">Most Attempts</p>
            </div>
            <div class="text-center">
              <p class="text-2xl font-bold text-red-600 dark:text-red-400">{{ qualifyingStats.racers_with_min_attempts }}</p>
              <p class="text-gray-600 dark:text-gray-400">Need More Runs</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Error Display -->
      <div v-if="error" class="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg mb-6">
        <p class="text-red-800 dark:text-red-200">{{ error }}</p>
      </div>

      <!-- Current Heat -->
      <div v-if="currentHeat" class="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-6">
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Current Heat #{{ currentHeat.heat_number }}
        </h3>
        
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <!-- Track 1 -->
          <div class="border rounded-lg p-4 dark:border-gray-700">
            <h4 class="font-medium text-gray-900 dark:text-white mb-2">Track 1</h4>
            <div v-if="currentHeat.racers[0]" class="space-y-2">
              <div class="flex items-center gap-3">
                <img
                  v-if="currentHeat.racers[0].racer_image_url"
                  :src="currentHeat.racers[0].racer_image_url"
                  :alt="currentHeat.racers[0].racer_name"
                  class="w-12 h-12 rounded-full object-cover"
                >
                <div>
                  <p class="font-medium">{{ currentHeat.racers[0].racer_name }}</p>
                  <p class="text-sm text-gray-600 dark:text-gray-400">
                    Racer #{{ currentHeat.racers[0].racer_number }}
                  </p>
                </div>
              </div>
              <input
                v-model="track1Time"
                type="number"
                step="0.01"
                placeholder="Time (seconds)"
                class="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
              >
            </div>
          </div>

          <!-- Track 2 -->
          <div class="border rounded-lg p-4 dark:border-gray-700">
            <h4 class="font-medium text-gray-900 dark:text-white mb-2">Track 2</h4>
            <div v-if="currentHeat.racers[1]" class="space-y-2">
              <div class="flex items-center gap-3">
                <img
                  v-if="currentHeat.racers[1].racer_image_url"
                  :src="currentHeat.racers[1].racer_image_url"
                  :alt="currentHeat.racers[1].racer_name"
                  class="w-12 h-12 rounded-full object-cover"
                >
                <div>
                  <p class="font-medium">{{ currentHeat.racers[1].racer_name }}</p>
                  <p class="text-sm text-gray-600 dark:text-gray-400">
                    Racer #{{ currentHeat.racers[1].racer_number }}
                  </p>
                </div>
              </div>
              <input
                v-model="track2Time"
                type="number"
                step="0.01"
                placeholder="Time (seconds)"
                class="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
              >
            </div>
          </div>
        </div>

        <div class="mt-4 flex gap-3">
          <button
            @click="completeHeat"
            :disabled="loading || (!track1Time && !track2Time)"
            class="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
          >
            Complete Heat
          </button>
          <button
            @click="skipHeat"
            :disabled="loading"
            class="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 disabled:opacity-50"
          >
            Skip Heat
          </button>
        </div>
      </div>

      <!-- Upcoming Heats -->
      <div v-if="upcomingHeats.length > 0" class="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Upcoming Heats
        </h3>
        
        <div class="space-y-4">
          <div
            v-for="heat in upcomingHeats"
            :key="heat.heat_number"
            class="border rounded-lg p-4 dark:border-gray-700"
          >
            <div class="flex justify-between items-start mb-3">
              <h4 class="font-medium text-gray-900 dark:text-white">
                Heat #{{ heat.heat_number }}
              </h4>
              <button
                v-if="!currentHeat"
                @click="startSpecificHeat(heat.heat_number)"
                class="text-sm px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Start This Heat
              </button>
            </div>
            
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div v-for="racer in heat.racers" :key="racer.track_number" class="flex items-center gap-3">
                <span class="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Track {{ racer.track_number }}:
                </span>
                <img
                  v-if="racer.racer_image_url"
                  :src="racer.racer_image_url"
                  :alt="racer.racer_name"
                  class="w-8 h-8 rounded-full object-cover"
                >
                <div>
                  <p class="text-sm font-medium">{{ racer.racer_name }}</p>
                  <p class="text-xs text-gray-600 dark:text-gray-400">
                    #{{ racer.racer_number }}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- No Active Race -->
      <div v-else-if="!loading && !currentRace" class="bg-yellow-50 dark:bg-yellow-900/20 p-6 rounded-lg">
        <p class="text-yellow-800 dark:text-yellow-200">
          No active race found. Please set a race as active first.
        </p>
        <NuxtLink to="/races" class="mt-2 inline-block text-blue-600 hover:text-blue-800">
          Manage Races →
        </NuxtLink>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useHeats } from '~/composables/useHeats'
import { useNotifications } from '~/composables/useNotifications'

// Auth middleware
definePageMeta({
  middleware: 'admin'
})

// Composables
const heats = useHeats()
const { success: showSuccess, error: showError } = useNotifications()

// Local state
const track1Time = ref('')
const track2Time = ref('')
const qualifyingMode = ref('auto')
const qualifyingStats = ref(null)

// Computed
const { currentRace, currentHeat, upcomingHeats, loading, error } = heats

// Methods
const regenerateHeats = async () => {
  try {
    await heats.regenerateQualifiers()
    showSuccess('Heats regenerated successfully')
    track1Time.value = ''
    track2Time.value = ''
  } catch (err) {
    showError('Failed to regenerate heats')
  }
}

const startNextHeat = async () => {
  if (upcomingHeats.value.length > 0) {
    try {
      await heats.startHeat(upcomingHeats.value[0].heat_number)
      showSuccess('Heat started')
    } catch (err) {
      showError('Failed to start heat')
    }
  }
}

const startSpecificHeat = async (heatNumber) => {
  try {
    await heats.startHeat(heatNumber)
    showSuccess('Heat started')
  } catch (err) {
    showError('Failed to start heat')
  }
}

const completeHeat = async () => {
  try {
    await heats.completeCurrentHeat(
      track1Time.value ? parseFloat(track1Time.value) : null,
      track2Time.value ? parseFloat(track2Time.value) : null
    )
    showSuccess('Heat completed')
    track1Time.value = ''
    track2Time.value = ''
  } catch (err) {
    showError('Failed to complete heat')
  }
}

const skipHeat = async () => {
  try {
    await heats.completeCurrentHeat(null, null)
    showSuccess('Heat skipped')
    track1Time.value = ''
    track2Time.value = ''
  } catch (err) {
    showError('Failed to skip heat')
  }
}

const setQualifyingMode = async (mode) => {
  try {
    const { data } = await $fetch('/api/admin/qualifying-mode', {
      method: 'POST',
      body: { mode }
    })
    qualifyingMode.value = mode
    showSuccess(`Qualifying mode set to: ${mode}`)
  } catch (err) {
    showError('Failed to set qualifying mode')
  }
}

const fetchQualifyingStats = async () => {
  try {
    console.log('Fetching qualifying stats...')
    const response = await $fetch('/api/admin/qualifying-stats')
    console.log('Qualifying stats response:', response)
    qualifyingStats.value = response.data
  } catch (err) {
    console.error('Failed to fetch qualifying stats:', err)
    // Set default values if fetch fails
    qualifyingStats.value = {
      total_racers: 0,
      total_attempts: 0,
      min_attempts: 0,
      max_attempts: 0,
      avg_attempts: 0,
      racers_with_min_attempts: 0
    }
  }
}

// Initialize
onMounted(async () => {
  await heats.initialize()
  
  // Fetch current qualifying mode and stats
  try {
    const { data } = await $fetch('/api/admin/qualifying-mode')
    qualifyingMode.value = data?.qualifying_mode || 'auto'
  } catch (err) {
    console.error('Failed to fetch qualifying mode:', err)
  }

  await fetchQualifyingStats()
})

// Watch for changes in qualifiers and races to update stats reactively
watchEffect(async () => {
  // Trigger whenever currentRace, currentHeat, or upcomingHeats change
  if (currentRace.value) {
    await fetchQualifyingStats()
  }
})
</script>