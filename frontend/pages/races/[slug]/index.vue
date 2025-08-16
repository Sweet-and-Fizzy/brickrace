<template>
  <div class="min-h-screen bg-white dark:bg-gray-900">
    <div class="container mx-auto px-4 py-8">
      <!-- Breadcrumb Navigation -->
      <BreadcrumbWrapper :items="breadcrumbItems" />

      <!-- Loading State -->
      <div v-if="isLoading">
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
            <div class="mb-8">
              <Skeleton width="100%" height="16rem" class="md:h-96 rounded-lg" />
            </div>

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
          ID requested: {{ route.params.slug || route.params.id }}
        </p>
        <div class="space-x-4">
          <NuxtLink to="/races">
            <Button class="btn-primary">
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
            <div class="mb-2">
              <h1 class="text-3xl font-bold text-gray-900 dark:text-white">{{ race.name }}</h1>
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

          <!-- Admin Controls -->
          <AdminMenu
            v-if="authStore.isRaceAdmin"
            :race-id="race.slug || race.id"
            class="mt-4 md:mt-0"
          />
        </div>

        <!-- Race Image -->
        <div v-if="race.image_url" class="mb-8">
          <img
            :src="race.image_url"
            :alt="race.name"
            class="w-full h-64 md:h-96 object-cover rounded-lg"
          />
        </div>

        <!-- Race Process Steps -->
        <Card class="mb-8">
          <template #content>
            <!-- Desktop: Horizontal Steps -->
            <div class="hidden md:block px-2">
              <Steps :model="raceSteps" :active-step="currentStep" class="mb-4" />
              <div class="text-center mt-4">
                <p class="text-sm text-gray-600 dark:text-gray-400">
                  Current Status:
                  <span class="font-semibold">{{
                    raceSteps[currentStep]?.label || 'Unknown'
                  }}</span>
                </p>
              </div>
            </div>

            <!-- Mobile: Vertical Timeline -->
            <div class="block md:hidden">
              <!-- Current Step Highlight -->
              <div class="bg-white border-2 border-brand-blue rounded-lg p-4 mb-4">
                <div class="flex items-center gap-3">
                  <div
                    class="w-10 h-10 bg-brand-blue text-white rounded-full flex items-center justify-center"
                  >
                    <i :class="raceSteps[currentStep]?.icon" />
                  </div>
                  <div>
                    <p class="font-semibold text-gray-900 dark:text-white">Current Step</p>
                    <p class="text-sm text-gray-600 dark:text-gray-300">
                      {{ raceSteps[currentStep]?.label }}
                    </p>
                  </div>
                </div>
              </div>

              <!-- Progress Bar -->
              <div class="mb-4">
                <div class="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-2">
                  <span>Progress</span>
                  <span>{{ Math.round(((currentStep + 1) / raceSteps.length) * 100) }}%</span>
                </div>
                <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    class="bg-brand-blue h-2 rounded-full transition-all duration-300"
                    :style="{ width: `${((currentStep + 1) / raceSteps.length) * 100}%` }"
                  />
                </div>
              </div>

              <!-- Compact Steps List -->
              <div class="space-y-2">
                <div
                  v-for="(step, index) in raceSteps"
                  :key="index"
                  class="flex items-center gap-3 p-2 rounded-lg transition-colors"
                  :class="{
                    'bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-200':
                      index < currentStep,
                    'bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-200':
                      index === currentStep,
                    'text-gray-500 dark:text-gray-400': index > currentStep
                  }"
                >
                  <div
                    class="w-6 h-6 rounded-full flex items-center justify-center text-xs"
                    :class="{
                      'bg-green-600 text-white': index < currentStep,
                      'bg-blue-600 text-white': index === currentStep,
                      'bg-gray-300 dark:bg-gray-600 text-gray-600 dark:text-gray-300':
                        index > currentStep
                    }"
                  >
                    <i v-if="index < currentStep" class="pi pi-check" />
                    <i v-else :class="step.icon" />
                  </div>
                  <span class="text-sm font-medium">{{ step.label }}</span>
                </div>
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
                            class="text-sm font-bold text-gray-800 dark:text-gray-200 hover:text-brand-blue hover:underline transition-colors duration-200 block truncate"
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
                            class="text-lg font-bold text-gray-900 dark:text-gray-100 hover:text-brand-blue hover:underline transition-colors duration-200 block truncate"
                          >
                            {{ result.first.racer_name }}
                          </NuxtLink>
                          <div
                            class="bg-yellow-200 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 px-2 py-0.5 rounded-full text-sm font-bold mb-1"
                          >
                            #{{ result.first.racer_number }}
                          </div>
                          <div class="text-sm font-bold text-brand-blue">
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
                            class="text-sm font-bold text-gray-800 dark:text-gray-200 hover:text-brand-blue hover:underline transition-colors duration-200 block truncate"
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
            <Card v-if="race && getBracketsForRace(race.id).length">
              <template #title>
                <h2 class="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <i class="pi pi-sitemap text-purple-600" />
                  Tournament Brackets
                </h2>
              </template>
              <template #content>
                <div class="space-y-6">
                  <div
                    v-for="(bracket, index) in getBracketsForRace(race.id)"
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
                    </div>

                    <div class="flex items-center gap-4">
                      <!-- Track 1 -->
                      <div
                        class="flex-1 bg-white dark:bg-gray-800 rounded-lg p-4 border-2 border-blue-200 dark:border-blue-600"
                      >
                        <div class="text-center">
                          <p class="text-sm font-medium text-brand-blue mb-2">Track 1</p>
                          <div v-if="bracket.track1_racer_name">
                            <NuxtLink
                              :to="`/racers/${bracket.track1_racer_id}`"
                              class="font-bold text-lg text-gray-900 dark:text-white hover:text-brand-blue hover:underline transition-colors duration-200 block"
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
                              <p class="text-lg font-bold text-brand-blue">
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
                              class="font-bold text-lg text-gray-900 dark:text-white hover:text-brand-blue hover:underline transition-colors duration-200 block"
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

            <!-- Dynamic Heat Display (Shows during active qualifying) -->
            <div v-if="(currentHeatData || hasValidUpcomingHeats) && race.active" class="mb-8">
              <!-- Current Heat Hero Section -->
              <Card v-if="currentHeatData" class="border-4 border-brand-blue shadow-xl mb-4">
                <template #content>
                  <div
                    class="bg-gradient-to-r from-brand-blue/10 to-brand-green/10 -m-6 p-6 rounded-t-lg"
                  >
                    <div class="flex items-center justify-between mb-4">
                      <div class="flex items-center gap-3">
                        <div class="bg-brand-blue text-white rounded-full p-3 animate-pulse">
                          <i class="pi pi-flag-fill text-2xl" />
                        </div>
                        <div>
                          <h2 class="text-2xl font-bold text-gray-900 dark:text-white">
                            Heat {{ currentHeatData.heat_number }} - NOW RACING
                          </h2>
                          <p class="text-sm text-gray-600 dark:text-gray-400">
                            Qualifying Round • Live Timing
                          </p>
                        </div>
                      </div>
                      <div class="flex items-center gap-2">
                        <span
                          class="bg-red-500 text-white px-3 py-1 rounded-full text-sm font-bold animate-pulse"
                        >
                          LIVE
                        </span>
                      </div>
                    </div>

                    <!-- Current Heat Racers -->
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                      <!-- Track 1 -->
                      <div
                        class="bg-white dark:bg-gray-800 rounded-lg p-4 border-2 border-brand-blue"
                      >
                        <div class="flex items-center justify-between mb-3">
                          <span class="text-sm font-bold text-brand-blue">TRACK 1</span>
                        </div>
                        <div
                          v-if="getTrackRacer(currentHeatData.racers, 1)"
                          class="flex items-center gap-3"
                        >
                          <img
                            v-if="getTrackRacer(currentHeatData.racers, 1).racer_image_url"
                            :src="getTrackRacer(currentHeatData.racers, 1).racer_image_url"
                            :alt="getTrackRacer(currentHeatData.racers, 1).racer_name"
                            class="w-16 h-16 object-cover rounded-lg border-2 border-gray-200"
                          />
                          <div
                            v-else
                            class="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center"
                          >
                            <i class="pi pi-car text-2xl text-gray-400" />
                          </div>
                          <div class="flex-1">
                            <NuxtLink
                              :to="`/racers/${getTrackRacer(currentHeatData.racers, 1).racer_id}`"
                              class="font-bold text-lg text-gray-900 dark:text-white hover:text-brand-blue hover:underline transition-colors duration-200"
                            >
                              {{ getTrackRacer(currentHeatData.racers, 1).racer_name }}
                            </NuxtLink>
                            <p class="text-sm text-gray-600 dark:text-gray-400">
                              #{{ getTrackRacer(currentHeatData.racers, 1).racer_number }}
                            </p>
                            <div v-if="getTrackRacer(currentHeatData.racers, 1).time" class="mt-2">
                              <span
                                class="bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 px-2 py-1 rounded text-sm font-bold"
                              >
                                {{ formatTime(getTrackRacer(currentHeatData.racers, 1).time) }}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div v-else class="text-gray-400 text-center py-4">
                          <i class="pi pi-clock text-2xl mb-2" />
                          <p>Awaiting Racer</p>
                        </div>
                      </div>

                      <!-- Track 2 -->
                      <div class="bg-white dark:bg-gray-800 rounded-lg p-4 border-2 border-red-500">
                        <div class="flex items-center justify-between mb-3">
                          <span class="text-sm font-bold text-red-500">TRACK 2</span>
                        </div>
                        <div
                          v-if="getTrackRacer(currentHeatData.racers, 2)"
                          class="flex items-center gap-3"
                        >
                          <img
                            v-if="getTrackRacer(currentHeatData.racers, 2).racer_image_url"
                            :src="getTrackRacer(currentHeatData.racers, 2).racer_image_url"
                            :alt="getTrackRacer(currentHeatData.racers, 2).racer_name"
                            class="w-16 h-16 object-cover rounded-lg border-2 border-gray-200"
                          />
                          <div
                            v-else
                            class="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center"
                          >
                            <i class="pi pi-car text-2xl text-gray-400" />
                          </div>
                          <div class="flex-1">
                            <NuxtLink
                              :to="`/racers/${getTrackRacer(currentHeatData.racers, 2).racer_id}`"
                              class="font-bold text-lg text-gray-900 dark:text-white hover:text-brand-blue hover:underline transition-colors duration-200"
                            >
                              {{ getTrackRacer(currentHeatData.racers, 2).racer_name }}
                            </NuxtLink>
                            <p class="text-sm text-gray-600 dark:text-gray-400">
                              #{{ getTrackRacer(currentHeatData.racers, 2).racer_number }}
                            </p>
                            <div v-if="getTrackRacer(currentHeatData.racers, 2).time" class="mt-2">
                              <span
                                class="bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 px-2 py-1 rounded text-sm font-bold"
                              >
                                {{ formatTime(getTrackRacer(currentHeatData.racers, 2).time) }}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div v-else class="text-gray-400 text-center py-4">
                          <i class="pi pi-clock text-2xl mb-2" />
                          <p>Awaiting Racer</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </template>
              </Card>

              <!-- Upcoming Heats -->
              <div v-if="hasValidUpcomingHeats" class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card
                  v-for="heat in upcomingHeatsData.slice(0, 2)"
                  :key="heat.heat_number"
                  class="border-2 border-gray-300 dark:border-gray-600"
                >
                  <template #content>
                    <div class="flex items-center justify-between mb-4">
                      <h3 class="font-bold text-lg text-gray-900 dark:text-white">
                        Heat {{ heat.heat_number }}
                      </h3>
                      <span
                        class="bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-3 py-1 rounded-full text-sm"
                      >
                        On Deck
                      </span>
                    </div>

                    <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <!-- Track 1 -->
                      <div
                        class="bg-white dark:bg-gray-800 rounded-lg p-3 border-2 border-gray-300 dark:border-gray-600"
                      >
                        <div class="flex items-center justify-between mb-3">
                          <span class="text-xs font-bold text-brand-blue">TRACK 1</span>
                        </div>
                        <div v-if="getTrackRacer(heat.racers, 1)" class="flex items-center gap-3">
                          <img
                            v-if="getTrackRacer(heat.racers, 1).racer_image_url"
                            :src="getTrackRacer(heat.racers, 1).racer_image_url"
                            :alt="getTrackRacer(heat.racers, 1).racer_name"
                            class="w-10 h-10 object-cover rounded-lg border-2 border-gray-200"
                          />
                          <div
                            v-else
                            class="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center"
                          >
                            <i class="pi pi-car text-gray-400" />
                          </div>
                          <div class="flex-1">
                            <NuxtLink
                              :to="`/racers/${getTrackRacer(heat.racers, 1).racer_id}`"
                              class="font-medium text-gray-900 dark:text-white hover:text-brand-blue hover:underline transition-colors duration-200"
                            >
                              {{ getTrackRacer(heat.racers, 1).racer_name }}
                            </NuxtLink>
                            <p class="text-xs text-gray-500 dark:text-gray-400">
                              #{{ getTrackRacer(heat.racers, 1).racer_number }}
                            </p>
                          </div>
                        </div>
                        <div v-else class="text-gray-400 text-center py-2">
                          <i class="pi pi-clock text-lg mb-1" />
                          <p class="text-sm">TBD</p>
                        </div>
                      </div>

                      <!-- Track 2 -->
                      <div
                        class="bg-white dark:bg-gray-800 rounded-lg p-3 border-2 border-gray-300 dark:border-gray-600"
                      >
                        <div class="flex items-center justify-between mb-3">
                          <span class="text-xs font-bold text-red-500">TRACK 2</span>
                        </div>
                        <div v-if="getTrackRacer(heat.racers, 2)" class="flex items-center gap-3">
                          <img
                            v-if="getTrackRacer(heat.racers, 2).racer_image_url"
                            :src="getTrackRacer(heat.racers, 2).racer_image_url"
                            :alt="getTrackRacer(heat.racers, 2).racer_name"
                            class="w-10 h-10 object-cover rounded-lg border-2 border-gray-200"
                          />
                          <div
                            v-else
                            class="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center"
                          >
                            <i class="pi pi-car text-gray-400" />
                          </div>
                          <div class="flex-1">
                            <NuxtLink
                              :to="`/racers/${getTrackRacer(heat.racers, 2).racer_id}`"
                              class="font-medium text-gray-900 dark:text-white hover:text-brand-blue hover:underline transition-colors duration-200"
                            >
                              {{ getTrackRacer(heat.racers, 2).racer_name }}
                            </NuxtLink>
                            <p class="text-xs text-gray-500 dark:text-gray-400">
                              #{{ getTrackRacer(heat.racers, 2).racer_number }}
                            </p>
                          </div>
                        </div>
                        <div v-else class="text-gray-400 text-center py-2">
                          <i class="pi pi-clock text-lg mb-1" />
                          <p class="text-sm">TBD</p>
                        </div>
                      </div>
                    </div>
                  </template>
                </Card>
              </div>
            </div>

            <!-- Qualifiers Results -->
            <Card v-if="completedQualifiers.length">
              <template #title>
                <h2 class="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <i class="pi pi-clock" />
                  Qualifying Times
                </h2>
              </template>
              <template #content>
                <!-- Sort Controls -->
                <div class="mb-4 flex items-center justify-between">
                  <div class="flex items-center gap-3">
                    <label class="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Sort by:
                    </label>
                    <Dropdown
                      v-model="qualifiersSortOption"
                      :options="sortOptions"
                      option-label="label"
                      option-value="value"
                      class="w-48"
                    />
                  </div>
                  <div class="text-sm text-gray-500 dark:text-gray-400">
                    {{ completedQualifiers.length }} qualifying runs
                  </div>
                </div>

                <DataTable
                  :value="sortedQualifiers"
                  striped-rows
                  responsive-layout="scroll"
                  class="custom-datatable"
                >
                  <Column field="racer_number" header="#" style="width: 60px">
                    <template #body="slotProps">
                      <span class="font-semibold text-brand-blue"
                        >#{{ slotProps.data.racer_number }}</span
                      >
                    </template>
                  </Column>
                  <Column field="racer_name" header="Racer">
                    <template #body="slotProps">
                      <div>
                        <NuxtLink
                          :to="`/racers/${slotProps.data.racer_id}`"
                          class="font-medium text-gray-900 dark:text-white hover:text-brand-blue hover:underline transition-colors duration-200"
                        >
                          {{ slotProps.data.racer_name }}
                        </NuxtLink>
                        <div class="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          Heat {{ slotProps.data.heat_number }} • Track
                          {{ slotProps.data.track_number }}
                        </div>
                      </div>
                    </template>
                  </Column>
                  <Column field="time" header="Time">
                    <template #body="slotProps">
                      <span class="font-bold text-lg text-brand-blue">{{
                        formatTime(slotProps.data.time)
                      }}</span>
                    </template>
                  </Column>
                  <Column field="created_at" header="Completed">
                    <template #body="slotProps">
                      <span
                        v-if="slotProps.data.created_at"
                        class="text-sm text-gray-600 dark:text-gray-300"
                      >
                        {{ new Date(slotProps.data.created_at).toLocaleTimeString() }}
                      </span>
                      <span v-else class="text-sm text-gray-400 italic"> Not completed </span>
                    </template>
                  </Column>
                </DataTable>
              </template>
            </Card>

            <!-- Awards Voting Section -->
            <Card v-if="voteableAwards.length && race?.active">
              <template #title>
                <h2 class="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <i class="pi pi-trophy text-yellow-500" />
                  Vote for Awards
                </h2>
              </template>
              <template #content>
                <div class="space-y-6">
                  <div
                    v-for="award in voteableAwards"
                    :key="award.id"
                    class="border rounded-lg p-4 bg-gray-50 dark:bg-gray-800"
                  >
                    <div class="flex items-start gap-4 mb-4">
                      <!-- Award Image -->
                      <div class="flex-shrink-0">
                        <Image
                          v-if="award.image_url"
                          :src="award.image_url"
                          :alt="award.name"
                          image-class="w-16 h-16 object-cover rounded-lg border-2 border-gray-200 dark:border-gray-600"
                          class="w-16 h-16"
                          preview
                        />
                        <div
                          v-else
                          class="w-16 h-16 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 flex items-center justify-center rounded-lg border-2 border-gray-200 dark:border-gray-600"
                        >
                          <i class="pi pi-trophy text-2xl text-red-500" />
                        </div>
                      </div>

                      <!-- Award Info -->
                      <div class="flex-1">
                        <div class="flex items-center justify-between mb-2">
                          <h3 class="font-bold text-gray-900 dark:text-white">{{ award.name }}</h3>
                          <NuxtLink
                            to="/awards"
                            class="text-brand-blue hover:text-blue-800 text-sm font-medium"
                          >
                            Vote Now →
                          </NuxtLink>
                        </div>
                        <p class="text-sm text-gray-600 dark:text-gray-300">
                          {{ award.description }}
                        </p>
                      </div>
                    </div>

                    <!-- Current Vote Leaders -->
                    <div v-if="awardLeaderboards[award.id]?.length > 0" class="mt-4">
                      <h4 class="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        Current Leaders:
                      </h4>
                      <div class="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        <div
                          v-for="(leader, index) in awardLeaderboards[award.id]?.slice(0, 3)"
                          :key="`${leader.racer_id}-${leader.award_definition_id}`"
                          class="flex items-center gap-2 p-2 bg-white dark:bg-gray-700 rounded border"
                        >
                          <div class="flex-shrink-0">
                            <span
                              class="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
                              :class="{
                                'bg-yellow-400 text-yellow-900': index === 0,
                                'bg-gray-400 text-gray-900': index === 1,
                                'bg-orange-400 text-orange-900': index === 2
                              }"
                            >
                              {{ index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉' }}
                            </span>
                          </div>
                          <div class="flex-1 min-w-0">
                            <NuxtLink
                              :to="`/racers/${leader.racer_id}`"
                              class="text-sm font-medium text-gray-900 dark:text-white hover:text-brand-blue hover:underline transition-colors duration-200 block truncate"
                            >
                              {{ leader.racer_name }}
                            </NuxtLink>
                            <p class="text-xs text-gray-500 dark:text-gray-400">
                              {{ leader.vote_count }} vote{{ leader.vote_count !== 1 ? 's' : '' }}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div v-else class="text-center text-gray-500 dark:text-gray-400 py-4">
                      <i class="pi pi-info-circle mb-2" />
                      <p class="text-sm">No votes yet - be the first to vote!</p>
                    </div>
                  </div>
                </div>
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
                      />
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

            <!-- Race Photo Gallery -->
            <Card v-if="racePhotos.length > 0">
              <template #title>
                <h2 class="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <i class="pi pi-images" />
                  Race Photos
                </h2>
              </template>
              <template #content>
                <div class="space-y-6">
                  <!-- Filter Controls -->
                  <div
                    class="flex items-center justify-between border-b border-gray-200 dark:border-gray-600 pb-4"
                  >
                    <span class="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {{ filteredRacePhotos.length }} photo{{
                        filteredRacePhotos.length !== 1 ? 's' : ''
                      }}
                    </span>
                    <Select
                      v-model="selectedPhotoRacer"
                      :options="racerFilterOptions"
                      option-label="name"
                      option-value="id"
                      placeholder="Filter by racer"
                      class="w-48"
                      show-clear
                      filter
                    />
                  </div>

                  <PhotoGallery
                    :photos="paginatedRacePhotos"
                    :title="''"
                    :show-empty-state="false"
                    :enable-featured-section="false"
                    :show-contribution-links="false"
                    :show-thumbnails="false"
                  />

                  <!-- Pagination -->
                  <div v-if="photoTotalPages > 1" class="flex justify-center">
                    <Paginator
                      v-model:first="currentPhotoPage"
                      v-model:rows="photosPerPage"
                      :total-records="filteredRacePhotos.length"
                      :rows-per-page-options="[6, 9, 12, 18]"
                      template="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink RowsPerPageDropdown"
                    />
                  </div>

                  <!-- See All Photos Link -->
                  <div class="text-center pt-4 border-t border-gray-200 dark:border-gray-600">
                    <NuxtLink
                      to="/gallery"
                      class="inline-flex items-center gap-2 text-brand-blue hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200 font-medium transition-colors"
                    >
                      <i class="pi pi-images" />
                      See all photos
                      <i class="pi pi-arrow-right" />
                    </NuxtLink>
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
                    <span class="font-semibold">{{
                      race && getBracketsForRace(race.id).length
                    }}</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-gray-600 dark:text-gray-300">Fastest Time</span>
                    <span class="font-semibold">{{ fastestTime || 'N/A' }}</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-gray-600 dark:text-gray-300">Slowest Time</span>
                    <span class="font-semibold">{{ slowestTime || 'N/A' }}</span>
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
  </div>
