<template>
  <div
    class="min-h-screen bg-white dark:bg-gray-900"
  >
    <!-- Breadcrumb Navigation -->
    <div class="bg-white dark:bg-gray-800 shadow-sm border-b dark:border-gray-700">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <BreadcrumbWrapper :items="breadcrumbItems" class="mb-2" />
      </div>
    </div>

    <!-- Header -->
    <div class="bg-white dark:bg-gray-800 shadow-sm border-b dark:border-gray-700">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div class="flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <h1 class="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Photo Management
            </h1>
            <p class="text-lg text-gray-600 dark:text-gray-400">
              Review, approve, and manage user-submitted photos
            </p>
          </div>

          <div class="mt-4 md:mt-0 flex flex-wrap gap-3">
            <div class="flex items-center gap-2">
              <Badge :value="`${pendingCount} Pending`" class="bg-brand-gold text-black" />
              <Badge :value="`${approvedCount} Approved`" class="bg-brand-green text-white" />
              <Badge :value="`${rejectedCount} Rejected`" class="bg-red-500 text-white" />
            </div>
            <AdminMenu />
          </div>
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="flex justify-center py-12">
      <ProgressSpinner />
    </div>

    <!-- Filter and Status Tabs -->
    <div v-else class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border dark:border-gray-700 mb-6">
        <div class="p-6">
          <div class="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div class="flex gap-4 items-center">
              <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Photo Filters</h3>
            </div>

            <div class="flex flex-wrap gap-2">
              <Select
                v-model="selectedStatus"
                :options="statusFilterOptions"
                option-label="label"
                option-value="value"
                placeholder="Filter by status"
                class="w-44"
              />
              <Select
                v-model="selectedRaceId"
                :options="raceFilterOptions"
                option-label="label"
                option-value="value"
                placeholder="Filter by race"
                class="w-48"
                show-clear
              />
              <Select
                v-model="selectedRacerId"
                :options="racerFilterOptions"
                option-label="label"
                option-value="value"
                placeholder="Filter by racer"
                class="w-48"
                :filter="true"
                show-clear
              />
              <Select
                v-model="sortBy"
                :options="sortOptions"
                option-label="label"
                option-value="value"
                placeholder="Sort by"
                class="w-40"
              />
              <Button
                v-tooltip.bottom="'Refresh photos'"
                icon="pi pi-refresh"
                severity="secondary"
                :loading="refreshing"
                @click="refreshPhotos"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- Photos Grid -->
      <div v-if="filteredPhotos.length > 0">
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          <Card
            v-for="photo in paginatedPhotos"
            :key="photo.id"
            class="overflow-hidden hover:shadow-lg transition-shadow"
          >
            <template #header>
              <div class="relative">
                <Image
                  :src="photo.url"
                  :alt="`Photo from ${photo.racerName || 'Unknown'}`"
                  image-class="w-full h-48 object-cover"
                  class="w-full h-48"
                  preview
                />

                <!-- Status Badge -->
                <div class="absolute top-2 right-2">
                  <Badge
                    :value="photo.status || 'pending'"
                    :severity="getStatusSeverity(photo.status)"
                  />
                </div>

                <!-- Featured Badge -->
                <div
                  v-if="photo.featured"
                  class="absolute top-2 left-2 bg-yellow-500 text-white rounded-full w-8 h-8 flex items-center justify-center shadow-lg"
                >
                  <i class="pi pi-star text-sm" />
                </div>
              </div>
            </template>

            <template #content>
              <div class="space-y-3">
                <!-- Photo Info -->
                <div>
                  <h4 class="font-semibold text-gray-900 dark:text-white">
                    {{ photo.racerName || 'General Race Photo' }}
                  </h4>
                  <p class="text-sm text-gray-600 dark:text-gray-400">
                    {{ photo.raceName || 'No race specified' }}
                  </p>
                  <p class="text-xs text-gray-500 dark:text-gray-500">
                    Uploaded {{ formatDate(photo.uploadedAt) }}
                  </p>
                </div>

                <!-- Uploader Info -->
                <div class="border-t pt-3">
                  <p class="text-sm text-gray-600 dark:text-gray-400">
                    <i class="pi pi-user mr-1" />
                    {{ photo.uploaderName || photo.uploaderEmail || 'Unknown user' }}
                  </p>
                </div>
              </div>
            </template>

            <template #footer>
              <div class="flex flex-col gap-2">
                <!-- Approval Actions (for pending photos) -->
                <div v-if="!photo.status || photo.status === 'pending'" class="flex gap-2">
                  <Button
                    size="small"
                    severity="success"
                    class="flex-1"
                    :loading="processingPhoto === photo.id"
                    @click="handleApprovePhoto(photo)"
                  >
                    <i class="pi pi-check mr-1" />
                    Approve
                  </Button>
                  <Button
                    size="small"
                    severity="danger"
                    class="flex-1"
                    :loading="processingPhoto === photo.id"
                    @click="handleRejectPhoto(photo)"
                  >
                    <i class="pi pi-times mr-1" />
                    Reject
                  </Button>
                </div>

                <!-- Feature Toggle -->
                <div class="flex gap-2">
                  <Button
                    v-if="photo.status === 'approved'"
                    size="small"
                    :severity="photo.featured ? 'warning' : 'secondary'"
                    class="flex-1"
                    :loading="processingPhoto === photo.id"
                    @click="handleToggleFeatured(photo)"
                  >
                    <i class="pi pi-star mr-1" />
                    {{ photo.featured ? 'Unfeature' : 'Feature' }}
                  </Button>

                  <!-- Additional Actions -->
                  <SplitButton
                    size="small"
                    severity="secondary"
                    :model="getPhotoActions(photo)"
                    @click="viewPhotoDetails(photo)"
                  >
                    <i class="pi pi-eye mr-1" />
                    Details
                  </SplitButton>
                </div>
              </div>
            </template>
          </Card>
        </div>

        <!-- Pagination -->
        <div v-if="totalPages > 1" class="flex justify-center mt-8">
          <Paginator
            v-model:first="currentPage"
            :rows="photosPerPage"
            :total-records="filteredPhotos.length"
            :rows-per-page-options="[12, 24, 48]"
            template="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink RowsPerPageDropdown"
          />
        </div>
      </div>

      <!-- Empty State -->
      <div v-else class="text-center py-12">
        <i class="pi pi-images text-6xl text-gray-300 dark:text-gray-600 mb-4" />
        <h3 class="text-xl font-semibold text-gray-600 dark:text-gray-400 mb-2">
          {{ getEmptyStateMessage() }}
        </h3>
        <p class="text-gray-500 dark:text-gray-500 mb-6">
          {{ getEmptyStateSubtitle() }}
        </p>
        <Button :loading="refreshing" @click="refreshPhotos">
          <i class="pi pi-refresh mr-2" />
          Refresh Photos
        </Button>
      </div>
    </div>

    <!-- Photo Details Dialog -->
    <Dialog
      v-model:visible="showPhotoDetails"
      modal
      header="Photo Details"
      class="w-full max-w-2xl"
    >
      <div v-if="selectedPhoto" class="space-y-6">
        <!-- Photo Display -->
        <div class="text-center">
          <Image
            :src="selectedPhoto.url"
            :alt="`Photo from ${selectedPhoto.racerName || 'Unknown'}`"
            image-class="max-w-full max-h-96 object-contain rounded-lg"
            class="max-w-full max-h-96"
            preview
          />
        </div>

        <!-- Photo Information -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h4 class="font-semibold mb-2">Photo Information</h4>
            <div class="space-y-2 text-sm">
              <div>
                <span class="font-medium">Status:</span> {{ selectedPhoto.status || 'Pending' }}
              </div>
              <div>
                <span class="font-medium">Featured:</span>
                {{ selectedPhoto.featured ? 'Yes' : 'No' }}
              </div>
              <div>
                <span class="font-medium">Uploaded:</span>
                {{ formatDate(selectedPhoto.uploadedAt) }}
              </div>
              <div>
                <span class="font-medium">Racer:</span>
                {{ selectedPhoto.racerName || 'General Photo' }}
              </div>
              <div>
                <span class="font-medium">Race:</span>
                {{ selectedPhoto.raceName || 'No race specified' }}
              </div>
            </div>
          </div>

          <div>
            <h4 class="font-semibold mb-2">Uploader Information</h4>
            <div class="space-y-2 text-sm">
              <div>
                <span class="font-medium">Name:</span>
                {{ selectedPhoto.uploaderName || 'Not provided' }}
              </div>
              <div>
                <span class="font-medium">Email:</span>
                {{ selectedPhoto.uploaderEmail || 'Unknown' }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <template #footer>
        <Button label="Close" severity="secondary" @click="showPhotoDetails = false" />
      </template>
    </Dialog>

    <!-- Toast Messages -->
    <Toast />
  </div>
</template>

<script setup>
import { useAuthStore } from '~/stores/auth'

definePageMeta({
  middleware: 'admin'
})

const authStore = useAuthStore()
const route = useRoute()

const $toast = useToast()

// Use composables
const {
  allPhotos,
  loading,
  initialize: initializePhotos,
  fetchAllPhotos,
  approvePhoto,
  rejectPhoto,
  deletePhoto,
  toggleFeatured
} = usePhotos()
const { races, initialize: initializeRaces } = useRaces()
const { racers, initialize: initializeRacers } = useRacers()

// State
const refreshing = ref(false)
const processingPhoto = ref(null)
const showPhotoDetails = ref(false)
const selectedPhoto = ref(null)
const selectedStatus = ref('all')
const sortBy = ref('newest')
const selectedRaceId = ref('')
const selectedRacerId = ref('')
const currentPage = ref(0)
const photosPerPage = ref(12)

// Breadcrumb navigation
const breadcrumbItems = computed(() => [
  { label: 'Home', url: '/' },
  { label: 'Admin', url: '/admin' },
  { label: 'Photo Management' }
])

// Status filter options
const statusFilterOptions = ref([
  { label: 'All Photos', value: 'all' },
  { label: 'Pending Approval', value: 'pending' },
  { label: 'Approved', value: 'approved' },
  { label: 'Rejected', value: 'rejected' },
  { label: 'Featured', value: 'featured' }
])

// Sort options
const sortOptions = ref([
  { label: 'Newest First', value: 'newest' },
  { label: 'Oldest First', value: 'oldest' },
  { label: 'Racer Name', value: 'racer' },
  { label: 'Status', value: 'status' }
])

// Race filter options
const raceFilterOptions = computed(() => {
  const options = [{ label: 'All Races', value: '' }]

  // Add races from the races store
  races.value.forEach((race) => {
    options.push({
      label: race.name,
      value: race.id
    })
  })

  return options.sort((a, b) => {
    if (a.value === '') return -1 // Keep "All Races" first
    if (b.value === '') return 1
    return a.label.localeCompare(b.label)
  })
})

// Racer filter options for autocomplete
const racerFilterOptions = computed(() => {
  // Get unique racers from photos
  const uniqueRacers = new Map()

  allPhotos.value.forEach((photo) => {
    if (photo.racerId && photo.racerName) {
      uniqueRacers.set(photo.racerId, {
        id: photo.racerId,
        name: photo.racerName,
        racerNumber: photo.racerNumber
      })
    }
  })

  // Also add from racers composable
  racers.value.forEach((racer) => {
    uniqueRacers.set(racer.id, {
      id: racer.id,
      name: racer.name,
      racerNumber: racer.racer_number
    })
  })

  return Array.from(uniqueRacers.values())
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((racer) => ({
      label: racer.racerNumber ? `${racer.name} (#${racer.racerNumber})` : racer.name,
      value: racer.id
    }))
})

// Computed properties
const filteredPhotos = computed(() => {
  let filtered = [...allPhotos.value]

  // Filter by race
  if (selectedRaceId.value) {
    filtered = filtered.filter((photo) => photo.raceId === selectedRaceId.value)
  }

  // Filter by racer
  if (selectedRacerId.value) {
    filtered = filtered.filter((photo) => photo.racerId === selectedRacerId.value)
  }

  // Filter by status
  switch (selectedStatus.value) {
    case 'pending':
      filtered = filtered.filter((photo) => !photo.status || photo.status === 'pending')
      break
    case 'approved':
      filtered = filtered.filter((photo) => photo.status === 'approved')
      break
    case 'rejected':
      filtered = filtered.filter((photo) => photo.status === 'rejected')
      break
    case 'featured':
      filtered = filtered.filter((photo) => photo.featured)
      break
    // case 'all': All photos - no filter
  }

  // Sort
  switch (sortBy.value) {
    case 'newest':
      filtered.sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt))
      break
    case 'oldest':
      filtered.sort((a, b) => new Date(a.uploadedAt) - new Date(b.uploadedAt))
      break
    case 'racer':
      filtered.sort((a, b) => (a.racerName || '').localeCompare(b.racerName || ''))
      break
    case 'status':
      filtered.sort((a, b) => (a.status || 'pending').localeCompare(b.status || 'pending'))
      break
  }

  return filtered
})

