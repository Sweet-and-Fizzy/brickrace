<template>
  <div class="min-h-screen bg-white dark:bg-gray-900">
    <!-- Hero Section -->
    <div class="bg-white dark:bg-gray-900">
      <!-- Hero Image -->
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <img
          src="~/assets/img/building_brickracer.jpg"
          alt="Building a Brick Racer"
          class="w-full h-64 md:h-80 lg:h-96 object-contain rounded-lg"
        >
      </div>
      
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div class="text-center">
          <h1 class="text-4xl md:text-5xl font-bold mb-6 text-gray-900 dark:text-white">
            Frequently Asked Questions
          </h1>
          <p class="text-xl md:text-2xl text-gray-600 dark:text-gray-400 max-w-4xl mx-auto">
            Everything you need to know about The Great Holyoke Brick Race - from building your
            racer to race day logistics and awards.
          </p>
        </div>
      </div>
    </div>

    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-0 pb-16">
      <!-- FAQ Section -->
      <div class="mb-16">
        <Card>
          <template #content>
            <Accordion :value="['0']" multiple>
            <!-- Who can enter? -->
            <AccordionPanel value="0">
              <AccordionHeader>
                <div class="flex items-center gap-2">
                  <i class="pi pi-users text-purple-600 dark:text-purple-400" />
                  <span class="font-bold text-gray-900 dark:text-white">Who can enter?</span>
                </div>
              </AccordionHeader>
              <AccordionContent>
                <div class="space-y-4 text-gray-700 dark:text-gray-300">
                  <div class="flex items-start gap-3">
                    <div
                      class="bg-brand-blue rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0 mt-1"
                    >
                      <span class="text-white font-bold text-sm">1</span>
                    </div>
                    <p class="leading-relaxed">
                      We invite all interested people, of any age and background – artists,
                      students, teachers, mechanics, car buffs, tinkerers, inventors, Library of
                      Congress archivists and compulsive contest enterers, etc. – all are welcome.
                    </p>
                  </div>

                  <div class="flex items-start gap-3">
                    <div
                      class="bg-brand-blue rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0 mt-1"
                    >
                      <span class="text-white font-bold text-sm">2</span>
                    </div>
                    <p class="leading-relaxed">
                      You may enter as an individual or as part of a group with any number of
                      participants to make one racer.
                    </p>
                  </div>

                  <div class="flex items-start gap-3">
                    <div
                      class="bg-brand-blue rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0 mt-1"
                    >
                      <span class="text-white font-bold text-sm">3</span>
                    </div>
                    <p class="leading-relaxed">
                      Entrants do not have to be residents of Holyoke, Massachusetts to participate
                      in the competition, and we will accept entries from contestants worldwide
                      including Framingham, Fargo, Fairbanks, Faskrudsfjordur (Iceland) and anywhere
                      else – build a brick racer and you're in!
                    </p>
                  </div>
                </div>
              </AccordionContent>
            </AccordionPanel>

            <!-- Racer Specifications -->
            <AccordionPanel value="1">
              <AccordionHeader>
                <div class="flex items-center gap-2">
                  <i class="pi pi-cog text-gray-600 dark:text-gray-400" />
                  <span class="font-bold text-gray-900 dark:text-white">Racer Specifications</span>
                </div>
              </AccordionHeader>
              <AccordionContent>
                <div class="space-y-4 text-gray-700 dark:text-gray-300">
                  <div class="flex items-start gap-3">
                    <div
                      class="bg-brand-blue rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0 mt-1"
                    >
                      <span class="text-white font-bold text-sm">1</span>
                    </div>
                    <p class="leading-relaxed">
                      Entrants must build a racer vehicle to transport a
                      <strong>common building brick</strong> as the main component. A common brick
                      is approximately
                      <strong>8 inches in length × 4 inches in width × 2.5 inches in height</strong>
                      and weighs between <strong>4 and 5 pounds</strong>.
                    </p>
                  </div>

                  <div class="flex items-start gap-3">
                    <div
                      class="bg-brand-blue rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0 mt-1"
                    >
                      <span class="text-white font-bold text-sm">2</span>
                    </div>
                    <p class="leading-relaxed">
                      Since the racers will travel down an inclined plane using
                      <strong>gravity only</strong>, you may not use any extra motors or propulsion
                      systems that would aid the speed of the racer.
                    </p>
                  </div>

                  <div class="flex items-start gap-3">
                    <div
                      class="bg-brand-blue rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0 mt-1"
                    >
                      <span class="text-white font-bold text-sm">3</span>
                    </div>
                    <p class="leading-relaxed">
                      You may use <strong>any materials</strong> to build the racer including
                      painting the brick. You may not use sharp, hazardous or flammable materials,
                      and we reserve the right to ban any racer that the judges deem to be
                      dangerous.
                    </p>
                  </div>

                  <div class="flex items-start gap-3">
                    <div
                      class="bg-brand-blue rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0 mt-1"
                    >
                      <span class="text-white font-bold text-sm">4</span>
                    </div>
                    <p class="leading-relaxed">
                      To fit on the track, the total size of the racer, including the brick, cannot
                      exceed
                      <strong>10 inches in width × 18 inches in length × 15 inches in height</strong
                      >. (You may include lighter artistic elements over 15")
                    </p>
                  </div>

                  <div class="flex items-start gap-3">
                    <div
                      class="bg-brand-blue rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0 mt-1"
                    >
                      <span class="text-white font-bold text-sm">5</span>
                    </div>
                    <p class="leading-relaxed">
                      The total weight of the brick racer, including the brick and all materials
                      attached to it, should not exceed
                      <strong>15lbs in total weight</strong>.
                    </p>
                  </div>
                </div>
              </AccordionContent>
            </AccordionPanel>

            <!-- How Does the Race Work? -->
            <AccordionPanel value="2">
              <AccordionHeader>
                <div class="flex items-center gap-2">
                  <i class="pi pi-play-circle text-green-600 dark:text-green-400" />
                  <span class="font-bold text-gray-900 dark:text-white">How Does the Race Work?</span>
                </div>
              </AccordionHeader>
              <AccordionContent>
                <div class="space-y-6 text-gray-700 dark:text-gray-300">
                  <p class="text-lg text-gray-900 dark:text-white font-medium mb-4">
                    The Great Holyoke Brick Race follows a structured process from registration to
                    victory:
                  </p>

                  <div class="space-y-5">
                    <div class="flex items-start gap-4">
                      <div
                        class="bg-brand-green rounded-full w-10 h-10 flex items-center justify-center flex-shrink-0"
                      >
                        <span class="text-white font-bold">1</span>
                      </div>
                      <div>
                        <h4 class="font-semibold text-gray-900 dark:text-white mb-2">
                          Website Registration
                        </h4>
                        <p class="leading-relaxed mb-3">
                          <strong>Before race day:</strong> Create an account on this website and
                          register your racer. Upload a photo, provide your racer details, and get
                          your unique racer number assigned. You can edit your racer information 
                          anytime before the race. This step must be completed before you
                          can check in on race day.
                        </p>
                        <div class="bg-white dark:bg-gray-800 border-2 border-brand-green rounded-lg p-3">
                          <p class="text-sm text-gray-900 dark:text-white">
                            <i class="pi pi-info-circle mr-1" />
                            <strong>Important:</strong> You cannot participate in the race without
                            first registering your racer on this website.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div class="flex items-start gap-4">
                      <div
                        class="bg-brand-green rounded-full w-10 h-10 flex items-center justify-center flex-shrink-0"
                      >
                        <span class="text-white font-bold">2</span>
                      </div>
                      <div>
                        <h4 class="font-semibold text-gray-900 dark:text-white mb-2">
                          Race Day Check-in
                        </h4>
                        <p class="leading-relaxed">
                          Arrive on race day with your completed brick racer and your website
                          registration. Race officials will verify your racer meets specifications,
                          confirm your registration details, and officially check you in for the
                          event. You can also view your check-in status in real-time on this website.
                        </p>
                      </div>
                    </div>

                    <div class="flex items-start gap-4">
                      <div
                        class="bg-brand-green rounded-full w-10 h-10 flex items-center justify-center flex-shrink-0"
                      >
                        <span class="text-white font-bold">3</span>
                      </div>
                      <div>
                        <h4 class="font-semibold text-gray-900 dark:text-white mb-2">
                          Qualifying Rounds
                        </h4>
                        <p class="leading-relaxed">
                          Your racer will complete multiple timed runs down the custom concrete track
                          in organized heats. Officials record your times precisely using electronic
                          timing systems, and your best qualifying time determines your starting 
                          position for the main competition brackets. You can view live results 
                          on this website throughout the day.
                        </p>
                      </div>
                    </div>

                    <div class="flex items-start gap-4">
                      <div
                        class="bg-brand-green rounded-full w-10 h-10 flex items-center justify-center flex-shrink-0"
                      >
                        <span class="text-white font-bold">4</span>
                      </div>
                      <div>
                        <h4 class="font-semibold text-gray-900 dark:text-white mb-2">
                          Tournament Brackets
                        </h4>
                        <p class="leading-relaxed">
                          Based on qualifying times, racers are placed into double-elimination 
                          tournament brackets. Head-to-head races determine winners who advance 
                          through the rounds until champions are crowned in each category. 
                          Follow the bracket progression live on this website as the tournament unfolds.
                        </p>
                      </div>
                    </div>

                    <div class="flex items-start gap-4">
                      <div
                        class="bg-brand-green rounded-full w-10 h-10 flex items-center justify-center flex-shrink-0"
                      >
                        <span class="text-white font-bold">5</span>
                      </div>
                      <div>
                        <h4 class="font-semibold text-gray-900 dark:text-white mb-2">
                          Awards Ceremony
                        </h4>
                        <p class="leading-relaxed">
                          Custom trophies are awarded for fastest racers, most creative designs, and
                          other special categories. Everyone celebrates the amazing creativity and
                          engineering on display!
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </AccordionContent>
            </AccordionPanel>

            <!-- Awards & Recognition -->
            <AccordionPanel value="3">
              <AccordionHeader>
                <div class="flex items-center gap-2">
                  <i class="pi pi-trophy text-yellow-600 dark:text-yellow-400" />
                  <span class="font-bold text-gray-900 dark:text-white">Awards & Recognition</span>
                </div>
              </AccordionHeader>
              <AccordionContent>
                <div class="space-y-6 text-gray-700 dark:text-gray-300">
                  <p class="text-lg text-gray-900 dark:text-white font-medium mb-4">
                    The Great Holyoke Brick Race celebrates both speed and creativity with custom
                    trophies:
                  </p>

                  <!-- Loading State -->
                  <div v-if="awardsLoading" class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div v-for="i in 4" :key="i" class="bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-600 rounded-lg p-5 animate-pulse">
                      <div class="flex items-center gap-3 mb-3">
                        <div class="bg-gray-300 dark:bg-gray-600 rounded-full w-10 h-10"/>
                        <div class="h-5 bg-gray-300 dark:bg-gray-600 rounded w-24"/>
                      </div>
                      <div class="space-y-2">
                        <div class="h-3 bg-gray-200 dark:bg-gray-700 rounded w-full"/>
                        <div class="h-3 bg-gray-200 dark:bg-gray-700 rounded w-3/4"/>
                      </div>
                    </div>
                  </div>

                  <!-- Dynamic Awards -->
                  <div v-else-if="awards.length > 0" class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div 
                      v-for="award in awards" 
                      :key="award.id"
                      class="bg-white dark:bg-gray-800 border-2 rounded-lg p-5"
                      :class="getBorderColor(award.icon)"
                    >
                      <!-- Award Header with Icon/Image and Title -->
                      <div class="flex items-start gap-4 mb-3">
                        <!-- Award Image or Icon -->
                        <div class="flex-shrink-0">
                          <img 
                            v-if="award.image_url"
                            :src="award.image_url"
                            :alt="award.name"
                            class="w-16 h-16 object-cover rounded-lg border-2"
                            :class="getBorderColor(award.icon)"
                          >
                          <div
                            v-else
                            class="rounded-full w-12 h-12 flex items-center justify-center bg-yellow-500"
                          >
                            <i class="pi pi-trophy text-white text-lg" />
                          </div>
                        </div>
                        
                        <!-- Award Title and Description -->
                        <div class="flex-1">
                          <h4 class="font-semibold text-gray-900 dark:text-white mb-2">{{ award.name }}</h4>
                          <p class="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">
                            {{ award.description }}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <!-- Fallback message -->
                  <div v-else class="text-center py-8">
                    <i class="pi pi-trophy text-4xl text-gray-400 dark:text-gray-600 mb-4" />
                    <p class="text-gray-600 dark:text-gray-400">
                      Award categories will be announced closer to race day.
                    </p>
                  </div>

                  <!-- Voting Information -->
                  <div v-if="awards.length > 0" class="bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-200 dark:border-blue-800 rounded-lg p-6 mt-6">
                    <div class="flex items-start gap-4">
                      <div class="bg-blue-500 rounded-full w-12 h-12 flex items-center justify-center flex-shrink-0">
                        <i class="pi pi-users text-white text-lg" />
                      </div>
                      <div class="flex-1">
                        <h4 class="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-2">
                          Community Voting
                        </h4>
                        <p class="text-blue-800 dark:text-blue-200 leading-relaxed mb-4">
                          Many of these awards are decided by community voting! After racers are registered and photos are uploaded, 
                          anyone can visit our awards page to vote for their favorites in categories like Most Creative, Best Design, 
                          and other special awards. Your vote helps celebrate the amazing creativity and craftsmanship of our participants.
                        </p>
                        <Button
                          class="btn-primary"
                          @click="navigateTo('/awards')"
                        >
                          <i class="pi pi-trophy mr-2" />
                          View Awards & Vote
                        </Button>
                      </div>
                    </div>
                  </div>

                  <p class="text-gray-600 dark:text-gray-300 text-left mt-6">
                    Remember: The race emphasizes fun, creativity, and the sculptural quality of
                    the race cars as much as speed. It's "performance art meets sport" –
                    everyone's a winner in this celebration of imagination!
                  </p>
                </div>
              </AccordionContent>
            </AccordionPanel>

            <!-- What if I need to withdraw? -->
            <AccordionPanel value="5">
              <AccordionHeader>
                <div class="flex items-center gap-2">
                  <i class="pi pi-user-minus text-red-500" />
                  <span class="font-bold text-gray-900 dark:text-white">What if I need to withdraw?</span>
                </div>
              </AccordionHeader>
              <AccordionContent>
                <div class="space-y-4 text-gray-700 dark:text-gray-300">
                  <div class="flex items-start gap-3">
                    <div
                      class="bg-red-500 rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0 mt-1"
                    >
                      <span class="text-white font-bold text-sm">1</span>
                    </div>
                    <p class="leading-relaxed">
                      If you need to withdraw your racer from the competition, you can do so at any time
                      through your racer profile page on this website, or race officials can help you
                      withdraw on race day.
                    </p>
                  </div>

                  <div class="flex items-start gap-3">
                    <div
                      class="bg-red-500 rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0 mt-1"
                    >
                      <span class="text-white font-bold text-sm">2</span>
                    </div>
                    <p class="leading-relaxed">
                      If you withdraw before qualifying runs, your racer will simply not participate.
                      If you withdraw after qualifying but before brackets, your bracket position
                      will be adjusted automatically.
                    </p>
                  </div>

                  <div class="flex items-start gap-3">
                    <div
                      class="bg-red-500 rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0 mt-1"
                    >
                      <span class="text-white font-bold text-sm">3</span>
                    </div>
                    <p class="leading-relaxed">
                      Any qualifying times you achieved before withdrawal will be preserved in the
                      race history. You can also be reinstated if you change your mind (before
                      tournament brackets begin).
                    </p>
                  </div>
                </div>
              </AccordionContent>
            </AccordionPanel>

            <!-- Location & Venue -->
            <AccordionPanel value="6">
              <AccordionHeader>
                <div class="flex items-center gap-2">
                  <i class="pi pi-map-marker text-blue-600 dark:text-blue-400" />
                  <span class="font-bold text-gray-900 dark:text-white">Location & Venue</span>
                </div>
              </AccordionHeader>
              <AccordionContent>
                <div class="space-y-6 text-gray-700 dark:text-gray-300">
                  <!-- Main Venue Info -->
                  <div class="bg-white dark:bg-gray-800 border-2 border-brand-blue rounded-lg p-6">
                    <div class="flex items-start gap-4">
                      <div
                        class="bg-brand-blue rounded-full w-12 h-12 flex items-center justify-center flex-shrink-0"
                      >
                        <i class="pi pi-building text-white text-xl" />
                      </div>
                      <div>
                        <h4 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">Paper City Studios</h4>
                        <p class="text-gray-700 dark:text-gray-300 mb-1">
                          <strong>80 Race Street</strong>
                        </p>
                        <p class="text-gray-700 dark:text-gray-300 mb-3">Holyoke, Massachusetts</p>
                        <p class="text-sm text-gray-600 dark:text-gray-400 mb-4">
                          The race takes place on the custom concrete track at this historic venue
                          on Race Street - a fitting location for our gravity-powered brick racing
                          competition!
                        </p>
                        <Button
                          size="small"
                          class="btn-secondary"
                          @click="
                            () =>
                              window.open(
                                'https://maps.google.com/?q=80+Race+Street,+Holyoke,+MA',
                                '_blank'
                              )
                          "
                        >
                          <i class="pi pi-map mr-2" />
                          View on Google Maps
                        </Button>
                      </div>
                    </div>
                  </div>

                  <!-- Additional Location Details -->
                  <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div class="flex items-start gap-3">
                      <div
                        class="bg-brand-blue rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0 mt-1"
                      >
                        <i class="pi pi-car text-white text-sm" />
                      </div>
                      <div>
                        <p class="font-medium text-gray-900 dark:text-white mb-1">Parking</p>
                        <p class="text-sm leading-relaxed">
                          Street parking available on Race Street and surrounding areas
                        </p>
                      </div>
                    </div>

                    <div class="flex items-start gap-3">
                      <div
                        class="bg-brand-blue rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0 mt-1"
                      >
                        <i class="pi pi-users text-white text-sm" />
                      </div>
                      <div>
                        <p class="font-medium text-gray-900 dark:text-white mb-1">
                          Spectators Welcome
                        </p>
                        <p class="text-sm leading-relaxed">
                          Join over 1,000 spectators who attend this beloved annual event
                        </p>
                      </div>
                    </div>

                    <div class="flex items-start gap-3">
                      <div
                        class="bg-brand-blue rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0 mt-1"
                      >
                        <i class="pi pi-shopping-cart text-white text-sm" />
                      </div>
                      <div>
                        <p class="font-medium text-gray-900 dark:text-white mb-1">
                          Food & Refreshments
                        </p>
                        <p class="text-sm leading-relaxed">
                          Food trucks and local vendors provide delicious options throughout the
                          event
                        </p>
                      </div>
                    </div>

                    <div class="flex items-start gap-3">
                      <div
                        class="bg-brand-blue rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0 mt-1"
                      >
                        <i class="pi pi-heart text-white text-sm" />
                      </div>
                      <div>
                        <p class="font-medium text-gray-900 dark:text-white mb-1">
                          Family Friendly
                        </p>
                        <p class="text-sm leading-relaxed">
                          A fun community event perfect for all ages and backgrounds
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </AccordionContent>
            </AccordionPanel>
          </Accordion>
          </template>
        </Card>
      </div>

      <!-- Call to Action -->
      <div>
        <Card class="border-2 border-brand-green">
          <template #content>
            <div class="text-center space-y-6">
              <div class="flex justify-center">
                <div class="bg-brand-green rounded-full w-16 h-16 flex items-center justify-center">
                  <i class="pi pi-car text-2xl text-white" />
                </div>
              </div>

              <div>
                <h3 class="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                  Ready to Get Started?
                </h3>
                <p class="text-lg text-gray-700 dark:text-gray-300 mb-6">
                  Join our community of creative racers and bring your wildest brick racer ideas to
                  life!
                </p>
              </div>

              <div class="flex justify-center">
                <Button
                  size="large"
                  class="btn-primary font-semibold"
                  @click="navigateTo('/racers/add')"
                >
                  <i class="pi pi-plus mr-2" />
                  Register Your Racer
                </Button>
              </div>
            </div>
          </template>
        </Card>
      </div>
    </div>
  </div>
</template>

<script setup>
// Fetch awards data
const { awardDefinitions: awards, loading: awardsLoading, initialize } = useAwards()

// Helper function for dynamic border styling based on award icons
const getBorderColor = (icon) => {
  const colorMap = {
    'pi-bolt': 'border-yellow-400',
    'pi-clock': 'border-gray-400 dark:border-gray-600',
    'pi-palette': 'border-purple-400',
    'pi-exclamation-triangle': 'border-red-500',
    'pi-star': 'border-green-500',
    'pi-trophy': 'border-yellow-400',
    'pi-heart': 'border-pink-500',
    'pi-thumbs-up': 'border-blue-500'
  }
  return colorMap[icon] || 'border-gray-300 dark:border-gray-600'
}

// Fetch awards on mount
onMounted(async () => {
  await initialize()
})

useHead({
  title: 'Frequently Asked Questions - The Great Holyoke Brick Race',
  meta: [
    {
      name: 'description',
      content:
        'Get answers to frequently asked questions about The Great Holyoke Brick Race - racer specifications, race day process, awards, and more.'
    }
  ]
})
</script>

<style scoped>
/* Styles moved to main.css */
</style>

