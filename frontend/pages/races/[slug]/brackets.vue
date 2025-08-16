<template>
  <div class="min-h-screen bg-white dark:bg-gray-900">
    <div class="container mx-auto px-4 py-8">
      <!-- Breadcrumb Navigation -->
      <BreadcrumbWrapper :items="breadcrumbItems" />

      <!-- Loading State -->
      <div v-if="loading" class="flex justify-center py-12">
        <ProgressSpinner />
      </div>

      <!-- Error State -->
      <div v-else-if="error" class="text-center py-12">
        <i class="pi pi-exclamation-triangle text-6xl text-red-400 mb-4" />
        <h2 class="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-2">Race Not Found</h2>
        <p class="text-gray-600 dark:text-gray-300 mb-6">
          The race you're looking for doesn't exist or has been removed.
        </p>
        <NuxtLink to="/races">
          <Button severity="primary">
            <i class="pi pi-arrow-left mr-2" />
            Back to All Races
          </Button>
        </NuxtLink>
      </div>

      <!-- Access Denied -->
      <div v-else-if="!authStore.isRaceAdmin" class="text-center py-12">
        <i class="pi pi-ban text-6xl text-red-400 mb-4" />
        <h2 class="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-2">Access Denied</h2>
        <p class="text-gray-600 dark:text-gray-300 mb-6">
          You need race admin privileges to manage race brackets.
        </p>
        <NuxtLink to="/races">
          <Button severity="primary">
            <i class="pi pi-arrow-left mr-2" />
            Back to All Races
          </Button>
        </NuxtLink>
      </div>

      <!-- Brackets Interface -->
      <div v-else-if="race">
        <!-- Header -->
        <div class="mb-8">
          <div class="flex flex-col md:flex-row md:items-start md:justify-between">
            <div>
              <h1 class="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                Brackets: {{ race.name }}
              </h1>
              <div class="flex items-center gap-4 text-gray-600 dark:text-gray-300">
                <span>{{
                  new Date(race.date).toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })
                }}</span>
                <span class="font-semibold text-purple-600 dark:text-purple-400"
                  >{{ brackets.length }} bracket races</span
                >
              </div>
            </div>
            <div class="mt-4 md:mt-0">
              <AdminMenu :race-id="race?.slug || race?.id" />
            </div>
          </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <!-- Main Content -->
          <div class="lg:col-span-2 space-y-6">
            <!-- Bracket Generation Controls -->
            <Card>
              <template #title>
                <h2 class="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <i class="pi pi-sitemap" />
                  Generate Brackets
                </h2>
              </template>
              <template #content>
                <div class="space-y-4">
                  <p class="text-gray-600 dark:text-gray-300">
                    Create elimination brackets based on qualifying times. Fastest racers will be
                    paired with slowest racers.
                  </p>

                  <Fieldset legend="Bracket Generation Options" :toggleable="true">
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label
                          class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                        >
                          Bracket Type
                        </label>
                        <Select
                          v-model="selectedBracketType"
                          :options="bracketTypeOptions"
                          option-label="label"
                          option-value="value"
                          placeholder="Select bracket type"
                          class="w-full"
                        />
                      </div>

                      <div>
                        <label
                          class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                        >
                          Number of racers to include
                        </label>
                        <Select
                          v-model="initialRacerCount"
                          :options="racerCountOptions"
                          option-label="label"
                          option-value="value"
                          placeholder="Select number of racers"
                          class="w-full"
                        />
                      </div>

                      <div class="flex items-end">
                        <Button
                          :disabled="!canGenerateBrackets || generatingBrackets"
                          :loading="generatingBrackets"
                          severity="secondary"
                          class="w-full"
                          @click="generateBrackets"
                        >
                          <i class="pi pi-play mr-2" />
                          Generate Brackets
                        </Button>
                      </div>
                    </div>
                  </Fieldset>

                  <!-- Next Round Generation -->
                  <div v-if="canGenerateNextRound" class="border-t pt-4">
                    <div class="flex items-center justify-between">
                      <div>
                        <h4 class="font-medium text-gray-900 dark:text-white">Next Round</h4>
                        <p class="text-sm text-gray-600 dark:text-gray-300">
                          All {{ completedBrackets }} bracket races completed - generate next round
                        </p>
                      </div>
                      <Button
                        :loading="generatingNextRound"
                        severity="success"
                        @click="generateNextRound"
                      >
                        <i class="pi pi-forward mr-2" />
                        Generate Next Round
                      </Button>
                    </div>
                  </div>

                  <!-- Round Progress Indicator -->
                  <div v-else-if="brackets.length > 0" class="border-t pt-4">
                    <div
                      class="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded p-3"
                    >
                      <div class="flex items-center gap-2 mb-2">
                        <i class="pi pi-clock text-blue-600 dark:text-blue-400" />
                        <h4 class="font-medium text-blue-900 dark:text-blue-200">
                          Current Round Progress
                        </h4>
                      </div>
                      <p class="text-sm text-blue-700 dark:text-blue-300">
                        {{ completedBrackets }} of {{ brackets.length }} bracket races completed.
                        <span
                          v-if="tiedBrackets.length > 0"
                          class="block mt-1 text-red-700 dark:text-red-400 font-medium"
                        >
                          ⚠️ {{ tiedBrackets.length }} tied bracket(s) need to be resolved before
                          advancing.
                        </span>
                        <span
                          v-else-if="completedBrackets === brackets.length && winners.length >= 2"
                        >
                          ✅ Ready to generate next round with {{ winners.length }} winners.
                        </span>
                        <span v-else-if="completedBrackets === brackets.length">
                          Complete all races to advance to the next round.
                        </span>
                        <span v-else> Complete remaining races to advance to the next round. </span>
                      </p>
                      <ProgressBar
                        :value="(completedBrackets / brackets.length) * 100"
                        class="mt-3"
                        :show-value="false"
                        :pt="{ root: { style: 'height: 8px' } }"
                      />
                    </div>
                  </div>
                </div>

                <div
                  v-if="!canGenerateBrackets"
                  class="text-sm text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded p-3"
                >
                  <i class="pi pi-exclamation-triangle mr-2" />
                  {{ generateBracketsMessage }}
                </div>

                <!-- Tournament Progress -->
                <div
                  v-if="brackets.length > 0"
                  class="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4"
                >
                  <h4
                    class="font-semibold text-blue-900 dark:text-blue-200 mb-3 flex items-center gap-2"
                  >
                    <i class="pi pi-chart-line" />
                    Tournament Progress
                  </h4>
                  <div
                    v-for="bracketType in ['Fastest', 'Slowest']"
                    :key="bracketType"
                    class="mb-3 last:mb-0"
                  >
                    <div v-if="totalBracketsByType[bracketType] > 0" class="space-y-2">
                      <div class="flex items-center justify-between">
                        <span class="font-medium text-gray-700 dark:text-gray-300"
                          >{{ bracketType }} Tournament</span
                        >
                        <span class="text-sm text-gray-600 dark:text-gray-400">
                          {{ completedBracketsByType[bracketType] }}/{{
                            totalBracketsByType[bracketType]
                          }}
                          complete
                        </span>
                      </div>
                      <ProgressBar
                        :value="
                          (completedBracketsByType[bracketType] /
                            totalBracketsByType[bracketType]) *
                          100
                        "
                        :show-value="false"
                        :pt="{ root: { style: 'height: 8px' } }"
                      />
                      <div class="text-sm text-gray-600 dark:text-gray-400">
                        <span
                          v-if="
                            winners.filter((w) => {
                              const b = brackets.find((br) => br.id === w.bracket_id)
                              return b && b.bracket_type === bracketType
                            }).length === 1
                          "
                        >
                          🏆 Champion determined!
                        </span>
                        <span
                          v-else-if="
                            completedBracketsByType[bracketType] ===
                            totalBracketsByType[bracketType]
                          "
                        >
                          {{
                            winners.filter((w) => {
                              const b = brackets.find((br) => br.id === w.bracket_id)
                              return b && b.bracket_type === bracketType
                            }).length
                          }}
                          winners - ready for next round
                        </span>
                        <span v-else>
                          {{
                            totalBracketsByType[bracketType] - completedBracketsByType[bracketType]
                          }}
                          brackets remaining
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </template>
            </Card>

            <!-- Tournament Results Podium -->
            <Card v-if="tournamentResults.Fastest || tournamentResults.Slowest">
              <template #title>
                <h2
                  class="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3"
                >
                  <i class="pi pi-crown text-yellow-500 text-2xl" />
                  Tournament Results
                </h2>
              </template>
              <template #content>
                <div v-for="(result, bracketType) in tournamentResults" :key="bracketType">
                  <div v-if="result" class="mb-8 last:mb-0">
                    <h3 class="text-xl font-bold text-center mb-6 text-gray-800 dark:text-gray-200">
                      {{ bracketType }} Tournament Podium
                    </h3>

                    <!-- Podium Display -->
                    <div class="flex items-end justify-center gap-4 mb-6">
                      <!-- 2nd Place -->
                      <div v-if="result.second" class="text-center">
                        <div
                          class="bg-gradient-to-br from-gray-200 to-gray-300 border-2 border-gray-400 rounded-xl p-4 shadow-lg mb-2"
                        >
                          <div class="text-4xl mb-2">🥈</div>
                          <NuxtLink
                            :to="`/racers/${result.second.racer_id}`"
                            class="text-lg font-bold text-gray-800 dark:text-gray-200 hover:text-blue-600 hover:underline transition-colors duration-200"
                          >
                            {{ result.second.racer_name }}
                          </NuxtLink>
                          <div
                            class="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-2 py-1 rounded text-sm font-semibold"
                          >
                            #{{ result.second.racer_number }}
                          </div>
                          <div class="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            {{ formatTime(result.second.time) }}
                          </div>
                        </div>
                        <div
                          class="bg-gray-300 h-16 w-20 rounded-t-lg flex items-center justify-center"
                        >
                          <span class="font-bold text-gray-700">2nd</span>
                        </div>
                      </div>

                      <!-- 1st Place (Champion) -->
                      <div class="text-center">
                        <div
                          class="bg-gradient-to-br from-yellow-200 to-orange-200 border-2 border-yellow-400 rounded-xl p-6 shadow-2xl mb-2"
                        >
                          <div class="text-6xl mb-3">🏆</div>
                          <NuxtLink
                            :to="`/racers/${result.first.racer_id}`"
                            class="text-2xl font-bold text-gray-900 dark:text-gray-100 hover:text-blue-600 hover:underline transition-colors duration-200 mb-1 block"
                          >
                            {{ result.first.racer_name }}
                          </NuxtLink>
                          <div
                            class="bg-yellow-200 text-yellow-800 px-3 py-1 rounded-full text-lg font-bold mb-2"
                          >
                            #{{ result.first.racer_number }}
                          </div>
                          <div class="text-lg font-bold text-blue-600 dark:text-blue-400">
                            {{ formatTime(result.first.winning_time) }}
                          </div>
                          <div class="mt-2">
                            <span
                              class="bg-gradient-to-r from-yellow-400 to-orange-400 text-white px-3 py-1 rounded-full text-sm font-bold"
                            >
                              CHAMPION
                            </span>
                          </div>
                        </div>
                        <div
                          class="bg-gradient-to-r from-yellow-400 to-orange-400 h-24 w-24 rounded-t-lg flex items-center justify-center"
                        >
                          <span class="font-bold text-white text-lg">1st</span>
                        </div>
                      </div>

                      <!-- 3rd Place -->
                      <div v-if="result.third" class="text-center">
                        <div
                          class="bg-gradient-to-br from-orange-200 to-orange-300 border-2 border-orange-400 rounded-xl p-4 shadow-lg mb-2"
                        >
                          <div class="text-4xl mb-2">🥉</div>
                          <NuxtLink
                            :to="`/racers/${result.third.racer_id}`"
                            class="text-lg font-bold text-gray-800 dark:text-gray-200 hover:text-blue-600 hover:underline transition-colors duration-200"
                          >
                            {{ result.third.racer_name }}
                          </NuxtLink>
                          <div
                            class="bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 px-2 py-1 rounded text-sm font-semibold"
                          >
                            #{{ result.third.racer_number }}
                          </div>
                          <div class="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            {{ formatTime(result.third.time) }}
                          </div>
                        </div>
                        <div
                          class="bg-orange-400 h-12 w-20 rounded-t-lg flex items-center justify-center"
                        >
                          <span class="font-bold text-white">3rd</span>
                        </div>
                      </div>
                    </div>

                    <!-- Tournament Type Badge -->
                    <div class="text-center">
                      <span
                        class="bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300 px-4 py-2 rounded-full text-lg font-bold"
                      >
                        {{ bracketType }} Tournament Complete
                      </span>
                    </div>
                  </div>
                </div>
              </template>
            </Card>

            <!-- Tournament Bracket Visualization -->
            <Card v-if="raceBrackets.length > 0" class="mb-6">
              <template #title>
                <h2 class="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <i class="pi pi-sitemap" />
                  Tournament Bracket Tree
                </h2>
              </template>
              <template #content>
                <div class="overflow-x-auto">
                  <OrganizationChart
                    :value="bracketTreeData"
                    :collapsible="false"
                    class="tournament-bracket"
                  >
                    <template #default="{ node }">
                      <div
                        class="bracket-node p-3 rounded-lg border-2 text-center min-w-[120px]"
                        :class="{
                          'border-blue-400 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-600':
                            node.type === 'bracket',
                          'border-green-400 bg-green-50 dark:bg-green-900/20 dark:border-green-600':
                            node.type === 'winner',
                          'border-gray-400 bg-gray-50 dark:bg-gray-800 dark:border-gray-600':
                            node.type === 'pending'
                        }"
                      >
                        <div v-if="node.type === 'bracket'" class="space-y-1">
                          <div class="text-xs font-semibold text-gray-600 dark:text-gray-400">
                            {{ node.label }}
                          </div>
                          <div class="text-sm">
                            <div class="font-medium text-gray-900 dark:text-white">
                              {{ node.track1_name || 'TBD' }}
                            </div>
                            <div
                              v-if="node.track1_time"
                              class="text-xs text-blue-600 dark:text-blue-400"
                            >
                              {{ formatTime(node.track1_time) }}
                            </div>
                          </div>
                          <div class="text-xs text-gray-500 dark:text-gray-400">VS</div>
                          <div class="text-sm">
                            <div class="font-medium text-gray-900 dark:text-white">
                              {{ node.track2_name || 'TBD' }}
                            </div>
                            <div
                              v-if="node.track2_time"
                              class="text-xs text-red-600 dark:text-red-400"
                            >
                              {{ formatTime(node.track2_time) }}
                            </div>
                          </div>
                          <div
                            v-if="node.winner"
                            class="mt-2 text-xs font-bold text-green-600 dark:text-green-400"
                          >
                            🏆 {{ node.winner }}
                          </div>
                        </div>
                        <div v-else-if="node.type === 'winner'" class="space-y-1">
                          <div class="text-xs font-semibold text-green-700 dark:text-green-400">
                            {{ node.label }}
                          </div>
                          <div class="font-bold text-green-800 dark:text-green-300">
                            {{ node.racer_name }}
                          </div>
                          <div class="text-xs text-green-600 dark:text-green-400">
                            {{ formatTime(node.time) }}
                          </div>
                        </div>
                        <div v-else class="text-gray-500 dark:text-gray-400">
                          <div class="text-xs font-semibold">{{ node.label }}</div>
                          <div class="text-sm">{{ node.message || 'Pending' }}</div>
                        </div>
                      </div>
                    </template>
                  </OrganizationChart>
                </div>
              </template>
            </Card>

            <!-- Current Brackets -->
            <Card v-if="raceBrackets.length > 0">
              <template #title>
                <h2 class="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <i class="pi pi-trophy" />
                  Current Brackets
                </h2>
              </template>
              <template #content>
                <div class="space-y-4">
                  <!-- Clear Brackets Button -->
                  <div class="flex justify-end">
                    <Button
                      :disabled="clearingBrackets"
                      :loading="clearingBrackets"
                      severity="danger"
                      size="small"
                      @click="clearBrackets"
                    >
                      <i v-if="!clearingBrackets" class="pi pi-trash mr-2" />
                      Clear All Brackets
                    </Button>
                  </div>

                  <!-- Bracket List -->
                  <div class="space-y-4">
                    <div
                      v-for="(bracket, index) in raceBrackets"
                      :key="bracket.id"
                      class="bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 border border-purple-200 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300"
                    >
                      <div class="flex items-center justify-between mb-4">
                        <div class="flex items-center gap-3">
                          <div
                            class="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-3 py-1 rounded-full text-sm font-bold"
                          >
                            {{ bracket.bracket_type }}
                          </div>
                          <h3 class="text-xl font-bold text-gray-900">Bracket #{{ index + 1 }}</h3>
                        </div>
                        <Button
                          v-tooltip.top="'Delete Bracket'"
                          :disabled="processing === bracket.id"
                          :loading="processing === bracket.id"
                          severity="danger"
                          size="small"
                          rounded
                          text
                          icon="pi pi-times"
                          @click="confirmDeleteBracket(bracket.id)"
                        />
                      </div>

                      <div class="flex items-center gap-6">
                        <!-- Track 1 -->
                        <div
                          class="flex-1 bg-white rounded-xl p-5 border-2 border-blue-200 shadow-md hover:shadow-lg transition-shadow duration-200"
                        >
                          <div class="text-center">
                            <div
                              class="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-semibold mb-3 inline-block"
                            >
                              <i class="pi pi-flag mr-1" />
                              Track 1
                            </div>
                            <div v-if="bracket.track1_racer_name">
                              <NuxtLink
                                :to="`/racers/${bracket.track1_racer_id}`"
                                class="font-bold text-xl text-gray-900 hover:text-blue-600 hover:underline transition-colors duration-200 mb-1 block"
                              >
                                {{ bracket.track1_racer_name }}
                              </NuxtLink>
                              <div
                                class="bg-blue-50 text-blue-700 px-2 py-1 rounded-lg text-sm font-semibold mb-3 inline-block"
                              >
                                #{{ bracket.track1_racer_number }}
                              </div>

                              <!-- Time Display or Input -->
                              <div
                                v-if="bracket.track1_time && !editingTime[bracket.id + '_track1']"
                                class="mt-2 relative"
                              >
                                <Button
                                  v-tooltip.top="'Edit Time'"
                                  class="absolute -top-2 -right-2"
                                  severity="primary"
                                  size="small"
                                  rounded
                                  text
                                  icon="pi pi-pencil"
                                  @click="editTime(bracket, 1)"
                                />
                                <p class="text-lg font-bold text-blue-600">
                                  {{ formatTime(bracket.track1_time) }}
                                </p>
                              </div>
                              <div
                                v-else-if="
                                  bracket.track1_time && editingTime[bracket.id + '_track1']
                                "
                                class="mt-2"
                              >
                                <div class="flex items-center gap-2 justify-center">
                                  <InputNumber
                                    ref="track1EditInput"
                                    v-model="bracketTimes[bracket.id + '_track1']"
                                    mode="decimal"
                                    :min-fraction-digits="0"
                                    :max-fraction-digits="3"
                                    :min="0"
                                    :step="0.001"
                                    placeholder="0.000"
                                    class="w-20"
                                    :input-style="{
                                      color: '#374151',
                                      backgroundColor: 'white',
                                      border: '1px solid #3b82f6',
                                      borderRadius: '0.375rem',
                                      padding: '0.25rem 0.5rem',
                                      textAlign: 'center',
                                      fontSize: '0.875rem',
                                      width: '80px',
                                      maxWidth: '80px',
                                      boxSizing: 'border-box'
                                    }"
                                    @keyup.enter="updateTime(bracket, 1)"
                                  />
                                  <Button
                                    :disabled="
                                      !bracketTimes[bracket.id + '_track1'] ||
                                      processing === `${bracket.id}_track1_edit`
                                    "
                                    :loading="processing === `${bracket.id}_track1_edit`"
                                    severity="success"
                                    size="small"
                                    icon="pi pi-check"
                                    @click="updateTime(bracket, 1)"
                                  />
                                  <Button
                                    severity="secondary"
                                    size="small"
                                    icon="pi pi-times"
                                    @click="cancelEdit(bracket, 1)"
                                  />
                                </div>
                              </div>
                              <div v-else class="mt-3">
                                <div class="bg-blue-50 rounded-lg p-3">
                                  <div class="flex items-center gap-2 justify-center">
                                    <InputNumber
                                      v-model="bracketTimes[bracket.id + '_track1']"
                                      mode="decimal"
                                      :min-fraction-digits="0"
                                      :max-fraction-digits="3"
                                      :min="0"
                                      :step="0.001"
                                      placeholder="0.000"
                                      class="w-24"
                                      :input-style="{
                                        color: '#374151',
                                        backgroundColor: 'white',
                                        border: '2px solid #3b82f6',
                                        borderRadius: '0.5rem',
                                        padding: '0.375rem 0.75rem',
                                        textAlign: 'center',
                                        fontSize: '0.875rem',
                                        fontWeight: '600',
                                        width: '90px',
                                        maxWidth: '90px',
                                        boxSizing: 'border-box'
                                      }"
                                      @keyup.enter="recordTime(bracket, 1)"
                                    />
                                    <Button
                                      :disabled="
                                        !bracketTimes[bracket.id + '_track1'] ||
                                        processing === `${bracket.id}_track1`
                                      "
                                      :loading="processing === `${bracket.id}_track1`"
                                      severity="primary"
                                      @click="recordTime(bracket, 1)"
                                    >
                                      <i v-if="!processing" class="pi pi-stopwatch mr-1" />
                                      Record
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            </div>
                            <div v-else class="text-gray-400 py-8">
                              <i class="pi pi-user text-2xl mb-2 block" />
                              <p class="font-medium text-lg">TBD</p>
                              <p class="text-xs">Awaiting Assignment</p>
                            </div>
                          </div>
                        </div>

                        <!-- VS Divider -->
                        <div class="flex items-center justify-center flex-shrink-0">
                          <div
                            class="bg-gradient-to-br from-purple-500 to-pink-500 text-white rounded-full w-16 h-16 flex items-center justify-center shadow-lg transform hover:scale-105 transition-transform duration-200"
                          >
                            <span class="font-bold text-lg">VS</span>
                          </div>
                        </div>

                        <!-- Track 2 -->
                        <div
                          class="flex-1 bg-white rounded-xl p-5 border-2 border-red-200 shadow-md hover:shadow-lg transition-shadow duration-200"
                        >
                          <div class="text-center">
                            <div
                              class="bg-red-100 text-red-700 px-3 py-1 rounded-full text-sm font-semibold mb-3 inline-block"
                            >
                              <i class="pi pi-flag mr-1" />
                              Track 2
                            </div>
                            <div v-if="bracket.track2_racer_name">
                              <NuxtLink
                                :to="`/racers/${bracket.track2_racer_id}`"
                                class="font-bold text-xl text-gray-900 hover:text-blue-600 hover:underline transition-colors duration-200 mb-1 block"
                              >
                                {{ bracket.track2_racer_name }}
                              </NuxtLink>
                              <div
                                class="bg-red-50 text-red-700 px-2 py-1 rounded-lg text-sm font-semibold mb-3 inline-block"
                              >
                                #{{ bracket.track2_racer_number }}
                              </div>

                              <!-- Time Display or Input -->
                              <div
                                v-if="bracket.track2_time && !editingTime[bracket.id + '_track2']"
                                class="mt-2 relative"
                              >
                                <Button
                                  v-tooltip.top="'Edit Time'"
                                  class="absolute -top-2 -right-2"
                                  severity="danger"
                                  size="small"
                                  rounded
                                  text
                                  icon="pi pi-pencil"
                                  @click="editTime(bracket, 2)"
                                />
                                <p class="text-lg font-bold text-red-600">
                                  {{ formatTime(bracket.track2_time) }}
                                </p>
                              </div>
                              <div
                                v-else-if="
                                  bracket.track2_time && editingTime[bracket.id + '_track2']
                                "
                                class="mt-2"
                              >
                                <div class="flex items-center gap-2 justify-center">
                                  <InputNumber
                                    ref="track2EditInput"
                                    v-model="bracketTimes[bracket.id + '_track2']"
                                    mode="decimal"
                                    :min-fraction-digits="0"
                                    :max-fraction-digits="3"
                                    :min="0"
                                    :step="0.001"
                                    placeholder="0.000"
                                    class="w-20"
                                    :input-style="{
                                      color: '#374151',
                                      backgroundColor: 'white',
                                      border: '1px solid #ef4444',
                                      borderRadius: '0.375rem',
                                      padding: '0.25rem 0.5rem',
                                      textAlign: 'center',
                                      fontSize: '0.875rem',
                                      width: '80px',
                                      maxWidth: '80px',
                                      boxSizing: 'border-box'
                                    }"
                                    @keyup.enter="updateTime(bracket, 2)"
                                  />
                                  <Button
                                    :disabled="
                                      !bracketTimes[bracket.id + '_track2'] ||
                                      processing === `${bracket.id}_track2_edit`
                                    "
                                    :loading="processing === `${bracket.id}_track2_edit`"
                                    severity="danger"
                                    size="small"
                                    icon="pi pi-check"
                                    @click="updateTime(bracket, 2)"
                                  />
                                  <Button
                                    severity="secondary"
                                    size="small"
                                    icon="pi pi-times"
                                    @click="cancelEdit(bracket, 2)"
                                  />
                                </div>
                              </div>
                              <div v-else class="mt-3">
                                <div class="bg-red-50 rounded-lg p-3">
                                  <div class="flex items-center gap-2 justify-center">
                                    <InputNumber
                                      v-model="bracketTimes[bracket.id + '_track2']"
                                      mode="decimal"
                                      :min-fraction-digits="0"
                                      :max-fraction-digits="3"
                                      :min="0"
                                      :step="0.001"
                                      placeholder="0.000"
                                      class="w-24"
                                      :input-style="{
                                        color: '#374151',
                                        backgroundColor: 'white',
                                        border: '2px solid #ef4444',
                                        borderRadius: '0.5rem',
                                        padding: '0.375rem 0.75rem',
                                        textAlign: 'center',
                                        fontSize: '0.875rem',
                                        fontWeight: '600',
                                        width: '90px',
                                        maxWidth: '90px',
                                        boxSizing: 'border-box'
                                      }"
                                      @keyup.enter="recordTime(bracket, 2)"
                                    />
                                    <Button
                                      :disabled="
                                        !bracketTimes[bracket.id + '_track2'] ||
                                        processing === `${bracket.id}_track2`
                                      "
                                      :loading="processing === `${bracket.id}_track2`"
                                      severity="danger"
                                      @click="recordTime(bracket, 2)"
                                    >
                                      <i v-if="!processing" class="pi pi-stopwatch mr-1" />
                                      Record
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            </div>
                            <div v-else class="text-gray-400 py-8">
                              <i class="pi pi-user text-2xl mb-2 block" />
                              <p class="font-medium text-lg">TBD</p>
                              <p class="text-xs">Awaiting Assignment</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      <!-- Winner Display -->
                      <div
                        v-if="bracket.track1_time && bracket.track2_time"
                        class="mt-6 text-center"
                      >
                        <div
                          class="bg-gradient-to-r from-yellow-100 to-orange-100 border-2 border-yellow-300 rounded-xl p-4 relative shadow-lg"
                        >
                          <div class="flex items-center justify-center gap-2 mb-2">
                            <i class="pi pi-trophy text-yellow-600 text-lg" />
                            <p class="text-sm font-bold text-yellow-800 uppercase tracking-wide">
                              Winner
                            </p>
                          </div>
                          <p class="font-bold text-xl text-yellow-900">
                            {{ getWinner(bracket) }}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </template>
            </Card>

            <!-- No Brackets Message -->
            <Card v-else>
              <template #content>
                <div class="text-center py-12">
                  <i class="pi pi-sitemap text-6xl text-gray-300 mb-4" />
                  <h3 class="text-xl font-semibold text-gray-800 mb-2">No Brackets Generated</h3>
                  <p class="text-gray-600 mb-4">
                    Generate elimination brackets based on qualifying times to start the tournament.
                  </p>
                </div>
              </template>
            </Card>
          </div>

          <!-- Sidebar -->
          <div class="space-y-6">
            <!-- Qualifying Summary -->
            <Card>
              <template #title>
                <h3 class="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <i class="pi pi-list" />
                  Qualifying Results
                </h3>
              </template>
              <template #content>
                <div v-if="qualifiedRacers.length > 0" class="space-y-2 max-h-80 overflow-y-auto">
                  <div
                    v-for="(racer, index) in qualifiedRacers"
                    :key="racer.racer_id"
                    class="flex items-center justify-between p-2 rounded-lg"
                    :class="{
                      'bg-yellow-50 border border-yellow-200': index === 0,
                      'bg-gray-50 border border-gray-200': index > 0
                    }"
                  >
                    <div class="flex items-center gap-2">
                      <span
                        class="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center text-xs font-bold"
                      >
                        {{ index + 1 }}
                      </span>
                      <div>
                        <p class="font-medium text-sm">{{ racer.racer_name }}</p>
                        <p class="text-xs text-gray-500">#{{ racer.racer_number }}</p>
                      </div>
                    </div>
                    <p class="font-bold text-sm text-blue-600">{{ formatTime(racer.best_time) }}</p>
                  </div>
                </div>
                <div v-else class="text-center py-6 text-gray-500">
                  <i class="pi pi-clock text-3xl mb-2" />
                  <p>No qualifying times yet</p>
                </div>
              </template>
            </Card>

            <!-- Bracket Stats -->
            <Card>
              <template #title>Bracket Stats</template>
              <template #content>
                <div class="space-y-4">
                  <div class="flex justify-between">
                    <span class="text-gray-600">Qualified Racers</span>
                    <span class="font-semibold">{{ qualifiedRacers.length }}</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-gray-600">Possible Brackets</span>
                    <span class="font-semibold">{{ Math.floor(qualifiedRacers.length / 2) }}</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-gray-600">Generated Brackets</span>
                    <span class="font-semibold">{{ raceBrackets.length }}</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-gray-600">Completed Races</span>
                    <span class="font-semibold">{{ completedBrackets }}</span>
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
import { useToast } from 'primevue/usetoast'
import { useConfirm } from 'primevue/useconfirm'

