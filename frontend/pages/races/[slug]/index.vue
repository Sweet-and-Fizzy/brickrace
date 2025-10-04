<template>
  <div class="min-h-screen bg-white">
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
        <h2 class="text-2xl font-semibold text-gray-800 mb-2">Race Not Found</h2>
        <p class="text-gray-600 mb-2">
          The race you're looking for doesn't exist or has been removed.
        </p>
        <p class="text-sm text-gray-500 mb-6">Slug requested: {{ route.params.slug }}</p>
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
              <h1 class="text-3xl font-bold text-black">{{ race.name }}</h1>
            </div>
            <div class="flex flex-col gap-2 text-gray-600">
              <div class="flex items-center gap-4">
                <span
                  >{{
                    race.race_datetime && !isNaN(new Date(race.race_datetime))
                      ? new Date(race.race_datetime).toLocaleDateString('en-US', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        }) +
                        ' from ' +
                        new Date(race.race_datetime).toLocaleTimeString('en-US', {
                          hour: 'numeric',
                          minute: '2-digit',
                          hour12: true
                        })
                      : 'Date TBD'
                  }}{{
                    race.end_time && !isNaN(new Date(race.end_time))
                      ? ' - ' +
                        new Date(race.end_time).toLocaleTimeString('en-US', {
                          hour: 'numeric',
                          minute: '2-digit',
                          hour12: true
                        })
                      : ''
                  }}</span
                >
                <span
                  v-if="!race.active && authStore.isRaceAdmin"
                  class="text-amber-600 font-medium"
                >
                  <i class="pi pi-info-circle mr-1" />
                  Read-only view
                </span>
              </div>
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
          >
        </div>

        <!-- Race Process Steps -->
        <Card class="mb-8">
          <template #content>
            <!-- Desktop: Horizontal Steps -->
            <div class="hidden md:block px-2">
              <Steps :model="raceSteps" :active-step="currentStep" class="mb-4" />
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
                    <p class="font-semibold text-black">Current Step</p>
                    <p class="text-sm text-gray-600">
                      {{ raceSteps[currentStep]?.label }}
                    </p>
                  </div>
                </div>
              </div>

              <!-- Progress Bar -->
              <div class="mb-4">
                <div class="flex justify-between text-xs text-gray-500 mb-2">
                  <span>Progress</span>
                  <span>{{ Math.round(((currentStep + 1) / raceSteps.length) * 100) }}%</span>
                </div>
                <div class="w-full bg-gray-200 rounded-full h-2">
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
                    'bg-green-50/20 text-green-800': index < currentStep,
                    'bg-blue-50/20 text-blue-800': index === currentStep,
                    'text-gray-500': index > currentStep
                  }"
                >
                  <div
                    class="w-6 h-6 rounded-full flex items-center justify-center text-xs"
                    :class="{
                      'bg-green-600 text-white': index < currentStep,
                      'bg-blue-600 text-white': index === currentStep,
                      'bg-gray-300 text-gray-600': index > currentStep
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

        <!-- Live Tournament Bracket - Full Width -->
        <Card v-if="tournament && tournamentEmbedUrl" class="mb-8">
          <template #title>
            <h2 class="text-xl font-bold text-black flex items-center gap-2">
              <i class="pi pi-trophy text-yellow-500" />
              Tournament Bracket
            </h2>
          </template>
          <template #content>
            <div class="border-2 border-gray-300 rounded-lg overflow-hidden">
              <iframe
                :src="tournamentEmbedUrl"
                width="100%"
                height="600"
                frameborder="0"
                scrolling="auto"
                allowtransparency="true"
                class="w-full min-h-[600px]"
              />
            </div>
          </template>
        </Card>

        <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <!-- Main Content -->
          <div class="lg:col-span-2 space-y-6">
            <!-- Race Description - Show at top of left column before checkins start -->
            <div v-if="race.description && checkins.length === 0">
              <Card>
                <template #title>
                  <h2 class="text-xl font-semibold text-black">About This Race</h2>
                </template>
                <template #content>
                  <div class="prose prose-gray" v-html="race.description" />
                </template>
              </Card>
            </div>
            <!-- Tournament Results Podium -->
            <Card v-if="tournamentResults.double_elimination">
              <template #title>
                <h2 class="text-xl font-bold text-black flex items-center gap-3">
                  <i class="pi pi-crown text-yellow-500 text-xl" />
                  Tournament Results
                </h2>
              </template>
              <template #content>
                <div v-for="(result, bracketType) in tournamentResults" :key="bracketType">
                  <div v-if="result" class="mb-6 last:mb-0">
                    <h3 class="text-lg font-bold text-center mb-4 text-gray-800">
                      {{ formatBracketTypeName(bracketType) }} Tournament Podium
                    </h3>

                    <!-- Compact Podium Display -->
                    <div class="flex items-end justify-center gap-2 md:gap-4 mb-4">
                      <!-- 2nd Place -->
                      <div v-if="result.second" class="text-center flex-1 max-w-24 sm:max-w-32 md:max-w-40">
                        <div
                          class="bg-gradient-to-br from-gray-300 to-gray-400 border border-gray-500 rounded-lg p-2 shadow-md mb-1"
                        >
                          <div class="text-2xl mb-1">🥈</div>
                          <RacerLink
                            :racer-id="result.second.racer_id"
                            :racer-name="result.second.racer_name"
                            class="text-sm font-bold text-black hover:text-brand-blue hover:underline transition-colors duration-200 block truncate"
                          />
                          <div
                            class="bg-gray-500/20 text-gray-800 px-1 py-0.5 rounded text-xs font-semibold"
                          >
                            #{{ result.second.racer_number }}
                          </div>
                          <div class="text-xs text-gray-600 mt-1">
                            {{ formatTime(result.second.time) }}
                          </div>
                        </div>
                        <div
                          class="bg-black h-8 rounded-t text-xs flex items-center justify-center"
                        >
                          <span class="font-bold text-white">2nd</span>
                        </div>
                      </div>

                      <!-- 1st Place (Champion) -->
                      <div class="text-center flex-1 max-w-28 sm:max-w-36 md:max-w-44">
                        <div
                          class="bg-gradient-to-br from-yellow-300 to-yellow-500 border border-yellow-600 rounded-lg p-3 shadow-xl mb-1"
                        >
                          <div class="text-3xl mb-1">🏆</div>
                          <RacerLink
                            :racer-id="result.first.racer_id"
                            :racer-name="result.first.racer_name"
                            class="text-lg font-bold text-black hover:text-brand-blue hover:underline transition-colors duration-200 block truncate"
                          />
                          <div
                            class="bg-yellow-600/20 text-yellow-900 px-2 py-0.5 rounded-full text-sm font-bold mb-1"
                          >
                            #{{ result.first.racer_number }}
                          </div>
                          <div class="text-sm font-bold text-brand-blue">
                            {{ formatTime(result.first.winning_time) }}
                          </div>
                          <div class="mt-1">
                            <span
                              class="bg-gradient-to-r from-yellow-500 to-yellow-600 text-white px-2 py-0.5 rounded-full text-xs font-bold"
                            >
                              CHAMPION
                            </span>
                          </div>
                        </div>
                        <div
                          class="bg-black h-12 rounded-t text-sm flex items-center justify-center"
                        >
                          <span class="font-bold text-white">1st</span>
                        </div>
                      </div>

                      <!-- 3rd Place -->
                      <div v-if="result.third" class="text-center flex-1 max-w-24 sm:max-w-32 md:max-w-40">
                        <div
                          class="bg-gradient-to-br from-amber-600 to-orange-700 border border-amber-700 rounded-lg p-2 shadow-md mb-1"
                        >
                          <div class="text-2xl mb-1">🥉</div>
                          <RacerLink
                            :racer-id="result.third.racer_id"
                            :racer-name="result.third.racer_name"
                            class="text-sm font-bold text-white hover:text-yellow-200 hover:underline transition-colors duration-200 block truncate"
                          />
                          <div
                            class="bg-amber-800/30 text-amber-100 px-1 py-0.5 rounded text-xs font-semibold"
                          >
                            #{{ result.third.racer_number }}
                          </div>
                          <div class="text-xs text-amber-100 mt-1">
                            {{ formatTime(result.third.time) }}
                          </div>
                        </div>
                        <div
                          class="bg-black h-6 rounded-t text-xs flex items-center justify-center"
                        >
                          <span class="font-bold text-white">3rd</span>
                        </div>
                      </div>
                    </div>

                  </div>
                </div>
              </template>
            </Card>

            <!-- Dynamic Heat Display (Shows during active qualifying) -->
            <div v-if="(currentHeatData || hasValidUpcomingHeats) && race.active" class="mb-8">
              <!-- Current Heat Hero Section -->
              <Card
                v-if="currentHeatData"
                class="border-4 shadow-xl mb-4"
                :class="showCompletedHeatResults ? 'border-green-500' : 'border-brand-blue'"
              >
                <template #content>
                  <div
                    class="-m-6 p-6 rounded-t-lg"
                    :class="
                      showCompletedHeatResults
                        ? 'bg-gradient-to-r from-green-500/10 to-blue-500/10'
                        : 'bg-gradient-to-r from-brand-blue/10 to-brand-green/10'
                    "
                  >
                    <div class="flex items-center justify-between mb-4">
                      <div class="flex items-center gap-3">
                        <div
                          class="text-white rounded-full p-2 relative w-10 h-10 flex items-center justify-center"
                          :class="showCompletedHeatResults ? 'bg-green-500' : 'bg-brand-blue'"
                        >
                          <i
                            class="text-sm"
                            :class="
                              showCompletedHeatResults ? 'pi pi-check-circle' : 'pi pi-flag-fill'
                            "
                          />
                          <div
                            v-if="!showCompletedHeatResults"
                            class="absolute inset-0 bg-brand-blue rounded-full animate-ping opacity-75"
                          />
                        </div>
                        <div>
                          <h2 class="text-2xl font-bold text-black">
                            {{ currentHeatType?.displayName || formatHeatDisplayName(currentHeatData) }} -
                            {{ showCompletedHeatResults ? 'RESULTS' : 'NOW RACING' }}
                          </h2>
                          <p class="text-sm text-gray-600">
                            {{
                              showCompletedHeatResults
                                ? (currentHeatType?.type === 'bracket' ? 'Bracket Complete • Times Posted' : 'Qualifying Complete • Times Posted')
                                : (currentHeatType?.description || 'Qualifying Round • Live Timing')
                            }}
                          </p>
                        </div>
                      </div>
                      <div class="flex items-center gap-2">
                        <span
                          v-if="!showCompletedHeatResults"
                          class="px-3 py-1 rounded-full text-sm font-bold bg-red-500 text-white animate-pulse"
                        >
                          LIVE
                        </span>
                        <div v-if="showCompletedHeatResults" class="text-right">
                          <p class="text-xs text-gray-500">Next heat starting soon...</p>
                        </div>
                      </div>
                    </div>

                    <!-- Current Heat Racers -->
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                      <!-- Track 1 -->
                      <div class="bg-white rounded-lg p-4 border-2 border-brand-blue">
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
                            class="w-24 h-24 object-cover rounded-lg border-2 border-gray-200"
                          >
                          <div
                            v-else
                            class="w-24 h-24 bg-gray-200 rounded-lg flex items-center justify-center"
                          >
                            <i class="pi pi-car text-2xl text-gray-400" />
                          </div>
                          <div class="flex-1">
                            <RacerLink
                              :racer-id="getTrackRacer(currentHeatData.racers, 1).racer_id"
                              :racer-name="getTrackRacer(currentHeatData.racers, 1).racer_name"
                              class="font-bold text-lg text-black hover:text-brand-blue hover:underline transition-colors duration-200"
                            />
                            <div class="flex items-center gap-2">
                              <p class="text-sm text-gray-600">
                                #{{ getTrackRacer(currentHeatData.racers, 1).racer_number }}
                              </p>
                              <Badge
                                v-if="isRacerWithdrawn(getTrackRacer(currentHeatData.racers, 1).racer_id)"
                                value="WITHDRAWN"
                                severity="warning"
                                class="text-xs"
                              />
                            </div>
                            <div v-if="getTrackRacer(currentHeatData.racers, 1).time" class="mt-2">
                              <span
                                class="px-2 py-1 rounded font-bold"
                                :class="
                                  showCompletedHeatResults
                                    ? 'bg-blue-100/30 text-blue-800 text-lg'
                                    : 'bg-green-100/30 text-green-800 text-sm'
                                "
                              >
                                {{ formatTime(getTrackRacer(currentHeatData.racers, 1).time) }}
                              </span>
                              <div
                                v-if="showCompletedHeatResults"
                                class="text-xs text-gray-500 mt-1"
                              >
                                Final Time
                              </div>
                            </div>
                          </div>
                        </div>
                        <div v-else class="text-gray-400 text-center py-4">
                          <i class="pi pi-clock text-2xl mb-2" />
                          <p>Awaiting Racer</p>
                        </div>
                      </div>

                      <!-- Track 2 -->
                      <div class="bg-white rounded-lg p-4 border-2 border-red-500">
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
                            class="w-24 h-24 object-cover rounded-lg border-2 border-gray-200"
                          >
                          <div
                            v-else
                            class="w-24 h-24 bg-gray-200 rounded-lg flex items-center justify-center"
                          >
                            <i class="pi pi-car text-2xl text-gray-400" />
                          </div>
                          <div class="flex-1">
                            <RacerLink
                              :racer-id="getTrackRacer(currentHeatData.racers, 2).racer_id"
                              :racer-name="getTrackRacer(currentHeatData.racers, 2).racer_name"
                              class="font-bold text-lg text-black hover:text-brand-blue hover:underline transition-colors duration-200"
                            />
                            <div class="flex items-center gap-2">
                              <p class="text-sm text-gray-600">
                                #{{ getTrackRacer(currentHeatData.racers, 2).racer_number }}
                              </p>
                              <Badge
                                v-if="isRacerWithdrawn(getTrackRacer(currentHeatData.racers, 2).racer_id)"
                                value="WITHDRAWN"
                                severity="warning"
                                class="text-xs"
                              />
                            </div>
                            <div v-if="getTrackRacer(currentHeatData.racers, 2).time" class="mt-2">
                              <span
                                class="px-2 py-1 rounded font-bold"
                                :class="
                                  showCompletedHeatResults
                                    ? 'bg-red-100/30 text-red-800 text-lg'
                                    : 'bg-green-100/30 text-green-800 text-sm'
                                "
                              >
                                {{ formatTime(getTrackRacer(currentHeatData.racers, 2).time) }}
                              </span>
                              <div
                                v-if="showCompletedHeatResults"
                                class="text-xs text-gray-500 mt-1"
                              >
                                Final Time
                              </div>
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
                  class="border-2 border-gray-300"
                >
                  <template #content>
                    <div class="flex items-center justify-between mb-4 gap-3">
                      <div class="flex-1 min-w-0">
                        <h3 class="font-bold text-lg text-black">{{ formatHeatDisplayName(heat) }}</h3>
                        <div class="text-sm font-medium text-gray-600">Match {{ heat.match_number || heat.heat_number }}</div>
                      </div>
                      <span class="bg-gray-200 text-gray-700 px-3 py-1 rounded-full text-sm whitespace-nowrap flex-shrink-0">
                        On Deck
                      </span>
                    </div>

                    <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <!-- Track 1 -->
                      <div class="bg-white rounded-lg p-3 border-2 border-gray-300">
                        <div class="flex items-center justify-between mb-3">
                          <span class="text-xs font-bold text-brand-blue">TRACK 1</span>
                        </div>
                        <div v-if="getTrackRacer(heat.racers, 1)">
                          <RacerLink
                            :racer-id="getTrackRacer(heat.racers, 1).racer_id"
                            :racer-name="getTrackRacer(heat.racers, 1).racer_name"
                            class="font-medium text-black hover:text-brand-blue hover:underline transition-colors duration-200"
                          />
                          <p class="text-xs text-gray-500">
                            #{{ getTrackRacer(heat.racers, 1).racer_number }}
                          </p>
                        </div>
                        <div v-else class="text-gray-400 text-center py-2">
                          <i class="pi pi-clock text-lg mb-1" />
                          <p class="text-sm">TBD</p>
                        </div>
                      </div>

                      <!-- Track 2 -->
                      <div class="bg-white rounded-lg p-3 border-2 border-gray-300">
                        <div class="flex items-center justify-between mb-3">
                          <span class="text-xs font-bold text-red-500">TRACK 2</span>
                        </div>
                        <div v-if="getTrackRacer(heat.racers, 2)">
                          <RacerLink
                            :racer-id="getTrackRacer(heat.racers, 2).racer_id"
                            :racer-name="getTrackRacer(heat.racers, 2).racer_name"
                            class="font-medium text-black hover:text-brand-blue hover:underline transition-colors duration-200"
                          />
                          <p class="text-xs text-gray-500">
                            #{{ getTrackRacer(heat.racers, 2).racer_number }}
                          </p>
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
                <h2 class="text-xl font-bold text-black flex items-center gap-2">
                  <i class="pi pi-clock" />
                  Qualifying Times
                </h2>
              </template>
              <template #content>
                <!-- Sort Controls -->
                <div class="mb-4 flex items-center justify-between">
                  <div class="flex items-center gap-3">
                    <label class="text-sm font-medium text-gray-700"> Sort by: </label>
                    <Select
                      v-model="qualifiersSortOption"
                      :options="sortOptions"
                      option-label="label"
                      option-value="value"
                      class="w-48"
                    />
                  </div>
                  <div class="text-sm text-gray-500">
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
                        <RacerLink
                          :racer-id="slotProps.data.racer_id"
                          :racer-name="slotProps.data.racer_name"
                          class="font-medium text-black hover:text-brand-blue hover:underline transition-colors duration-200"
                        />
                        <div class="text-xs text-gray-500 mt-1">
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
                      <span v-if="slotProps.data.created_at" class="text-sm text-gray-600">
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
                <h2 class="text-xl font-bold text-black flex items-center gap-2">
                  <i class="pi pi-trophy text-yellow-500" />
                  Vote for Awards
                </h2>
              </template>
              <template #content>
                <div class="space-y-6">
                  <div
                    v-for="award in voteableAwards"
                    :key="award.id"
                    class="border rounded-lg p-4 bg-gray-50"
                  >
                    <div class="flex items-start gap-4 mb-4">
                      <!-- Award Image -->
                      <div class="flex-shrink-0">
                        <Image
                          v-if="award.image_url"
                          :src="award.image_url"
                          :alt="award.name"
                          image-class="w-16 h-16 object-cover rounded-lg border-2 border-gray-200"
                          class="w-16 h-16"
                          preview
                        />
                        <div
                          v-else
                          class="w-16 h-16 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center rounded-lg border-2 border-gray-200"
                        >
                          <i class="pi pi-trophy text-2xl text-red-500" />
                        </div>
                      </div>

                      <!-- Award Info -->
                      <div class="flex-1">
                        <div class="flex items-center justify-between mb-2">
                          <h3 class="font-bold text-black">{{ award.name }}</h3>
                          <NuxtLink
                            to="/awards"
                            class="text-brand-blue hover:text-blue-800 text-sm font-medium"
                          >
                            Vote Now →
                          </NuxtLink>
                        </div>
                        <p class="text-sm text-gray-600">
                          {{ award.description }}
                        </p>
                      </div>
                    </div>

                    <!-- Current Vote Leaders -->
                    <div v-if="awardLeaderboards[award.id]?.length > 0" class="mt-4">
                      <h4 class="text-sm font-semibold text-gray-700 mb-2">Current Leaders:</h4>
                      <div class="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        <div
                          v-for="(leader, index) in awardLeaderboards[award.id]?.slice(0, 3)"
                          :key="`${leader.racer_id}-${leader.award_definition_id}`"
                          class="flex items-center gap-2 p-2 bg-white rounded border"
                        >
                          <div class="flex-shrink-0">
                            <span
                              class="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
                              :class="{
                                'bg-black text-white': index === 0,
                                'bg-black text-white': index === 1,
                                'bg-black text-white': index === 2
                              }"
                            >
                              {{ index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉' }}
                            </span>
                          </div>
                          <div class="flex-1 min-w-0">
                            <RacerLink
                              :racer-id="leader.racer_id"
                              :racer-name="leader.racer_name"
                              class="text-sm font-medium text-black hover:text-brand-blue hover:underline transition-colors duration-200 block truncate"
                            />
                            <p class="text-xs text-gray-500">
                              {{ leader.vote_count }} vote{{ leader.vote_count !== 1 ? 's' : '' }}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div v-else class="text-center text-gray-500 py-4">
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
                <h2 class="text-xl font-bold text-black flex items-center gap-2">
                  <i class="pi pi-users" />
                  Checked In Racers ({{ checkins.length }})
                </h2>
              </template>
              <template #content>
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  <RacerLink
                    v-for="checkin in checkins"
                    :key="checkin.id"
                    :racer-id="checkin.racer_id"
                    :class="[
                      'flex items-center gap-3 p-3 rounded-lg transition-colors duration-200',
                      checkin.is_withdrawn 
                        ? 'bg-red-50/20 border border-red-200 hover:bg-red-100/30' 
                        : 'bg-green-50/20 border border-green-200 hover:bg-green-100/30'
                    ]"
                  >
                    <div class="relative">
                      <img
                        v-if="checkin.racer_image_url"
                        :src="checkin.racer_image_url"
                        :alt="checkin.racer_name"
                        :class="[
                          'w-12 h-12 object-cover rounded-full border-2',
                          checkin.is_withdrawn ? 'border-red-300 opacity-60' : 'border-green-300'
                        ]"
                      >
                      <div
                        v-else
                        :class="[
                          'w-12 h-12 bg-gray-200 rounded-full border-2 flex items-center justify-center',
                          checkin.is_withdrawn ? 'border-red-300 opacity-60' : 'border-green-300'
                        ]"
                      >
                        <i class="pi pi-car text-gray-500" />
                      </div>
                      <i
                        v-if="!checkin.is_withdrawn"
                        class="pi pi-check-circle text-green-600 text-sm absolute -bottom-1 -right-1 bg-white rounded-full w-5 h-5 flex items-center justify-center"
                      />
                      <i
                        v-else
                        class="pi pi-times-circle text-red-600 text-sm absolute -bottom-1 -right-1 bg-white rounded-full w-5 h-5 flex items-center justify-center"
                      />
                    </div>
                    <div class="flex-1">
                      <p
