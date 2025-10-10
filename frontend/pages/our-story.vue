<template>
  <div class="min-h-screen bg-white">
    <!-- Hero Section -->
    <div class="bg-white">
      <!-- Hero Image -->
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <img
          src="~/assets/img/brickrace_art.jpg"
          alt="The Great Holyoke Brick Race Artwork"
          class="w-full h-64 md:h-80 lg:h-96 object-contain rounded-lg"
        />
      </div>

      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div class="text-center">
          <h1 class="text-4xl md:text-5xl font-bold text-black mb-6">
            The Great Holyoke Brick Race
          </h1>
          <p class="text-xl md:text-2xl text-gray-600 max-w-4xl mx-auto">
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
            <h2 class="text-3xl font-bold text-black flex items-center gap-3">
              <i class="pi pi-info-circle text-brand-blue" />
              About the Race
            </h2>
          </template>
          <template #content>
            <div class="prose prose-lg max-w-none">
              <p class="text-gray-700 leading-relaxed mb-6">
                The Great Holyoke Brick Race is a gravity race involving brick racers that takes
                place annually on Race Street in Holyoke, Massachusetts. Brick racers are vehicles
                which must incorporate a standard brick in their construction and travel free of
                mechanical help in their course down a custom concrete track. The race is the first
                and only brick race in existence.
              </p>
              <p class="text-gray-700 leading-relaxed mb-6">
                The Great Holyoke Brick Race emphasizes fun, creativity and the sculptural quality
                of the race cars as well as speed. The organizers have described it as
                <em>"performance art meets sport."</em> Custom trophies are given each year for the
                fastest racer. In the past, awards have also been given for the categories of Best
                Crash and Most Creative.
              </p>
              <p class="text-gray-700 leading-relaxed">
                Notable designs from past years include the Empire State Building, complete with
                King Kong on top, and a brick that was encased in a block of ice that bounced and
                rolled down the track. Since the first Brick Race in 2011, over 350 contestants and
                more than 1,000 spectators of all ages have taken part.
              </p>
            </div>
          </template>
        </Card>

        <!-- Featured Video -->
        <Card class="mb-8">
          <template #title>
            <h2 class="text-3xl font-bold text-black flex items-center gap-3">
              <i class="pi pi-play text-brand-red" />
              Watch the Action
            </h2>
          </template>
          <template #content>
            <div class="aspect-video">
              <iframe
                src="https://player.vimeo.com/video/213777258?badge=0&autopause=0&player_id=0&app_id=58479"
                width="100%"
                height="100%"
                frameborder="0"
                allow="autoplay; fullscreen; picture-in-picture; clipboard-write"
                class="rounded-lg"
                title="The Great Holyoke Brick Race"
              />
            </div>
            <p class="text-gray-600 text-sm mt-4 text-center">
              Experience the excitement and creativity of The Great Holyoke Brick Race
            </p>
          </template>
        </Card>

        <!-- History Timeline -->
        <Card>
          <template #title>
            <h2 class="text-3xl font-bold text-black flex items-center gap-3">
              <i class="pi pi-clock text-brand-green" />
              Race History
            </h2>
          </template>
          <template #content>
            <!-- Custom Responsive Timeline -->
            <div class="relative">
              <!-- Timeline Line -->
              <div
                class="absolute left-4 md:left-1/2 md:-ml-0.5 top-0 bottom-0 w-0.5 bg-gray-300"
              />

              <!-- Timeline Items -->
              <div class="space-y-8">
                <div
                  v-for="(item, index) in raceHistory"
                  :key="index"
                  class="relative flex flex-col md:flex-row md:items-center"
                >
                  <!-- Mobile Layout: Marker + Content stacked -->
                  <div class="md:hidden flex items-start space-x-4">
                    <!-- Marker -->
                    <div
                      class="relative z-10 w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold shadow-lg flex-shrink-0"
                      :class="item.color"
                    >
                      <i :class="item.icon" />
                    </div>

                    <!-- Content -->
                    <div class="flex-1 pb-6">
                      <div class="mb-2">
                        <h3 class="text-xl font-bold text-black">{{ item.year }}</h3>
                      </div>
                      <h4 class="font-semibold text-gray-800 text-lg mb-2">
                        {{ item.title }}
                      </h4>
                      <p class="text-gray-600" v-html="item.description" />
                    </div>
                  </div>

                  <!-- Desktop Layout: Alternating sides -->
                  <div
                    class="hidden md:flex md:w-full"
                    :class="index % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'"
                  >
                    <!-- Content side -->
                    <div
                      class="md:w-1/2 md:px-6"
                      :class="index % 2 === 0 ? 'md:text-right md:pr-8' : 'md:text-left md:pl-8'"
                    >
                      <div class="mb-2">
                        <h3 class="text-2xl font-bold text-black">{{ item.year }}</h3>
                      </div>
                      <h4 class="font-semibold text-gray-800 text-lg mb-2">
                        {{ item.title }}
                      </h4>
                      <p class="text-gray-600" v-html="item.description" />
                    </div>

                    <!-- Marker -->
                    <div
                      class="relative z-10 w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold shadow-lg flex-shrink-0"
                      :class="item.color"
                    >
                      <i :class="item.icon" />
                    </div>

                    <!-- Empty space on opposite side -->
                    <div class="md:w-1/2" />
                  </div>
                </div>
              </div>
            </div>
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
    year: '2023',
    title: 'Pioneer Valley Maker Faire',
    description:
      'The Pioneer Valley Maker Faire was also located on Race Street during the Brick Race, showcasing the work of local makers, artists, and other creative folks. <a href="https://pioneervalley.makerfaire.com/" target="_blank" rel="noopener noreferrer" class="text-blue-600 hover:text-blue-800 underline">Learn more</a>',
    icon: 'pi pi-wrench',
    color: 'bg-brand-gold'
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
  title: 'Our Story - The Great Holyoke Brick Race',
  meta: [
    {
      name: 'description',
      content:
        'Learn about the history and community impact of The Great Holyoke Brick Race, a beloved annual tradition celebrating creativity and engineering.'
    }
  ]
})
</script>
