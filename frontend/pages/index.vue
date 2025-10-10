<template>
  <div class="min-h-screen bg-white">
    <!-- Featured Race (Hero Section) - Static Content -->
    <div class="bg-white">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div class="text-center mb-4">
          <h1 class="text-4xl md:text-6xl font-bold text-black mb-4 tracking-wide">
            The 2025 Brick Race
          </h1>
          <p class="text-xl text-gray-600 mb-3 max-w-3xl mx-auto">
            Make it fast. Make it weird. Make it unforgettable.
          </p>

          <!-- Race Image -->
          <div class="w-full mb-2">
            <Image
              src="https://ehbmnhyyycvduhtfgoho.supabase.co/storage/v1/object/public/race-images/races/race-1751424799956.jpg"
              alt="The 2025 Brick Race"
              image-class="w-full h-64 md:h-80 object-contain rounded-lg"
              class="w-full h-64 md:h-80"
            />
          </div>
        </div>

        <!-- Call to Action Button -->
        <div class="text-center mb-8">
          <NuxtLink to="/racers/add">
            <Button
              label="Register Your Racer"
              class="btn-primary text-lg px-8 py-3"
              size="large"
            />
          </NuxtLink>
        </div>

        <!-- Race Description and Map Section -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <!-- Race Description -->
          <Card
            class="shadow-sm hover:shadow-md transition-shadow duration-200 h-full overflow-hidden no-padding-card"
          >
            <template #content>
              <div class="h-full flex flex-col">
                <h2
                  class="text-2xl font-bold text-white bg-black py-2 px-6 tracking-wide text-left"
                >
                  About This Race
                </h2>
                <div class="flex-1 p-6">
                  <div class="text-gray-700 leading-relaxed text-left">
                    <p class="text-xl font-bold">Saturday, October 11</p>
                    <p class="text-xl font-bold">11 AM - 3 PM</p>
                    <p class="mt-4 mb-4">
                      Gravity-powered vehicles competing for speed, creativity, and artistry. Awards
                      for fastest and slowest racers, those with the best engineering, best crashes,
                      and more.
                    </p>
                    <p class="text-lg font-bold">CHECK-IN: 11:00 AM</p>
                    <p class="text-lg font-bold">RACE: NOON</p>
                    <p class="mt-4">
                      All racers should
                      <NuxtLink to="/racers/add" class="text-blue-600 hover:text-blue-800 underline"
                        >register online</NuxtLink
                      >.
                    </p>
                  </div>
                </div>
              </div>
            </template>
          </Card>

          <!-- Google Maps -->
          <Card
            class="shadow-sm hover:shadow-md transition-shadow duration-200 h-full overflow-hidden no-padding-card"
          >
            <template #content>
              <div class="h-full flex flex-col">
                <h2
                  class="text-2xl font-bold text-white bg-black py-2 px-6 tracking-wide text-left"
                >
                  Location
                </h2>
                <div class="flex-1">
                  <iframe
                    src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2938.8234567890123!2d-72.6098765!3d42.2087654!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x89e6e74f8a8b8c8d%3A0x1234567890abcdef!2s80%20Race%20St%2C%20Holyoke%2C%20MA%2001040!5e0!3m2!1sen!2sus!4v1234567890123!5m2!1sen!2sus&q=80+Race+St,+Holyoke,+MA"
                    width="100%"
                    style="border: 0; height: 100%"
                    allowfullscreen=""
                    loading="lazy"
                    referrerpolicy="no-referrer-when-downgrade"
                    class="w-full min-h-[300px]"
                  />
                </div>
              </div>
            </template>
          </Card>
        </div>

        <!-- Event Details -->
        <div class="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
          <!-- Parking -->
          <div class="text-center">
            <div class="flex justify-center mb-3">
              <div class="w-12 h-12 bg-brand-blue rounded-full flex items-center justify-center">
                <i class="pi pi-car text-white text-xl" />
              </div>
            </div>
            <h3 class="font-bold text-lg mb-2">Parking</h3>
            <p class="text-gray-600 text-sm">
              Street parking available on Race Street and surrounding areas
            </p>
          </div>

          <!-- Spectators Welcome -->
          <div class="text-center">
            <div class="flex justify-center mb-3">
              <div class="w-12 h-12 bg-brand-green rounded-full flex items-center justify-center">
                <i class="pi pi-users text-white text-xl" />
              </div>
            </div>
            <h3 class="font-bold text-lg mb-2">Spectators Welcome</h3>
            <p class="text-gray-600 text-sm">
              Join the crowd of spectators who attend this beloved annual event
            </p>
          </div>

          <!-- Food & Refreshments -->
          <div class="text-center">
            <div class="flex justify-center mb-3">
              <div class="w-12 h-12 bg-brand-gold rounded-full flex items-center justify-center">
                <i class="pi pi-star text-white text-xl" />
              </div>
            </div>
            <h3 class="font-bold text-lg mb-2">Food</h3>
            <p class="text-gray-600 text-sm">
              Enjoy delicious options from Batch, Holyoke Hummus, The Grill, Comfort Bagel, and Wake
              the Dead Donuts
            </p>
          </div>

          <!-- Family Friendly -->
          <div class="text-center">
            <div class="flex justify-center mb-3">
              <div class="w-12 h-12 bg-red-600 rounded-full flex items-center justify-center">
                <i class="pi pi-heart text-white text-xl" />
              </div>
            </div>
            <h3 class="font-bold text-lg mb-2">Family Friendly</h3>
            <p class="text-gray-600 text-sm">
              A fun event perfect for all ages. We'll have Legos, street chalk, and a face painter
            </p>
          </div>
        </div>

        <!-- Additional Info Blocks -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <!-- Test Drive Block -->
          <Card class="shadow-sm hover:shadow-md transition-shadow duration-200 h-full">
            <template #content>
              <div class="flex items-start gap-4">
                <!-- Go image for left column -->
                <div class="flex-shrink-0 w-24 h-24">
                  <img
                    src="~/assets/img/go.png"
                    alt="Test Drive"
                    class="w-full h-full object-contain"
                  />
                </div>
                <div class="flex-1">
                  <h3 class="text-xl font-bold text-black mb-2">Test drive the track</h3>
                  <p class="text-lg">Saturday, October 4</p>
                  <p class="text-lg">11 AM - 2 PM</p>
                  <p class="text-gray-700 mt-2">LightHouse School (114 Race St.)</p>
                </div>
              </div>
            </template>
          </Card>

          <!-- More to do Block -->
          <Card class="shadow-sm hover:shadow-md transition-shadow duration-200 h-full">
            <template #content>
              <div class="flex items-start gap-4">
                <!-- Car cartoon image for right column -->
                <div class="flex-shrink-0 w-24 h-24">
                  <img
                    src="~/assets/img/car-cartoon.png"
                    alt="Explore Holyoke"
                    class="w-full h-full object-contain"
                  />
                </div>
                <div class="flex-1">
                  <h3 class="text-xl font-bold text-black mb-2">More to do around town</h3>
                  <a
                    href="https://exploreholyoke.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="text-blue-600 hover:text-blue-800 underline text-lg"
                  >
                    exploreholyoke.com
                  </a>
                </div>
              </div>
            </template>
          </Card>
        </div>

        <!-- Race Info and Stats -->
        <div class="space-y-4 mb-8">
          <!-- Countdown Timer -->
          <div
            v-if="false"
            class="text-center mb-6 p-8 bg-white border-2 border-brand-gold shadow-lg"
          >
            <h3 class="text-2xl font-bold text-black mb-6">⚡ RACE COUNTDOWN ⚡</h3>
            <div v-if="countdown.isActive" class="grid grid-cols-4 gap-6">
              <div class="text-center transform hover:scale-105 transition-transform">
                <div
                  class="text-5xl md:text-6xl font-black text-black drop-shadow-lg animate-bounce"
                >
                  {{ countdown.days }}
                </div>
                <div class="text-sm font-bold text-black tracking-widest">DAYS</div>
              </div>
              <div class="text-center transform hover:scale-105 transition-transform">
                <div class="text-5xl md:text-6xl font-black text-black drop-shadow-lg">
                  {{ countdown.hours }}
                </div>
                <div class="text-sm font-bold text-black tracking-widest">HOURS</div>
              </div>
              <div class="text-center transform hover:scale-105 transition-transform">
                <div class="text-5xl md:text-6xl font-black text-black drop-shadow-lg">
                  {{ countdown.minutes }}
                </div>
                <div class="text-sm font-bold text-black tracking-widest">MINUTES</div>
              </div>
              <div class="text-center transform hover:scale-105 transition-transform">
                <div
                  class="text-5xl md:text-6xl font-black text-black drop-shadow-lg animate-pulse"
                >
                  {{ countdown.seconds }}
                </div>
                <div class="text-sm font-bold text-black tracking-widest">SECONDS</div>
              </div>
            </div>
            <div v-else class="text-4xl font-black text-black animate-bounce">
              🚀 RACE DAY IS HERE! 🚀
            </div>
          </div>
        </div>

        <div class="flex justify-center">
          <Button
            size="large"
            class="btn-primary px-10 py-4"
            @click="navigateTo('/races/the-2025-brick-race')"
          >
            <i class="pi pi-flag mr-3 text-lg" />
            <span>View Race Details</span>
          </Button>
        </div>
      </div>
    </div>

    <!-- Default Hero Section (removed - always show active race) -->
    <div v-if="false" class="bg-white">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div class="text-center">
          <h1 class="text-4xl md:text-6xl font-bold mb-6 tracking-wide">
            🏁 The Great Holyoke Brick Race
          </h1>
          <p class="text-xl md:text-2xl mb-8 text-gray-600">
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
    <div class="py-16 bg-white">
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
                    />
                  </div>
                </div>

                <div class="flex-1">
                  <h2 class="text-2xl font-bold text-black mb-4 tracking-wide">
                    What is a Brick Race?
                  </h2>
                  <p class="text-gray-700 leading-relaxed mb-4">
                    Learn the story behind The Great Holyoke Brick Race - from its conception by
                    local artists in 2010 to becoming the first brick race of its kind in the
                    country.
                  </p>
                  <p class="text-gray-700 leading-relaxed mb-6">
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
                    />
                  </div>
                </div>

                <div class="flex-1">
                  <h2 class="text-2xl font-bold text-black mb-4 tracking-wide">Build a Racer</h2>
                  <p class="text-gray-700 leading-relaxed mb-6">
                    Ready to join the creative chaos? Learn what you need to know to build your
                    brick racer—specifications, rules, awards, and race day logistics.
                  </p>
                  <p class="text-gray-600 mb-6">
                    Open to everyone worldwide - artists, engineers, tinkerers, and dreamers
                    welcome!
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
    <div v-if="featuredPhotos.length > 0" class="py-16 bg-black">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="text-center mb-12">
          <h2 class="text-3xl font-bold text-white mb-4 tracking-wide">Featured Photos</h2>
          <p class="text-lg text-gray-300">Highlights from our creative racing community</p>
        </div>

        <BeautifulSlideshow :images="featuredPhotos" @slide-click="openFeaturedGallery" />

        <!-- View More Links -->
        <div class="text-center mt-12 space-y-6">
          <div class="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="large" class="gallery-button" @click="navigateTo('/photos')">
              <i class="pi pi-images mr-2" />
              View Photo Gallery
            </Button>
            <Button size="large" class="gallery-button" @click="navigateTo('/my-photos')">
              <i class="pi pi-upload mr-2" />
              Share Your Photos
            </Button>
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
    <div v-if="pastRaces.length > 0" class="py-16 bg-white">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 class="text-3xl font-bold text-center mb-12 text-black tracking-wide">Past Races</h2>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card v-for="race in pastRaces" :key="race.id" class="hover:shadow-lg transition-shadow">
            <template #header>
              <Image
                v-if="race.image_url"
                :src="race.image_url"
                :alt="race.name.replace(/[\r\n\t]/g, ' ').trim()"
                image-class="w-full h-48 object-cover"
                class="w-full h-48"
                preview
              />
              <div v-else class="w-full h-48 bg-gray-200 flex items-center justify-center">
                <i class="pi pi-flag text-4xl text-gray-400" />
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
    <div class="border-t border-gray-200" />

    <!-- Social Media Section -->
    <div class="py-16 bg-white">
      <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 class="text-3xl md:text-4xl font-bold mb-6 tracking-wide text-black">Stay Connected</h2>
        <p class="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
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
const { recentPastRaces, initialize: initializeRaces } = useRaces()
const { featuredPhotos, initialize: initializePhotos } = usePhotos()