</template>

<script setup>
import { useAuthStore } from '~/stores/auth'
import { isUUID } from '~/utils/slug-helpers'

const route = useRoute()
const authStore = useAuthStore()

// Use reactive composables for all data

const { races, fetchRaceById, fetchRaceBySlug, initialize: initializeRaces } = useRaces()

// Race data - needs to be defined before other composables that depend on it
const race = ref(null)
const error = ref(null)

// Qualifiers composable - will be initialized after race loads
const qualifiersComposable = ref(null)
const qualifiers = computed(() => {
  if (!qualifiersComposable.value) return []
  // qualifiers is a ref from the composable, so access its value
  return unref(qualifiersComposable.value.qualifiers) || []
})
const formatTime = (time) => qualifiersComposable.value?.formatTime(time) || 'N/A'

const { getBracketsForRace, initialize: initializeBrackets } = useBrackets()

const { racers: checkinsRacers, getCheckinsForRace, initialize: initializeCheckins } = useCheckins()

const { voteableAwards, getAwardLeaderboard, initialize: initializeAwards } = useAwards()

// Photo management
const { getPhotosByRace, allPhotos, initialize: initializePhotos } = usePhotos()

// Heat management for current/upcoming heats
const {
  currentRace: currentRaceHeat,
  currentHeat,
  upcomingHeats,
  loading: heatsLoading,
  initialize: initializeHeats,
  fetchCurrentRaceData
} = useHeats()

