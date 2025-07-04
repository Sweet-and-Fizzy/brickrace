<template>
  <div>
    <!-- Featured Race (Hero Section) -->
    <div
      v-if="activeRace && !pending"
      class="relative text-white min-h-[600px] flex items-center"
      :style="heroBackgroundStyle"
    >
      <!-- Dark overlay for text readability -->
      <div class="absolute inset-0 bg-black bg-opacity-50" />

      <div class="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 w-full">
        <div class="text-center mb-12">
          <h1 class="text-4xl md:text-6xl font-bold text-white mb-6 drop-shadow-lg">
            {{ activeRace.name }}
          </h1>
          <p class="text-xl md:text-2xl text-white mb-8 drop-shadow-md">
            {{
              new Date(activeRace.date).toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })
            }}
          </p>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-12">
          <!-- Race Image -->
          <div class="order-2 lg:order-1">
            <div class="bg-white/10 backdrop-blur-sm rounded-2xl p-4 shadow-2xl">
              <Image
                v-if="activeRace.image_url"
                :src="activeRace.image_url"
                :alt="activeRace.name"
                image-class="w-full h-64 md:h-80 object-cover rounded-xl"
                class="w-full h-64 md:h-80"
              />
              <div
                v-else
                class="w-full h-64 md:h-80 bg-white/20 rounded-xl flex items-center justify-center"
              >
                <i class="pi pi-flag text-6xl text-white/60" />
              </div>
            </div>
          </div>

          <!-- Race Info and Stats -->
          <div class="order-1 lg:order-2 space-y-6">
            <!-- Countdown Timer -->
            <div
              class="text-center mb-6 p-8 bg-gradient-to-r from-red-600/30 to-red-900/40 backdrop-blur-sm rounded-2xl border-2 border-red-500/40 shadow-2xl"
            >
              <h3 class="text-2xl font-bold text-white mb-6 animate-pulse">⚡ RACE COUNTDOWN ⚡</h3>
              <div v-if="countdown.isActive" class="grid grid-cols-4 gap-6">
                <div class="text-center transform hover:scale-105 transition-transform">
                  <div
                    class="text-5xl md:text-6xl font-black text-white drop-shadow-lg animate-bounce"
                  >
                    {{ countdown.days }}
                  </div>
                  <div class="text-sm font-bold text-white tracking-widest">DAYS</div>
                </div>
                <div class="text-center transform hover:scale-105 transition-transform">
                  <div class="text-5xl md:text-6xl font-black text-white drop-shadow-lg">
                    {{ countdown.hours }}
                  </div>
                  <div class="text-sm font-bold text-white tracking-widest">HOURS</div>
                </div>
                <div class="text-center transform hover:scale-105 transition-transform">
                  <div class="text-5xl md:text-6xl font-black text-white drop-shadow-lg">
                    {{ countdown.minutes }}
                  </div>
                  <div class="text-sm font-bold text-white tracking-widest">MINUTES</div>
                </div>
                <div class="text-center transform hover:scale-105 transition-transform">
                  <div
                    class="text-5xl md:text-6xl font-black text-white drop-shadow-lg animate-pulse"
                  >
                    {{ countdown.seconds }}
                  </div>
                  <div class="text-sm font-bold text-white tracking-widest">SECONDS</div>
                </div>
              </div>
              <div v-else class="text-4xl font-black text-white animate-bounce">
                🚀 RACE DAY IS HERE! 🚀
              </div>
            </div>

            <div v-if="(activeRace.checkinCount || 0) > 0" class="flex justify-center">
              <div
                class="text-center p-4 bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 min-w-[200px]"
              >
                <div class="text-2xl font-bold text-white mb-1">
                  {{ activeRace.checkinCount || 0 }}
                </div>
                <div class="text-sm text-blue-100">Racers Checked In</div>
              </div>
            </div>

            <div class="text-center">
              <p class="text-lg text-blue-100 mb-6">
                Custom gravity-powered vehicles competing for speed, creativity, and artistry
              </p>
            </div>
          </div>
        </div>

        <div class="flex justify-center">
          <Button
            size="large"
            class="bg-red-600 text-white hover:bg-red-700 font-bold px-10 py-4 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 border-2 border-red-500 hover:border-red-400"
            @click="navigateTo(`/races/${activeRace.id}`)"
          >
            <i class="pi pi-flag mr-3 text-lg" />
            View Race Details
          </Button>
        </div>
      </div>
    </div>

    <!-- Default Hero Section (when no active race) -->
    <div v-else-if="!pending" class="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div class="text-center">
          <h1 class="text-4xl md:text-6xl font-bold mb-6">🏁 The Great Holyoke Brick Race</h1>
          <p class="text-xl md:text-2xl mb-8 text-blue-100">
            Custom gravity-powered vehicles competing for speed, creativity, and artistry
          </p>
          <div class="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button
              size="large"
              icon="pi pi-flag"
              class="bg-white text-blue-600 hover:bg-gray-100 shadow-lg hover:shadow-xl transition-all duration-200"
              @click="navigateTo('/races')"
            >
              View Races
            </Button>
            <Button
              size="large"
              icon="pi pi-car"
              outlined
              class="border-white text-white hover:bg-white hover:text-blue-600 shadow-lg hover:shadow-xl transition-all duration-200"
              @click="navigateTo('/racers')"
            >
              Browse Vehicles
            </Button>
            <Button
              size="large"
              icon="pi pi-info-circle"
              outlined
              class="border-white text-white hover:bg-white hover:text-blue-600 shadow-lg hover:shadow-xl transition-all duration-200"
              @click="navigateTo('/about')"
            >
              Learn More
            </Button>
          </div>
        </div>
      </div>
    </div>

    <!-- Call to Action Section -->
    <div class="py-16 bg-white dark:bg-gray-900">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <!-- Logo and Title -->
        <div class="text-center mb-12">
          <div class="flex justify-center mb-6">
            <img
              src="~/assets/img/brick_race_logo.jpg"
              alt="The Great Holyoke Brick Race Logo"
              class="h-32 md:h-40 w-auto object-contain rounded-lg"
            />
          </div>
          <h2 class="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
            The Great Holyoke Brick Race
          </h2>
          <p class="text-lg text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
            Where performance art meets sport in the first brick race of its kind
          </p>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <!-- Learn About Our History -->
          <Card class="border-2 border-blue-200 dark:border-blue-800 h-full">
            <template #content>
              <div class="text-center space-y-6 h-full flex flex-col">
                <div class="flex justify-center">
                  <div
                    class="bg-gradient-to-r from-blue-600 to-purple-600 rounded-full w-16 h-16 flex items-center justify-center"
                  >
                    <i class="pi pi-clock text-2xl text-white" />
                  </div>
                </div>

                <div class="flex-1">
                  <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                    Discover Our History
                  </h2>
                  <p class="text-gray-700 dark:text-gray-300 leading-relaxed mb-6">
                    Learn about the unique story behind The Great Holyoke Brick Race - from its
                    conception by local artists in 2010 to becoming the first brick race of its kind
                    in the country.
                  </p>
                  <p class="text-gray-600 dark:text-gray-400 mb-6">
                    Explore 14 years of creative racing history, memorable designs, and the
                    community spirit that makes this event special.
                  </p>
                </div>

                <Button
                  size="large"
                  severity="primary"
                  class="font-semibold w-full"
                  @click="navigateTo('/about')"
                >
                  <i class="pi pi-book mr-2" />
                  Read Our History
                </Button>
              </div>
            </template>
          </Card>

          <!-- Build Your Own Racer -->
          <Card class="border-2 border-green-200 dark:border-green-800 h-full">
            <template #content>
              <div class="text-center space-y-6 h-full flex flex-col">
                <div class="flex justify-center">
                  <div
                    class="bg-gradient-to-r from-green-600 to-blue-600 rounded-full w-16 h-16 flex items-center justify-center"
                  >
                    <i class="pi pi-wrench text-2xl text-white" />
                  </div>
                </div>

                <div class="flex-1">
                  <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                    Build Your Own Racer
                  </h2>
                  <p class="text-gray-700 dark:text-gray-300 leading-relaxed mb-6">
                    Ready to join the creative chaos? Learn everything you need to know about
                    building your brick racer, from specifications and rules to awards and race day
                    logistics.
                  </p>
                  <p class="text-gray-600 dark:text-gray-400 mb-6">
                    Open to all ages and backgrounds worldwide - artists, engineers, tinkerers, and
                    dreamers welcome!
                  </p>
                </div>

                <Button
                  size="large"
                  severity="success"
                  class="font-semibold w-full"
                  @click="navigateTo('/build-racer')"
                >
                  <i class="pi pi-car mr-2" />
                  Get Started Building
                </Button>
              </div>
            </template>
          </Card>
        </div>
      </div>
    </div>

    <!-- Featured Photos -->
    <div v-if="!pending && featuredPhotos.length > 0" class="py-16 bg-gray-50 dark:bg-gray-800">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="text-center mb-12">
          <h2 class="text-3xl font-bold text-gray-900 dark:text-white mb-4">Featured Photos</h2>
          <p class="text-lg text-gray-600 dark:text-gray-400">
            Highlights from our creative racing community
          </p>
        </div>

        <!-- Galleria Component -->
        <div class="flex justify-center">
          <div class="w-full max-w-3xl">
            <Galleria
              :value="featuredGalleryImages"
              :responsive-options="galleryResponsiveOptions"
              :num-visible="4"
              :show-thumbnails="true"
              :show-indicators="false"
              :circular="true"
              :auto-play="true"
              :transition-interval="5000"
              container-style="width: 100%"
              thumbnails-position="bottom"
            >
              <template #item="{ item }">
                <div
                  class="relative cursor-pointer group"
                  @click="
                    openFeaturedGallery(
                      featuredPhotos.findIndex((p) => p && p.url === item.itemImageSrc)
                    )
                  "
                >
                  <img
                    :src="item.itemImageSrc"
                    :alt="item.alt"
                    class="w-full h-96 object-cover rounded-lg shadow-lg"
                  />

                  <!-- Click to expand hint -->
                  <div
                    class="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-300 flex items-center justify-center rounded-lg"
                  >
                    <div
                      class="opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-white text-center"
                    >
                      <i class="pi pi-search-plus text-2xl mb-2" />
                      <p class="text-sm font-medium">Click to view gallery</p>
                    </div>
                  </div>
                </div>
              </template>

              <template #thumbnail="{ item }">
                <div class="p-2">
                  <img
                    :src="item.thumbnailImageSrc"
                    :alt="item.alt"
                    class="w-20 h-16 object-cover rounded border-2 border-transparent hover:border-blue-400 transition-colors cursor-pointer"
                  />
                </div>
              </template>
            </Galleria>
          </div>
        </div>

        <!-- View More Links -->
        <div class="text-center mt-12 space-y-6">
          <div class="flex flex-col sm:flex-row gap-4 justify-center">
            <NuxtLink to="/gallery">
              <Button outlined size="large">
                <i class="pi pi-images mr-2" />
                View Photo Gallery
              </Button>
            </NuxtLink>
            <NuxtLink to="/my-photos">
              <Button severity="secondary" outlined size="large">
                <i class="pi pi-upload mr-2" />
                Share Your Photos
              </Button>
            </NuxtLink>
          </div>

          <div
            class="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 max-w-2xl mx-auto"
          >
            <p class="text-sm text-green-800 dark:text-green-200">
              <i class="pi pi-info-circle mr-2" />
              Have photos from races or events? Help build our community gallery by uploading and
              sharing your shots!
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- Featured Photos Lightbox -->
    <Galleria
      v-model:visible="featuredGalleryVisible"
      v-model:active-index="activeFeaturedIndex"
      :value="featuredGalleryImages"
      container-style="max-width: 95vw; max-height: 95vh"
      :circular="true"
      :full-screen="true"
      :show-item-navigators="true"
      :show-thumbnails="false"
      :show-item-navigators-on-hover="true"
      :show-indicators="false"
    >
      <template #item="{ item }">
        <div class="flex justify-center items-center h-full">
          <img
            :src="item.itemImageSrc"
            :alt="item.alt"
            class="max-w-full max-h-full object-contain"
            style="max-height: 90vh"
          />
        </div>
      </template>
    </Galleria>

    <!-- Past Races -->
    <div v-if="!pending && pastRaces.length > 0" class="py-16 bg-gray-50 dark:bg-gray-800">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 class="text-3xl font-bold text-center mb-12 text-gray-900 dark:text-white">
          Past Races
        </h2>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card v-for="race in pastRaces" :key="race.id" class="hover:shadow-lg transition-shadow">
            <template #header>
              <Image
                v-if="race.image_url"
                :src="race.image_url"
                :alt="race.name"
                image-class="w-full h-48 object-cover"
                class="w-full h-48"
                preview
              />
              <div
                v-else
                class="w-full h-48 bg-gray-200 dark:bg-gray-700 flex items-center justify-center"
              >
                <i class="pi pi-flag text-4xl text-gray-400 dark:text-gray-500" />
              </div>
            </template>

            <template #title>{{ race.name }}</template>

            <template #subtitle>
              {{ new Date(race.date).toLocaleDateString() }}
            </template>

            <template #footer>
              <div class="flex justify-between items-center">
                <Badge :value="`${race.checkinCount || 0} racers`" />
                <NuxtLink :to="`/races/${race.id}`">
                  <Button text>View Details</Button>
                </NuxtLink>
              </div>
            </template>
          </Card>
        </div>

        <div class="text-center mt-8">
          <NuxtLink to="/races">
            <Button outlined>View All Races</Button>
          </NuxtLink>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
