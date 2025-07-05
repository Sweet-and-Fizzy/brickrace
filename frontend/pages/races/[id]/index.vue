<template>
  <div class="container mx-auto px-4 py-8">
    <!-- Breadcrumb Navigation -->
    <Breadcrumb :model="breadcrumbItems" class="mb-6" />

    <!-- Loading State -->
    <div v-if="pending">
      <!-- Breadcrumb Skeleton -->
      <Skeleton width="20rem" height="1.5rem" class="mb-6" />

      <!-- Header Skeleton -->
      <div class="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
        <div>
          <Skeleton width="15rem" height="2.5rem" class="mb-2" />
          <div class="flex items-center gap-4">
            <Skeleton width="8rem" height="1rem" />
            <Skeleton width="6rem" height="1rem" />
          </div>
        </div>
        <div class="flex gap-2 mt-4 md:mt-0">
          <Skeleton width="8rem" height="2.5rem" />
          <Skeleton width="7rem" height="2.5rem" />
          <Skeleton width="6rem" height="2.5rem" />
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <!-- Main Content Skeleton -->
        <div class="lg:col-span-2 space-y-6">
          <!-- Tournament Results Skeleton -->
          <Card>
            <template #title>
              <Skeleton width="12rem" height="1.5rem" />
            </template>
            <template #content>
              <div class="space-y-6">
                <Skeleton width="100%" height="8rem" />
                <Skeleton width="100%" height="6rem" />
              </div>
            </template>
          </Card>

          <!-- Race Image Skeleton -->
          <Card>
            <template #header>
              <Skeleton width="100%" height="24rem" />
            </template>
          </Card>

          <!-- Qualifiers/Brackets Skeleton -->
          <Card>
            <template #title>
              <Skeleton width="10rem" height="1.5rem" />
            </template>
            <template #content>
              <div class="space-y-3">
                <div
                  v-for="n in 5"
                  :key="n"
                  class="flex items-center justify-between p-3 border rounded"
                >
                  <div class="flex items-center gap-3">
                    <Skeleton width="2rem" height="1rem" />
                    <Skeleton width="8rem" height="1rem" />
                  </div>
                  <Skeleton width="4rem" height="1rem" />
                </div>
              </div>
            </template>
          </Card>
        </div>

        <!-- Sidebar Skeleton -->
        <div class="space-y-6">
          <Card>
            <template #title>
              <Skeleton width="6rem" height="1.25rem" />
            </template>
            <template #content>
              <div class="space-y-4">
                <div v-for="n in 4" :key="n" class="flex justify-between">
                  <Skeleton width="5rem" height="1rem" />
                  <Skeleton width="3rem" height="1rem" />
                </div>
              </div>
            </template>
          </Card>
        </div>
      </div>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="text-center py-12">
      <i class="pi pi-exclamation-triangle text-6xl text-red-400 mb-4" />
      <h2 class="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-2">Race Not Found</h2>
      <p class="text-gray-600 dark:text-gray-300 mb-2">
        The race you're looking for doesn't exist or has been removed.
      </p>
      <p class="text-sm text-gray-500 dark:text-gray-400 mb-6">
        ID requested: {{ route.params.id }}
      </p>
      <div class="space-x-4">
        <NuxtLink to="/races">
          <Button severity="primary">
            <i class="pi pi-arrow-left mr-2" />
            Back to All Races
          </Button>
        </NuxtLink>
      </div>
    </div>

    <!-- Race Details -->
    <div v-else-if="race">
      <!-- Header -->
      <div class="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
        <div>
          <div class="flex items-center gap-3 mb-2">
            <h1 class="text-3xl font-bold text-gray-900 dark:text-white">{{ race.name }}</h1>
            <div
              v-if="race.active"
              class="bg-green-600 text-white px-3 py-1 rounded-full text-sm font-semibold"
            >
              <i class="pi pi-check-circle mr-1" />
              ACTIVE
            </div>
            <div v-else class="bg-gray-400 text-white px-3 py-1 rounded-full text-sm font-semibold">
              <i class="pi pi-clock mr-1" />
              HISTORICAL
            </div>
          </div>
          <div class="flex items-center gap-4 text-gray-600 dark:text-gray-300">
            <span>{{
              new Date(race.date).toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })
            }}</span>
            <span v-if="!race.active" class="text-amber-600 dark:text-amber-400 font-medium">
              <i class="pi pi-info-circle mr-1" />
              Read-only view
            </span>
          </div>
        </div>

        <div class="flex gap-2 mt-4 md:mt-0">
          <!-- Active Race Admin Controls -->
          <template v-if="authStore.isRaceAdmin && race.active">
            <NuxtLink :to="`/races/${race.id}/checkin`">
              <Button severity="success">
                <i class="pi pi-check mr-2" />
                Check-in Racers
              </Button>
            </NuxtLink>
            <NuxtLink :to="`/races/${race.id}/qualifiers`">
              <Button severity="info">
                <i class="pi pi-clock mr-2" />
                Qualifiers
              </Button>
            </NuxtLink>
            <NuxtLink :to="`/races/${race.id}/brackets`">
              <Button severity="help">
                <i class="pi pi-sitemap mr-2" />
                Brackets
              </Button>
            </NuxtLink>
          </template>

          <!-- General Admin Controls (available for all races) -->
          <NuxtLink v-if="authStore.isRaceAdmin" :to="`/races/${race.id}/edit`">
            <Button severity="primary">
              <i class="pi pi-pencil mr-2" />
              Edit Race
            </Button>
          </NuxtLink>
        </div>
      </div>

      <!-- Race Process Steps -->
      <Card class="mb-8">
        <template #content>
          <div class="px-2">
            <Steps :model="raceSteps" :active-step="currentStep" class="mb-4" />
            <div class="text-center mt-4">
              <p class="text-sm text-gray-600 dark:text-gray-400">
                Current Status:
                <span class="font-semibold">{{ raceSteps[currentStep]?.label || 'Unknown' }}</span>
              </p>
            </div>
          </div>
        </template>
      </Card>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <!-- Main Content -->
        <div class="lg:col-span-2 space-y-6">
          <!-- Tournament Results Podium -->
          <Card v-if="tournamentResults.Fastest || tournamentResults.Slowest">
            <template #title>
              <h2 class="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                <i class="pi pi-crown text-yellow-500 text-xl" />
                Tournament Results
              </h2>
            </template>
            <template #content>
              <div v-for="(result, bracketType) in tournamentResults" :key="bracketType">
                <div v-if="result" class="mb-6 last:mb-0">
                  <h3 class="text-lg font-bold text-center mb-4 text-gray-800 dark:text-gray-200">
                    {{ bracketType }} Tournament Podium
                  </h3>

                  <!-- Compact Podium Display -->
                  <div class="flex items-end justify-center gap-2 mb-4">
                    <!-- 2nd Place -->
                    <div v-if="result.second" class="text-center flex-1 max-w-24">
                      <div
                        class="bg-gradient-to-br from-gray-200 to-gray-300 border border-gray-400 rounded-lg p-2 shadow-md mb-1"
                      >
                        <div class="text-2xl mb-1">🥈</div>
                        <NuxtLink
                          :to="`/racers/${result.second.racer_id}`"
                          class="text-sm font-bold text-gray-800 dark:text-gray-200 hover:text-blue-600 hover:underline transition-colors duration-200 block truncate"
                        >
                          {{ result.second.racer_name }}
                        </NuxtLink>
                        <div
                          class="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-1 py-0.5 rounded text-xs font-semibold"
                        >
                          #{{ result.second.racer_number }}
                        </div>
                        <div class="text-xs text-gray-600 dark:text-gray-300 mt-1">
                          {{ formatTime(result.second.time) }}
                        </div>
                      </div>
                      <div
                        class="bg-gray-300 dark:bg-gray-600 h-8 rounded-t text-xs flex items-center justify-center"
                      >
                        <span class="font-bold text-gray-700 dark:text-gray-200">2nd</span>
                      </div>
                    </div>

                    <!-- 1st Place (Champion) -->
                    <div class="text-center flex-1 max-w-28">
                      <div
                        class="bg-gradient-to-br from-yellow-200 to-orange-200 border border-yellow-400 rounded-lg p-3 shadow-xl mb-1"
                      >
                        <div class="text-3xl mb-1">🏆</div>
                        <NuxtLink
                          :to="`/racers/${result.first.racer_id}`"
                          class="text-lg font-bold text-gray-900 dark:text-gray-100 hover:text-blue-600 hover:underline transition-colors duration-200 block truncate"
                        >
                          {{ result.first.racer_name }}
                        </NuxtLink>
                        <div
                          class="bg-yellow-200 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 px-2 py-0.5 rounded-full text-sm font-bold mb-1"
                        >
                          #{{ result.first.racer_number }}
                        </div>
                        <div class="text-sm font-bold text-blue-600">
                          {{ formatTime(result.first.winning_time) }}
                        </div>
                        <div class="mt-1">
                          <span
                            class="bg-gradient-to-r from-yellow-400 to-orange-400 text-white px-2 py-0.5 rounded-full text-xs font-bold"
                          >
                            CHAMPION
                          </span>
                        </div>
                      </div>
                      <div
                        class="bg-gradient-to-r from-yellow-400 to-orange-400 h-12 rounded-t text-sm flex items-center justify-center"
                      >
                        <span class="font-bold text-white">1st</span>
                      </div>
                    </div>

                    <!-- 3rd Place -->
                    <div v-if="result.third" class="text-center flex-1 max-w-24">
                      <div
                        class="bg-gradient-to-br from-orange-200 to-orange-300 border border-orange-400 rounded-lg p-2 shadow-md mb-1"
                      >
                        <div class="text-2xl mb-1">🥉</div>
                        <NuxtLink
                          :to="`/racers/${result.third.racer_id}`"
                          class="text-sm font-bold text-gray-800 dark:text-gray-200 hover:text-blue-600 hover:underline transition-colors duration-200 block truncate"
                        >
                          {{ result.third.racer_name }}
                        </NuxtLink>
                        <div
                          class="bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 px-1 py-0.5 rounded text-xs font-semibold"
                        >
                          #{{ result.third.racer_number }}
                        </div>
                        <div class="text-xs text-gray-600 dark:text-gray-300 mt-1">
                          {{ formatTime(result.third.time) }}
                        </div>
                      </div>
                      <div
                        class="bg-orange-400 dark:bg-orange-600 h-6 rounded-t text-xs flex items-center justify-center"
                      >
                        <span class="font-bold text-white">3rd</span>
                      </div>
                    </div>
                  </div>

                  <!-- Tournament Type Badge -->
                  <div class="text-center">
                    <span
                      class="bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300 px-3 py-1 rounded-full text-sm font-bold"
                    >
                      {{ bracketType }} Tournament Complete
                    </span>
                  </div>
                </div>
              </div>
            </template>
          </Card>

          <!-- Brackets -->
          <Card v-if="brackets.length">
            <template #title>
              <h2 class="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <i class="pi pi-sitemap text-purple-600" />
                Tournament Brackets
              </h2>
            </template>
            <template #content>
              <div class="space-y-6">
                <div
                  v-for="(bracket, index) in brackets"
                  :key="bracket.id"
                  class="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/30 dark:to-blue-900/30 border border-purple-200 dark:border-purple-700 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow duration-200"
                >
                  <div class="flex items-center justify-between mb-4">
                    <h3
                      class="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2"
                    >
                      <span
                        class="bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300 px-2 py-1 rounded-full text-sm font-medium"
                      >
                        {{ bracket.bracket_type }}
                      </span>
                      Bracket #{{ index + 1 }}
                    </h3>
                    <NuxtLink
                      v-if="authStore.isRaceAdmin"
                      :to="`/races/${race.id}/brackets`"
                      class="text-purple-600 hover:text-purple-800 text-sm font-medium"
                    >
                      Manage →
                    </NuxtLink>
                  </div>

                  <div class="flex items-center gap-4">
                    <!-- Track 1 -->
                    <div
                      class="flex-1 bg-white dark:bg-gray-800 rounded-lg p-4 border-2 border-blue-200 dark:border-blue-600"
                    >
                      <div class="text-center">
                        <p class="text-sm font-medium text-blue-600 mb-2">Track 1</p>
                        <div v-if="bracket.track1_racer_name">
                          <NuxtLink
                            :to="`/racers/${bracket.track1_racer_id}`"
                            class="font-bold text-lg text-gray-900 dark:text-white hover:text-blue-600 hover:underline transition-colors duration-200 block"
                          >
                            {{ bracket.track1_racer_name }}
                          </NuxtLink>
                          <p class="text-sm text-gray-600 dark:text-gray-300 mb-2">
                            #{{ bracket.track1_racer_number }}
                          </p>
                          <div
                            v-if="bracket.track1_time"
                            class="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-2"
                          >
                            <p class="text-lg font-bold text-blue-600">
                              {{ formatTime(bracket.track1_time) }}
                            </p>
                          </div>
                          <div v-else class="text-gray-400">
                            <p class="text-sm">No time recorded</p>
                          </div>
                        </div>
                        <div v-else class="text-gray-400">
                          <p class="font-medium">TBD</p>
                        </div>
                      </div>
                    </div>

                    <!-- VS Divider -->
                    <div class="flex items-center justify-center flex-shrink-0">
                      <div
                        class="bg-purple-100 dark:bg-purple-900/30 rounded-full w-12 h-12 flex items-center justify-center shadow-md"
                      >
                        <span class="font-bold text-purple-600 dark:text-purple-300">VS</span>
                      </div>
                    </div>

                    <!-- Track 2 -->
                    <div
                      class="flex-1 bg-white dark:bg-gray-800 rounded-lg p-4 border-2 border-red-200 dark:border-red-600"
                    >
                      <div class="text-center">
                        <p class="text-sm font-medium text-red-600 mb-2">Track 2</p>
                        <div v-if="bracket.track2_racer_name">
                          <NuxtLink
                            :to="`/racers/${bracket.track2_racer_id}`"
                            class="font-bold text-lg text-gray-900 dark:text-white hover:text-blue-600 hover:underline transition-colors duration-200 block"
                          >
                            {{ bracket.track2_racer_name }}
                          </NuxtLink>
                          <p class="text-sm text-gray-600 dark:text-gray-300 mb-2">
                            #{{ bracket.track2_racer_number }}
                          </p>
                          <div
                            v-if="bracket.track2_time"
                            class="bg-red-50 dark:bg-red-900/20 rounded-lg p-2"
                          >
                            <p class="text-lg font-bold text-red-600">
                              {{ formatTime(bracket.track2_time) }}
                            </p>
                          </div>
                          <div v-else class="text-gray-400">
                            <p class="text-sm">No time recorded</p>
                          </div>
                        </div>
                        <div v-else class="text-gray-400">
                          <p class="font-medium">TBD</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <!-- Winner Display -->
                  <div v-if="bracket.track1_time && bracket.track2_time" class="mt-4 text-center">
                    <div
                      class="bg-gradient-to-r from-yellow-100 to-orange-100 dark:from-yellow-900/30 dark:to-orange-900/30 border border-yellow-300 dark:border-yellow-700 rounded-lg p-3"
                    >
                      <p
                        class="text-sm font-medium text-yellow-800 dark:text-yellow-300 mb-1 flex items-center justify-center gap-1"
                      >
                        <i class="pi pi-trophy" />
                        Winner
                      </p>
                      <p class="font-bold text-lg text-yellow-900 dark:text-yellow-200">
                        {{ getWinner(bracket) }}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </template>
          </Card>

          <!-- Race Image -->
          <Card v-if="race.image_url">
            <template #header>
              <img
                :src="race.image_url"
                :alt="race.name"
                class="w-full h-64 md:h-96 object-cover"
              >
            </template>
          </Card>

          <!-- Qualifiers Results -->
          <Card v-if="qualifiers.length">
            <template #title>
              <h2 class="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <i class="pi pi-clock" />
                Qualifying Times
              </h2>
            </template>
            <template #content>
              <DataTable
                :value="qualifiers"
                striped-rows
                responsive-layout="scroll"
                :sort-field="'time'"
                :sort-order="1"
                class="custom-datatable"
              >
                <Column field="racer_number" header="#" style="width: 60px">
                  <template #body="slotProps">
                    <span class="font-semibold text-blue-600"
                      >#{{ slotProps.data.racer_number }}</span
                    >
                  </template>
                </Column>
                <Column field="racer_name" header="Racer">
                  <template #body="slotProps">
                    <span class="font-medium text-gray-900 dark:text-white">{{
                      slotProps.data.racer_name
                    }}</span>
                  </template>
                </Column>
                <Column field="time" header="Time" sortable>
                  <template #body="slotProps">
                    <span class="font-bold text-lg text-blue-600">{{
                      formatTime(slotProps.data.time)
                    }}</span>
                  </template>
                </Column>
                <Column field="created_at" header="Time">
                  <template #body="slotProps">
                    <span class="text-sm text-gray-600 dark:text-gray-300">{{
                      new Date(slotProps.data.created_at).toLocaleTimeString()
                    }}</span>
                  </template>
                </Column>
              </DataTable>
            </template>
          </Card>

          <!-- Checked In Racers -->
          <Card v-if="checkins.length">
            <template #title>
              <h2 class="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <i class="pi pi-users" />
                Checked In Racers ({{ checkins.length }})
              </h2>
            </template>
            <template #content>
              <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                <NuxtLink
                  v-for="checkin in checkins"
                  :key="checkin.id"
                  :to="`/racers/${checkin.racer_id}`"
                  class="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors duration-200"
                >
                  <div class="relative">
                    <img
                      v-if="checkin.racer_image_url"
                      :src="checkin.racer_image_url"
                      :alt="checkin.racer_name"
                      class="w-12 h-12 object-cover rounded-full border-2 border-green-300"
                    >
                    <div
                      v-else
                      class="w-12 h-12 bg-gray-200 dark:bg-gray-600 rounded-full border-2 border-green-300 flex items-center justify-center"
                    >
                      <i class="pi pi-car text-gray-500 dark:text-gray-300" />
                    </div>
                    <i
                      class="pi pi-check-circle text-green-600 text-sm absolute -bottom-1 -right-1 bg-white rounded-full"
                    />
                  </div>
                  <div class="flex-1">
                    <p class="font-medium text-gray-900 dark:text-white hover:text-indigo-600">
                      {{ checkin.racer_name }}
                    </p>
                    <p class="text-sm text-gray-600 dark:text-gray-300">
                      #{{ checkin.racer_number }} •
                      {{ new Date(checkin.time).toLocaleTimeString() }}
                    </p>
                  </div>
                </NuxtLink>
              </div>
            </template>
          </Card>

          <!-- Photo Management (Admin Only) -->
          <Card v-if="authStore.isRaceAdmin">
            <template #title>
              <div class="flex items-center justify-between">
                <h2 class="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <i class="pi pi-images text-blue-600" />
                  Race Photo Management
                </h2>
                <div class="flex items-center gap-2">
                  <Badge :value="`${racePhotosCount} photos`" severity="info" />
                  <Badge :value="`${pendingRacePhotos} pending`" severity="warning" />
                </div>
              </div>
            </template>
            <template #content>
              <div class="space-y-6">
                <!-- Quick Stats -->
                <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div class="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <div class="text-lg font-bold text-blue-600 dark:text-blue-400">
                      {{ racerPhotosCount }}
                    </div>
                    <div class="text-sm text-gray-600 dark:text-gray-400">Racer Photos</div>
                  </div>
                  <div class="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <div class="text-lg font-bold text-green-600 dark:text-green-400">
                      {{ generalPhotosCount }}
                    </div>
                    <div class="text-sm text-gray-600 dark:text-gray-400">General Photos</div>
                  </div>
                  <div class="text-center p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                    <div class="text-lg font-bold text-yellow-600 dark:text-yellow-400">
                      {{ featuredPhotosCount }}
                    </div>
                    <div class="text-sm text-gray-600 dark:text-gray-400">Featured</div>
                  </div>
                  <div class="text-center p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                    <div class="text-lg font-bold text-purple-600 dark:text-purple-400">
                      {{ pendingRacePhotos }}
                    </div>
                    <div class="text-sm text-gray-600 dark:text-gray-400">Pending</div>
                  </div>
                </div>

                <!-- Recent Race Photos Preview -->
                <div v-if="recentRacePhotos.length > 0">
                  <h4 class="font-semibold text-gray-900 dark:text-white mb-3">
                    Recent Photos from This Race
                  </h4>
                  <div class="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
                    <div
                      v-for="(photo, index) in recentRacePhotos.slice(0, 6)"
                      :key="index"
                      class="relative group cursor-pointer"
                      @click="viewPhotoInGallery(photo)"
                    >
                      <Image
                        :src="photo.url"
                        :alt="`Race photo ${index + 1}`"
                        image-class="w-full h-20 object-cover rounded-lg border hover:border-blue-400 transition-colors"
                        class="w-full h-20"
                        :preview="false"
                      />

                      <!-- Status Badge -->
                      <div class="absolute top-1 right-1">
                        <Badge
                          :value="photo.status || 'approved'"
                          :severity="getPhotoStatusSeverity(photo.status)"
                          class="text-xs"
                        />
                      </div>

                      <!-- Featured Badge -->
                      <div
                        v-if="photo.featured"
                        class="absolute top-1 left-1 bg-yellow-500 text-white rounded-full w-5 h-5 flex items-center justify-center"
                      >
                        <i class="pi pi-star text-xs" />
                      </div>

                      <!-- Hover Overlay -->
                      <div
                        class="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-30 rounded-lg transition-all duration-200 flex items-center justify-center"
                      >
                        <i
                          class="pi pi-eye text-white opacity-0 group-hover:opacity-100 transition-opacity"
                        />
                      </div>
                    </div>
                  </div>

                  <div v-if="recentRacePhotos.length > 6" class="text-center mt-3">
                    <p class="text-sm text-gray-500 dark:text-gray-400">
                      +{{ recentRacePhotos.length - 6 }} more photos from this race
                    </p>
                  </div>
                </div>

                <!-- No Photos State -->
                <div v-else class="text-center py-8">
                  <i class="pi pi-images text-4xl text-gray-300 dark:text-gray-600 mb-3" />
                  <h4 class="font-semibold text-gray-600 dark:text-gray-400 mb-2">No Photos Yet</h4>
                  <p class="text-sm text-gray-500 dark:text-gray-500">
                    Photos from racers in this race will appear here once uploaded
                  </p>
                </div>

                <!-- Management Actions -->
                <div
                  class="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-200 dark:border-gray-700"
                >
                  <NuxtLink to="/admin/photos" class="flex-1">
                    <Button class="w-full" severity="primary">
                      <i class="pi pi-cog mr-2" />
                      Manage All Photos
                    </Button>
                  </NuxtLink>
                  <Button
                    class="flex-1"
                    severity="secondary"
                    :loading="loadingPhotos"
                    @click="refreshRacePhotos"
                  >
                    <i class="pi pi-refresh mr-2" />
                    Refresh Photos
                  </Button>
                  <Button
                    class="flex-1"
                    severity="success"
                    outlined
                    @click="showUploadDialog = true"
                  >
                    <i class="pi pi-plus mr-2" />
                    Add Photos
                  </Button>
                </div>
              </div>
            </template>
          </Card>
        </div>

        <!-- Sidebar -->
        <div class="space-y-6">
          <!-- Quick Stats -->
          <Card>
            <template #title>Race Stats</template>
            <template #content>
              <div class="space-y-4">
                <div class="flex justify-between">
                  <span class="text-gray-600 dark:text-gray-300">Total Racers</span>
                  <span class="font-semibold">{{ checkins.length }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-600 dark:text-gray-300">Qualifying Runs</span>
                  <span class="font-semibold">{{ qualifiers.length }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-600 dark:text-gray-300">Bracket Races</span>
                  <span class="font-semibold">{{ brackets.length }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-600 dark:text-gray-300">Fastest Time</span>
                  <span class="font-semibold">{{ fastestTime || 'N/A' }}</span>
                </div>
              </div>
            </template>
          </Card>

          <!-- Race Timeline -->
          <Card>
            <template #title>
              <h3
                class="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2"
              >
                <i class="pi pi-history" />
                Race Timeline
              </h3>
            </template>
            <template #content>
              <Timeline :value="raceEvents" class="w-full">
                <template #marker="{ item }">
                  <div
                    class="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold"
                    :class="{
                      'bg-green-500': item.type === 'created',
                      'bg-blue-500': item.type === 'checkin',
                      'bg-purple-500': item.type === 'qualifying',
                      'bg-orange-500': item.type === 'brackets',
                      'bg-yellow-500': item.type === 'completed'
                    }"
                  >
                    <i :class="item.icon" />
                  </div>
                </template>
                <template #opposite="{ item }">
                  <div class="pr-4 text-right">
                    <p class="text-gray-500 dark:text-gray-500 text-xs font-medium">
                      {{ formatEventTime(item.date) }}
                    </p>
                  </div>
                </template>
                <template #content="{ item }">
                  <div class="pl-4">
                    <h4 class="font-semibold text-gray-900 dark:text-white text-sm">
                      {{ item.title }}
                    </h4>
                    <p class="text-gray-600 dark:text-gray-400 text-xs mt-1">
                      {{ item.description }}
                    </p>
                  </div>
                </template>
              </Timeline>
            </template>
          </Card>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useAuthStore } from '~/stores/auth'

const route = useRoute()
const authStore = useAuthStore()
const { $supabase } = useNuxtApp()

const race = ref(null)
const qualifiers = ref([])
const brackets = ref([])
const checkins = ref([])
const pending = ref(true)
const error = ref(null)

// Photo management state
const racePhotos = ref([])
const loadingPhotos = ref(false)
const showUploadDialog = ref(false)

// Breadcrumb navigation
const breadcrumbItems = computed(() => [
  { label: 'Home', url: '/' },
  { label: 'Races', url: '/races' },
  { label: race.value?.name || 'Race Details' } // Current page, no navigation
])

// Fetch race data from Supabase
const fetchRace = async () => {
  try {
    // Fetch race basic data
    const { data: raceData, error: raceError } = await $supabase
      .from('races')
      .select('*')
      .eq('id', route.params.id)
      .single()

    if (raceError) throw raceError

    race.value = raceData

    // Fetch related data with racer names
    const { data: qualifiersData } = await $supabase
      .from('qualifiers')
      .select(
        `
        *,
        racers(name, racer_number)
      `
      )
      .eq('race_id', route.params.id)
      .order('time', { ascending: true })

    const { data: bracketsData } = await $supabase
      .from('brackets')
      .select(
        `
        *,
        track1_racer:racers!track1_racer_id(name, racer_number),
        track2_racer:racers!track2_racer_id(name, racer_number)
      `
      )
      .eq('race_id', route.params.id)

    const { data: checkinsData } = await $supabase
      .from('checkins')
      .select(
        `
        *,
        racers(name, racer_number, image_url)
      `
      )
      .eq('race_id', route.params.id)
      .order('time', { ascending: false })

    // Transform data with proper racer names
    qualifiers.value = (qualifiersData || []).map((q) => ({
      ...q,
      racer_name: q.racers?.name || `Racer #${q.racers?.racer_number || 'Unknown'}`,
      racer_number: q.racers?.racer_number
    }))

    brackets.value = (bracketsData || []).map((b) => ({
      ...b,
      track1_racer_name:
        b.track1_racer?.name || (b.track1_racer ? `Racer #${b.track1_racer.racer_number}` : 'TBD'),
      track2_racer_name:
        b.track2_racer?.name || (b.track2_racer ? `Racer #${b.track2_racer.racer_number}` : 'TBD')
    }))

    checkins.value = (checkinsData || []).map((c) => ({
      ...c,
      racer_name: c.racers?.name || `Racer #${c.racers?.racer_number || 'Unknown'}`,
      racer_number: c.racers?.racer_number,
      racer_image_url: c.racers?.image_url
    }))
  } catch (err) {
    console.error('Error fetching race:', err)
    error.value = err
  } finally {
    pending.value = false
  }
}

// Computed properties
const fastestTime = computed(() => {
  if (!qualifiers.value || qualifiers.value.length === 0) return null

  const times = qualifiers.value.map((q) => Number.parseFloat(q.time))
  const best = Math.min(...times)
  return formatTime(best)
})

const winners = computed(() => {
  // Get all completed brackets by type
  const completedBrackets = brackets.value.filter(
    (b) => b.track1_time && b.track2_time && b.track1_time !== b.track2_time
  )

  // Group by bracket type and find the most recent round for each type
  const bracketsByType = { Fastest: [], Slowest: [] }
  completedBrackets.forEach((bracket) => {
    if (bracket.bracket_type) {
      bracketsByType[bracket.bracket_type].push(bracket)
    }
  })

  const currentRoundWinners = []

  // For each bracket type, find the current round winners
  Object.keys(bracketsByType).forEach((bracketType) => {
    const typeBrackets = bracketsByType[bracketType]
    if (typeBrackets.length === 0) return

    // Sort brackets by creation time to identify rounds
    const sortedBrackets = typeBrackets.sort(
      (a, b) => new Date(a.created_at) - new Date(b.created_at)
    )

    // Find brackets that don't have their racers as winners in later brackets
    const activeWinners = []

    sortedBrackets.forEach((bracket) => {
      const isTrack1Winner =
        bracket.bracket_type === 'Fastest'
          ? bracket.track1_time < bracket.track2_time
          : bracket.track1_time > bracket.track2_time

      const winnerId = isTrack1Winner ? bracket.track1_racer_id : bracket.track2_racer_id
      const winnerName = isTrack1Winner ? bracket.track1_racer_name : bracket.track2_racer_name
      const winnerNumber = isTrack1Winner
        ? bracket.track1_racer_number
        : bracket.track2_racer_number
      const winningTime = isTrack1Winner ? bracket.track1_time : bracket.track2_time

      // Check if this winner appears in any later bracket (meaning they advanced)
      const appearsInLaterBracket = sortedBrackets.some((laterBracket) => {
        return (
          new Date(laterBracket.created_at) > new Date(bracket.created_at) &&
          (laterBracket.track1_racer_id === winnerId || laterBracket.track2_racer_id === winnerId)
        )
      })

      // If winner doesn't appear in later brackets, they're a current round winner
      if (!appearsInLaterBracket) {
        activeWinners.push({
          racer_id: winnerId,
          racer_name: winnerName,
          racer_number: winnerNumber,
          winning_time: winningTime,
          bracket_id: bracket.id,
          bracket_type: bracketType
        })
      }
    })

    currentRoundWinners.push(...activeWinners)
  })

  return currentRoundWinners.sort((a, b) => a.winning_time - b.winning_time)
})

const completedBracketsByType = computed(() => {
  const byType = { Fastest: 0, Slowest: 0 }
  brackets.value.forEach((b) => {
    if (b.track1_time && b.track2_time && b.bracket_type) {
      byType[b.bracket_type]++
    }
  })
  return byType
})

const totalBracketsByType = computed(() => {
  const byType = { Fastest: 0, Slowest: 0 }
  brackets.value.forEach((b) => {
    if (b.bracket_type) {
      byType[b.bracket_type]++
    }
  })
  return byType
})

const tournamentResults = computed(() => {
  const results = { Fastest: null, Slowest: null }

  // Check each bracket type for tournament completion
  for (const bracketType of ['Fastest', 'Slowest']) {
    const typeBrackets = brackets.value.filter((b) => b.bracket_type === bracketType)
    const typeCompleted = completedBracketsByType.value[bracketType]
    const typeTotal = totalBracketsByType.value[bracketType]
    const typeWinners = winners.value.filter((w) => w.bracket_type === bracketType)

    if (
      typeBrackets.length > 0 &&
      typeCompleted === typeTotal &&
      typeWinners.length === 1 &&
      typeTotal >= 1
    ) {
      const champion = typeWinners[0]
      const placings = getTournamentPlacings(bracketType)

      results[bracketType] = {
        first: {
          ...champion,
          bracket_type: bracketType,
          racer_name: champion.racer_name,
          racer_number: champion.racer_number,
          winning_time: champion.winning_time
        },
        second: placings.second,
        third: placings.third
      }
    }
  }

  return results
})

// Race timeline events
const raceEvents = computed(() => {
  const events = []

  // First check-in
  if (checkins.value.length > 0) {
    const firstCheckin = checkins.value[checkins.value.length - 1] // Last in array (earliest time)
    events.push({
      type: 'checkin',
      icon: 'pi pi-user-plus',
      title: 'Check-ins Started',
      description: `${checkins.value.length} racers checked in`,
      date: firstCheckin.time
    })
  }

  // First qualifying time
  if (qualifiers.value.length > 0) {
    const firstQualifier = qualifiers.value.reduce((earliest, q) =>
      new Date(q.created_at) < new Date(earliest.created_at) ? q : earliest
    )
    events.push({
      type: 'qualifying',
      icon: 'pi pi-clock',
      title: 'Qualifying Started',
      description: `${qualifiers.value.length} qualifying runs completed`,
      date: firstQualifier.created_at
    })
  }

  // First bracket race
  if (brackets.value.length > 0) {
    const firstBracket = brackets.value.reduce((earliest, b) =>
      new Date(b.created_at) < new Date(earliest.created_at) ? b : earliest
    )
    events.push({
      type: 'brackets',
      icon: 'pi pi-sitemap',
      title: 'Brackets Generated',
      description: `${brackets.value.length} bracket races created`,
      date: firstBracket.created_at
    })
  }

  // Tournament completion
  const completedTournaments = Object.values(tournamentResults.value).filter(
    (result) => result !== null
  )
  if (completedTournaments.length > 0) {
    events.push({
      type: 'completed',
      icon: 'pi pi-trophy',
      title: 'Tournament Complete',
      description: `${completedTournaments.length} tournament(s) finished`,
      date: new Date().toISOString() // Use current time as completion time
    })
  }

  // Sort events by date
  return events.sort((a, b) => new Date(a.date) - new Date(b.date))
})


// Race process steps
const raceSteps = computed(() => [
  {
    label: 'Design & Build',
    icon: 'pi pi-wrench'
  },
  {
    label: 'Check-in',
    icon: 'pi pi-user-plus'
  },
  {
    label: 'Qualifying',
    icon: 'pi pi-clock'
  },
  {
    label: 'Brackets',
    icon: 'pi pi-sitemap'
  },
  {
    label: 'Complete',
    icon: 'pi pi-trophy'
  }
])

const currentStep = computed(() => {
  if (!race.value) return 0

  // Tournament complete
  const completedTournaments = Object.values(tournamentResults.value).filter(
    (result) => result !== null
  )
  if (completedTournaments.length > 0) return 4

  // Brackets phase - if any brackets exist
  if (brackets.value.length > 0) return 3

  // Qualifying phase - if any qualifying times exist
  if (qualifiers.value.length > 0) return 2

  // Check-in phase - if any racers are checked in
  if (checkins.value.length > 0) return 1

  // Design & Build phase - race exists but no activity yet
  return 0
})

const getTournamentPlacings = (bracketType) => {
  const typeBrackets = brackets.value
    .filter((b) => b.bracket_type === bracketType && b.track1_time && b.track2_time)
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))

  if (typeBrackets.length === 0) return { second: null, third: null }

  const finalBracket = typeBrackets[0]

  const isTrack1Winner =
    bracketType === 'Fastest'
      ? finalBracket.track1_time < finalBracket.track2_time
      : finalBracket.track1_time > finalBracket.track2_time

  const secondPlace = {
    racer_id: isTrack1Winner ? finalBracket.track2_racer_id : finalBracket.track1_racer_id,
    racer_name: isTrack1Winner ? finalBracket.track2_racer_name : finalBracket.track1_racer_name,
    racer_number: isTrack1Winner
      ? finalBracket.track2_racer_number
      : finalBracket.track1_racer_number,
    time: isTrack1Winner ? finalBracket.track2_time : finalBracket.track1_time
  }

  let thirdPlace = null

  if (typeBrackets.length >= 2) {
    const semiFinalBrackets = typeBrackets.filter((bracket) => {
      return (
        (bracket.track1_racer_id === finalBracket.track1_racer_id ||
          bracket.track1_racer_id === finalBracket.track2_racer_id ||
          bracket.track2_racer_id === finalBracket.track1_racer_id ||
          bracket.track2_racer_id === finalBracket.track2_racer_id) &&
        bracket.id !== finalBracket.id
      )
    })

    const semiFinalLosers = []
    semiFinalBrackets.forEach((bracket) => {
      const isTrack1WinnerSemi =
        bracketType === 'Fastest'
          ? bracket.track1_time < bracket.track2_time
          : bracket.track1_time > bracket.track2_time

      const loserId = isTrack1WinnerSemi ? bracket.track2_racer_id : bracket.track1_racer_id

      if (loserId !== secondPlace.racer_id) {
        semiFinalLosers.push({
          racer_id: loserId,
          racer_name: isTrack1WinnerSemi ? bracket.track2_racer_name : bracket.track1_racer_name,
          racer_number: isTrack1WinnerSemi
            ? bracket.track2_racer_number
            : bracket.track1_racer_number,
          time: isTrack1WinnerSemi ? bracket.track2_time : bracket.track1_time
        })
      }
    })

    if (semiFinalLosers.length > 0) {
      thirdPlace =
        bracketType === 'Fastest'
          ? semiFinalLosers.reduce((best, current) => (current.time < best.time ? current : best))
          : semiFinalLosers.reduce((best, current) => (current.time > best.time ? current : best))
    }
  }

  return { second: secondPlace, third: thirdPlace }
}

