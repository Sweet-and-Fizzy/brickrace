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

      <div>
        <!-- Navigation Links -->
        <div v-for="item in sidebarMenuItems" :key="item.label" class="block">
          <Button
            :icon="item.icon"
            :label="item.label"
            severity="secondary"
            text
            class="w-full justify-start py-1.5 text-sm"
            @click="handleSidebarNavigation(item.command)"
          />
        </div>

        <!-- Divider -->
        <Divider class="my-1" />

        <!-- Auth Section -->
        <template v-if="authStore.isAuthenticated">
          <Button
            label="Logout"
            icon="pi pi-sign-out"
            severity="danger"
            text
            class="w-full justify-start py-1.5 text-sm"
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
            class="w-full justify-start py-1.5 text-sm"
            @click="handleSidebarNavigation(() => navigateTo('/login'))"
          />
          <Button
            label="Register"
            icon="pi pi-user-plus"
            severity="primary"
            text
            class="w-full justify-start py-1.5 text-sm"
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
                class: 'text-black flex items-center text-base font-semibold gap-1'
              },
              itemLabel: {
                class: 'text-black text-base font-semibold'
              },
              itemIcon: {
                class: 'text-black mr-1 text-base'
              },
              submenuIcon: {
                class: 'text-black -ml-0.5'
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
            <!-- Sponsors Link -->
            <NuxtLink
              to="/sponsors"
              class="text-black hover:text-brand-blue transition-colors px-3 py-2 text-base font-semibold flex items-center"
            >
              <i class="pi pi-building mr-1" />
              <span>Sponsors</span>
            </NuxtLink>

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
                  class: 'text-black flex items-center text-base font-normal border-0',
                  style: 'border: none !important;'
                },
                itemLabel: {
                  class: 'text-black text-base font-normal'
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

        <!-- Tablet Navigation (md to lg) -->
        <div class="hidden md:flex lg:hidden flex-col">
          <!-- Top Navigation Bar -->
          <div class="flex items-center justify-between py-2">
            <!-- Hamburger Menu -->
            <Button
              icon="pi pi-bars"
              severity="secondary"
              text
              aria-label="Open navigation menu"
              @click="sidebarVisible = true"
            />
            
            <!-- Navigation Links -->
            <div class="flex items-center space-x-4 text-sm">
              <NuxtLink to="/races/the-2025-brick-race" class="hover:text-brand-blue">2025 Race</NuxtLink>
              <NuxtLink to="/racers" class="hover:text-brand-blue">Racers</NuxtLink>
              <NuxtLink to="/photos" class="hover:text-brand-blue">Photos</NuxtLink>
              <NuxtLink to="/faq" class="hover:text-brand-blue">FAQ</NuxtLink>
              <NuxtLink to="/sponsors" class="hover:text-brand-blue">Sponsors</NuxtLink>
            </div>
            
            <!-- Auth Section -->
            <div class="flex items-center space-x-2">
              <template v-if="authStore.isAuthenticated">
                <!-- Use a simple button with menu for tablet to avoid hamburger -->
                <Button
                  icon="pi pi-user"
                  severity="secondary"
                  text
                  aria-label="User menu"
                  @click="(event) => $refs.tabletUserMenu.toggle(event)"
                />
                <Menu 
                  ref="tabletUserMenu" 
                  :model="tabletUserMenuItems" 
                  :popup="true"
                  :pt="{
                    itemLabel: {
                      class: 'font-normal'
                    }
                  }"
                />
              </template>
              <template v-else>
                <NuxtLink to="/login" class="hover:text-brand-blue text-sm">Login</NuxtLink>
                <NuxtLink to="/register" class="hover:text-brand-blue text-sm">Register</NuxtLink>
              </template>
            </div>
          </div>
          
          <!-- Logo and Text Below -->
          <div class="py-4">
            <NuxtLink to="/" class="flex flex-col items-center">
              <img
                src="~/assets/img/brick_race_logo.jpg"
                alt="The Great Holyoke Brick Race Logo"
                class="h-24 w-auto mb-2"
              >
              <div class="site-name text-2xl font-bold text-black tracking-wider text-center">
                the great holyoke brick race
              </div>
            </NuxtLink>
          </div>
        </div>

        <!-- Mobile Navigation -->
        <div class="md:hidden">
          <!-- Top Navigation Bar -->
          <div class="flex items-center justify-end py-3 mb-4">
            <!-- Hamburger Menu in upper right -->
            <Button
              icon="pi pi-bars"
              severity="secondary"
              text
              aria-label="Open navigation menu"
              @click="sidebarVisible = true"
            />
          </div>
          
          <!-- Logo and Text Below -->
          <NuxtLink to="/" class="block text-center pb-4">
            <img
              src="~/assets/img/brick_race_logo.jpg"
              alt="The Great Holyoke Brick Race Logo"
              class="h-20 w-auto mx-auto mb-2"
            >
            <div class="site-name text-xl font-bold text-black">
              the great holyoke brick race
            </div>
          </NuxtLink>
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
import Menu from 'primevue/menu'

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
    command: () => navigateTo('/photos')
  },
  {
    label: 'FAQ',
    command: () => navigateTo('/faq')
  }
])

// Tablet user menu items (for dropdown)
const tabletUserMenuItems = computed(() =>
  authStore.isAuthenticated
    ? [
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
    : []
)

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
    label: 'Photos',
    icon: 'pi pi-images',
    command: () => navigateTo('/photos')
  },
  // FAQ Section
  {
    label: 'FAQ',
    icon: 'pi pi-question-circle',
    command: () => navigateTo('/faq')
  },
  // Sponsors Section
  {
    label: 'Sponsors',
    icon: 'pi pi-building',
    command: () => navigateTo('/sponsors')
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
