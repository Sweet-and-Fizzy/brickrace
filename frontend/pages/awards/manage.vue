<template>
  <div class="min-h-screen bg-white dark:bg-gray-900">
    <div class="container mx-auto px-4 py-8">
      <div class="flex justify-between items-center mb-8">
        <h1 class="text-3xl font-bold text-gray-900 dark:text-white">Manage Awards</h1>
        <div class="flex gap-2">
          <NuxtLink to="/awards">
            <Button class="btn-secondary">
              <i class="pi pi-arrow-left mr-2" />
              <span>Back to Awards</span>
            </Button>
          </NuxtLink>
          <Button class="btn-primary" @click="showAddDefinitionDialog = true">
            <i class="pi pi-plus mr-2" />
            Add Award Type
          </Button>
          <AdminMenu v-if="authStore.isRaceAdmin" :race-id="activeRace?.id" />
        </div>
      </div>

      <!-- Award Assignment Section -->
      <div v-if="activeRace">
        <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-6">Assign Awards</h2>

        <!-- Current Assignments -->
        <div v-if="currentAssignments.length" class="mb-8">
          <h3 class="text-lg font-semibold mb-4">Current Awards</h3>
          <div class="space-y-4">
            <div
              v-for="assignment in currentAssignments"
              :key="assignment.id"
              class="flex items-center justify-between p-4 bg-white dark:bg-gray-800 border-2 border-brand-green rounded-lg"
            >
              <div class="flex items-center space-x-4">
                <i class="pi pi-trophy text-brand-green text-xl" />
                <div>
                  <div class="font-medium">{{ assignment.award_definition.name }}</div>
                  <div class="text-sm text-gray-600 dark:text-gray-300">
                    {{ assignment.racer.name }}
                  </div>
                  <div v-if="assignment.notes" class="text-sm text-gray-500 dark:text-gray-400">
                    {{ assignment.notes }}
                  </div>
                </div>
              </div>
              <Button size="small" class="btn-secondary" @click="removeAssignment(assignment.id)">
                <i class="pi pi-times mr-2" />
                <span>Remove</span>
              </Button>
            </div>
          </div>
        </div>

        <!-- New Assignment Form -->
        <Card class="mb-6">
          <template #title>
            <div class="flex items-center gap-3">
              <i class="pi pi-plus text-brand-blue" />
              <span>Assign New Award</span>
            </div>
          </template>
          <template #content>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                  >Award Type</label
                >
                <Select
                  v-model="newAssignment.awardDefinitionId"
                  :options="awardDefinitionOptions"
                  option-label="label"
                  option-value="value"
                  placeholder="Select award type"
                  class="w-full"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                  >Racer</label
                >
                <Select
                  v-model="newAssignment.racerId"
                  :options="racerOptions"
                  option-label="label"
                  option-value="value"
                  placeholder="Type to search racers..."
                  class="w-full"
                  filter
                  filter-placeholder="Search racers..."
                  :show-clear="true"
                >
                  <template #option="slotProps">
                    <div class="flex items-center gap-2">
                      <span class="font-medium">{{ slotProps.option.label }}</span>
                    </div>
                  </template>
                </Select>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                  >Notes (optional)</label
                >
                <InputText v-model="newAssignment.notes" placeholder="Award notes" class="w-full" />
              </div>
            </div>
            <div class="mt-6 pt-4 border-t border-gray-200 dark:border-gray-600">
              <Button
                :disabled="!newAssignment.awardDefinitionId || !newAssignment.racerId || assigning"
                :loading="assigning"
                class="btn-primary"
                @click="assignAwardToRacer"
              >
                <i v-if="!assigning" class="pi pi-plus mr-2" />
                <span>{{ assigning ? 'Assigning...' : 'Assign Award' }}</span>
              </Button>
            </div>
          </template>
        </Card>

        <!-- Vote Results for Reference -->
        <div v-if="voteResults.length">
          <h3 class="text-lg font-semibold mb-4">Vote Results (for reference)</h3>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card v-for="result in voteResults" :key="result.award_name">
              <template #title>{{ result.award_name }}</template>
              <template #content>
                <div class="space-y-2">
                  <div
                    v-for="vote in result.votes"
                    :key="vote.racer_id"
                    class="flex justify-between items-center"
                  >
                    <span>{{ vote.racer_name }}</span>
                    <Badge :value="`${vote.vote_count} votes`" />
                  </div>
                </div>
              </template>
            </Card>
          </div>
        </div>
      </div>

      <!-- Award Definitions Management -->
      <div class="mb-12 mt-16">
        <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-6">Award Types</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card
            v-for="definition in awardDefinitions"
            :key="definition.id"
            class="hover:shadow-lg transition-shadow"
          >
            <template #header>
              <div class="relative">
                <img
                  v-if="definition.image_url"
                  :src="definition.image_url"
                  :alt="definition.name"
                  class="w-full aspect-square object-cover"
                >
                <div
                  v-else
                  class="w-full aspect-square bg-gray-200 dark:bg-gray-700 flex items-center justify-center"
                >
                  <i class="pi pi-trophy text-4xl text-gray-400 dark:text-gray-500" />
                </div>
                <div class="absolute top-2 right-2 flex gap-1">
                  <Badge
                    v-if="definition.voteable"
                    value="Voteable"
                    class="bg-brand-blue text-white"
                  />
                  <Badge
                    v-if="!definition.active"
                    value="Inactive"
                    class="bg-gray-500 text-white"
                  />
                </div>
              </div>
            </template>

            <template #title>{{ definition.name }}</template>
            <template #subtitle>{{ definition.description }}</template>

            <template #footer>
              <div class="flex justify-between">
                <Button
                  size="small"
                  class="btn-secondary"
                  @click="editDefinition(definition)"
                >
                  <i class="pi pi-pencil mr-2" />
                  <span>Edit</span>
                </Button>
                <div class="flex gap-2">
                  <Button
                    size="small"
                    :class="definition.active ? 'btn-secondary' : 'btn-primary'"
                    @click="toggleDefinitionActiveStatus(definition)"
                  >
                    <i :class="definition.active ? 'pi pi-times mr-2' : 'pi pi-check mr-2'" />
                    <span>{{ definition.active ? 'Deactivate' : 'Activate' }}</span>
                  </Button>
                  <Button
                    v-tooltip.top="'Delete award type'"
                    size="small"
                    class="btn-secondary"
                    @click="confirmDeleteDefinition(definition)"
                  >
                    <i class="pi pi-trash" />
                  </Button>
                </div>
              </div>
            </template>
          </Card>
        </div>
        
        <!-- Link to Vote for Awards -->
        <div v-if="activeRace" class="text-center mt-8 pt-6 border-t border-gray-200 dark:border-gray-600">
          <p class="text-gray-600 dark:text-gray-400 mb-4">
            Want to see what the community is voting for?
          </p>
          <NuxtLink :to="`/races/${activeRace.slug || activeRace.id}#voting`">
            <Button class="btn-secondary">
              <i class="pi pi-heart mr-2" />
              View Award Voting
            </Button>
          </NuxtLink>
        </div>
      </div>

      <!-- Add/Edit Award Definition Dialog -->
      <Dialog
        v-model:visible="showAddDefinitionDialog"
        modal
        :header="editingDefinition ? 'Edit Award Definition' : 'Create Award Definition'"
        :style="{ width: '50rem' }"
        class="awards-dialog"
      >
        <div class="space-y-6">
          <div>
            <label
              for="award-name"
              class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              Award Name *
            </label>
            <InputText
              id="award-name"
              v-model="definitionForm.name"
              placeholder="e.g., Best Design, Fastest Time"
              class="w-full"
            />
          </div>
          <div>
            <label
              for="award-description"
              class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              Description
            </label>
            <Textarea
              id="award-description"
              v-model="definitionForm.description"
              rows="3"
              placeholder="Describe what this award recognizes..."
              class="w-full"
            />
          </div>
          <div>
            <label
              for="award-image"
              class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              Award Image
            </label>
            <div class="space-y-3">
              <!-- Image Preview -->
              <div v-if="definitionForm.image_url" class="flex items-center gap-3">
                <img
                  :src="definitionForm.image_url"
                  alt="Award preview"
                  class="w-16 h-16 object-cover rounded border border-gray-300 dark:border-gray-600"
                >
                <Button
                  label="Remove Image"
                  icon="pi pi-times"
                  size="small"
                  class="btn-secondary"
                  @click="removeAwardImage"
                />
              </div>

              <!-- Upload Section -->
              <div v-if="!definitionForm.image_url" class="space-y-3">
                <FileUpload
                  mode="basic"
                  name="awardImage"
                  accept="image/*"
                  :max-file-size="5000000"
                  choose-label="Upload Image"
                  choose-icon="pi pi-upload"
                  class="w-full"
                  :auto="false"
                  @select="onAwardImageSelect"
                />
                <p class="text-sm text-gray-500">
                  Upload an image (max 5MB) or provide a URL below
                </p>

                <!-- URL Input as Alternative -->
                <div class="border-t border-gray-200 dark:border-gray-600 pt-3">
                  <label class="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                    Or provide image URL:
                  </label>
                  <InputText
                    v-model="definitionForm.image_url"
                    placeholder="https://example.com/award-image.jpg"
                    class="w-full"
                  />
                </div>
              </div>
            </div>
          </div>
          <div class="flex items-start">
            <div class="flex items-center h-5">
              <Checkbox v-model="definitionForm.voteable" input-id="voteable" binary />
            </div>
            <div class="ml-3 text-sm">
              <label for="voteable" class="font-medium text-gray-700 dark:text-gray-300"
                >Allow voting for this award</label
              >
              <p class="text-gray-500">
                If checked, users can vote for who should receive this award
              </p>
            </div>
          </div>
        </div>
        <template #footer>
          <div class="flex justify-end space-x-3">
            <Button label="Cancel" class="btn-secondary" @click="showAddDefinitionDialog = false" />
            <Button
              :disabled="!definitionForm.name"
              :loading="savingDefinition"
              :label="editingDefinition ? 'Update Award' : 'Create Award'"
              :icon="editingDefinition ? 'pi pi-pencil' : 'pi pi-plus'"
              class="btn-primary"
              @click="saveDefinition"
            />
          </div>
        </template>
      </Dialog>

      <!-- Delete Confirmation Dialog -->
      <ConfirmDialog />
    </div>
  </div>
