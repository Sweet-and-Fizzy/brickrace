<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
    <!-- Mobile Drawer -->
    <Drawer 
      v-model:visible="sidebarVisible" 
      position="right"
      :pt="{
        root: {
          style: 'width: 24rem'
        }
      }"
    >
      <template #header>
        <div class="flex items-center">
          <span class="font-bold text-lg">the great holyoke brick race</span>
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
            @click="
              handleSidebarNavigation(async () => {
                try {
                  await authStore.logout()
                } catch (error) {
                  console.error('Logout error:', error)
                }
              })
            "
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
    </Drawer>

    <!-- Navigation with PrimeVue MenuBar -->
    <div
      class="bg-white dark:bg-gray-800 shadow-sm transition-colors duration-200"
    >
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex items-center justify-between h-16">
          <!-- Tablet Navigation (md to lg) -->
          <div class="hidden md:block lg:hidden flex-1">
            <div class="flex items-center justify-between">
              <!-- Logo -->
              <NuxtLink to="/" class="flex items-center">
                <span class="site-name text-xl font-bold text-gray-900 dark:text-white">
                  the great holyoke brick race
                </span>
              </NuxtLink>

              <!-- Navigation Icons -->
              <div class="flex items-center space-x-1">
                <!-- Racing Section -->
                <!-- Current race button if there's an active race -->
                <Button
                  v-if="activeRace"
                  v-tooltip.bottom="activeRace.name"
                  icon="pi pi-play-circle"
                  severity="secondary"
                  text
                  @click="navigateTo(`/races/${activeRace.slug || activeRace.id}`)"
                />
                <Button
                  v-tooltip.bottom="'All Races'"
                  icon="pi pi-flag"
                  severity="secondary"
                  text
                  @click="navigateTo('/races')"
                />
                <Button
                  v-tooltip.bottom="'Race Awards'"
                  icon="pi pi-trophy"
                  severity="secondary"
                  text
                  @click="navigateTo('/awards')"
                />
                <Button
                  v-tooltip.bottom="'Our History'"
                  icon="pi pi-clock"
                  severity="secondary"
                  text
                  @click="navigateTo('/our-story')"
                />
                <!-- Racers Section -->
                <Button
                  v-tooltip.bottom="'Browse Racers'"
                  icon="pi pi-car"
                  severity="secondary"
                  text
                  @click="navigateTo('/racers')"
                />
                <Button
                  v-if="authStore.isAuthenticated"
                  v-tooltip.bottom="'My Racers'"
                  icon="pi pi-user"
                  severity="secondary"
                  text
                  @click="navigateTo('/my-racers')"
                />
                <Button
                  v-tooltip.bottom="'Add Your Racer'"
                  icon="pi pi-plus"
                  severity="secondary"
                  text
                  @click="() => {
                    if (authStore.isAuthenticated) {
                      navigateTo('/racers/add')
                    } else {
                      navigateTo('/login?redirect=/racers/add')
                    }
                  }"
                />
                <!-- Community Section -->
                <Button
                  v-tooltip.bottom="'Photo Gallery'"
                  icon="pi pi-images"
                  severity="secondary"
                  text
                  @click="navigateTo('/gallery')"
                />
                <Button
                  v-if="authStore.isAuthenticated"
                  v-tooltip.bottom="'My Photos'"
                  icon="pi pi-images"
                  severity="secondary"
                  text
                  @click="navigateTo('/my-photos')"
                />
                <!-- FAQ Section -->
                <Button
                  v-tooltip.bottom="'FAQ'"
                  icon="pi pi-question-circle"
                  severity="secondary"
                  text
                  @click="navigateTo('/faq')"
                />

                <!-- Dark Mode Toggle (only for unauthenticated users) -->
                <Button
                  v-if="!authStore.isAuthenticated"
                  v-tooltip.bottom="isDark ? 'Switch to light mode' : 'Switch to dark mode'"
                  :icon="isDark ? 'pi pi-sun' : 'pi pi-moon'"
                  severity="secondary"
                  text
                  @click="toggleDarkMode"
                />

                <!-- Auth buttons or user menu -->
                <template v-if="!authStore.isAuthenticated">
                  <NuxtLink 
                    to="/login" 
                    class="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors px-2 py-1 text-sm flex items-center"
                  >
                    <i class="pi pi-sign-in mr-2" />
                    <span>Login</span>
                  </NuxtLink>
                  <NuxtLink 
                    to="/register" 
                    class="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors px-2 py-1 text-sm flex items-center"
                  >
                    <i class="pi pi-user-plus mr-2" />
                    <span>Register</span>
                  </NuxtLink>
                </template>
                <template v-else>
                  <Button
                    v-tooltip.bottom="isDark ? 'Switch to light mode' : 'Switch to dark mode'"
                    :icon="isDark ? 'pi pi-sun' : 'pi pi-moon'"
                    severity="secondary"
                    text
                    @click="toggleDarkMode"
                  />
                </template>
              </div>
            </div>
          </div>

          <!-- Desktop Navigation -->
          <div class="hidden lg:block flex-1">
            <MenuBar
              :model="menuItems"
              class="border-0 bg-transparent"
              :pt="{
                menuitem: {
                  class:
                    'text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 mx-2'
                },
                itemLink: {
                  class: 'text-gray-900 dark:text-white flex items-center text-sm'
                },
                itemLabel: {
                  class: 'text-gray-900 dark:text-white text-sm'
                },
                itemIcon: {
                  class: 'text-gray-600 dark:text-gray-300 mr-1 text-sm'
                }
              }"
            >
              <template #start>
                <NuxtLink to="/" class="flex items-center mr-8">
                  <span class="site-name text-xl font-bold text-gray-900 dark:text-white">
                    the great holyoke brick race
                  </span>
                </NuxtLink>
              </template>

              <template #end>
                <div class="flex items-center space-x-2">
                  <!-- Dark Mode Toggle (only for unauthenticated users) -->
                  <Button
                    v-if="!authStore.isAuthenticated"
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
                    :model="userMenuItemsIconsOnly"
                    class="border-0 bg-transparent p-0 relative z-50"
                    :pt="{
                      root: {
                        class: 'border-0',
                        style: 'border: none !important;'
                      },
                      menu: {
                        class: 'border-0',
                        style: 'border: none !important;'
                      },
                      menubar: {
                        class: 'border-0',
                        style: 'border: none !important;'
                      },
                      menuitem: {
                        class:
                          'text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 border-0',
                        style: 'border: none !important;'
                      },
                      itemLink: {
                        class: 'text-gray-900 dark:text-white flex items-center border-0',
                        style: 'border: none !important;'
                      },
                      itemIcon: {
                        class: 'text-gray-600 dark:text-gray-300'
                      },
                      submenu: {
                        class: 'z-50 right-0 border-0',
                        style: 'border: none !important;'
                      }
                    }"
                  />

                  <!-- Auth Section for non-authenticated users -->
                  <template v-if="!authStore.isAuthenticated">
                    <NuxtLink 
                      to="/login" 
                      class="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors px-3 py-2 text-sm flex items-center"
                    >
                      <i class="pi pi-sign-in mr-2" />
                      <span>Login</span>
                    </NuxtLink>
                    <NuxtLink 
                      to="/register" 
                      class="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors px-3 py-2 text-sm flex items-center"
                    >
                      <i class="pi pi-user-plus mr-2" />
                      <span>Register</span>
                    </NuxtLink>
                  </template>
                </div>
              </template>
            </MenuBar>
          </div>

          <!-- Mobile Logo and Menu Button -->
          <div class="md:hidden flex items-center justify-between w-full">
            <NuxtLink to="/" class="flex items-center">
              <span class="site-name text-xl font-bold text-gray-900 dark:text-white">
                the great holyoke brick race
              </span>
            </NuxtLink>

            <!-- Mobile menu button -->
            <Button
              v-tooltip.bottom="'Open navigation menu'"
              icon="pi pi-bars"
              severity="secondary"
              text
              aria-label="Open navigation menu"
              @click="sidebarVisible = true"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- Main content -->
    <main>
      <slot />
    </main>

    <!-- Footer -->
    <AppFooter />

    <!-- Global Components -->
    <Toast />
    <ConfirmDialog />
  </div>