// Photo management computed properties
const recentRacePhotos = computed(() => {
  // Get photos from racers checked into this race
  const raceRacerIds = checkins.value.map((c) => c.racer_id)

  return racePhotos.value
    .filter((photo) => photo.raceId === race.value?.id || raceRacerIds.includes(photo.racerId))
    .sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt))
})

const racerPhotosCount = computed(() => {
  return recentRacePhotos.value.filter((photo) => photo.type === 'racer').length
})

const generalPhotosCount = computed(() => {
  return recentRacePhotos.value.filter((photo) => photo.type === 'general').length
})

const featuredPhotosCount = computed(() => {
  return recentRacePhotos.value.filter((photo) => photo.featured).length
})

const pendingRacePhotos = computed(() => {
  return recentRacePhotos.value.filter((photo) => !photo.status || photo.status === 'pending')
    .length
})

const racePhotosCount = computed(() => {
  return recentRacePhotos.value.length
})

// Helper functions
const formatTime = (time) => {
  if (!time) return 'N/A'
  return `${Number.parseFloat(time).toFixed(3)}s`
}

const formatEventTime = (dateString) => {
  if (!dateString) return 'Unknown time'
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  })
}

const getWinner = (bracket) => {
  if (!bracket.track1_time || !bracket.track2_time) return 'TBD'

  // Handle ties
  if (bracket.track1_time === bracket.track2_time) {
    return `TIE: ${bracket.track1_racer_name} & ${bracket.track2_racer_name}`
  }

  if (bracket.bracket_type === 'Fastest') {
    return bracket.track1_time < bracket.track2_time
      ? bracket.track1_racer_name
      : bracket.track2_racer_name
  } else {
    return bracket.track1_time > bracket.track2_time
      ? bracket.track1_racer_name
      : bracket.track2_racer_name
  }
}

