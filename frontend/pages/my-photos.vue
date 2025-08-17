<template>
  <div class="min-h-screen bg-white dark:bg-gray-900">
    <!-- Header -->
    <div class="bg-white dark:bg-gray-800 shadow-sm border-b dark:border-gray-700">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div class="text-center">
          <div class="flex justify-center mb-6">
            <div class="bg-brand-green rounded-full w-16 h-16 flex items-center justify-center">
              <i class="pi pi-images text-2xl text-white" />
            </div>
          </div>
          <h1 class="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
            My Photos
          </h1>
          <p class="text-lg text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
            Upload and manage your race photos, racer galleries, and community contributions
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
      <div class="space-y-8">
        <!-- Quick Upload Section -->
        <Card class="border-2 border-dashed border-green-500 dark:border-green-600">
          <template #content>
            <div class="text-center space-y-6">
              <div class="flex justify-center">
                <div
                  class="bg-green-100 dark:bg-green-900/30 rounded-full w-20 h-20 flex items-center justify-center"
                >
                  <i class="pi pi-plus text-3xl text-green-700 dark:text-green-400" />
                </div>
              </div>

              <div>
                <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                  Upload New Photos
                </h2>
                <p class="text-gray-600 dark:text-gray-400 mb-6">
                  Share photos from races, your racers, or general community moments
                </p>
              </div>

              <div class="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="large" class="font-semibold" @click="showRacerUpload = true">
                  <i class="pi pi-car mr-2" />
                  Upload Racer Photos
                </Button>
                <Button
                  size="large"
                  severity="secondary"
                  class="font-semibold"
                  @click="showGeneralUpload = true"
                >
                  <i class="pi pi-users mr-2" />
                  Upload General Photos
                </Button>
              </div>
            </div>
          </template>
        </Card>

        <!-- Photo Categories -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <!-- My Racer Photos -->
          <Card>
            <template #title>
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <i class="pi pi-car text-green-700 dark:text-green-400" />
                  <span>My Racer Photos</span>
                </div>
                <Badge :value="racerPhotoCount" />
              </div>
            </template>
            <template #content>
              <div v-if="myRacers.length > 0" class="space-y-4">
                <div
                  v-for="racer in myRacers"
                  :key="racer.id"
                  class="border rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                >
                  <div class="flex items-center justify-between mb-3">
                    <div class="flex items-center gap-3">
                      <Image
                        v-if="racer.image_url"
                        :src="racer.image_url"
                        :alt="racer.name"
                        image-class="w-12 h-12 object-cover rounded-full"
                        class="w-12 h-12"
                        preview
                      />
                      <div
                        v-else
                        class="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center"
                      >
                        <i class="pi pi-car text-gray-500 dark:text-gray-400" />
                      </div>
                      <div>
                        <h4 class="font-semibold text-gray-900 dark:text-white">
                          {{ racer.name }}
                        </h4>
                        <p class="text-sm text-gray-500 dark:text-gray-400">
                          #{{ racer.racer_number }}
                        </p>
                      </div>
                    </div>
                    <Badge :value="`${racer.photos?.length || 0} photos`" severity="info" />
                  </div>

                  <div class="flex gap-2">
                    <NuxtLink :to="`/racers/${racer.slug}`" class="flex-1">
                      <Button text size="small" class="w-full">
                        <i class="pi pi-eye mr-1" />
                        View Gallery
                      </Button>
                    </NuxtLink>
                    <NuxtLink :to="`/racers/${racer.slug}/edit`" class="flex-1">
                      <Button severity="secondary" text size="small" class="w-full">
                        <i class="pi pi-pencil mr-1" />
                        Manage Photos
                      </Button>
                    </NuxtLink>
                  </div>
                </div>
              </div>

              <div v-else class="text-center py-6">
                <i class="pi pi-car text-4xl text-gray-300 dark:text-gray-600 mb-4" />
                <p class="text-gray-500 dark:text-gray-400 mb-4">
                  You haven't registered any racers yet
                </p>
                <NuxtLink to="/racers/add">
                  <Button>
                    <i class="pi pi-plus mr-2" />
                    Register Your First Racer
                  </Button>
                </NuxtLink>
              </div>
            </template>
          </Card>

          <!-- My General Photos -->
          <Card>
            <template #title>
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <i class="pi pi-images text-green-600 dark:text-green-400" />
                  <span>My General Photos</span>
                </div>
                <Badge :value="generalPhotoCount" />
              </div>
            </template>
            <template #content>
              <div v-if="myGeneralPhotos.length > 0" class="space-y-4">
                <div class="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div
                    v-for="(photo, index) in paginatedGeneralPhotos"
                    :key="index"
                    class="relative group cursor-pointer"
                  >
                    <Image
                      :src="photo.url"
                      :alt="`Photo ${index + 1}`"
                      image-class="w-full h-20 object-cover rounded border"
                      class="w-full h-20"
                      :preview="false"
                    />

                    <!-- Status Badge -->
                    <div class="absolute top-1 left-1">
                      <Badge
                        :value="photo.status || 'pending'"
                        :severity="getStatusSeverity(photo.status)"
                        class="text-xs"
                      />
                    </div>

                    <!-- Featured Badge -->
                    <div
                      v-if="photo.featured"
                      class="absolute top-1 right-1 bg-yellow-500 text-white rounded-full w-5 h-5 flex items-center justify-center"
                    >
                      <i class="pi pi-star text-xs" />
                    </div>

                    <!-- Edit Overlay -->
                    <div
                      class="absolute inset-0 bg-black bg-opacity-50 rounded opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                    >
                      <Button
                        v-tooltip="'Edit Photo'"
                        icon="pi pi-pencil"
                        size="small"
                        @click="editGeneralPhoto(photo)"
                      />
                    </div>
                  </div>
                </div>

                <div v-if="generalPhotosTotalPages > 1" class="flex justify-center">
                  <Paginator
                    v-model:first="generalPhotosFirst"
                    :rows="generalPhotosPerPage"
                    :total-records="myGeneralPhotos.length"
                    template="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink"
                  />
                </div>
              </div>

              <div v-else class="text-center py-6">
                <i class="pi pi-images text-4xl text-gray-300 dark:text-gray-600 mb-4" />
                <p class="text-gray-500 dark:text-gray-400 mb-4">No general photos uploaded yet</p>
                <Button @click="showGeneralUpload = true">
                  <i class="pi pi-plus mr-2" />
                  Upload Photos
                </Button>
              </div>
            </template>
          </Card>
        </div>

        <!-- Photo Stats -->
        <Card>
          <template #title>Photo Statistics</template>
          <template #content>
            <div class="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div class="text-center">
                <div class="text-2xl font-bold text-green-700 dark:text-green-400 mb-1">
                  {{ totalPhotos }}
                </div>
                <div class="text-sm text-gray-600 dark:text-gray-300">Total Photos</div>
              </div>
              <div class="text-center">
                <div class="text-2xl font-bold text-green-600 dark:text-green-400 mb-1">
                  {{ approvedPhotos }}
                </div>
                <div class="text-sm text-gray-600 dark:text-gray-300">Approved</div>
              </div>
              <div class="text-center">
                <div class="text-2xl font-bold text-yellow-600 dark:text-yellow-400 mb-1">
                  {{ pendingPhotos }}
                </div>
                <div class="text-sm text-gray-600 dark:text-gray-300">Pending</div>
              </div>
              <div class="text-center">
                <div class="text-2xl font-bold text-purple-600 dark:text-purple-400 mb-1">
                  {{ featuredPhotos.length }}
                </div>
                <div class="text-sm text-gray-600 dark:text-gray-300">Featured</div>
              </div>
            </div>
          </template>
        </Card>
      </div>
    </div>

    <!-- Racer Selection Dialog -->
    <Dialog v-model:visible="showRacerUpload" modal header="Select Racer" class="w-full max-w-md">
      <div class="space-y-4">
        <p class="text-gray-600 dark:text-gray-400">Choose which racer these photos are for:</p>

        <div class="space-y-2">
          <div
            v-for="racer in myRacers"
            :key="racer.id"
            class="border rounded-lg p-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition-colors"
            @click="navigateToRacerEdit(racer)"
          >
            <div class="flex items-center gap-3">
              <Image
                v-if="racer.image_url"
                :src="racer.image_url"
                :alt="racer.name"
                image-class="w-10 h-10 object-cover rounded-full"
                class="w-10 h-10"
                preview
              />
              <div
                v-else
                class="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center"
              >
                <i class="pi pi-car text-gray-500 dark:text-gray-400" />
              </div>
              <div>
                <h4 class="font-semibold text-gray-900 dark:text-white">{{ racer.name }}</h4>
                <p class="text-sm text-gray-500 dark:text-gray-400">#{{ racer.racer_number }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Dialog>

    <!-- Edit General Photo Dialog -->
    <Dialog v-model:visible="showEditPhoto" modal header="Edit Photo" class="w-full max-w-md">
      <div v-if="editingPhoto" class="space-y-4">
        <!-- Photo Preview -->
        <div class="text-center">
          <img
            :src="editingPhoto.url"
            :alt="editingPhoto.description || 'Photo'"
            class="max-w-full max-h-48 rounded-lg mx-auto"
          >
        </div>

        <!-- Description Field -->
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Description
          </label>
          <Textarea
            v-model="editingPhoto.description"
            placeholder="Add a description for this photo..."
            class="w-full"
            rows="3"
            auto-resize
          />
        </div>

        <!-- Credit Field -->
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Photo Credit (Optional)
          </label>
          <InputText
            v-model="editingPhoto.credit"
            placeholder="Photographer name..."
            class="w-full"
          />
        </div>
      </div>

      <template #footer>
        <div class="flex gap-2">
          <Button label="Cancel" severity="secondary" @click="showEditPhoto = false" />
          <Button label="Save Changes" severity="primary" @click="savePhotoChanges" />
        </div>
      </template>
    </Dialog>

    <!-- General Photo Upload Dialog -->
    <Dialog
      v-model:visible="showGeneralUpload"
      modal
      header="Upload General Photos"
      class="w-full max-w-2xl"
    >
      <div class="space-y-6">
        <p class="text-gray-600 dark:text-gray-400">
          Upload photos from races, community events, or other racing-related content. These will be
          reviewed by admins before being published.
        </p>

        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Select Race (Optional)
          </label>
          <Select
            v-model="selectedRace"
            :options="races"
            option-label="name"
            option-value="id"
            placeholder="Choose a race or leave blank for general photos"
            class="w-full"
            show-clear
          />
        </div>

        <GeneralPhotoUpload
          :race-id="selectedRace"
          @photo-uploaded="onGeneralPhotoUploaded"
          @upload-complete="onGeneralUploadComplete"
        />
      </div>

      <template #footer>
        <Button label="Close" severity="secondary" @click="showGeneralUpload = false" />
      </template>
    </Dialog>

    <!-- Toast Messages -->
    <Toast />
  </div>
