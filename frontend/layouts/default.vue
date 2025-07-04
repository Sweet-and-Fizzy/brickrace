<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
    <!-- Mobile Sidebar -->
    <Sidebar v-model:visible="sidebarVisible" class="w-80">
      <template #header>
        <div class="flex items-center gap-3">
          <img
            src="~/assets/img/brick_race_logo.jpg"
            alt="Brick Race Logo"
            class="h-8 w-auto object-contain rounded"
          />
          <span class="font-bold text-lg">The Great Holyoke Brick Race</span>
        </div>
      </template>

      <div class="space-y-2">
        <!-- Navigation Links -->
        <div v-for="item in sidebarMenuItems" :key="item.label" class="block">
          <Button
            :icon="item.icon"
            :label="item.label"
            severity="secondary"
            text
            class="w-full justify-start"
            @click="handleSidebarNavigation(item.command)"
          />
        </div>

        <!-- Divider -->
        <Divider class="my-4" />

        <!-- Auth Section -->
        <template v-if="authStore.isAuthenticated">
          <Button
            label="Logout"
            icon="pi pi-sign-out"
            severity="danger"
            text
            class="w-full justify-start"
            @click="handleSidebarNavigation(() => authStore.logout())"
          />
        </template>

        <template v-else>
          <Button
            label="Login"
            icon="pi pi-sign-in"
            severity="secondary"
            text
            class="w-full justify-start"
            @click="handleSidebarNavigation(() => navigateTo('/login'))"
          />
          <Button
            label="Register"
            icon="pi pi-user-plus"
            severity="primary"
            text
            class="w-full justify-start"
            @click="handleSidebarNavigation(() => navigateTo('/register'))"
          />
        </template>

        <!-- Dark Mode Toggle -->
        <Button
          v-tooltip.right="isDark ? 'Switch to light mode' : 'Switch to dark mode'"
          :icon="isDark ? 'pi pi-sun' : 'pi pi-moon'"
          :label="isDark ? 'Light Mode' : 'Dark Mode'"
          severity="secondary"
          text
          class="w-full justify-start"
          @click="toggleDarkMode"
        />
      </div>
    </Sidebar>

    <!-- Navigation with PrimeVue MenuBar -->
    <div
      class="bg-white dark:bg-gray-800 shadow-sm border-b dark:border-gray-700 transition-colors duration-200"
    >
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex items-center justify-between h-16">
          <!-- Mobile menu button -->
          <Button
            v-tooltip.bottom="'Open navigation menu'"
            icon="pi pi-bars"
            severity="secondary"
            text
            class="md:hidden"
            aria-label="Open navigation menu"
            @click="sidebarVisible = true"
          />

          <!-- Desktop Navigation -->
          <div class="hidden md:block flex-1">
            <MenuBar
              :model="menuItems"
              class="border-0 bg-transparent"
              :pt="{
                menuitem: {
                  class:
                    'text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 mx-3'
                },
                itemLink: {
                  class: 'text-gray-900 dark:text-white flex items-center'
                },
                itemLabel: {
                  class: 'text-gray-900 dark:text-white'
                },
                itemIcon: {
                  class: 'text-gray-600 dark:text-gray-300 mr-1'
                }
              }"
            >
              <template #start>
                <NuxtLink to="/" class="flex items-center gap-3 mr-8">
                  <img
                    src="~/assets/img/brick_race_logo.jpg"
                    alt="Brick Race Logo"
                    class="h-10 w-auto object-contain rounded"
                  />
                  <span class="text-xl font-bold text-gray-900 dark:text-white">
                    The Great Holyoke Brick Race
                  </span>
                </NuxtLink>
              </template>

              <template #end>
                <div class="flex items-center space-x-2">
                  <!-- Dark Mode Toggle -->
                  <Button
                    v-tooltip.bottom="isDark ? 'Switch to light mode' : 'Switch to dark mode'"
                    :icon="isDark ? 'pi pi-sun' : 'pi pi-moon'"
                    severity="secondary"
                    text
                    rounded
                    :aria-label="isDark ? 'Switch to light mode' : 'Switch to dark mode'"
                    :pt="{
                      icon: { class: 'text-gray-600 dark:text-gray-300' }
                    }"
                    @click="toggleDarkMode"
                  />

                  <!-- User Menu for authenticated users -->
                  <MenuBar
                    v-if="authStore.isAuthenticated"
                    :model="userMenuItems"
                    class="border-0 bg-transparent p-0"
                    :pt="{
                      menuitem: {
                        class:
                          'text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700'
                      },
                      itemLink: {
                        class: 'text-gray-900 dark:text-white flex items-center'
                      },
                      itemLabel: {
                        class: 'text-gray-900 dark:text-white'
                      },
                      itemIcon: {
                        class: 'text-gray-600 dark:text-gray-300 mr-1'
                      }
                    }"
                  />

                  <!-- Auth Section for non-authenticated users -->
                  <template v-if="!authStore.isAuthenticated">
                    <NuxtLink to="/login">
                      <Button severity="secondary" text label="Login" />
                    </NuxtLink>
                    <NuxtLink to="/register">
                      <Button>Register</Button>
                    </NuxtLink>
                  </template>
                </div>
              </template>
            </MenuBar>
          </div>

          <!-- Mobile Logo and Dark Mode Toggle -->
          <div class="md:hidden flex items-center space-x-2">
            <NuxtLink to="/" class="flex items-center gap-2">
              <img
                src="~/assets/img/brick_race_logo.jpg"
                alt="Brick Race Logo"
                class="h-8 w-auto object-contain rounded"
              />
              <span class="text-xl font-bold text-gray-900 dark:text-white">
                The Great Holyoke Brick Race
              </span>
            </NuxtLink>
          </div>
        </div>
      </div>
    </div>

    <!-- Main content -->
    <main>
      <slot />
    </main>

    <!-- Global Components -->
    <Toast />
    <ConfirmDialog />
  </div>
