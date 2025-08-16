<template>
  <div v-if="photos.length > 0" class="space-y-6">
    <!-- Featured Photos (if any) -->
    <div v-if="featuredPhotos.length > 0" class="space-y-4">
      <h4 class="font-medium text-gray-900 dark:text-white flex items-center gap-2">
        <i class="pi pi-star text-yellow-500" />
        Featured Photos
      </h4>

      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div
          v-for="(photo, index) in featuredPhotos"
          :key="`featured-${index}`"
          class="relative group cursor-pointer"
          @click="openGallery(photos.indexOf(photo))"
        >
          <Image
            :src="photo.url || photo"
            :alt="`Featured photo ${index + 1}`"
            image-class="w-full h-48 object-cover rounded-lg border-2 border-yellow-400 hover:border-yellow-500 transition-colors"
            class="w-full h-48"
            :preview="false"
          />

          <!-- Featured Badge -->
          <div
            class="absolute top-2 right-2 bg-gradient-to-br from-red-500 to-orange-600 text-white rounded-full w-8 h-8 flex items-center justify-center border-2 border-red-400"
          >
            <i class="pi pi-star text-sm" />
          </div>

          <!-- Hover Overlay -->
          <div
            class="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-20 rounded-lg transition-all duration-200 flex items-center justify-center"
          >
            <i
              class="pi pi-search-plus text-white text-xl opacity-0 group-hover:opacity-100 transition-opacity"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- All Photos Grid -->
    <div class="space-y-4">
      <h4 v-if="featuredPhotos.length > 0" class="font-medium text-gray-900 dark:text-white">
        All Photos
      </h4>

      <div
        :class="
          enableFeaturedSection
            ? 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4'
            : 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4'
        "
      >
        <div
          v-for="(photo, index) in photos"
          :key="index"
          class="relative group cursor-pointer"
          @click="openGallery(index)"
        >
          <Image
            :src="photo.url || photo"
            :alt="`Photo ${index + 1}`"
            :image-class="
              enableFeaturedSection
                ? 'w-full h-24 object-cover rounded-lg border hover:border-blue-400 transition-colors'
                : 'w-full h-48 object-cover rounded-lg border hover:border-blue-400 transition-colors'
            "
            :class="{
              'border-yellow-400': photo.featured,
              'border-gray-300 dark:border-gray-600': !photo.featured
            }"
            :class-name="enableFeaturedSection ? 'w-full h-24' : 'w-full h-48'"
            :preview="false"
          />

          <!-- Featured Badge for small grid -->
          <div
            v-if="photo.featured"
            class="absolute top-1 right-1 bg-gradient-to-br from-red-500 to-orange-600 text-white rounded-full w-5 h-5 flex items-center justify-center border-2 border-red-400"
          >
            <i class="pi pi-star text-xs" />
          </div>

          <!-- Hover Overlay -->
          <div
            class="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-30 rounded-lg transition-all duration-200 flex items-center justify-center"
          >
            <i
              class="pi pi-search-plus text-white opacity-0 group-hover:opacity-100 transition-opacity"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- Lightbox Gallery -->
    <Galleria
      v-if="galleryImages.length > 0"
      ref="galleryRef"
      v-model:visible="galleryVisible"
      v-model:active-index="activeImageIndex"
      :value="galleryImages"
      :responsive-options="galleryResponsiveOptions"
      :num-visible="5"
      container-style="max-width: 90vw; max-height: 90vh"
      :circular="true"
      :full-screen="true"
      :show-item-navigators="true"
      :show-thumbnails="showThumbnails"
      :show-item-navigators-on-hover="true"
      :show-indicators="false"
      :change-item-on-indicator-hover="false"
    >
      <template #item="{ item }">
        <div class="flex justify-center items-center h-full">
          <img
            :src="item.itemImageSrc"
            :alt="item.alt"
            class="max-w-full max-h-full object-contain"
            style="max-height: 80vh"
          >
        </div>
      </template>

      <template #thumbnail="{ item }">
        <div class="grid grid-nogutter justify-center">
          <img
            :src="item.thumbnailImageSrc"
            :alt="item.alt"
            class="w-16 h-16 object-cover rounded"
          >
        </div>
      </template>

      <template #caption="{ item }">
        <div v-if="item.title || item.featured" class="text-center p-4">
          <h5 v-if="item.title" class="text-white text-lg font-semibold mb-2">{{ item.title }}</h5>
          <Badge
            v-if="item.featured"
            value="Featured Photo"
            class="bg-gradient-to-br from-red-500 to-orange-600 text-white border-2 border-red-400"
            style="box-shadow: none !important"
          />
        </div>
      </template>
    </Galleria>

    <!-- Photo Contribution Links -->
    <div v-if="showContributionLinks" class="mt-8">
      <div
        class="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6 text-center"
      >
        <h4
          class="font-semibold text-gray-900 dark:text-white mb-3 flex items-center justify-center gap-2"
        >
          <i class="pi pi-camera text-blue-600 dark:text-blue-400" />
          Share Your Photos
        </h4>
        <p class="text-gray-600 dark:text-gray-400 mb-4">
          Have photos from this racer or event? Help us build the community gallery!
        </p>
        <div class="flex flex-col sm:flex-row gap-3 justify-center">
          <NuxtLink to="/my-photos">
            <Button severity="secondary" outlined>
              <i class="pi pi-upload mr-2" />
              Upload Photos
            </Button>
          </NuxtLink>
          <NuxtLink to="/racers">
            <Button text>
              <i class="pi pi-eye mr-2" />
              View All Racers
            </Button>
          </NuxtLink>
        </div>
      </div>
    </div>
  </div>

  <div v-else-if="showEmptyState" class="text-center py-12">
    <i class="pi pi-images text-6xl text-gray-300 dark:text-gray-600 mb-4" />
    <h3 class="text-xl font-semibold text-gray-600 dark:text-gray-400 mb-2">No Photos Yet</h3>
    <p class="text-gray-500 dark:text-gray-500">
      {{ emptyMessage || 'Photos will appear here once they are uploaded and approved.' }}
    </p>
  </div>