const route = useRoute()
const authStore = useAuthStore()
const supabase = useSupabaseClient()
const toast = useToast()
const confirm = useConfirm()
const raceId = route.params.slug

// Use singleton composables
const { races, loading: racesLoading, initialize: initializeRaces, getRaceBySlug, fetchRaceBySlug } = useRaces()
const {
  qualifiers,
  loading: qualifiersLoading,
  initialize: initializeQualifiers
} = useQualifiers(raceId)
const {
  brackets,
  getBracketsForRace,
  loading: bracketsLoading,
  initialize: initializeBrackets
} = useBrackets()

// Reactive data
const race = ref(null)
const raceBrackets = computed(() => race.value ? getBracketsForRace(race.value.id) : [])
const raceQualifiers = computed(() => qualifiers.value)
const loading = computed(
  () => racesLoading.value || qualifiersLoading.value || bracketsLoading.value
)
const error = ref(null)
const processing = ref(null)
const generatingBrackets = ref(false)
const generatingNextRound = ref(false)
const clearingBrackets = ref(false)
const selectedBracketType = ref('Fastest')
const initialRacerCount = ref(8)
const bracketTimes = ref({})
const editingTime = ref({})

// Breadcrumb navigation
const breadcrumbItems = computed(() => [
  { label: 'Home', url: '/' },
  { label: 'Races', url: '/races' },
  { label: race.value?.name || 'Race', url: `/races/${route.params.slug}` },
  { label: 'Brackets' } // Current page, no navigation
])

