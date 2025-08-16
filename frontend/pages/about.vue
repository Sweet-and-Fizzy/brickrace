<template>
  <div
    class="min-h-screen bg-white dark:bg-gray-900"
  >
    <!-- Hero Section -->
    <div class="bg-white dark:bg-gray-900">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div class="text-center">
          <h1 class="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6">The Great Holyoke Brick Race</h1>
          <p class="text-xl md:text-2xl text-gray-600 dark:text-gray-400 max-w-4xl mx-auto">
            A celebration of creativity, engineering, and friendly competition where custom
            gravity-powered vehicles race for glory
          </p>
        </div>
      </div>
    </div>

    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <!-- About the Race -->
      <div class="mb-16">
        <Card class="mb-8">
          <template #title>
            <h2 class="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
              <i class="pi pi-info-circle text-brand-blue" />
              About the Race
            </h2>
          </template>
          <template #content>
            <div class="prose prose-lg max-w-none dark:prose-invert">
              <p class="text-gray-700 dark:text-gray-300 leading-relaxed mb-6">
                The Great Holyoke Brick Race is a gravity race involving brick racers that takes
                place annually on Race Street in Holyoke, Massachusetts. Brick racers are vehicles
                which must incorporate a standard brick in their construction and travel free of
                mechanical help in their course down a custom concrete track. The race is the first
                and only brick race in existence.
              </p>
              <p class="text-gray-700 dark:text-gray-300 leading-relaxed mb-6">
                The Great Holyoke Brick Race emphasizes fun, creativity and the sculptural quality
                of the race cars as well as speed. The organizers have described it as
                <em>"performance art meets sport."</em> Custom trophies are given each year for the
                fastest racer. In the past, awards have also been given for the categories of Best
                Crash and Most Creative.
              </p>
              <p class="text-gray-700 dark:text-gray-300 leading-relaxed">
                Notable designs from past years include the Empire State Building, complete with
                King Kong on top, and a brick that was encased in a block of ice that bounced and
                rolled down the track. Since the first Brick Race in 2011, over 350 contestants and
                more than 1,000 spectators of all ages have taken part.
              </p>
            </div>
          </template>
        </Card>

        <!-- History Timeline -->
        <Card>
          <template #title>
            <h2 class="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
              <i class="pi pi-clock text-brand-green" />
              Race History
            </h2>
          </template>
          <template #content>
            <Timeline :value="raceHistory" class="w-full">
              <template #marker="{ item }">
                <div
                  class="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold shadow-lg"
                  :class="item.color"
                >
                  <i :class="item.icon" />
                </div>
              </template>
              <template #opposite="{ item }">
                <div class="pr-4 text-right">
                  <h3 class="text-2xl font-bold text-gray-900 dark:text-white">{{ item.year }}</h3>
                </div>
              </template>
              <template #content="{ item }">
                <div class="ml-4 space-y-2 pb-6">
                  <h4 class="font-semibold text-gray-800 dark:text-gray-200 text-lg">
                    {{ item.title }}
                  </h4>
                  <p class="text-gray-600 dark:text-gray-400">{{ item.description }}</p>
                </div>
              </template>
            </Timeline>
          </template>
        </Card>
      </div>
    </div>
  </div>
</template>

<script setup>
// Race history timeline data
const raceHistory = [
  {
    year: 'November 2010',
    title: 'The Conception',
    description:
      'Artists Bruce Fowler and Dean Nimmer conceived the race to highlight the growing local art scene. Inspired by power tool racing in creative communities and the coincidence of their studios being on Race Street.',
    icon: 'pi pi-lightbulb',
    color: 'bg-brand-blue'
  },
  {
    year: '2011',
    title: 'The First Race',
    description:
      'The inaugural Great Holyoke Brick Race took place, establishing the unique format of gravity-powered vehicles incorporating standard bricks racing down a custom concrete track.',
    icon: 'pi pi-flag',
    color: 'bg-brand-gold'
  },
  {
    year: '2011-2024',
    title: 'Annual Tradition Established',
    description:
      'The race became an annual tradition, attracting creative participants with memorable designs like the Empire State Building with King Kong and ice-encased bricks.',
    icon: 'pi pi-calendar',
    color: 'bg-brand-green'
  },
  {
    year: '2025',
    title: 'Digital Platform Launch',
    description:
      'Launched this digital platform for race management, tracking, and awards to enhance the participant and spectator experience.',
    icon: 'pi pi-desktop',
    color: 'bg-brand-blue'
  }
]

useHead({
  title: 'About - The Great Holyoke Brick Race',
  meta: [
    {
      name: 'description',
      content:
        'Learn about the history and community impact of The Great Holyoke Brick Race, a beloved annual tradition celebrating creativity and engineering.'
    }
  ]
})
</script>
