<template>
  <div class="min-h-screen bg-white dark:bg-gray-900">
    <!-- Hero Section -->
    <div class="bg-white dark:bg-gray-900">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div class="text-center">
          <h1 class="text-4xl md:text-5xl font-bold mb-6 text-gray-900 dark:text-white">Build Your Own Racer</h1>
          <p class="text-xl md:text-2xl text-gray-600 dark:text-gray-400 max-w-4xl mx-auto">
            Ready to join the creative chaos? Learn everything you need to know about building your
            brick racer and joining our community of artists, engineers, and dreamers.
          </p>
        </div>
      </div>
    </div>

    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <!-- FAQ Section -->
      <div class="mb-16">
        <div class="mb-8">
          <div class="text-center mb-8">
            <h2
              class="text-3xl font-bold text-gray-900 dark:text-white flex items-center justify-center gap-3"
            >
              <i class="pi pi-question-circle text-brand-blue" />
              Frequently Asked Questions
            </h2>
          </div>

          <Accordion :value="['0']" multiple>
            <!-- Who can enter? -->
            <AccordionPanel value="0">
              <AccordionHeader>
                <div class="flex items-center gap-2">
                  <i class="pi pi-users text-brand-blue" />
                  <span class="font-bold text-black">Who can enter?</span>
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
                  <i class="pi pi-cog text-brand-blue" />
                  <span class="font-bold text-black">Racer Specifications</span>
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
                  <i class="pi pi-play-circle text-brand-green" />
                  <span class="font-bold text-black">How Does the Race Work?</span>
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
                          your unique racer number assigned. This step must be completed before you
                          can check in on race day.
                        </p>
                        <div
                          class="bg-white border-2 border-brand-green rounded-lg p-3"
                        >
                          <p class="text-sm text-gray-900">
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
                          event.
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
                          Your racer will complete timed runs down the custom concrete track.
                          Officials record your times, and your best qualifying time determines your
                          starting position for the main competition brackets.
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
                          Based on qualifying times, racers are placed into elimination brackets.
                          Head-to-head races determine winners who advance through the rounds until
                          champions are crowned in each category.
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
                  <i class="pi pi-trophy text-brand-gold" />
                  <span class="font-bold text-black">Awards & Recognition</span>
                </div>
              </AccordionHeader>
              <AccordionContent>
                <div class="space-y-6 text-gray-700 dark:text-gray-300">
                  <p class="text-lg text-gray-900 dark:text-white font-medium mb-4">
                    The Great Holyoke Brick Race celebrates both speed and creativity with custom
                    trophies:
                  </p>

                  <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div
                      class="bg-white border-2 border-brand-gold rounded-lg p-5"
                    >
                      <div class="flex items-center gap-3 mb-3">
                        <div
                          class="bg-brand-gold rounded-full w-10 h-10 flex items-center justify-center"
                        >
                          <i class="pi pi-bolt text-black" />
                        </div>
                        <h4 class="font-semibold text-gray-900">
                          Fastest Racer
                        </h4>
                      </div>
                      <p class="text-gray-700 text-sm leading-relaxed">
                        Custom trophies awarded to the fastest racers based on qualifying times and
                        bracket tournament results.
                      </p>
                    </div>

                    <div
                      class="bg-white border-2 border-gray-300 rounded-lg p-5"
                    >
                      <div class="flex items-center gap-3 mb-3">
                        <div
                          class="bg-gray-500 rounded-full w-10 h-10 flex items-center justify-center"
                        >
                          <i class="pi pi-clock text-white" />
                        </div>
                        <h4 class="font-semibold text-gray-900">
                          Slowest Racer
                        </h4>
                      </div>
                      <p class="text-gray-700 text-sm leading-relaxed">
                        Celebrating the joy of participation - sometimes the most memorable racers
                        take their time!
                      </p>
                    </div>

                    <div
                      class="bg-white border-2 border-brand-blue rounded-lg p-5"
                    >
                      <div class="flex items-center gap-3 mb-3">
                        <div
                          class="bg-brand-blue rounded-full w-10 h-10 flex items-center justify-center"
                        >
                          <i class="pi pi-palette text-white" />
                        </div>
                        <h4 class="font-semibold text-gray-900">
                          Most Creative
                        </h4>
                      </div>
                      <p class="text-gray-700 text-sm leading-relaxed">
                        Recognition for the most imaginative and artistic racer designs that
                        showcase exceptional creativity.
                      </p>
                    </div>

                    <div
                      class="bg-white border-2 border-red-500 rounded-lg p-5"
                    >
                      <div class="flex items-center gap-3 mb-3">
                        <div
                          class="bg-red-500 rounded-full w-10 h-10 flex items-center justify-center"
                        >
                          <i class="pi pi-exclamation-triangle text-white" />
                        </div>
                        <h4 class="font-semibold text-gray-900">Best Crash</h4>
                      </div>
                      <p class="text-gray-700 text-sm leading-relaxed">
                        Sometimes awarded for the most spectacular or memorable crash during the
                        competition.
                      </p>
                    </div>

                    <div
                      class="bg-white border-2 border-brand-green rounded-lg p-5"
                    >
                      <div class="flex items-center gap-3 mb-3">
                        <div
                          class="bg-brand-green rounded-full w-10 h-10 flex items-center justify-center"
                        >
                          <i class="pi pi-star text-white" />
                        </div>
                        <h4 class="font-semibold text-gray-900">
                          Special Categories
                        </h4>
                      </div>
                      <p class="text-gray-700 text-sm leading-relaxed">
                        Additional awards may be given based on the year's entries and the judges'
                        discretion.
                      </p>
                    </div>
                  </div>

                  <div
                    class="bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg p-4 mt-6"
                  >
                    <p class="text-sm text-gray-600 dark:text-gray-400 italic text-center">
                      Remember: The race emphasizes fun, creativity, and the sculptural quality of
                      the race cars as much as speed. It's "performance art meets sport" –
                      everyone's a winner in this celebration of imagination!
                    </p>
                  </div>
                </div>
              </AccordionContent>
            </AccordionPanel>

            <!-- Location & Venue -->
            <AccordionPanel value="4">
              <AccordionHeader>
                <div class="flex items-center gap-2">
                  <i class="pi pi-map-marker text-brand-blue" />
                  <span class="font-bold text-black">Location & Venue</span>
                </div>
              </AccordionHeader>
              <AccordionContent>
                <div class="space-y-6 text-gray-700 dark:text-gray-300">
                  <!-- Main Venue Info -->
                  <div
                    class="bg-white border-2 border-brand-blue rounded-lg p-6"
                  >
                    <div class="flex items-start gap-4">
                      <div
                        class="bg-brand-blue rounded-full w-12 h-12 flex items-center justify-center flex-shrink-0"
                      >
                        <i class="pi pi-building text-white text-xl" />
                      </div>
                      <div>
                        <h4 class="text-lg font-semibold text-gray-900 mb-2">
                          Paper City Studios
                        </h4>
                        <p class="text-gray-700 mb-1">
                          <strong>80 Race Street</strong>
                        </p>
                        <p class="text-gray-700 mb-3">
                          Holyoke, Massachusetts
                        </p>
                        <p class="text-sm text-gray-600 mb-4">
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
                        <i
                          class="pi pi-shopping-cart text-white text-sm"
                        />
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
        </div>

        <!-- Call to Action -->
        <Card class="border-2 border-brand-green">
          <template #content>
            <div class="text-center space-y-6">
              <div class="flex justify-center">
                <div
                  class="bg-brand-green rounded-full w-16 h-16 flex items-center justify-center"
                >
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

              <div class="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="large" class="btn-primary font-semibold" @click="navigateTo('/racers/add')">
                  <i class="pi pi-plus mr-2" />
                  Register Your Racer
                </Button>
                <Button
                  size="large"
                  class="btn-secondary font-semibold"
                  @click="navigateTo('/races')"
                >
                  <i class="pi pi-flag mr-2" />
                  View Current Races
                </Button>
                <Button
                  size="large"
                  class="btn-secondary font-semibold"
                  @click="navigateTo('/about')"
                >
                  <i class="pi pi-info-circle mr-2" />
                  Learn More About the Race
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
useHead({
  title: 'Build Your Own Racer - The Great Holyoke Brick Race',
  meta: [
    {
      name: 'description',
      content:
        'Learn how to build your own brick racer and join The Great Holyoke Brick Race. Open to all ages and backgrounds worldwide.'
    }
  ]
})
</script>