</template>

<script setup>
import { useAuthStore } from '~/stores/auth'

definePageMeta({
  middleware: 'auth'
})

const authStore = useAuthStore()
const $toast = useToast()

// Use composables for data
const {
  loading: photosLoading,
  initialize: initializePhotos,
  updatePhotoMetadata,
  getPhotosByUser
} = usePhotos()

const { races, loading: racesLoading, initialize: initializeRaces } = useRaces()

const { myRacers, loading: racersLoading, initialize: initializeRacers } = useRacers()

// Combined loading state
const loading = computed(() => photosLoading.value || racesLoading.value || racersLoading.value)

// State - races and racers now come from composables
const showRacerUpload = ref(false)
const showGeneralUpload = ref(false)
const generalPhotosFirst = ref(0)
const generalPhotosPerPage = ref(12)
const selectedRace = ref(null)
const showEditPhoto = ref(false)
const editingPhoto = ref(null)

// Get user photos using composable
const myPhotos = computed(() => {
  return authStore.user ? getPhotosByUser(authStore.user.id) : []
})

const myGeneralPhotos = computed(() => {
  return myPhotos.value.filter((photo) => photo.type === 'general')
})

const myRacerPhotos = computed(() => {
  return myPhotos.value.filter((photo) => photo.type === 'racer')
})

