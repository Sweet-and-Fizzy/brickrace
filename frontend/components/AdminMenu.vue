<template>
  <div class="relative">
    <Button severity="secondary" outlined :size="size" @click="showMenu = !showMenu">
      <i class="pi pi-bars mr-2" />
      Menu
      <i :class="showMenu ? 'pi pi-chevron-up' : 'pi pi-chevron-down'" class="ml-2" />
    </Button>

    <!-- Admin Dropdown Menu -->
    <div
      v-if="showMenu"
      class="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-600 z-50"
      @click="showMenu = false"
    >
      <div class="py-2">
        <!-- Race-specific admin items -->
        <template v-if="raceId && activeRace">
          <div
            class="px-4 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider"
          >
            Race Management
          </div>
          <NuxtLink
            to="/awards/manage"
            class="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <i class="pi pi-trophy mr-2 text-yellow-600" />
            Awards
          </NuxtLink>
          <NuxtLink
            :to="`/races/${raceId}/brackets`"
            class="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <i class="pi pi-sitemap mr-2 text-purple-600" />
            Brackets
          </NuxtLink>
          <NuxtLink
            :to="`/races/${raceId}/checkin`"
            class="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <i class="pi pi-check mr-2 text-green-600" />
            Check-in Racers
          </NuxtLink>
          <NuxtLink
            to="/admin/heats"
            class="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <i class="pi pi-stopwatch mr-2 text-orange-600" />
            Heat Management
          </NuxtLink>
          <NuxtLink
            :to="`/races/${raceId}/qualifiers`"
            class="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <i class="pi pi-clock mr-2 text-blue-600" />
            Qualifiers
          </NuxtLink>
          <NuxtLink
            :to="`/races/${raceId}/my-status`"
            class="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <i class="pi pi-user mr-2 text-teal-600" />
            My Status
          </NuxtLink>
          <NuxtLink
            :to="`/races/${raceId}/edit`"
            class="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <i class="pi pi-pencil mr-2 text-gray-600" />
            Edit Race
          </NuxtLink>
          <hr class="my-2 border-gray-200 dark:border-gray-600" >
        </template>

        <!-- General admin items -->
        <div
          class="px-4 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider"
        >
          General
        </div>
        <NuxtLink
          to="/admin"
          class="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
        >
          <i class="pi pi-chart-line mr-2 text-indigo-600" />
          Admin Dashboard
        </NuxtLink>
        <NuxtLink
          to="/races"
          class="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
        >
          <i class="pi pi-flag mr-2 text-orange-600" />
          Manage Races
        </NuxtLink>
        <NuxtLink
          to="/racers"
          class="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
        >
          <i class="pi pi-users mr-2 text-green-600" />
          Manage Racers
        </NuxtLink>
        <NuxtLink
          :to="raceId ? `/admin/photos?race=${raceId}` : '/admin/photos'"
          class="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
        >
          <i class="pi pi-images mr-2 text-blue-600" />
          Manage Photos
        </NuxtLink>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  raceId: {
    type: String,
    default: null
  },
  size: {
    type: String,
    default: 'small'
  }
})

const showMenu = ref(false)

// Check if the current race is active
const activeRace = computed(() => {
  // This will be true if we're on a race-specific page and the race is active
  // For now, we'll show race-specific options whenever a raceId is provided
  return props.raceId
})

// Close menu when clicking outside
const handleClickOutside = (event) => {
  if (!event.target.closest('.relative')) {
    showMenu.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>
