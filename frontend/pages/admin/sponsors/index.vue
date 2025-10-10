<template>
  <div class="min-h-screen bg-gray-50">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <PageHeader
        title="Sponsor Management"
        subtitle="Manage race sponsors and their information"
        :actions="[
          {
            label: 'Add Sponsor',
            icon: 'pi pi-plus',
            to: '/admin/sponsors/add'
          }
        ]"
      />

      <div class="pb-16">
        <!-- Loading State -->
        <div v-if="loading" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div
            v-for="i in 6"
            :key="i"
            class="bg-white rounded-lg border border-gray-200 p-6 animate-pulse"
          >
            <div class="flex items-center space-x-4 mb-4">
              <div class="bg-gray-300 rounded-lg w-16 h-16" />
              <div class="flex-1 space-y-2">
                <div class="h-4 bg-gray-300 rounded w-3/4" />
                <div class="h-3 bg-gray-200 rounded w-1/2" />
              </div>
            </div>
            <div class="space-y-2">
              <div class="h-3 bg-gray-200 rounded" />
              <div class="h-3 bg-gray-200 rounded w-2/3" />
            </div>
          </div>
        </div>

        <!-- Sponsors Grid -->
        <div
          v-else-if="sponsors.length > 0"
          class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          <div
            v-for="sponsor in sponsors"
            :key="sponsor.id"
            class="bg-white rounded-lg border border-gray-200 hover:border-gray-300 transition-colors"
          >
            <div class="p-6">
              <!-- Header with Logo and Basic Info -->
              <div class="flex items-start space-x-4 mb-4">
                <!-- Logo -->
                <div class="flex-shrink-0">
                  <img
                    v-if="sponsor.logo_url"
                    :src="sponsor.logo_url"
                    :alt="`${sponsor.name} logo`"
                    class="w-16 h-16 object-contain rounded-lg border border-gray-200"
                  />
                  <div
                    v-else
                    class="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center border border-gray-200"
                  >
                    <i class="pi pi-image text-gray-400 text-xl" />
                  </div>
                </div>

                <!-- Info -->
                <div class="flex-1 min-w-0">
                  <h3 class="text-lg font-semibold text-gray-900 truncate">
                    {{ sponsor.name }}
                  </h3>
                  <p
                    v-if="sponsor.website_url"
                    class="text-sm text-blue-600 hover:text-blue-800 truncate"
                  >
                    <a :href="sponsor.website_url" target="_blank" class="flex items-center">
                      <i class="pi pi-external-link mr-1" />
                      {{ sponsor.website_url.replace(/^https?:\/\//, '') }}
                    </a>
                  </p>
                  <div class="flex items-center mt-2">
                    <Badge
                      :value="sponsor.is_active ? 'Active' : 'Inactive'"
                      :severity="sponsor.is_active ? 'success' : 'secondary'"
                    />
                    <span class="ml-2 text-sm text-gray-500">
                      Order: {{ sponsor.display_order }}
                    </span>
                  </div>
                </div>
              </div>

              <!-- Sponsorship Amount (Admin Only) -->
              <div v-if="sponsor.sponsorship_amount && sponsor.sponsorship_amount > 0" class="mb-4">
                <span class="text-sm text-gray-500">Sponsorship Amount: </span>
                <span class="text-sm font-medium text-green-600">
                  ${{ sponsor.sponsorship_amount.toLocaleString() }}
                </span>
              </div>

              <!-- Actions -->
              <div class="flex justify-between items-center pt-4 border-t border-gray-200">
                <div class="text-xs text-gray-500">
                  {{ formatDate(sponsor.created_at) }}
                </div>
                <div class="flex space-x-2">
                  <Button
                    v-tooltip.top="'Edit'"
                    icon="pi pi-pencil"
                    size="small"
                    severity="secondary"
                    text
                    @click="editSponsor(sponsor)"
                  />
                  <Button
                    v-tooltip.top="'Delete'"
                    icon="pi pi-trash"
                    size="small"
                    severity="danger"
                    text
                    @click="confirmDelete(sponsor)"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Empty State -->
        <div v-else class="text-center py-16">
          <i class="pi pi-building text-gray-400 text-6xl mb-4" />
          <h3 class="text-lg font-medium text-gray-900 mb-2">No sponsors yet</h3>
          <p class="text-gray-600 mb-6">Get started by adding your first sponsor.</p>
          <Button class="btn-primary" @click="navigateTo('/admin/sponsors/add')">
            <i class="pi pi-plus mr-2" />
            Add First Sponsor
          </Button>
        </div>
      </div>
    </div>

    <!-- Edit Dialog -->
    <Dialog
      v-model:visible="editDialogVisible"
      modal
      header="Edit Sponsor"
      :style="{ width: '50rem' }"
      class="p-fluid"
    >
      <form v-if="selectedSponsor" @submit.prevent="updateSponsor">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <!-- Name -->
          <div class="field col-span-2">
            <label for="name" class="block text-sm font-medium text-gray-700 mb-2">
              Sponsor Name *
            </label>
            <InputText
              id="name"
              v-model="selectedSponsor.name"
              :class="{ 'p-invalid': !selectedSponsor.name.trim() }"
              placeholder="Enter sponsor name"
              required
            />
          </div>

          <!-- Website URL -->
          <div class="field col-span-2">
            <label for="website_url" class="block text-sm font-medium text-gray-700 mb-2">
              Website URL
            </label>
            <InputText
              id="website_url"
              v-model="selectedSponsor.website_url"
              placeholder="https://example.com"
            />
          </div>

          <!-- Sponsorship Amount -->
          <div class="field">
            <label for="sponsorship_amount" class="block text-sm font-medium text-gray-700 mb-2">
              Sponsorship Amount
            </label>
            <InputNumber
              id="sponsorship_amount"
              v-model="selectedSponsor.sponsorship_amount"
              mode="currency"
              currency="USD"
              locale="en-US"
              :min="0"
            />
          </div>

          <!-- Display Order -->
          <div class="field">
            <label for="display_order" class="block text-sm font-medium text-gray-700 mb-2">
              Display Order
            </label>
            <InputNumber
              id="display_order"
              v-model="selectedSponsor.display_order"
              :min="0"
              placeholder="0"
            />
          </div>

          <!-- Status -->
          <div class="field col-span-2">
            <div class="flex items-center">
              <Checkbox id="is_active" v-model="selectedSponsor.is_active" binary />
              <label for="is_active" class="ml-2 text-sm font-medium text-gray-700">
                Active (visible on public pages)
              </label>
            </div>
          </div>

          <!-- Logo Upload -->
          <div class="field col-span-2">
            <label class="block text-sm font-medium text-gray-700 mb-2"> Logo </label>

            <!-- Current Logo -->
            <div v-if="selectedSponsor.logo_url" class="mb-3">
              <img
                :src="selectedSponsor.logo_url"
                :alt="`${selectedSponsor.name} logo`"
                class="h-20 object-contain rounded-lg border border-gray-200"
              />
            </div>

            <!-- Upload New Logo -->
            <FileUpload
              mode="basic"
              :auto="false"
              accept="image/*"
              :max-file-size="5000000"
              choose-label="Choose Logo"
              class="mb-2"
              @select="onLogoSelect"
            />
            <small class="text-gray-500">
              Maximum file size: 5MB. Recommended: PNG or JPG with transparent background.
            </small>
          </div>
        </div>

        <div class="flex justify-end space-x-3 mt-6 pt-4 border-t border-gray-200">
          <Button label="Cancel" severity="secondary" @click="editDialogVisible = false" />
          <Button type="submit" label="Update Sponsor" :loading="updating" class="btn-primary" />
        </div>
      </form>
    </Dialog>

    <!-- Delete Confirmation -->
    <ConfirmDialog />
  </div>
</template>

<script setup>
import { useConfirm } from 'primevue/useconfirm'

definePageMeta({
  middleware: 'admin'
})

const confirm = useConfirm()
const toast = useToast()
const sponsorsStore = useSponsors()

// State
const editDialogVisible = ref(false)
const selectedSponsor = ref(null)
const updating = ref(false)
const logoFile = ref(null)

// Direct access to store refs (no computed)
const { sponsors, loading } = sponsorsStore

// Methods
const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString()
}

const editSponsor = (sponsor) => {
  selectedSponsor.value = { ...sponsor }
  editDialogVisible.value = true
}

const confirmDelete = (sponsor) => {
  confirm.require({
    message: `Are you sure you want to delete "${sponsor.name}"? This action cannot be undone.`,
    header: 'Delete Sponsor',
    icon: 'pi pi-exclamation-triangle',
    rejectClass: 'p-button-secondary',
    accept: () => deleteSponsor(sponsor)
  })
}

const deleteSponsor = async (sponsor) => {
  try {
    await sponsorsStore.deleteSponsor(sponsor.id)
    toast.add({
      severity: 'success',
      summary: 'Sponsor Deleted',
      detail: `${sponsor.name} has been deleted successfully.`,
      life: 3000
    })
  } catch (error) {
    console.error('Error deleting sponsor:', error)
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Failed to delete sponsor. Please try again.',
      life: 5000
    })
  }
}

const onLogoSelect = (event) => {
  logoFile.value = event.files[0]
}

const updateSponsor = async () => {
  if (!selectedSponsor.value?.name?.trim()) {
    toast.add({
      severity: 'error',
      summary: 'Validation Error',
      detail: 'Sponsor name is required.',
      life: 3000
    })
    return
  }

  updating.value = true
  try {
    let logoUrl = selectedSponsor.value.logo_url

    // Upload new logo if provided
    if (logoFile.value) {
      logoUrl = await sponsorsStore.uploadSponsorLogo(logoFile.value, selectedSponsor.value.id)
    }

    await sponsorsStore.updateSponsor(selectedSponsor.value.id, {
      ...selectedSponsor.value,
      logo_url: logoUrl
    })

    toast.add({
      severity: 'success',
      summary: 'Sponsor Updated',
      detail: `${selectedSponsor.value.name} has been updated successfully.`,
      life: 3000
    })

    editDialogVisible.value = false
    logoFile.value = null
  } catch (error) {
    console.error('Error updating sponsor:', error)
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Failed to update sponsor. Please try again.',
      life: 5000
    })
  } finally {
    updating.value = false
  }
}

// Initialize
onMounted(async () => {
  await sponsorsStore.getAllSponsors()
})
</script>
