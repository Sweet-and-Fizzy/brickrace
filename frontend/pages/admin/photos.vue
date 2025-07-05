<template>
  <div class="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50 dark:bg-gradient-to-br dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
    <!-- Breadcrumb Navigation -->
    <div class="bg-white dark:bg-gray-800 shadow-sm border-b dark:border-gray-700">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <Breadcrumb :model="breadcrumbItems" class="mb-2" />
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
              <Badge :value="`${pendingCount} Pending`" severity="warning" />
              <Badge :value="`${approvedCount} Approved`" severity="success" />
              <Badge :value="`${rejectedCount} Rejected`" severity="danger" />
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="pending" class="flex justify-center py-12">
      <ProgressSpinner />
    </div>

    <!-- Filter and Status Tabs -->
    <div v-else class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border dark:border-gray-700 mb-6">
        <div class="p-6">
          <div class="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <TabMenu v-model:active-index="activeTab" :model="tabItems" class="flex-1" />

            <div class="flex gap-2">
              <Button
                v-tooltip.bottom="'Refresh photos'"
                icon="pi pi-refresh"
                severity="secondary"
                :loading="refreshing"
                @click="fetchPhotos"
              />
              <Dropdown
                v-model="sortBy"
                :options="sortOptions"
                option-label="label"
                option-value="value"
                placeholder="Sort by"
                class="w-40"
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
                    @click="approvePhoto(photo)"
                  >
                    <i class="pi pi-check mr-1" />
                    Approve
                  </Button>
                  <Button
                    size="small"
                    severity="danger"
                    class="flex-1"
                    :loading="processingPhoto === photo.id"
                    @click="rejectPhoto(photo)"
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
                    @click="toggleFeatured(photo)"
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
        <Button :loading="refreshing" @click="fetchPhotos">
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
const { $supabase } = useNuxtApp()
const $toast = useToast()

// State
const pending = ref(true)
const refreshing = ref(false)
const processingPhoto = ref(null)
const showPhotoDetails = ref(false)
const selectedPhoto = ref(null)
const activeTab = ref(0)
const sortBy = ref('newest')
const currentPage = ref(0)
const photosPerPage = ref(12)

// Photos data
const allPhotos = ref([])

// Breadcrumb navigation
const breadcrumbItems = computed(() => [
  { label: 'Home', url: '/' },
  { label: 'Admin', url: '/admin' },
  { label: 'Photo Management' }
])

// Tab items
const tabItems = ref([
  { label: 'All Photos', icon: 'pi pi-images' },
  { label: 'Pending Approval', icon: 'pi pi-clock' },
  { label: 'Approved', icon: 'pi pi-check' },
  { label: 'Rejected', icon: 'pi pi-times' },
  { label: 'Featured', icon: 'pi pi-star' }
])

// Sort options
const sortOptions = ref([
  { label: 'Newest First', value: 'newest' },
  { label: 'Oldest First', value: 'oldest' },
  { label: 'Racer Name', value: 'racer' },
  { label: 'Status', value: 'status' }
])