</template>

<script setup>
import { useAuthStore } from '~/stores/auth'
import { useToast } from 'primevue/usetoast'
import { useConfirm } from 'primevue/useconfirm'

const authStore = useAuthStore()
const supabase = useSupabaseClient()
const toast = useToast()
const confirm = useConfirm()

// Navigation guard
definePageMeta({
  middleware: 'auth'
})

// Use composables
const { activeRace, initialize: initializeRaces } = useRaces()

const {
  awardDefinitions,
  initialize: initializeAwards,
  createAwardDefinition,
  updateAwardDefinition,
  toggleAwardDefinitionActive,
  deleteAwardDefinition,
  assignAward,
  removeAward,
  getAwardsByRace,
  getVoteResultsByRace
} = useAwards()

const { initialize: initializeCheckins, getCheckinsForRace, fetchCheckins } = useCheckins()

const racers = ref([])

const showAddDefinitionDialog = ref(false)
const editingDefinition = ref(null)
const savingDefinition = ref(false)
const assigning = ref(false)

const definitionForm = ref({
  name: '',
  description: '',
  image_url: '',
  voteable: false
})

const newAssignment = ref({
  awardDefinitionId: null,
  racerId: null,
  notes: ''
})

// Computed properties
const activeAwardDefinitions = computed(() => awardDefinitions.value.filter((def) => def.active))

