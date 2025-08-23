<template>
  <div class="min-h-screen bg-white dark:bg-gray-900">
    <!-- Header Section -->
    <div class="py-16 bg-white dark:bg-gray-900">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <!-- Logo and Title -->
        <div class="text-center mb-12">
          <div class="flex justify-center mb-6">
            <img
              src="~/assets/img/brick_race_logo.jpg"
              alt="The Great Holyoke Brick Race Logo"
              class="h-32 md:h-40 w-auto object-contain rounded-lg"
            >
          </div>
          <h2
            class="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4 tracking-wide"
          >
            the great holyoke brick race
          </h2>
          <p class="text-lg text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
            Where performance art meets sport in the first brick race of its kind.
          </p>
        </div>
      </div>
    </div>

    <!-- Featured Race (Hero Section) -->
    <div v-if="activeRace && !pending" class="bg-white dark:bg-gray-900">
      <!-- Race Image at Very Top -->
      <div class="w-full mb-8">
        <Image
          v-if="activeRace.image_url"
          :src="activeRace.image_url"
          :alt="activeRace.name"
          image-class="w-full h-64 md:h-80 object-contain"
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
          <h1
            class="text-4xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6 tracking-wide"
          >
            {{ activeRace.name }}
          </h1>
          <div class="text-xl md:text-2xl text-gray-700 dark:text-gray-300 mb-8 text-center">
            <p>
              {{
                activeRace.race_datetime 
                  ? new Date(activeRace.race_datetime).toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })
                  : 'Date TBD'
              }}
            </p>
            <p v-if="activeRace.race_datetime" class="text-lg md:text-xl">
              {{
                new Date(activeRace.race_datetime).toLocaleTimeString('en-US', {
                  hour: 'numeric',
                  minute: '2-digit',
                  hour12: true
                })
              }}{{
                activeRace.end_time 
                  ? ' - ' + new Date(activeRace.end_time).toLocaleTimeString('en-US', {
                      hour: 'numeric',
                      minute: '2-digit',
                      hour12: true
                    })
                  : ''
              }}
            </p>
          </div>
        </div>

        <!-- Race Description and Map Section -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          <!-- Race Description -->
          <Card class="shadow-sm hover:shadow-md transition-shadow duration-200 h-full">
            <template #content>
              <div class="text-center space-y-6 h-full flex flex-col">
                <div class="flex-1">
                  <h2
                    class="text-2xl font-bold text-gray-900 dark:text-white mb-4 tracking-wide"
                  >
                    About This Race
                  </h2>
                  <div v-if="activeRace.description" class="text-gray-700 dark:text-gray-300 leading-relaxed prose prose-gray dark:prose-invert max-w-none text-left" v-html="activeRace.description" />
                  <p v-else class="text-gray-600 dark:text-gray-400 italic">
                    Race description coming soon...
                  </p>
                </div>
              </div>
            </template>
          </Card>

          <!-- Google Maps -->
          <Card class="shadow-sm hover:shadow-md transition-shadow duration-200 h-full">
            <template #content>
              <div class="text-center space-y-6 h-full flex flex-col">
                <div class="flex-1">
                  <h2
                    class="text-2xl font-bold text-gray-900 dark:text-white mb-4 tracking-wide"
                  >
                    Location
                  </h2>
                  <div class="bg-gray-200 dark:bg-gray-700 rounded-lg overflow-hidden shadow-lg">
                    <iframe
                      src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2938.8234567890123!2d-72.6098765!3d42.2087654!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x89e6e74f8a8b8c8d%3A0x1234567890abcdef!2s80%20Race%20St%2C%20Holyoke%2C%20MA%2001040!5e0!3m2!1sen!2sus!4v1234567890123!5m2!1sen!2sus&q=80+Race+St,+Holyoke,+MA"
                      width="100%"
                      height="300"
                      style="border:0;"
                      allowfullscreen=""
                      loading="lazy"
                      referrerpolicy="no-referrer-when-downgrade"
                      class="w-full h-[300px]"
                    />
                  </div>
                </div>
              </div>
            </template>
          </Card>
        </div>

        <!-- Race Info and Stats -->
        <div class="space-y-6 mb-12">
          <!-- Countdown Timer -->
          <div
            class="text-center mb-6 p-8 bg-white dark:bg-gray-800 border-2 border-brand-gold shadow-lg"
          >
            <h3
              class="text-2xl font-bold text-gray-900 dark:text-white mb-6"
            >
              ⚡ RACE COUNTDOWN ⚡
            </h3>
            <div v-if="countdown.isActive" class="grid grid-cols-4 gap-6">
              <div class="text-center transform hover:scale-105 transition-transform">
                <div
                  class="text-5xl md:text-6xl font-black text-gray-900 dark:text-white drop-shadow-lg animate-bounce"
                >
                  {{ countdown.days }}
                </div>
                <div class="text-sm font-bold text-gray-900 dark:text-white tracking-widest">
                  DAYS
                </div>
              </div>
              <div class="text-center transform hover:scale-105 transition-transform">
                <div
                  class="text-5xl md:text-6xl font-black text-gray-900 dark:text-white drop-shadow-lg"
                >
                  {{ countdown.hours }}
                </div>
                <div class="text-sm font-bold text-gray-900 dark:text-white tracking-widest">
                  HOURS
                </div>
              </div>
              <div class="text-center transform hover:scale-105 transition-transform">
                <div
                  class="text-5xl md:text-6xl font-black text-gray-900 dark:text-white drop-shadow-lg"
                >
                  {{ countdown.minutes }}
                </div>
                <div class="text-sm font-bold text-gray-900 dark:text-white tracking-widest">
                  MINUTES
                </div>
              </div>
              <div class="text-center transform hover:scale-105 transition-transform">
                <div
                  class="text-5xl md:text-6xl font-black text-gray-900 dark:text-white drop-shadow-lg animate-pulse"
                >
                  {{ countdown.seconds }}
                </div>
                <div class="text-sm font-bold text-gray-900 dark:text-white tracking-widest">
                  SECONDS
                </div>
              </div>
            </div>
            <div v-else class="text-4xl font-black text-gray-900 dark:text-white animate-bounce">
              🚀 RACE DAY IS HERE! 🚀
            </div>
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
          <h1 class="text-4xl md:text-6xl font-bold mb-6 tracking-wide">🏁 The Great Holyoke Brick Race</h1>
          <p class="text-xl md:text-2xl mb-8 text-gray-600 dark:text-gray-400">
            Join our community of creative builders and racers!
          </p>
          <div class="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button size="large" class="btn-primary" @click="navigateTo('/races')">
              <i class="pi pi-flag mr-2" />
              <span>View Races</span>
            </Button>
            <Button size="large" class="btn-secondary" @click="navigateTo('/racers')">
              <i class="pi pi-car mr-2" />
              <span>Browse Vehicles</span>
            </Button>
            <Button size="large" class="btn-secondary" @click="navigateTo('/our-story')">
              <i class="pi pi-info-circle mr-2" />
              Learn More
            </Button>
          </div>
        </div>
      </div>
    </div>

    <!-- Call to Action Cards -->
    <div v-if="!pending" class="py-16 bg-white dark:bg-gray-900">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <!-- Learn About Our History -->
          <Card class="shadow-sm hover:shadow-md transition-shadow duration-200 h-full">
            <template #content>
              <div class="text-center space-y-6 h-full flex flex-col">
                <div class="flex justify-center mb-6">
                  <div class="w-full max-w-sm">
                    <img
                      src="~/assets/img/brickrace_art.jpg"
                      alt="The Great Holyoke Brick Race Artwork"
                      class="w-full h-48 object-cover rounded-lg"
                    >
                  </div>
                </div>

                <div class="flex-1">
                  <h2
                    class="text-2xl font-bold text-gray-900 dark:text-white mb-4 tracking-wide"
                  >
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

                <div class="inline-block">
                  <Button
                    size="large"
                    class="btn-secondary font-semibold"
                    @click="navigateTo('/our-story')"
                  >
                    <i class="pi pi-book mr-2" />
                    <span>Our Story</span>
                  </Button>
                </div>
              </div>
            </template>
          </Card>

          <!-- Build Your Own Racer -->
          <Card class="shadow-sm hover:shadow-md transition-shadow duration-200 h-full">
            <template #content>
              <div class="text-center space-y-6 h-full flex flex-col">
                <div class="flex justify-center mb-6">
                  <div class="w-full max-w-sm">
                    <img
                      src="~/assets/img/building_brickracer.jpg"
                      alt="Building a Brick Racer"
                      class="w-full h-48 object-cover rounded-lg"
                    >
                  </div>
                </div>

                <div class="flex-1">
                  <h2
                    class="text-2xl font-bold text-gray-900 dark:text-white mb-4 tracking-wide"
                  >
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

                <div class="inline-block">
                  <Button
                    size="large"
                    class="btn-secondary font-semibold"
                    @click="navigateTo('/faq')"
                  >
                    <i class="pi pi-car mr-2" />
                    Get Started
                  </Button>
                </div>
              </div>
            </template>
          </Card>
        </div>
      </div>
    </div>

    <!-- Featured Photos -->
    <div v-if="!pending && featuredPhotos.length > 0" class="py-16 bg-gradient-to-br from-gray-900 via-gray-800 to-black">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="text-center mb-12">
          <h2 class="text-3xl font-bold text-white mb-4 tracking-wide">
            Featured Photos
          </h2>
          <p class="text-lg text-gray-300">
            Highlights from our creative racing community
          </p>
        </div>
        
        <BeautifulSlideshow 
          :images="featuredPhotos" 
          @slide-click="openFeaturedGallery"
        />

        <!-- View More Links -->
        <div class="text-center mt-12 space-y-6">
          <div class="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="large" 
              class="gallery-button"
              @click="navigateTo('/gallery')"
            >
              <i class="pi pi-images mr-2" />
              View Photo Gallery
            </Button>
            <Button 
              size="large" 
              class="gallery-button"
              @click="navigateTo('/my-photos')"
            >
              <i class="pi pi-upload mr-2" />
              Share Your Photos
            </Button>
          </div>

          <p class="text-sm text-gray-200 max-w-2xl mx-auto">
            Have photos from races or events? Help build our community gallery by uploading and
            sharing your shots!
          </p>
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
          >
        </div>
      </template>
    </Galleria>

    <!-- Past Races -->
    <div v-if="!pending && pastRaces.length > 0" class="py-16 bg-white dark:bg-gray-900">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2
          class="text-3xl font-bold text-center mb-12 text-gray-900 dark:text-white tracking-wide"
        >
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
              {{ new Date(race.race_datetime).toLocaleDateString() }}
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
            <Button class="btn-secondary">View All Races</Button>
          </NuxtLink>
        </div>
      </div>
    </div>

    <!-- Section Divider -->
    <div class="border-t border-gray-200 dark:border-gray-700" />

    <!-- Social Media Section -->
    <div class="py-16 bg-white dark:bg-gray-900">
      <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 class="text-3xl md:text-4xl font-bold mb-6 tracking-wide text-gray-900 dark:text-white">Stay Connected</h2>
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
            class="flex items-center gap-3 bg-blue-600 hover:bg-blue-700 text-white hover:text-white shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 px-8 py-4 rounded-lg cursor-pointer border-2 border-transparent hover:border-blue-300"
          >
            <i class="pi pi-facebook text-2xl" />
            <span class="font-semibold text-lg">Facebook</span>
          </a>

          <!-- Instagram -->
          <a
            href="https://www.instagram.com/thegreatholyokebrickrace"
            target="_blank"
            rel="noopener noreferrer"
            class="flex items-center gap-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white hover:text-white shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 px-8 py-4 rounded-lg cursor-pointer border-2 border-transparent hover:border-pink-300"
          >
            <i class="pi pi-instagram text-2xl" />
            <span class="font-semibold text-lg">Instagram</span>
          </a>

          <!-- Email -->
          <a
            href="mailto:thegreatholyokebrickrace@gmail.com"
            class="flex items-center gap-3 bg-gray-600 hover:bg-gray-700 text-white hover:text-white shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 px-8 py-4 rounded-lg cursor-pointer border-2 border-transparent hover:border-gray-300"
          >
            <i class="pi pi-envelope text-2xl" />
            <span class="font-semibold text-lg">Email</span>
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
  const raceDateTime = activeRace.value?.race_datetime
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

