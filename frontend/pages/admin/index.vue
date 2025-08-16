<template>
  <div class="min-h-screen bg-white dark:bg-gray-900">
    <!-- Header -->
    <div class="bg-white dark:bg-gray-800 shadow-sm border-b dark:border-gray-700">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div class="flex flex-col md:flex-row md:items-center md:justify-between">
          <div class="text-center md:text-left">
            <div class="flex justify-center md:justify-start mb-6">
              <div class="bg-brand-blue rounded-full w-16 h-16 flex items-center justify-center">
                <i class="pi pi-shield text-2xl text-white" />
              </div>
            </div>
            <h1 class="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Admin Dashboard
            </h1>
            <p class="text-lg text-gray-600 dark:text-gray-400 max-w-3xl">
              Manage races, approve photos, and oversee the racing community
            </p>
          </div>
          <div class="mt-4 md:mt-0 flex justify-center md:justify-end">
            <AdminMenu />
          </div>
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="pending" class="flex justify-center py-12">
      <ProgressSpinner />
    </div>

    <!-- Main Content -->
    <div v-else class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <!-- Photo Management -->
        <Card
          class="border-2 border-blue-200 dark:border-blue-800 hover:shadow-lg transition-shadow cursor-pointer"
          @click="navigateTo('/admin/photos')"
        >
          <template #content>
            <div class="text-center space-y-4">
              <div class="flex justify-center">
                <div
                  class="bg-blue-100 dark:bg-blue-900/30 rounded-full w-16 h-16 flex items-center justify-center"
                >
                  <i class="pi pi-images text-2xl text-blue-600 dark:text-blue-400" />
                </div>
              </div>

              <div>
                <h3 class="text-xl font-bold text-gray-900 dark:text-white mb-2">Photo Approval</h3>
                <p class="text-gray-600 dark:text-gray-400 mb-4">
                  Review and approve user-submitted photos
                </p>
                <div class="flex justify-center space-x-4">
                  <Badge :value="`${pendingPhotosCount} pending`" severity="warning" />
                  <Badge :value="`${totalPhotosCount} total`" severity="info" />
                </div>
              </div>
            </div>
          </template>
        </Card>

        <!-- Race Management -->
        <Card
          class="border-2 border-green-200 dark:border-green-800 hover:shadow-lg transition-shadow cursor-pointer"
          @click="navigateTo('/races')"
        >
          <template #content>
            <div class="text-center space-y-4">
              <div class="flex justify-center">
                <div
                  class="bg-green-100 dark:bg-green-900/30 rounded-full w-16 h-16 flex items-center justify-center"
                >
                  <i class="pi pi-flag text-2xl text-green-600 dark:text-green-400" />
                </div>
              </div>

              <div>
                <h3 class="text-xl font-bold text-gray-900 dark:text-white mb-2">
                  Race Management
                </h3>
                <p class="text-gray-600 dark:text-gray-400 mb-4">Create and manage race events</p>
                <div class="flex justify-center space-x-4">
                  <Badge :value="`${activeRacesCount} active`" severity="success" />
                  <Badge :value="`${totalRacesCount} total`" severity="info" />
                </div>
              </div>
            </div>
          </template>
        </Card>

        <!-- Awards Management -->
        <Card
          class="border-2 border-yellow-200 dark:border-yellow-800 hover:shadow-lg transition-shadow cursor-pointer"
          @click="navigateTo('/awards/manage')"
        >
          <template #content>
            <div class="text-center space-y-4">
              <div class="flex justify-center">
                <div
                  class="bg-yellow-100 dark:bg-yellow-900/30 rounded-full w-16 h-16 flex items-center justify-center"
                >
                  <i class="pi pi-trophy text-2xl text-yellow-600 dark:text-yellow-400" />
                </div>
              </div>

              <div>
                <h3 class="text-xl font-bold text-gray-900 dark:text-white mb-2">
                  Awards Management
                </h3>
                <p class="text-gray-600 dark:text-gray-400 mb-4">Manage race awards and winners</p>
                <div class="flex justify-center space-x-4">
                  <Badge :value="`${awardsCount} awards`" severity="info" />
                </div>
              </div>
            </div>
          </template>
        </Card>

        <!-- Racer Management -->
        <Card
          class="border-2 border-purple-200 dark:border-purple-800 hover:shadow-lg transition-shadow cursor-pointer"
          @click="navigateTo('/racers')"
        >
          <template #content>
            <div class="text-center space-y-4">
              <div class="flex justify-center">
                <div
                  class="bg-purple-100 dark:bg-purple-900/30 rounded-full w-16 h-16 flex items-center justify-center"
                >
                  <i class="pi pi-car text-2xl text-purple-600 dark:text-purple-400" />
                </div>
              </div>

              <div>
                <h3 class="text-xl font-bold text-gray-900 dark:text-white mb-2">
                  Racer Management
                </h3>
                <p class="text-gray-600 dark:text-gray-400 mb-4">View and manage all racers</p>
                <div class="flex justify-center space-x-4">
                  <Badge :value="`${racersCount} racers`" severity="info" />
                </div>
              </div>
            </div>
          </template>
        </Card>

        <!-- User Management -->
        <Card
          class="border-2 border-indigo-200 dark:border-indigo-800 hover:shadow-lg transition-shadow"
        >
          <template #content>
            <div class="text-center space-y-4">
              <div class="flex justify-center">
                <div
                  class="bg-indigo-100 dark:bg-indigo-900/30 rounded-full w-16 h-16 flex items-center justify-center"
                >
                  <i class="pi pi-users text-2xl text-indigo-600 dark:text-indigo-400" />
                </div>
              </div>

              <div>
                <h3 class="text-xl font-bold text-gray-900 dark:text-white mb-2">
                  User Management
                </h3>
                <p class="text-gray-600 dark:text-gray-400 mb-4">
                  Manage user accounts and permissions
                </p>
                <div class="flex justify-center space-x-4">
                  <Badge value="Coming Soon" severity="secondary" />
                </div>
              </div>
            </div>
          </template>
        </Card>

        <!-- System Stats -->
        <Card
          class="border-2 border-gray-200 dark:border-gray-800 hover:shadow-lg transition-shadow"
        >
          <template #content>
            <div class="text-center space-y-4">
              <div class="flex justify-center">
                <div
                  class="bg-gray-100 dark:bg-gray-900/30 rounded-full w-16 h-16 flex items-center justify-center"
                >
                  <i class="pi pi-chart-bar text-2xl text-gray-600 dark:text-gray-400" />
                </div>
              </div>

              <div>
                <h3 class="text-xl font-bold text-gray-900 dark:text-white mb-2">System Stats</h3>
                <p class="text-gray-600 dark:text-gray-400 mb-4">
                  View platform statistics and metrics
                </p>
                <div class="flex justify-center space-x-4">
                  <Badge value="Coming Soon" severity="secondary" />
                </div>
              </div>
            </div>
          </template>
        </Card>
      </div>

      <!-- Quick Actions -->
      <div class="mt-12">
        <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-6">Quick Actions</h2>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <NuxtLink to="/races/add">
            <Button class="w-full h-16 text-left" severity="primary">
              <i class="pi pi-plus mr-2" />
              Create New Race
            </Button>
          </NuxtLink>
          <NuxtLink to="/admin/photos">
            <Button class="w-full h-16 text-left" severity="secondary">
              <i class="pi pi-eye mr-2" />
              Review Photos
            </Button>
          </NuxtLink>
          <NuxtLink to="/awards/manage">
            <Button class="w-full h-16 text-left" severity="success">
              <i class="pi pi-trophy mr-2" />
              Manage Awards
            </Button>
          </NuxtLink>
          <NuxtLink to="/racers">
            <Button class="w-full h-16 text-left" outlined>
              <i class="pi pi-car mr-2" />
              View All Racers
            </Button>
          </NuxtLink>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useAuthStore } from '~/stores/auth'

