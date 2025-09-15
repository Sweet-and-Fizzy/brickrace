<template>
  <div class="min-h-screen bg-white">
    <div class="container mx-auto px-4 py-8">
      <div class="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-8">
        <div class="flex-1">
          <h1 class="text-3xl font-bold text-black">My Racers</h1>
        </div>
        <div class="flex-shrink-0">
          <NuxtLink to="/racers/add">
            <Button size="large" class="btn-primary">
              <i class="pi pi-plus mr-2" />
              <span>Add New Racer</span>
            </Button>
          </NuxtLink>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="flex justify-center py-8">
        <ProgressSpinner />
      </div>

      <!-- My Racers DataView -->
      <div v-else-if="myRacers.length" class="bg-white rounded-lg p-6">
        <DataView
          :value="myRacers"
          layout="grid"
          :pt="{
            root: { class: 'bg-transparent' },
            content: { class: 'bg-transparent' }
          }"
        >
          <template #grid="slotProps">
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              <div
                v-for="racer in slotProps.data || slotProps.items || []"
                :key="racer.id"
                class="cursor-pointer"
              >
                <NuxtLink :to="`/racers/${racer.slug}`" class="block">
                  <Card
                    class="group hover:shadow-2xl hover:scale-[1.02] hover:-translate-y-2 transition-all duration-500 ease-out cursor-pointer border-2 border-gray-100 hover:border-red-400 rounded-2xl overflow-hidden bg-white h-full relative"
                    style="box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05)"
                  >
                    <template #header>
                      <div class="relative overflow-hidden group/slideshow">
                        <!-- Mini Slideshow -->
                        <div
                          v-if="getAllRacerImages(racer).length > 1"
                          class="relative w-full h-48 overflow-hidden"
                        >
                          <!-- Single image with smooth transition -->
                          <div class="absolute inset-0">
                            <img
                              :key="getCurrentImage(racer)"
                              :src="getCurrentImage(racer)"
                              :alt="racer.name?.replace(/[\r\n\t]/g, ' ').trim() || ''"
                              class="w-full h-48 object-cover transition-all duration-300 ease-in-out"
                            >
                          </div>

                          <!-- Glass Effect Navigation Arrows -->
                          <button
                            class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-700 hover:text-red-600 w-10 h-10 flex items-center justify-center opacity-0 group-hover/slideshow:opacity-100 transition-all duration-300 z-10"
                            style="
                              border-radius: 8px;
                              background: rgba(255, 255, 255, 0.2);
                              backdrop-filter: blur(12px);
                              border: 1px solid rgba(255, 255, 255, 0.3);
                              box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
                            "
                            @click.prevent="previousImage(racer)"
                          >
                            <i class="pi pi-chevron-left text-sm font-bold" />
                          </button>

                          <button
                            class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-700 hover:text-red-600 w-10 h-10 flex items-center justify-center opacity-0 group-hover/slideshow:opacity-100 transition-all duration-300 z-10"
                            style="
                              border-radius: 8px;
                              background: rgba(255, 255, 255, 0.2);
                              backdrop-filter: blur(12px);
                              border: 1px solid rgba(255, 255, 255, 0.3);
                              box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
                            "
                            @click.prevent="nextImage(racer)"
                          >
                            <i class="pi pi-chevron-right text-sm font-bold" />
                          </button>

                          <!-- Brick Stud Progress Indicators -->
                          <div class="absolute bottom-3 right-3 flex gap-1.5">
                            <div
                              v-for="(image, index) in getAllRacerImages(racer)"
                              :key="index"
                              class="w-3 h-3 rounded-full transition-all duration-300 border-2 shadow-sm"
                              :class="
                                getCurrentImageIndex(racer) === index
                                  ? 'bg-red-500 border-red-600 shadow-red-500/50'
                                  : 'bg-white bg-opacity-70 border-white border-opacity-80'
                              "
                              :style="
                                getCurrentImageIndex(racer) === index
                                  ? 'box-shadow: 0 0 8px rgba(239, 68, 68, 0.4), inset 0 1px 2px rgba(255,255,255,0.3)'
                                  : 'box-shadow: 0 1px 3px rgba(0,0,0,0.2), inset 0 1px 1px rgba(255,255,255,0.4)'
                              "
                            />
                          </div>
                        </div>

                        <!-- Single image or no image -->
                        <div v-else>
                          <Image
                            v-if="racer.image_url"
                            :src="racer.image_url"
                            :alt="racer.name?.replace(/[\r\n\t]/g, ' ').trim() || ''"
                            image-class="w-full h-48 object-cover"
                            class="w-full h-48"
                            :preview="false"
                          />
                          <div
                            v-else
                            class="w-full h-48 bg-gray-200 flex items-center justify-center"
                          >
                            <i class="pi pi-car text-4xl text-gray-400" />
                          </div>
                        </div>

                        <!-- Name Tag Badge -->
                        <div
                          class="absolute top-3 right-3 bg-white text-gray-800 px-3 py-1 text-sm font-semibold transition-all duration-300 transform group-hover:scale-105 border-2 border-gray-300 shadow-lg"
                          style="
                            border-radius: 12px 12px 12px 0;
                            font-family: 'Inter', sans-serif;
                            letter-spacing: 0.05em;
                            box-shadow:
                              0 4px 8px rgba(0, 0, 0, 0.15),
                              0 0 0 1px rgba(0, 0, 0, 0.05);
                            min-width: 40px;
                            text-align: center;
                          "
                        >
                          #{{ racer.racer_number }}
                        </div>
                      </div>
                    </template>

                    <template #content>
                      <div>
                        <!-- Racer Name -->
                        <div>
                          <h3 class="text-xl font-bold text-black leading-tight">
                            {{ racer.name || 'NO NAME FOUND' }}
                          </h3>
                        </div>

                        <!-- Times and Awards -->
                        <div class="mt-3 space-y-2">
                          <!-- Times -->
                          <div v-if="racer.qualifiers?.length" class="flex gap-2 flex-wrap">
                            <span
                              v-if="getTimeRange(racer)"
                              class="inline-flex items-center px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-50/50 border border-gray-200 rounded-lg shadow-sm"
                              style="font-family: 'Courier New', monospace; letter-spacing: 0.3px"
                            >
                              <i class="pi pi-clock mr-1.5 text-gray-500" />
                              {{ getTimeRange(racer) }}
                            </span>
                          </div>

                          <!-- Awards -->
                          <div v-if="racer.awards?.length" class="flex gap-2 flex-wrap">
                            <span
                              v-for="award in racer.awards"
                              :key="award.id"
                              class="inline-flex items-center px-3 py-1.5 text-xs font-medium text-yellow-700 bg-gradient-to-r from-yellow-50 to-orange-50/30/30 border border-yellow-200 rounded-lg shadow-sm"
                              style="font-weight: 600"
                            >
                              <i class="pi pi-star-fill mr-1.5 text-yellow-500" />
                              {{ award.award_definition?.name || 'Award' }}
                            </span>
                          </div>

                          <!-- Vote Counts -->
                          <div v-if="getVoteCounts(racer).length" class="flex gap-2 flex-wrap">
                            <span
                              v-for="vote in getVoteCounts(racer)"
                              :key="vote.awardId"
                              class="inline-flex items-center px-2.5 py-1 text-xs font-medium text-blue-700 bg-blue-50/30 border border-blue-200 rounded-md shadow-sm"
                            >
                              <i class="pi pi-heart-fill mr-1 text-red-500" />
                              {{ vote.count }} {{ vote.awardName }}
                            </span>
                          </div>
                        </div>
                      </div>
                    </template>
                  </Card>
                </NuxtLink>
              </div>
            </div>
          </template>
        </DataView>
      </div>

      <!-- No Racers State -->
      <div v-else class="text-center py-12">
        <i class="pi pi-car text-6xl text-gray-300 mb-4" />
        <h3 class="text-xl font-semibold text-gray-600 mb-2">No racers yet</h3>
        <p class="text-gray-500 mb-6">
          Create your first custom gravity-powered vehicle to join the competition!
        </p>
        <NuxtLink to="/racers/add">
          <Button size="large" class="btn-primary">
            <i class="pi pi-plus mr-2" />
            <span>Create Your First Racer</span>
          </Button>
        </NuxtLink>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useAuthStore } from '~/stores/auth'

