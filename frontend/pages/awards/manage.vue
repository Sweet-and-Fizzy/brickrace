<template>
  <div class="container mx-auto px-4 py-8">
    <div class="flex justify-between items-center mb-8">
      <h1 class="text-3xl font-bold text-gray-900 dark:text-white">Manage Awards</h1>
      <div class="flex gap-2">
        <NuxtLink to="/awards">
          <Button label="Back to Awards" icon="pi pi-arrow-left" severity="secondary" outlined />
        </NuxtLink>
        <Button
          label="Add Award Type"
          icon="pi pi-plus"
          severity="primary"
          @click="showAddDefinitionDialog = true"
        />
      </div>
    </div>

    <!-- Race Selection -->
    <div class="mb-6">
      <label
        for="race-select"
        class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
      >
        Select Race for Award Assignment
      </label>
      <Select
        v-model="selectedRace"
        :options="races"
        option-label="name"
        option-value="id"
        placeholder="Choose a race"
        class="w-full md:w-80"
        show-clear
      />
    </div>

    <!-- Award Definitions Management -->
    <div class="mb-12">
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
              />
              <div
                v-else
                class="w-full aspect-square bg-gray-200 dark:bg-gray-700 flex items-center justify-center"
              >
                <i class="pi pi-trophy text-4xl text-gray-400 dark:text-gray-500" />
              </div>
              <div class="absolute top-2 right-2 flex gap-1">
                <Badge v-if="definition.voteable" value="Voteable" severity="info" />
                <Badge v-if="!definition.active" value="Inactive" severity="warning" />
              </div>
            </div>
          </template>

          <template #title>{{ definition.name }}</template>
          <template #subtitle>{{ definition.description }}</template>

          <template #footer>
            <div class="flex justify-between">
              <Button
                label="Edit"
                icon="pi pi-pencil"
                size="small"
                severity="info"
                outlined
                @click="editDefinition(definition)"
              />
              <Button
                :label="definition.active ? 'Deactivate' : 'Activate'"
                :icon="definition.active ? 'pi pi-times' : 'pi pi-check'"
                size="small"
                :severity="definition.active ? 'danger' : 'success'"
                outlined
                @click="toggleDefinitionActive(definition)"
              />
            </div>
          </template>
        </Card>
      </div>
    </div>

    <!-- Award Assignment Section -->
    <div v-if="selectedRace">
      <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-6">Assign Awards</h2>

      <!-- Current Assignments -->
      <div v-if="currentAssignments.length" class="mb-8">
        <h3 class="text-lg font-semibold mb-4">Current Awards</h3>
        <div class="space-y-4">
          <div
            v-for="assignment in currentAssignments"
            :key="assignment.id"
            class="flex items-center justify-between p-4 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-700 rounded-lg"
          >
            <div class="flex items-center space-x-4">
              <i class="pi pi-trophy text-green-600 text-xl" />
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
            <Button
              severity="danger"
              size="small"
              outlined
              @click="removeAssignment(assignment.id)"
            >
              <i class="pi pi-times mr-2" />
              Remove
            </Button>
          </div>
        </div>
      </div>

      <!-- New Assignment Form -->
      <Panel header="Assign New Award" toggleable class="mb-6">
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
              placeholder="Select racer"
              class="w-full"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >Notes (optional)</label
            >
            <InputText v-model="newAssignment.notes" placeholder="Award notes" class="w-full" />
          </div>
        </div>
        <div class="mt-6 pt-4 border-t border-gray-200">
          <Button
            :disabled="!newAssignment.awardDefinitionId || !newAssignment.racerId || assigning"
            :loading="assigning"
            severity="success"
            @click="assignAward"
          >
            <i v-if="!assigning" class="pi pi-plus mr-2" />
            {{ assigning ? 'Assigning...' : 'Assign Award' }}
          </Button>
        </div>
      </Panel>

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
              />
              <Button
                label="Remove Image"
                icon="pi pi-times"
                severity="danger"
                size="small"
                outlined
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
              <p class="text-sm text-gray-500">Upload an image (max 5MB) or provide a URL below</p>

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
          <Button
            label="Cancel"
            severity="secondary"
            outlined
            @click="showAddDefinitionDialog = false"
          />
          <Button
            :disabled="!definitionForm.name"
            :loading="savingDefinition"
            :label="editingDefinition ? 'Update Award' : 'Create Award'"
            :icon="editingDefinition ? 'pi pi-pencil' : 'pi pi-plus'"
            severity="primary"
            @click="saveDefinition"
          />
        </div>
      </template>
    </Dialog>
  </div>