// Computed properties
const filteredPhotos = computed(() => {
  let filtered = [...allPhotos.value]

  // Filter by tab
  switch (activeTab.value) {
    case 1: // Pending
      filtered = filtered.filter((photo) => !photo.status || photo.status === 'pending')
      break
    case 2: // Approved
      filtered = filtered.filter((photo) => photo.status === 'approved')
      break
    case 3: // Rejected
      filtered = filtered.filter((photo) => photo.status === 'rejected')
      break
    case 4: // Featured
      filtered = filtered.filter((photo) => photo.featured)
      break
    // case 0: All photos - no filter
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
  () => allPhotos.value.filter((p) => !p.status || p.status === 'pending').length
)
const approvedCount = computed(() => allPhotos.value.filter((p) => p.status === 'approved').length)
const rejectedCount = computed(() => allPhotos.value.filter((p) => p.status === 'rejected').length)

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
  switch (activeTab.value) {
    case 1:
      return 'No Pending Photos'
    case 2:
      return 'No Approved Photos'
    case 3:
      return 'No Rejected Photos'
    case 4:
      return 'No Featured Photos'
    default:
      return 'No Photos Found'
  }
}

const getEmptyStateSubtitle = () => {
  switch (activeTab.value) {
    case 1:
      return 'All photos have been reviewed'
    case 2:
      return 'No photos have been approved yet'
    case 3:
      return 'No photos have been rejected'
    case 4:
      return 'No photos have been marked as featured'
    default:
      return 'No photos have been uploaded yet'
  }
}

const fetchPhotos = async () => {
  if (!pending.value) refreshing.value = true

  try {
    // Get all racers with photos
    const { data: racersData, error: racersError } = await $supabase
      .from('racers')
      .select(
        `
        id,
        name,
        racer_number,
        photos,
        user_id
      `
      )
      .not('photos', 'is', null)

    if (racersError) throw racersError

    // Fetch general race photos first to get all user IDs
    const { data: generalPhotosData, error: generalPhotosError } = await $supabase
      .from('general_photos')
      .select(
        `
        *,
        races(name)
      `
      )
      .order('uploaded_at', { ascending: false })

    // Get unique user IDs for batch lookup
    const allUserIds = [
      ...new Set([
        ...(racersData || []).map((r) => r.user_id),
        ...(generalPhotosData || []).map((p) => p.user_id)
      ])
    ]

    // Create a simple user lookup using just user IDs since we can't access auth.users easily
    const userMap = new Map()
    allUserIds.forEach((userId) => {
      // For now, just display a truncated user ID since we can't access user metadata
      const displayId = userId.substring(0, 8) + '...'
      userMap.set(userId, {
        name: `User ${displayId}`,
        email: `${displayId}@...`
      })
    })

    console.log('Racers found:', racersData?.length)
    console.log('Racers data:', racersData)

    const photos = []

    // Process racer photos
    for (const racer of racersData || []) {
      console.log(`Processing racer: ${racer.name} (ID: ${racer.id})`)
      console.log(`Racer photos:`, racer.photos)

      if (racer.photos && Array.isArray(racer.photos)) {
        console.log(`Found ${racer.photos.length} photos for ${racer.name}`)
        for (const [index, photo] of racer.photos.entries()) {
          console.log(`Photo ${index}:`, photo)

          // Get user info from lookup map
          const userInfo = userMap.get(racer.user_id) || { name: 'Unknown User', email: 'Unknown' }
          const uploaderName = userInfo.name
          const uploaderEmail = userInfo.email

          photos.push({
            id: `racer-${racer.id}-${index}`, // Use index for consistent ID
            url: photo.url || photo,
            status: photo.status || 'approved', // Auto-approved but can be moderated
            featured: photo.featured || false,
            racerName: racer.name,
            racerNumber: racer.racer_number,
            raceName: 'Racer Gallery',
            uploadedAt: photo.uploadedAt || new Date().toISOString(),
            uploaderEmail: uploaderEmail,
            uploaderName: uploaderName,
            type: 'racer',
            racerId: racer.id,
            photoIndex: index // Track position in array for updates
          })
        }
      } else {
        console.log(`No photos array found for ${racer.name}`)
      }
    }

    if (generalPhotosError) {
      console.error('Error fetching general photos:', generalPhotosError)
      console.error('Error details:', generalPhotosError.message)
    } else {
      console.log('General photos fetched:', generalPhotosData?.length || 0, 'photos')
      // Process general photos
      for (const photo of generalPhotosData || []) {
        // Get user info from lookup map
        const userInfo = userMap.get(photo.user_id) || { name: 'Unknown User', email: 'Unknown' }
        const uploaderName = userInfo.name
        const uploaderEmail = userInfo.email

        photos.push({
          id: `general-${photo.id}`,
          url: photo.url,
          status: photo.status,
          featured: photo.featured,
          racerName: null, // General photos aren't associated with specific racers
          racerNumber: null,
          raceName: photo.races?.name || 'General Photo',
          uploadedAt: photo.uploaded_at,
          uploaderEmail: uploaderEmail,
          uploaderName: uploaderName,
          type: 'general',
          category: photo.category,
          description: photo.description
        })
      }
    }

    allPhotos.value = photos
    console.log('Total photos loaded:', photos.length)
    console.log('Pending photos:', photos.filter((p) => p.status === 'pending').length)
  } catch (error) {
    console.error('Error fetching photos:', error)
    allPhotos.value = []
  } finally {
    pending.value = false
    refreshing.value = false
  }
}

const approvePhoto = async (photo) => {
  processingPhoto.value = photo.id

  try {
    if (photo.type === 'general') {
      // Update general photo status
      const photoId = photo.id.replace('general-', '')
      const { error } = await $supabase
        .from('general_photos')
        .update({ status: 'approved' })
        .eq('id', photoId)

      if (error) throw error
    } else if (photo.type === 'racer') {
      // For racer photos, update the status in the racer's photos array
      const { data: racerData, error: fetchError } = await $supabase
        .from('racers')
        .select('photos')
        .eq('id', photo.racerId)
        .single()

      if (fetchError) throw fetchError

      const updatedPhotos = [...(racerData.photos || [])]
      if (updatedPhotos[photo.photoIndex]) {
        // Ensure photo object structure
        if (typeof updatedPhotos[photo.photoIndex] === 'string') {
          updatedPhotos[photo.photoIndex] = {
            url: updatedPhotos[photo.photoIndex],
            status: 'approved'
          }
        } else {
          updatedPhotos[photo.photoIndex].status = 'approved'
        }

        const { error: updateError } = await $supabase
          .from('racers')
          .update({ photos: updatedPhotos })
          .eq('id', photo.racerId)

        if (updateError) throw updateError
      }
    }

    // Update local state
    photo.status = 'approved'

    // Show success message
    console.log('Photo approved successfully')
  } catch (error) {
    console.error('Error approving photo:', error)
    // Could add toast notification here
  } finally {
    processingPhoto.value = null
  }
}

const rejectPhoto = async (photo) => {
  processingPhoto.value = photo.id

  try {
    if (photo.type === 'general') {
      // Update general photo status
      const photoId = photo.id.replace('general-', '')
      const { error } = await $supabase
        .from('general_photos')
        .update({ status: 'rejected' })
        .eq('id', photoId)

      if (error) throw error
    } else if (photo.type === 'racer') {
      // For racer photos, update the status in the racer's photos array
      const { data: racerData, error: fetchError } = await $supabase
        .from('racers')
        .select('photos')
        .eq('id', photo.racerId)
        .single()

      if (fetchError) throw fetchError

      const updatedPhotos = [...(racerData.photos || [])]
      if (updatedPhotos[photo.photoIndex]) {
        // Ensure photo object structure
        if (typeof updatedPhotos[photo.photoIndex] === 'string') {
          updatedPhotos[photo.photoIndex] = {
            url: updatedPhotos[photo.photoIndex],
            status: 'rejected'
          }
        } else {
          updatedPhotos[photo.photoIndex].status = 'rejected'
        }

        const { error: updateError } = await $supabase
          .from('racers')
          .update({ photos: updatedPhotos })
          .eq('id', photo.racerId)

        if (updateError) throw updateError
      }
    }

    // Update local state
    photo.status = 'rejected'

    // Show success message
    console.log('Photo rejected successfully')
  } catch (error) {
    console.error('Error rejecting photo:', error)
    // Could add toast notification here
  } finally {
    processingPhoto.value = null
  }
}

const toggleFeatured = async (photo) => {
  processingPhoto.value = photo.id

  try {
    const newFeaturedStatus = !photo.featured

    if (photo.type === 'general') {
      // Update general photo featured status
      const photoId = photo.id.replace('general-', '')
      const { error } = await $supabase
        .from('general_photos')
        .update({ featured: newFeaturedStatus })
        .eq('id', photoId)

      if (error) throw error
    } else if (photo.type === 'racer') {
      // For racer photos, update the featured status in the racer's photos array
      const { data: racerData, error: fetchError } = await $supabase
        .from('racers')
        .select('photos')
        .eq('id', photo.racerId)
        .single()

      if (fetchError) throw fetchError

      const updatedPhotos = [...(racerData.photos || [])]
      if (updatedPhotos[photo.photoIndex]) {
        // Ensure photo object structure
        if (typeof updatedPhotos[photo.photoIndex] === 'string') {
          updatedPhotos[photo.photoIndex] = {
            url: updatedPhotos[photo.photoIndex],
            featured: newFeaturedStatus
          }
        } else {
          updatedPhotos[photo.photoIndex].featured = newFeaturedStatus
        }

        const { error: updateError } = await $supabase
          .from('racers')
          .update({ photos: updatedPhotos })
          .eq('id', photo.racerId)

        if (updateError) throw updateError
      }
    }

    // Update local state
    photo.featured = newFeaturedStatus

    // Show success message
    console.log(`Photo ${newFeaturedStatus ? 'featured' : 'unfeatured'} successfully`)
  } catch (error) {
    console.error('Error toggling featured status:', error)
    // Could add toast notification here
  } finally {
    processingPhoto.value = null
  }
}

const viewPhotoDetails = (photo) => {
  selectedPhoto.value = photo
  showPhotoDetails.value = true
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
    command: () => deletePhoto(photo)
  })

  return actions
}