definePageMeta({
  middleware: 'auth'
})

const authStore = useAuthStore()

// Use reactive composables
const { myRacers, loading, getAllRacerImages, getTimeRange, getVoteCounts, initialize } =
  useRacers()

// Slideshow state
const slideshowState = ref(new Map())
const preloadedImages = ref(new Set())

// Slideshow functions
const getCurrentImage = (racer) => {
  const images = getAllRacerImages(racer)
  if (images.length === 0) return null

  const state = slideshowState.value.get(racer.id)
  if (!state) {
    return images[0] // Default to first image
  }

  return images[state.currentIndex] || images[0]
}

const getCurrentImageIndex = (racer) => {
  const state = slideshowState.value.get(racer.id)
  return state?.currentIndex || 0
}

// Preload images for smooth transitions
const preloadImages = (imageUrls) => {
  imageUrls.forEach((url) => {
    if (!preloadedImages.value.has(url)) {
      const img = new Image()
      img.onload = () => {
        preloadedImages.value.add(url)
      }
      img.onerror = () => {
        console.warn('Failed to preload image:', url)
      }
      img.src = url
    }
  })
}

const initializeSlideshowState = (racer) => {
  if (!slideshowState.value.has(racer.id)) {
    slideshowState.value.set(racer.id, { currentIndex: 0 })

    // Preload all images for this racer
    const images = getAllRacerImages(racer)
    if (images.length > 1) {
      preloadImages(images)
    }
  }
}

const nextImage = (racer) => {
  const images = getAllRacerImages(racer)
  if (images.length <= 1) return

  initializeSlideshowState(racer)
  const state = slideshowState.value.get(racer.id)
  state.currentIndex = (state.currentIndex + 1) % images.length

  // Trigger reactivity
  slideshowState.value = new Map(slideshowState.value)
}

const previousImage = (racer) => {
  const images = getAllRacerImages(racer)
  if (images.length <= 1) return

  initializeSlideshowState(racer)
  const state = slideshowState.value.get(racer.id)
  state.currentIndex = state.currentIndex === 0 ? images.length - 1 : state.currentIndex - 1

  // Trigger reactivity
  slideshowState.value = new Map(slideshowState.value)
}

// Initialize auth and fetch data
onMounted(async () => {
  await authStore.initAuth()
  await initialize()
})

useHead({
  title: 'My Racers - The Great Holyoke Brick Race',
  meta: [{ name: 'description', content: 'Manage your custom brick-powered racing vehicles.' }]
})
</script>
