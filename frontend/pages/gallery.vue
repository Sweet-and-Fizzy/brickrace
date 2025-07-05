<template>
  <div class="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50 dark:bg-gradient-to-br dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
    <!-- Header -->
    <div class="bg-gradient-to-r from-red-600 to-red-800 text-white">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div class="text-center">
          <h1 class="text-4xl md:text-5xl font-bold mb-6">📸 Photo Gallery</h1>
          <p class="text-xl md:text-2xl text-red-100 max-w-4xl mx-auto">
            Explore the creativity and excitement of The Great Holyoke Brick Race through photos
            from our community
          </p>
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="pending" class="flex justify-center py-12">
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
              <div class="flex-1">
                <InputText
                  v-model="searchQuery"
                  placeholder="Search photos..."
                  class="w-full"
                  @input="onSearchChange"
                >
                  <template #prefix>
                    <i class="pi pi-search" />
                  </template>
                </InputText>
              </div>

              <Select
                v-model="selectedCategory"
                :options="categoryOptions"
                option-label="label"
                option-value="value"
                placeholder="All Categories"
                class="w-full sm:w-48"
                show-clear
                @change="applyFilters"
              />

              <Select
                v-model="selectedRace"
                :options="raceOptions"
                option-label="name"
                option-value="id"
                placeholder="All Races"
                class="w-full sm:w-48"
                show-clear
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
                <Badge :value="`#${photo.subtitle}`" severity="info" class="text-xs" />
                <h4 class="font-semibold text-white text-sm">{{ photo.title }}</h4>
              </div>
              <h4 v-else class="font-semibold text-white text-sm mb-1">{{ photo.title }}</h4>
            </div>

            <!-- Featured Badge -->
            <div
              v-if="photo.featured"
              class="absolute top-3 right-3 bg-yellow-500 text-white rounded-full w-8 h-8 flex items-center justify-center shadow-lg"
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
            searchQuery || selectedCategory || selectedRace
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
          >
        </div>
      </template>

      <template #thumbnail="{ item }">
        <div class="grid grid-nogutter justify-center">
          <img
            :src="item.thumbnailImageSrc"
            :alt="item.alt"
            class="w-16 h-16 object-cover rounded"
          >
        </div>
      </template>

      <template v-if="galleryImages[activeImageIndex]?.hasCaption" #caption="{ item }">
        <div class="text-center p-4">
          <div v-if="item.subtitle" class="flex items-center justify-center gap-2 mb-2">
            <Badge :value="`#${item.subtitle}`" severity="info" class="text-xs" />
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
const { $supabase } = useNuxtApp()

// State
const pending = ref(true)
const allPhotos = ref([])
const filteredPhotos = ref([])
const searchQuery = ref('')
const selectedCategory = ref(null)
const selectedRace = ref(null)
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
const totalPhotos = computed(() => allPhotos.value.length)

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
    hasCaption: !!(
      photo.title ||
      photo.subtitle ||
      photo.description ||
      photo.credit ||
      photo.featured
    )
  }))
})

// Methods
const fetchPhotos = async () => {
  try {
    const photos = []

    // Fetch approved general photos
    const { data: generalPhotos, error: generalError } = await $supabase
      .from('general_photos')
      .select('*')
      .eq('status', 'approved')
      .order('uploaded_at', { ascending: false })

    if (generalError) {
      console.error('Error fetching general photos:', generalError)
    } else {
      for (const photo of generalPhotos || []) {
        photos.push({
          id: `general-${photo.id}`,
          url: photo.url,
          title: photo.description || '',
          subtitle: '',
          description: photo.description,
          credit: photo.credit,
          category: photo.category,
          categoryLabel: getCategoryLabel(photo.category),
          featured: photo.featured,
          uploadedAt: photo.uploaded_at,
          type: 'general',
          raceId: photo.race_id,
          raceName: null
        })
      }
    }

    // Fetch racer photos
    const { data: racerData, error: racerError } = await $supabase
      .from('racers')
      .select('id, name, racer_number, photos, created_at')
      .not('photos', 'is', null)
      .order('created_at', { ascending: false })

    if (racerError) {
      console.error('Error fetching racer photos:', racerError)
    } else {
      for (const racer of racerData || []) {
        if (racer.photos && Array.isArray(racer.photos)) {
          for (const [index, photo] of racer.photos.entries()) {
            // Only include approved racer photos in public gallery
            const photoStatus = photo.status || 'approved'
            if (photoStatus === 'approved') {
              photos.push({
                id: `racer-${racer.id}-${index}`,
                url: photo.url || photo,
                title: racer.name,
                subtitle: racer.racer_number,
                description: null,
                credit: photo.credit,
                category: 'racer',
                categoryLabel: 'Racer Photo',
                featured: photo.featured || false,
                uploadedAt: photo.uploadedAt || racer.created_at,
                type: 'racer',
                raceId: null,
                raceName: null
              })
            }
          }
        }
      }
    }

    allPhotos.value = photos
    applyFilters()

    // Fetch race options for filter
    const { data: races, error: raceError } = await $supabase
      .from('races')
      .select('id, name, date')
      .order('date', { ascending: false })

    if (!raceError) {
      raceOptions.value = races || []
    }
  } catch (error) {
    console.error('Error fetching photos:', error)
  } finally {
    pending.value = false
  }
}

const getCategoryLabel = (category) => {
  const categoryMap = {
    racer: 'Racer Photo',
    crowd: 'Crowd Photo',
    setup: 'Setup Photo',
    awards: 'Awards Photo',
    venue: 'Venue Photo',
    action: 'Action Shot',
    general: 'General Photo'
  }
  return categoryMap[category] || 'Photo'
}

const applyFilters = () => {
  let filtered = [...allPhotos.value]

  // Apply search filter
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(
      (photo) =>
        photo.title.toLowerCase().includes(query) ||
        photo.subtitle.toLowerCase().includes(query) ||
        (photo.description && photo.description.toLowerCase().includes(query))
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

const onSearchChange = () => {
  // Debounce search
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    applyFilters()
  }, 300)
}

let searchTimeout

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
  }
  applyFilters()
}

const clearAllFilters = () => {
  searchQuery.value = ''
  selectedCategory.value = null
  selectedRace.value = null
  applyFilters()
}

const openGallery = (index) => {
  activeImageIndex.value = index
  galleryVisible.value = true
}


// Initialize
onMounted(() => {
  fetchPhotos()
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

<style scoped>
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

:deep(.p-galleria-item-nav) {
  background: rgba(0, 0, 0, 0.5);
  color: white;
  border-radius: 50%;
}

:deep(.p-galleria-item-nav:hover) {
  background: rgba(0, 0, 0, 0.7);
}
</style>