// Photo management functions
const getPhotoStatusSeverity = (status) => {
  switch (status) {
    case 'approved':
      return 'success'
    case 'rejected':
      return 'danger'
    case 'pending':
    default:
      return 'warning'
  }
}

const fetchRacePhotos = async () => {
  if (!authStore.isRaceAdmin) return

  loadingPhotos.value = true

  try {
    // Get photos from racers who are checked into this race
    const raceRacerIds = checkins.value.map((c) => c.racer_id)

    if (raceRacerIds.length > 0) {
      const { data: racersData, error: racersError } = await $supabase
        .from('racers')
        .select(
          `
          id,
          name,
          racer_number,
          photos,
          races!inner(name)
        `
        )
        .in('id', raceRacerIds)
        .not('photos', 'is', null)

      if (racersError) throw racersError

      const photos = []

      // Process racer photos
      for (const racer of racersData || []) {
        if (racer.photos && Array.isArray(racer.photos)) {
          for (const photo of racer.photos) {
            photos.push({
              id: `racer-${racer.id}-${photo.url}`,
              url: photo.url,
              status: 'approved', // Racer photos are auto-approved
              featured: photo.featured || false,
              racerId: racer.id,
              racerName: racer.name,
              racerNumber: racer.racer_number,
              raceName: racer.races?.name,
              raceId: race.value?.id,
              uploadedAt: photo.uploadedAt || new Date().toISOString(),
              type: 'racer'
            })
          }
        }
      }

      racePhotos.value = photos
    }

    // General race photos are handled through the general_photos table
  } catch (error) {
    console.error('Error fetching race photos:', error)
  } finally {
    loadingPhotos.value = false
  }
}

