<template>
  <div
    class="min-h-screen bg-white dark:bg-gray-900"
  >
    <!-- Header -->
    <div class="bg-white dark:bg-gray-900">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div class="text-center">
          <h1 class="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6">Photo Gallery</h1>
          <p class="text-xl md:text-2xl text-gray-600 dark:text-gray-400 max-w-4xl mx-auto">
            Explore the creativity and excitement of The Great Holyoke Brick Race through photos
            from our community
          </p>
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="flex justify-center py-12">
      <ProgressSpinner />
    </div>

    <!-- Main Content -->
    <div v-else class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- Filters and Search -->
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border dark:border-gray-700 mb-8">
        <div class="p-6">
          <div class="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
            <!-- Search and Filters -->
            <div class="flex flex-col sm:flex-row gap-3 flex-1">
              <div class="flex-1 relative">
                <i
                  class="pi pi-search absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                />
                <InputText
                  v-model="searchQuery"
                  placeholder="Search photos..."
                  class="w-full pl-10"
                  @input="onSearchChange"
                />
              </div>

              <Select
                v-model="selectedCategory"
                :options="categoryOptions"
                option-label="label"
                option-value="value"
                placeholder="Category"
                class="w-full sm:w-32"
                show-clear
                @change="applyFilters"
              />

              <Select
                v-model="selectedRace"
                :options="raceOptions"
                option-label="name"
                option-value="id"
                placeholder="Race"
                class="w-full sm:w-32"
                show-clear
                @change="applyFilters"
              />

              <Select
                v-model="selectedRacer"
                :options="racerOptions"
                option-label="name"
                option-value="id"
                placeholder="Racer"
                class="w-full sm:w-32"
                show-clear
                filter
                @change="applyFilters"
              />
            </div>
          </div>

          <!-- Active Filters -->
          <div
            v-if="activeFilters.length > 0"
            class="flex flex-wrap gap-2 mt-4 pt-4 border-t border-gray-200 dark:border-gray-600"
          >
            <span class="text-sm text-gray-600 dark:text-gray-400 mr-2">Active filters:</span>
            <Badge
              v-for="filter in activeFilters"
              :key="filter.key"
              :value="filter.label"
              severity="info"
              class="cursor-pointer"
              @click="removeFilter(filter)"
            >
              <template #default>
                {{ filter.label }}
                <i class="pi pi-times ml-1" />
              </template>
            </Badge>
          </div>
        </div>
      </div>

      <!-- Results Summary -->
      <div class="flex items-center justify-between mb-6">
        <p class="text-gray-600 dark:text-gray-400">
          Showing {{ filteredPhotos.length }} of {{ totalPhotos }} photos
        </p>

        <Select
          v-model="sortBy"
          :options="sortOptions"
          option-label="label"
          option-value="value"
          placeholder="Sort by"
          class="w-40"
          @change="applySort"
        />
      </div>

      <!-- Photo Grid -->
      <div
        class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6"
      >
        <div
          v-for="photo in paginatedPhotos"
          :key="photo.id"
          class="group cursor-pointer"
          @click="openGallery(filteredPhotos.indexOf(photo))"
        >
          <div
            class="relative overflow-hidden rounded-lg shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
          >
            <Image
              :src="photo.url"
              :alt="photo.title"
              image-class="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
              class="w-full h-48"
              :preview="false"
            />

            <!-- Overlay -->
            <div
              class="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all duration-300 flex items-center justify-center"
            >
              <i
                class="pi pi-search-plus text-white text-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
              />
            </div>

            <!-- Photo Info -->
            <div
              v-if="photo.title || photo.subtitle"
              class="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4"
            >
              <div v-if="photo.subtitle" class="flex items-center gap-2">
                <div
                  class="bg-white text-gray-800 px-2 py-1 text-xs font-semibold border-2 border-gray-300"
                  style="
                    border-radius: 8px 8px 8px 0;
                    font-family: 'Inter', sans-serif;
                    letter-spacing: 0.05em;
                    min-width: 32px;
                    text-align: center;
                  "
                >
                  #{{ photo.subtitle }}
                </div>
                <h4 class="font-semibold text-white text-sm">{{ photo.title }}</h4>
              </div>
              <h4 v-else class="font-semibold text-white text-sm mb-1">{{ photo.title }}</h4>
            </div>

            <!-- Featured Badge -->
            <div
              v-if="photo.featured"
              class="absolute top-3 right-3 bg-gradient-to-br from-red-500 to-orange-600 text-white rounded-full w-8 h-8 flex items-center justify-center border-2 border-red-400"
            >
              <i class="pi pi-star text-sm" />
            </div>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div v-if="filteredPhotos.length === 0" class="text-center py-12">
        <i class="pi pi-images text-6xl text-gray-300 dark:text-gray-600 mb-4" />
        <h3 class="text-xl font-semibold text-gray-600 dark:text-gray-400 mb-2">No Photos Found</h3>
        <p class="text-gray-500 dark:text-gray-500 mb-6">
          {{
            searchQuery || selectedCategory || selectedRace || selectedRacer
              ? 'Try adjusting your search criteria'
              : 'No photos have been uploaded yet'
          }}
        </p>
        <div class="flex flex-col sm:flex-row gap-3 justify-center">
          <Button outlined @click="clearAllFilters">
            <i class="pi pi-filter-slash mr-2" />
            Clear Filters
          </Button>
          <NuxtLink to="/my-photos">
            <Button>
              <i class="pi pi-plus mr-2" />
              Upload Photos
            </Button>
          </NuxtLink>
        </div>
      </div>

      <!-- Pagination -->
      <div v-if="totalPages > 1" class="flex justify-center mt-8">
        <Paginator
          v-model:first="currentPage"
          :rows="photosPerPage"
          :total-records="filteredPhotos.length"
          :rows-per-page-options="[20, 40, 60]"
          template="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink RowsPerPageDropdown"
        />
      </div>
    </div>

    <!-- Photo Gallery Lightbox -->
    <Galleria
      v-if="galleryImages.length > 0"
      v-model:visible="galleryVisible"
      v-model:active-index="activeImageIndex"
      :value="galleryImages"
      :responsive-options="galleryResponsiveOptions"
      :num-visible="5"
      container-style="max-width: 95vw; max-height: 95vh"
      :circular="true"
      :full-screen="true"
      :show-item-navigators="true"
      :show-thumbnails="true"
      :show-item-navigators-on-hover="true"
      :show-indicators="false"
      :change-item-on-indicator-hover="false"
    >
      <template #item="{ item }">
        <div class="flex justify-center items-center h-full">
          <img
            :src="item.itemImageSrc"
            :alt="item.alt"
            class="max-w-full max-h-full object-contain"
            style="max-height: 85vh"
          />
        </div>
      </template>

      <template #thumbnail="{ item }">
        <div class="grid grid-nogutter justify-center">
          <img
            :src="item.thumbnailImageSrc"
            :alt="item.alt"
            class="w-16 h-16 object-cover rounded"
          />
        </div>
      </template>

      <template v-if="galleryImages[activeImageIndex]?.hasCaption" #caption="{ item }">
        <div class="text-center p-4">
          <div v-if="item.subtitle" class="flex items-center justify-center gap-2 mb-2">
            <div
              class="bg-white text-gray-800 px-3 py-1 text-sm font-semibold border-2 border-gray-300"
              style="
                border-radius: 12px 12px 12px 0 !important;
                font-family: 'Inter', sans-serif !important;
                letter-spacing: 0.05em !important;
                min-width: 40px !important;
                text-align: center !important;
                box-shadow: none !important;
                filter: none !important;
                drop-shadow: none !important;
              "
            >
              #{{ item.subtitle }}
            </div>
            <h5 class="text-white text-lg font-semibold">{{ item.title }}</h5>
          </div>
          <h5 v-else-if="item.title" class="text-white text-lg font-semibold mb-2">
            {{ item.title }}
          </h5>
          <p v-if="item.credit" class="text-gray-400 text-xs">Photo by: {{ item.credit }}</p>
          <div v-if="item.featured" class="flex justify-center mt-3">
            <Badge value="Featured" severity="warning" />
          </div>
        </div>
      </template>
    </Galleria>
  </div>