const awardDefinitionOptions = computed(() =>
  activeAwardDefinitions.value.map((def) => ({ label: def.name, value: def.id }))
)

const racerOptions = computed(() =>
  racers.value.map((racer) => ({
    label: `${racer.name}${racer.racer_number ? ` (#${racer.racer_number})` : ''}`,
    value: racer.id
  }))
)

const currentAssignments = computed(() => {
  if (!activeRace.value) return []
  return getAwardsByRace(activeRace.value.id)
})

const voteResults = computed(() => {
  if (!activeRace.value) return []
  const results = getVoteResultsByRace(activeRace.value.id)

  return results
})

// Fetch racers for active race using checkins and vote data
const fetchRacers = async () => {
  if (!activeRace.value) return

  try {
    // Get current checkins for the active race
    const raceCheckins = getCheckinsForRace(activeRace.value.id)

    const uniqueRacers = []
    const seen = new Set()

    // First, add all currently checked-in racers
    raceCheckins.forEach((checkin) => {
      // Only include checkins that have complete racer data
      if (checkin.racer && checkin.racer.id && checkin.racer.name && !seen.has(checkin.racer.id)) {
        seen.add(checkin.racer.id)
        uniqueRacers.push({
          id: checkin.racer.id,
          name: checkin.racer.name,
          racer_number: checkin.racer.racer_number,
          source: 'checkin'
        })
      }
    })

    // Then, add any racers who appear in vote results for this race (but aren't already included)
    const voteResults = getVoteResultsByRace(activeRace.value.id)
    voteResults.forEach((result) => {
      result.votes.forEach((vote) => {
        if (vote.racer_id && vote.racer_name && !seen.has(vote.racer_id)) {
          seen.add(vote.racer_id)
          uniqueRacers.push({
            id: vote.racer_id,
            name: vote.racer_name,
            racer_number: null, // We don't have this from vote data
            source: 'votes'
          })
        }
      })
    })

    racers.value = uniqueRacers
  } catch (error) {
    // Keep essential error logging for production debugging
    console.error('Error fetching racers:', error)
    racers.value = []
  }
}

// Save award definition using composable
const saveDefinition = async () => {
  if (!definitionForm.value.name) return

  savingDefinition.value = true
  
  // Capture values before they get reset
  const awardName = definitionForm.value.name
  const isEditing = !!editingDefinition.value

  try {
    if (editingDefinition.value) {
      await updateAwardDefinition(editingDefinition.value.id, definitionForm.value)
    } else {
      await createAwardDefinition(definitionForm.value)
    }

    showAddDefinitionDialog.value = false
    resetDefinitionForm()

    toast.add({
      severity: 'success',
      summary: isEditing ? 'Award Updated' : 'Award Created',
      detail: `Award type "${awardName}" has been ${isEditing ? 'updated' : 'created'} successfully.`,
      life: 3000
    })
  } catch (error) {
    // Keep essential error logging for production debugging
    console.error('Error saving award definition:', error)
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: error.message || 'Failed to save award definition. Please try again.',
      life: 5000
    })
  } finally {
    savingDefinition.value = false
  }
}