const refreshRacePhotos = async () => {
  await fetchRacePhotos()
}

const viewPhotoInGallery = (photo) => {
  // Open photo in preview
  if (photo.racerId) {
    navigateTo(`/racers/${photo.racerId}`)
  }
}

// Initialize auth and fetch data
onMounted(async () => {
  await authStore.initAuth()
  await fetchRace()
  if (authStore.isRaceAdmin) {
    await fetchRacePhotos()
  }
})

useHead({
  title: computed(() =>
    race.value ? `${race.value.name} - The Great Holyoke Brick Race` : 'Race - The Great Holyoke Brick Race'
  )
})
</script>

<style scoped>
/* DataTable styling fixes */
:deep(.custom-datatable .p-datatable-thead > tr > th) {
  background-color: #f9fafb !important;
  color: #374151 !important;
  font-weight: 600 !important;
  border-bottom: 2px solid #e5e7eb !important;
  padding: 12px !important;
}

:deep(.custom-datatable .p-datatable-tbody > tr > td) {
  padding: 12px !important;
  border-bottom: 1px solid #f3f4f6 !important;
}

:deep(.custom-datatable .p-datatable-tbody > tr:hover) {
  background-color: #f8fafc !important;
}

:deep(.custom-datatable .p-datatable-striped .p-datatable-tbody > tr:nth-child(odd)) {
  background-color: #ffffff !important;
}

:deep(.custom-datatable .p-datatable-striped .p-datatable-tbody > tr:nth-child(even)) {
  background-color: #f9fafb !important;
}

/* Dark mode DataTable styling */
:deep(.dark .custom-datatable .p-datatable-thead > tr > th) {
  background-color: #1f2937 !important;
  color: #f9fafb !important;
  border-bottom: 2px solid #374151 !important;
}

:deep(.dark .custom-datatable .p-datatable-tbody > tr > td) {
  border-bottom: 1px solid #374151 !important;
}

:deep(.dark .custom-datatable .p-datatable-tbody > tr:hover) {
  background-color: #374151 !important;
}

:deep(.dark .custom-datatable .p-datatable-striped .p-datatable-tbody > tr:nth-child(odd)) {
  background-color: #1f2937 !important;
}

:deep(.dark .custom-datatable .p-datatable-striped .p-datatable-tbody > tr:nth-child(even)) {
  background-color: #111827 !important;
}
</style>