</template>

<script setup>
import { useAuthStore } from '~/stores/auth'
import { useToast } from 'primevue/usetoast'
import InputText from 'primevue/inputtext'
import Textarea from 'primevue/textarea'
import Checkbox from 'primevue/checkbox'
import Button from 'primevue/button'
import FileUpload from 'primevue/fileupload'

const authStore = useAuthStore()
const { $supabase } = useNuxtApp()
const toast = useToast()

// Navigation guard
definePageMeta({
  middleware: 'auth'
})

const races = ref([])
const selectedRace = ref(null)
const awardDefinitions = ref([])
const currentAssignments = ref([])
const racers = ref([])
const voteResults = ref([])

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

const activeAwardDefinitions = computed(() => awardDefinitions.value.filter((def) => def.active))

const awardDefinitionOptions = computed(() =>
  activeAwardDefinitions.value.map((def) => ({ label: def.name, value: def.id }))
)

const racerOptions = computed(() =>
  racers.value.map((racer) => ({ label: racer.name, value: racer.id }))
)

// Fetch races
const fetchRaces = async () => {
  try {
    const { data, error } = await $supabase
      .from('races')
      .select('id, name, date')
      .order('date', { ascending: false })

    if (error) throw error
    races.value = data || []
  } catch (error) {
    console.error('Error fetching races:', error)
  }
}

// Fetch award definitions
const fetchAwardDefinitions = async () => {
  try {
    const { data, error } = await $supabase.from('award_definitions').select('*').order('name')

    if (error) throw error
    awardDefinitions.value = data || []
  } catch (error) {
    console.error('Error fetching award definitions:', error)
  }
}

// Fetch racers for selected race
const fetchRacers = async () => {
  if (!selectedRace.value) return

  try {
    const { data, error } = await $supabase
      .from('checkins')
      .select(
        `
        racer_id,
        racers(id, name)
      `
      )
      .eq('race_id', selectedRace.value)

    if (error) throw error

    const uniqueRacers = []
    const seen = new Set()

    data?.forEach((checkin) => {
      if (checkin.racers && !seen.has(checkin.racers.id)) {
        seen.add(checkin.racers.id)
        uniqueRacers.push(checkin.racers)
      }
    })

    racers.value = uniqueRacers
  } catch (error) {
    console.error('Error fetching racers:', error)
  }
}

// Fetch current assignments
const fetchCurrentAssignments = async () => {
  if (!selectedRace.value) return

  try {
    const { data, error } = await $supabase
      .from('awards')
      .select(
        `
        *,
        award_definition:award_definitions(*),
        racer:racers(name)
      `
      )
      .eq('race_id', selectedRace.value)

    if (error) throw error
    currentAssignments.value = data || []
  } catch (error) {
    console.error('Error fetching current assignments:', error)
  }
}

// Fetch vote results
const fetchVoteResults = async () => {
  if (!selectedRace.value) return

  try {
    const { data, error } = await $supabase
      .from('award_vote_counts')
      .select('*')
      .eq('race_id', selectedRace.value)
      .order('vote_count', { ascending: false })

    if (error) throw error

    const grouped = {}
    data?.forEach((vote) => {
      if (!grouped[vote.award_name]) {
        grouped[vote.award_name] = {
          award_name: vote.award_name,
          votes: []
        }
      }
      grouped[vote.award_name].votes.push(vote)
    })

    voteResults.value = Object.values(grouped)
  } catch (error) {
    console.error('Error fetching vote results:', error)
  }
}