</template>

<script setup>
import { useAuthStore } from '~/stores/auth'
import MenuBar from 'primevue/menubar'

const authStore = useAuthStore()
const router = useRouter()

// Dark mode functionality
const { isDark, toggleDarkMode, initDarkMode, watchSystemTheme } = useDarkMode()

// Races data for active race in navigation
const { activeRace } = useRaces()

// Sidebar state
const sidebarVisible = ref(false)

// Menu items for desktop (full text)
const menuItems = computed(() => [
  {
    label: 'Races',
    icon: 'pi pi-flag',
    items: [
      // Add current race if there's an active one
      ...(activeRace.value ? [{
        label: activeRace.value.name,
        icon: 'pi pi-play-circle',
        command: () => navigateTo(`/races/${activeRace.value.slug || activeRace.value.id}`)
      }] : []),
      {
        label: 'All Races',
        icon: 'pi pi-flag',
        command: () => navigateTo('/races')
      },
      {
        label: 'Race Awards',
        icon: 'pi pi-trophy',
        command: () => navigateTo('/awards')
      },
      {
        label: 'Our History',
        icon: 'pi pi-clock',
        command: () => navigateTo('/our-story')
      }
    ]
  },
  {
    label: 'Racers',
    icon: 'pi pi-car',
    items: [
      {
        label: 'Browse Racers',
        icon: 'pi pi-car',
        command: () => navigateTo('/racers')
      },
      ...(authStore.isAuthenticated ? [
        {
          label: 'My Racers',
          icon: 'pi pi-user',
          command: () => navigateTo('/my-racers')
        }
      ] : []),
      {
        label: 'Add Your Racer',
        icon: 'pi pi-plus',
        command: () => {
          if (authStore.isAuthenticated) {
            navigateTo('/racers/add')
          } else {
            navigateTo('/login?redirect=/racers/add')
          }
        }
      }
    ]
  },
  {
    label: 'Community',
    icon: 'pi pi-users',
    items: [
      {
        label: 'Photo Gallery',
        icon: 'pi pi-images',
        command: () => navigateTo('/gallery')
      },
      ...(authStore.isAuthenticated ? [
        {
          label: 'My Photos',
          icon: 'pi pi-images',
          command: () => navigateTo('/my-photos')
        }
      ] : [])
    ]
  },
  {
    label: 'FAQ',
    icon: 'pi pi-question-circle',
    command: () => navigateTo('/faq')
  }
])