:class="[
                        'font-medium hover:text-indigo-600',
                        checkin.is_withdrawn ? 'text-gray-500 line-through' : 'text-black'
                      ]">
                        {{ checkin.racer_name }}
                      </p>
                      <p class="text-sm text-gray-600">
                        #{{ checkin.racer_number }} •
                        {{ new Date(checkin.time).toLocaleTimeString() }}
                      </p>
                      <p v-if="checkin.is_withdrawn" class="text-xs text-red-600 mt-1">
                        <i class="pi pi-exclamation-triangle mr-1" />
                        Withdrawn: {{ checkin.withdrawal_reason }}
                      </p>
                    </div>
                  </RacerLink>
                </div>
              </template>
            </Card>

            <!-- Race Photo Gallery -->
            <Card v-if="racePhotos.length > 0">
              <template #title>
                <h2 class="text-xl font-bold text-black flex items-center gap-2">
                  <i class="pi pi-images" />
                  Race Photos
                </h2>
              </template>
              <template #content>
                <div class="space-y-6">
                  <!-- Filter Controls -->
                  <div class="flex items-center justify-between border-b border-gray-200 pb-4">
                    <span class="text-sm font-medium text-gray-700">
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
                  <div class="text-center pt-4 border-t border-gray-200">
                    <NuxtLink
                      to="/photos"
                      class="inline-flex items-center gap-2 text-brand-blue hover:text-blue-800 font-medium transition-colors"
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
                    <span class="text-gray-600">Total Racers</span>
                    <span class="font-semibold">{{ checkins.length }}</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-gray-600">Qualifying Runs</span>
                    <span class="font-semibold">{{ qualifiers.length }}</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-gray-600">Bracket Races</span>
                    <span class="font-semibold">{{
                      race && raceBrackets.length
                    }}</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-gray-600">Fastest Time</span>
                    <span class="font-semibold">{{ fastestTime || 'N/A' }}</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-gray-600">Slowest Time</span>
                    <span class="font-semibold">{{ slowestTime || 'N/A' }}</span>
                  </div>
                </div>
              </template>
            </Card>

            <!-- Race Timeline -->
            <Card>
              <template #title>
                <h3 class="text-lg font-semibold text-black flex items-center gap-2">
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
                      <p class="text-gray-500 text-xs font-medium">
                        {{ formatEventTime(item.date) }}
                      </p>
                    </div>
                  </template>
                  <template #content="{ item }">
                    <div class="pl-4">
                      <h4 class="font-semibold text-black text-sm">
                        {{ item.title }}
                      </h4>
                      <p class="text-gray-600 text-xs mt-1">
                        {{ item.description }}
                      </p>
                    </div>
                  </template>
                </Timeline>
              </template>
            </Card>

            <!-- Race Description - Show at bottom of right column after checkins start -->
            <div v-if="race.description && checkins.length > 0">
              <Card>
                <template #title>
                  <h2 class="text-xl font-semibold text-black">About This Race</h2>
                </template>
                <template #content>
                  <div class="prose prose-gray" v-html="race.description" />
                </template>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useAuthStore } from '~/stores/auth'