const paginatedPhotos = computed(() => {
  const start = currentPage.value
  const end = start + photosPerPage.value
  return filteredPhotos.value.slice(start, end)
})

const totalPages = computed(() => Math.ceil(filteredPhotos.value.length / photosPerPage.value))

const pendingCount = computed(
  () => allPhotos.value.filter((photo) => !photo.status || photo.status === 'pending').length
)
const approvedCount = computed(
  () => allPhotos.value.filter((photo) => photo.status === 'approved').length
)
const rejectedCount = computed(
  () => allPhotos.value.filter((photo) => photo.status === 'rejected').length
)

// Methods
const getStatusSeverity = (status) => {
  switch (status) {
    case 'approved':
      return 'success'
    case 'rejected':
      return 'danger'
    case 'pending':
    default:
      return 'warning'
  }
}

const formatDate = (dateString) => {
  if (!dateString) return 'Unknown'
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const getEmptyStateMessage = () => {
  switch (selectedStatus.value) {
    case 'pending':
      return 'No Pending Photos'
    case 'approved':
      return 'No Approved Photos'
    case 'rejected':
      return 'No Rejected Photos'
    case 'featured':
      return 'No Featured Photos'
    default:
      return 'No Photos Found'
  }
}

const getEmptyStateSubtitle = () => {
  switch (selectedStatus.value) {
    case 'pending':
      return 'All photos have been reviewed'
    case 'approved':
      return 'No photos have been approved yet'
    case 'rejected':
      return 'No photos have been rejected'
    case 'featured':
      return 'No photos have been marked as featured'
    default:
      return 'No photos have been uploaded yet'
  }
}

// Remove the old fetchPhotos function and replace with composable usage
const refreshPhotos = async () => {
  if (!loading.value) refreshing.value = true

  try {
    await fetchAllPhotos()
  } catch (error) {
    // Keep essential error logging for production debugging
    console.error('Error refreshing photos:', error)
    $toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Failed to refresh photos',
      life: 3000
    })
  } finally {
    refreshing.value = false
  }
}

