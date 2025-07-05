<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gradient-to-br dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
    <div class="container mx-auto px-4 py-8">
    <!-- Breadcrumb Navigation -->
    <Breadcrumb :model="breadcrumbItems" class="mb-6" />

    <!-- Loading State -->
    <div v-if="pending" class="flex justify-center py-12">
      <ProgressSpinner />
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="text-center py-12">
      <i class="pi pi-exclamation-triangle text-6xl text-red-400 mb-4" />
      <h2 class="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-2">Racer Not Found</h2>
      <p class="text-gray-600 dark:text-gray-300 mb-2">
        The racer you're looking for doesn't exist or has been removed.
      </p>
      <p class="text-sm text-gray-500 dark:text-gray-400 mb-6">
        ID requested: {{ route.params.id }}
      </p>
      <div class="space-x-4">
        <NuxtLink to="/racers">
          <Button>Back to All Racers</Button>
        </NuxtLink>
      </div>
    </div>

    <!-- Racer Details -->
    <div v-else-if="racer">
      <!-- Header -->
      <div class="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
        <div>
          <h1 class="text-3xl font-bold text-gray-900 dark:text-white mb-2">{{ racer.name }}</h1>
        </div>

        <div class="flex gap-2 mt-4 md:mt-0">
          <NuxtLink v-if="canEdit" :to="`/racers/${racer.id}/edit`">
            <Button class="btn-brick-secondary">
              <i class="pi pi-pencil mr-2" />
              Edit Racer
            </Button>
          </NuxtLink>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <!-- Main Content -->
        <div class="lg:col-span-2 space-y-6">
          <!-- Photo Gallery -->
          <div
            v-if="allRacerPhotos.length > 0 && allRacerPhotos[0]?.url"
            class="relative bg-white dark:bg-gray-800 rounded-lg shadow-sm border dark:border-gray-700 overflow-hidden"
          >
            <!-- Main Image Display -->
            <div
              class="relative w-full h-64 md:h-96 cursor-pointer group"
              @click="openRacerGallery(0)"
            >
              <Image
                :src="allRacerPhotos[0]?.url"
                :alt="racer.name"
                image-class="w-full h-64 md:h-96 object-cover group-hover:scale-105 transition-transform duration-300"
                class="w-full h-64 md:h-96"
                :preview="false"
              />

              <!-- Hover Overlay -->
              <div
                class="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-300 flex items-center justify-center"
              >
                <div
                  class="opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-white text-center"
                >
                  <i class="pi pi-search-plus text-3xl mb-2" />
                  <p class="text-sm font-medium">
                    View Gallery ({{ allRacerPhotos.length }} photos)
                  </p>
                </div>
              </div>

              <!-- Name Tag Badge -->
              <div
                class="absolute top-4 right-4 bg-white text-gray-800 px-4 py-2 text-lg font-semibold border-2 border-gray-300 shadow-lg"
                style="
                  border-radius: 12px 12px 12px 0;
                  font-family: 'Inter', sans-serif;
                  letter-spacing: 0.05em;
                  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(0, 0, 0, 0.05);
                  min-width: 50px;
                  text-align: center;
                "
              >
                #{{ racer.racer_number }}
              </div>

              <!-- Photo Count Badge -->
              <div
                v-if="allRacerPhotos.length > 1"
                class="absolute bottom-4 left-4 bg-black bg-opacity-60 text-white px-3 py-1 rounded-lg text-sm font-medium"
              >
                <i class="pi pi-images mr-1" />
                {{ allRacerPhotos.length }} photos
              </div>
            </div>

            <!-- Thumbnail Strip (if more than 1 photo) -->
            <div v-if="allRacerPhotos.length > 1" class="p-4 bg-gray-50 dark:bg-gray-700">
              <div class="flex gap-2 overflow-x-auto">
                <div
                  v-for="(photo, index) in allRacerPhotos.slice(1, 6)"
                  :key="index + 1"
                  class="flex-shrink-0 cursor-pointer group"
                  @click="openRacerGallery(index + 1)"
                >
                  <Image
                    :src="photo.url"
                    :alt="`${racer.name} photo ${index + 2}`"
                    image-class="w-16 h-16 object-cover rounded border-2 border-transparent group-hover:border-blue-400 transition-colors"
                    class="w-16 h-16"
                    :preview="false"
                  />
                </div>
                <div
                  v-if="allRacerPhotos.length > 6"
                  class="flex-shrink-0 w-16 h-16 bg-gray-200 dark:bg-gray-600 rounded border-2 border-dashed border-gray-300 dark:border-gray-500 flex items-center justify-center cursor-pointer hover:border-blue-400 transition-colors"
                  @click="openRacerGallery(6)"
                >
                  <span class="text-xs font-medium text-gray-600 dark:text-gray-400"
                    >+{{ allRacerPhotos.length - 6 }}</span
                  >
                </div>
              </div>
            </div>
          </div>

          <!-- No Photos State -->
          <div
            v-else
            class="relative bg-white dark:bg-gray-800 rounded-lg shadow-sm border dark:border-gray-700 overflow-hidden"
          >
            <div
              class="w-full h-64 md:h-96 bg-gray-200 dark:bg-gray-700 flex items-center justify-center"
            >
              <div class="text-center">
                <i class="pi pi-car text-6xl text-gray-400 dark:text-gray-500 mb-4" />
                <p class="text-gray-500 dark:text-gray-300 font-medium">{{ racer.name }}</p>
                <p class="text-gray-400 dark:text-gray-400 text-sm mt-1">No photos uploaded</p>
              </div>
            </div>

            <!-- ID Badge -->
            <div
              class="absolute top-4 right-4 bg-blue-600 text-white px-3 py-2 rounded-lg font-mono text-lg font-bold shadow-lg"
            >
              #{{ racer.racer_number }}
            </div>
          </div>

          <!-- Performance History -->
          <Card v-if="racer.qualifiers?.length">
            <template #title>
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <i class="pi pi-clock" />
                  Qualifying Times
                </div>
                <Select
                  v-model="qualifierSort"
                  :options="sortOptions"
                  option-label="label"
                  option-value="value"
                  placeholder="Sort by"
                  class="w-32"
                  size="small"
                />
              </div>
            </template>
            <template #content>
              <DataTable :value="sortedQualifiers" striped-rows responsive-layout="scroll">
                <Column header="Race">
                  <template #body="slotProps">
                    {{ slotProps.data.races?.name || 'Unknown Race' }}
                  </template>
                </Column>
                <Column field="time" header="Time" sortable>
                  <template #body="slotProps">
                    <Badge
                      :value="formatTime(slotProps.data.time)"
                      :severity="getBadgeSeverity(slotProps.data.time, racer.qualifiers)"
                      class="font-mono"
                    />
                  </template>
                </Column>
                <Column field="created_at" header="Date & Time" sortable>
                  <template #body="slotProps">
                    {{
                      new Date(slotProps.data.created_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })
                    }}
                    at
                    {{
                      new Date(slotProps.data.created_at).toLocaleTimeString('en-US', {
                        hour: 'numeric',
                        minute: '2-digit'
                      })
                    }}
                  </template>
                </Column>
              </DataTable>
            </template>
          </Card>

          <!-- Bracket Results -->
          <Card v-if="racer.brackets?.length">
            <template #title>
              <div class="flex items-center gap-2">
                <i class="pi pi-trophy" />
                Bracket Results
              </div>
            </template>
            <template #content>
              <div class="space-y-4">
                <div
                  v-for="bracket in racer.brackets"
                  :key="bracket.id"
                  class="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600"
                >
                  <div class="flex items-center justify-between mb-3">
                    <div class="flex items-center gap-2">
                      <Badge
                        :value="bracket.bracket_type"
                        :severity="bracket.bracket_type === 'Fastest' ? 'success' : 'info'"
                      />
                      <span class="text-sm text-gray-600 dark:text-gray-400">{{
                        bracket.races?.name
                      }}</span>
                    </div>
                  </div>

                  <div class="grid grid-cols-2 gap-4">
                    <!-- Track 1 -->
                    <div
                      :class="[
                        'relative text-center p-3 rounded border transition-all',
                        bracket.track1_racer_id === racer.id
                          ? 'bg-blue-100 dark:bg-blue-900/30 border-blue-300 dark:border-blue-600 ring-2 ring-blue-400/50'
                          : isTrack1Winner(bracket)
                            ? 'bg-green-50 dark:bg-green-900/30 border-green-300 dark:border-green-600'
                            : 'bg-white dark:bg-gray-600 border-gray-200 dark:border-gray-500'
                      ]"
                    >
                      <!-- Winner Crown -->
                      <div
                        v-if="isTrack1Winner(bracket)"
                        class="absolute -top-2 -right-2 w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center border-2 border-white dark:border-gray-800"
                      >
                        <i class="pi pi-crown text-xs text-yellow-800" />
                      </div>

                      <!-- Current Racer Badge -->
                      <div
                        v-if="bracket.track1_racer_id === racer.id"
                        class="absolute -top-2 -left-2 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center border-2 border-white dark:border-gray-800"
                      >
                        <i class="pi pi-user text-xs text-white" />
                      </div>

                      <div
                        :class="[
                          'font-medium mb-1',
                          bracket.track1_racer_id === racer.id
                            ? 'text-blue-900 dark:text-blue-200'
                            : 'text-gray-900 dark:text-white'
                        ]"
                      >
                        {{ bracket.track1_racer?.name || 'Unknown' }}
                      </div>
                      <div class="text-sm text-gray-600 dark:text-gray-400 mb-2">Track 1</div>
                      <Badge
                        v-if="bracket.track1_time"
                        :value="formatTime(bracket.track1_time)"
                        :severity="getBracketResultSeverity(bracket, 1, racer.id)"
                        class="font-mono"
                      />
                      <span v-else class="text-gray-400">No time</span>
                    </div>

                    <!-- Track 2 -->
                    <div
                      :class="[
                        'relative text-center p-3 rounded border transition-all',
                        bracket.track2_racer_id === racer.id
                          ? 'bg-blue-100 dark:bg-blue-900/30 border-blue-300 dark:border-blue-600 ring-2 ring-blue-400/50'
                          : isTrack2Winner(bracket)
                            ? 'bg-green-50 dark:bg-green-900/30 border-green-300 dark:border-green-600'
                            : 'bg-white dark:bg-gray-600 border-gray-200 dark:border-gray-500'
                      ]"
                    >
                      <!-- Winner Crown -->
                      <div
                        v-if="isTrack2Winner(bracket)"
                        class="absolute -top-2 -right-2 w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center border-2 border-white dark:border-gray-800"
                      >
                        <i class="pi pi-crown text-xs text-yellow-800" />
                      </div>

                      <!-- Current Racer Badge -->
                      <div
                        v-if="bracket.track2_racer_id === racer.id"
                        class="absolute -top-2 -left-2 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center border-2 border-white dark:border-gray-800"
                      >
                        <i class="pi pi-user text-xs text-white" />
                      </div>

                      <div
                        :class="[
                          'font-medium mb-1',
                          bracket.track2_racer_id === racer.id
                            ? 'text-blue-900 dark:text-blue-200'
                            : 'text-gray-900 dark:text-white'
                        ]"
                      >
                        {{ bracket.track2_racer?.name || 'Unknown' }}
                      </div>
                      <div class="text-sm text-gray-600 dark:text-gray-400 mb-2">Track 2</div>
                      <Badge
                        v-if="bracket.track2_time"
                        :value="formatTime(bracket.track2_time)"
                        :severity="getBracketResultSeverity(bracket, 2, racer.id)"
                        class="font-mono"
                      />
                      <span v-else class="text-gray-400">No time</span>
                    </div>
                  </div>
                </div>
              </div>
            </template>
          </Card>

          <!-- Racer Gallery Lightbox -->
          <Galleria
            v-model:visible="racerGalleryVisible"
            v-model:active-index="activeRacerImageIndex"
            :value="racerGalleryImages"
            :circular="true"
            :full-screen="true"
            :show-item-navigators="true"
            :show-thumbnails="false"
            :show-item-navigators-on-hover="true"
            :show-indicators="false"
          >
            <template #item="{ item }">
              <div class="flex justify-center items-center w-full h-full">
                <img
                  :src="item.itemImageSrc"
                  :alt="item.alt"
                  class="max-w-full max-h-full object-contain"
                  style="max-height: 80vh; max-width: 90vw"
                >
              </div>
            </template>
          </Galleria>
        </div>

        <!-- Sidebar -->
        <div class="space-y-6">
          <!-- About this Racer -->
          <Card v-if="racer.team_members">
            <template #title>
              <div class="flex items-center gap-2">
                <i class="pi pi-info-circle" />
                About this Racer
              </div>
            </template>
            <template #content>
              <p class="text-gray-900 dark:text-white leading-relaxed whitespace-pre-wrap">
                {{ racer.team_members }}
              </p>
            </template>
          </Card>

          <!-- Awards -->
          <Card v-if="racer.awards?.length">
            <template #title>
              <div class="flex items-center gap-2">
                <i class="pi pi-trophy" />
                Awards
              </div>
            </template>
            <template #content>
              <div class="space-y-3">
                <div
                  v-for="award in racer.awards"
                  :key="award.id"
                  class="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
                >
                  <!-- Award Image -->
                  <div class="mb-3">
                    <img
                      v-if="award.award_definition?.image_url"
                      :src="award.award_definition.image_url"
                      :alt="award.award_definition.name"
                      class="w-full aspect-square object-cover rounded border border-gray-300 dark:border-gray-600"
                    >
                    <div
                      v-else
                      class="w-full aspect-square bg-gray-100 dark:bg-gray-700 rounded border border-gray-300 dark:border-gray-600 flex items-center justify-center"
                    >
                      <i class="pi pi-trophy text-amber-600 dark:text-amber-400 text-4xl" />
                    </div>
                  </div>

                  <!-- Award Info -->
                  <div class="text-center">
                    <p class="font-semibold text-gray-900 dark:text-white">
                      {{ award.award_definition?.name || award.name }}
                    </p>
                    <p class="text-gray-600 dark:text-gray-300 text-sm">
                      {{ award.race?.name || 'Unknown Race' }}
                    </p>
                    <p
                      v-if="award.award_definition?.description"
                      class="text-gray-500 dark:text-gray-400 text-xs mt-1"
                    >
                      {{ award.award_definition.description }}
                    </p>
                  </div>
                </div>
              </div>
            </template>
          </Card>

          <!-- Quick Stats -->
          <Card>
            <template #title>Quick Stats</template>
            <template #content>
              <div class="space-y-4">
                <div v-if="racer.weight" class="flex justify-between">
                  <span class="text-gray-600 dark:text-gray-300">Weight</span>
                  <span class="font-semibold text-gray-900 dark:text-white"
                    >{{ (racer.weight / 453.592).toFixed(2) }} lbs</span
                  >
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-600 dark:text-gray-300">Fastest Time</span>
                  <span class="font-semibold text-gray-900 dark:text-white">{{
                    fastestTime || 'N/A'
                  }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-600 dark:text-gray-300">Slowest Time</span>
                  <span class="font-semibold text-gray-900 dark:text-white">{{
                    slowestTime || 'N/A'
                  }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-600 dark:text-gray-300">Total Races</span>
                  <span class="font-semibold text-gray-900 dark:text-white">{{ totalRaces }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-600 dark:text-gray-300">Awards Won</span>
                  <span class="font-semibold text-gray-900 dark:text-white">{{
                    racer.awards?.length || 0
                  }}</span>
                </div>
              </div>
            </template>
          </Card>
        </div>
      </div>
    </div>
    </div>
  </div>
</template>

<script setup>
import { useAuthStore } from '~/stores/auth'

const route = useRoute()
const authStore = useAuthStore()
const { $supabase } = useNuxtApp()

const racer = ref(null)
const pending = ref(true)
const error = ref(null)

// Qualifier sorting
const qualifierSort = ref('fastest')
const sortOptions = [
  { label: 'Fastest First', value: 'fastest' },
  { label: 'Slowest First', value: 'slowest' },
  { label: 'Most Recent', value: 'recent' },
  { label: 'Oldest First', value: 'oldest' }
]

// Breadcrumb navigation
const breadcrumbItems = computed(() => [
  { label: 'Home', url: '/' },
  { label: 'Racers', url: '/racers' },
  { label: racer.value?.name || 'Racer Details' } // Current page, no navigation
])

// Fetch racer data from Supabase
const fetchRacer = async () => {
  try {
    // Fetch racer basic data
    const { data: racerData, error: racerError } = await $supabase
      .from('racers')
      .select('*')
      .eq('id', route.params.id)
      .single()

    if (racerError) throw racerError

    // Fetch related data separately
    const { data: qualifiersData } = await $supabase
      .from('qualifiers')
      .select(
        `
        *,
        races!inner(name)
      `
      )
      .eq('racer_id', route.params.id)
      .order('created_at', { ascending: false })

    const { data: awardsData } = await $supabase
      .from('awards')
      .select(
        `
        *,
        award_definition:award_definitions(name, description, image_url),
        race:races(name)
      `
      )
      .eq('racer_id', route.params.id)
      .order('created_at', { ascending: false })

    // Fetch bracket results
    const { data: bracketsData } = await $supabase
      .from('brackets')
      .select(
        `
        *,
        races!inner(name),
        track1_racer:track1_racer_id(name),
        track2_racer:track2_racer_id(name)
      `
      )
      .or(`track1_racer_id.eq.${route.params.id},track2_racer_id.eq.${route.params.id}`)
      .order('created_at', { ascending: false })

    // Try to get the actual user info for the owner
    let ownerInfo = {
      id: racerData.user_id,
      email: 'Unknown User',
      user_metadata: { username: 'Unknown User' }
    }

    // If this is the current user's racer, we can get their info from the auth store
    if (racerData.user_id === authStore.userId && authStore.user) {
      ownerInfo = {
        id: authStore.user.id,
        email: authStore.user.email,
        user_metadata: authStore.user.user_metadata || {}
      }
    }

    // Combine the data
    racer.value = {
      ...racerData,
      owner: ownerInfo,
      qualifiers: qualifiersData || [],
      awards: awardsData || [],
      brackets: bracketsData || []
    }
  } catch (err) {
    console.error('Error fetching racer:', err)
    error.value = err
  } finally {
    pending.value = false
  }
}

// Computed properties

// Sorted qualifiers based on selected sort option
const sortedQualifiers = computed(() => {
  const qualifiers = racer.value?.qualifiers
  if (!qualifiers || qualifiers.length === 0) return []

  const sorted = [...qualifiers]

  switch (qualifierSort.value) {
    case 'fastest':
      return sorted.sort((a, b) => Number.parseFloat(a.time) - Number.parseFloat(b.time))
    case 'slowest':
      return sorted.sort((a, b) => Number.parseFloat(b.time) - Number.parseFloat(a.time))
    case 'recent':
      return sorted.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    case 'oldest':
      return sorted.sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
    default:
      return sorted
  }
})

const fastestTime = computed(() => {
  const qualifiers = racer.value?.qualifiers
  if (!qualifiers || qualifiers.length === 0) return null

  const times = qualifiers.map((q) => Number.parseFloat(q.time)).filter((t) => !Number.isNaN(t))
  if (times.length === 0) return null

  const fastest = Math.min(...times)
  return formatTime(fastest)
})

const slowestTime = computed(() => {
  const qualifiers = racer.value?.qualifiers
  if (!qualifiers || qualifiers.length === 0) return null

  const times = qualifiers.map((q) => Number.parseFloat(q.time)).filter((t) => !Number.isNaN(t))
  if (times.length === 0) return null

  const slowest = Math.max(...times)
  return formatTime(slowest)
})

// Calculate total unique races participated in
const totalRaces = computed(() => {
  const qualifiers = racer.value?.qualifiers
  if (!qualifiers || qualifiers.length === 0) return 0

  // Count unique race IDs
  const uniqueRaceIds = new Set(qualifiers.map((q) => q.race_id))
  return uniqueRaceIds.size
})

const canEdit = computed(() => {
  if (!authStore.isAuthenticated || !racer.value) return false

  // User can edit if they own the racer or if they're an admin
  return racer.value.user_id === authStore.userId || authStore.isAdmin
})

// Filter photos to only show approved ones
const approvedPhotos = computed(() => {
  if (!racer.value?.photos || !Array.isArray(racer.value.photos)) return []

  return racer.value.photos.filter((photo) => {
    const status = photo.status || 'approved'
    return status === 'approved'
  })
})

// Combine main image and gallery photos for unified gallery experience
const allRacerPhotos = computed(() => {
  const photos = []

  // Add main image first if it exists
  if (racer.value?.image_url) {
    photos.push({
      url: racer.value.image_url
    })
  }

  // Add approved gallery photos
  for (const photo of approvedPhotos.value) {
    photos.push({
      url: photo.url || photo
    })
  }

  return photos
})

// Gallery state
const racerGalleryVisible = ref(false)
const activeRacerImageIndex = ref(0)

// Convert photos for Galleria component
const racerGalleryImages = computed(() => {
  return allRacerPhotos.value
    .filter((photo) => photo && photo.url)
    .map((photo, index) => ({
      itemImageSrc: photo.url,
      alt: `${racer.value?.name} photo ${index + 1}`
    }))
})

// Open gallery at specific index
const openRacerGallery = (index) => {
  activeRacerImageIndex.value = index
  racerGalleryVisible.value = true
}

// Helper functions
const formatTime = (time) => {
  if (!time) return 'N/A'
  return `${Number.parseFloat(time).toFixed(2)}s`
}

const getBadgeSeverity = (time, allQualifiers) => {
  if (!time || !allQualifiers || allQualifiers.length === 0) return 'secondary'

  const times = allQualifiers.map((q) => Number.parseFloat(q.time)).filter((t) => !Number.isNaN(t))
  if (times.length === 0) return 'secondary'

  const sortedTimes = [...times].sort((a, b) => a - b)
  const currentTime = Number.parseFloat(time)
  const bestTime = sortedTimes[0]
  const worstTime = sortedTimes[sortedTimes.length - 1]

  if (currentTime === bestTime) return 'success'
  if (currentTime === worstTime && times.length > 1) return 'danger'
  if (currentTime <= bestTime * 1.1) return 'info'
  return 'secondary'
}

const getBracketResultSeverity = (bracket, track, racerId) => {
  if (!bracket.track1_time || !bracket.track2_time) return 'secondary'

  const time1 = Number.parseFloat(bracket.track1_time)
  const time2 = Number.parseFloat(bracket.track2_time)

  // Determine which racer this is
  const isTrack1 =
    (track === 1 && bracket.track1_racer_id === racerId) ||
    (track === 2 && bracket.track2_racer_id === racerId)
  const isTrack2 =
    (track === 1 && bracket.track2_racer_id === racerId) ||
    (track === 2 && bracket.track1_racer_id === racerId)

  if (!isTrack1 && !isTrack2) return 'secondary'

  // For Fastest bracket: lower time wins
  // For Slowest bracket: higher time wins
  if (bracket.bracket_type === 'Fastest') {
    const winnerTime = Math.min(time1, time2)
    const currentTime = track === 1 ? time1 : time2
    return currentTime === winnerTime ? 'success' : 'danger'
  } else {
    const winnerTime = Math.max(time1, time2)
    const currentTime = track === 1 ? time1 : time2
    return currentTime === winnerTime ? 'success' : 'danger'
  }
}


// Check if track 1 racer is the winner
const isTrack1Winner = (bracket) => {
  if (!bracket.track1_time || !bracket.track2_time) return false

  const time1 = Number.parseFloat(bracket.track1_time)
  const time2 = Number.parseFloat(bracket.track2_time)

  if (bracket.bracket_type === 'Fastest') {
    return time1 < time2
  } else {
    return time1 > time2
  }
}

// Check if track 2 racer is the winner
const isTrack2Winner = (bracket) => {
  if (!bracket.track1_time || !bracket.track2_time) return false

  const time1 = Number.parseFloat(bracket.track1_time)
  const time2 = Number.parseFloat(bracket.track2_time)

  if (bracket.bracket_type === 'Fastest') {
    return time2 < time1
  } else {
    return time2 > time1
  }
}

// Initialize auth and fetch data
onMounted(async () => {
  await authStore.initAuth()
  await fetchRacer()
})

useHead({
  title: computed(() =>
    racer.value
      ? `${racer.value.name} - The Great Holyoke Brick Race`
      : 'Racer - The Great Holyoke Brick Race'
  )
})
</script>

<style scoped>
/* Custom gallery styling */
:deep(.p-galleria-item) {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
}

:deep(.p-galleria-item-nav) {
  background: rgba(0, 0, 0, 0.6);
  color: white;
  border-radius: 50%;
  width: 3rem;
  height: 3rem;
  transition: all 0.3s ease;
}

:deep(.p-galleria-item-nav:hover) {
  background: rgba(0, 0, 0, 0.8);
  transform: scale(1.1);
}

:deep(.p-galleria-item-nav:focus) {
  background: rgba(59, 130, 246, 0.8);
  outline: 3px solid #3b82f6;
  outline-offset: 2px;
  transform: scale(1.1);
}

:deep(.p-galleria-item-nav-prev) {
  left: 1rem;
}

:deep(.p-galleria-item-nav-next) {
  right: 1rem;
}

:deep(.p-galleria-close) {
  background: rgba(0, 0, 0, 0.6);
  color: white;
  border-radius: 50%;
  width: 3rem;
  height: 3rem;
  top: 1rem;
  right: 1rem;
  transition: all 0.3s ease;
}

:deep(.p-galleria-close:hover) {
  background: rgba(0, 0, 0, 0.8);
  transform: scale(1.1);
}
</style>
