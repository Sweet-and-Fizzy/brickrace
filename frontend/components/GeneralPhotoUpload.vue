<template>
  <div class="space-y-6">
    <!-- Upload Area -->
    <div class="space-y-4">
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-2">
          Select Photos to Upload
        </label>
        <FileUpload
          ref="fileUpload"
          mode="advanced"
          multiple
          accept="image/*"
          :max-file-size="10000000"
          :file-limit="10"
          :auto="false"
          choose-label="Choose Photos"
          upload-label="Upload Photos"
          cancel-label="Clear All"
          class="w-full"
          :pt="{
            root: {
              class: 'border-2 border-dashed border-gray-300 rounded-lg'
            },
            content: { class: 'p-6' }
          }"
          @select="onFilesSelected"
          @remove="onFileRemoved"
          @clear="onFilesClear"
          @upload="onUpload"
          @before-choose="onBeforeChoose"
        >
          <template #empty>
            <div class="text-center">
              <i class="pi pi-cloud-upload text-4xl text-gray-400 mb-4" />
              <p class="text-gray-600 mb-2">Drag and drop photos here, or click to select files</p>
              <p class="text-sm text-gray-500">JPG, PNG, GIF up to 10MB each • Maximum 10 photos</p>
            </div>
          </template>

          <template
            #file="{
              file,
              uploadedFileCount: _uploadedFileCount,
              totalFileCount: _totalFileCount,
              removeFileCallback
            }"
          >
            <div class="flex items-center justify-between p-3 bg-gray-50 border rounded-lg">
              <div class="flex items-center gap-3">
                <img
                  v-if="file.objectURL"
                  :src="file.objectURL"
                  :alt="file.name"
                  class="w-12 h-12 object-cover rounded border"
                >
                <div class="flex-1">
                  <p class="font-medium text-black text-sm">{{ file.name }}</p>
                  <p class="text-xs text-gray-500">
                    {{ formatFileSize(file.size) }}
                  </p>
                </div>
              </div>

              <div class="flex items-center gap-2">
                <Badge v-if="file.uploaded" value="Uploaded" severity="success" />
                <Badge v-else-if="file.uploading" value="Uploading..." severity="info" />
                <Button
                  v-if="!file.uploaded"
                  icon="pi pi-times"
                  severity="danger"
                  text
                  rounded
                  size="small"
                  @click="removeFileCallback()"
                />
              </div>
            </div>
          </template>
        </FileUpload>
      </div>

      <!-- Photo Metadata -->
      <div v-if="selectedFiles.length > 0" class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2"> Photo Category </label>
          <Select
            v-model="photoCategory"
            :options="categoryOptions"
            option-label="label"
            option-value="value"
            placeholder="Select category"
            class="w-full"
          />
        </div>

        <!-- Show race info if provided -->
        <div v-if="raceId && raceName" class="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <div class="flex items-center gap-2">
            <i class="pi pi-flag text-blue-600" />
            <span class="text-sm font-medium text-blue-800">
              Photos will be associated with: {{ raceName }}
            </span>
          </div>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">
            Description (Optional)
          </label>
          <Textarea
            v-model="photoDescription"
            placeholder="Describe these photos (e.g., 'Crowd shots from the awards ceremony', 'Setup photos before the race')"
            rows="3"
            class="w-full"
          />
        </div>
      </div>
    </div>

    <!-- Upload Progress -->
    <div v-if="uploading" class="space-y-3">
      <div class="flex items-center justify-between">
        <span class="text-sm font-medium text-gray-700">
          Uploading {{ uploadedCount }} of {{ totalFiles }} photos...
        </span>
        <span class="text-sm text-gray-500"> {{ Math.round(uploadProgress) }}% </span>
      </div>
      <ProgressBar :value="uploadProgress" class="h-2" :show-value="false" />
    </div>

    <!-- Error Messages -->
    <div v-if="errors.length > 0" class="space-y-2">
      <div v-for="error in errors" :key="error" class="text-sm text-red-600">
        <i class="pi pi-exclamation-triangle mr-1" />
        {{ error }}
      </div>
    </div>

    <!-- Success Message -->
    <div
      v-if="uploadComplete && uploadedCount > 0"
      class="bg-green-50 border border-green-200 rounded-lg p-4"
    >
      <div class="flex items-center">
        <i class="pi pi-check-circle text-green-600 mr-2" />
        <p class="text-sm text-green-800">
          Successfully uploaded {{ uploadedCount }} photo{{ uploadedCount !== 1 ? 's' : '' }}!
          {{
            authStore.isRaceAdmin
              ? 'Photos are now live and visible to all users.'
              : 'They will be reviewed by admins before being published.'
          }}
        </p>
      </div>
    </div>

    <!-- Upload Button -->
    <div v-if="selectedFiles.length > 0 && !uploading && !uploadComplete" class="flex justify-end">
      <Button :disabled="!photoCategory" size="large" class="font-semibold" @click="startUpload">
        <i class="pi pi-upload mr-2" />
        Upload {{ selectedFiles.length }} Photo{{ selectedFiles.length !== 1 ? 's' : '' }}
      </Button>
    </div>
  </div>
</template>