// User menu items for tablet (icons only)
const userMenuItemsIconsOnly = computed(() =>
  authStore.isAuthenticated
    ? [
        {
          icon: 'pi pi-user',
          items: [
            ...(authStore.isRaceAdmin
              ? [
                  {
                    label: 'Admin Dashboard',
                    icon: 'pi pi-shield',
                    command: () => {
                      handleNavigation('/admin')
                    }
                  }
                ]
              : []),
            {
              separator: true
            },
            {
              label: isDark.value ? 'Light Mode' : 'Dark Mode',
              icon: isDark.value ? 'pi pi-sun' : 'pi pi-moon',
              command: () => {
                toggleDarkMode()
              }
            },
            {
              label: 'Logout',
              icon: 'pi pi-sign-out',
              command: async () => {
                try {
                  await authStore.logout()
                } catch (error) {
                  console.error('Logout error:', error)
                }
              }
            }
          ]
        }
      ]
    : []
)

// Menu items for mobile sidebar (matches desktop order with Home first)
const sidebarMenuItems = computed(() => [
  {
    label: 'Home',
    icon: 'pi pi-home',
    command: () => navigateTo('/')
  },
  // Racing Section
  // Add current race if there's an active one
  ...(activeRace.value ? [{
    label: activeRace.value.name,
    icon: 'pi pi-play-circle',
    command: () => navigateTo(`/races/${activeRace.value.slug || activeRace.value.id}`)
  }] : []),
  {
    label: 'All Races',
    icon: 'pi pi-flag',
    command: () => navigateTo('/races')
  },
  {
    label: 'Race Awards',
    icon: 'pi pi-trophy',
    command: () => navigateTo('/awards')
  },
  {
    label: 'Our History',
    icon: 'pi pi-clock',
    command: () => navigateTo('/our-story')
  },
  // Racers Section
  {
    label: 'Browse Racers',
    icon: 'pi pi-car',
    command: () => navigateTo('/racers')
  },
  ...(authStore.isAuthenticated ? [
    {
      label: 'My Racers',
      icon: 'pi pi-user',
      command: () => navigateTo('/my-racers')
    }
  ] : []),
  {
    label: 'Add Your Racer',
    icon: 'pi pi-plus',
    command: () => {
      if (authStore.isAuthenticated) {
        navigateTo('/racers/add')
      } else {
        navigateTo('/login?redirect=/racers/add')
      }
    }
  },
  // Community Section
  {
    label: 'Photo Gallery',
    icon: 'pi pi-images',
    command: () => navigateTo('/gallery')
  },
  // FAQ Section
  {
    label: 'FAQ',
    icon: 'pi pi-question-circle',
    command: () => navigateTo('/faq')
  },
  ...(authStore.isAuthenticated
    ? [
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

// Handle navigation
const handleNavigation = (path) => {
  router.push(path)
}

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
