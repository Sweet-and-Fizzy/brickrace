<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- Header -->
      <div class="mb-8">
        <div class="flex flex-col md:flex-row md:items-start md:justify-between">
          <div>
            <h1 class="text-3xl font-bold text-gray-900 dark:text-white mb-2">Heat Management</h1>
            <p class="text-gray-600 dark:text-gray-300">Manage qualifier heats and times</p>
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
              :disabled="loading"
              :class="
                qualifyingMode === 'auto'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              "
              class="px-4 py-2 rounded-md font-medium transition-colors disabled:opacity-50"
              @click="setQualifyingMode('auto')"
            >
              <i class="pi pi-sync mr-2" />
              Auto Generate
            </button>
            <button
              :disabled="loading"
              :class="
                qualifyingMode === 'manual'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              "
              class="px-4 py-2 rounded-md font-medium transition-colors disabled:opacity-50"
              @click="setQualifyingMode('manual')"
            >
              <i class="pi pi-hand-paper mr-2" />
              Manual Control
            </button>
            <button
              :disabled="loading"
              :class="
                qualifyingMode === 'brackets'
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              "
              class="px-4 py-2 rounded-md font-medium transition-colors disabled:opacity-50"
              @click="setQualifyingMode('brackets')"
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
            :disabled="loading"
            class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            @click="regenerateHeats"
          >
            Generate Additional Heats
          </button>
          <button
            :disabled="loading"
            class="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50"
            @click="showManualHeatDialog = true"
          >
            <i class="pi pi-plus mr-2" />
            Create Manual Heat
          </button>
          <button
            v-if="!currentHeat && upcomingHeats.length > 0"
            :disabled="loading"
            class="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
            @click="startNextHeat"
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
          <h3 class="text-md font-medium text-gray-900 dark:text-white mb-3">
            Qualifying Progress
          </h3>
          <div class="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
            <div class="text-center">
              <p class="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {{ qualifyingStats.total_racers }}
              </p>
              <p class="text-gray-600 dark:text-gray-400">Total Racers</p>
            </div>
            <div class="text-center">
              <p class="text-2xl font-bold text-green-600 dark:text-green-400">
                {{ qualifyingStats.total_attempts }}
              </p>
              <p class="text-gray-600 dark:text-gray-400">Total Attempts</p>
            </div>
            <div class="text-center">
              <p class="text-2xl font-bold text-orange-600 dark:text-orange-400">
                {{ qualifyingStats.min_attempts }}
              </p>
              <p class="text-gray-600 dark:text-gray-400">Fewest Attempts</p>
            </div>
            <div class="text-center">
              <p class="text-2xl font-bold text-purple-600 dark:text-purple-400">
                {{ qualifyingStats.max_attempts }}
              </p>
              <p class="text-gray-600 dark:text-gray-400">Most Attempts</p>
            </div>
            <div class="text-center">
              <p class="text-2xl font-bold text-red-600 dark:text-red-400">
                {{ qualifyingStats.racers_with_min_attempts }}
              </p>
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
            :disabled="loading || (!track1Time && !track2Time)"
            class="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
            @click="completeHeat"
          >
            Complete Heat
          </button>
          <button
            :disabled="loading"
            class="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 disabled:opacity-50"
            @click="skipHeat"
          >
            Skip Heat
          </button>
        </div>
      </div>

      <!-- Upcoming Heats -->
      <div
        v-if="upcomingHeats.length > 0"
        class="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6"
      >
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Upcoming Heats</h3>

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
              <div v-if="!currentHeat" class="flex gap-2">
                <button
                  class="text-sm px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                  @click="startSpecificHeat(heat.heat_number)"
                >
                  Start This Heat
                </button>
                <button
                  class="text-sm px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700"
                  @click="setAsCurrentHeat(heat.heat_number)"
                >
                  Set as Current
                </button>
              </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div
                v-for="racer in heat.racers"
                :key="racer.track_number"
                class="flex items-center gap-3"
              >
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
                  <p class="text-xs text-gray-600 dark:text-gray-400">#{{ racer.racer_number }}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- No Active Race -->
      <div
        v-else-if="!loading && !currentRace"
        class="bg-yellow-50 dark:bg-yellow-900/20 p-6 rounded-lg"
      >
        <p class="text-yellow-800 dark:text-yellow-200">
          No active race found. Please set a race as active first.
        </p>
        <NuxtLink to="/races" class="mt-2 inline-block text-blue-600 hover:text-blue-800">
          Manage Races →
        </NuxtLink>
      </div>

      <!-- Manual Heat Creation Dialog -->
      <Dialog
        v-model:visible="showManualHeatDialog"
        modal
        header="Create Manual Heat"
        :style="{ width: '50rem' }"
        :breakpoints="{ '1199px': '75vw', '575px': '90vw' }"
      >
        <div class="space-y-6">
          <p class="text-gray-600 dark:text-gray-300">
            Create a custom heat with specific racers. This is useful for creating special matchups
            or filling specific heat numbers.
          </p>

          <!-- Heat Number -->
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Heat Number
            </label>
            <InputNumber
              v-model="manualHeat.heatNumber"
              :min="1"
              placeholder="Auto (next available)"
              class="w-full"
            />
            <small class="text-gray-500 dark:text-gray-400">
              Leave empty for auto-increment, or specify to fill gaps in heat numbering
            </small>
          </div>

          <!-- Track 1 Racer -->
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Track 1 Racer
            </label>
            <Dropdown
              v-model="manualHeat.track1Racer"
              :options="availableRacers"
              option-label="display_name"
              option-value="id"
              placeholder="Select racer for Track 1"
              class="w-full"
              filter
            >
              <template #option="{ option }">
                <div class="flex items-center gap-3">
                  <img
                    v-if="option.image_url"
                    :src="option.image_url"
                    :alt="option.name"
                    class="w-8 h-8 rounded-full object-cover"
                  >
                  <div
                    v-else
                    class="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center"
                  >
                    <i class="pi pi-car text-gray-500 text-sm" />
                  </div>
                  <div>
                    <div class="font-medium">{{ option.name }}</div>
                    <div class="text-sm text-gray-500">#{{ option.racer_number }}</div>
                  </div>
                </div>
              </template>
            </Dropdown>
          </div>

          <!-- Track 2 Racer -->
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Track 2 Racer
            </label>
            <Dropdown
              v-model="manualHeat.track2Racer"
              :options="availableRacers"
              option-label="display_name"
              option-value="id"
              placeholder="Select racer for Track 2"
              class="w-full"
              filter
            >
              <template #option="{ option }">
                <div class="flex items-center gap-3">
                  <img
                    v-if="option.image_url"
                    :src="option.image_url"
                    :alt="option.name"
                    class="w-8 h-8 rounded-full object-cover"
                  >
                  <div
                    v-else
                    class="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center"
                  >
                    <i class="pi pi-car text-gray-500 text-sm" />
                  </div>
                  <div>
                    <div class="font-medium">{{ option.name }}</div>
                    <div class="text-sm text-gray-500">#{{ option.racer_number }}</div>
                  </div>
                </div>
              </template>
            </Dropdown>
          </div>

          <!-- Options -->
          <div class="flex items-center gap-3">
            <Checkbox v-model="manualHeat.setAsCurrent" binary input-id="setAsCurrent" />
            <label for="setAsCurrent" class="text-sm font-medium text-gray-700 dark:text-gray-300">
              Set as current heat immediately
            </label>
          </div>
        </div>

        <template #footer>
          <Button label="Cancel" severity="secondary" @click="showManualHeatDialog = false" />
          <Button
            label="Create Heat"
            :loading="loading"
            :disabled="!manualHeat.track1Racer && !manualHeat.track2Racer"
            @click="createManualHeat"
          />
        </template>
      </Dialog>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, watchEffect } from 'vue'
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
const showManualHeatDialog = ref(false)
const availableRacers = ref([])
const manualHeat = ref({
  heatNumber: null,
  track1Racer: null,
  track2Racer: null,
  setAsCurrent: false
})

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
      track1Time.value ? Number.parseFloat(track1Time.value) : null,
      track2Time.value ? Number.parseFloat(track2Time.value) : null
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