<style scoped>
/* High specificity gallery buttons for dark background */
:deep(.gallery-button),
:deep(.gallery-button:active),
:deep(.gallery-button:focus),
:deep(.gallery-button:visited),
:deep(.gallery-button[data-pc-name="button"]),
:deep(button.gallery-button),
:deep(.p-button.gallery-button) {
  background: rgba(255, 255, 255, 0.1) !important;
  color: white !important;
  border: 2px solid rgba(255, 255, 255, 0.3) !important;
  border-radius: 0 !important;
  backdrop-filter: blur(10px) !important;
  transform: skewX(-8deg) !important;
  font-family: 'Open Sans', sans-serif !important;
  font-weight: 600 !important;
  padding: 0.75rem 1.5rem !important;
  transition: all 0.3s ease !important;
}

:deep(.gallery-button:hover),
:deep(.gallery-button:hover[data-pc-name="button"]),
:deep(button.gallery-button:hover),
:deep(.p-button.gallery-button:hover) {
  background: rgba(255, 255, 255, 0.2) !important;
  color: white !important;
  border: 2px solid rgba(255, 255, 255, 0.5) !important;
  transform: skewX(-8deg) translateY(-2px) !important;
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.3) !important;
}

/* Unskew child elements */
:deep(.gallery-button > *),
:deep(.gallery-button [data-pc-section="label"]) {
  transform: none !important;
  display: inline-block !important;
}
</style>