</template>

<script setup>
import { useAuthStore } from '~/stores/auth'
import MenuBar from 'primevue/menubar'

const authStore = useAuthStore()

// Dark mode functionality
const { isDark, toggleDarkMode, initDarkMode, watchSystemTheme } = useDarkMode()

// Sidebar state
const sidebarVisible = ref(false)

// Menu items for desktop
const menuItems = computed(() => [
  {
    label: 'About',
    icon: 'pi pi-info-circle',
    items: [
      {
        label: 'Race History',
        icon: 'pi pi-clock',
        command: () => navigateTo('/about')
      },
      {
        label: 'Build a Racer',
        icon: 'pi pi-wrench',
        command: () => navigateTo('/build-racer')
      }
    ]
  },
  {
    label: 'Races',
    icon: 'pi pi-flag',
    command: () => navigateTo('/races')
  },
  {
    label: 'Racers',
    icon: 'pi pi-car',
    command: () => navigateTo('/racers')
  },
  {
    label: 'Gallery',
    icon: 'pi pi-images',
    command: () => navigateTo('/gallery')
  },
  {
    label: 'Awards',
    icon: 'pi pi-trophy',
    command: () => navigateTo('/awards')
  }
])

// User menu items for authenticated users (shown in end template)
const userMenuItems = computed(() =>
  authStore.isAuthenticated
    ? [
        {
          label: 'My Account',
          icon: 'pi pi-user',
          items: [
            {
              label: 'My Racers',
              icon: 'pi pi-car',
              command: () => navigateTo('/my-racers')
            },
            {
              label: 'My Photos',
              icon: 'pi pi-images',
              command: () => navigateTo('/my-photos')
            },
            ...(authStore.isRaceAdmin
              ? [
                  {
                    label: 'Admin Dashboard',
                    icon: 'pi pi-shield',
                    command: () => navigateTo('/admin')
                  }
                ]
              : []),
            {
              separator: true
            },
            {
              label: 'Logout',
              icon: 'pi pi-sign-out',
              command: () => authStore.logout()
            }
          ]
        }
      ]
    : []
)

// Menu items for mobile sidebar
const sidebarMenuItems = computed(() => [
  {
    label: 'Home',
    icon: 'pi pi-home',
    command: () => navigateTo('/')
  },
  {
    label: 'Race History',
    icon: 'pi pi-clock',
    command: () => navigateTo('/about')
  },
  {
    label: 'Build a Racer',
    icon: 'pi pi-wrench',
    command: () => navigateTo('/build-racer')
  },
  {
    label: 'Races',
    icon: 'pi pi-flag',
    command: () => navigateTo('/races')
  },
  {
    label: 'Racers',
    icon: 'pi pi-car',
    command: () => navigateTo('/racers')
  },
  {
    label: 'Gallery',
    icon: 'pi pi-images',
    command: () => navigateTo('/gallery')
  },
  {
    label: 'Awards',
    icon: 'pi pi-trophy',
    command: () => navigateTo('/awards')
  },
  ...(authStore.isAuthenticated
    ? [
        {
          label: 'My Racers',
          icon: 'pi pi-user',
          command: () => navigateTo('/my-racers')
        },
        {
          label: 'My Photos',
          icon: 'pi pi-images',
          command: () => navigateTo('/my-photos')
        },
        ...(authStore.isRaceAdmin
          ? [
              {
                label: 'Admin Dashboard',
                icon: 'pi pi-shield',
                command: () => navigateTo('/admin')
              }
            ]
          : [])
      ]
    : [])
])

// Handle sidebar navigation
const handleSidebarNavigation = (command) => {
  if (typeof command === 'function') {
    command()
  }
  sidebarVisible.value = false
}

// Initialize auth state and dark mode
onMounted(() => {
  authStore.initAuth()
  initDarkMode()
  watchSystemTheme()
})
</script>
