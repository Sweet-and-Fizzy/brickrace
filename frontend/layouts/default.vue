<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
    <!-- Mobile Drawer -->
    <Drawer v-model:visible="sidebarVisible" class="w-80" position="right">
      <template #header>
        <div class="flex items-center gap-3">
          <img
            src="~/assets/img/brick_race_logo.jpg"
            alt="Brick Race Logo"
            class="h-8 w-auto object-contain rounded"
          >
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
      class="bg-white dark:bg-gray-800 shadow-sm border-b dark:border-gray-700 transition-colors duration-200"
    >
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex items-center justify-between h-16">
          <!-- Tablet Navigation (md to lg) -->
          <div class="hidden md:block lg:hidden flex-1">
            <div class="flex items-center justify-between">
              <!-- Logo -->
              <NuxtLink to="/" class="flex items-center gap-3">
                <img
                  src="~/assets/img/brick_race_logo.jpg"
                  alt="Brick Race Logo"
                  class="h-10 w-auto object-contain rounded"
                >
                <span class="site-name text-xl font-bold text-gray-900 dark:text-white">
                  The Great Holyoke Brick Race
                </span>
              </NuxtLink>

              <!-- Navigation Icons -->
              <div class="flex items-center space-x-1">
                <!-- Main nav icons -->
                <Button
                  v-tooltip.bottom="'About'"
                  icon="pi pi-info-circle"
                  severity="secondary"
                  text
                  @click="navigateTo('/about')"
                />
                <Button
                  v-tooltip.bottom="'Build a Racer'"
                  icon="pi pi-wrench"
                  severity="secondary"
                  text
                  @click="navigateTo('/build-racer')"
                />
                <Button
                  v-tooltip.bottom="'Gallery'"
                  icon="pi pi-images"
                  severity="secondary"
                  text
                  @click="navigateTo('/gallery')"
                />
                <Button
                  v-tooltip.bottom="'Awards'"
                  icon="pi pi-trophy"
                  severity="secondary"
                  text
                  @click="navigateTo('/awards')"
                />
                <Button
                  v-tooltip.bottom="'Racers'"
                  icon="pi pi-car"
                  severity="secondary"
                  text
                  @click="navigateTo('/racers')"
                />
                <Button
                  v-tooltip.bottom="'Races'"
                  icon="pi pi-flag"
                  severity="secondary"
                  text
                  @click="navigateTo('/races')"
                />

                <!-- Dark Mode Toggle -->
                <Button
                  v-tooltip.bottom="isDark ? 'Switch to light mode' : 'Switch to dark mode'"
                  :icon="isDark ? 'pi pi-sun' : 'pi pi-moon'"
                  severity="secondary"
                  text
                  @click="toggleDarkMode"
                />

                <!-- Auth buttons or user menu -->
                <template v-if="!authStore.isAuthenticated">
                  <NuxtLink to="/login">
                    <Button
                      v-tooltip.bottom="'Login'"
                      severity="secondary"
                      text
                      icon="pi pi-sign-in"
                    />
                  </NuxtLink>
                  <NuxtLink to="/register">
                    <Button
                      v-tooltip.bottom="'Register'"
                      class="btn-brick-secondary text-sm"
                      icon="pi pi-user-plus"
                    />
                  </NuxtLink>
                </template>
                <template v-else>
                  <Button
                    v-tooltip.bottom="'My Account'"
                    icon="pi pi-user"
                    severity="secondary"
                    text
                    @click="navigateTo('/my-racers')"
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
                <NuxtLink to="/" class="flex items-center gap-3 mr-8">
                  <img
                    src="~/assets/img/brick_race_logo.jpg"
                    alt="Brick Race Logo"
                    class="h-10 w-auto object-contain rounded"
                  >
                  <span class="site-name text-xl font-bold text-gray-900 dark:text-white">
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
                    :model="userMenuItemsIconsOnly"
                    class="border-0 bg-transparent p-0 relative z-50"
                    :pt="{
                      menuitem: {
                        class:
                          'text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700'
                      },
                      itemLink: {
                        class: 'text-gray-900 dark:text-white flex items-center'
                      },
                      itemIcon: {
                        class: 'text-gray-600 dark:text-gray-300'
                      },
                      submenu: {
                        class: 'z-50'
                      }
                    }"
                  />

                  <!-- Auth Section for non-authenticated users -->
                  <template v-if="!authStore.isAuthenticated">
                    <NuxtLink to="/login">
                      <Button
                        v-tooltip.bottom="'Login'"
                        severity="secondary"
                        text
                        icon="pi pi-sign-in"
                      />
                    </NuxtLink>
                    <NuxtLink to="/register">
                      <Button
                        v-tooltip.bottom="'Register'"
                        class="btn-brick-secondary"
                        icon="pi pi-user-plus"
                      />
                    </NuxtLink>
                  </template>
                </div>
              </template>
            </MenuBar>
          </div>

          <!-- Mobile Logo and Menu Button -->
          <div class="md:hidden flex items-center justify-between w-full">
            <NuxtLink to="/" class="flex items-center gap-2">
              <img
                src="~/assets/img/brick_race_logo.jpg"
                alt="Brick Race Logo"
                class="h-8 w-auto object-contain rounded"
              >
              <span class="site-name text-xl font-bold text-gray-900 dark:text-white">
                The Great Holyoke Brick Race
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

// Sidebar state
const sidebarVisible = ref(false)

// Menu items for desktop (full text)
const menuItems = computed(() => [
  {
    label: 'About',
    icon: 'pi pi-info-circle',
    items: [
      {
        label: 'Build a Racer',
        icon: 'pi pi-wrench',
        command: () => navigateTo('/build-racer')
      },
      {
        label: 'Gallery',
        icon: 'pi pi-images',
        command: () => navigateTo('/gallery')
      },
      {
        label: 'Race History',
        icon: 'pi pi-clock',
        command: () => navigateTo('/about')
      }
    ]
  },
  {
    label: 'Awards',
    icon: 'pi pi-trophy',
    command: () => navigateTo('/awards')
  },
  {
    label: 'Racers',
    icon: 'pi pi-car',
    command: () => navigateTo('/racers')
  },
  {
    label: 'Races',
    icon: 'pi pi-flag',
    command: () => navigateTo('/races')
  }
])

// User menu items for tablet (icons only)
const userMenuItemsIconsOnly = computed(() =>
  authStore.isAuthenticated
    ? [
        {
          icon: 'pi pi-user',
          items: [
            {
              label: 'My Racers',
              icon: 'pi pi-car',
              command: () => {
                handleNavigation('/my-racers')
              }
            },
            {
              label: 'My Photos',
              icon: 'pi pi-images',
              command: () => {
                handleNavigation('/my-photos')
              }
            },
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
    label: 'Gallery',
    icon: 'pi pi-images',
    command: () => navigateTo('/gallery')
  },
  {
    label: 'Awards',
    icon: 'pi pi-trophy',
    command: () => navigateTo('/awards')
  },
  {
    label: 'Racers',
    icon: 'pi pi-car',
    command: () => navigateTo('/racers')
  },
  {
    label: 'Races',
    icon: 'pi pi-flag',
    command: () => navigateTo('/races')
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