</template>

<script setup>
const props = defineProps({
  photos: {
    type: Array,
    default: () => []
  },
  title: {
    type: String,
    default: ''
  },
  showEmptyState: {
    type: Boolean,
    default: true
  },
  emptyMessage: {
    type: String,
    default: ''
  },
  enableFeaturedSection: {
    type: Boolean,
    default: true
  },
  showContributionLinks: {
    type: Boolean,
    default: true
  },
  showThumbnails: {
    type: Boolean,
    default: true
  }
})

const galleryVisible = ref(false)
const activeImageIndex = ref(0)
const galleryRef = ref(null)

// Responsive options for the gallery
const galleryResponsiveOptions = ref([
  {
    breakpoint: '1024px',
    numVisible: 5
  },
  {
    breakpoint: '768px',
    numVisible: 3
  },
  {
    breakpoint: '560px',
    numVisible: 1
  }
])

// Computed properties
const featuredPhotos = computed(() => {
  if (!props.enableFeaturedSection) return []
  return props.photos.filter((photo) => photo.featured)
})

const galleryImages = computed(() => {
  return props.photos.map((photo, index) => ({
    itemImageSrc: photo.url || photo,
    thumbnailImageSrc: photo.url || photo,
    alt: `Photo ${index + 1}`,
    title: photo.title || '',
    featured: photo.featured || false
  }))
})

// Methods
const openGallery = (index) => {
  activeImageIndex.value = index
  galleryVisible.value = true
}
</script>

<style>
/* Glass navigation buttons */
.p-galleria-nav-button {
  background: rgba(255, 255, 255, 0.2) !important;
  backdrop-filter: blur(10px) !important;
  -webkit-backdrop-filter: blur(10px) !important;
  border: 2px solid rgba(255, 255, 255, 0.3) !important;
  border-radius: 50% !important;
  box-shadow:
    0 8px 32px rgba(0, 0, 0, 0.3),
    inset 0 1px 2px rgba(255, 255, 255, 0.4) !important;
  transition: all 0.3s ease !important;
  width: 56px !important;
  height: 56px !important;
}

.p-galleria-nav-button:hover {
  background: rgba(255, 255, 255, 0.3) !important;
  backdrop-filter: blur(15px) !important;
  -webkit-backdrop-filter: blur(15px) !important;
  border: 2px solid rgba(255, 255, 255, 0.5) !important;
  box-shadow:
    0 12px 40px rgba(0, 0, 0, 0.4),
    inset 0 2px 4px rgba(255, 255, 255, 0.5) !important;
  transform: scale(1.1) !important;
}

.p-galleria-nav-button:active {
  transform: scale(0.9) !important;
  box-shadow:
    0 4px 16px rgba(0, 0, 0, 0.4),
    inset 0 1px 2px rgba(255, 255, 255, 0.3) !important;
}

