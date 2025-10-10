<template>
  <div class="relative">
    <swiper
      :modules="modules"
      :slides-per-view="1"
      :space-between="30"
      :loop="true"
      :autoplay="{
        delay: 4000,
        disableOnInteraction: false
      }"
      :pagination="{
        clickable: true,
        dynamicBullets: true
      }"
      :navigation="true"
      :grab-cursor="true"
      :centered-slides="true"
      :breakpoints="{
        768: {
          slidesPerView: 2,
          spaceBetween: 40
        },
        1024: {
          slidesPerView: 3,
          spaceBetween: 50
        }
      }"
      class="beautiful-swiper"
      @swiper="onSwiper"
      @slide-change="onSlideChange"
    >
      <swiper-slide v-for="(image, index) in images" :key="index" class="relative group">
        <div
          class="relative overflow-hidden rounded-2xl shadow-2xl bg-gradient-to-br from-gray-900 to-gray-700 cursor-pointer"
          @click="handleSlideClick(index)"
        >
          <img
            :src="image.url"
            :alt="`Featured Photo ${index + 1}`"
            class="w-full h-80 md:h-96 object-cover transition-transform duration-700 group-hover:scale-110"
            loading="lazy"
          />
          <!-- Gradient overlay -->
          <div
            class="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          />

          <!-- Click indicator -->
          <div
            class="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300"
          >
            <div
              class="bg-white/20 backdrop-blur-sm rounded-full p-4 transform scale-0 group-hover:scale-100 transition-transform duration-300"
            >
              <i class="pi pi-search-plus text-white text-2xl" />
            </div>
          </div>
        </div>
      </swiper-slide>
    </swiper>

    <!-- Custom navigation buttons -->
    <div
      class="swiper-button-prev-custom absolute left-4 top-1/2 -translate-y-1/2 z-10 bg-white/10 backdrop-blur-sm rounded-full p-3 text-white hover:bg-white/20 transition-all duration-300 cursor-pointer"
    >
      <i class="pi pi-chevron-left text-xl" />
    </div>
    <div
      class="swiper-button-next-custom absolute right-4 top-1/2 -translate-y-1/2 z-10 bg-white/10 backdrop-blur-sm rounded-full p-3 text-white hover:bg-white/20 transition-all duration-300 cursor-pointer"
    >
      <i class="pi pi-chevron-right text-xl" />
    </div>
  </div>
</template>

<script setup>
import { Swiper, SwiperSlide } from 'swiper/vue'
import { Navigation, Pagination, Autoplay, EffectCoverflow } from 'swiper/modules'

// Import Swiper styles
import 'swiper/css'
import 'swiper/css/navigation'
import 'swiper/css/pagination'
import 'swiper/css/effect-coverflow'

defineProps({
  images: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['slideClick'])

const modules = [Navigation, Pagination, Autoplay, EffectCoverflow]

const onSwiper = (swiper) => {
  // Custom navigation
  const prevButton = document.querySelector('.swiper-button-prev-custom')
  const nextButton = document.querySelector('.swiper-button-next-custom')

  if (prevButton) {
    prevButton.addEventListener('click', () => swiper.slidePrev())
  }
  if (nextButton) {
    nextButton.addEventListener('click', () => swiper.slideNext())
  }
}

const onSlideChange = () => {
  // Could emit events here if needed
}

const handleSlideClick = (index) => {
  emit('slideClick', index)
}
</script>

<style scoped>
.beautiful-swiper {
  padding: 2rem 0 3rem 0;
}

:deep(.swiper-pagination) {
  bottom: 0 !important;
}

:deep(.swiper-pagination-bullet) {
  background: rgba(255, 255, 255, 0.5) !important;
  width: 12px !important;
  height: 12px !important;
  transition: all 0.3s ease !important;
}

:deep(.swiper-pagination-bullet-active) {
  background: white !important;
  transform: scale(1.3) !important;
}

:deep(.swiper-slide) {
  transition: all 0.3s ease !important;
}

:deep(.swiper-slide-active) {
  transform: scale(1.05) !important;
}

/* Hide default navigation */
:deep(.swiper-button-next),
:deep(.swiper-button-prev) {
  display: none !important;
}

/* Custom slide shadows for coverflow effect */
:deep(.swiper-slide-shadow-left),
:deep(.swiper-slide-shadow-right) {
  background: linear-gradient(to right, rgba(0, 0, 0, 0.5), transparent) !important;
}
</style>