// Dropdown options
const bracketTypeOptions = [
  { label: 'Fastest (Winner advances)', value: 'Fastest' },
  { label: 'Slowest (Loser advances - consolation)', value: 'Slowest' }
]

const racerCountOptions = computed(() =>
  possibleRacerCounts.value.map((count) => ({
    label: `${count} racers (${Math.floor(count / 2)} brackets)`,
    value: count
  }))
)

// Computed properties
const qualifiedRacers = computed(() => {
  const racerBestTimes = {}

  // Calculate best time for each racer
  raceQualifiers.value.forEach((q) => {
    if (!racerBestTimes[q.racer_id] || q.time < racerBestTimes[q.racer_id].best_time) {
      racerBestTimes[q.racer_id] = {
        racer_id: q.racer_id,
        racer_name: q.racer_name,
        racer_number: q.racer_number,
        best_time: q.time
      }
    }
  })

  return Object.values(racerBestTimes).sort((a, b) => a.best_time - b.best_time)
})

const canGenerateBrackets = computed(() => {
  return qualifiedRacers.value.length >= 2
})

const generateBracketsMessage = computed(() => {
  if (qualifiedRacers.value.length === 0) {
    return 'No qualifying times recorded yet. Racers need to complete qualifying runs first.'
  }
  if (qualifiedRacers.value.length === 1) {
    return 'Only one racer has qualifying times. Need at least 2 racers to generate brackets.'
  }
  return ''
})