</template>

<script setup>
// Use composables for data
const { loading: photosLoading, initialize: initializePhotos, approvedPhotos } = usePhotos()

const { races, loading: racesLoading, initialize: initializeRaces } = useRaces()

// Combined loading state
const loading = computed(() => photosLoading.value || racesLoading.value)

// State
const filteredPhotos = ref([])
const searchQuery = ref('')
const selectedCategory = ref(null)
const selectedRace = ref(null)
const selectedRacer = ref(null)
const sortBy = ref('newest')
const currentPage = ref(0)
const photosPerPage = ref(20)

// Gallery state
const galleryVisible = ref(false)
const activeImageIndex = ref(0)

// Options
const categoryOptions = ref([
  { label: 'Racer Photos', value: 'racer' },
  { label: 'Event/Crowd Photos', value: 'crowd' },
  { label: 'Setup/Behind the Scenes', value: 'setup' },
  { label: 'Awards Ceremony', value: 'awards' },
  { label: 'Track/Venue Photos', value: 'venue' },
  { label: 'Action Shots', value: 'action' },
  { label: 'General Photos', value: 'general' }
])

const sortOptions = ref([
  { label: 'Newest First', value: 'newest' },
  { label: 'Oldest First', value: 'oldest' },
  { label: 'Featured First', value: 'featured' },
  { label: 'By Race', value: 'race' }
])

