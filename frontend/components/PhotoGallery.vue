<template>
  <div v-if="photos.length > 0" class="space-y-6">
    <div class="flex items-center justify-between">
      <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
        {{ title || 'Photo Gallery' }}
      </h3>
      <Badge :value="`${photos.length} photo${photos.length !== 1 ? 's' : ''}`" />
    </div>

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
            class="absolute top-2 right-2 bg-yellow-500 text-white rounded-full w-8 h-8 flex items-center justify-center shadow-lg"
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
        class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4"
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
            image-class="w-full h-24 object-cover rounded-lg border hover:border-blue-400 transition-colors"
            :class="{
              'border-yellow-400': photo.featured,
              'border-gray-300 dark:border-gray-600': !photo.featured
            }"
            class="w-full h-24"
            :preview="false"
          />

          <!-- Featured Badge for small grid -->
          <div
            v-if="photo.featured"
            class="absolute top-1 right-1 bg-yellow-500 text-white rounded-full w-5 h-5 flex items-center justify-center"
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
      v-model:visible="galleryVisible"
      v-model:active-index="activeImageIndex"
      :value="galleryImages"
      :responsive-options="galleryResponsiveOptions"
      :num-visible="5"
      container-style="max-width: 90vw; max-height: 90vh"
      :circular="true"
      :full-screen="true"
      :show-item-navigators="true"
      :show-thumbnails="true"
      :show-item-navigators-on-hover="true"
      :show-indicators="true"
      :change-item-on-indicator-hover="true"
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
          <Badge v-if="item.featured" value="Featured Photo" severity="warning" />
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
  }
})

const galleryVisible = ref(false)
const activeImageIndex = ref(0)

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

<style scoped>
/* Custom styles for the gallery */
:deep(.p-galleria-thumbnail-item) {
  border-radius: 0.5rem;
  overflow: hidden;
}

:deep(.p-galleria-thumbnail-item.p-galleria-thumbnail-item-current) {
  border: 2px solid #3b82f6;
}

:deep(.p-galleria-item-nav) {
  background: rgba(0, 0, 0, 0.5);
  color: white;
  border-radius: 50%;
}

:deep(.p-galleria-item-nav:hover) {
  background: rgba(0, 0, 0, 0.7);
}
</style>