// Save award definition
const saveDefinition = async () => {
  if (!definitionForm.value.name) return

  savingDefinition.value = true

  try {
    console.log('Saving definition form:', definitionForm.value)
    if (editingDefinition.value) {
      console.log('Updating definition with ID:', editingDefinition.value.id)
      const { data, error } = await $supabase
        .from('award_definitions')
        .update(definitionForm.value)
        .eq('id', editingDefinition.value.id)
        .select()

      if (error) throw error
      console.log('Update result:', data)
    } else {
      const { data, error } = await $supabase
        .from('award_definitions')
        .insert({ ...definitionForm.value, active: true })
        .select()

      if (error) throw error
      console.log('Insert result:', data)
    }

    await fetchAwardDefinitions()
    showAddDefinitionDialog.value = false
    resetDefinitionForm()

    toast.add({
      severity: 'success',
      summary: editingDefinition.value ? 'Award Updated' : 'Award Created',
      detail: `Award type "${definitionForm.value.name}" has been ${editingDefinition.value ? 'updated' : 'created'} successfully.`,
      life: 3000
    })
  } catch (error) {
    console.error('Error saving award definition:', error)
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Failed to save award definition. Please try again.',
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

// Toggle definition active status
const toggleDefinitionActive = async (definition) => {
  try {
    const { error } = await $supabase
      .from('award_definitions')
      .update({ active: !definition.active })
      .eq('id', definition.id)

    if (error) throw error
    await fetchAwardDefinitions()

    toast.add({
      severity: 'info',
      summary: 'Award Status Updated',
      detail: `Award type "${definition.name}" has been ${!definition.active ? 'activated' : 'deactivated'}.`,
      life: 3000
    })
  } catch (error) {
    console.error('Error toggling definition status:', error)
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Failed to update award status. Please try again.',
      life: 5000
    })
  }
}

// Assign award
const assignAward = async () => {
  if (!newAssignment.value.awardDefinitionId || !newAssignment.value.racerId) return

  assigning.value = true

  try {
    const { error } = await $supabase.from('awards').insert({
      award_definition_id: newAssignment.value.awardDefinitionId,
      racer_id: newAssignment.value.racerId,
      race_id: selectedRace.value,
      assigned_by: authStore.user.id,
      notes: newAssignment.value.notes || null
    })

    if (error) throw error

    await fetchCurrentAssignments()

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
    console.error('Error assigning award:', error)
    toast.add({
      severity: 'error',
      summary: 'Assignment Failed',
      detail: 'Failed to assign award. Please try again.',
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

    const { data, error } = await $supabase.storage.from('race-images').upload(fileName, file)

    if (error) throw error

    const { data: urlData } = $supabase.storage.from('race-images').getPublicUrl(fileName)

    definitionForm.value.image_url = urlData.publicUrl

    toast.add({
      severity: 'success',
      summary: 'Image Uploaded',
      detail: 'Award image has been uploaded successfully.',
      life: 3000
    })
  } catch (error) {
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

// Remove assignment
const removeAssignment = async (assignmentId) => {
  try {
    // Get assignment details before deletion for toast message
    const assignment = currentAssignments.value.find((a) => a.id === assignmentId)
    const awardName = assignment?.award_definition?.name
    const racerName = assignment?.racer?.name

    const { error } = await $supabase.from('awards').delete().eq('id', assignmentId)

    if (error) throw error
    await fetchCurrentAssignments()

    toast.add({
      severity: 'warn',
      summary: 'Award Removed',
      detail: `"${awardName}" award has been removed from ${racerName}.`,
      life: 4000
    })
  } catch (error) {
    console.error('Error removing assignment:', error)
    toast.add({
      severity: 'error',
      summary: 'Removal Failed',
      detail: 'Failed to remove award assignment. Please try again.',
      life: 5000
    })
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

// Watch for race selection changes
watch(selectedRace, async () => {
  if (selectedRace.value) {
    await Promise.all([fetchRacers(), fetchCurrentAssignments(), fetchVoteResults()])
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

  await Promise.all([fetchRaces(), fetchAwardDefinitions()])
})

useHead({
  title: 'Manage Awards - Brick Race Championship',
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
  @apply bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-6 py-4 rounded-t-lg;
  border-bottom: none;
}

.awards-dialog :deep(.p-dialog-title) {
  @apply text-lg font-semibold text-white;
}

.awards-dialog :deep(.p-dialog-header-close) {
  @apply text-white hover:bg-white hover:bg-opacity-20 rounded;
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
