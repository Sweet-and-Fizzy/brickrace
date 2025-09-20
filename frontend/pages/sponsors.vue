<template>
  <div class="min-h-screen bg-white">
    <!-- Hero Section -->
    <div class="bg-white">
      <!-- Hero Image -->
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <img
          src="~/assets/img/brick_race_logo.jpg"
          alt="The Great Holyoke Brick Race"
          class="w-full h-64 md:h-80 lg:h-96 object-contain rounded-lg"
        >
      </div>

      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div class="text-center">
          <h1 class="text-4xl md:text-5xl font-bold mb-6 text-black">Our Amazing Sponsors</h1>
          <p class="text-xl md:text-2xl text-gray-600 max-w-4xl mx-auto">
            The Great Holyoke Brick Race is made possible by the generous support of our sponsors.
            Their commitment to our community and creative endeavors helps us continue this beloved tradition.
          </p>
        </div>
      </div>
    </div>

    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
      <ClientOnly>
        <!-- Loading State -->
        <div v-if="sponsorsStore.loading" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <div
            v-for="i in 6"
            :key="i"
            class="bg-white rounded-lg shadow-sm border border-gray-200 p-8 animate-pulse"
          >
            <div class="flex flex-col items-center space-y-4">
              <div class="bg-gray-300 rounded-lg w-24 h-24"/>
              <div class="space-y-2 w-full">
                <div class="h-4 bg-gray-300 rounded w-3/4 mx-auto"/>
                <div class="h-3 bg-gray-200 rounded w-1/2 mx-auto"/>
              </div>
            </div>
          </div>
        </div>

        <!-- Sponsors Grid -->
        <div v-else-if="sponsors.length > 0">
          <!-- Premium/Featured Sponsors (if we have high sponsorship amounts) -->
          <div v-if="premiumSponsors.length > 0" class="mb-16">
            <h2 class="text-2xl font-bold text-center text-black mb-8">Premier Sponsors</h2>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              <div
                v-for="sponsor in premiumSponsors"
                :key="sponsor.id"
                class="bg-white rounded-lg shadow-lg border-2 border-brand-gold p-8 hover:shadow-xl transition-shadow"
              >
                <div class="flex flex-col items-center text-center space-y-4">
                  <!-- Logo -->
                  <div class="w-32 h-32 flex items-center justify-center">
                    <img
                      v-if="sponsor.logo_url"
                      :src="sponsor.logo_url"
                      :alt="`${sponsor.name} logo`"
                      class="max-w-full max-h-full object-contain"
                    >
                    <div
                      v-else
                      class="w-24 h-24 bg-gray-100 rounded-lg flex items-center justify-center border border-gray-200"
                    >
                      <i class="pi pi-building text-gray-400 text-2xl"/>
                    </div>
                  </div>

                  <!-- Name -->
                  <h3 class="text-xl font-semibold text-black">{{ sponsor.name }}</h3>

                  <!-- Website Link -->
                  <a
                    v-if="sponsor.website_url"
                    :href="sponsor.website_url"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="text-brand-blue hover:text-brand-green transition-colors flex items-center"
                  >
                    <i class="pi pi-external-link mr-2"/>
                    Visit Website
                  </a>
                </div>
              </div>
            </div>
          </div>

          <!-- Regular Sponsors -->
          <div v-if="regularSponsors.length > 0">
            <h2 class="text-2xl font-bold text-center text-black mb-8">
              {{ premiumSponsors.length > 0 ? 'Supporting Sponsors' : 'Our Sponsors' }}
            </h2>
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              <div
                v-for="sponsor in regularSponsors"
                :key="sponsor.id"
                class="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
              >
                <div class="flex flex-col items-center text-center space-y-3">
                  <!-- Logo -->
                  <div class="w-20 h-20 flex items-center justify-center">
                    <img
                      v-if="sponsor.logo_url"
                      :src="sponsor.logo_url"
                      :alt="`${sponsor.name} logo`"
                      class="max-w-full max-h-full object-contain"
                    >
                    <div
                      v-else
                      class="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center border border-gray-200"
                    >
                      <i class="pi pi-building text-gray-400 text-lg"/>
                    </div>
                  </div>

                  <!-- Name -->
                  <h3 class="text-lg font-medium text-black">{{ sponsor.name }}</h3>

                  <!-- Website Link -->
                  <a
                    v-if="sponsor.website_url"
                    :href="sponsor.website_url"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="text-sm text-brand-blue hover:text-brand-green transition-colors flex items-center"
                  >
                    <i class="pi pi-external-link mr-1 text-xs"/>
                    Visit Website
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Empty State -->
        <div v-else class="text-center py-16">
          <i class="pi pi-building text-gray-400 text-6xl mb-4"/>
          <h3 class="text-lg font-medium text-gray-900 mb-2">No sponsors yet</h3>
          <p class="text-gray-600 mb-6">
            We're always looking for amazing sponsors to support our community event.
          </p>
          <div class="space-y-4">
            <p class="text-gray-600">
              Interested in sponsoring The Great Holyoke Brick Race?
            </p>
            <Button
              class="btn-primary"
              @click="navigateTo('/contact')"
            >
              <i class="pi pi-envelope mr-2"/>
              Contact Us About Sponsorship
            </Button>
          </div>
        </div>

        <!-- Call to Action for Potential Sponsors -->
        <div v-if="sponsors.length > 0" class="mt-16">
          <Card class="border-2 border-brand-blue">
            <template #content>
              <div class="text-center space-y-6">
                <div class="flex justify-center">
                  <div class="bg-brand-blue rounded-full w-16 h-16 flex items-center justify-center">
                    <i class="pi pi-handshake text-2xl text-white"/>
                  </div>
                </div>

                <div>
                  <h3 class="text-2xl font-bold text-black mb-4">Become a Sponsor</h3>
                  <p class="text-lg text-gray-700 mb-6">
                    Join our community of sponsors and help support this unique celebration of creativity,
                    engineering, and community spirit. Your sponsorship helps make the magic happen!
                  </p>
                </div>

                <div class="flex justify-center">
                  <Button
                    size="large"
                    class="btn-primary font-semibold"
                    @click="navigateTo('/contact')"
                  >
                    <i class="pi pi-envelope mr-2"/>
                    Learn About Sponsorship Opportunities
                  </Button>
                </div>
              </div>
            </template>
          </Card>
        </div>
      </ClientOnly>
    </div>
  </div>
</template>

<script setup>
const sponsorsStore = useSponsors()

// Computed
const sponsors = computed(() => sponsorsStore.sponsors.value)

// Split sponsors by sponsorship level (if we want to feature higher-tier sponsors)
const premiumSponsors = computed(() => {
  return sponsors.value.filter(sponsor => 
    sponsor.sponsorship_amount && sponsor.sponsorship_amount >= 1000
  )
})

const regularSponsors = computed(() => {
  return sponsors.value.filter(sponsor => 
    !sponsor.sponsorship_amount || sponsor.sponsorship_amount < 1000
  )
})

// Initialize
onMounted(async () => {
  await sponsorsStore.getActiveSponsors()
})

// SEO
useHead({
  title: 'Our Sponsors - The Great Holyoke Brick Race',
  meta: [
    {
      name: 'description',
      content: 'Meet the amazing sponsors who support The Great Holyoke Brick Race and help make our community event possible.'
    },
    {
      property: 'og:title',
      content: 'Our Sponsors - The Great Holyoke Brick Race'
    },
    {
      property: 'og:description',
      content: 'Meet the amazing sponsors who support The Great Holyoke Brick Race and help make our community event possible.'
    }
  ]
})
</script>