// Local state
const selectedPhotoRacer = ref(null)
const currentPhotoPage = ref(0)
const photosPerPage = ref(9)

// Separate loading states for progressive loading
const raceDataLoading = ref(true)

// Qualifiers sorting
const qualifiersSortOption = ref('time-asc')
const sortOptions = [
  { label: 'Fastest Time', value: 'time-asc' },
  { label: 'Slowest Time', value: 'time-desc' },
  { label: 'Heat Order', value: 'heat' }
]
const isLoading = computed(() => raceDataLoading.value)

// Reactive checkins with racer data
const checkins = computed(() => {
  if (!race.value?.id) return []

  const raceCheckins = getCheckinsForRace(race.value.id)

  return raceCheckins
    .map((checkin) => {
      const racer = checkinsRacers.value.find((r) => r.id === checkin.racer_id)
      return {
        ...checkin,
        racer_name: racer?.name || `Racer #${racer?.racer_number || 'Unknown'}`,
        racer_number: racer?.racer_number,
        racer_image_url: racer?.image_url
      }
    })
    .sort((a, b) => new Date(b.time) - new Date(a.time))
})

// Breadcrumb navigation
const breadcrumbItems = computed(() => [
  { label: 'Home', url: '/' },
  { label: 'Races', url: '/races' },
  { label: race.value?.name || 'Race Details' } // Current page, no navigation
])