// Old fetchPhotos function removed - now using composable

const viewPhotoDetails = (photo) => {
  selectedPhoto.value = photo
  showPhotoDetails.value = true
}

// Photo action handlers
const handleApprovePhoto = async (photo) => {
  processingPhoto.value = photo.id
  try {
    await approvePhoto(photo)
    $toast.add({
      severity: 'success',
      summary: 'Photo Approved',
      detail: 'Photo has been approved successfully',
      life: 3000
    })
  } catch (error) {
    console.error('Error approving photo:', error)
    $toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Failed to approve photo',
      life: 3000
    })
  } finally {
    processingPhoto.value = null
  }
}

const handleRejectPhoto = async (photo) => {
  processingPhoto.value = photo.id
  try {
    await rejectPhoto(photo)
    $toast.add({
      severity: 'info',
      summary: 'Photo Rejected',
      detail: 'Photo has been rejected',
      life: 3000
    })
  } catch (error) {
    console.error('Error rejecting photo:', error)
    $toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Failed to reject photo',
      life: 3000
    })
  } finally {
    processingPhoto.value = null
  }
}

const handleToggleFeatured = async (photo) => {
  processingPhoto.value = photo.id
  try {
    const newFeaturedStatus = await toggleFeatured(photo)
    const action = newFeaturedStatus ? 'featured' : 'unfeatured'
    $toast.add({
      severity: 'success',
      summary: 'Photo Updated',
      detail: `Photo has been ${action}`,
      life: 3000
    })
  } catch (error) {
    console.error('Error toggling featured status:', error)
    $toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Failed to update photo',
      life: 3000
    })
  } finally {
    processingPhoto.value = null
  }
}

