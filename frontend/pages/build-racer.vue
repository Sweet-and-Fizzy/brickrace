<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
    <!-- Hero Section -->
    <div class="bg-gradient-to-r from-green-600 to-blue-600 text-white">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div class="text-center">
          <h1 class="text-4xl md:text-5xl font-bold mb-6">🏗️ Build Your Own Racer</h1>
          <p class="text-xl md:text-2xl text-green-100 max-w-4xl mx-auto">
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
              <i class="pi pi-question-circle text-green-600 dark:text-green-400" />
              Frequently Asked Questions
            </h2>
          </div>

          <Accordion :multiple="true" :active-index="[0]">
            <!-- Who can enter? -->
            <AccordionTab>
              <template #header>
                <div class="flex items-center gap-2">
                  <i class="pi pi-users text-blue-600 dark:text-blue-400" />
                  <span class="font-semibold">Who can enter?</span>
                </div>
              </template>
              <div class="space-y-4 text-gray-700 dark:text-gray-300">
                <div class="flex items-start gap-3">
                  <div
                    class="bg-green-100 dark:bg-green-900/30 rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0 mt-1"
                  >
                    <span class="text-green-600 dark:text-green-400 font-bold text-sm">1</span>
                  </div>
                  <p class="leading-relaxed">
                    We invite all interested people, of any age and background – artists, students,
                    teachers, mechanics, car buffs, tinkerers, inventors, Library of Congress
                    archivists and compulsive contest enterers, etc. – all are welcome.
                  </p>
                </div>

                <div class="flex items-start gap-3">
                  <div
                    class="bg-green-100 dark:bg-green-900/30 rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0 mt-1"
                  >
                    <span class="text-green-600 dark:text-green-400 font-bold text-sm">2</span>
                  </div>
                  <p class="leading-relaxed">
                    You may enter as an individual or as part of a group with any number of
                    participants to make one racer.
                  </p>
                </div>

                <div class="flex items-start gap-3">
                  <div
                    class="bg-green-100 dark:bg-green-900/30 rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0 mt-1"
                  >
                    <span class="text-green-600 dark:text-green-400 font-bold text-sm">3</span>
                  </div>
                  <p class="leading-relaxed">
                    Entrants do not have to be residents of Holyoke, Massachusetts to participate in
                    the competition, and we will accept entries from contestants worldwide including
                    Framingham, Fargo, Fairbanks, Faskrudsfjordur (Iceland) and anywhere else –
                    build a brick racer and you're in!
                  </p>
                </div>
              </div>
            </AccordionTab>

            <!-- Racer Specifications -->
            <AccordionTab>
              <template #header>
                <div class="flex items-center gap-2">
                  <i class="pi pi-cog text-purple-600 dark:text-purple-400" />
                  <span class="font-semibold">Racer Specifications</span>
                </div>
              </template>
              <div class="space-y-4 text-gray-700 dark:text-gray-300">
                <div class="flex items-start gap-3">
                  <div
                    class="bg-purple-100 dark:bg-purple-900/30 rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0 mt-1"
                  >
                    <span class="text-purple-600 dark:text-purple-400 font-bold text-sm">1</span>
                  </div>
                  <p class="leading-relaxed">
                    Entrants must build a racer vehicle to transport a
                    <strong>common building brick</strong> as the main component. A common brick is
                    approximately
                    <strong>8 inches in length × 4 inches in width × 2.5 inches in height</strong>
                    and weighs between <strong>4 and 5 pounds</strong>.
                  </p>
                </div>

                <div class="flex items-start gap-3">
                  <div
                    class="bg-purple-100 dark:bg-purple-900/30 rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0 mt-1"
                  >
                    <span class="text-purple-600 dark:text-purple-400 font-bold text-sm">2</span>
                  </div>
                  <p class="leading-relaxed">
                    Since the racers will travel down an inclined plane using
                    <strong>gravity only</strong>, you may not use any extra motors or propulsion
                    systems that would aid the speed of the racer.
                  </p>
                </div>

                <div class="flex items-start gap-3">
                  <div
                    class="bg-purple-100 dark:bg-purple-900/30 rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0 mt-1"
                  >
                    <span class="text-purple-600 dark:text-purple-400 font-bold text-sm">3</span>
                  </div>
                  <p class="leading-relaxed">
                    You may use <strong>any materials</strong> to build the racer including painting
                    the brick. You may not use sharp, hazardous or flammable materials, and we
                    reserve the right to ban any racer that the judges deem to be dangerous.
                  </p>
                </div>

                <div class="flex items-start gap-3">
                  <div
                    class="bg-purple-100 dark:bg-purple-900/30 rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0 mt-1"
                  >
                    <span class="text-purple-600 dark:text-purple-400 font-bold text-sm">4</span>
                  </div>
                  <p class="leading-relaxed">
                    To fit on the track, the total size of the racer, including the brick, cannot
                    exceed
                    <strong>10 inches in width × 18 inches in length × 15 inches in height</strong>.
                    (You may include lighter artistic elements over 15")
                  </p>
                </div>

                <div class="flex items-start gap-3">
                  <div
                    class="bg-purple-100 dark:bg-purple-900/30 rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0 mt-1"
                  >
                    <span class="text-purple-600 dark:text-purple-400 font-bold text-sm">5</span>
                  </div>
                  <p class="leading-relaxed">
                    The total weight of the brick racer, including the brick and all materials
                    attached to it, should not exceed
                    <strong>15lbs in total weight</strong>. We'll get you the full description of
                    the Brickrace with entry form and other details later.
                  </p>
                </div>
              </div>
            </AccordionTab>

            <!-- How Does the Race Work? -->
            <AccordionTab>
              <template #header>
                <div class="flex items-center gap-2">
                  <i class="pi pi-play-circle text-indigo-600 dark:text-indigo-400" />
                  <span class="font-semibold">How Does the Race Work?</span>
                </div>
              </template>
              <div class="space-y-6 text-gray-700 dark:text-gray-300">
                <p class="text-lg text-gray-900 dark:text-white font-medium mb-4">
                  The Great Holyoke Brick Race follows a structured process from registration to
                  victory:
                </p>

                <div class="space-y-5">
                  <div class="flex items-start gap-4">
                    <div
                      class="bg-blue-100 dark:bg-blue-900/30 rounded-full w-10 h-10 flex items-center justify-center flex-shrink-0"
                    >
                      <span class="text-blue-600 dark:text-blue-400 font-bold">1</span>
                    </div>
                    <div>
                      <h4 class="font-semibold text-gray-900 dark:text-white mb-2">
                        💻 Website Registration
                      </h4>
                      <p class="leading-relaxed mb-3">
                        <strong>Before race day:</strong> Create an account on this website and
                        register your racer. Upload a photo, provide your racer details, and get
                        your unique racer number assigned. This step must be completed before you
                        can check in on race day.
                      </p>
                      <div
                        class="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3"
                      >
                        <p class="text-sm text-blue-800 dark:text-blue-200">
                          <i class="pi pi-info-circle mr-1" />
                          <strong>Important:</strong> You cannot participate in the race without
                          first registering your racer on this website.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div class="flex items-start gap-4">
                    <div
                      class="bg-indigo-100 dark:bg-indigo-900/30 rounded-full w-10 h-10 flex items-center justify-center flex-shrink-0"
                    >
                      <span class="text-indigo-600 dark:text-indigo-400 font-bold">2</span>
                    </div>
                    <div>
                      <h4 class="font-semibold text-gray-900 dark:text-white mb-2">
                        📝 Race Day Check-in
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
                      class="bg-indigo-100 dark:bg-indigo-900/30 rounded-full w-10 h-10 flex items-center justify-center flex-shrink-0"
                    >
                      <span class="text-indigo-600 dark:text-indigo-400 font-bold">3</span>
                    </div>
                    <div>
                      <h4 class="font-semibold text-gray-900 dark:text-white mb-2">
                        ⏱️ Qualifying Rounds
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
                      class="bg-indigo-100 dark:bg-indigo-900/30 rounded-full w-10 h-10 flex items-center justify-center flex-shrink-0"
                    >
                      <span class="text-indigo-600 dark:text-indigo-400 font-bold">4</span>
                    </div>
                    <div>
                      <h4 class="font-semibold text-gray-900 dark:text-white mb-2">
                        🏆 Tournament Brackets
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
                      class="bg-indigo-100 dark:bg-indigo-900/30 rounded-full w-10 h-10 flex items-center justify-center flex-shrink-0"
                    >
                      <span class="text-indigo-600 dark:text-indigo-400 font-bold">5</span>
                    </div>
                    <div>
                      <h4 class="font-semibold text-gray-900 dark:text-white mb-2">
                        🎉 Awards Ceremony
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
            </AccordionTab>

            <!-- Awards & Recognition -->
            <AccordionTab>
              <template #header>
                <div class="flex items-center gap-2">
                  <i class="pi pi-trophy text-yellow-600 dark:text-yellow-400" />
                  <span class="font-semibold">Awards & Recognition</span>
                </div>
              </template>
              <div class="space-y-6 text-gray-700 dark:text-gray-300">
                <p class="text-lg text-gray-900 dark:text-white font-medium mb-4">
                  The Great Holyoke Brick Race celebrates both speed and creativity with custom
                  trophies:
                </p>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div
                    class="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-5"
                  >
                    <div class="flex items-center gap-3 mb-3">
                      <div
                        class="bg-yellow-100 dark:bg-yellow-900/30 rounded-full w-10 h-10 flex items-center justify-center"
                      >
                        <i class="pi pi-bolt text-yellow-600 dark:text-yellow-400" />
                      </div>
                      <h4 class="font-semibold text-yellow-800 dark:text-yellow-200">
                        Fastest Racers
                      </h4>
                    </div>
                    <p class="text-yellow-700 dark:text-yellow-300 text-sm leading-relaxed">
                      Custom trophies awarded to the fastest racers based on qualifying times and
                      bracket tournament results.
                    </p>
                  </div>

                  <div
                    class="bg-cyan-50 dark:bg-cyan-900/20 border border-cyan-200 dark:border-cyan-800 rounded-lg p-5"
                  >
                    <div class="flex items-center gap-3 mb-3">
                      <div
                        class="bg-cyan-100 dark:bg-cyan-900/30 rounded-full w-10 h-10 flex items-center justify-center"
                      >
                        <i class="pi pi-clock text-cyan-600 dark:text-cyan-400" />
                      </div>
                      <h4 class="font-semibold text-cyan-800 dark:text-cyan-200">Slowest Racers</h4>
                    </div>
                    <p class="text-cyan-700 dark:text-cyan-300 text-sm leading-relaxed">
                      Celebrating the joy of participation - sometimes the most memorable racers
                      take their time!
                    </p>
                  </div>

                  <div
                    class="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-5"
                  >
                    <div class="flex items-center gap-3 mb-3">
                      <div
                        class="bg-purple-100 dark:bg-purple-900/30 rounded-full w-10 h-10 flex items-center justify-center"
                      >
                        <i class="pi pi-palette text-purple-600 dark:text-purple-400" />
                      </div>
                      <h4 class="font-semibold text-purple-800 dark:text-purple-200">
                        Most Creative
                      </h4>
                    </div>
                    <p class="text-purple-700 dark:text-purple-300 text-sm leading-relaxed">
                      Recognition for the most imaginative and artistic racer designs that showcase
                      exceptional creativity.
                    </p>
                  </div>

                  <div
                    class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-5"
                  >
                    <div class="flex items-center gap-3 mb-3">
                      <div
                        class="bg-red-100 dark:bg-red-900/30 rounded-full w-10 h-10 flex items-center justify-center"
                      >
                        <i class="pi pi-exclamation-triangle text-red-600 dark:text-red-400" />
                      </div>
                      <h4 class="font-semibold text-red-800 dark:text-red-200">Best Crash</h4>
                    </div>
                    <p class="text-red-700 dark:text-red-300 text-sm leading-relaxed">
                      Sometimes awarded for the most spectacular or memorable crash during the
                      competition.
                    </p>
                  </div>

                  <div
                    class="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-5"
                  >
                    <div class="flex items-center gap-3 mb-3">
                      <div
                        class="bg-blue-100 dark:bg-blue-900/30 rounded-full w-10 h-10 flex items-center justify-center"
                      >
                        <i class="pi pi-star text-blue-600 dark:text-blue-400" />
                      </div>
                      <h4 class="font-semibold text-blue-800 dark:text-blue-200">
                        Special Categories
                      </h4>
                    </div>
                    <p class="text-blue-700 dark:text-blue-300 text-sm leading-relaxed">
                      Additional awards may be given based on the year's entries and the judges'
                      discretion.
                    </p>
                  </div>
                </div>

                <div
                  class="bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg p-4 mt-6"
                >
                  <p class="text-sm text-gray-600 dark:text-gray-400 italic text-center">
                    Remember: The race emphasizes fun, creativity, and the sculptural quality of the
                    race cars as much as speed. It's "performance art meets sport" – everyone's a
                    winner in this celebration of imagination!
                  </p>
                </div>
              </div>
            </AccordionTab>

            <!-- Location & Venue -->
            <AccordionTab>
              <template #header>
                <div class="flex items-center gap-2">
                  <i class="pi pi-map-marker text-orange-600 dark:text-orange-400" />
                  <span class="font-semibold">Location & Venue</span>
                </div>
              </template>
              <div class="space-y-6 text-gray-700 dark:text-gray-300">
                <!-- Main Venue Info -->
                <div
                  class="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-6"
                >
                  <div class="flex items-start gap-4">
                    <div
                      class="bg-orange-100 dark:bg-orange-900/30 rounded-full w-12 h-12 flex items-center justify-center flex-shrink-0"
                    >
                      <i class="pi pi-building text-orange-600 dark:text-orange-400 text-xl" />
                    </div>
                    <div>
                      <h4 class="text-lg font-semibold text-orange-800 dark:text-orange-200 mb-2">
                        Paper City Studios
                      </h4>
                      <p class="text-orange-700 dark:text-orange-300 mb-1">
                        <strong>80 Race Street</strong>
                      </p>
                      <p class="text-orange-700 dark:text-orange-300 mb-3">
                        Holyoke, Massachusetts
                      </p>
                      <p class="text-sm text-orange-600 dark:text-orange-400 mb-4">
                        The race takes place on the custom concrete track at this historic venue on
                        Race Street - a fitting location for our gravity-powered brick racing
                        competition!
                      </p>
                      <Button
                        size="small"
                        severity="secondary"
                        outlined
                        icon="pi pi-map"
                        label="View on Google Maps"
                        class="text-orange-700 dark:text-orange-300 border-orange-300 dark:border-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/20"
                        @click="
                          () =>
                            window.open(
                              'https://maps.google.com/?q=80+Race+Street,+Holyoke,+MA',
                              '_blank'
                            )
                        "
                      />
                    </div>
                  </div>
                </div>

                <!-- Additional Location Details -->
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div class="flex items-start gap-3">
                    <div
                      class="bg-blue-100 dark:bg-blue-900/30 rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0 mt-1"
                    >
                      <i class="pi pi-car text-blue-600 dark:text-blue-400 text-sm" />
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
                      class="bg-green-100 dark:bg-green-900/30 rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0 mt-1"
                    >
                      <i class="pi pi-users text-green-600 dark:text-green-400 text-sm" />
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
                      class="bg-yellow-100 dark:bg-yellow-900/30 rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0 mt-1"
                    >
                      <i class="pi pi-shopping-cart text-yellow-600 dark:text-yellow-400 text-sm" />
                    </div>
                    <div>
                      <p class="font-medium text-gray-900 dark:text-white mb-1">
                        Food & Refreshments
                      </p>
                      <p class="text-sm leading-relaxed">
                        Food trucks and local vendors provide delicious options throughout the event
                      </p>
                    </div>
                  </div>

                  <div class="flex items-start gap-3">
                    <div
                      class="bg-purple-100 dark:bg-purple-900/30 rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0 mt-1"
                    >
                      <i class="pi pi-heart text-purple-600 dark:text-purple-400 text-sm" />
                    </div>
                    <div>
                      <p class="font-medium text-gray-900 dark:text-white mb-1">Family Friendly</p>
                      <p class="text-sm leading-relaxed">
                        A fun community event perfect for all ages and backgrounds
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </AccordionTab>
          </Accordion>
        </div>

        <!-- Call to Action -->
        <Card class="border-2 border-green-200 dark:border-green-800">
          <template #content>
            <div class="text-center space-y-6">
              <div class="flex justify-center">
                <div
                  class="bg-gradient-to-r from-green-600 to-blue-600 rounded-full w-16 h-16 flex items-center justify-center"
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
                <Button size="large" class="font-semibold" @click="navigateTo('/racers/add')">
                  <i class="pi pi-plus mr-2" />
                  Register Your Racer
                </Button>
                <Button
                  size="large"
                  severity="secondary"
                  class="font-semibold"
                  @click="navigateTo('/races')"
                >
                  <i class="pi pi-flag mr-2" />
                  View Current Races
                </Button>
                <Button
                  size="large"
                  severity="secondary"
                  outlined
                  class="font-semibold"
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
