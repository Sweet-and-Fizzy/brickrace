<template>
  <div class="min-h-screen bg-white dark:bg-gray-900">
    <div class="container mx-auto px-4 py-8">
      <PageHeader title="All Racers" :actions="headerActions" />

      <!-- Success Message -->
      <div v-if="route.query.created" class="mb-6">
        <Message severity="success" class="w-full">
          <div class="flex items-center gap-3">
            <i class="pi pi-check-circle text-lg" />
            <div>
              <strong>Racer created successfully!</strong>
              <p class="text-sm mt-1">
                Your new racer has been added to the competition. You can find it in the list below.
              </p>
            </div>
          </div>
        </Message>
      </div>

      <!-- Search and Filter -->
      <Card class="mb-6">
        <template #content>
          <div class="flex flex-col lg:flex-row gap-4">
            <!-- Search Section -->
            <div class="flex flex-col sm:flex-row gap-4 flex-1">
              <div class="flex-1">
                <AutoComplete
                  v-model="searchQuery"
                  :suggestions="searchSuggestions"
                  placeholder="Search by name, ID, or maker..."
                  class="w-full"
                  style="width: 100%"
                  input-style="width: 100%"
                  :complete-on-focus="true"
                  option-label="name"
                  :force-selection="false"
                  @complete="searchRacers"
                  @item-select="onRacerSelect"
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
                        />
                        <div
                          v-else
                          class="w-10 h-10 bg-white text-gray-800 flex items-center justify-center text-xs font-semibold border-2 border-gray-300 shadow-sm"
                          style="
                            border-radius: 8px 8px 8px 0;
                            font-family: 'Inter', sans-serif;
                            letter-spacing: 0.05em;
                            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
                            min-width: 40px;
                            text-align: center;
                          "
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
                          <span class="text-xs font-mono text-gray-500 dark:text-gray-400"
                            >#{{ slotProps.option.racer_number }}</span
                          >
                        </div>
                      </div>
                    </div>
                  </template>
                </AutoComplete>
              </div>
              <Button
                v-if="searchQuery"
                text
                severity="secondary"
                icon="pi pi-times"
                @click="clearSearch"
              >
                Clear
              </Button>
            </div>

            <!-- Sort and Filter Section -->
            <div class="flex flex-col sm:flex-row gap-4">
              <div class="w-full sm:w-36">
                <Select
                  v-model="sortCategory"
                  :options="sortCategoryOptions"
                  option-label="label"
                  option-value="value"
                  placeholder="Sort by"
                  class="w-full"
                  @change="onSortCategoryChange"
                />
              </div>
              <div class="w-full sm:w-40">
                <Select
                  v-model="sortBy"
                  :options="currentSortOptions"
                  option-label="label"
                  option-value="value"
                  placeholder="Select option"
                  class="w-full"
                  :disabled="!sortCategory"
                />
              </div>
              <div class="w-full sm:w-36">
                <Select
                  v-model="filterOption"
                  :options="filterOptions"
                  option-label="label"
                  option-value="value"
                  placeholder="Filter"
                  class="w-full"
                  show-clear
                />
              </div>
              <Button
                v-if="sortBy !== 'name' || filterOption"
                text
                severity="secondary"
                icon="pi pi-refresh"
                @click="resetFilters"
              >
                Reset
              </Button>
            </div>
          </div>
        </template>
      </Card>

      <!-- Loading State -->
      <LoadingGrid v-if="loading" :count="8" :columns="4" header-height="12rem" />

      <!-- Racers DataView -->
      <div v-else-if="filteredRacers.length" class="p-6">
        <DataView
          :value="filteredRacers"
          layout="grid"
          :pt="{
            root: { class: 'bg-transparent' },
            content: { class: 'bg-transparent' }
          }"
        >
          <template #grid="slotProps">
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              <div
                v-for="racer in slotProps.data || slotProps.items || []"
                :key="racer.id"
                class="cursor-pointer"
              >
                <NuxtLink :to="`/racers/${racer.id}`" class="block">
                  <Card
                    class="group hover:shadow-2xl hover:scale-[1.02] hover:-translate-y-2 transition-all duration-500 ease-out cursor-pointer border-2 border-gray-100 dark:border-gray-700 hover:border-red-400 dark:hover:border-red-500 rounded-2xl overflow-hidden bg-white dark:bg-gray-800 h-full relative"
                    style="box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05)"
                  >
                    <template #header>
                      <div class="relative overflow-hidden group/slideshow">
                        <!-- Mini Slideshow -->
                        <div
                          v-if="getAllRacerImages(racer).length > 1"
                          class="relative w-full h-48 overflow-hidden"
                        >
                          <!-- Single image with smooth transition -->
                          <div class="absolute inset-0">
                            <img
                              :key="getCurrentImage(racer)"
                              :src="getCurrentImage(racer)"
                              :alt="racer.name"
                              class="w-full h-48 object-cover transition-all duration-300 ease-in-out"
                            />
                          </div>

                          <!-- Glass Effect Navigation Arrows -->
                          <button
                            class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-700 hover:text-red-600 w-10 h-10 flex items-center justify-center opacity-0 group-hover/slideshow:opacity-100 transition-all duration-300 z-10"
                            style="
                              border-radius: 8px;
                              background: rgba(255, 255, 255, 0.2);
                              backdrop-filter: blur(12px);
                              border: 1px solid rgba(255, 255, 255, 0.3);
                              box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
                            "
                            @click.prevent="previousImage(racer)"
                          >
                            <i class="pi pi-chevron-left text-sm font-bold" />
                          </button>

                          <button
                            class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-700 hover:text-red-600 w-10 h-10 flex items-center justify-center opacity-0 group-hover/slideshow:opacity-100 transition-all duration-300 z-10"
                            style="
                              border-radius: 8px;
                              background: rgba(255, 255, 255, 0.2);
                              backdrop-filter: blur(12px);
                              border: 1px solid rgba(255, 255, 255, 0.3);
                              box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
                            "
                            @click.prevent="nextImage(racer)"
                          >
                            <i class="pi pi-chevron-right text-sm font-bold" />
                          </button>

                          <!-- Brick Stud Progress Indicators -->
                          <div class="absolute bottom-3 right-3 flex gap-1.5">
                            <div
                              v-for="(image, index) in getAllRacerImages(racer)"
                              :key="index"
                              class="w-3 h-3 rounded-full transition-all duration-300 border-2 shadow-sm"
                              :class="
                                getCurrentImageIndex(racer) === index
                                  ? 'bg-red-500 border-red-600 shadow-red-500/50'
                                  : 'bg-white bg-opacity-70 border-white border-opacity-80'
                              "
                              :style="
                                getCurrentImageIndex(racer) === index
                                  ? 'box-shadow: 0 0 8px rgba(239, 68, 68, 0.4), inset 0 1px 2px rgba(255,255,255,0.3)'
                                  : 'box-shadow: 0 1px 3px rgba(0,0,0,0.2), inset 0 1px 1px rgba(255,255,255,0.4)'
                              "
                            />
                          </div>
                        </div>

                        <!-- Single image or no image -->
                        <div v-else>
                          <Image
                            v-if="racer.image_url"
                            :src="racer.image_url"
                            :alt="racer.name"
                            image-class="w-full h-48 object-cover"
                            class="w-full h-48"
                            :preview="false"
                          />
                          <div
                            v-else
                            class="w-full h-48 bg-gray-200 dark:bg-gray-700 flex items-center justify-center"
                          >
                            <i class="pi pi-car text-4xl text-gray-400 dark:text-gray-500" />
                          </div>
                        </div>

                        <!-- Name Tag Badge -->
                        <div
                          class="absolute top-3 right-3 bg-white text-gray-800 px-3 py-1 text-sm font-semibold transition-all duration-300 transform group-hover:scale-105 border-2 border-gray-300 shadow-lg"
                          style="
                            border-radius: 12px 12px 12px 0;
                            font-family: 'Inter', sans-serif;
                            letter-spacing: 0.05em;
                            box-shadow:
                              0 4px 8px rgba(0, 0, 0, 0.15),
                              0 0 0 1px rgba(0, 0, 0, 0.05);
                            min-width: 40px;
                            text-align: center;
                          "
                        >
                          #{{ racer.racer_number }}
                        </div>
                      </div>
                    </template>

                    <template #content>
                      <div>
                        <!-- Racer Name -->
                        <div>
                          <h3
                            class="text-xl font-bold text-gray-900 dark:text-white leading-tight normal-case"
                          >
                            {{ racer.name || 'NO NAME FOUND' }}
                          </h3>
                        </div>

                        <!-- Times and Awards -->
                        <div class="mt-3 space-y-2">
                          <!-- Times -->
                          <div v-if="racer.qualifiers?.length" class="flex gap-2 flex-wrap">
                            <span
                              v-if="getTimeRange(racer)"
                              class="inline-flex items-center px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-lg shadow-sm"
                              style="font-family: 'Courier New', monospace; letter-spacing: 0.3px"
                            >
                              <i class="pi pi-clock mr-1.5 text-gray-500" />
                              {{ getTimeRange(racer) }}
                            </span>
                          </div>

                          <!-- Awards -->
                          <div v-if="racer.awards?.length" class="flex gap-2 flex-wrap">
                            <span
                              v-for="award in racer.awards"
                              :key="award.id"
                              class="inline-flex items-center px-3 py-1.5 text-xs font-medium text-yellow-700 dark:text-yellow-300 bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/30 dark:to-orange-900/30 border border-yellow-200 dark:border-yellow-600 rounded-lg shadow-sm"
                              style="font-weight: 600"
                            >
                              <i class="pi pi-star-fill mr-1.5 text-yellow-500" />
                              {{ award.award_definition?.name || 'Award' }}
                            </span>
                          </div>

                          <!-- Vote Counts -->
                          <div v-if="getVoteCounts(racer).length" class="flex gap-2 flex-wrap">
                            <span
                              v-for="vote in getVoteCounts(racer)"
                              :key="vote.awardId"
                              class="inline-flex items-center px-2.5 py-1 text-xs font-medium text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-600 rounded-md shadow-sm"
                            >
                              <i class="pi pi-heart-fill mr-1 text-red-500" />
                              {{ vote.count }} {{ vote.awardName }}
                            </span>
                          </div>
                        </div>
                      </div>
                    </template>
                  </Card>
                </NuxtLink>
              </div>
            </div>
          </template>
        </DataView>
      </div>

      <!-- No Results -->
      <div v-else class="text-center py-12">
        <i class="pi pi-car text-6xl text-gray-300 mb-4" />
        <h3 class="text-xl font-semibold text-gray-600 mb-2">
          {{ searchQuery ? 'No racers found' : 'No racers yet' }}
        </h3>
        <p class="text-gray-500 mb-6">
          {{
            searchQuery
              ? 'Try adjusting your search terms'
              : 'Be the first to add a racer to the competition!'
          }}
        </p>
        <NuxtLink v-if="authStore.isAuthenticated && !searchQuery" to="/racers/add">
          <Button>Add First Racer</Button>
        </NuxtLink>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useAuthStore } from '~/stores/auth'

