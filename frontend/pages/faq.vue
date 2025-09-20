<template>
  <div class="min-h-screen bg-white">
    <!-- Hero Section -->
    <div class="bg-white">
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
          <h1 class="text-4xl md:text-5xl font-bold mb-6 text-black">Frequently Asked Questions</h1>
          <p class="text-xl md:text-2xl text-gray-600 max-w-4xl mx-auto">
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
              <!-- Quick Rules Summary -->
              <AccordionPanel value="0">
                <AccordionHeader>
                  <div class="flex items-center gap-2">
                    <i class="pi pi-list text-lg text-gray-600" />
                    <span class="font-bold text-black">Quick Rules Summary</span>
                  </div>
                </AccordionHeader>
                <AccordionContent>
                  <div class="space-y-4 text-gray-700">
                    <p class="leading-relaxed mb-4">
                      <strong>Here's everything you need to know at a glance:</strong>
                    </p>
                    
                    <div class="bg-gray-50 border-2 border-gray-300 rounded-lg p-4">
                      <ul class="space-y-2">
                        <li class="flex items-start">
                          <i class="pi pi-check-circle text-green-500 mt-1 mr-2" />
                          <span><strong>Brick:</strong> Standard building brick (8" × 4" × 2.5", 4-5 lbs)</span>
                        </li>
                        <li class="flex items-start">
                          <i class="pi pi-check-circle text-green-500 mt-1 mr-2" />
                          <span><strong>Size limit:</strong> 10" wide × 18" long × 15" tall</span>
                        </li>
                        <li class="flex items-start">
                          <i class="pi pi-check-circle text-green-500 mt-1 mr-2" />
                          <span><strong>Weight limit:</strong> 15 lbs total (including brick)</span>
                        </li>
                        <li class="flex items-start">
                          <i class="pi pi-check-circle text-green-500 mt-1 mr-2" />
                          <span><strong>Power:</strong> Gravity only - no motors or propulsion</span>
                        </li>
                        <li class="flex items-start">
                          <i class="pi pi-check-circle text-green-500 mt-1 mr-2" />
                          <span><strong>Materials:</strong> Anything safe - no sharp edges, hazardous, or flammable materials</span>
                        </li>
                        <li class="flex items-start">
                          <i class="pi pi-check-circle text-green-500 mt-1 mr-2" />
                          <span><strong>Registration:</strong> FREE - register on this website before race day</span>
                        </li>
                        <li class="flex items-start">
                          <i class="pi pi-check-circle text-green-500 mt-1 mr-2" />
                          <span><strong>Who can enter:</strong> Everyone! All ages and backgrounds welcome</span>
                        </li>
                      </ul>
                    </div>

                    <p class="text-sm text-gray-600 italic mt-4">
                      When in doubt, remember: it's about creativity, community, and having a blast 
                      watching bricks race down our custom concrete track!
                    </p>
                  </div>
                </AccordionContent>
              </AccordionPanel>

              <!-- Who can enter? -->
              <AccordionPanel value="1">
                <AccordionHeader>
                  <div class="flex items-center gap-2">
                    <i class="pi pi-users text-lg text-purple-600" />
                    <span class="font-bold text-black">Who Can Enter?</span>
                  </div>
                </AccordionHeader>
                <AccordionContent>
                  <div class="space-y-4 text-gray-700">
                    <div class="flex items-start gap-2 md:gap-3">
                      <div
                        class="bg-brand-blue rounded-full w-6 h-6 md:w-8 md:h-8 flex items-center justify-center flex-shrink-0 mt-1"
                      >
                        <span class="text-white font-bold text-xs md:text-sm">1</span>
                      </div>
                      <p class="leading-relaxed">
                        Everyone! Artists, students, mechanics, tinkerers, inventors, Library of
                        Congress archivists, compulsive contest enterers – if you can build it, 
                        you can race it.
                      </p>
                    </div>

                    <div class="flex items-start gap-2 md:gap-3">
                      <div
                        class="bg-brand-blue rounded-full w-6 h-6 md:w-8 md:h-8 flex items-center justify-center flex-shrink-0 mt-1"
                      >
                        <span class="text-white font-bold text-xs md:text-sm">2</span>
                      </div>
                      <p class="leading-relaxed">
                        Solo or squad – bring your whole crew to build one epic racer.
                      </p>
                    </div>

                    <div class="flex items-start gap-2 md:gap-3">
                      <div
                        class="bg-brand-blue rounded-full w-6 h-6 md:w-8 md:h-8 flex items-center justify-center flex-shrink-0 mt-1"
                      >
                        <span class="text-white font-bold text-xs md:text-sm">3</span>
                      </div>
                      <p class="leading-relaxed">
                        We welcome racers from everywhere – Holyoke, Framingham, Fargo, 
                        Fairbanks, Faskrudsfjordur (Iceland), or your kitchen table. 
                        Build a brick racer and you're in!
                      </p>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionPanel>

              <!-- Entry Fees and Registration -->
              <AccordionPanel value="2">
                <AccordionHeader>
                  <div class="flex items-center gap-2">
                    <i class="pi pi-dollar text-lg text-green-600" />
                    <span class="font-bold text-black">Is It Free?</span>
                  </div>
                </AccordionHeader>
                <AccordionContent>
                  <div class="space-y-4 text-gray-700">
                    <div class="flex items-start gap-2 md:gap-3">
                      <div
                        class="bg-green-600 rounded-full w-6 h-6 md:w-8 md:h-8 flex items-center justify-center flex-shrink-0 mt-1"
                      >
                        <span class="text-white font-bold text-xs md:text-sm">1</span>
                      </div>
                      <p class="leading-relaxed">
                        <strong>FREE!</strong> Zero dollars. Zilch. This is a community party, 
                        not a cash grab.
                      </p>
                    </div>

                    <div class="flex items-start gap-2 md:gap-3">
                      <div
                        class="bg-green-600 rounded-full w-6 h-6 md:w-8 md:h-8 flex items-center justify-center flex-shrink-0 mt-1"
                      >
                        <span class="text-white font-bold text-xs md:text-sm">2</span>
                      </div>
                      <p class="leading-relaxed">
                        Enter as many racers as you want – each needs separate registration, 
                        but they're all free. Build one or build twenty, we're here for it.
                      </p>
                    </div>

                    <div class="flex items-start gap-2 md:gap-3">
                      <div
                        class="bg-green-600 rounded-full w-6 h-6 md:w-8 md:h-8 flex items-center justify-center flex-shrink-0 mt-1"
                      >
                        <span class="text-white font-bold text-xs md:text-sm">3</span>
                      </div>
                      <p class="leading-relaxed">
                        Spectators are free too. Bring everyone – we need the cheering section.
                      </p>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionPanel>

              <!-- Location & Venue -->
              <AccordionPanel value="3">
                <AccordionHeader>
                  <div class="flex items-center gap-2">
                    <i class="pi pi-map-marker text-lg text-blue-600" />
                    <span class="font-bold text-black">Where's the Race?</span>
                  </div>
                </AccordionHeader>
                <AccordionContent>
                  <div class="space-y-6 text-gray-700">
                    <!-- Main Venue Info -->
                    <div class="bg-white border-2 border-brand-blue rounded-lg p-6">
                      <div class="flex flex-col md:flex-row items-center md:items-start gap-4 md:gap-4">
                        <div
                          class="bg-brand-blue rounded-full w-12 h-12 flex items-center justify-center flex-shrink-0"
                        >
                          <i class="pi pi-building text-white text-xl" />
                        </div>
                        <div class="text-center md:text-left">
                          <h4 class="text-lg font-semibold text-black mb-2">Paper City Studios</h4>
                          <p class="text-gray-700 mb-1">
                            <strong>80 Race Street</strong>
                          </p>
                          <p class="text-gray-700 mb-3">Holyoke, Massachusetts</p>
                          <p class="text-sm text-gray-600">
                            Custom concrete track on Race Street – because where else would you race bricks?
                          </p>
                        </div>
                      </div>
                      <div class="mt-4 text-center">
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

                    <!-- Additional Location Details -->
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div class="flex items-start gap-2 md:gap-3">
                        <div
                          class="bg-brand-blue rounded-full w-6 h-6 md:w-8 md:h-8 flex items-center justify-center flex-shrink-0 mt-1"
                        >
                          <i class="pi pi-car text-white text-sm" />
                        </div>
                        <div>
                          <p class="font-medium text-black mb-1">Parking</p>
                          <p class="text-sm leading-relaxed">
                            Street parking available on Race Street and surrounding areas
                          </p>
                        </div>
                      </div>

                      <div class="flex items-start gap-2 md:gap-3">
                        <div
                          class="bg-brand-blue rounded-full w-6 h-6 md:w-8 md:h-8 flex items-center justify-center flex-shrink-0 mt-1"
                        >
                          <i class="pi pi-users text-white text-sm" />
                        </div>
                        <div>
                          <p class="font-medium text-black mb-1">Spectators Welcome</p>
                          <p class="text-sm leading-relaxed">
                            Spectators welcome to cheer on the creativity
                          </p>
                        </div>
                      </div>

                      <div class="flex items-start gap-2 md:gap-3">
                        <div
                          class="bg-brand-blue rounded-full w-6 h-6 md:w-8 md:h-8 flex items-center justify-center flex-shrink-0 mt-1"
                        >
                          <i class="pi pi-shopping-cart text-white text-sm" />
                        </div>
                        <div>
                          <p class="font-medium text-black mb-1">Food & Refreshments</p>
                          <p class="text-sm leading-relaxed">
                            Food trucks keep you fueled for the fun
                          </p>
                        </div>
                      </div>

                      <div class="flex items-start gap-2 md:gap-3">
                        <div
                          class="bg-brand-blue rounded-full w-6 h-6 md:w-8 md:h-8 flex items-center justify-center flex-shrink-0 mt-1"
                        >
                          <i class="pi pi-heart text-white text-sm" />
                        </div>
                        <div>
                          <p class="font-medium text-black mb-1">Family Friendly</p>
                          <p class="text-sm leading-relaxed">
                            Creative fun for all ages and skill levels
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionPanel>

              <!-- What makes the cars go? -->
              <AccordionPanel value="4">
                <AccordionHeader>
                  <div class="flex items-center gap-2">
                    <i class="pi pi-send text-lg text-purple-600" />
                    <span class="font-bold text-black">How Do Cars Go Fast?</span>
                  </div>
                </AccordionHeader>
                <AccordionContent>
                  <div class="space-y-4 text-gray-700">
                    <div class="flex items-start gap-2 md:gap-3">
                      <div
                        class="bg-purple-600 rounded-full w-6 h-6 md:w-8 md:h-8 flex items-center justify-center flex-shrink-0 mt-1"
                      >
                        <span class="text-white font-bold text-xs md:text-sm">1</span>
                      </div>
                      <p class="leading-relaxed">
                        <strong>Gravity, obviously.</strong> No motors, batteries, jet packs, or hamster wheels. 
                        Just you, your brick, and physics doing its thing down our concrete track.
                      </p>
                    </div>

                    <div class="flex items-start gap-2 md:gap-3">
                      <div
                        class="bg-purple-600 rounded-full w-6 h-6 md:w-8 md:h-8 flex items-center justify-center flex-shrink-0 mt-1"
                      >
                        <span class="text-white font-bold text-xs md:text-sm">2</span>
                      </div>
                      <p class="leading-relaxed">
                        Moving parts? Sure! Spinning wheels, flapping wings, rotating doodads – 
                        as long as they're not secretly rocket boosters. Style points matter.
                      </p>
                    </div>

                    <div class="flex items-start gap-2 md:gap-3">
                      <div
                        class="bg-purple-600 rounded-full w-6 h-6 md:w-8 md:h-8 flex items-center justify-center flex-shrink-0 mt-1"
                      >
                        <span class="text-white font-bold text-xs md:text-sm">3</span>
                      </div>
                      <p class="leading-relaxed">
                        Weight distribution, aerodynamics, wheel alignment – it's science meets art. 
                        Also known as "why did my perfectly engineered racer lose to a brick 
                        duct-taped to a skateboard?"
                      </p>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionPanel>

              <!-- Racer Specifications -->
              <AccordionPanel value="5">
                <AccordionHeader>
                  <div class="flex items-center gap-2">
                    <i class="pi pi-cog text-lg text-gray-600" />
                    <span class="font-bold text-black">Build Requirements</span>
                  </div>
                </AccordionHeader>
                <AccordionContent>
                  <div class="space-y-4 text-gray-700">
                    <div class="flex items-start gap-2 md:gap-3">
                      <div
                        class="bg-brand-blue rounded-full w-6 h-6 md:w-8 md:h-8 flex items-center justify-center flex-shrink-0 mt-1"
                      >
                        <span class="text-white font-bold text-xs md:text-sm">1</span>
                      </div>
                      <p class="leading-relaxed">
                        <strong>You must bring your own brick!</strong> Every racer needs a standard 
                        building brick as its passenger - approximately
                        <strong>8" × 4" × 2.5"</strong> and weighing <strong>4-5 pounds</strong>.
                        Don't show up with a cinder block, decorative garden brick, or a Lego - 
                        we mean a real clay building brick!
                      </p>
                    </div>

                    <div class="flex items-start gap-2 md:gap-3">
                      <div
                        class="bg-brand-blue rounded-full w-6 h-6 md:w-8 md:h-8 flex items-center justify-center flex-shrink-0 mt-1"
                      >
                        <span class="text-white font-bold text-xs md:text-sm">2</span>
                      </div>
                      <p class="leading-relaxed">
                        <strong>Decorate that brick!</strong> Paint, flames, glitter, googly eyes – 
                        whatever makes your brick fabulous. Just keep it safe (no flamethrowers).
                      </p>
                    </div>

                    <div class="flex items-start gap-2 md:gap-3">
                      <div
                        class="bg-brand-blue rounded-full w-6 h-6 md:w-8 md:h-8 flex items-center justify-center flex-shrink-0 mt-1"
                      >
                        <span class="text-white font-bold text-xs md:text-sm">3</span>
                      </div>
                      <p class="leading-relaxed">
                        <strong>Gravity only!</strong> No motors, rockets, or tiny engines. 
                        Let physics do the work.
                      </p>
                    </div>

                    <div class="flex items-start gap-2 md:gap-3">
                      <div
                        class="bg-brand-blue rounded-full w-6 h-6 md:w-8 md:h-8 flex items-center justify-center flex-shrink-0 mt-1"
                      >
                        <span class="text-white font-bold text-xs md:text-sm">4</span>
                      </div>
                      <p class="leading-relaxed">
                        Build with <strong>whatever you want</strong> – just keep it legal. 
                        No knives, explosives, or things that'll get us on the news for the wrong reasons.
                      </p>
                    </div>

                    <div class="flex items-start gap-2 md:gap-3">
                      <div
                        class="bg-brand-blue rounded-full w-6 h-6 md:w-8 md:h-8 flex items-center justify-center flex-shrink-0 mt-1"
                      >
                        <span class="text-white font-bold text-xs md:text-sm">5</span>
                      </div>
                      <p class="leading-relaxed">
                        To fit on the track, the total size of the racer, including the brick,
                        cannot exceed
                        <strong
                          >10 inches in width × 18 inches in length × 15 inches in height</strong
                        >. Want to add decorative wings or flags taller than 15"? Go for it - 
                        but don't come crying if they snap off halfway down the ramp!
                      </p>
                    </div>

                    <div class="flex items-start gap-2 md:gap-3">
                      <div
                        class="bg-brand-blue rounded-full w-6 h-6 md:w-8 md:h-8 flex items-center justify-center flex-shrink-0 mt-1"
                      >
                        <span class="text-white font-bold text-xs md:text-sm">6</span>
                      </div>
                      <p class="leading-relaxed">
                        The total weight of the brick racer, including the brick and all materials
                        attached to it, should not exceed
                        <strong>15lbs in total weight</strong>. Pro tip: More weight means more momentum! 
                        Many successful racers aim close to the 15lb limit to maximize speed down the ramp.
                      </p>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionPanel>

              <!-- How Does the Race Work? -->
              <AccordionPanel value="6">
                <AccordionHeader>
                  <div class="flex items-center gap-2">
                    <i class="pi pi-play-circle text-lg text-green-600" />
                    <span class="font-bold text-black">How Does Race Day Work?</span>
                  </div>
                </AccordionHeader>
                <AccordionContent>
                  <div class="space-y-6 text-gray-700">
                    <p class="text-black font-medium mb-4">
                      The Great Holyoke Brick Race follows a structured process from registration to
                      victory:
                    </p>

                    <div class="space-y-5">
                      <div class="flex items-start gap-2 md:gap-4">
                        <div
                          class="bg-brand-green rounded-full w-6 h-6 md:w-8 md:h-8 flex items-center justify-center flex-shrink-0"
                        >
                          <span class="text-white font-bold text-xs md:text-sm">1</span>
                        </div>
                        <div>
                          <h4 class="font-semibold text-black mb-2">Website Registration</h4>
                          <p class="leading-relaxed mb-3">
                            Register here before the race, upload a photo, get your 
                            racer number. No website registration = no racing. It's that simple.
                          </p>
                        </div>
                      </div>

                      <div class="flex items-start gap-2 md:gap-4">
                        <div
                          class="bg-brand-green rounded-full w-6 h-6 md:w-8 md:h-8 flex items-center justify-center flex-shrink-0"
                        >
                          <span class="text-white font-bold text-xs md:text-sm">2</span>
                        </div>
                        <div>
                          <h4 class="font-semibold text-black mb-2">Race Day Check-in</h4>
                          <p class="leading-relaxed">
                            Show up with your racer. Officials check that it's legal, verify your 
                            registration, and you're in. Track your status live on this site.
                          </p>
                        </div>
                      </div>

                      <div class="flex items-start gap-2 md:gap-4">
                        <div
                          class="bg-brand-green rounded-full w-6 h-6 md:w-8 md:h-8 flex items-center justify-center flex-shrink-0"
                        >
                          <span class="text-white font-bold text-xs md:text-sm">3</span>
                        </div>
                        <div>
                          <h4 class="font-semibold text-black mb-2">Qualifying Rounds</h4>
                          <p class="leading-relaxed">
                            Multiple timed runs down the track. Electronic timing records everything, 
                            your best time sets your bracket seeding. Watch live results here.
                          </p>
                        </div>
                      </div>

                      <div class="flex items-start gap-2 md:gap-4">
                        <div
                          class="bg-brand-green rounded-full w-6 h-6 md:w-8 md:h-8 flex items-center justify-center flex-shrink-0"
                        >
                          <span class="text-white font-bold text-xs md:text-sm">4</span>
                        </div>
                        <div>
                          <h4 class="font-semibold text-black mb-2">Tournament Brackets</h4>
                          <p class="leading-relaxed">
                            Double-elimination brackets based on qualifying times. Head-to-head races, 
                            winners advance, champions crowned. Follow the madness live on this site.
                          </p>
                        </div>
                      </div>

                      <div class="flex items-start gap-2 md:gap-4">
                        <div
                          class="bg-brand-green rounded-full w-6 h-6 md:w-8 md:h-8 flex items-center justify-center flex-shrink-0"
                        >
                          <span class="text-white font-bold text-xs md:text-sm">5</span>
                        </div>
                        <div>
                          <h4 class="font-semibold text-black mb-2">Awards Ceremony</h4>
                          <p class="leading-relaxed">
                            Custom trophies are awarded for fastest racers, most creative designs,
                            and other special categories. Everyone celebrates the amazing creativity
                            and engineering on display!
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionPanel>

              <!-- What if my car breaks? -->
              <AccordionPanel value="7">
                <AccordionHeader>
                  <div class="flex items-center gap-2">
                    <i class="pi pi-wrench text-lg text-amber-600" />
                    <span class="font-bold text-black">What If My Car Breaks?</span>
                  </div>
                </AccordionHeader>
                <AccordionContent>
                  <div class="space-y-4 text-gray-700">
                    <div class="flex items-start gap-2 md:gap-3">
                      <div
                        class="bg-amber-600 rounded-full w-6 h-6 md:w-8 md:h-8 flex items-center justify-center flex-shrink-0 mt-1"
                      >
                        <span class="text-white font-bold text-xs md:text-sm">1</span>
                      </div>
                      <p class="leading-relaxed">
                        <strong>That's part of the fun!</strong> Win or spectacularly explode - 
                        you've given everyone a show. Crowds love spectacular failures.
                      </p>
                    </div>

                    <div class="flex items-start gap-2 md:gap-3">
                      <div
                        class="bg-amber-600 rounded-full w-6 h-6 md:w-8 md:h-8 flex items-center justify-center flex-shrink-0 mt-1"
                      >
                        <span class="text-white font-bold text-xs md:text-sm">2</span>
                      </div>
                      <p class="leading-relaxed">
                        During qualifiers? Your best time still counts. During brackets? 
                        Opponent advances, but you've earned your place in racing history.
                      </p>
                    </div>

                    <div class="flex items-start gap-2 md:gap-3">
                      <div
                        class="bg-amber-600 rounded-full w-6 h-6 md:w-8 md:h-8 flex items-center justify-center flex-shrink-0 mt-1"
                      >
                        <span class="text-white font-bold text-xs md:text-sm">3</span>
                      </div>
                      <p class="leading-relaxed">
                        Valuable data for next year! Note what worked, what didn't, 
                        then build something even more amazing (and durable).
                      </p>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionPanel>

              <!-- What if I need to withdraw? -->
              <AccordionPanel value="8">
                <AccordionHeader>
                  <div class="flex items-center gap-2">
                    <i class="pi pi-user-minus text-lg text-red-500" />
                    <span class="font-bold text-black">Can I Withdraw?</span>
                  </div>
                </AccordionHeader>
                <AccordionContent>
                  <div class="space-y-4 text-gray-700">
                    <div class="flex items-start gap-2 md:gap-3">
                      <div
                        class="bg-red-500 rounded-full w-6 h-6 md:w-8 md:h-8 flex items-center justify-center flex-shrink-0 mt-1"
                      >
                        <span class="text-white font-bold text-xs md:text-sm">1</span>
                      </div>
                      <p class="leading-relaxed">
                        Withdraw anytime through your racer profile or ask officials on race day.
                      </p>
                    </div>

                    <div class="flex items-start gap-2 md:gap-3">
                      <div
                        class="bg-red-500 rounded-full w-6 h-6 md:w-8 md:h-8 flex items-center justify-center flex-shrink-0 mt-1"
                      >
                        <span class="text-white font-bold text-xs md:text-sm">2</span>
                      </div>
                      <p class="leading-relaxed">
                        Before qualifiers? No problem. After qualifiers? Brackets adjust
                        automatically.
                      </p>
                    </div>

                    <div class="flex items-start gap-2 md:gap-3">
                      <div
                        class="bg-red-500 rounded-full w-6 h-6 md:w-8 md:h-8 flex items-center justify-center flex-shrink-0 mt-1"
                      >
                        <span class="text-white font-bold text-xs md:text-sm">3</span>
                      </div>
                      <p class="leading-relaxed">
                        Your qualifying times stay in race history. Changed your mind? Rejoin
                        before brackets start.
                      </p>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionPanel>

                            <!-- Awards & Recognition -->
                            <AccordionPanel value="9">
                <AccordionHeader>
                  <div class="flex items-center gap-2">
                    <i class="pi pi-trophy text-lg text-yellow-600" />
                    <span class="font-bold text-black">What Can I Win?</span>
                  </div>
                </AccordionHeader>
                <AccordionContent>
                  <div class="space-y-6 text-gray-700">
                    <p class="text-black font-medium mb-4">
                      The Great Holyoke Brick Race celebrates both speed and creativity with custom
                      trophies:
                    </p>

                    <!-- Loading State -->
                    <div v-if="awardsLoading" class="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div
                        v-for="i in 4"
                        :key="i"
                        class="bg-white border-2 border-gray-200 rounded-lg p-5 animate-pulse"
                      >
                        <div class="flex items-center gap-3 mb-3">
                          <div class="bg-gray-300 rounded-full w-8 h-8" />
                          <div class="h-5 bg-gray-300 rounded w-24" />
                        </div>
                        <div class="space-y-2">
                          <div class="h-3 bg-gray-200 rounded w-full" />
                          <div class="h-3 bg-gray-200 rounded w-3/4" />
                        </div>
                      </div>
                    </div>

                    <!-- Dynamic Awards -->
                    <div
                      v-else-if="awards.length > 0"
                      class="grid grid-cols-1 md:grid-cols-2 gap-6"
                    >
                      <div
                        v-for="award in awards"
                        :key="award.id"
                        class="bg-white border-2 rounded-lg p-5"
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
                            <h4 class="font-semibold text-black mb-2">{{ award.name }}</h4>
                            <p class="text-gray-700 text-sm leading-relaxed">
                              {{ award.description }}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <!-- Fallback message -->
                    <div v-else class="text-center py-8">
                      <i class="pi pi-trophy text-4xl text-gray-400 mb-4" />
                      <p class="text-gray-600">
                        Award categories will be announced closer to race day.
                      </p>
                    </div>

                    <!-- Voting Information -->
                    <div
                      v-if="awards.length > 0"
                      class="bg-blue-50 border-2 border-blue-200 rounded-lg p-6 mt-6"
                    >
                      <div class="flex flex-col md:flex-row items-center md:items-start gap-4 md:gap-4">
                        <div
                          class="bg-blue-500 rounded-full w-12 h-12 flex items-center justify-center flex-shrink-0"
                        >
                          <i class="pi pi-users text-white text-lg" />
                        </div>
                        <div class="flex-1 text-center md:text-left">
                          <h4 class="text-lg font-semibold text-black mb-2">Community Voting</h4>
                          <p class="text-gray-700 leading-relaxed">
                            Many of these awards are decided by community voting! After racers are
                            registered and photos are uploaded, anyone can visit our awards page to
                            vote for their favorites in categories like Most Creative, Best Design,
                            and other special awards. Your vote helps celebrate the amazing
                            creativity and craftsmanship of our participants.
                          </p>
                        </div>
                      </div>
                      <div class="mt-4 text-center">
                        <Button class="btn-primary" @click="navigateTo('/awards')">
                          <i class="pi pi-trophy mr-2" />
                          View Awards & Vote
                        </Button>
                      </div>
                    </div>

                    <p class="text-gray-600 text-left mt-6">
                      Remember: The race emphasizes fun, creativity, and the sculptural quality of
                      the race cars as much as speed. It's "performance art meets sport" –
                      everyone's a winner in this celebration of imagination!
                    </p>
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
                <h3 class="text-2xl font-bold text-black mb-4">Ready to Get Started?</h3>
                <p class="text-lg text-gray-700 mb-6">
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
    'pi-clock': 'border-gray-400',
    'pi-palette': 'border-purple-400',
    'pi-exclamation-triangle': 'border-red-500',
    'pi-star': 'border-green-500',
    'pi-trophy': 'border-yellow-400',
    'pi-heart': 'border-pink-500',
    'pi-thumbs-up': 'border-blue-500'
  }
  return colorMap[icon] || 'border-gray-300'
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