// Edit definition
const editDefinition = (definition) => {
  editingDefinition.value = definition
  definitionForm.value = { ...definition }
  showAddDefinitionDialog.value = true
}

// Toggle definition active status using composable
const toggleDefinitionActiveStatus = async (definition) => {
  try {
    await toggleAwardDefinitionActive(definition.id)

    toast.add({
      severity: 'info',
      summary: 'Award Status Updated',
      detail: `Award type "${definition.name}" has been ${!definition.active ? 'activated' : 'deactivated'}.`,
      life: 3000
    })
  } catch (error) {
    // Keep essential error logging for production debugging
    console.error('Error toggling definition status:', error)
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: error.message || 'Failed to update award status. Please try again.',
      life: 5000
    })
  }
}

// Assign award using composable
const assignAwardToRacer = async () => {
  if (!newAssignment.value.awardDefinitionId || !newAssignment.value.racerId) return

  assigning.value = true

  try {
    await assignAward(
      newAssignment.value.racerId,
      newAssignment.value.awardDefinitionId,
      activeRace.value.id,
      newAssignment.value.notes || null
    )

    // Get award and racer names for toast
    const awardName = awardDefinitions.value.find(
      (a) => a.id === newAssignment.value.awardDefinitionId
    )?.name
    const racerName = racers.value.find((r) => r.id === newAssignment.value.racerId)?.name

    toast.add({
      severity: 'success',
      summary: 'Award Assigned',
      detail: `"${awardName}" has been awarded to ${racerName}.`,
      life: 4000
    })

    newAssignment.value = { awardDefinitionId: null, racerId: null, notes: '' }
  } catch (error) {
    // Keep essential error logging for production debugging
    console.error('Error assigning award:', error)
    toast.add({
      severity: 'error',
      summary: 'Assignment Failed',
      detail: error.message || 'Failed to assign award. Please try again.',
      life: 5000
    })
  } finally {
    assigning.value = false
  }
}

// Handle award image upload
const onAwardImageSelect = async (event) => {
  const file = event.files[0]
  if (!file) return

  try {
    const fileExt = file.name.split('.').pop()
    const fileName = `award-${Date.now()}.${fileExt}`

    const { error } = await supabase.storage.from('race-images').upload(fileName, file)

    if (error) throw error

    const { data: urlData } = supabase.storage.from('race-images').getPublicUrl(fileName)

    definitionForm.value.image_url = urlData.publicUrl

    toast.add({
      severity: 'success',
      summary: 'Image Uploaded',
      detail: 'Award image has been uploaded successfully.',
      life: 3000
    })
  } catch (error) {
    // Keep essential error logging for production debugging
    console.error('Error uploading image:', error)
    toast.add({
      severity: 'error',
      summary: 'Upload Failed',
      detail: 'Failed to upload image. Please try again.',
      life: 5000
    })
  }
}

// Remove award image
const removeAwardImage = () => {
  definitionForm.value.image_url = ''
}