/* Glass caption area - ultra subtle, only show if content exists */
.p-galleria-caption {
  background: rgba(255, 255, 255, 0.03) !important;
  backdrop-filter: blur(6px) !important;
  -webkit-backdrop-filter: blur(6px) !important;
  border: 1px solid rgba(255, 255, 255, 0.08) !important;
  margin: 0 !important;
  padding: 12px 16px !important;
  box-shadow:
    0 2px 8px rgba(0, 0, 0, 0.08),
    inset 0 1px 2px rgba(255, 255, 255, 0.15) !important;
}

/* Dark text shadow for better contrast on white text - but not on badges */
.p-galleria-caption h5,
.p-galleria-caption p {
  text-shadow:
    0 1px 2px rgba(0, 0, 0, 0.9),
    0 0 4px rgba(0, 0, 0, 0.7) !important;
}

/* Hide caption completely if it's empty */
.p-galleria-caption:empty {
  display: none !important;
}

/* Make the lightbox mask more opaque for better contrast */
.p-galleria-mask {
  background-color: rgba(0, 0, 0, 0.8) !important;
}

/* Glass styling for close button */
:deep(.p-galleria-close) {
  background: rgba(255, 255, 255, 0.2) !important;
  backdrop-filter: blur(10px) !important;
  -webkit-backdrop-filter: blur(10px) !important;
  border: 2px solid rgba(255, 255, 255, 0.3) !important;
  border-radius: 50% !important;
  box-shadow:
    0 8px 32px rgba(0, 0, 0, 0.3),
    inset 0 1px 2px rgba(255, 255, 255, 0.4) !important;
  transition: all 0.3s ease !important;
  width: 56px !important;
  height: 56px !important;
}

:deep(.p-galleria-close:hover) {
  background: rgba(255, 255, 255, 0.3) !important;
  backdrop-filter: blur(15px) !important;
  -webkit-backdrop-filter: blur(15px) !important;
  border: 2px solid rgba(255, 255, 255, 0.5) !important;
  box-shadow:
    0 12px 40px rgba(0, 0, 0, 0.4),
    inset 0 2px 4px rgba(255, 255, 255, 0.5) !important;
  transform: scale(1.1) !important;
}

/* Custom styles for the gallery */
:deep(.p-galleria-thumbnail-item) {
  border-radius: 0.5rem;
  overflow: hidden;
}

:deep(.p-galleria-thumbnail-item.p-galleria-thumbnail-item-current) {
  border: 2px solid #3b82f6;
}

/* Main galleria container - semi-transparent dark background for lightbox feel */
.p-galleria {
  background: rgba(0, 0, 0, 0.6) !important;
}

/* Thumbnail area - dark background */
.p-galleria-thumbnails {
  background: rgba(0, 0, 0, 0.8) !important;
  backdrop-filter: blur(10px) !important;
  -webkit-backdrop-filter: blur(10px) !important;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4) !important;
  padding: 0 !important;
  margin: 0 !important;
}

.p-galleria-thumbnails-content {
  background: rgba(0, 0, 0, 0.8) !important;
  padding: 0 !important;
}

.p-galleria-thumbnails-viewport {
  background: rgba(0, 0, 0, 0.8) !important;
}

.p-galleria-thumbnail-items {
  background: rgba(0, 0, 0, 0.8) !important;
}

/* Glass styling for thumbnail navigation buttons */
:deep(.p-galleria-thumbnail-prev-button),
:deep(.p-galleria-thumbnail-next-button) {
  background: rgba(255, 255, 255, 0.2) !important;
  backdrop-filter: blur(10px) !important;
  -webkit-backdrop-filter: blur(10px) !important;
  border: 2px solid rgba(255, 255, 255, 0.3) !important;
  border-radius: 50% !important;
  box-shadow:
    0 4px 16px rgba(0, 0, 0, 0.3),
    inset 0 1px 2px rgba(255, 255, 255, 0.4) !important;
  transition: all 0.3s ease !important;
  width: 40px !important;
  height: 40px !important;
}

:deep(.p-galleria-thumbnail-prev-button:hover),
:deep(.p-galleria-thumbnail-next-button:hover) {
  background: rgba(255, 255, 255, 0.3) !important;
  backdrop-filter: blur(15px) !important;
  -webkit-backdrop-filter: blur(15px) !important;
  border: 2px solid rgba(255, 255, 255, 0.5) !important;
  box-shadow:
    0 8px 24px rgba(0, 0, 0, 0.4),
    inset 0 2px 4px rgba(255, 255, 255, 0.5) !important;
  transform: scale(1.05) !important;
}