const authStore = useAuthStore()
const route = useRoute()

// Use reactive composables
const {
  racers,
  voteableAwards,
  loading,
  getAllRacerImages,
  getTimeRange,
  getVoteCounts,
  initialize
} = useRacers()

// Search and filter state
const searchQuery = ref('')
const searchSuggestions = ref([])
const sortCategory = ref('name')
const sortBy = ref('name')
const filterOption = ref(null)

// Slideshow state
const slideshowState = ref(new Map())
const preloadedImages = ref(new Set())

// Header actions
const headerActions = computed(() => {
  if (authStore.isAuthenticated) {
    return [
      {
        label: 'Add Racer',
        icon: 'pi pi-plus',
        to: '/racers/add',
        class: 'btn-primary'
      }
    ]
  } else {
    return [
      {
        label: 'Login to Add Racer',
        icon: 'pi pi-sign-in',
        to: '/login',
        severity: 'secondary',
        outlined: true
      }
    ]
  }
})

// Sort and filter options
const sortCategoryOptions = ref([
  { label: 'Activity', value: 'activity' },
  { label: 'Date', value: 'date' },
  { label: 'Name', value: 'name' },
  { label: 'Performance', value: 'performance' },
  { label: 'Votes', value: 'community' }
])

const sortOptionsByCategory = ref({
  name: [
    { label: 'A-Z', value: 'name' },
    { label: 'Z-A', value: 'name-desc' }
  ],
  performance: [
    { label: 'Fastest Time', value: 'fastest' },
    { label: 'Slowest Time', value: 'slowest' }
  ],
  activity: [
    { label: 'Most Races', value: 'most-races' },
    { label: 'Most Awards', value: 'most-awards' }
  ],
  community: [],
  date: [
    { label: 'Newest First', value: 'newest' },
    { label: 'Oldest First', value: 'oldest' }
  ]
})