const raceOptions = ref([])

const galleryResponsiveOptions = ref([
  { breakpoint: '1024px', numVisible: 5 },
  { breakpoint: '768px', numVisible: 3 },
  { breakpoint: '560px', numVisible: 1 }
])

// Computed properties
const totalPhotos = computed(() => approvedPhotos.value.length)

const racerOptions = computed(() => {
  // Get unique racers from approved photos
  const racers = new Map()
  approvedPhotos.value.forEach((photo) => {
    if (photo.type === 'racer' && photo.racerId && photo.racerName) {
      racers.set(photo.racerId, {
        id: photo.racerId,
        name: photo.racerName,
        number: photo.racerNumber
      })
    }
  })

  // Convert to array and sort by name
  return Array.from(racers.values()).sort((a, b) => a.name.localeCompare(b.name))
})

const activeFilters = computed(() => {
  const filters = []
  if (searchQuery.value) {
    filters.push({ key: 'search', label: `Search: "${searchQuery.value}"` })
  }
  if (selectedCategory.value) {
    const category = categoryOptions.value.find((c) => c.value === selectedCategory.value)
    filters.push({ key: 'category', label: `Category: ${category?.label}` })
  }
  if (selectedRace.value) {
    const race = raceOptions.value.find((r) => r.id === selectedRace.value)
    filters.push({ key: 'race', label: `Race: ${race?.name}` })
  }
  if (selectedRacer.value) {
    const racer = racerOptions.value.find((r) => r.id === selectedRacer.value)
    filters.push({ key: 'racer', label: `Racer: ${racer?.name}` })
  }
  return filters
})

const paginatedPhotos = computed(() => {
  const start = currentPage.value
  const end = start + photosPerPage.value
  return filteredPhotos.value.slice(start, end)
})

const totalPages = computed(() => Math.ceil(filteredPhotos.value.length / photosPerPage.value))

const galleryImages = computed(() => {
  return filteredPhotos.value.map((photo) => ({
    itemImageSrc: photo.url,
    thumbnailImageSrc: photo.url,
    alt: photo.title,
    title: photo.title,
    subtitle: photo.subtitle,
    description: photo.description,
    credit: photo.credit,
    featured: photo.featured,
    hasCaption: !!(photo.title || photo.subtitle || photo.description || photo.credit)
  }))
})

// Race options derived from composable
const raceOptionsComputed = computed(() =>
  races.value.map((race) => ({
    label: `${race.name} (${new Date(race.date).getFullYear()})`,
    value: race.id,
    ...race
  }))
)

// Update raceOptions when races change
watch(
  races,
  () => {
    raceOptions.value = raceOptionsComputed.value
  },
  { immediate: true }
)

const applyFilters = () => {
  let filtered = [...approvedPhotos.value]

  // Apply search filter
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(
      (photo) =>
        (photo.title &&
          typeof photo.title === 'string' &&
          photo.title.toLowerCase().includes(query)) ||
        (photo.subtitle &&
          typeof photo.subtitle === 'string' &&
          photo.subtitle.toLowerCase().includes(query)) ||
        (photo.description &&
          typeof photo.description === 'string' &&
          photo.description.toLowerCase().includes(query)) ||
        (photo.racerName &&
          typeof photo.racerName === 'string' &&
          photo.racerName.toLowerCase().includes(query)) ||
        (photo.raceName &&
          typeof photo.raceName === 'string' &&
          photo.raceName.toLowerCase().includes(query))
    )
  }

  // Apply category filter
  if (selectedCategory.value) {
    filtered = filtered.filter((photo) => photo.category === selectedCategory.value)
  }

  // Apply race filter
  if (selectedRace.value) {
    filtered = filtered.filter((photo) => photo.raceId === selectedRace.value)
  }

  // Apply racer filter
  if (selectedRacer.value) {
    // Handle both object and ID formats from AutoComplete
    const racerId =
      typeof selectedRacer.value === 'object' ? selectedRacer.value.id : selectedRacer.value

    filtered = filtered.filter((photo) => photo.type === 'racer' && photo.racerId === racerId)
  }

  filteredPhotos.value = filtered
  applySort()
  currentPage.value = 0
}