const handleDeletePhoto = async (photo) => {
  processingPhoto.value = photo.id
  try {
    await deletePhoto(photo)
    $toast.add({
      severity: 'info',
      summary: 'Photo Deleted',
      detail: 'Photo has been deleted',
      life: 3000
    })
  } catch (error) {
    console.error('Error deleting photo:', error)
    $toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Failed to delete photo',
      life: 3000
    })
  } finally {
    processingPhoto.value = null
  }
}

const getPhotoActions = (photo) => {
  const actions = []

  if (photo.type === 'racer') {
    actions.push({
      label: 'View Racer',
      icon: 'pi pi-car',
      command: () => {
        const racerId = photo.id.split('-')[1]
        navigateTo(`/racers/${racerId}`)
      }
    })
  }

  actions.push({
    label: 'Delete Photo',
    icon: 'pi pi-trash',
    command: () => handleDeletePhoto(photo)
  })

  return actions
}

// Initialize
onMounted(async () => {
  try {
    await authStore.initAuth()
    if (!authStore.isRaceAdmin) {
      throw createError({
        statusCode: 403,
        statusMessage: 'Access denied. Admin privileges required.'
      })
    }
    await Promise.all([initializePhotos(), initializeRaces(), initializeRacers()])

    // Check if race filter is provided in URL params
    if (route.query.race) {
      selectedRaceId.value = route.query.race
    }
  } catch (error) {
    // Keep essential error logging for production debugging
    console.error('Error initializing admin photos page:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to initialize admin interface'
    })
  }
})

// Watch for filter changes to reset pagination
watch([selectedStatus, selectedRaceId, selectedRacerId], () => {
  currentPage.value = 0
})

useHead({
  title: 'Photo Management - Admin Dashboard',
  meta: [
    {
      name: 'description',
      content: 'Manage and approve user-submitted photos for The Great Holyoke Brick Race.'
    }
  ]
})
</script>