const deletePhoto = async (photo) => {
  // Show confirmation dialog
  if (!confirm(`Are you sure you want to delete this photo? This action cannot be undone.`)) {
    return
  }

  processingPhoto.value = photo.id

  try {
    if (photo.type === 'general') {
      // Delete general photo
      const photoId = photo.id.replace('general-', '')
      const { error } = await $supabase.from('general_photos').delete().eq('id', photoId)

      if (error) throw error

      // Remove from local state
      allPhotos.value = allPhotos.value.filter((p) => p.id !== photo.id)
    } else if (photo.type === 'racer') {
      // Delete racer photo by removing it from the photos array
      const { data: racerData, error: fetchError } = await $supabase
        .from('racers')
        .select('photos')
        .eq('id', photo.racerId)
        .single()

      if (fetchError) throw fetchError

      const updatedPhotos = [...(racerData.photos || [])]
      updatedPhotos.splice(photo.photoIndex, 1) // Remove the photo at the specific index

      const { error: updateError } = await $supabase
        .from('racers')
        .update({ photos: updatedPhotos })
        .eq('id', photo.racerId)

      if (updateError) throw updateError

      // Remove from local state and update indices for remaining photos
      allPhotos.value = allPhotos.value.filter((p) => p.id !== photo.id)

      // Update photo indices for remaining photos from the same racer
      allPhotos.value.forEach((p) => {
        if (p.type === 'racer' && p.racerId === photo.racerId && p.photoIndex > photo.photoIndex) {
          p.photoIndex -= 1
          p.id = `racer-${p.racerId}-${p.photoIndex}`
        }
      })
    }

    $toast.add({
      severity: 'success',
      summary: 'Photo Deleted',
      detail: 'The photo has been successfully deleted.',
      life: 4000
    })
  } catch (error) {
    console.error('Error deleting photo:', error)
    $toast.add({
      severity: 'error',
      summary: 'Delete Failed',
      detail: 'Failed to delete photo. Please try again.',
      life: 5000
    })
  } finally {
    processingPhoto.value = null
  }
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
    await fetchPhotos()
  } catch (error) {
    console.error('Error initializing admin photos page:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to initialize admin interface'
    })
  }
})

// Watch for tab changes to reset pagination
watch(activeTab, () => {
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
