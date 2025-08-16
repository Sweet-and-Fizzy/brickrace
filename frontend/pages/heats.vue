<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
    <PageHeader
      title="Current Heats"
      description="Live qualifier heat progress"
    />

    <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- Loading State -->
      <LoadingGrid v-if="loading" :count="3" />

      <!-- Current Heat Display -->
      <div v-else-if="currentHeat" class="space-y-6">
        <!-- Current Heat -->
        <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8">
          <div class="text-center mb-6">
            <h2 class="text-3xl font-bold text-gray-900 dark:text-white">
              Heat #{{ currentHeat.heat_number }}
            </h2>
            <p class="text-lg text-green-600 dark:text-green-400 mt-2">
              <i class="pi pi-circle-fill animate-pulse mr-2" />
              Currently Racing
            </p>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
            <!-- Track 1 -->
            <div class="text-center">
              <h3 class="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-4">
                Track 1
              </h3>
              <div v-if="currentHeat.racers[0]" class="space-y-3">
                <img
                  v-if="currentHeat.racers[0].racer_image_url"
                  :src="currentHeat.racers[0].racer_image_url"
                  :alt="currentHeat.racers[0].racer_name"
                  class="w-32 h-32 rounded-lg object-cover mx-auto shadow-md"
                >
                <div v-else class="w-32 h-32 bg-gray-200 dark:bg-gray-700 rounded-lg mx-auto flex items-center justify-center">
                  <i class="pi pi-user text-4xl text-gray-400" />
                </div>
                <h4 class="text-2xl font-bold text-gray-900 dark:text-white">
                  {{ currentHeat.racers[0].racer_name }}
                </h4>
                <p class="text-lg text-gray-600 dark:text-gray-400">
                  Racer #{{ currentHeat.racers[0].racer_number }}
                </p>
              </div>
            </div>

            <!-- VS Divider -->
            <div class="hidden md:flex items-center justify-center">
              <div class="text-4xl font-bold text-gray-400 dark:text-gray-600">VS</div>
            </div>

            <!-- Track 2 -->
            <div class="text-center">
              <h3 class="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-4">
                Track 2
              </h3>
              <div v-if="currentHeat.racers[1]" class="space-y-3">
                <img
                  v-if="currentHeat.racers[1].racer_image_url"
                  :src="currentHeat.racers[1].racer_image_url"
                  :alt="currentHeat.racers[1].racer_name"
                  class="w-32 h-32 rounded-lg object-cover mx-auto shadow-md"
                >
                <div v-else class="w-32 h-32 bg-gray-200 dark:bg-gray-700 rounded-lg mx-auto flex items-center justify-center">
                  <i class="pi pi-user text-4xl text-gray-400" />
                </div>
                <h4 class="text-2xl font-bold text-gray-900 dark:text-white">
                  {{ currentHeat.racers[1].racer_name }}
                </h4>
                <p class="text-lg text-gray-600 dark:text-gray-400">
                  Racer #{{ currentHeat.racers[1].racer_number }}
                </p>
              </div>
            </div>
          </div>
        </div>

        <!-- Upcoming Heats -->
        <div v-if="upcomingHeats.length > 0" class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
          <h3 class="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Up Next
          </h3>
          
          <div class="space-y-4">
            <div
              v-for="(heat, index) in upcomingHeats.slice(0, 3)"
              :key="heat.heat_number"
              class="border-l-4 pl-4"
              :class="index === 0 ? 'border-blue-500' : 'border-gray-300 dark:border-gray-600'"
            >
              <h4 class="font-semibold text-gray-900 dark:text-white mb-2">
                Heat #{{ heat.heat_number }}
                <span v-if="index === 0" class="ml-2 text-sm text-blue-600 dark:text-blue-400">
                  (Next)
                </span>
              </h4>
              
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div v-for="racer in heat.racers" :key="racer.track_number" class="flex items-center gap-3">
                  <img
                    v-if="racer.racer_image_url"
                    :src="racer.racer_image_url"
                    :alt="racer.racer_name"
                    class="w-10 h-10 rounded-full object-cover"
                  >
                  <div v-else class="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
                    <i class="pi pi-user text-gray-400" />
                  </div>
                  <div>
                    <p class="font-medium text-gray-900 dark:text-white">
                      {{ racer.racer_name }}
                    </p>
                    <p class="text-sm text-gray-600 dark:text-gray-400">
                      Track {{ racer.track_number }} • #{{ racer.racer_number }}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- No Active Heat -->
      <div v-else-if="!loading && currentRace" class="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-8 text-center">
        <i class="pi pi-info-circle text-4xl text-gray-400 mb-4" />
        <h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          No Active Heat
        </h3>
        <p class="text-gray-600 dark:text-gray-400">
          Heats will begin soon. Check back for live updates!
        </p>
      </div>

      <!-- No Active Race -->
      <div v-else-if="!loading && !currentRace" class="bg-yellow-50 dark:bg-yellow-900/20 p-8 rounded-lg text-center">
        <i class="pi pi-exclamation-triangle text-4xl text-yellow-600 mb-4" />
        <h3 class="text-xl font-semibold text-yellow-800 dark:text-yellow-200 mb-2">
          No Active Race
        </h3>
        <p class="text-yellow-700 dark:text-yellow-300">
          There is no active race at this time.
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import { useHeats } from '~/composables/useHeats'

// Page meta
useHead({
  title: 'Current Heats - The Great Holyoke Brick Race'
})

// Composables
const heats = useHeats()
const { currentRace, currentHeat, upcomingHeats, loading } = heats

// Lifecycle - the composable handles real-time subscriptions automatically
onMounted(async () => {
  await heats.initialize()
})
</script>