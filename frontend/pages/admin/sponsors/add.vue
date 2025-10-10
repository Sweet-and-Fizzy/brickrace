<template>
  <div class="min-h-screen bg-gray-50">
    <PageHeader title="Add New Sponsor" subtitle="Create a new sponsor entry for the race" />

    <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
      <Card>
        <template #content>
          <form class="space-y-6" @submit.prevent="createSponsor">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <!-- Name -->
              <div class="field col-span-2">
                <label for="name" class="block text-sm font-medium text-gray-700 mb-2">
                  Sponsor Name *
                </label>
                <InputText
                  id="name"
                  v-model="form.name"
                  :class="{ 'p-invalid': !form.name.trim() && submitted }"
                  placeholder="Enter sponsor name"
                  required
                />
                <small v-if="!form.name.trim() && submitted" class="p-error">
                  Sponsor name is required.
                </small>
              </div>

              <!-- Website URL -->
              <div class="field col-span-2">
                <label for="website_url" class="block text-sm font-medium text-gray-700 mb-2">
                  Website URL
                </label>
                <InputText
                  id="website_url"
                  v-model="form.website_url"
                  placeholder="https://example.com"
                />
                <small class="text-gray-500"> Optional: Link to sponsor's website </small>
              </div>

              <!-- Sponsorship Amount -->
              <div class="field">
                <label
                  for="sponsorship_amount"
                  class="block text-sm font-medium text-gray-700 mb-2"
                >
                  Sponsorship Amount
                </label>
                <InputNumber
                  id="sponsorship_amount"
                  v-model="form.sponsorship_amount"
                  mode="currency"
                  currency="USD"
                  locale="en-US"
                  :min="0"
                  placeholder="$0.00"
                />
                <small class="text-gray-500">
                  For internal tracking (not publicly displayed)
                </small>
              </div>

              <!-- Display Order -->
              <div class="field">
                <label for="display_order" class="block text-sm font-medium text-gray-700 mb-2">
                  Display Order
                </label>
                <InputNumber
                  id="display_order"
                  v-model="form.display_order"
                  :min="0"
                  placeholder="0"
                />
                <small class="text-gray-500"> Lower numbers appear first (0 = first) </small>
              </div>

              <!-- Status -->
              <div class="field col-span-2">
                <div class="flex items-center">
                  <Checkbox id="is_active" v-model="form.is_active" binary />
                  <label for="is_active" class="ml-2 text-sm font-medium text-gray-700">
                    Active (visible on public pages)
                  </label>
                </div>
              </div>

              <!-- Logo Upload -->
              <div class="field col-span-2">
                <label class="block text-sm font-medium text-gray-700 mb-2"> Sponsor Logo </label>

                <!-- Preview -->
                <div v-if="logoPreview" class="mb-4">
                  <img
                    :src="logoPreview"
                    :alt="form.name"
                    class="h-24 object-contain rounded-lg border border-gray-200 bg-white p-2"
                  />
                </div>

                <!-- Upload -->
                <FileUpload
                  mode="basic"
                  :auto="false"
                  accept="image/*"
                  :max-file-size="5000000"
                  choose-label="Choose Logo"
                  class="mb-2"
                  @select="onLogoSelect"
                />
                <small class="text-gray-500 block">
                  Maximum file size: 5MB. Recommended: PNG or JPG with transparent background for
                  best display.
                </small>
              </div>
            </div>

            <!-- Actions -->
            <div class="flex justify-between items-center pt-6 border-t border-gray-200">
              <Button label="Cancel" severity="secondary" @click="navigateTo('/admin/sponsors')" />
              <div class="flex space-x-3">
                <Button
                  type="submit"
                  label="Create Sponsor"
                  :loading="creating"
                  class="btn-primary"
                />
              </div>
            </div>
          </form>
        </template>
      </Card>
    </div>
  </div>
</template>

<script setup>
definePageMeta({
  middleware: 'admin'
})

const toast = useToast()
const sponsorsStore = useSponsors()

// State
const creating = ref(false)
const submitted = ref(false)
const logoFile = ref(null)
const logoPreview = ref(null)

const form = ref({
  name: '',
  website_url: '',
  sponsorship_amount: 0,
  display_order: 0,
  is_active: true
})

// Methods
const onLogoSelect = (event) => {
  const file = event.files[0]
  if (file) {
    logoFile.value = file

    // Create preview
    const reader = new FileReader()
    reader.onload = (e) => {
      logoPreview.value = e.target.result
    }
    reader.readAsDataURL(file)
  }
}

const createSponsor = async () => {
  submitted.value = true

  // Validation
  if (!form.value.name.trim()) {
    toast.add({
      severity: 'error',
      summary: 'Validation Error',
      detail: 'Sponsor name is required.',
      life: 3000
    })
    return
  }

  creating.value = true

  try {
    let logoUrl = null

    // Upload logo if provided
    if (logoFile.value) {
      logoUrl = await sponsorsStore.uploadSponsorLogo(logoFile.value)
    }

    // Create sponsor
    const sponsorData = {
      ...form.value,
      logo_url: logoUrl
    }

    await sponsorsStore.createSponsor(sponsorData)

    toast.add({
      severity: 'success',
      summary: 'Sponsor Created',
      detail: `${form.value.name} has been created successfully.`,
      life: 3000
    })

    // Navigate back to sponsors list
    await navigateTo('/admin/sponsors')
  } catch (error) {
    console.error('Error creating sponsor:', error)
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Failed to create sponsor. Please try again.',
      life: 5000
    })
  } finally {
    creating.value = false
  }
}
</script>
