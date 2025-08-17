<template>
  <NuxtLink v-if="racerSlug" :to="`/racers/${racerSlug}`" :class="linkClass">
    <slot>{{ racerName || 'View Racer' }}</slot>
  </NuxtLink>
  <span v-else :class="linkClass">
    <slot>{{ racerName || 'Unknown Racer' }}</slot>
  </span>
</template>

<script setup>
// Props
const props = defineProps({
  racerId: {
    type: String,
    default: null
  },
  racerSlug: {
    type: String,
    default: null
  },
  racerName: {
    type: String,
    default: null
  },
  class: {
    type: String,
    default: ''
  }
})

// Use racers composable to get slug from ID if needed
const { racers, initialize: initializeRacers } = useRacers()

// Initialize racers data if not already loaded
onMounted(async () => {
  if (props.racerId && (!racers.value || racers.value.length === 0)) {
    await initializeRacers()
  }
})

// Computed property for the actual slug to use
const racerSlug = computed(() => {
  // If slug is provided directly, use it
  if (props.racerSlug) {
    return props.racerSlug
  }
  
  // If only ID is provided, look up the slug
  if (props.racerId && racers.value) {
    const racer = racers.value.find(r => r.id === props.racerId)
    return racer?.slug || null
  }
  
  return null
})

// Pass through the class prop
const linkClass = computed(() => props.class)
</script>