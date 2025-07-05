<template>
  <footer class="bg-gray-800 dark:bg-gray-900 text-white">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
        <!-- Logo and Description -->
        <div class="space-y-4">
          <div class="flex items-center gap-3">
            <img
              src="~/assets/img/brick_race_logo.jpg"
              alt="The Great Holyoke Brick Race Logo"
              class="h-12 w-auto object-contain rounded"
            >
            <span class="site-name text-xl font-bold">The Great Holyoke Brick Race</span>
          </div>
          <p class="text-gray-300">
            A celebration of creativity, engineering, and friendly competition where custom gravity-powered vehicles race for glory.
          </p>
        </div>

        <!-- Quick Links -->
        <div class="space-y-4">
          <h3 class="text-lg font-semibold">Quick Links</h3>
          <nav class="space-y-2">
            <NuxtLink to="/about" class="block text-gray-300 hover:text-white transition-colors">About</NuxtLink>
            <NuxtLink to="/build-racer" class="block text-gray-300 hover:text-white transition-colors">Build a Racer</NuxtLink>
            <NuxtLink to="/racers" class="block text-gray-300 hover:text-white transition-colors">All Racers</NuxtLink>
            <NuxtLink to="/gallery" class="block text-gray-300 hover:text-white transition-colors">Photo Gallery</NuxtLink>
            <NuxtLink to="/awards" class="block text-gray-300 hover:text-white transition-colors">Awards</NuxtLink>
          </nav>
        </div>

        <!-- Contact and Social -->
        <div class="space-y-4">
          <h3 class="text-lg font-semibold">Connect With Us</h3>
          <div class="space-y-3">
            <!-- Email -->
            <a 
              href="mailto:thegreatholyokebrickrace@gmail.com"
              class="flex items-center gap-3 text-gray-300 hover:text-white transition-colors"
            >
              <i class="pi pi-envelope text-lg" />
              <span>Email</span>
            </a>

            <!-- Facebook -->
            <a 
              href="https://www.facebook.com/HolyokeBrickRace"
              target="_blank"
              rel="noopener noreferrer"
              class="flex items-center gap-3 text-gray-300 hover:text-white transition-colors"
            >
              <i class="pi pi-facebook text-lg" />
              <span>Facebook</span>
            </a>

            <!-- Instagram -->
            <a 
              href="https://www.instagram.com/thegreatholyokebrickrace"
              target="_blank"
              rel="noopener noreferrer"
              class="flex items-center gap-3 text-gray-300 hover:text-white transition-colors"
            >
              <i class="pi pi-instagram text-lg" />
              <span>Instagram</span>
            </a>
          </div>
        </div>
      </div>

      <!-- Bottom Bar -->
      <div class="border-t border-gray-700 mt-8 pt-8 text-center text-gray-400">
        <p>&copy; {{ new Date().getFullYear() }} The Great Holyoke Brick Race. Built with creativity and community spirit.</p>
      </div>
    </div>
  </footer>
</template>

<script setup>
// Footer component for The Great Holyoke Brick Race
</script>