/* Glass navigation buttons - using maximum specificity */
:deep(.p-galleria-mask .p-galleria-nav-button),
:deep(.p-galleria-mask .p-galleria-next-button),
:deep(.p-galleria-mask .p-galleria-prev-button),
:deep(.p-galleria .p-galleria-nav-button),
:deep(.p-galleria .p-galleria-next-button),
:deep(.p-galleria .p-galleria-prev-button) {
  background: rgba(255, 0, 0, 0.8) !important;
  backdrop-filter: blur(15px) !important;
  -webkit-backdrop-filter: blur(15px) !important;
  border: 5px solid rgba(255, 255, 0, 0.9) !important;
  color: white !important;
  border-radius: 50% !important;
  box-shadow:
    0 12px 48px rgba(0, 0, 0, 0.4),
    inset 0 2px 6px rgba(255, 255, 255, 0.7) !important;
  transition: all 0.3s ease !important;
  width: 80px !important;
  height: 80px !important;
}

:deep(.p-galleria-mask .p-galleria-nav-button:hover),
:deep(.p-galleria-mask .p-galleria-next-button:hover),
:deep(.p-galleria-mask .p-galleria-prev-button:hover),
:deep(.p-galleria .p-galleria-nav-button:hover),
:deep(.p-galleria .p-galleria-next-button:hover),
:deep(.p-galleria .p-galleria-prev-button:hover) {
  background: rgba(0, 255, 0, 0.8) !important;
  backdrop-filter: blur(20px) !important;
  -webkit-backdrop-filter: blur(20px) !important;
  border: 6px solid rgba(0, 255, 255, 0.9) !important;
  box-shadow:
    0 16px 60px rgba(0, 0, 0, 0.5),
    inset 0 3px 8px rgba(255, 255, 255, 0.8) !important;
  transform: scale(1.2) !important;
}

:deep(.p-galleria-mask .p-galleria-nav-button:active),
:deep(.p-galleria-mask .p-galleria-next-button:active),
:deep(.p-galleria-mask .p-galleria-prev-button:active),
:deep(.p-galleria .p-galleria-nav-button:active),
:deep(.p-galleria .p-galleria-next-button:active),
:deep(.p-galleria .p-galleria-prev-button:active) {
  background: rgba(255, 0, 255, 0.8) !important;
  transform: scale(0.8) !important;
  box-shadow:
    0 4px 16px rgba(0, 0, 0, 0.4),
    inset 0 1px 2px rgba(255, 255, 255, 0.3) !important;
}

:deep(.p-galleria-caption) {
  background: rgba(255, 255, 255, 0.3) !important;
  backdrop-filter: blur(20px) !important;
  -webkit-backdrop-filter: blur(20px) !important;
  border: 3px solid rgba(255, 255, 255, 0.6) !important;
  border-radius: 20px !important;
  margin: 20px !important;
  padding: 24px 32px !important;
  box-shadow:
    0 16px 64px rgba(0, 0, 0, 0.4),
    inset 0 2px 8px rgba(255, 255, 255, 0.6) !important;
}

/* Additional specific selectors for navigation buttons */
:deep(.p-galleria-item-nav-prev),
:deep(.p-galleria-item-nav-next) {
  background: rgba(255, 255, 255, 0.4) !important;
  backdrop-filter: blur(15px) !important;
  -webkit-backdrop-filter: blur(15px) !important;
  border: 3px solid rgba(255, 255, 255, 0.7) !important;
  color: white !important;
  border-radius: 50% !important;
  box-shadow:
    0 12px 48px rgba(0, 0, 0, 0.4),
    inset 0 2px 6px rgba(255, 255, 255, 0.7) !important;
  transition: all 0.3s ease !important;
  width: 64px !important;
  height: 64px !important;
}

:deep(.p-galleria-item-nav-prev:hover),
:deep(.p-galleria-item-nav-next:hover) {
  background: rgba(255, 255, 255, 0.6) !important;
  backdrop-filter: blur(20px) !important;
  -webkit-backdrop-filter: blur(20px) !important;
  border: 4px solid rgba(255, 255, 255, 0.9) !important;
  box-shadow:
    0 16px 60px rgba(0, 0, 0, 0.5),
    inset 0 3px 8px rgba(255, 255, 255, 0.8) !important;
  transform: scale(1.15) !important;
}
</style>