// Fetch race data from Supabase
// Get race data from singleton composable (already loaded)
const getRaceData = async () => {
  const param = route.params.slug || route.params.id

  try {
    // Check if it's a UUID (legacy support)
    if (isUUID(param)) {
      // First try to get from already loaded races
      race.value = races.value.find((r) => r.id === param) || null
      // If not found, fetch specifically
      if (!race.value) {
        race.value = await fetchRaceById(param)
      }
    } else {
      // It's a slug
      // First try to get from already loaded races
      race.value = races.value.find((r) => r.slug === param) || null
      // If not found, fetch specifically
      if (!race.value) {
        race.value = await fetchRaceBySlug(param)
      }
    }

    if (!race.value) {
      error.value = new Error('Race not found')
    } else {
      // Initialize qualifiers composable with the race ID
      qualifiersComposable.value = useQualifiers(race.value.id)
    }
  } catch (err) {
    console.error('Error fetching race data:', err)
    error.value = err
  }
}

// Computed properties
const completedQualifiers = computed(() => {
  if (!qualifiers.value) return []

  // Only show completed qualifying runs with valid times
  return qualifiers.value.filter(
    (q) => q.status === 'completed' && q.time && q.time > 0 && !isNaN(q.time)
  )
})

const sortedQualifiers = computed(() => {
  if (!completedQualifiers.value.length) return []

  const sorted = [...completedQualifiers.value]

  if (qualifiersSortOption.value === 'heat') {
    // Sort by heat number, then by track number
    return sorted.sort((a, b) => {
      if (a.heat_number !== b.heat_number) {
        return a.heat_number - b.heat_number
      }
      return a.track_number - b.track_number
    })
  } else if (qualifiersSortOption.value === 'time-desc') {
    // Sort by time (slowest first)
    return sorted.sort((a, b) => b.time - a.time)
  } else {
    // Sort by time (fastest first) - default
    return sorted.sort((a, b) => a.time - b.time)
  }
})

