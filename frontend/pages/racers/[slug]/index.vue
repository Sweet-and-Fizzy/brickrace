<template>
  <div class="min-h-screen bg-white">
    <ConfirmDialog />
    <div class="container mx-auto px-4 py-8">
      <!-- Breadcrumb Navigation -->
      <BreadcrumbWrapper :items="breadcrumbItems" />

      <!-- Loading State -->
      <div v-if="pending" class="flex justify-center py-12">
        <ProgressSpinner />
      </div>

      <!-- Error State -->
      <div v-else-if="error" class="text-center py-12">
        <i class="pi pi-exclamation-triangle text-6xl text-red-400 mb-4" />
        <h2 class="text-2xl font-semibold text-gray-800 mb-2">Racer Not Found</h2>
        <p class="text-gray-600 mb-2">
          The racer you're looking for doesn't exist or has been removed.
        </p>
        <p class="text-sm text-gray-500 mb-6">Slug requested: {{ route.params.slug }}</p>
        <div class="space-x-4">
          <NuxtLink to="/racers">
            <Button>Back to All Racers</Button>
          </NuxtLink>
        </div>
      </div>

      <!-- Racer Details -->
      <div v-else-if="racer">
        <!-- Header -->
        <div class="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <h1 class="text-3xl font-bold text-black mb-2">{{ racer.name }}</h1>
          </div>

          <div class="flex gap-2 mt-4 md:mt-0">
            <NuxtLink v-if="canEdit" :to="`/racers/${racer.slug}/edit`">
              <Button class="btn-secondary">
                <i class="pi pi-pencil mr-2" />
                <span>Edit Racer</span>
              </Button>
            </NuxtLink>
          </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <!-- Main Content -->
          <div class="lg:col-span-2 space-y-6">
            <!-- Photo Gallery -->
            <Card
              v-if="allRacerPhotos.length > 0 && allRacerPhotos[0]?.url"
              class="overflow-hidden"
              :pt="{ body: { class: 'p-0' }, content: { class: 'p-0' } }"
            >
              <template #content>
                <!-- Main Image Display -->
                <div
                  class="relative w-full h-64 md:h-96 cursor-pointer"
                  @click="openRacerGallery(0)"
                >
                  <Image
                    :src="allRacerPhotos[0]?.url"
                    :alt="racer.name"
                    image-class="w-full h-64 md:h-96 object-cover"
                    class="w-full h-64 md:h-96"
                    :preview="false"
                  />

                  <!-- Name Tag Badge -->
                  <div
                    class="absolute top-4 right-4 bg-gradient-to-br from-red-500 to-orange-600 text-white px-4 py-2 text-lg font-bold border-2 border-red-400 shadow-lg"
                    style="
                      border-radius: 12px 12px 12px 0;
                      font-family: 'Inter', sans-serif;
                      letter-spacing: 0.05em;
                      box-shadow:
                        0 4px 8px rgba(220, 38, 38, 0.3),
                        0 0 0 1px rgba(220, 38, 38, 0.1);
                      min-width: 50px;
                      text-align: center;
                    "
                  >
                    #{{ racer.racer_number }}
                  </div>

                  <!-- Photo Count Badge -->
                  <div
                    v-if="allRacerPhotos.length > 1"
                    class="absolute bottom-4 left-4 bg-black bg-opacity-60 text-white px-3 py-1 rounded-lg text-sm font-medium"
                  >
                    <i class="pi pi-images mr-1" />
                    {{ allRacerPhotos.length }} photos
                  </div>
                </div>

                <!-- Thumbnail Strip (if more than 1 photo) -->
                <div v-if="allRacerPhotos.length > 1" class="p-4 bg-gray-50">
                  <div class="flex gap-2 overflow-x-auto">
                    <div
                      v-for="(photo, index) in allRacerPhotos.slice(1, 6)"
                      :key="index + 1"
                      class="flex-shrink-0 cursor-pointer"
                      @click="openRacerGallery(index + 1)"
                    >
                      <Image
                        :src="photo.url"
                        :alt="`${racer.name} photo ${index + 2}`"
                        image-class="w-16 h-16 object-cover rounded border-2 border-gray-300"
                        class="w-16 h-16"
                        :preview="false"
                      />
                    </div>
                    <div
                      v-if="allRacerPhotos.length > 6"
                      class="flex-shrink-0 w-16 h-16 bg-gray-200 rounded border-2 border-dashed border-gray-300 flex items-center justify-center cursor-pointer"
                      @click="openRacerGallery(6)"
                    >
                      <span class="text-xs font-medium text-gray-600"
                        >+{{ allRacerPhotos.length - 6 }}</span
                      >
                    </div>
                  </div>
                </div>
              </template>
            </Card>

            <!-- No Photos State -->
            <Card
              v-else
              class="overflow-hidden"
              :pt="{ body: { class: 'p-0' }, content: { class: 'p-0' } }"
            >
              <template #content>
                <div class="w-full h-64 md:h-96 bg-gray-200 flex items-center justify-center">
                  <div class="text-center">
                    <i class="pi pi-car text-6xl text-gray-400 mb-4" />
                    <p class="text-gray-500 font-medium">{{ racer.name }}</p>
                    <p class="text-gray-400 text-sm mt-1">No photos uploaded</p>
                  </div>
                </div>

                <!-- ID Badge -->
                <div
                  class="absolute top-4 right-4 bg-gradient-to-br from-red-500 to-orange-600 text-white px-4 py-2 text-lg font-bold border-2 border-red-400 shadow-lg"
                  style="
                    border-radius: 12px 12px 12px 0;
                    font-family: 'Inter', sans-serif;
                    letter-spacing: 0.05em;
                    box-shadow:
                      0 4px 8px rgba(220, 38, 38, 0.3),
                      0 0 0 1px rgba(220, 38, 38, 0.1);
                    min-width: 50px;
                    text-align: center;
                  "
                >
                  #{{ racer.racer_number }}
                </div>
              </template>
            </Card>

            <!-- Tournament Podium Finishes -->
            <Card v-if="podiumFinishes.length > 0">
              <template #title>
                <div class="flex items-center gap-2">
                  <i class="pi pi-crown text-yellow-500" />
                  Tournament Podium Finishes
                </div>
              </template>
              <template #content>
                <div class="grid gap-4">
                  <div
                    v-for="finish in podiumFinishes"
                    :key="`${finish.race.id}-${finish.place}`"
                    class="flex items-center gap-4 p-4 rounded-lg border-2"
                    :class="{
                      'bg-gradient-to-r from-yellow-50 to-yellow-100 border-yellow-300':
                        finish.place === 1,
                      'bg-gradient-to-r from-gray-50 to-gray-100 border-gray-300':
                        finish.place === 2,
                      'bg-gradient-to-r from-amber-50 to-orange-100 border-amber-300':
                        finish.place === 3
                    }"
                  >
                    <div class="text-4xl">
                      {{ finish.place === 1 ? '🏆' : finish.place === 2 ? '🥈' : '🥉' }}
                    </div>
                    <div class="flex-1">
                      <div class="flex items-center gap-2 mb-1">
                        <span class="font-bold text-lg">{{ finish.title }}</span>
                        <Badge
                          :value="finish.prize"
                          :severity="
                            finish.place === 1 ? 'success' : finish.place === 2 ? 'info' : 'warning'
                          "
                        />
                      </div>
                      <NuxtLink
                        :to="`/races/${finish.race.slug}`"
                        class="text-brand-blue hover:underline font-medium"
                      >
                        {{ finish.race.name }}
                      </NuxtLink>
                      <div class="text-sm text-gray-600 mt-1">
                        {{
                          finish.race.race_datetime
                            ? new Date(finish.race.race_datetime).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                              })
                            : 'Date not available'
                        }}
                      </div>
                    </div>
                  </div>
                </div>
              </template>
            </Card>

            <!-- Performance History -->
            <Card v-if="racerQualifiers.length > 0">
              <template #title>
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-2">
                    <i class="pi pi-clock" />
                    Qualifying Times
                  </div>
                  <Select
                    v-model="qualifierSort"
                    :options="sortOptions"
                    option-label="label"
                    option-value="value"
                    placeholder="Sort by"
                    class="w-32"
                    size="small"
                  />
                </div>
              </template>
              <template #content>
                <DataTable :value="sortedQualifiers" striped-rows responsive-layout="scroll">
                  <Column header="Race">
                    <template #body="slotProps">
                      {{
                        slotProps.data.race?.name || slotProps.data.races?.name || 'Unknown Race'
                      }}
                    </template>
                  </Column>
                  <Column field="time" header="Time" sortable>
                    <template #body="slotProps">
                      <Badge
                        :value="formatTime(slotProps.data.time)"
                        :severity="getBadgeSeverity(slotProps.data.time)"
                        class="font-mono"
                      />
                    </template>
                  </Column>
                  <Column field="created_at" header="Date & Time" sortable>
                    <template #body="slotProps">
                      {{
                        new Date(slotProps.data.created_at).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })
                      }}
                      at
                      {{
                        new Date(slotProps.data.created_at).toLocaleTimeString('en-US', {
                          hour: 'numeric',
                          minute: '2-digit'
                        })
                      }}
                    </template>
                  </Column>
                </DataTable>
              </template>
            </Card>

            <!-- Bracket Results -->
            <Card v-if="racer.brackets?.length">
              <template #title>
                <div class="flex items-center gap-2">
                  <i class="pi pi-trophy" />
                  Bracket Results
                </div>
              </template>
              <template #content>
                <div class="space-y-4">
                  <div
                    v-for="bracket in sortedBrackets"
                    :key="bracket.id"
                    class="p-4 bg-gray-50 rounded-lg border border-gray-200"
                  >
                    <div class="flex items-center justify-between mb-3">
                      <div class="flex flex-col gap-1">
                        <span class="text-sm font-semibold text-gray-800">{{
                          getRaceName(bracket.races?.name)
                        }}</span>
                        <div class="flex items-center gap-2">
                          <Badge :value="getBracketStage(bracket)" severity="info" size="small" />
                          <Badge
                            v-if="bracket.is_completed && bracket.winner_racer_id"
                            :value="`${bracket.rounds_won_track1 || 0} - ${bracket.rounds_won_track2 || 0}`"
                            severity="success"
                            size="small"
                            class="font-mono"
                          />
                        </div>
                      </div>
                    </div>

                    <!-- Show individual rounds -->
                    <div v-if="bracket.bracket_rounds?.length" class="space-y-3">
                      <div
                        v-for="round in bracket.bracket_rounds
                          .filter((r) => r.racer1_time || r.racer2_time || r.is_forfeit)
                          .sort((a, b) => a.round_number - b.round_number)"
                        :key="round.id"
                      >
                        <div class="text-xs font-semibold text-gray-600 mb-1">
                          Round {{ round.round_number }}
                        </div>
                        <div class="grid grid-cols-2 gap-2">
                          <!-- Racer 1 -->
                          <div
                            :class="[
                              'p-2 rounded border',
                              round.racer1_id === racer.id
                                ? 'bg-red-50/30 border-red-300 ring-1 ring-red-400/50'
                                : round.winner_racer_id === round.racer1_id && round.racer1_time
                                  ? 'bg-green-50/30 border-green-300'
                                  : 'bg-white border-gray-200'
                            ]"
                          >
                            <div class="flex items-center justify-between mb-1">
                              <span
                                :class="[
                                  'text-xs font-medium',
                                  round.racer1_id === racer.id ? 'text-red-900' : 'text-gray-900'
                                ]"
                              >
                                {{ bracket.track1_racer?.name || 'Unknown' }}
                              </span>
                              <span class="text-xs text-gray-500">T{{ round.racer1_track }}</span>
                            </div>
                            <div class="text-center">
                              <Badge
                                v-if="round.racer1_time"
                                :value="formatTime(round.racer1_time)"
                                :severity="
                                  round.winner_racer_id === round.racer1_id
                                    ? 'success'
                                    : 'secondary'
                                "
                                size="small"
                                class="font-mono"
                              />
                              <Badge
                                v-else-if="
                                  round.is_forfeit &&
                                  round.winner_racer_id &&
                                  round.winner_racer_id !== round.racer1_id
                                "
                                value="Forfeit"
                                severity="warning"
                                size="small"
                              />
                              <span v-else class="text-xs text-gray-400">-</span>
                            </div>
                          </div>

                          <!-- Racer 2 -->
                          <div
                            :class="[
                              'p-2 rounded border',
                              round.racer2_id === racer.id
                                ? 'bg-red-50/30 border-red-300 ring-1 ring-red-400/50'
                                : round.winner_racer_id === round.racer2_id && round.racer2_time
                                  ? 'bg-green-50/30 border-green-300'
                                  : 'bg-white border-gray-200'
                            ]"
                          >
                            <div class="flex items-center justify-between mb-1">
                              <span
                                :class="[
                                  'text-xs font-medium',
                                  round.racer2_id === racer.id ? 'text-red-900' : 'text-gray-900'
                                ]"
                              >
                                {{ bracket.track2_racer?.name || 'Unknown' }}
                              </span>
                              <span class="text-xs text-gray-500">T{{ round.racer2_track }}</span>
                            </div>
                            <div class="text-center">
                              <Badge
                                v-if="round.racer2_time"
                                :value="formatTime(round.racer2_time)"
                                :severity="
                                  round.winner_racer_id === round.racer2_id
                                    ? 'success'
                                    : 'secondary'
                                "
                                size="small"
                                class="font-mono"
                              />
                              <Badge
                                v-else-if="
                                  round.is_forfeit &&
                                  round.winner_racer_id &&
                                  round.winner_racer_id !== round.racer2_id
                                "
                                value="Forfeit"
                                severity="warning"
                                size="small"
                              />
                              <span v-else class="text-xs text-gray-400">-</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <!-- Overall winner display -->
                    <div v-if="bracket.is_completed" class="mt-3 pt-3 border-t">
                      <div class="text-center">
                        <div
                          v-if="bracket.is_forfeit && !bracket.winner_racer_id"
                          class="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-gray-100 text-gray-800"
                        >
                          <i class="pi pi-ban text-gray-500" />
                          <span class="font-semibold text-sm">Both Withdrawn</span>
                        </div>
                        <div
                          v-else-if="bracket.winner_racer_id"
                          :class="[
                            'inline-flex items-center gap-2 px-3 py-1 rounded-lg',
                            bracket.winner_racer_id === racer.id
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                          ]"
                        >
                          <i
                            v-if="bracket.winner_racer_id === racer.id"
                            class="pi pi-trophy text-yellow-500"
                          />
                          <span class="font-semibold text-sm">
                            {{ bracket.winner_racer_id === racer.id ? 'Winner' : 'Runner Up' }}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </template>
            </Card>

            <!-- Racer Gallery Lightbox -->
            <Galleria
              v-model:visible="racerGalleryVisible"
              v-model:active-index="activeRacerImageIndex"
              :value="racerGalleryImages"
              :circular="true"
              :full-screen="true"
              :show-item-navigators="true"
              :show-thumbnails="false"
              :show-item-navigators-on-hover="true"
              :show-indicators="false"
            >
              <template #item="{ item }">
                <div class="flex justify-center items-center w-full h-full">
                  <img
                    :src="item.itemImageSrc"
                    :alt="item.alt"
                    class="max-w-full max-h-full object-contain"
                    style="max-height: 80vh; max-width: 90vw"
                  />
                </div>
              </template>
            </Galleria>
          </div>

          <!-- Sidebar -->
          <div class="space-y-6">
            <!-- About this Racer -->
            <Card v-if="racer.team_members">
              <template #title>
                <div class="flex items-center gap-2">
                  <i class="pi pi-info-circle" />
                  About this Racer
                </div>
              </template>
              <template #content>
                <p class="text-black leading-relaxed whitespace-pre-wrap">
                  {{ racer.team_members }}
                </p>
              </template>
            </Card>

            <!-- Awards -->
            <Card v-if="racer.awards?.length">
              <template #title>
                <div class="flex items-center gap-2">
                  <i class="pi pi-trophy" />
                  Awards
                </div>
              </template>
              <template #content>
                <div class="space-y-3">
                  <div
                    v-for="award in racer.awards"
                    :key="award.id"
                    class="p-3 bg-gray-50 rounded-lg border border-gray-200"
                  >
                    <!-- Award Image -->
                    <div class="mb-3">
                      <img
                        v-if="award.award_definition?.image_url"
                        :src="award.award_definition.image_url"
                        :alt="award.award_definition.name"
                        class="w-full aspect-square object-cover rounded border border-gray-300"
                      />
                      <div
                        v-else
                        class="w-full aspect-square bg-gray-100 rounded border border-gray-300 flex items-center justify-center"
                      >
                        <i class="pi pi-trophy text-amber-600 text-4xl" />
                      </div>
                    </div>

                    <!-- Award Info -->
                    <div class="text-center">
                      <p class="font-semibold text-black">
                        {{ award.award_definition?.name || award.name }}
                      </p>
                      <p class="text-gray-600 text-sm">
                        {{ award.race?.name || 'Unknown Race' }}
                      </p>
                      <p
                        v-if="award.award_definition?.description"
                        class="text-gray-500 text-xs mt-1"
                      >
                        {{ award.award_definition.description }}
                      </p>
                    </div>
                  </div>
                </div>
              </template>
            </Card>

            <!-- Vote Counts -->
            <Card v-if="totalVotes > 0">
              <template #title>
                <div class="flex items-center gap-2">
                  <i class="pi pi-heart text-red-500" />
                  Vote Results
                </div>
              </template>
              <template #content>
                <div class="space-y-4">
                  <!-- Group by Race -->
                  <div
                    v-for="raceGroup in voteCountsByRace"
                    :key="raceGroup.raceId"
                    class="space-y-3"
                  >
                    <!-- Race Header -->
                    <div
                      class="flex items-center justify-between p-3 bg-blue-50/30 rounded-lg border border-blue-200"
                    >
                      <h4 class="font-semibold text-blue-900">
                        {{ raceGroup.raceName }}
                      </h4>
                      <Badge
                        :value="`❤️ ${raceGroup.totalVotes} total`"
                        severity="info"
                        class="font-bold"
                      />
                    </div>

                    <!-- Awards for this race -->
                    <div class="ml-4 space-y-2">
                      <div
                        v-for="voteCount in raceGroup.votes"
                        :key="`${voteCount.award_definition_id}-${voteCount.race_id}`"
                        class="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
                      >
                        <div>
                          <p class="font-medium text-black">
                            {{ voteCount.award_name }}
                          </p>
                        </div>
                        <div class="flex items-center gap-2">
                          <Badge
                            :value="`❤️ ${voteCount.vote_count}`"
                            severity="success"
                            class="font-bold"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <!-- Overall Total -->
                  <div v-if="voteCountsByRace.length > 1" class="border-t pt-4 mt-4">
                    <div
                      class="flex items-center justify-between p-3 bg-gradient-to-r from-green-50 to-emerald-50/30/30 rounded-lg border border-green-200"
                    >
                      <span class="font-bold text-green-900">All-Time Total:</span>
                      <Badge
                        :value="`❤️ ${totalVotes}`"
                        severity="success"
                        class="font-bold text-lg"
                      />
                    </div>
                  </div>

                  <!-- No votes message -->
                  <div v-if="voteCountsByRace.length === 0" class="text-center py-6 text-gray-500">
                    <i class="pi pi-heart text-2xl mb-2" />
                    <p>No votes received yet</p>
                  </div>
                </div>
              </template>
            </Card>

            <!-- Quick Stats -->
            <Card>
              <template #title>Quick Stats</template>
              <template #content>
                <div class="space-y-4">
                  <div v-if="racer.weight" class="flex justify-between">
                    <span class="text-gray-600">Weight</span>
                    <span class="font-semibold text-black"
                      >{{ (racer.weight / 453.592).toFixed(2) }} lbs</span
                    >
                  </div>
                  <div class="flex justify-between">
                    <span class="text-gray-600">Fastest Time</span>
                    <span class="font-semibold text-black">{{ fastestTime || 'N/A' }}</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-gray-600">Slowest Time</span>
                    <span class="font-semibold text-black">{{ slowestTime || 'N/A' }}</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-gray-600">Total Races</span>
                    <span class="font-semibold text-black">{{ totalRaces }}</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-gray-600">Awards Won</span>
                    <span class="font-semibold text-black">{{ racer.awards?.length || 0 }}</span>
                  </div>
                </div>
              </template>
            </Card>

            <!-- Checkins -->
            <Card v-if="racerCheckins.length > 0">
              <template #title>
                <div class="flex items-center gap-2">
                  <i class="pi pi-check-circle" />
                  Race Checkins
                </div>
              </template>
              <template #content>
                <div class="space-y-3">
                  <div
                    v-for="checkin in racerCheckins"
                    :key="checkin.id"
                    class="p-3 bg-gray-50 rounded-lg border border-gray-200"
                    :class="{
                      'border-red-200 bg-red-50/20':
                        activeRace &&
                        checkin.race?.id === activeRace.id &&
                        isWithdrawn(checkin.race?.id)
                    }"
                  >
                    <div class="flex items-center justify-between mb-2">
                      <span class="font-medium text-black">
                        {{ checkin.race?.name || 'Unknown Race' }}
                      </span>

                      <!-- Withdrawal Status Badge (only for active race) -->
                      <div
                        v-if="activeRace && checkin.race?.id === activeRace.id"
                        class="flex items-center gap-2"
                      >
                        <Badge
                          v-if="isWithdrawn(checkin.race?.id)"
                          value="Withdrawn"
                          severity="warning"
                          class="text-xs"
                        />
                        <Badge v-else value="Active" severity="success" class="text-xs" />
                      </div>
                    </div>

                    <p class="text-sm text-gray-600 mb-3">
                      {{ formatCheckinTime(checkin.time) }}
                    </p>

                    <!-- Withdrawal Control (only for race owner and the currently active race) -->
                    <div
                      v-if="canEdit && activeRace && checkin.race?.id === activeRace.id"
                      class="mt-3"
                    >
                      <Button
                        :loading="processingWithdrawal === checkin.race?.id"
                        :severity="isWithdrawn(checkin.race?.id) ? 'success' : 'warning'"
                        class="w-full"
                        outlined
                        size="small"
                        @click="toggleWithdrawal(checkin)"
                      >
                        <i v-if="isWithdrawn(checkin.race?.id)" class="pi pi-user-plus mr-2" />
                        <i v-else class="pi pi-user-minus mr-2" />
                        {{
                          isWithdrawn(checkin.race?.id) ? 'Reinstate to Race' : 'Withdraw from Race'
                        }}
                      </Button>
                    </div>
                  </div>
                </div>
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
import { useConfirm } from 'primevue/useconfirm'