<script setup>
import { useAuthStore } from '~/stores/auth'

const props = defineProps({
  raceId: {
    type: [String, Number],
    default: null
  }
})

const emit = defineEmits(['photo-uploaded', 'upload-complete'])

const authStore = useAuthStore()
const supabase = useSupabaseClient()

// State
const fileUpload = ref(null)
const selectedFiles = ref([])
const uploading = ref(false)
const uploadComplete = ref(false)
const uploadedCount = ref(0)
const totalFiles = ref(0)
const uploadProgress = ref(0)
const errors = ref([])

// Form data
const photoCategory = ref('')
const photoDescription = ref('')
const raceName = ref('')

// Category options
const categoryOptions = ref([
  { label: 'Event/Crowd Photos', value: 'crowd' },
  { label: 'Setup/Behind the Scenes', value: 'setup' },
  { label: 'Awards Ceremony', value: 'awards' },
  { label: 'Track/Venue Photos', value: 'venue' },
  { label: 'Action Shots', value: 'action' },
  { label: 'General Race Photos', value: 'general' }
])

// Methods
const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

const onFilesSelected = (event) => {
  selectedFiles.value = event.files
  errors.value = []
  uploadComplete.value = false

  // Validate files
  const validFiles = []
  for (const file of event.files) {
    if (file.size > 10000000) {
      errors.value.push(`${file.name} is too large (max 10MB)`)
      continue
    }
    if (!file.type.startsWith('image/')) {
      errors.value.push(`${file.name} is not an image file`)
      continue
    }
    validFiles.push(file)
  }

  if (validFiles.length !== event.files.length) {
    selectedFiles.value = validFiles
  }
}

const onFileRemoved = (event) => {
  selectedFiles.value = selectedFiles.value.filter((f) => f !== event.file)
}

const onFilesClear = () => {
  selectedFiles.value = []
  errors.value = []
  uploadComplete.value = false
  uploadProgress.value = 0
}

const onUpload = () => {
  // This is called by the PrimeVue component but we handle upload manually
}

const onBeforeChoose = () => {
  // File selection about to begin
}

const startUpload = async () => {
  if (!photoCategory.value) {
    errors.value = ['Please select a photo category']
    return
  }

  uploading.value = true
  uploadComplete.value = false
  uploadedCount.value = 0
  totalFiles.value = selectedFiles.value.length
  uploadProgress.value = 0
  errors.value = []

  try {
    for (let i = 0; i < selectedFiles.value.length; i++) {
      const file = selectedFiles.value[i]
      await uploadSingleFile(file)
      uploadedCount.value++
      uploadProgress.value = (uploadedCount.value / totalFiles.value) * 100
    }

    uploadComplete.value = true
    emit('upload-complete', {
      count: uploadedCount.value,
      category: photoCategory.value,
      raceId: props.raceId
    })
  } catch (error) {
    console.error('Upload error:', error)
    errors.value.push('Upload failed. Please try again.')
  } finally {
    uploading.value = false
  }
}

const uploadSingleFile = async (file) => {
  try {
    // Create unique filename
    const fileExt = file.name.split('.').pop()
    const fileName = `general/${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`

    // Upload to Supabase Storage
    const { data: _uploadData, error: uploadError } = await supabase.storage
      .from('race-images')
      .upload(fileName, file)

    if (uploadError) throw uploadError

    // Get public URL
    const { data: urlData } = supabase.storage.from('race-images').getPublicUrl(fileName)

    // Save photo metadata to general_photos table
    const { data: _photoData, error: photoError } = await supabase
      .from('general_photos')
      .insert({
        url: urlData.publicUrl,
        category: photoCategory.value,
        description: photoDescription.value || null,
        race_id: props.raceId || null,
        user_id: authStore.user?.id,
        status: authStore.isRaceAdmin ? 'approved' : 'pending' // Auto-approve for admins
      })
      .select()
      .single()

    if (photoError) {
      console.error('Error saving photo metadata:', photoError)
      throw photoError
    }

    emit('photo-uploaded', {
      url: urlData.publicUrl,
      category: photoCategory.value,
      raceId: props.raceId
    })
  } catch (error) {
    console.error('Error uploading file:', error)
    throw error
  }
}

const fetchRaceName = async () => {
  if (!props.raceId) return

  try {
    const { data, error } = await supabase
      .from('races')
      .select('name')
      .eq('id', props.raceId)
      .single()

    if (error) throw error
    raceName.value = data?.name || ''
  } catch (error) {
    console.error('Error fetching race name:', error)
  }
}

// Initialize
onMounted(async () => {
  await fetchRaceName()
})

// Watch for raceId prop changes
watch(
  () => props.raceId,
  async () => {
    await fetchRaceName()
  }
)
</script>

<style scoped>
/* Custom file upload styling */
:deep(.p-fileupload-content) {
  border: none !important;
  padding: 0 !important;
}

:deep(.p-fileupload-file) {
  border: 1px solid #e5e7eb !important;
  border-radius: 0.5rem !important;
  margin-bottom: 0.5rem !important;
}

:deep(.p-fileupload-file:last-child) {
  margin-bottom: 0 !important;
}
</style>