definePageMeta({
  middleware: 'admin'
})

const authStore = useAuthStore()
const supabase = useSupabaseClient()

// State
const pending = ref(true)
const stats = ref({
  pendingPhotos: 0,
  totalPhotos: 0,
  activeRaces: 0,
  totalRaces: 0,
  awards: 0,
  racers: 0
})

// Computed properties
const pendingPhotosCount = computed(() => stats.value.pendingPhotos)
const totalPhotosCount = computed(() => stats.value.totalPhotos)
const activeRacesCount = computed(() => stats.value.activeRaces)
const totalRacesCount = computed(() => stats.value.totalRaces)
const awardsCount = computed(() => stats.value.awards)
const racersCount = computed(() => stats.value.racers)

// Fetch dashboard statistics
const fetchStats = async () => {
  try {
    // Fetch race statistics
    const { data: racesData, error: racesError } = await supabase.from('races').select('id, active')

    if (racesError) throw racesError

    stats.value.totalRaces = racesData?.length || 0
    stats.value.activeRaces = racesData?.filter((race) => race.active)?.length || 0

    // Fetch racer count
    const { data: racersData, error: racersError } = await supabase
      .from('racers')
      .select('id', { count: 'exact' })

    if (racersError) throw racersError
    stats.value.racers = racersData?.length || 0

    // Fetch awards count
    const { data: awardsData, error: awardsError } = await supabase
      .from('awards')
      .select('id', { count: 'exact' })

    if (awardsError) throw awardsError
    stats.value.awards = awardsData?.length || 0

    // Fetch photo statistics from both racer photos and general photos
    const { data: racersWithPhotos, error: photosError } = await supabase
      .from('racers')
      .select('photos')
      .not('photos', 'is', null)

    if (photosError) throw photosError

    let totalPhotos = 0
    racersWithPhotos?.forEach((racer) => {
      if (racer.photos && Array.isArray(racer.photos)) {
        totalPhotos += racer.photos.length
      }
    })

    stats.value.totalPhotos = totalPhotos
    // All racer photos are considered approved for now
    stats.value.pendingPhotos = 0
  } catch (error) {
    console.error('Error fetching dashboard stats:', error)
  } finally {
    pending.value = false
  }
}

// Initialize
onMounted(async () => {
  await authStore.initAuth()
  if (!authStore.isRaceAdmin) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Access denied. Admin privileges required.'
    })
  }
  await fetchStats()
})

useHead({
  title: 'Admin Dashboard - The Great Holyoke Brick Race',
  meta: [
    {
      name: 'description',
      content: 'Administrative dashboard for managing races, photos, and users.'
    }
  ]
})
</script>