const route = useRoute()
const authStore = useAuthStore()
const confirm = useConfirm()
const racerSlug = route.params.slug

const racer = ref(null)
const pending = ref(true)
const error = ref(null)

// Use composables for data and caching
const {
  getRacerBySlug,
  fetchRacerDetailsBySlug,
  isDetailedDataFresh,
  previewWithdrawalImpact,
  withdrawRacerFromRace,
  reinstateRacerToRace,
  isRacerWithdrawnFromRace,
  initialize: initializeRacers
} = useRacers()

const {
  qualifiers: allQualifiers,
  initialize: initializeQualifiers,
  loading: qualifiersLoading
} = useQualifiers()

const {
  checkins: allCheckins,
  initialize: initializeCheckins,
  loading: checkinsLoading
} = useCheckins()

const { getRacerVoteCounts, initialize: initializeAwards } = useAwards()

const { races: allRaces, activeRace, initialize: initializeRaces } = useRaces()

// Toast for notifications
const toast = useToast()

// Withdrawal state
const processingWithdrawal = ref(null)
const withdrawalStatus = ref(new Map()) // Cache withdrawal status for each race

// Qualifier sorting
const qualifierSort = ref('fastest')
const sortOptions = [
  { label: 'Fastest First', value: 'fastest' },
  { label: 'Slowest First', value: 'slowest' },
  { label: 'Most Recent', value: 'recent' },
  { label: 'Oldest First', value: 'oldest' }
]