const filterOptions = [
  { label: 'Has Awards', value: 'has-awards' },
  { label: 'No Awards', value: 'no-awards' },
  { label: 'Has Race Times', value: 'has-times' },
  { label: 'No Race Times', value: 'no-times' }
]

// Update community sort options when voteable awards change
watch(
  voteableAwards,
  (awards) => {
    if (awards && awards.length > 0) {
      const voteOptions = awards
        .map((award) => ({
          label: award.name,
          value: `votes-${award.id}`
        }))
        .sort((a, b) => a.label.localeCompare(b.label))

      sortOptionsByCategory.value.community = voteOptions
    }
  },
  { immediate: true }
)

const currentSortOptions = computed(() => {
  return sortOptionsByCategory.value[sortCategory.value] || []
})

// Filter and sort racers
const filteredRacers = computed(() => {
  let result = [...racers.value]

  // Apply search filter
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter((racer) => {
      const name = racer.name?.toLowerCase() || ''
      const idNumber = racer.racer_number?.toString()?.toLowerCase() || ''
      const maker = racer.maker?.displayName?.toLowerCase() || ''

      return name.includes(query) || idNumber.includes(query) || maker.includes(query)
    })
  }

  // Apply additional filters
  if (filterOption.value) {
    switch (filterOption.value) {
      case 'has-awards':
        result = result.filter((racer) => racer.awards?.length > 0)
        break
      case 'no-awards':
        result = result.filter((racer) => !racer.awards?.length)
        break
      case 'has-times':
        result = result.filter((racer) => racer.qualifiers?.length > 0)
        break
      case 'no-times':
        result = result.filter((racer) => !racer.qualifiers?.length)
        break
    }
  }

  // Apply sorting
  switch (sortBy.value) {
    case 'name':
      result.sort((a, b) => (a.name || '').localeCompare(b.name || ''))
      break
    case 'name-desc':
      result.sort((a, b) => (b.name || '').localeCompare(a.name || ''))
      break
    case 'fastest':
      result.sort((a, b) => {
        const aFastest = getFastestTimeValue(a)
        const bFastest = getFastestTimeValue(b)
        if (aFastest === null && bFastest === null) return 0
        if (aFastest === null) return 1
        if (bFastest === null) return -1
        return aFastest - bFastest
      })
      break
    case 'slowest':
      result.sort((a, b) => {
        const aSlowest = getSlowestTimeValue(a)
        const bSlowest = getSlowestTimeValue(b)
        if (aSlowest === null && bSlowest === null) return 0
        if (aSlowest === null) return 1
        if (bSlowest === null) return -1
        return bSlowest - aSlowest
      })
      break
    case 'most-races':
      result.sort((a, b) => (b.qualifiers?.length || 0) - (a.qualifiers?.length || 0))
      break
    case 'most-awards':
      result.sort((a, b) => (b.awards?.length || 0) - (a.awards?.length || 0))
      break
    case 'newest':
      result.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      break
    case 'oldest':
      result.sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
      break
    default:
      // Handle vote-based sorting
      if (sortBy.value.startsWith('votes-')) {
        const awardId = sortBy.value.replace('votes-', '')
        result.sort((a, b) => {
          const aVotes = a.votesByAward?.[awardId] || 0
          const bVotes = b.votesByAward?.[awardId] || 0
          return bVotes - aVotes // Most votes first
        })
      }
      break
  }

  return result
})