// Computed properties
const racerPhotoCount = computed(() => {
  return myRacerPhotos.value.length
})

const generalPhotoCount = computed(() => myGeneralPhotos.value.length)

const totalPhotos = computed(() => myPhotos.value.length)

const approvedPhotos = computed(() => {
  return myPhotos.value.filter((photo) => photo.status === 'approved').length
})

const pendingPhotos = computed(() => {
  return myPhotos.value.filter((photo) => photo.status === 'pending' || !photo.status).length
})

const featuredPhotos = computed(() => {
  return myPhotos.value.filter((photo) => photo.featured)
})

const paginatedGeneralPhotos = computed(() => {
  const start = generalPhotosFirst.value
  const end = start + generalPhotosPerPage.value
  return myGeneralPhotos.value.slice(start, end)
})

const generalPhotosTotalPages = computed(() => {
  return Math.ceil(myGeneralPhotos.value.length / generalPhotosPerPage.value)
})

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

const fetchData = async () => {
  try {
    // Initialize all composables
    await Promise.all([
      initializeRacers(),
      initializeRaces(),
      initializePhotos({ userId: authStore.user.id })
    ])
  } catch (error) {
    // Keep essential error logging for production debugging
    console.error('Error fetching data:', error)
  }
}

const navigateToRacerEdit = (racer) => {
  showRacerUpload.value = false
  navigateTo(`/racers/${racer.slug}/edit`)
}