// Breadcrumb navigation
const breadcrumbItems = computed(() => [
  { label: 'Home', url: '/' },
  { label: 'Racers', url: '/racers' },
  { label: racer.value?.name || 'Racer Details' } // Current page, no navigation
])

// Load racer data with caching
const loadRacer = async () => {
  try {
    error.value = null

    // Check if we have any cached data to show immediately
    const cachedRacer = getRacerBySlug(racerSlug)
    if (cachedRacer) {
      if (process.env.NODE_ENV === 'development') {
        console.log('useRacers: Using cached data for racer:', racerSlug)
      }
      racer.value = cachedRacer
      pending.value = false

      // If data is fresh, we're done
      if (isDetailedDataFresh(cachedRacer.id)) {
        if (process.env.NODE_ENV === 'development') {
          console.log('useRacers: Cached data is fresh, no need to refetch')
        }
        // Still fetch podium finishes as they may change
        await fetchPodiumFinishes()
        return
      }

      // Data is stale, fetch fresh data in background
      if (process.env.NODE_ENV === 'development') {
        console.log('useRacers: Cached data is stale, fetching fresh data in background')
      }
      try {
        racer.value = await fetchRacerDetailsBySlug(racerSlug)
        // Fetch podium finishes after updating racer data
        await fetchPodiumFinishes()
      } catch (fetchErr) {
        if (process.env.NODE_ENV === 'development') {
          console.warn('Failed to fetch fresh data, keeping cached data:', fetchErr)
        }
        // Still try to fetch podium finishes with cached data
        await fetchPodiumFinishes()
      }
      return
    }

    // No cached data, show loading and fetch
    pending.value = true
    if (process.env.NODE_ENV === 'development') {
      console.log('useRacers: No cached data, fetching fresh data for racer:', racerSlug)
    }
    racer.value = await fetchRacerDetailsBySlug(racerSlug)

    // Fetch podium finishes for this racer
    if (racer.value) {
      await fetchPodiumFinishes()
    }
  } catch (err) {
    // Keep essential error logging for production debugging
    console.error('Error loading racer:', err)
    error.value = err
  } finally {
    pending.value = false
  }
}