// AutoComplete functionality
const searchRacers = (event) => {
  const query = event.query.toLowerCase()
  if (!query) {
    searchSuggestions.value = []
    return
  }

  const filtered = racers.value
    .filter((racer) => {
      const name = racer.name?.toLowerCase() || ''
      const idNumber = racer.racer_number?.toString()?.toLowerCase() || ''
      const maker = racer.maker?.displayName?.toLowerCase() || ''

      return name.includes(query) || idNumber.includes(query) || maker.includes(query)
    })
    .slice(0, 10) // Limit to 10 suggestions

  searchSuggestions.value = filtered
}

const onRacerSelect = (event) => {
  // Navigate to the selected racer
  navigateTo(`/racers/${event.value.id}`)
}

const clearSearch = () => {
  searchQuery.value = ''
  searchSuggestions.value = []
}

// Helper functions for sorting (return raw numbers)
const getFastestTimeValue = (racer) => {
  if (!racer.qualifiers?.length) return null
  const times = racer.qualifiers
    .map((q) => Number.parseFloat(q.time))
    .filter((t) => !Number.isNaN(t))
  if (times.length === 0) return null
  return Math.min(...times)
}

const getSlowestTimeValue = (racer) => {
  if (!racer.qualifiers?.length) return null
  const times = racer.qualifiers
    .map((q) => Number.parseFloat(q.time))
    .filter((t) => !Number.isNaN(t))
  if (times.length === 0) return null
  return Math.max(...times)
}