const applySort = () => {
  switch (sortBy.value) {
    case 'newest':
      filteredPhotos.value.sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt))
      break
    case 'oldest':
      filteredPhotos.value.sort((a, b) => new Date(a.uploadedAt) - new Date(b.uploadedAt))
      break
    case 'featured':
      filteredPhotos.value.sort((a, b) => {
        if (a.featured && !b.featured) return -1
        if (!a.featured && b.featured) return 1
        return new Date(b.uploadedAt) - new Date(a.uploadedAt)
      })
      break
    case 'race':
      filteredPhotos.value.sort((a, b) => {
        const raceA = a.raceName || 'ZZZ'
        const raceB = b.raceName || 'ZZZ'
        return raceA.localeCompare(raceB)
      })
      break
  }
}

let searchTimeout

const onSearchChange = () => {
  // Debounce search
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    applyFilters()
  }, 300)
}

const removeFilter = (filter) => {
  switch (filter.key) {
    case 'search':
      searchQuery.value = ''
      break
    case 'category':
      selectedCategory.value = null
      break
    case 'race':
      selectedRace.value = null
      break
    case 'racer':
      selectedRacer.value = null
      break
  }
  applyFilters()
}

const clearAllFilters = () => {
  searchQuery.value = ''
  selectedCategory.value = null
  selectedRace.value = null
  selectedRacer.value = null
  applyFilters()
}

const openGallery = (index) => {
  activeImageIndex.value = index
  galleryVisible.value = true
}

// Initialize using composables
onMounted(async () => {
  await Promise.all([initializePhotos({ status: 'approved' }), initializeRaces()])
  applyFilters()
})

// Watch for photo changes and reapply filters
watch(
  approvedPhotos,
  () => {
    applyFilters()
  },
  { deep: true }
)

// Watch for racer filter changes to reset pagination
watch(selectedRacer, () => {
  currentPage.value = 0
})

useHead({
  title: 'Photo Gallery - The Great Holyoke Brick Race',
  meta: [
    {
      name: 'description',
      content:
        'Browse photos from The Great Holyoke Brick Race community. View racer galleries, event photos, and behind-the-scenes shots.'
    }
  ]
})
</script>

<style>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* Custom gallery styling */
:deep(.p-galleria-thumbnail-item) {
  border-radius: 0.5rem;
  overflow: hidden;
}

:deep(.p-galleria-thumbnail-item.p-galleria-thumbnail-item-current) {
  border: 2px solid #3b82f6;
}

/* Main galleria container - semi-transparent dark background for lightbox feel */
.p-galleria {
  background: rgba(0, 0, 0, 0.6) !important;
}

/* Thumbnail area - dark background */
.p-galleria-thumbnails {
  background: rgba(0, 0, 0, 0.8) !important;
  backdrop-filter: blur(10px) !important;
  -webkit-backdrop-filter: blur(10px) !important;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4) !important;
  padding: 0 !important;
  margin: 0 !important;
}

.p-galleria-thumbnails-content {
  background: rgba(0, 0, 0, 0.8) !important;
  padding: 0 !important;
}

.p-galleria-thumbnails-viewport {
  background: rgba(0, 0, 0, 0.8) !important;
}

.p-galleria-thumbnail-items {
  background: rgba(0, 0, 0, 0.8) !important;
}

/* Glass styling for thumbnail navigation buttons */
:deep(.p-galleria-thumbnail-prev-button),
:deep(.p-galleria-thumbnail-next-button) {
  background: rgba(255, 255, 255, 0.2) !important;
  backdrop-filter: blur(10px) !important;
  -webkit-backdrop-filter: blur(10px) !important;
  border: 2px solid rgba(255, 255, 255, 0.3) !important;
  border-radius: 50% !important;
  box-shadow:
    0 4px 16px rgba(0, 0, 0, 0.3),
    inset 0 1px 2px rgba(255, 255, 255, 0.4) !important;
  transition: all 0.3s ease !important;
  width: 40px !important;
  height: 40px !important;
}