// Computed properties

// Get qualifiers for this racer from the racer details
const racerQualifiers = computed(() => {
  if (!racer.value?.qualifiers) return []
  // Filter for qualifiers with valid times
  return racer.value.qualifiers.filter((q) => q.time && q.time > 0)
})

// Sorted qualifiers based on selected sort option
const sortedQualifiers = computed(() => {
  const qualifiers = racerQualifiers.value
  if (!qualifiers || qualifiers.length === 0) return []

  const sorted = [...qualifiers]

  switch (qualifierSort.value) {
    case 'fastest':
      return sorted.sort((a, b) => Number.parseFloat(a.time) - Number.parseFloat(b.time))
    case 'slowest':
      return sorted.sort((a, b) => Number.parseFloat(b.time) - Number.parseFloat(a.time))
    case 'recent':
      return sorted.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    case 'oldest':
      return sorted.sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
    default:
      return sorted
  }
})

const fastestTime = computed(() => {
  const qualifiers = racerQualifiers.value
  if (!qualifiers || qualifiers.length === 0) return null

  const times = qualifiers
    .filter((q) => q.time && q.time > 0)
    .map((q) => Number.parseFloat(q.time))
    .filter((t) => !Number.isNaN(t) && t > 0)

  if (times.length === 0) return null

  const fastest = Math.min(...times)
  return formatTime(fastest)
})