const completedBrackets = computed(() => {
  return raceBrackets.value.filter((b) => b.track1_time && b.track2_time).length
})

const completedBracketsByType = computed(() => {
  const byType = { Fastest: 0, Slowest: 0 }
  raceBrackets.value.forEach((b) => {
    if (b.track1_time && b.track2_time && b.bracket_type) {
      byType[b.bracket_type]++
    }
  })
  return byType
})

const totalBracketsByType = computed(() => {
  const byType = { Fastest: 0, Slowest: 0 }
  raceBrackets.value.forEach((b) => {
    if (b.bracket_type) {
      byType[b.bracket_type]++
    }
  })
  return byType
})

// Tournament bracket tree data for visualization
const bracketTreeData = computed(() => {
  if (!raceBrackets.value || raceBrackets.value.length === 0) return null

  // Group brackets by type
  const bracketsByType = { Fastest: [], Slowest: [] }
  raceBrackets.value.forEach((bracket) => {
    if (bracket.bracket_type) {
      bracketsByType[bracket.bracket_type].push(bracket)
    }
  })

  // Create tree structure for each tournament type
  const children = []

  Object.keys(bracketsByType).forEach((bracketType) => {
    const typeBrackets = bracketsByType[bracketType]
    if (typeBrackets.length === 0) return

    // Sort brackets by creation time to determine rounds
    const sortedBrackets = [...typeBrackets].sort(
      (a, b) => new Date(a.created_at) - new Date(b.created_at)
    )

    // Build tree for this tournament type
    const typeTree = buildTournamentTree(sortedBrackets, bracketType)
    if (typeTree) {
      children.push(typeTree)
    }
  })

  // Root node
  return {
    key: 'tournament-root',
    type: 'root',
    label: 'Tournament',
    children: children
  }
})