const { $supabase } = useNuxtApp()

const recentRaces = ref([])
const activeRace = ref(null)
const pending = ref(true)
const countdown = ref({
  days: 0,
  hours: 0,
  minutes: 0,
  seconds: 0,
  isActive: false
})

// Featured photos state
const featuredPhotos = ref([])
const featuredGalleryVisible = ref(false)
const activeFeaturedIndex = ref(0)

// Fetch races from Supabase
const fetchRaces = async () => {
  try {
    const { data, error } = await $supabase
      .from('races')
      .select('*')
      .order('date', { ascending: false })
      .limit(6)

    if (error) throw error

    const races = data || []

    // Get checkin counts for each race
    for (const race of races) {
      const { count } = await $supabase
        .from('checkins')
        .select('*', { count: 'exact', head: true })
        .eq('race_id', race.id)

      race.checkinCount = count || 0
    }

    recentRaces.value = races

    // Find the active race
    activeRace.value = races.find((race) => race.active) || null
  } catch (error) {
    console.error('Error fetching races:', error)
    recentRaces.value = []
    activeRace.value = null
  } finally {
    pending.value = false
  }
}

// Show past races (excluding active race)
const pastRaces = computed(() => {
  return recentRaces.value
    .filter((race) => !race.active) // Exclude active race
    .slice(0, 6) // Show last 6 past races
})