const slowestTime = computed(() => {
  const qualifiers = racerQualifiers.value
  if (!qualifiers || qualifiers.length === 0) return null

  const times = qualifiers
    .filter((q) => q.time && q.time > 0)
    .map((q) => Number.parseFloat(q.time))
    .filter((t) => !Number.isNaN(t) && t > 0)

  if (times.length === 0) return null

  const slowest = Math.max(...times)
  return formatTime(slowest)
})

// Calculate total unique races participated in
const totalRaces = computed(() => {
  const qualifiers = racerQualifiers.value
  if (!qualifiers || qualifiers.length === 0) return 0

  // Count unique race IDs
  const uniqueRaceIds = new Set(qualifiers.map((q) => q.race_id))
  return uniqueRaceIds.size
})

const canEdit = computed(() => {
  if (!authStore.isAuthenticated || !racer.value) return false

  // User can edit if they own the racer or if they're an admin
  return racer.value.user_id === authStore.userId || authStore.isAdmin
})

// Get vote counts for this racer with race names
const racerVoteCounts = computed(() => {
  if (!racer.value?.id) return []
  const voteCounts = getRacerVoteCounts(racer.value.id)

  // Handle case where voteCounts might be undefined
  if (!voteCounts || !Array.isArray(voteCounts)) return []

  // Enrich with race names
  return voteCounts.map((voteCount) => {
    const race = allRaces.value?.find?.((r) => r.id === voteCount.race_id)
    return {
      ...voteCount,
      race_name: race?.name || 'Unknown Race'
    }
  })
})