const buildTournamentTree = (brackets, bracketType) => {
  if (!brackets || brackets.length === 0) return null

  // Check if tournament is complete
  const typeWinners = (winners.value || []).filter((w) => {
    const bracket = brackets.find((b) => b.id === w.bracket_id)
    return bracket && bracket.bracket_type === bracketType
  })

  const isComplete = typeWinners.length === 1
  const champion = isComplete ? typeWinners[0] : null

  const bracketNodes = brackets.map((bracket, index) => ({
    key: `bracket-${bracket.id}`,
    type: 'bracket',
    label: `Bracket #${index + 1}`,
    track1_name: bracket.track1_racer_name,
    track1_time: bracket.track1_time,
    track2_name: bracket.track2_racer_name,
    track2_time: bracket.track2_time,
    winner: getWinner(bracket) !== 'TBD' ? getWinner(bracket) : null
  }))

  const typeNode = {
    key: `tournament-${bracketType}`,
    type: 'tournament',
    label: `${bracketType} Tournament`,
    children: bracketNodes
  }

  // Add champion node if tournament is complete
  if (champion) {
    typeNode.children.push({
      key: `champion-${bracketType}`,
      type: 'winner',
      label: 'Champion',
      racer_name: champion.racer_name,
      time: champion.winning_time
    })
  } else {
    // Add pending champion node
    typeNode.children.push({
      key: `pending-${bracketType}`,
      type: 'pending',
      label: 'Champion',
      message:
        brackets.length > typeWinners.length ? 'Complete remaining races' : 'Generate next round'
    })
  }

  return typeNode
}