const route = useRoute()
const authStore = useAuthStore()
const config = useRuntimeConfig()

// Use reactive composables for all data

const { races, getRaceBySlug, fetchRaceBySlug, initialize: initializeRaces } = useRaces()
const { getTournamentByRace } = useChallonge()

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

const { getBracketsForRace, getTotalRounds, initialize: initializeBrackets } = useBrackets()
const { getRaceWithdrawals } = useRacers()

// Withdrawals state
const withdrawals = ref([])

// Tournament state
const tournament = ref(null)
const tournamentEmbedUrl = computed(() => {
  console.log('Tournament embed URL computed:', {
    tournament: tournament.value,
    hasUrl: !!tournament.value?.challonge_url,
    status: tournament.value?.status
  })
  
  if (!tournament.value?.challonge_url) {
    console.log('No challonge_url found')
    return null
  }
  
  try {
    const baseUrl = `${config.public.challonge.embedBaseUrl}/${tournament.value.challonge_url}/module`
    const params = new URLSearchParams({
      multiplier: '0.8',
      match_width_multiplier: '1.0',
      show_final_results: '1',
      theme: '1'
    })
    
    const url = `${baseUrl}?${params.toString()}`
    console.log('Generated embed URL:', url)
    return url
  } catch (error) {
    console.error('Error generating embed URL:', error)
    return null
  }
})