// Remove assignment using composable
const removeAssignment = async (assignmentId) => {
  try {
    // Get assignment details before deletion for toast message
    const assignment = currentAssignments.value.find((a) => a.id === assignmentId)
    const awardName = assignment?.award_definition?.name
    const racerName = assignment?.racer?.name

    await removeAward(assignmentId)

    toast.add({
      severity: 'warn',
      summary: 'Award Removed',
      detail: `"${awardName}" award has been removed from ${racerName}.`,
      life: 4000
    })
  } catch (error) {
    // Keep essential error logging for production debugging
    console.error('Error removing assignment:', error)
    toast.add({
      severity: 'error',
      summary: 'Removal Failed',
      detail: error.message || 'Failed to remove award assignment. Please try again.',
      life: 5000
    })
  }
}

// Confirm and delete definition
const confirmDeleteDefinition = (definition) => {
  confirm.require({
    message: `Are you sure you want to delete the "${definition.name}" award type? This action cannot be undone and will remove all associated awards.`,
    header: 'Delete Award Type',
    icon: 'pi pi-exclamation-triangle',
    rejectClass: 'p-button-secondary p-button-outlined',
    acceptClass: 'p-button-danger',
    rejectLabel: 'Cancel',
    acceptLabel: 'Delete',
    accept() {
      deleteDefinition(definition.id, definition.name)
    }
  })
}

// Delete definition
const deleteDefinition = async (definitionId, definitionName) => {
  try {
    await deleteAwardDefinition(definitionId)

    toast.add({
      severity: 'success',
      summary: 'Award Type Deleted',
      detail: `Award type "${definitionName}" has been deleted successfully.`,
      life: 3000
    })
    
    return true // Indicate success
  } catch (error) {
    // Keep essential error logging for production debugging
    console.error('Error deleting award definition:', error)
    toast.add({
      severity: 'error',
      summary: 'Delete Failed',
      detail: error.message || 'Failed to delete award type. Please try again.',
      life: 5000
    })
    
    return false // Indicate failure
  }
}

// Reset definition form
const resetDefinitionForm = () => {
  definitionForm.value = {
    name: '',
    description: '',
    image_url: '',
    voteable: false
  }
  editingDefinition.value = null
}

// Watch for active race changes
watch(activeRace, async () => {
  if (activeRace.value) {
    await fetchRacers()
  }
})

// Watch for dialog close
watch(showAddDefinitionDialog, (visible) => {
  if (!visible) {
    resetDefinitionForm()
  }
})

// Initialize
onMounted(async () => {
  await authStore.initAuth()

  // Check if user is admin
  if (!authStore.isRaceAdmin) {
    await navigateTo('/awards')
    return
  }

  // Initialize all composables
  await Promise.all([initializeRaces(), initializeCheckins()])

  // Initialize awards with active race filter after races are loaded
  if (activeRace.value) {
    await initializeAwards({
      includeInactive: true, // Include inactive award definitions for management
      raceId: activeRace.value.id
    })
    // Refresh checkins data to ensure we have current check-in status
    await fetchCheckins(activeRace.value.id)
    await fetchRacers()
  }
})

useHead({
  title: 'Manage Awards - The Great Holyoke Brick Race',
  meta: [{ name: 'description', content: 'Manage award types and assign awards to racers.' }]
})
</script>

<style scoped>
/* Professional form styling */
.form-input,
.form-select,
.form-textarea,
.form-checkbox {
  @apply border-gray-300 shadow-sm;
}

.form-input:focus,
.form-select:focus,
.form-textarea:focus {
  @apply border-indigo-500 ring-1 ring-indigo-500;
}

/* Dialog styling */
.awards-dialog :deep(.p-dialog) {
  @apply bg-white rounded-lg shadow-2xl border border-gray-200;
}

.awards-dialog :deep(.p-dialog-header) {
  @apply bg-white text-gray-900 px-6 py-4 rounded-t-lg border-b-2 border-gray-200;
}

.awards-dialog :deep(.p-dialog-title) {
  @apply text-lg font-semibold text-gray-900;
}

.awards-dialog :deep(.p-dialog-header-close) {
  @apply text-gray-600 hover:bg-gray-100 rounded;
}

.awards-dialog :deep(.p-dialog-content) {
  @apply bg-white px-6 py-6 text-gray-900 dark:text-white;
}

.awards-dialog :deep(.p-dialog-footer) {
  @apply bg-gray-50 px-6 py-4 rounded-b-lg border-t border-gray-200;
}

/* Ensure proper text contrast */
.awards-dialog label {
  @apply text-gray-700 dark:text-gray-300 font-medium;
}

.awards-dialog input,
.awards-dialog textarea,
.awards-dialog select {
  @apply text-gray-900 dark:text-white;
}
</style>