const fastestTime = computed(() => {
  if (!qualifiers.value || qualifiers.value.length === 0) return null

  // Filter out invalid times (0, null, NaN) and only include valid times
  const validTimes = qualifiers.value
    .map((q) => Number.parseFloat(q.time))
    .filter((time) => time > 0 && !isNaN(time))

  if (validTimes.length === 0) return null

  const best = Math.min(...validTimes)
  return formatTime(best)
})

const slowestTime = computed(() => {
  if (!qualifiers.value || qualifiers.value.length === 0) return null

  // Filter out invalid times (0, null, NaN) and only include valid times
  const validTimes = qualifiers.value
    .map((q) => Number.parseFloat(q.time))
    .filter((time) => time > 0 && !isNaN(time))

  if (validTimes.length === 0) return null

  const slowest = Math.max(...validTimes)
  return formatTime(slowest)
})

const winners = computed(() => {
  // Get all completed brackets for this race by type
  const raceBrackets = race.value ? getBracketsForRace(race.value.id) : []
  const completedBrackets = raceBrackets.filter(
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
  const raceBrackets = race.value ? getBracketsForRace(race.value.id) : []
  const byType = { Fastest: 0, Slowest: 0 }
  raceBrackets.forEach((b) => {
    if (b.track1_time && b.track2_time && b.bracket_type) {
      byType[b.bracket_type]++
    }
  })
  return byType
})

const totalBracketsByType = computed(() => {
  const raceBrackets = race.value ? getBracketsForRace(race.value.id) : []
  const byType = { Fastest: 0, Slowest: 0 }
  raceBrackets.forEach((b) => {
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
    const raceBrackets = race.value ? getBracketsForRace(race.value.id) : []
    const typeBrackets = raceBrackets.filter((b) => b.bracket_type === bracketType)
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
  const raceBrackets = race.value ? getBracketsForRace(race.value.id) : []
  if (raceBrackets.length > 0) {
    const firstBracket = raceBrackets.reduce((earliest, b) =>
      new Date(b.created_at) < new Date(earliest.created_at) ? b : earliest
    )
    events.push({
      type: 'brackets',
      icon: 'pi pi-sitemap',
      title: 'Brackets Generated',
      description: `${raceBrackets.length} bracket races created`,
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
    label: 'Results',
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
  const raceBrackets = race.value ? getBracketsForRace(race.value.id) : []
  if (raceBrackets.length > 0) return 3

  // Qualifying phase - if any qualifying times exist
  if (qualifiers.value.length > 0) return 2

  // Check-in phase - if any racers are checked in
  if (checkins.value.length > 0) return 1

  // Design & Build phase - race exists but no activity yet
  return 0
})

const getTournamentPlacings = (bracketType) => {
  const raceBrackets = race.value ? getBracketsForRace(race.value.id) : []
  const typeBrackets = raceBrackets
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
const racePhotos = computed(() => {
  if (!race.value?.id) return []

  // Get general photos for this race
  const generalPhotos = getPhotosByRace(race.value.id).filter(
    (photo) => photo.status === 'approved'
  )

  // Get racer photos from racers who are checked in for this race
  const checkedInRacerIds = checkins.value.map((checkin) => checkin.racer_id)
  const racerPhotos = allPhotos.value.filter(
    (photo) =>
      photo.type === 'racer' &&
      photo.status === 'approved' &&
      checkedInRacerIds.includes(photo.racerId)
  )

  // Combine both types of photos
  return [...generalPhotos, ...racerPhotos]
})

const racerFilterOptions = computed(() => {
  // Get unique racers from race photos
  const racers = new Map()
  racePhotos.value.forEach((photo) => {
    if (photo.type === 'racer' && photo.racerId && photo.racerName) {
      racers.set(photo.racerId, {
        id: photo.racerId,
        name: photo.racerName,
        number: photo.racerNumber
      })
    }
  })

  // Convert to array and sort by name
  return Array.from(racers.values()).sort((a, b) => a.name.localeCompare(b.name))
})

const filteredRacePhotos = computed(() => {
  let photos = racePhotos.value

  // Filter by selected racer
  if (selectedPhotoRacer.value) {
    // Handle both object and ID formats from AutoComplete
    const racerId =
      typeof selectedPhotoRacer.value === 'object'
        ? selectedPhotoRacer.value.id
        : selectedPhotoRacer.value

    photos = photos.filter((photo) => photo.type === 'racer' && photo.racerId === racerId)
  }

  return photos
})

const paginatedRacePhotos = computed(() => {
  const start = currentPhotoPage.value
  const end = start + photosPerPage.value
  return filteredRacePhotos.value.slice(start, end)
})

const photoTotalPages = computed(() =>
  Math.ceil(filteredRacePhotos.value.length / photosPerPage.value)
)

// Reactive award leaderboards for the current race
const awardLeaderboards = computed(() => {
  if (!race.value?.id || !voteableAwards.value.length) return {}

  const leaderboards = {}
  voteableAwards.value.forEach((award) => {
    leaderboards[award.id] = getAwardLeaderboard(award.id, race.value.id)
  })
  return leaderboards
})

// Current heat data for display
const currentHeatData = computed(() => {
  // Debug logging
  console.log('currentHeatData computed:', {
    raceActive: race.value?.active,
    raceId: race.value?.id,
    currentRaceHeatId: currentRaceHeat.value?.id,
    hasCurrentHeat: !!currentHeat.value,
    currentHeat: currentHeat.value
  })

  // Only show if this is the active race and there's a current heat
  if (!race.value?.active || !currentHeat.value || !currentRaceHeat.value) return null
  if (currentRaceHeat.value.id !== race.value.id) return null

  return currentHeat.value
})

// Upcoming heats data for display
const upcomingHeatsData = computed(() => {
  // Only show if this is the active race and there are upcoming heats
  if (!race.value?.active || !upcomingHeats.value.length || !currentRaceHeat.value) return []
  if (currentRaceHeat.value.id !== race.value.id) return []

  return upcomingHeats.value
})

// Check if upcoming heats have valid racer assignments
const hasValidUpcomingHeats = computed(() => {
  if (!upcomingHeatsData.value.length) return false

  // Check if any upcoming heat has valid heat_number and at least one racer assigned
  return upcomingHeatsData.value.some(
    (heat) =>
      heat.heat_number && // Must have a heat number (means heats were generated)
      heat.racers &&
      heat.racers.length > 0 &&
      heat.racers.some(
        (racer) =>
          racer &&
          racer.racer_name &&
          racer.racer_name !== 'TBD' &&
          racer.racer_id && // Must have actual racer ID
          racer.track_number // Must have track assignment
      )
  )
})

// Helper functions (formatTime is provided by useQualifiers composable)

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

// Helper function to find racer by track number
const getTrackRacer = (racers, trackNumber) => {
  if (!racers || !Array.isArray(racers)) return null
  return racers.find((racer) => racer.track_number === trackNumber) || null
}

// Helper function to get attempt count for a racer
const getRacerAttemptCount = (racerId) => {
  if (!qualifiers.value) return 0
  return qualifiers.value.filter((q) => q.racer_id === racerId).length
}

// Watch for filter changes to reset pagination
watch(selectedPhotoRacer, () => {
  currentPhotoPage.value = 0
})

// Initialize auth and fetch data
onMounted(async () => {
  await authStore.initAuth()

  // Check if data is already loaded (from previous navigation)
  if (races.value.length > 0) {
    await getRaceData()
  } else {
    // Initialize races first to get the race data
    await initializeRaces()
    await getRaceData()
  }

  // Initialize all other composables (only after race is loaded)
  if (race.value && qualifiersComposable.value) {
    await Promise.all([
      qualifiersComposable.value.initialize(),
      initializeBrackets(),
      initializeCheckins(),
      initializeAwards({ raceId: race.value.id }),
      initializePhotos(),
      initializeHeats()
    ])
  }

  // Race data is now available, hide main loading
  raceDataLoading.value = false
})

// Note: Removed cleanup calls to prevent composable reloading on navigation
// Composables will manage their own lifecycle and subscriptions

useHead({
  title: computed(() =>
    race.value
      ? `${race.value.name} - The Great Holyoke Brick Race`
      : 'Race - The Great Holyoke Brick Race'
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