// Computed property to map bracket data with flattened racer names
const raceBrackets = computed(() => {
  if (!race.value) return []
  const brackets = getBracketsForRace(race.value.id)
  
  // Debug: Check if brackets are loading properly and have match_number
  if (process.env.NODE_ENV === 'development') {
    console.log('raceBrackets computed - race:', race.value.id, 'brackets length:', brackets.length)
    if (brackets.length > 0) {
      console.log('raceBrackets: First bracket match_number:', brackets[0].match_number)
      console.log('raceBrackets: First bracket data:', brackets[0])
    }
  }
  // Map the bracket data to include flattened racer names
  return brackets.map(b => ({
    ...b,
    track1_racer_name: b.track1_racer?.name || null,
    track1_racer_number: b.track1_racer?.racer_number || null,
    track1_racer_image_url: b.track1_racer?.image_url || null,
    track2_racer_name: b.track2_racer?.name || null,
    track2_racer_number: b.track2_racer?.racer_number || null,
    track2_racer_image_url: b.track2_racer?.image_url || null
  }))
})

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
  fetchCurrentRaceData,
  recentlyCompletedHeat,
  showCompletedHeatResults
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
  const withdrawnRacerIds = new Set(withdrawals.value.map(w => w.racer_id))

  return raceCheckins
    .map((checkin) => {
      const racer = checkinsRacers.value.find((r) => r.id === checkin.racer_id)
      const isWithdrawn = withdrawnRacerIds.has(checkin.racer_id)
      const withdrawal = withdrawals.value.find(w => w.racer_id === checkin.racer_id)
      
      return {
        ...checkin,
        racer_name: racer?.name || `Racer #${racer?.racer_number || 'Unknown'}`,
        racer_number: racer?.racer_number,
        racer_image_url: racer?.image_url,
        is_withdrawn: isWithdrawn,
        withdrawal_reason: withdrawal?.reason,
        withdrawn_at: withdrawal?.withdrawn_at
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
  const slug = route.params.slug

  try {
    // Get race by slug
    race.value = getRaceBySlug(slug)
    // If not found, fetch specifically
    if (!race.value) {
      race.value = await fetchRaceBySlug(slug)
    }

    if (!race.value) {
      error.value = new Error('Race not found')
    } else {
      // Initialize qualifiers composable with the race ID
      qualifiersComposable.value = useQualifiers(race.value.id)
      
      // Load withdrawals for this race
      try {
        withdrawals.value = await getRaceWithdrawals(race.value.id)
      } catch (err) {
        console.error('Error loading withdrawals:', err)
      }
      
      // Load tournament data if it exists
      try {
        tournament.value = await getTournamentByRace(race.value.id)
        console.log('Tournament data loaded:', tournament.value)
      } catch (err) {
        console.log('No tournament found for this race:', err)
        tournament.value = null
      }
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
  const completedBrackets = raceBrackets.value.filter(
    (b) => b.track1_time && b.track2_time && b.track1_time !== b.track2_time
  )

  // Group by bracket type and find the most recent round for each type
  const bracketsByType = { double_elimination: [] }
  completedBrackets.forEach((bracket) => {
    if (bracket.bracket_type) {
      if (!bracketsByType[bracket.bracket_type]) {
        bracketsByType[bracket.bracket_type] = []
      }
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
      const isTrack1Winner = bracket.track1_time < bracket.track2_time

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
  const byType = { double_elimination: 0 }
  raceBrackets.value.forEach((b) => {
    if (b.track1_time && b.track2_time && b.bracket_type) {
      byType[b.bracket_type] = (byType[b.bracket_type] || 0) + 1
    }
  })
  return byType
})

const totalBracketsByType = computed(() => {
  const byType = { double_elimination: 0 }
  raceBrackets.value.forEach((b) => {
    if (b.bracket_type) {
      byType[b.bracket_type] = (byType[b.bracket_type] || 0) + 1
    }
  })
  return byType
})

// Race phase from API - computed to wait for race to load
const { data: racePhaseData } = await useLazyFetch(() => race.value?.id ? `/api/races/${race.value.id}/phase` : null, {
  server: false,
  key: () => race.value?.id ? `race-${race.value.id}-phase` : 'no-race',
  default: () => ({ phase: 'not_started' })
})

// Tournament results - hide since Challonge displays results
const tournamentResults = computed(() => {
  // Since Challonge now displays results properly, we don't need our own results display
  return { double_elimination: null }
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
  if (raceBrackets.value.length > 0) {
    const firstBracket = raceBrackets.value.reduce((earliest, b) =>
      new Date(b.created_at) < new Date(earliest.created_at) ? b : earliest
    )
    events.push({
      type: 'brackets',
      icon: 'pi pi-sitemap',
      title: 'Brackets Generated',
      description: `${raceBrackets.value.length} bracket races created`,
      date: firstBracket.created_at
    })
  }

  // Tournament completion - check race phase
  if (racePhaseData.value?.phase === 'complete') {
    events.push({
      type: 'completed',
      icon: 'pi pi-trophy',
      title: 'Tournament Complete',
      description: 'Winners determined - see results above',
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

  // Tournament complete - check race phase
  if (racePhaseData.value?.phase === 'complete') return 4

  // Brackets phase - if any brackets exist
  if (raceBrackets.value.length > 0) return 3

  // Qualifying phase - if any qualifying times exist
  if (qualifiers.value.length > 0) return 2

  // Check-in phase - if any racers are checked in
  if (checkins.value.length > 0) return 1

  // Design & Build phase - race exists but no activity yet
  return 0
})

const getTournamentPlacings = (bracketType) => {
  const typeBrackets = raceBrackets.value
    .filter((b) => b.bracket_type === bracketType && b.track1_time && b.track2_time)
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))

  if (typeBrackets.length === 0) return { second: null, third: null }

  const finalBracket = typeBrackets[0]

  const isTrack1Winner = finalBracket.track1_time < finalBracket.track2_time

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
      const isTrack1WinnerSemi = bracket.track1_time < bracket.track2_time

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
      thirdPlace = semiFinalLosers.reduce((best, current) => (current.time < best.time ? current : best))
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

// Helper function to get bracket match number
const getBracketMatchNumber = (bracket) => {
  // Use match_number from database
  return bracket.match_number || raceBrackets.value.indexOf(bracket) + 1
}

// Helper function to check if a track is the winner
const isWinner = (bracket, trackNumber) => {
  if (!bracket.track1_time || !bracket.track2_time) return false
  
  const track1Time = Number.parseFloat(bracket.track1_time)
  const track2Time = Number.parseFloat(bracket.track2_time)
  
  if (trackNumber === 1) {
    return track1Time < track2Time
  } else {
    return track2Time < track1Time
  }
}

// Helper function to get standard tournament round names based on rounds from end
const getStandardRoundName = (roundsFromEnd, bracketType = '') => {
  const prefix = bracketType ? `${bracketType} ` : ''
  
  switch (roundsFromEnd) {
    case 1: return `${prefix}Finals`
    case 2: return `${prefix}Semifinals`
    case 3: return `${prefix}Quarterfinals`
    case 4: return `${prefix}Round of 16`
    case 5: return `${prefix}Round of 32`
    case 6: return `${prefix}Round of 64`
    default: return `${prefix}Round ${roundsFromEnd}`
  }
}

// Helper function to get proper tournament round names using Challonge round info
const getTournamentRoundName = (roundNumber, bracketGroup = 'winner', challongeRound = null) => {
  if (bracketGroup === 'final') {
    return 'Championship'
  }
  
  // Use Challonge round information if available
  if (challongeRound !== null) {
    if (challongeRound > 0) {
      // Winner bracket (positive rounds) - determine names based on tournament structure
      const maxWinnerRound = Math.max(...raceBrackets.value
        .filter(b => b.challonge_round > 0)
        .map(b => b.challonge_round))
      
      if (challongeRound === maxWinnerRound) {
        return 'Finals'
      } else if (challongeRound === maxWinnerRound - 1 && maxWinnerRound > 1) {
        return 'Semifinals'
      } else if (challongeRound === maxWinnerRound - 2 && maxWinnerRound > 2) {
        return 'Quarterfinals'
      } else {
        return `Round ${challongeRound}`
      }
    } else if (challongeRound < 0) {
      // Lower bracket (negative rounds) - use Challonge's terminology  
      return `Losers Round ${Math.abs(challongeRound)}`
    }
  }
  
  // Fallback to internal logic for loser bracket
  if (bracketGroup === 'loser') {
    // Calculate expected loser bracket structure based on winner bracket
    const winnerBrackets = raceBrackets.value.filter(b => b.bracket_group === 'winner')
    const maxWinnerRound = winnerBrackets.length > 0 ? Math.max(...winnerBrackets.map(b => b.round_number)) : 1
    
    // In double elimination, loser bracket has (2 * winner_rounds - 1) rounds
    const expectedLoserRounds = (maxWinnerRound * 2) - 1
    const roundsFromEnd = expectedLoserRounds - roundNumber + 1
    
    if (roundsFromEnd === 1) {
      return 'Loser Bracket Finals'
    } else if (roundsFromEnd === 2) {
      return 'Loser Bracket Semi-Finals'
    } else if (roundsFromEnd === 3) {
      return 'Loser Bracket Quarter-Finals'
    } else {
      return `Loser Bracket Round ${roundNumber}`
    }
  }
  
  // For winner bracket, calculate expected total rounds based on participants
  const winnerBrackets = raceBrackets.value.filter(b => b.bracket_group === 'winner' && b.round_number === 1)
  const firstRoundMatches = winnerBrackets.length
  
  // Calculate total participants from first round (each match = 2 participants, except byes)
  let totalParticipants = 0
  winnerBrackets.forEach(bracket => {
    if (bracket.track1_racer_id) totalParticipants++
    if (bracket.track2_racer_id) totalParticipants++
  })
  
  // Calculate expected total rounds: log2(participants) rounded up
  const expectedTotalRounds = Math.ceil(Math.log2(totalParticipants))
  
  // Now use expected rounds instead of actual max round
  if (roundNumber === expectedTotalRounds) {
    return 'Winner Bracket Finals'
  } else if (roundNumber === expectedTotalRounds - 1 && expectedTotalRounds >= 2) {
    return 'Winner Bracket Semi-Finals'
  } else if (roundNumber === expectedTotalRounds - 2 && expectedTotalRounds >= 3) {
    return 'Winner Bracket Quarter-Finals'
  } else {
    // Calculate "last X" for earlier rounds
    const roundsFromEnd = expectedTotalRounds - roundNumber + 1
    const participantsInRound = Math.pow(2, roundsFromEnd)
    return `Winner Bracket Last ${participantsInRound}`
  }
}

// Helper function to format heat display names
const formatHeatDisplayName = (heat) => {
  // If it's an object with type, use the bracket data directly
  if (typeof heat === 'object' && heat.type === 'bracket') {
    if (heat.bracket_group === 'final') {
      return 'Championship Match'
    } else if (heat.bracket_group && heat.round_number) {
      const roundName = getTournamentRoundName(heat.round_number, heat.bracket_group, heat.challonge_round)
      return roundName
    }
    return `Match ${heat.match_number || heat.heat_number}`
  }
  
  // Handle legacy heat number format for backwards compatibility
  const heatNumber = typeof heat === 'object' ? heat.heat_number : heat
  if (typeof heat === 'object' && heat.type === 'qualifier') {
    return `Heat ${heatNumber}`
  }
  
  // Fallback for plain numbers (assume qualifier)
  return `Heat ${heatNumber}`
}

// Helper function to format bracket type names for display
const formatBracketTypeName = (bracketType) => {
  switch (bracketType) {
    case 'double_elimination':
      return 'Double Elimination'
    case 'single_elimination':
      return 'Single Elimination'
    case 'round_robin':
      return 'Round Robin'
    default:
      return bracketType.charAt(0).toUpperCase() + bracketType.slice(1).replace(/_/g, ' ')
  }
}

// Compute heat type and display info
const currentHeatType = computed(() => {
  if (!currentHeatData.value) return null
  
  const heat = currentHeatData.value
  
  if (heat.type === 'bracket') {
    // Special handling for championship final
    if (heat.bracket_group === 'final') {
      return {
        type: 'bracket',
        displayName: '🏆 CHAMPIONSHIP FINAL',
        description: 'Tournament Final • Championship Match'
      }
    }
    
    // Create clear, non-repetitive naming using bracket data directly
    if (heat.bracket_group && heat.round_number) {
      const matchNum = heat.match_number || heat.heat_number || 1
      const roundName = getTournamentRoundName(heat.round_number, heat.bracket_group, heat.challonge_round)
      const displayName = roundName
      const description = `Match ${matchNum}`
      
      return {
        type: 'bracket',
        displayName: displayName,
        description: description
      }
    } else {
      return {
        type: 'bracket',
        displayName: `Tournament Match ${heat.match_number || heat.heat_number}`,
        description: 'Bracket Race • Live Timing'
      }
    }
  } else {
    // Qualifier heat
    return {
      type: 'qualifier',
      displayName: `Heat ${heat.heat_number}`,
      description: 'Qualifying Round • Live Timing'
    }
  }
})

// Current heat data for display
const currentHeatData = computed(() => {
  // If we should show completed heat results, prioritize that
  if (race.value?.active && showCompletedHeatResults.value && recentlyCompletedHeat.value) {
    if (!currentRaceHeat.value || currentRaceHeat.value.id === race.value.id) {
      return recentlyCompletedHeat.value
    }
  }

  // Otherwise, show current active heat as before
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

// Helper function to check if a racer is withdrawn
const isRacerWithdrawn = (racerId) => {
  return withdrawals.value.some(w => w.racer_id === racerId)
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

  return bracket.track1_time < bracket.track2_time
    ? bracket.track1_racer_name
    : bracket.track2_racer_name
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
  background-color: #f3f4f6 !important;
}

:deep(.custom-datatable .p-datatable-striped .p-datatable-tbody > tr:nth-child(odd)) {
  background-color: #ffffff !important;
}

:deep(.custom-datatable .p-datatable-striped .p-datatable-tbody > tr:nth-child(even)) {
  background-color: #f9fafb !important;
}

/* Dark mode DataTable styling */
:deep(.app-dark .custom-datatable .p-datatable-thead > tr > th) {
  background-color: #1f2937 !important;
  color: #f9fafb !important;
  border-bottom: 2px solid #374151 !important;
}

:deep(.app-dark .custom-datatable .p-datatable-tbody > tr > td) {
  border-bottom: 1px solid #374151 !important;
}

/* Target the specific RacerLink anchor elements with maximum specificity */
:deep(
  .app-dark
    .custom-datatable
    .p-datatable-tbody
    > tr:hover
    a.font-medium.dark\:text-white.hover\:text-brand-blue
),
:deep(.app-dark .custom-datatable .p-datatable-tbody > tr:hover a.font-medium.dark\:text-white),
:deep(.app-dark .custom-datatable .p-datatable-tbody > tr:hover a.font-medium),
:deep(.app-dark .custom-datatable .p-datatable-tbody > tr:hover a),
:deep(.app-dark .custom-datatable .p-datatable-tbody > tr:hover .text-brand-blue),
:deep(.app-dark .custom-datatable .p-datatable-tbody > tr:hover .dark\:text-blue-400) {
  color: #93c5fd !important;
}

:deep(.app-dark .custom-datatable .p-datatable-striped .p-datatable-tbody > tr:nth-child(odd)) {
  background-color: #1f2937 !important;
}

:deep(.app-dark .custom-datatable .p-datatable-striped .p-datatable-tbody > tr:nth-child(even)) {
  background-color: #374151 !important;
}
</style>