:deep(.p-galleria-thumbnail-prev-button:hover),
:deep(.p-galleria-thumbnail-next-button:hover) {
  background: rgba(255, 255, 255, 0.3) !important;
  backdrop-filter: blur(15px) !important;
  -webkit-backdrop-filter: blur(15px) !important;
  border: 2px solid rgba(255, 255, 255, 0.5) !important;
  box-shadow:
    0 8px 24px rgba(0, 0, 0, 0.4),
    inset 0 2px 4px rgba(255, 255, 255, 0.5) !important;
  transform: scale(1.05) !important;
}

/* Glass navigation buttons */
.p-galleria-nav-button {
  background: rgba(255, 255, 255, 0.2) !important;
  backdrop-filter: blur(10px) !important;
  -webkit-backdrop-filter: blur(10px) !important;
  border: 2px solid rgba(255, 255, 255, 0.3) !important;
  border-radius: 50% !important;
  box-shadow:
    0 8px 32px rgba(0, 0, 0, 0.3),
    inset 0 1px 2px rgba(255, 255, 255, 0.4) !important;
  transition: all 0.3s ease !important;
  width: 56px !important;
  height: 56px !important;
}

.p-galleria-nav-button:hover {
  background: rgba(255, 255, 255, 0.3) !important;
  backdrop-filter: blur(15px) !important;
  -webkit-backdrop-filter: blur(15px) !important;
  border: 2px solid rgba(255, 255, 255, 0.5) !important;
  box-shadow:
    0 12px 40px rgba(0, 0, 0, 0.4),
    inset 0 2px 4px rgba(255, 255, 255, 0.5) !important;
  transform: scale(1.1) !important;
}

.p-galleria-nav-button:active {
  transform: scale(0.9) !important;
  box-shadow:
    0 4px 16px rgba(0, 0, 0, 0.4),
    inset 0 1px 2px rgba(255, 255, 255, 0.3) !important;
}

/* Glass caption area - ultra subtle, only show if content exists */
.p-galleria-caption {
  background: rgba(255, 255, 255, 0.03) !important;
  backdrop-filter: blur(6px) !important;
  -webkit-backdrop-filter: blur(6px) !important;
  border: 1px solid rgba(255, 255, 255, 0.08) !important;
  margin: 0 !important;
  padding: 12px 16px !important;
  box-shadow:
    0 2px 8px rgba(0, 0, 0, 0.08),
    inset 0 1px 2px rgba(255, 255, 255, 0.15) !important;
}

/* Dark text shadow for better contrast on white text - but not on badges */
.p-galleria-caption h5,
.p-galleria-caption p {
  text-shadow:
    0 1px 2px rgba(0, 0, 0, 0.9),
    0 0 4px rgba(0, 0, 0, 0.7) !important;
}

/* Hide caption completely if it's empty */
.p-galleria-caption:empty {
  display: none !important;
}

/* Make the lightbox mask more opaque for better contrast */
.p-galleria-mask {
  background-color: rgba(0, 0, 0, 0.8) !important;
}

/* Glass styling for close button */
:deep(.p-galleria-close) {
  background: rgba(255, 255, 255, 0.2) !important;
  backdrop-filter: blur(10px) !important;
  -webkit-backdrop-filter: blur(10px) !important;
  border: 2px solid rgba(255, 255, 255, 0.3) !important;
  border-radius: 50% !important;
  box-shadow:
    0 8px 32px rgba(0, 0, 0, 0.3),
    inset 0 1px 2px rgba(255, 255, 255, 0.4) !important;
  transition: all 0.3s ease !important;
  width: 56px !important;
  height: 56px !important;
}

:deep(.p-galleria-close:hover) {
  background: rgba(255, 255, 255, 0.3) !important;
  backdrop-filter: blur(15px) !important;
  -webkit-backdrop-filter: blur(15px) !important;
  border: 2px solid rgba(255, 255, 255, 0.5) !important;
  box-shadow:
    0 12px 40px rgba(0, 0, 0, 0.4),
    inset 0 2px 4px rgba(255, 255, 255, 0.5) !important;
  transform: scale(1.1) !important;
}
</style>
