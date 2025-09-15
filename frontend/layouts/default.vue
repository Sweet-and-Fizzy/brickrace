<template>
  <div class="min-h-screen bg-gray-50 transition-colors duration-200">
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
      </div>
    </Drawer>

    <!-- Navigation with PrimeVue MenuBar -->
    <div class="bg-white shadow-sm transition-colors duration-200">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <!-- Desktop Navigation -->
        <div class="hidden lg:grid grid-cols-3 items-start py-6">
          <!-- Left: Main Navigation -->
          <MenuBar
            :model="menuItems"
            class="border-0 bg-transparent justify-self-start"
            :pt="{
              menuitem: {
                class: 'text-black hover:bg-gray-100 mx-2'
              },
              itemLink: {
                class: 'text-black flex items-center text-base font-semibold'
              },
              itemLabel: {
                class: 'text-black text-base font-semibold'
              },
              itemIcon: {
                class: 'text-black mr-1 text-base'
              },
              submenuIcon: {
                class: 'text-black'
              }
            }"
          />

          <!-- Center: Logo and Text Mark (Larger) -->
          <NuxtLink to="/" class="flex flex-col items-center justify-self-center">
            <img
              src="~/assets/img/brick_race_logo.jpg"
              alt="The Great Holyoke Brick Race Logo"
              class="h-32 w-auto mb-3"
            >
            <div
              class="site-name text-3xl font-bold text-black tracking-wider text-center whitespace-nowrap"
            >
              the great holyoke brick race
            </div>
          </NuxtLink>

          <!-- Right: Personal Navigation -->
          <div class="flex items-center space-x-2 justify-self-end">
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
                  class: 'text-black hover:bg-gray-100 border-0',
                  style: 'border: none !important;'
                },
                itemLink: {
                  class: 'text-black flex items-center text-base font-semibold border-0',
                  style: 'border: none !important;'
                },
                itemLabel: {
                  class: 'text-black text-base font-semibold'
                },
                itemIcon: {
                  class: 'text-black mr-1 text-base'
                },
                submenuIcon: {
                  class: 'text-black'
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
                class="text-black hover:text-brand-blue transition-colors px-3 py-2 text-sm flex items-center"
              >
                <i class="pi pi-sign-in mr-2" />
                <span>Login</span>
              </NuxtLink>
              <NuxtLink
                to="/register"
                class="text-black hover:text-brand-blue transition-colors px-3 py-2 text-sm flex items-center"
              >
                <i class="pi pi-user-plus mr-2" />
                <span>Register</span>
              </NuxtLink>
            </template>
          </div>
        </div>

        <div class="flex items-center justify-between h-16">
          <!-- Tablet Navigation (md to lg) -->
          <div class="hidden md:block lg:hidden flex-1">
            <div class="flex items-center justify-between">
              <!-- Logo -->
              <NuxtLink to="/" class="flex items-center">
                <span class="site-name text-xl font-bold text-black">
                  the great holyoke brick race
                </span>
              </NuxtLink>

              <!-- Navigation Icons -->
              <div class="flex items-center space-x-1">
                <!-- Racing Section -->
                <!-- Static race buttons -->
                <Button
                  v-tooltip.bottom="'The 2025 Brick Race'"
                  icon="pi pi-play-circle"
                  severity="secondary"
                  text
                  @click="navigateTo('/races/the-2025-brick-race')"
                />
                <Button
                  v-tooltip.bottom="'2025 Test Day'"
                  icon="pi pi-calendar"
                  severity="secondary"
                  text
                  @click="navigateTo('/races/2025-test-day')"
                />
                <Button
                  v-tooltip.bottom="'Awards'"
                  icon="pi pi-trophy"
                  severity="secondary"
                  text
                  @click="navigateTo('/awards')"
                />
                <Button
                  v-tooltip.bottom="'All Races'"
                  icon="pi pi-flag"
                  severity="secondary"
                  text
                  @click="navigateTo('/races')"
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
                  @click="
                    () => {
                      if (authStore.isAuthenticated) {
                        navigateTo('/racers/add')
                      } else {
                        navigateTo('/login?redirect=/racers/add')
                      }
                    }
                  "
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

                <!-- Auth buttons or user menu -->
                <template v-if="!authStore.isAuthenticated">
                  <NuxtLink
                    to="/login"
                    class="text-gray-600 hover:text-black transition-colors px-2 py-1 text-sm flex items-center"
                  >
                    <i class="pi pi-sign-in mr-2" />
                    <span>Login</span>
                  </NuxtLink>
                  <NuxtLink
                    to="/register"
                    class="text-gray-600 hover:text-black transition-colors px-2 py-1 text-sm flex items-center"
                  >
                    <i class="pi pi-user-plus mr-2" />
                    <span>Register</span>
                  </NuxtLink>
                </template>
              </div>
            </div>
          </div>

          <!-- Mobile Logo and Menu Button -->
          <div class="md:hidden w-full">
            <div class="flex items-center justify-between mb-2">
              <!-- Mobile menu button -->
              <Button
                v-tooltip.bottom="'Open navigation menu'"
                icon="pi pi-bars"
                severity="secondary"
                text
                aria-label="Open navigation menu"
                @click="sidebarVisible = true"
              />

              <!-- Spacer for centering -->
              <div class="w-10" />
            </div>

            <!-- Centered Logo and Text -->
            <NuxtLink to="/" class="block text-center">
              <img
                src="~/assets/img/brick_race_logo.jpg"
                alt="The Great Holyoke Brick Race Logo"
                class="h-20 w-auto mx-auto mb-2"
              >
              <div class="site-name text-2xl font-bold text-black">
                the great holyoke brick race
              </div>
            </NuxtLink>
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

// Sidebar state
const sidebarVisible = ref(false)

// Menu items for desktop (full text)
const menuItems = computed(() => [
  {
    label: 'Races',
    items: [
      // Static race links
      {
        label: 'The 2025 Brick Race',
        command: () => navigateTo('/races/the-2025-brick-race')
      },
      {
        label: '2025 Test Day',
        command: () => navigateTo('/races/2025-test-day')
      },
      {
        label: 'Awards',
        command: () => navigateTo('/awards')
      },
      {
        label: 'All Races',
        command: () => navigateTo('/races')
      },
      {
        label: 'Our History',
        command: () => navigateTo('/our-story')
      }
    ]
  },
  {
    label: 'Racers',
    items: [
      {
        label: 'Browse Racers',
        command: () => navigateTo('/racers')
      },
      ...(authStore.isAuthenticated
        ? [
            {
              label: 'My Racers',
              command: () => navigateTo('/my-racers')
            }
          ]
        : []),
      {
        label: 'Add Your Racer',
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
    label: 'Photos',
    items: [
      {
        label: 'Photo Gallery',
        command: () => navigateTo('/gallery')
      },
      ...(authStore.isAuthenticated
        ? [
            {
              label: 'My Photos',
              command: () => navigateTo('/my-photos')
            }
          ]
        : [])
    ]
  },
  {
    label: 'FAQ',
    command: () => navigateTo('/faq')
  }
])

// User menu items for desktop (icons only)
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
                  },
                  {
                    separator: true
                  }
                ]
              : []),
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
  // Racing Section
  // Static race links
  {
    label: 'The 2025 Brick Race',
    icon: 'pi pi-play-circle',
    command: () => navigateTo('/races/the-2025-brick-race')
  },
  {
    label: '2025 Test Day',
    icon: 'pi pi-calendar',
    command: () => navigateTo('/races/2025-test-day')
  },
  {
    label: 'Awards',
    icon: 'pi pi-trophy',
    command: () => navigateTo('/awards')
  },
  {
    label: 'All Races',
    icon: 'pi pi-flag',
    command: () => navigateTo('/races')
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
  ...(authStore.isAuthenticated
    ? [
        {
          label: 'My Racers',
          icon: 'pi pi-user',
          command: () => navigateTo('/my-racers')
        }
      ]
    : []),
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

// Initialize auth state
onMounted(() => {
  authStore.initAuth()
})
</script>