// Group vote counts by race
const voteCountsByRace = computed(() => {
  const grouped = {}

  racerVoteCounts.value.forEach((voteCount) => {
    const raceId = voteCount.race_id
    const raceName = voteCount.race_name || 'Unknown Race'

    if (!grouped[raceId]) {
      grouped[raceId] = {
        raceId,
        raceName,
        votes: [],
        totalVotes: 0
      }
    }

    grouped[raceId].votes.push(voteCount)
    grouped[raceId].totalVotes += voteCount.vote_count
  })

  // Convert to array and sort by race name
  return Object.values(grouped).sort((a, b) => a.raceName.localeCompare(b.raceName))
})

// Total votes received across all awards
const totalVotes = computed(() => {
  return racerVoteCounts.value.reduce((total, voteCount) => total + voteCount.vote_count, 0)
})

// Get checkins for this racer from the racer details
const racerCheckins = computed(() => {
  if (!racer.value?.checkins) return []
  if (process.env.NODE_ENV === 'development') {
    console.log('Racer detail: Total checkins:', racer.value.checkins.length)
  }
  return racer.value.checkins.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)) // Most recent first
})

// Load withdrawal status for the active race only
const loadWithdrawalStatus = async () => {
  if (!racer.value?.id || !activeRace.value?.id) return

  try {
    // Only check withdrawal status for the active race
    const isWithdrawnFromRace = await isRacerWithdrawnFromRace(racer.value.id, activeRace.value.id)
    withdrawalStatus.value.set(activeRace.value.id, isWithdrawnFromRace)

    // Trigger reactivity
    withdrawalStatus.value = new Map(withdrawalStatus.value)
  } catch (err) {
    console.error('Error loading withdrawal status:', err)
  }
}

// Check if racer is withdrawn from a specific race
const isWithdrawn = (raceId) => {
  return withdrawalStatus.value.get(raceId) || false
}