// Countdown timer logic
const updateCountdown = () => {
  if (!activeRace.value?.date) {
    countdown.value.isActive = false
    return
  }

  const now = new Date().getTime()
  const raceTime = new Date(activeRace.value.date).getTime()
  const distance = raceTime - now

  if (distance > 0) {
    countdown.value.isActive = true
    countdown.value.days = Math.floor(distance / (1000 * 60 * 60 * 24))
    countdown.value.hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
    countdown.value.minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60))
    countdown.value.seconds = Math.floor((distance % (1000 * 60)) / 1000)
  } else {
    countdown.value.isActive = false
  }
}

// Update countdown every second
let countdownInterval = null

// Fetch data on mount
onMounted(() => {
  fetchRaces()
  fetchFeaturedPhotos()

  // Start countdown timer
  countdownInterval = setInterval(updateCountdown, 1000)
})

onUnmounted(() => {
  if (countdownInterval) {
    clearInterval(countdownInterval)
  }
})

// Watch for activeRace changes to update countdown
watch(
  activeRace,
  () => {
    updateCountdown()
  },
  { immediate: true }
)

// Hero background style using featured photo
const heroBackgroundStyle = computed(() => {
  const heroPhoto = featuredPhotos.value[0]?.url
  if (heroPhoto) {
    return {
      backgroundImage: `url(${heroPhoto})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat'
    }
  }

  // Fallback to a subtle gradient if no featured photo
  return {
    background: 'linear-gradient(135deg, #c53030 0%, #9c1c1c 100%)'
  }
})

// Featured photos computed properties
const featuredGalleryImages = computed(() => {
  return featuredPhotos.value
    .filter((photo) => photo && photo.url)
    .map((photo, index) => ({
      itemImageSrc: photo.url,
      thumbnailImageSrc: photo.url,
      alt: `Featured Photo ${index + 1}`
    }))
})

const galleryResponsiveOptions = ref([
  { breakpoint: '1024px', numVisible: 5 },
  { breakpoint: '768px', numVisible: 3 },
  { breakpoint: '560px', numVisible: 1 }
])

// Featured photos functions
const fetchFeaturedPhotos = async () => {
  try {
    const allFeaturedPhotos = []

    // Fetch featured general photos (just URLs)
    const { data: generalPhotos, error: generalError } = await $supabase
      .from('general_photos')
      .select('url')
      .eq('featured', true)
      .eq('status', 'approved')
      .order('uploaded_at', { ascending: false })
      .limit(6)

    if (generalError) {
      console.error('Error fetching general photos:', generalError)
    } else {
      // Add general photo URLs
      for (const photo of generalPhotos || []) {
        allFeaturedPhotos.push({ url: photo.url })
      }
    }

    // Fetch racer photos that are featured (just URLs)
    const { data: racerData, error: racerError } = await $supabase
      .from('racers')
      .select('photos')
      .not('photos', 'is', null)
      .order('created_at', { ascending: false })
      .limit(10)

    if (racerError) {
      console.error('Error fetching racer photos:', racerError)
    } else {
      // Process racer photos - look for featured ones
      for (const racer of racerData || []) {
        if (racer.photos && Array.isArray(racer.photos)) {
          for (const photo of racer.photos) {
            // Handle both string URLs and photo objects
            let photoObj = photo
            if (typeof photo === 'string') {
              try {
                // Try to parse as JSON in case it's a stringified object
                photoObj = JSON.parse(photo)
              } catch {
                // If parsing fails, treat as simple URL string
                photoObj = { url: photo, status: 'approved', featured: false }
              }
            }

            // Only include approved and featured racer photos
            const photoStatus = photoObj.status || 'approved'
            if (photoObj.featured && photoStatus === 'approved') {
              allFeaturedPhotos.push({ url: photoObj.url || photoObj })
            }
          }
        }
      }
    }

    // If no featured photos found, get some recent approved photos as fallback
    if (allFeaturedPhotos.length === 0) {
      // Fetch recent general photos as fallback
      const { data: fallbackGeneralPhotos } = await $supabase
        .from('general_photos')
        .select('url')
        .eq('status', 'approved')
        .order('uploaded_at', { ascending: false })
        .limit(4)

      for (const photo of fallbackGeneralPhotos || []) {
        allFeaturedPhotos.push({ url: photo.url })
      }

      // Fetch some recent racer photos as fallback
      const { data: fallbackRacerData } = await $supabase
        .from('racers')
        .select('photos, image_url')
        .not('photos', 'is', null)
        .order('created_at', { ascending: false })
        .limit(5)

      for (const racer of fallbackRacerData || []) {
        // Add main racer image if available
        if (racer.image_url) {
          allFeaturedPhotos.push({ url: racer.image_url })
        }

        // Add first photo from photos array if available
        if (racer.photos && Array.isArray(racer.photos) && racer.photos.length > 0) {
          const firstPhoto = racer.photos[0]
          const photoUrl =
            typeof firstPhoto === 'string' ? firstPhoto : firstPhoto.url || firstPhoto
          if (photoUrl) {
            allFeaturedPhotos.push({ url: photoUrl })
          }
        }
      }
    }

    // Limit to 8 photos and randomize order
    featuredPhotos.value = allFeaturedPhotos.sort(() => Math.random() - 0.5).slice(0, 8)
  } catch (error) {
    console.error('Error fetching featured photos:', error)
    featuredPhotos.value = []
  }
}

const openFeaturedGallery = (index) => {
  activeFeaturedIndex.value = index
  featuredGalleryVisible.value = true
}

useHead({
  title: 'Brick Race Championship - LEGO Car Racing Competition',
  meta: [
    {
      name: 'description',
      content:
        'The ultimate LEGO car racing competition. Track races, manage racers, and compete for awards.'
    }
  ]
})
</script>
