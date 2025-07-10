<template>
  <footer class="bg-gray-800 dark:bg-gray-900 text-white">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <!-- Logo and Description Row -->
      <div class="text-center mb-12">
        <div class="flex flex-col items-center gap-4">
          <div class="flex items-center gap-3">
            <img
              src="~/assets/img/brick_race_logo.jpg"
              alt="The Great Holyoke Brick Race Logo"
              class="h-14 w-auto object-contain rounded"
            >
            <span class="site-name text-2xl font-bold">The Great Holyoke Brick Race</span>
          </div>
          <p class="text-gray-300 max-w-2xl text-lg">
            A celebration of creativity, engineering, and friendly competition where custom
            gravity-powered vehicles race for glory.
          </p>
        </div>
      </div>

      <!-- Menu Sections Row -->
      <div
        class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 max-w-md sm:max-w-2xl lg:max-w-5xl mx-auto"
      >
        <!-- Racing & Events -->
        <div class="space-y-4">
          <h3 class="text-lg font-semibold text-red-400">Racing & Events</h3>
          <nav class="space-y-2">
            <NuxtLink
              to="/races"
              class="block text-gray-300 hover:text-red-400 transition-colors flex items-center gap-2"
            >
              <i class="pi pi-flag text-red-400" />
              <span>Current Races</span>
            </NuxtLink>
            <NuxtLink
              to="/about"
              class="block text-gray-300 hover:text-red-400 transition-colors flex items-center gap-2"
            >
              <i class="pi pi-clock text-red-400" />
              <span>Race History</span>
            </NuxtLink>
            <NuxtLink
              to="/awards"
              class="block text-gray-300 hover:text-red-400 transition-colors flex items-center gap-2"
            >
              <i class="pi pi-trophy text-red-400" />
              <span>Awards & Winners</span>
            </NuxtLink>
          </nav>
        </div>

        <!-- Racers & Building -->
        <div class="space-y-4">
          <h3 class="text-lg font-semibold text-yellow-400">Racers & Building</h3>
          <nav class="space-y-2">
            <NuxtLink
              to="/racers"
              class="block text-gray-300 hover:text-yellow-400 transition-colors flex items-center gap-2"
            >
              <i class="pi pi-car text-yellow-400" />
              <span>Browse Racers</span>
            </NuxtLink>
            <NuxtLink
              to="/build-racer"
              class="block text-gray-300 hover:text-yellow-400 transition-colors flex items-center gap-2"
            >
              <i class="pi pi-wrench text-yellow-400" />
              <span>Build a Racer</span>
            </NuxtLink>
            <NuxtLink
              to="/gallery"
              class="block text-gray-300 hover:text-yellow-400 transition-colors flex items-center gap-2"
            >
              <i class="pi pi-images text-yellow-400" />
              <span>Photo Gallery</span>
            </NuxtLink>
          </nav>
        </div>

        <!-- Account & Community -->
        <div class="space-y-4">
          <h3 class="text-lg font-semibold text-orange-400">Account & Community</h3>
          <nav class="space-y-2">
            <template v-if="isAuthenticated">
              <NuxtLink
                to="/my-racers"
                class="block text-gray-300 hover:text-orange-400 transition-colors flex items-center gap-2"
              >
                <i class="pi pi-user text-orange-400" />
                <span>My Racers</span>
              </NuxtLink>
              <NuxtLink
                to="/my-photos"
                class="block text-gray-300 hover:text-orange-400 transition-colors flex items-center gap-2"
              >
                <i class="pi pi-images text-orange-400" />
                <span>My Photos</span>
              </NuxtLink>
              <template v-if="isRaceAdmin">
                <NuxtLink
                  to="/admin"
                  class="block text-gray-300 hover:text-orange-400 transition-colors flex items-center gap-2"
                >
                  <i class="pi pi-shield text-orange-400" />
                  <span>Admin Dashboard</span>
                </NuxtLink>
              </template>
            </template>
            <template v-else>
              <NuxtLink
                to="/login"
                class="block text-gray-300 hover:text-orange-400 transition-colors flex items-center gap-2"
              >
                <i class="pi pi-sign-in text-orange-400" />
                <span>Login</span>
              </NuxtLink>
              <NuxtLink
                to="/register"
                class="block text-gray-300 hover:text-orange-400 transition-colors flex items-center gap-2"
              >
                <i class="pi pi-user-plus text-orange-400" />
                <span>Register</span>
              </NuxtLink>
            </template>
          </nav>
        </div>

        <!-- Connect & Contact -->
        <div class="space-y-4">
          <h3 class="text-lg font-semibold text-blue-400">Connect & Contact</h3>
          <div class="space-y-2">
            <!-- Email -->
            <a
              href="mailto:thegreatholyokebrickrace@gmail.com"
              class="flex items-center gap-2 text-gray-300 hover:text-blue-400 transition-colors"
            >
              <i class="pi pi-envelope text-blue-400" />
              <span>Email Us</span>
            </a>

            <!-- Facebook -->
            <a
              href="https://www.facebook.com/HolyokeBrickRace"
              target="_blank"
              rel="noopener noreferrer"
              class="flex items-center gap-2 text-gray-300 hover:text-blue-400 transition-colors"
            >
              <i class="pi pi-facebook text-blue-400" />
              <span>Facebook</span>
            </a>

            <!-- Instagram -->
            <a
              href="https://www.instagram.com/thegreatholyokebrickrace"
              target="_blank"
              rel="noopener noreferrer"
              class="flex items-center gap-2 text-gray-300 hover:text-blue-400 transition-colors"
            >
              <i class="pi pi-instagram text-blue-400" />
              <span>Instagram</span>
            </a>
          </div>
        </div>
      </div>

      <!-- Bottom Bar -->
      <div class="border-t border-gray-700 mt-8 pt-8 text-center text-gray-400">
        <p>
          &copy; {{ new Date().getFullYear() }} The Great Holyoke Brick Race. Built with creativity
          and community spirit.
        </p>
      </div>
    </div>
  </footer>
</template>

<script setup>
import { useAuthStore } from '~/stores/auth'

// Get auth state for conditional rendering
const authStore = useAuthStore()

const isAuthenticated = computed(() => authStore.isAuthenticated)
const isRaceAdmin = computed(() => authStore.isRaceAdmin)
</script>