// Toggle withdrawal status for a racer in a specific race
const toggleWithdrawal = async (checkin) => {
  if (!checkin.race || processingWithdrawal.value === checkin.race.id) return

  processingWithdrawal.value = checkin.race.id

  try {
    const isCurrentlyWithdrawn = isWithdrawn(checkin.race.id)

    if (isCurrentlyWithdrawn) {
      // Reinstate racer
      await reinstateRacerToRace(racer.value.id, checkin.race.id)

      // Update cache
      withdrawalStatus.value.set(checkin.race.id, false)
      withdrawalStatus.value = new Map(withdrawalStatus.value)

      toast.add({
        severity: 'success',
        summary: 'Racer Reinstated',
        detail: `${racer.value.name} has been reinstated to ${checkin.race.name}`,
        life: 3000
      })
    } else {
      // Preview withdrawal impact before confirming
      const preview = await previewWithdrawalImpact(racer.value.id, checkin.race.id)

      // Check if already withdrawn
      if (preview.already_withdrawn) {
        withdrawalStatus.value.set(checkin.race.id, true)
        withdrawalStatus.value = new Map(withdrawalStatus.value)
        toast.add({
          severity: 'info',
          summary: 'Already Withdrawn',
          detail: `${racer.value.name} is already withdrawn from this race`,
          life: 3000
        })
        processingWithdrawal.value = null
        return
      }

      // Build impact message for confirmation dialog (plain text)
      const impact = preview.impact
      const bracketImpact = preview.bracket_impact
      const impactLines = []

      // Heat impact
      if (impact) {
        const scheduled = impact.scheduled_heats_to_remove || 0
        const inProgress = impact.in_progress_heats_to_continue || 0
        const completed = impact.completed_heats_to_preserve || 0

        if (scheduled > 0) {
          impactLines.push(`• ${scheduled} scheduled heat(s) will be removed`)
        }
        if (inProgress > 0) {
          impactLines.push(`• ${inProgress} in-progress heat(s) will continue`)
        }
        if (completed > 0) {
          impactLines.push(`• ${completed} completed result(s) will be preserved`)
        }

        if (scheduled === 0 && inProgress === 0 && completed === 0) {
          impactLines.push('No heats will be affected.')
        }
      } else {
        impactLines.push('No heats will be affected.')
      }

      // Bracket impact
      if (bracketImpact) {
        const totalForfeits = bracketImpact.total_forfeits || 0
        if (totalForfeits > 0) {
          impactLines.push(`• ${totalForfeits} bracket match(es) will be forfeited`)
        }
      }

      const impactMessage =
        impactLines.join('\n') + '\n\nThis action cannot be easily undone. Continue?'

      // Show confirmation dialog
      confirm.require({
        message: impactMessage,
        header: `Withdraw ${racer.value.name} from ${checkin.race.name}?`,
        icon: 'pi pi-exclamation-triangle',
        acceptLabel: 'Yes, Withdraw',
        rejectLabel: 'Cancel',
        accept: async () => {
          try {
            // Perform the actual withdrawal
            await withdrawRacerFromRace(racer.value.id, checkin.race.id, 'Withdrawn by racer owner')

            // Update cache
            withdrawalStatus.value.set(checkin.race.id, true)
            withdrawalStatus.value = new Map(withdrawalStatus.value)

            toast.add({
              severity: 'info',
              summary: 'Racer Withdrawn',
              detail: `${racer.value.name} has been withdrawn from ${checkin.race.name}`,
              life: 3000
            })
          } catch (err) {
            console.error('Error withdrawing racer:', err)
            toast.add({
              severity: 'error',
              summary: 'Error',
              detail: err.message || 'Failed to withdraw racer',
              life: 5000
            })
          }
        },
        reject: () => {
          // User cancelled, do nothing
        }
      })
    }
  } catch (err) {
    console.error('Error updating racer withdrawal status:', err)
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: err.message || 'Failed to update racer withdrawal status',
      life: 5000
    })
  } finally {
    processingWithdrawal.value = null
  }
}

// Filter photos to only show approved ones
const approvedPhotos = computed(() => {
  if (!racer.value?.photos || !Array.isArray(racer.value.photos)) return []

  return racer.value.photos.filter((photo) => {
    const status = photo.status || 'approved'
    return status === 'approved'
  })
})

// Combine main image and gallery photos for unified gallery experience
const allRacerPhotos = computed(() => {
  const photos = []

  // Add main image first if it exists
  if (racer.value?.image_url) {
    photos.push({
      url: racer.value.image_url
    })
  }

  // Add approved gallery photos
  for (const photo of approvedPhotos.value) {
    photos.push({
      url: photo.url || photo
    })
  }

  return photos
})

// Gallery state
const racerGalleryVisible = ref(false)
const activeRacerImageIndex = ref(0)

// Convert photos for Galleria component
const racerGalleryImages = computed(() => {
  return allRacerPhotos.value
    .filter((photo) => photo && photo.url)
    .map((photo, index) => ({
      itemImageSrc: photo.url,
      alt: `${racer.value?.name} photo ${index + 1}`
    }))
})

// Sort brackets by competition order (match_number)
const sortedBrackets = computed(() => {
  if (!racer.value?.brackets) return []

  return [...racer.value.brackets].sort((a, b) => {
    // Sort by match_number (Challonge suggested play order)
    if (a.match_number && b.match_number) {
      return a.match_number - b.match_number
    }
    // Fallback to created_at if no match_number
    return new Date(a.created_at) - new Date(b.created_at)
  })
})

// Podium finishes - check all races where this racer placed in top 3
const podiumFinishes = ref([])

const fetchPodiumFinishes = async () => {
  if (!racer.value?.id) return

  try {
    // Use the already initialized races from the composable
    let races = allRaces.value
    if (!races || races.length === 0) {
      // If no races, try to initialize them
      await initializeRaces()
      races = allRaces.value
      if (!races || races.length === 0) return
    }

    const finishes = []

    // Check each race for this racer's podium finish
    for (const race of races) {
      try {
        const winnersData = await $fetch(`/api/races/${race.id}/winners`)
        if (winnersData.winners && winnersData.tournament_complete) {
          // Find this racer in the winners
          const finish = winnersData.winners.find(
            (winner) => winner.racer && winner.racer.id === racer.value.id
          )

          if (finish) {
            finishes.push({
              race: race,
              place: finish.place,
              title: finish.title,
              prize: finish.prize
            })
          }
        }
      } catch {
        // Skip races that don't have winner data
      }
    }

    // Sort by race date (most recent first) and then by place
    finishes.sort((a, b) => {
      // Handle date comparison more safely
      const dateA = a.race.race_datetime ? new Date(a.race.race_datetime).getTime() : 0
      const dateB = b.race.race_datetime ? new Date(b.race.race_datetime).getTime() : 0

      // If dates are valid and different, sort by date
      if (!Number.isNaN(dateA) && !Number.isNaN(dateB) && dateA !== dateB) {
        return dateB - dateA // Most recent first
      }
      // Otherwise sort by place (better place first)
      return a.place - b.place
    })

    podiumFinishes.value = finishes
  } catch (err) {
    console.error('Error fetching podium finishes:', err)
  }
}

