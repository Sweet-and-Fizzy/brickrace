<template>
  <footer class="bg-black text-white">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <!-- Logo and Description Row -->
      <div class="text-center mb-12">
        <div class="flex flex-col items-center gap-4">
          <div class="flex items-center">
            <span class="site-name text-2xl font-bold">the great holyoke brick race</span>
          </div>
          <p class="text-gray-300 max-w-2xl text-lg">where performance art meets sport</p>
        </div>
      </div>

      <!-- Menu Sections Row -->
      <div
        class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 max-w-md sm:max-w-2xl lg:max-w-4xl mx-auto"
      >
        <!-- Races -->
        <div class="space-y-4">
          <h3 class="text-lg font-semibold text-white">Races</h3>
          <nav class="space-y-2">
            <!-- Static race links -->
            <NuxtLink
              to="/races/the-2025-brick-race"
              class="block text-gray-300 hover:text-white transition-colors flex items-center gap-2"
            >
              <i class="pi pi-play-circle text-gray-300" />
              <span>The 2025 Brick Race</span>
            </NuxtLink>
            <NuxtLink
              to="/races/2025-test-day"
              class="block text-gray-300 hover:text-white transition-colors flex items-center gap-2"
            >
              <i class="pi pi-calendar text-gray-300" />
              <span>2025 Test Day</span>
            </NuxtLink>
            <NuxtLink
              to="/races"
              class="block text-gray-300 hover:text-white transition-colors flex items-center gap-2"
            >
              <i class="pi pi-flag text-gray-300" />
              <span>All Races</span>
            </NuxtLink>
            <NuxtLink
              to="/awards"
              class="block text-gray-300 hover:text-white transition-colors flex items-center gap-2"
            >
              <i class="pi pi-trophy text-gray-300" />
              <span>Awards</span>
            </NuxtLink>
            <NuxtLink
              to="/our-story"
              class="block text-gray-300 hover:text-white transition-colors flex items-center gap-2"
            >
              <i class="pi pi-clock text-gray-300" />
              <span>Our History</span>
            </NuxtLink>
          </nav>
        </div>

        <!-- Racers -->
        <div class="space-y-4">
          <h3 class="text-lg font-semibold text-white">Racers</h3>
          <nav class="space-y-2">
            <NuxtLink
              to="/racers"
              class="block text-gray-300 hover:text-white transition-colors flex items-center gap-2"
            >
              <i class="pi pi-car text-gray-300" />
              <span>Browse Racers</span>
            </NuxtLink>
            <template v-if="isAuthenticated">
              <NuxtLink
                to="/my-racers"
                class="block text-gray-300 hover:text-white transition-colors flex items-center gap-2"
              >
                <i class="pi pi-user text-gray-300" />
                <span>My Racers</span>
              </NuxtLink>
            </template>
            <NuxtLink
              :to="isAuthenticated ? '/racers/add' : '/login?redirect=/racers/add'"
              class="block text-gray-300 hover:text-white transition-colors flex items-center gap-2"
            >
              <i class="pi pi-plus text-gray-300" />
              <span>Add Your Racer</span>
            </NuxtLink>
          </nav>
        </div>

        <!-- Community & Help -->
        <div class="space-y-4">
          <h3 class="text-lg font-semibold text-white">Community & Help</h3>
          <nav class="space-y-2">
            <NuxtLink
              to="/photos"
              class="block text-gray-300 hover:text-white transition-colors flex items-center gap-2"
            >
              <i class="pi pi-images text-gray-300" />
              <span>Photo Gallery</span>
            </NuxtLink>
            <template v-if="isAuthenticated">
              <NuxtLink
                to="/my-photos"
                class="block text-gray-300 hover:text-white transition-colors flex items-center gap-2"
              >
                <i class="pi pi-images text-gray-300" />
                <span>My Photos</span>
              </NuxtLink>
            </template>
            <NuxtLink
              to="/faq"
              class="block text-gray-300 hover:text-white transition-colors flex items-center gap-2"
            >
              <i class="pi pi-question-circle text-gray-300" />
              <span>FAQ</span>
            </NuxtLink>
          </nav>
        </div>

        <!-- Connect & Contact -->
        <div class="space-y-4">
          <h3 class="text-lg font-semibold text-white">Connect & Contact</h3>
          <div class="space-y-2">
            <!-- Email -->
            <a
              href="mailto:thegreatholyokebrickrace@gmail.com"
              class="flex items-center gap-2 text-gray-300 hover:text-white transition-colors"
            >
              <i class="pi pi-envelope text-gray-300" />
              <span>Email Us</span>
            </a>

            <!-- Facebook -->
            <a
              href="https://www.facebook.com/HolyokeBrickRace"
              target="_blank"
              rel="noopener noreferrer"
              class="flex items-center gap-2 text-gray-300 hover:text-white transition-colors"
            >
              <i class="pi pi-facebook text-gray-300" />
              <span>Facebook</span>
            </a>

            <!-- Instagram -->
            <a
              href="https://www.instagram.com/thegreatholyokebrickrace"
              target="_blank"
              rel="noopener noreferrer"
              class="flex items-center gap-2 text-gray-300 hover:text-white transition-colors"
            >
              <i class="pi pi-instagram text-gray-300" />
              <span>Instagram</span>
            </a>
          </div>
        </div>
      </div>

      <!-- Sponsors Section -->
      <ClientOnly>
        <div v-if="displaySponsors.length > 0" class="border-t border-gray-700 mt-8 pt-8">
          <div class="text-center mb-6">
            <h3 class="text-lg font-semibold text-white mb-4">Our Sponsors</h3>
            <div class="flex flex-wrap justify-center items-center gap-6 mb-4">
              <a
                v-for="sponsor in displaySponsors"
                :key="sponsor.id"
                :href="sponsor.website_url"
                :target="sponsor.website_url ? '_blank' : undefined"
                :rel="sponsor.website_url ? 'noopener noreferrer' : undefined"
                class="flex items-center justify-center p-3 bg-white rounded-lg hover:bg-gray-100 transition-colors"
                :class="{ 'cursor-default': !sponsor.website_url }"
              >
                <img
                  v-if="sponsor.logo_url"
                  :src="sponsor.logo_url"
                  :alt="`${sponsor.name} logo`"
                  class="h-12 max-w-32 object-contain"
                >
                <span v-else class="text-gray-600 text-sm px-2">{{ sponsor.name }}</span>
              </a>
            </div>
            <NuxtLink
              to="/sponsors"
              class="text-gray-300 hover:text-white transition-colors text-sm inline-flex items-center"
            >
              <i class="pi pi-external-link mr-2"/>
              View All Sponsors
            </NuxtLink>
          </div>
        </div>
      </ClientOnly>

      <!-- Bottom Bar -->
      <div class="border-t border-gray-700 mt-8 pt-8 text-center text-white">
        <p class="mb-4">&copy; {{ new Date().getFullYear() }} the great holyoke brick race</p>
        <p>
          Built with
          <i class="pi pi-heart-fill text-red-400" /> by
          <a
            href="https://sweetandfizzy.com"
            target="_blank"
            rel="noopener noreferrer"
            class="text-blue-400 hover:text-blue-300 transition-colors"
          >
            Sweet & Fizzy Digital
          </a>
        </p>
      </div>
    </div>
  </footer>
</template>

<script setup>
import { useAuthStore } from '~/stores/auth'

// Get auth state for conditional menu items
const authStore = useAuthStore()
const isAuthenticated = computed(() => authStore.isAuthenticated)

// Sponsors
const sponsorsStore = useSponsors()
const { sponsors } = sponsorsStore

// Show up to 6 sponsors in the footer
const displaySponsors = computed(() => {
  return (sponsors.value || []).slice(0, 6)
})

// Initialize sponsors
onMounted(async () => {
  await sponsorsStore.getActiveSponsors()
})
</script>