const canGenerateNextRound = computed(() => {
  // Can generate next round only if:
  // 1. There are brackets of the selected type
  // 2. ALL brackets of the selected type are completed
  // 3. There are at least 2 winners of the selected type (excluding ties)
  // 4. No tied brackets of the selected type (ties need to be resolved first)
  const selectedTypeBrackets = raceBrackets.value.filter(
    (b) => b.bracket_type === selectedBracketType.value
  )
  const selectedTypeCompleted = completedBracketsByType.value[selectedBracketType.value]
  const selectedTypeTotal = totalBracketsByType.value[selectedBracketType.value]
  const selectedTypeWinners = winners.value.filter((w) => {
    const bracket = raceBrackets.value.find((b) => b.id === w.bracket_id)
    return bracket && bracket.bracket_type === selectedBracketType.value
  })
  const selectedTypeTies = tiedBrackets.value.filter(
    (b) => b.bracket_type === selectedBracketType.value
  )

  return (
    selectedTypeBrackets.length > 0 &&
    selectedTypeCompleted === selectedTypeTotal &&
    selectedTypeWinners.length >= 2 &&
    selectedTypeTies.length === 0
  )
})

const possibleRacerCounts = computed(() => {
  const totalQualified = qualifiedRacers.value.length
  const counts = []

  // Generate even numbers from 4 up to total qualified racers
  for (let i = 4; i <= totalQualified; i += 2) {
    counts.push(i)
  }

  return counts
})