// Featured photos gallery state
const featuredGalleryVisible = ref(false)
const activeFeaturedIndex = ref(0)

// Alias for easier template usage
const pastRaces = recentPastRaces

// Countdown timer logic - Static date for The 2025 Brick Race
const updateCountdown = () => {
  const raceDateTime = '2025-10-11T15:00:00+00:00' // October 11, 2025 at 3:00 PM UTC

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
    // Still initialize for past races and photos
    await Promise.all([initializeRaces(), initializePhotos()])
  } catch (error) {
    // Keep essential error logging for production debugging
    console.error('Error initializing homepage data:', error)
  } finally {
    pending.value = false
  }

  // Start countdown timer
  updateCountdown() // Initial update
  countdownInterval = setInterval(updateCountdown, 1000)
})

onUnmounted(() => {
  if (countdownInterval) {
    clearInterval(countdownInterval)
  }
  // Composable cleanup is handled automatically by their own onUnmounted hooks
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

const openFeaturedGallery = (index) => {
  activeFeaturedIndex.value = index
  featuredGalleryVisible.value = true
}

useHead({
  title: 'Home',
  meta: [
    {
      name: 'description',
      content:
        'The first brick race of its kind in the country. Design and build gravity-powered brick racers to compete for speed, creativity, and artistry. Join our 14-year tradition of creative racing in Holyoke, MA!'
    },
    {
      property: 'og:title',
      content: 'The Great Holyoke Brick Race - Where Performance Art Meets Sport'
    },
    {
      property: 'og:description',
      content:
        'Design and build gravity-powered brick racers. Compete for speed, creativity, and artistry in this unique community event. Open to all ages and backgrounds!'
    },
    {
      property: 'og:type',
      content: 'website'
    }
  ],
  script: [
    {
      type: 'application/ld+json',
      children: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'Event',
        name: 'The Great Holyoke Brick Race',
        description:
          'Annual gravity-powered brick racing competition emphasizing creativity and engineering',
        location: {
          '@type': 'Place',
          name: 'Paper City Studios',
          address: {
            '@type': 'PostalAddress',
            streetAddress: '80 Race Street',
            addressLocality: 'Holyoke',
            addressRegion: 'MA',
            postalCode: '01040',
            addressCountry: 'US'
          }
        },
        organizer: {
          '@type': 'Organization',
          name: 'The Great Holyoke Brick Race',
          url: 'https://thegreatholyokebrickrace.com'
        }
      })
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
:deep(.gallery-button[data-pc-name='button']),
:deep(button.gallery-button),
:deep(.p-button.gallery-button) {
  background: transparent !important;
  color: white !important;
  border: 2px solid white !important;
  border-radius: 0 !important;
  transform: skewX(-8deg) !important;
  font-family: 'Open Sans', sans-serif !important;
  font-weight: 600 !important;
  padding: 0.75rem 1.5rem !important;
  transition: all 0.3s ease !important;
}

:deep(.gallery-button:hover),
:deep(.gallery-button:hover[data-pc-name='button']),
:deep(button.gallery-button:hover),
:deep(.p-button.gallery-button:hover) {
  background: white !important;
  color: black !important;
  border: 2px solid white !important;
  transform: skewX(-8deg) translateY(-2px) !important;
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.3) !important;
}

/* Unskew child elements */
:deep(.gallery-button > *),
:deep(.gallery-button [data-pc-section='label']) {
  transform: none !important;
  display: inline-block !important;
}

/* Remove padding from specific cards */
:deep(.no-padding-card .p-card-body) {
  padding: 0 !important;
  gap: 0 !important;
}
</style>