const editGeneralPhoto = (photo) => {
  editingPhoto.value = { ...photo }
  showEditPhoto.value = true
}

const savePhotoChanges = async () => {
  if (!editingPhoto.value) return

  try {
    await updatePhotoMetadata(editingPhoto.value, {
      description: editingPhoto.value.description?.trim() || null,
      credit: editingPhoto.value.credit?.trim() || null
    })

    $toast.add({
      severity: 'success',
      summary: 'Photo Updated!',
      detail: 'Your photo has been successfully updated.',
      life: 4000
    })

    showEditPhoto.value = false
  } catch (error) {
    // Keep essential error logging for production debugging
    console.error('Error updating photo:', error)
    $toast.add({
      severity: 'error',
      summary: 'Update Failed',
      detail: 'Failed to update photo. Please try again.',
      life: 5000
    })
  }
}

const onGeneralPhotoUploaded = () => {
  // Photo will be handled by the upload component
}

const onGeneralUploadComplete = async (uploadData) => {
  // Show success toast
  const message = authStore.isRaceAdmin
    ? `Photos are now live and visible to all users.`
    : `They will be reviewed by admins before being published.`

  $toast.add({
    severity: 'success',
    summary: `Successfully uploaded ${uploadData.count} photo${uploadData.count !== 1 ? 's' : ''}!`,
    detail: message,
    life: 5000
  })

  // Close dialog and refresh data
  showGeneralUpload.value = false
  selectedRace.value = null
  await initialize({ userId: authStore.user.id })
}

// Initialize
onMounted(async () => {
  await authStore.initAuth()
  await fetchData()
})

useHead({
  title: 'My Photos - The Great Holyoke Brick Race',
  meta: [
    {
      name: 'description',
      content:
        'Manage your race photos and community contributions for The Great Holyoke Brick Race.'
    }
  ]
})
</script>