const winners = computed(() => {
  // Get all completed brackets by type
  const completedBrackets = raceBrackets.value.filter(
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

const tiedBrackets = computed(() => {
  return raceBrackets.value.filter(
    (b) => b.track1_time && b.track2_time && b.track1_time === b.track2_time
  )
})

const tournamentResults = computed(() => {
  // Debug logging
  const currentWinners = winners.value
  if (process.env.NODE_ENV === 'development') {
    console.log('Tournament Results Debug:', {
      totalBrackets: brackets.value.length,
      completedBrackets: completedBrackets.value,
      winners: currentWinners,
      completedByType: completedBracketsByType.value,
      totalByType: totalBracketsByType.value
    })
  }

  const results = { Fastest: null, Slowest: null }

  // Check each bracket type for tournament completion
  for (const bracketType of ['Fastest', 'Slowest']) {
    const typeBrackets = raceBrackets.value.filter((b) => b.bracket_type === bracketType)
    const typeCompleted = completedBracketsByType.value[bracketType]
    const typeTotal = totalBracketsByType.value[bracketType]
    const typeWinners = currentWinners.filter((w) => w.bracket_type === bracketType)

    if (process.env.NODE_ENV === 'development') {
      console.log(`${bracketType} Tournament Status:`, {
        typeWinners: typeWinners.length,
        typeBrackets: typeBrackets.length,
        typeCompleted,
        typeTotal,
        canGenerateMore: typeWinners.length >= 2
      })
    }

    // Tournament is complete for this type if:
    // 1. There are brackets of this type
    // 2. All brackets are completed
    // 3. There's exactly one winner remaining
    if (
      typeBrackets.length > 0 &&
      typeCompleted === typeTotal &&
      typeWinners.length === 1 &&
      typeTotal >= 1
    ) {
      const champion = typeWinners[0]
      if (process.env.NODE_ENV === 'development') {
        console.log(`${bracketType} Champion found:`, champion)
      }

      // Find 2nd and 3rd place
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

const getTournamentPlacings = (bracketType) => {
  const typeBrackets = raceBrackets.value
    .filter((b) => b.bracket_type === bracketType && b.track1_time && b.track2_time)
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at)) // Most recent first

  if (typeBrackets.length === 0) return { second: null, third: null }

  // Find the final bracket (most recent)
  const finalBracket = typeBrackets[0]

  // Get second place (loser of final bracket)
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

  // Find third place (best time among semi-final losers)
  let thirdPlace = null

  if (typeBrackets.length >= 2) {
    // Get semi-final brackets (second most recent round)
    const semiFinalBrackets = typeBrackets.filter((bracket) => {
      // Semi-finals are where the finalists came from
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

      // Don't include the second place finisher as third place
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

    // Best time among semi-final losers gets third place
    if (semiFinalLosers.length > 0) {
      thirdPlace =
        bracketType === 'Fastest'
          ? semiFinalLosers.reduce((best, current) => (current.time < best.time ? current : best))
          : semiFinalLosers.reduce((best, current) => (current.time > best.time ? current : best))
    }
  }

  return { second: secondPlace, third: thirdPlace }
}

// Helper functions
const formatTime = (time) => {
  if (!time) return 'N/A'
  return `${Number.parseFloat(time).toFixed(3)}s`
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

// Initialize data using composables
const initializeData = async () => {
  try {
    if (process.env.NODE_ENV === 'development') {
      console.log('Brackets page: Initializing data for race:', raceId)
    }

    // Initialize all composables
    await initializeRaces()
    await initializeBrackets()

    // Get race data by slug
    const slug = route.params.slug
    let raceData = getRaceBySlug(slug)
    if (!raceData) {
      raceData = await fetchRaceBySlug(slug)
    }
    if (!raceData) {
      throw new Error('Race not found')
    }
    race.value = raceData

    // Initialize qualifiers for this specific race
    await initializeQualifiers(raceData.id)

    if (process.env.NODE_ENV === 'development') {
      console.log('Brackets page: Data initialization complete')
    }
  } catch (err) {
    // Keep essential error logging for production debugging
    console.error('Error initializing brackets page data:', err)
    error.value = err
  }
}

// Generate brackets using fastest vs slowest pairing
const generateBrackets = async () => {
  if (!canGenerateBrackets.value) return

  generatingBrackets.value = true

  try {
    // Take only the specified number of top qualifiers
    const racersToUse = [...qualifiedRacers.value].slice(0, initialRacerCount.value)
    const newBrackets = []

    // Pair fastest with slowest
    while (racersToUse.length >= 2) {
      const fastest = racersToUse.shift() // First element (fastest)
      const slowest = racersToUse.pop() // Last element (slowest)

      newBrackets.push({
        race_id: race.value.id,
        track1_racer_id: fastest.racer_id,
        track2_racer_id: slowest.racer_id,
        bracket_type: selectedBracketType.value
      })
    }

    // Insert all brackets
    const { data: insertedBrackets, error: insertError } = await supabase
      .from('brackets')
      .insert(newBrackets).select(`
        *,
        track1_racer:racers!track1_racer_id(name, racer_number),
        track2_racer:racers!track2_racer_id(name, racer_number)
      `)

    if (insertError) throw insertError

    // Update local state
    const formattedBrackets = (insertedBrackets || []).map((b) => ({
      ...b,
      track1_racer_name: b.track1_racer?.name || 'TBD',
      track1_racer_number: b.track1_racer?.racer_number,
      track2_racer_name: b.track2_racer?.name || 'TBD',
      track2_racer_number: b.track2_racer?.racer_number
    }))

    brackets.value = [...brackets.value, ...formattedBrackets]

    toast.add({
      severity: 'success',
      summary: 'Brackets Generated',
      detail: `Created ${newBrackets.length} new bracket races`,
      life: 3000
    })
  } catch (err) {
    // Keep essential error logging for production debugging
    console.error('Error generating brackets:', err)
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: err.message || 'Failed to generate brackets',
      life: 5000
    })
  } finally {
    generatingBrackets.value = false
  }
}

// Generate next round from winners - simplified using composable logic
const generateNextRound = async () => {
  if (!canGenerateNextRound.value) return

  generatingNextRound.value = true

  try {
    // For now, use manual next round generation since composable doesn't have this specific logic
    // Only get winners from the selected bracket type
    const selectedTypeWinners = winners.value.filter((w) => {
      const bracket = raceBrackets.value.find((b) => b.id === w.bracket_id)
      return bracket && bracket.bracket_type === selectedBracketType.value
    })

    const availableWinners = [...selectedTypeWinners]
    const newBrackets = []

    if (process.env.NODE_ENV === 'development') {
      console.log(
        `Generating next round of ${selectedBracketType.value} brackets with winners:`,
        availableWinners
      )
    }

    // Pair winners fastest vs slowest
    while (availableWinners.length >= 2) {
      const fastest = availableWinners.shift() // First element (fastest winning time)
      const slowest = availableWinners.pop() // Last element (slowest winning time)

      newBrackets.push({
        race_id: race.value.id,
        track1_racer_id: fastest.racer_id,
        track2_racer_id: slowest.racer_id,
        bracket_type: selectedBracketType.value
      })
    }

    if (process.env.NODE_ENV === 'development') {
      console.log('New brackets to create:', newBrackets)
    }

    // Insert all next round brackets
    const { error: insertError } = await supabase.from('brackets').insert(newBrackets).select(`
        *,
        track1_racer:racers!track1_racer_id(name, racer_number),
        track2_racer:racers!track2_racer_id(name, racer_number)
      `)

    if (insertError) throw insertError

    toast.add({
      severity: 'success',
      summary: 'Next Round Generated',
      detail: `Created ${newBrackets.length} ${selectedBracketType.value} bracket races from winners`,
      life: 3000
    })
  } catch (err) {
    // Keep essential error logging for production debugging
    console.error('Error generating next round:', err)
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: err.message || 'Failed to generate next round',
      life: 5000
    })
  } finally {
    generatingNextRound.value = false
  }
}

// Clear all brackets
const clearBrackets = async () => {
  confirm.require({
    message: 'Are you sure you want to delete all brackets? This action cannot be undone.',
    header: 'Delete All Brackets',
    icon: 'pi pi-exclamation-triangle',
    rejectClass: 'p-button-secondary p-button-outlined',
    rejectLabel: 'Cancel',
    acceptLabel: 'Delete All',
    accept: async () => {
      clearingBrackets.value = true

      try {
        const { error: deleteError } = await supabase
          .from('brackets')
          .delete()
          .eq('race_id', race.value.id)

        if (deleteError) throw deleteError

        brackets.value = []

        toast.add({
          severity: 'info',
          summary: 'Brackets Cleared',
          detail: 'All brackets have been deleted',
          life: 3000
        })
      } catch (err) {
        // Keep essential error logging for production debugging
        console.error('Error clearing brackets:', err)
        toast.add({
          severity: 'error',
          summary: 'Error',
          detail: err.message || 'Failed to clear brackets',
          life: 5000
        })
      } finally {
        clearingBrackets.value = false
      }
    }
  })
}

// Confirm delete bracket
const confirmDeleteBracket = (bracketId) => {
  const bracket = brackets.value.find((b) => b.id === bracketId)
  const hasData = bracket && (bracket.track1_time || bracket.track2_time)

  const message = hasData
    ? 'This bracket has recorded times. Are you sure you want to delete it? This action cannot be undone.'
    : 'Are you sure you want to delete this bracket?'

  confirm.require({
    message,
    header: 'Delete Bracket',
    icon: 'pi pi-exclamation-triangle',
    rejectClass: 'p-button-secondary p-button-outlined',
    rejectLabel: 'Cancel',
    acceptLabel: 'Delete',
    accept: () => {
      deleteBracket(bracketId)
    }
  })
}

// Delete individual bracket
const deleteBracket = async (bracketId) => {
  processing.value = bracketId

  try {
    const { error: deleteError } = await supabase.from('brackets').delete().eq('id', bracketId)

    if (deleteError) throw deleteError

    brackets.value = brackets.value.filter((b) => b.id !== bracketId)

    toast.add({
      severity: 'info',
      summary: 'Bracket Deleted',
      detail: 'Bracket race has been removed',
      life: 3000
    })
  } catch (err) {
    // Keep essential error logging for production debugging
    console.error('Error deleting bracket:', err)
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: err.message || 'Failed to delete bracket',
      life: 5000
    })
  } finally {
    processing.value = null
  }
}

// Record bracket race time
const recordTime = async (bracket, track) => {
  const timeKey = `${bracket.id}_track${track}`
  const timeValue = bracketTimes.value[bracket.id + `_track${track}`]

  if (!timeValue || timeValue <= 0) return

  processing.value = timeKey

  try {
    const updateField = track === 1 ? 'track1_time' : 'track2_time'

    const { error: updateError } = await supabase
      .from('brackets')
      .update({ [updateField]: timeValue })
      .eq('id', bracket.id)

    if (updateError) throw updateError

    // Update local state
    const bracketIndex = brackets.value.findIndex((b) => b.id === bracket.id)
    if (bracketIndex !== -1) {
      brackets.value[bracketIndex][updateField] = timeValue
    }

    // Clear the input
    const inputKey = bracket.id + `_track${track}`
    bracketTimes.value[inputKey] = undefined

    const racerName = track === 1 ? bracket.track1_racer_name : bracket.track2_racer_name

    toast.add({
      severity: 'success',
      summary: 'Time Recorded',
      detail: `${formatTime(timeValue)} recorded for ${racerName}`,
      life: 3000
    })
  } catch (err) {
    // Keep essential error logging for production debugging
    console.error('Error recording time:', err)
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: err.message || 'Failed to record time',
      life: 5000
    })
  } finally {
    processing.value = null
  }
}