const fetchAvailableRacers = async () => {
  if (!currentRace.value) return

  try {
    const { data } = await $fetch(`/api/races/${currentRace.value.id}/checked-in-racers`)
    availableRacers.value = data.map((racer) => ({
      ...racer,
      display_name: `${racer.name} (#${racer.racer_number})`
    }))
  } catch (err) {
    console.error('Failed to fetch available racers:', err)
    showError('Failed to load available racers')
  }
}

const createManualHeat = async () => {
  try {
    const response = await $fetch('/api/admin/heats/create-manual', {
      method: 'POST',
      body: {
        race_id: currentRace.value.id,
        heat_number: manualHeat.value.heatNumber, // Let server auto-increment if null
        track1_racer_id: manualHeat.value.track1Racer,
        track2_racer_id: manualHeat.value.track2Racer,
        set_as_current: manualHeat.value.setAsCurrent
      }
    })

    if (response.error) {
      throw new Error(response.error)
    }

    showSuccess(`Manual heat #${response.data.heat_number} created successfully`)

    // Reset form
    manualHeat.value = {
      heatNumber: null,
      track1Racer: null,
      track2Racer: null,
      setAsCurrent: false
    }
    showManualHeatDialog.value = false

    // Refresh data
    await heats.fetchCurrentRaceData()
  } catch (err) {
    console.error('Failed to create manual heat:', err)
    showError(err.message || 'Failed to create manual heat')
  }
}

const setAsCurrentHeat = async (heatNumber) => {
  try {
    await heats.startHeat(heatNumber)
    showSuccess(`Heat #${heatNumber} set as current`)
  } catch (err) {
    showError('Failed to set heat as current')
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
  await fetchAvailableRacers()
})

// Watch for dialog opening to refresh racer list
watch(showManualHeatDialog, async (newValue) => {
  if (newValue) {
    await fetchAvailableRacers()
  }
})

// Watch for changes in qualifiers and races to update stats reactively
watchEffect(async () => {
  // Trigger whenever currentRace, currentHeat, or upcomingHeats change
  if (currentRace.value) {
    await fetchQualifyingStats()
  }
})
</script>
