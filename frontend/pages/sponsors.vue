<template>
  <div class="min-h-screen bg-white">
    <!-- Hero Section -->
    <div class="bg-white">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div class="text-center">
          <h1 class="text-4xl md:text-5xl font-bold mb-6 text-black">Our Amazing Sponsors</h1>
          <p class="text-xl md:text-2xl text-gray-600 max-w-4xl mx-auto">
            The Great Holyoke Brick Race is made possible by the generous support of our sponsors.
            Their commitment to our community and creative endeavors helps us continue this beloved
            tradition.
          </p>
        </div>
      </div>
    </div>

    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
      <ClientOnly>
        <!-- Loading State -->
        <div v-if="loading" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <div
            v-for="i in 6"
            :key="i"
            class="bg-white shadow-sm border-2 border-black overflow-hidden animate-pulse"
          >
            <div class="flex flex-col h-full">
              <div class="w-full h-48 p-4 bg-gray-200" />
              <div class="bg-black p-3">
                <div class="h-4 bg-gray-600 w-3/4 mx-auto mb-2" />
                <div class="h-3 bg-gray-500 w-1/2 mx-auto" />
              </div>
            </div>
          </div>
        </div>

        <!-- Sponsors Grid -->
        <div v-else-if="sponsors?.length > 0">
          <!-- Premium/Featured Sponsors (if we have high sponsorship amounts) -->
          <div v-if="premiumSponsors.length > 0" class="mb-16">
            <h2 class="text-2xl font-bold text-center text-black mb-8">Premier Sponsors</h2>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              <div
                v-for="sponsor in premiumSponsors"
                :key="sponsor.id"
                class="bg-white shadow-sm hover:shadow-md transition-shadow duration-200 border-2 border-black overflow-hidden"
              >
                <div class="flex flex-col h-full">
                  <!-- Logo -->
                  <div class="w-full h-64 p-6 flex items-center justify-center bg-white">
                    <img
                      v-if="sponsor.logo_url"
                      :src="sponsor.logo_url"
                      :alt="`${sponsor.name} logo`"
                      class="w-full h-full object-contain"
                    />
                    <div v-else class="w-full h-full bg-gray-100 flex items-center justify-center">
                      <i class="pi pi-building text-gray-400 text-4xl" />
                    </div>
                  </div>

                  <!-- Name and Website -->
                  <div class="bg-black text-white p-4 text-center">
                    <h3 class="text-xl font-semibold mb-2">{{ sponsor.name }}</h3>

                    <!-- Website Link -->
                    <a
                      v-if="sponsor.website_url"
                      :href="sponsor.website_url"
                      target="_blank"
                      rel="noopener noreferrer"
                      class="text-brand-gold hover:text-white transition-colors inline-flex items-center text-sm"
                    >
                      <i class="pi pi-external-link mr-2" />
                      Visit Website
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Regular Sponsors -->
          <div v-if="regularSponsors.length > 0 || premiumSponsors.length > 0">
            <h2 class="text-2xl font-bold text-center text-black mb-8">
              {{ premiumSponsors.length > 0 ? 'Supporting Sponsors' : 'Our Sponsors' }}
            </h2>
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              <div
                v-for="sponsor in regularSponsors"
                :key="sponsor.id"
                class="bg-white shadow-sm hover:shadow-md transition-shadow duration-200 border-2 border-black overflow-hidden"
              >
                <div class="flex flex-col h-full">
                  <!-- Logo -->
                  <div class="w-full h-48 p-4 flex items-center justify-center bg-white">
                    <img
                      v-if="sponsor.logo_url"
                      :src="sponsor.logo_url"
                      :alt="`${sponsor.name} logo`"
                      class="w-full h-full object-contain"
                    />
                    <div v-else class="w-full h-full bg-gray-100 flex items-center justify-center">
                      <i class="pi pi-building text-gray-400 text-3xl" />
                    </div>
                  </div>

                  <!-- Name and Website -->
                  <div class="bg-black text-white p-3 text-center">
                    <h3 class="text-lg font-semibold mb-1">{{ sponsor.name }}</h3>

                    <!-- Website Link -->
                    <a
                      v-if="sponsor.website_url"
                      :href="sponsor.website_url"
                      target="_blank"
                      rel="noopener noreferrer"
                      class="text-sm text-brand-gold hover:text-white transition-colors inline-flex items-center"
                    >
                      <i class="pi pi-external-link mr-1 text-xs" />
                      Visit Website
                    </a>
                  </div>
                </div>
              </div>

              <!-- Become a Sponsor Card -->
              <div
                class="bg-white shadow-sm hover:shadow-md transition-shadow duration-200 border-2 border-brand-blue overflow-hidden"
              >
                <div class="flex flex-col h-full">
                  <!-- Icon and Description -->
                  <div
                    class="w-full h-48 p-4 flex flex-col items-center justify-center bg-white text-center"
                  >
                    <div
                      class="bg-brand-blue rounded-full w-20 h-20 flex items-center justify-center mb-3"
                    >
                      <i class="pi pi-heart text-3xl text-white" />
                    </div>
                    <p class="text-sm text-gray-600">Support creativity and community spirit!</p>
                  </div>

                  <!-- Call to Action -->
                  <div class="bg-brand-blue text-white p-3 text-center">
                    <h3 class="text-lg font-semibold mb-1">Become a Sponsor</h3>
                    <a
                      href="mailto:thegreatholyokebrickrace@gmail.com?subject=Sponsorship Opportunities"
                      class="text-sm text-brand-gold hover:text-white transition-colors inline-flex items-center"
                    >
                      <i class="pi pi-envelope mr-1 text-xs" />
                      Contact Us
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Empty State -->
        <div v-else class="text-center py-16">
          <i class="pi pi-building text-gray-400 text-6xl mb-4" />
          <h3 class="text-lg font-medium text-gray-900 mb-2">No sponsors yet</h3>
          <p class="text-gray-600 mb-6">
            We're always looking for amazing sponsors to support our community event.
          </p>
          <div class="space-y-4">
            <p class="text-gray-600">Interested in sponsoring The Great Holyoke Brick Race?</p>
            <Button
              tag="a"
              href="mailto:thegreatholyokebrickrace@gmail.com?subject=Sponsorship Inquiry&body=Hi! I am interested in learning more about sponsorship opportunities for The Great Holyoke Brick Race."
              class="btn-primary"
            >
              <i class="pi pi-envelope mr-2" />
              Contact Us About Sponsorship
            </Button>
          </div>
        </div>
      </ClientOnly>
    </div>
  </div>
</template>

<script setup>
const sponsorsStore = useSponsors()

// Direct access to reactive refs
const { sponsors, loading } = sponsorsStore

// Split sponsors by sponsorship level (if we want to feature higher-tier sponsors)
const premiumSponsors = computed(() => {
  return (sponsors.value || []).filter(
    (sponsor) => sponsor.sponsorship_amount && sponsor.sponsorship_amount >= 1000
  )
})

const regularSponsors = computed(() => {
  return (sponsors.value || []).filter(
    (sponsor) => !sponsor.sponsorship_amount || sponsor.sponsorship_amount < 1000
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
      content:
        'Meet the amazing sponsors who support The Great Holyoke Brick Race and help make our community event possible.'
    },
    {
      property: 'og:title',
      content: 'Our Sponsors - The Great Holyoke Brick Race'
    },
    {
      property: 'og:description',
      content:
        'Meet the amazing sponsors who support The Great Holyoke Brick Race and help make our community event possible.'
    }
  ]
})
</script>