// Helper function to get vote counts for display

// Category change handler
const onSortCategoryChange = () => {
  const options = currentSortOptions.value
  if (options.length > 0) {
    sortBy.value = options[0].value
  } else {
    sortBy.value = null
  }
}

// Reset filters
const resetFilters = () => {
  sortCategory.value = 'name'
  sortBy.value = 'name'
  filterOption.value = null
}

// Slideshow functions
const getCurrentImage = (racer) => {
  const images = getAllRacerImages(racer)
  if (images.length === 0) return null

  const state = slideshowState.value.get(racer.id)
  if (!state) {
    return images[0] // Default to first image
  }

  return images[state.currentIndex] || images[0]
}

const getCurrentImageIndex = (racer) => {
  const state = slideshowState.value.get(racer.id)
  return state?.currentIndex || 0
}

// Preload images for smooth transitions
const preloadImages = (imageUrls) => {
  imageUrls.forEach((url) => {
    if (!preloadedImages.value.has(url)) {
      const img = new Image()
      img.onload = () => {
        preloadedImages.value.add(url)
      }
      img.onerror = () => {
        console.warn('Failed to preload image:', url)
      }
      img.src = url
    }
  })
}

const initializeSlideshowState = (racer) => {
  if (!slideshowState.value.has(racer.id)) {
    slideshowState.value.set(racer.id, { currentIndex: 0 })

    // Preload all images for this racer
    const images = getAllRacerImages(racer)
    if (images.length > 1) {
      preloadImages(images)
    }
  }
}

const nextImage = (racer) => {
  const images = getAllRacerImages(racer)
  if (images.length <= 1) return

  initializeSlideshowState(racer)
  const state = slideshowState.value.get(racer.id)
  state.currentIndex = (state.currentIndex + 1) % images.length

  // Trigger reactivity
  slideshowState.value = new Map(slideshowState.value)
}

const previousImage = (racer) => {
  const images = getAllRacerImages(racer)
  if (images.length <= 1) return

  initializeSlideshowState(racer)
  const state = slideshowState.value.get(racer.id)
  state.currentIndex = state.currentIndex === 0 ? images.length - 1 : state.currentIndex - 1

  // Trigger reactivity
  slideshowState.value = new Map(slideshowState.value)
}

// Initialize auth and fetch data
onMounted(async () => {
  await authStore.initAuth()
  await initialize()
})

useHead({
  title: 'All Racers - The Great Holyoke Brick Race',
  meta: [
    {
      name: 'description',
      content: 'Browse all brick car racers in the The Great Holyoke Brick Race competition.'
    }
  ]
})
</script>
