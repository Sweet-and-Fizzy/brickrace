<template>
  <div class="min-h-screen bg-white dark:bg-gray-900">
    <!-- Featured Race (Hero Section) -->
    <div
      v-if="activeRace && !pending"
      class="bg-white dark:bg-gray-900"
    >
      <!-- Race Image at Very Top -->
      <div class="w-full mb-8">
        <Image
          v-if="activeRace.image_url"
          :src="activeRace.image_url"
          :alt="activeRace.name"
          image-class="w-full h-64 md:h-80 object-cover"
          class="w-full h-64 md:h-80"
        />
        <div
          v-else
          class="w-full h-64 md:h-80 bg-gray-200 dark:bg-gray-700 flex items-center justify-center"
        >
          <i class="pi pi-flag text-6xl text-gray-400 dark:text-gray-500" />
        </div>
      </div>

      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div class="text-center mb-12">
          <h1 class="text-4xl md:text-6xl font-bold text-gray-900 dark:text-gray-900 dark:text-white mb-6">
            {{ activeRace.name }}
          </h1>
          <p class="text-xl md:text-2xl text-gray-700 dark:text-gray-300 mb-8">
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

        <!-- Race Info and Stats -->
        <div class="space-y-6 mb-12">
            <!-- Countdown Timer -->
            <div
              class="text-center mb-6 p-8 bg-white dark:bg-gray-800 rounded-2xl border-2 border-brand-gold shadow-lg"
            >
              <h3 class="text-2xl font-bold text-gray-900 dark:text-gray-900 dark:text-white mb-6 animate-pulse">⚡ RACE COUNTDOWN ⚡</h3>
              <div v-if="countdown.isActive" class="grid grid-cols-4 gap-6">
                <div class="text-center transform hover:scale-105 transition-transform">
                  <div
                    class="text-5xl md:text-6xl font-black text-gray-900 dark:text-white drop-shadow-lg animate-bounce"
                  >
                    {{ countdown.days }}
                  </div>
                  <div class="text-sm font-bold text-gray-900 dark:text-white tracking-widest">DAYS</div>
                </div>
                <div class="text-center transform hover:scale-105 transition-transform">
                  <div class="text-5xl md:text-6xl font-black text-gray-900 dark:text-white drop-shadow-lg">
                    {{ countdown.hours }}
                  </div>
                  <div class="text-sm font-bold text-gray-900 dark:text-white tracking-widest">HOURS</div>
                </div>
                <div class="text-center transform hover:scale-105 transition-transform">
                  <div class="text-5xl md:text-6xl font-black text-gray-900 dark:text-white drop-shadow-lg">
                    {{ countdown.minutes }}
                  </div>
                  <div class="text-sm font-bold text-gray-900 dark:text-white tracking-widest">MINUTES</div>
                </div>
                <div class="text-center transform hover:scale-105 transition-transform">
                  <div
                    class="text-5xl md:text-6xl font-black text-gray-900 dark:text-white drop-shadow-lg animate-pulse"
                  >
                    {{ countdown.seconds }}
                  </div>
                  <div class="text-sm font-bold text-gray-900 dark:text-white tracking-widest">SECONDS</div>
                </div>
              </div>
              <div v-else class="text-4xl font-black text-gray-900 dark:text-white animate-bounce">
                🚀 RACE DAY IS HERE! 🚀
              </div>
            </div>

            <div v-if="(activeRace.checkinCount || 0) > 0" class="flex justify-center">
              <div
                class="text-center p-4 bg-white dark:bg-gray-800 rounded-lg border-2 border-gray-300 dark:border-gray-600 min-w-[200px]"
              >
                <div class="text-2xl font-bold text-gray-900 dark:text-gray-900 dark:text-white mb-1">
                  {{ activeRace.checkinCount || 0 }}
                </div>
                <div class="text-sm text-gray-700 dark:text-gray-300">Racers Checked In</div>
              </div>
            </div>

            <div class="text-center">
              <p class="text-lg text-gray-600 dark:text-gray-400 mb-6">
                Custom gravity-powered vehicles competing for speed, creativity, and artistry
              </p>
            </div>
        </div>

        <div class="flex justify-center">
          <Button
            size="large"
            class="btn-primary px-10 py-4"
            @click="navigateTo(`/races/${activeRace.slug || activeRace.id}`)"
          >
            <i class="pi pi-flag mr-3 text-lg" />
            <span>View Race Details</span>
          </Button>
        </div>
      </div>
    </div>

    <!-- Default Hero Section (when no active race) -->
    <div v-else-if="!pending" class="bg-white dark:bg-gray-900">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div class="text-center">
          <h1 class="text-4xl md:text-6xl font-bold mb-6">🏁 The Great Holyoke Brick Race</h1>
          <p class="text-xl md:text-2xl mb-8 text-gray-600 dark:text-gray-400">
            Custom gravity-powered vehicles competing for speed, creativity, and artistry
          </p>
          <div class="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button
              size="large"
              class="btn-primary"
              @click="navigateTo('/races')"
            >
              <i class="pi pi-flag mr-2" />
              <span>View Races</span>
            </Button>
            <Button
              size="large"
              class="btn-secondary"
              @click="navigateTo('/racers')"
            >
              <i class="pi pi-car mr-2" />
              <span>Browse Vehicles</span>
            </Button>
            <Button
              size="large"
              class="btn-secondary"
              @click="navigateTo('/about')"
            >
              <i class="pi pi-info-circle mr-2" />
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
          <h2 class="text-3xl md:text-4xl font-bold text-gray-900 dark:text-gray-900 dark:text-white mb-4">
            The Great Holyoke Brick Race
          </h2>
          <p class="text-lg text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
            Where performance art meets sport in the first brick race of its kind
          </p>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <!-- Learn About Our History -->
          <Card class="shadow-sm hover:shadow-md transition-shadow duration-200 h-full">
            <template #content>
              <div class="text-center space-y-6 h-full flex flex-col">
                <div class="flex justify-center">
                  <div
                    class="bg-brand-blue rounded-full w-16 h-16 flex items-center justify-center"
                  >
                    <i class="pi pi-clock text-2xl text-white" />
                  </div>
                </div>

                <div class="flex-1">
                  <h2 class="text-2xl font-bold text-gray-900 dark:text-gray-900 dark:text-white mb-4">
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

                <Button size="large" class="btn-primary font-semibold" @click="navigateTo('/about')">
                  <i class="pi pi-book mr-2" />
                  <span>Read Our History</span>
                </Button>
              </div>
            </template>
          </Card>

          <!-- Build Your Own Racer -->
          <Card class="shadow-sm hover:shadow-md transition-shadow duration-200 h-full">
            <template #content>
              <div class="text-center space-y-6 h-full flex flex-col">
                <div class="flex justify-center">
                  <div
                    class="bg-brand-green rounded-full w-16 h-16 flex items-center justify-center"
                  >
                    <i class="pi pi-wrench text-2xl text-white" />
                  </div>
                </div>

                <div class="flex-1">
                  <h2 class="text-2xl font-bold text-gray-900 dark:text-gray-900 dark:text-white mb-4">
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
                  class="btn-secondary font-semibold"
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
    <div
      v-if="!pending && featuredPhotos.length > 0"
      class="py-16 bg-white dark:bg-gray-900"
    >
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="text-center mb-12">
          <h2 class="text-3xl font-bold text-gray-900 dark:text-gray-900 dark:text-white mb-4">Featured Photos</h2>
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
                      class="opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-gray-900 dark:text-white text-center"
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
                    class="w-20 h-16 object-cover rounded border-2 border-transparent hover:border-green-600 dark:hover:border-green-400 transition-colors cursor-pointer"
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
              <Button
                size="large"
                class="btn-secondary"
              >
                <i class="pi pi-images mr-2" />
                View Photo Gallery
              </Button>
            </NuxtLink>
            <NuxtLink to="/my-photos">
              <Button
                size="large"
                class="btn-secondary"
              >
                <i class="pi pi-upload mr-2" />
                Share Your Photos
              </Button>
            </NuxtLink>
          </div>

          <div
            class="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 max-w-2xl mx-auto"
          >
            <p class="text-sm text-gray-700 dark:text-gray-300">
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
    <div
      v-if="!pending && pastRaces.length > 0"
      class="py-16 bg-white dark:bg-gray-900"
    >
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 class="text-3xl font-bold text-center mb-12 text-gray-900 dark:text-gray-900 dark:text-white">
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
                <NuxtLink :to="`/races/${race.slug || race.id}`">
                  <Button text>View Details</Button>
                </NuxtLink>
              </div>
            </template>
          </Card>
        </div>

        <div class="text-center mt-8">
          <NuxtLink to="/races">
            <Button
              class="btn-secondary"
              >View All Races</Button
            >
          </NuxtLink>
        </div>
      </div>
    </div>

    <!-- Social Media Section -->
    <div class="py-16 bg-white dark:bg-gray-900">
      <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 class="text-3xl md:text-4xl font-bold mb-6">Stay Connected</h2>
        <p class="text-xl text-gray-600 dark:text-gray-400 mb-8 max-w-2xl mx-auto">
          Follow along for race updates, behind-the-scenes content, and inspiration from our amazing
          community of builders and racers!
        </p>

        <div class="flex flex-col sm:flex-row gap-6 justify-center items-center">
          <!-- Facebook -->
          <a
            href="https://www.facebook.com/HolyokeBrickRace"
            target="_blank"
            rel="noopener noreferrer"
            class="flex items-center gap-3 bg-white bg-opacity-20 hover:bg-opacity-30 transition-all duration-300 px-6 py-3 rounded-lg"
          >
            <i class="pi pi-facebook text-2xl" />
            <span class="font-semibold">Facebook</span>
          </a>

          <!-- Instagram -->
          <a
            href="https://www.instagram.com/thegreatholyokebrickrace"
            target="_blank"
            rel="noopener noreferrer"
            class="flex items-center gap-3 bg-white bg-opacity-20 hover:bg-opacity-30 transition-all duration-300 px-6 py-3 rounded-lg"
          >
            <i class="pi pi-instagram text-2xl" />
            <span class="font-semibold">Instagram</span>
          </a>

          <!-- Email -->
          <a
            href="mailto:thegreatholyokebrickrace@gmail.com"
            class="flex items-center gap-3 bg-white bg-opacity-20 hover:bg-opacity-30 transition-all duration-300 px-6 py-3 rounded-lg"
          >
            <i class="pi pi-envelope text-2xl" />
            <span class="font-semibold">Email</span>
          </a>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