// Open gallery at specific index
const openRacerGallery = (index) => {
  activeRacerImageIndex.value = index
  racerGalleryVisible.value = true
}

// Helper functions
const formatTime = (time) => {
  if (!time) return 'N/A'
  return `${Number.parseFloat(time).toFixed(2)}s`
}

const formatCheckinTime = (checkinTime) => {
  if (!checkinTime) return 'Unknown time'
  const date = new Date(checkinTime)
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  })
}

const getRaceName = (raceName) => {
  if (!raceName) return 'Unknown Race'
  // Remove bracket type prefixes from race names
  return raceName.replace(/^(double_elimination|single_elimination)/i, '').trim()
}

const getBracketStage = (bracket) => {
  if (!bracket) return 'Unknown'

  // Check for finals bracket
  if (bracket.bracket_group === 'final') {
    return 'Grand Finals'
  }

  // For winner's and loser's brackets, use round number and challonge_round
  const group = bracket.bracket_group === 'winner' ? "Winner's" : "Loser's"
  const roundNum = bracket.round_number || 1

  // Determine stage based on round number (this is an approximation)
  // In double elimination, finals are typically the last rounds
  if (bracket.challonge_round === -1) {
    return `${group} Finals`
  } else if (bracket.challonge_round === -2) {
    return `${group} Semi-Finals`
  } else if (roundNum === 1) {
    return `${group} Round 1`
  } else {
    return `${group} Round ${roundNum}`
  }
}

const getBadgeSeverity = (time, allQualifiers) => {
  if (!time) return 'secondary'

  // Use live qualifiers data if allQualifiers is not provided
  const qualifiers = allQualifiers || racerQualifiers.value
  if (!qualifiers || qualifiers.length === 0) return 'secondary'

  const times = qualifiers.map((q) => Number.parseFloat(q.time)).filter((t) => !Number.isNaN(t))
  if (times.length === 0) return 'secondary'

  const sortedTimes = [...times].sort((a, b) => a - b)
  const currentTime = Number.parseFloat(time)
  const bestTime = sortedTimes[0]
  const worstTime = sortedTimes[sortedTimes.length - 1]

  if (currentTime === bestTime) return 'success'
  if (currentTime === worstTime && times.length > 1) return 'danger'
  if (currentTime <= bestTime * 1.1) return 'info'
  return 'secondary'
}

// Initialize auth and fetch data
onMounted(async () => {
  await authStore.initAuth()

  // Load racer data immediately if cached
  await loadRacer()

  // Initialize composables in parallel if not already done
  const initPromises = []

  // Only initialize if not already loading/loaded
  if (!qualifiersLoading.value && allQualifiers.value.length === 0) {
    initPromises.push(initializeQualifiers())
  }
  if (!checkinsLoading.value && allCheckins.value.length === 0) {
    initPromises.push(initializeCheckins())
  }

  // Always ensure racers composable is initialized for future navigation
  initPromises.push(initializeRacers())

  // Initialize races data for vote counts race names
  initPromises.push(initializeRaces())

  // Initialize awards for vote counts
  initPromises.push(initializeAwards())

  // Run initialization in background
  if (initPromises.length > 0) {
    Promise.all(initPromises)
      .then(() => {
        // Load withdrawal status after checkins are loaded
        nextTick(() => {
          loadWithdrawalStatus()
        })
      })
      .catch((err) => {
        if (process.env.NODE_ENV === 'development') {
          console.warn('Background initialization failed:', err)
        }
      })
  }
})

// Watch for changes in activeRace to reload withdrawal status
watch(
  [activeRace, racer],
  () => {
    if (activeRace.value?.id && racer.value?.id) {
      loadWithdrawalStatus()
    }
  },
  { deep: true }
)

// Note: Removed cleanup calls to prevent composable reloading on navigation
// Composables will manage their own lifecycle and subscriptions

useHead({
  title: computed(() =>
    racer.value
      ? `${racer.value.name} - The Great Holyoke Brick Race`
      : 'Racer - The Great Holyoke Brick Race'
  )
})
</script>

<style scoped>
/* Custom gallery styling */
:deep(.p-galleria-item) {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
}

:deep(.p-galleria-item-nav) {
  background: rgba(0, 0, 0, 0.6);
  color: white;
  border-radius: 50%;
  width: 3rem;
  height: 3rem;
  transition: all 0.3s ease;
}

:deep(.p-galleria-item-nav:hover) {
  background: rgba(0, 0, 0, 0.8);
  transform: scale(1.1);
}

:deep(.p-galleria-item-nav:focus) {
  background: rgba(59, 130, 246, 0.8);
  outline: 3px solid #3b82f6;
  outline-offset: 2px;
  transform: scale(1.1);
}

:deep(.p-galleria-item-nav-prev) {
  left: 1rem;
}

:deep(.p-galleria-item-nav-next) {
  right: 1rem;
}

:deep(.p-galleria-close) {
  background: rgba(0, 0, 0, 0.6);
  color: white;
  border-radius: 50%;
  width: 3rem;
  height: 3rem;
  top: 1rem;
  right: 1rem;
  transition: all 0.3s ease;
}

:deep(.p-galleria-close:hover) {
  background: rgba(0, 0, 0, 0.8);
  transform: scale(1.1);
}
</style>