// Edit time functionality
const editTime = (bracket, track) => {
  const editKey = `${bracket.id}_track${track}`
  editingTime.value[editKey] = true

  // Pre-populate the input with current time
  const currentTime = track === 1 ? bracket.track1_time : bracket.track2_time
  bracketTimes.value[bracket.id + `_track${track}`] = currentTime

  // Focus handled automatically by Vue
}

const updateTime = async (bracket, track) => {
  const timeValue = bracketTimes.value[bracket.id + `_track${track}`]

  if (!timeValue || timeValue <= 0) return

  processing.value = `${bracket.id}_track${track}_edit`

  try {
    const updateField = track === 1 ? 'track1_time' : 'track2_time'

    const { error: updateError } = await supabase
      .from('brackets')
      .update({ [updateField]: timeValue })
      .eq('id', bracket.id)

    if (updateError) throw updateError

    // Update local state
    const bracketIndex = brackets.value.findIndex((b) => b.id === bracket.id)
    if (bracketIndex !== -1) {
      brackets.value[bracketIndex][updateField] = timeValue
    }

    // Clear editing state
    const editKey = `${bracket.id}_track${track}`
    const inputKey = bracket.id + `_track${track}`
    editingTime.value[editKey] = undefined
    bracketTimes.value[inputKey] = undefined

    const racerName = track === 1 ? bracket.track1_racer_name : bracket.track2_racer_name

    toast.add({
      severity: 'success',
      summary: 'Time Updated',
      detail: `${formatTime(timeValue)} updated for ${racerName}`,
      life: 3000
    })
  } catch (err) {
    // Keep essential error logging for production debugging
    console.error('Error updating time:', err)
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: err.message || 'Failed to update time',
      life: 5000
    })
  } finally {
    processing.value = null
  }
}

const cancelEdit = (bracket, track) => {
  const editKey = `${bracket.id}_track${track}`
  const inputKey = bracket.id + `_track${track}`
  editingTime.value[editKey] = undefined
  bracketTimes.value[inputKey] = undefined
}

// Initialize
onMounted(async () => {
  await authStore.initAuth()
  await initializeData()
})

// Page head
useHead({
  title: computed(() =>
    race.value
      ? `Brackets: ${race.value.name} - The Great Holyoke Brick Race`
      : 'Brackets - The Great Holyoke Brick Race'
  )
})
</script>

<style scoped>
/* Tournament Bracket Styling */
.tournament-bracket :deep(.p-organizationchart) {
  overflow-x: auto;
  padding: 1rem;
}

.tournament-bracket :deep(.p-organizationchart-table) {
  min-width: 100%;
}

.tournament-bracket :deep(.p-organizationchart-lines) {
  border-color: #6b7280 !important;
}

.tournament-bracket :deep(.p-organizationchart-line-down) {
  border-top-color: #6b7280 !important;
}

.tournament-bracket :deep(.p-organizationchart-line-left) {
  border-right-color: #6b7280 !important;
}

.tournament-bracket :deep(.p-organizationchart-line-right) {
  border-left-color: #6b7280 !important;
}

.bracket-node {
  min-width: 140px;
  max-width: 180px;
  transition: all 0.2s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.bracket-node:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
}

/* Dark mode support */
:global(.app-dark) .tournament-bracket :deep(.p-organizationchart-lines) {
  border-color: #9ca3af !important;
}

:global(.app-dark) .tournament-bracket :deep(.p-organizationchart-line-down) {
  border-top-color: #9ca3af !important;
}

:global(.app-dark) .tournament-bracket :deep(.p-organizationchart-line-left) {
  border-right-color: #9ca3af !important;
}

:global(.app-dark) .tournament-bracket :deep(.p-organizationchart-line-right) {
  border-left-color: #9ca3af !important;
}

:global(.app-dark) .bracket-node {
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

:global(.app-dark) .bracket-node:hover {
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.4);
}
</style>