const pending = ref(true)
const countdown = ref({
  days: 0,
  hours: 0,
  minutes: 0,
  seconds: 0,
  isActive: false
})

// Use singleton composables for data
const { activeRace, recentPastRaces, initialize: initializeRaces } = useRaces()
const { featuredPhotos, initialize: initializePhotos } = usePhotos()

// Featured photos gallery state
const featuredGalleryVisible = ref(false)
const activeFeaturedIndex = ref(0)

// Alias for easier template usage
const pastRaces = recentPastRaces

// Countdown timer logic
const updateCountdown = () => {
  // Use race_datetime if available, otherwise fall back to date
  const raceDateTime = activeRace.value?.race_datetime || activeRace.value?.date
  if (!raceDateTime) {
    countdown.value.isActive = false
    return
  }

  const now = new Date().getTime()
  const raceTime = new Date(raceDateTime).getTime()
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

// Initialize data on mount
onMounted(async () => {
  pending.value = true

  try {
    await Promise.all([initializeRaces(), initializePhotos()])
  } catch (error) {
    // Keep essential error logging for production debugging
    console.error('Error initializing homepage data:', error)
  } finally {
    pending.value = false
  }

  // Start countdown timer
  countdownInterval = setInterval(updateCountdown, 1000)
})

onUnmounted(() => {
  if (countdownInterval) {
    clearInterval(countdownInterval)
  }
  // Composable cleanup is handled automatically by their own onUnmounted hooks
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

const openFeaturedGallery = (index) => {
  activeFeaturedIndex.value = index
  featuredGalleryVisible.value = true
}

useHead({
  title: 'The Great Holyoke Brick Race - Competing for speed, creativity, and artistry',
  meta: [
    {
      name: 'description',
      content:
        'The first brick race of its kind in the country. 14 years of creative racing history, memorable designs, and community spirit. Open to all ages worldwide - artists, engineers, tinkerers, and dreamers welcome!'
    }
  ]
})
</script>
