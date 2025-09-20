import type { Sponsor } from '~/types/database'

export const useSponsors = () => {
  const supabase = useSupabaseClient<any>()
  const sponsors = ref<Sponsor[]>([])
  const loading = ref(false)

  // Get all active sponsors for public display (ordered by display_order)
  const getActiveSponsors = async (): Promise<Sponsor[]> => {
    loading.value = true
    try {
      const { data, error } = await supabase
        .from('sponsors')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true })
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching active sponsors:', error)
        throw error
      }

      sponsors.value = data || []
      return data || []
    } finally {
      loading.value = false
    }
  }

  // Get all sponsors for admin management
  const getAllSponsors = async (): Promise<Sponsor[]> => {
    loading.value = true
    try {
      const { data, error } = await supabase
        .from('sponsors')
        .select('*')
        .order('display_order', { ascending: true })
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching all sponsors:', error)
        throw error
      }

      sponsors.value = data || []
      return data || []
    } finally {
      loading.value = false
    }
  }

  // Create a new sponsor
  const createSponsor = async (sponsorData: Partial<Sponsor>): Promise<Sponsor> => {
    const { data, error } = await supabase
      .from('sponsors')
      .insert({
        name: sponsorData.name!,
        website_url: sponsorData.website_url,
        logo_url: sponsorData.logo_url,
        sponsorship_amount: sponsorData.sponsorship_amount || 0,
        is_active: sponsorData.is_active ?? true,
        display_order: sponsorData.display_order || 0
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating sponsor:', error)
      throw error
    }

    // Refresh sponsors list
    await getAllSponsors()

    return data
  }

  // Update an existing sponsor
  const updateSponsor = async (id: string, updates: Partial<Sponsor>): Promise<Sponsor> => {
    const { data, error } = await supabase
      .from('sponsors')
      .update({
        name: updates.name,
        website_url: updates.website_url,
        logo_url: updates.logo_url,
        sponsorship_amount: updates.sponsorship_amount,
        is_active: updates.is_active,
        display_order: updates.display_order,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating sponsor:', error)
      throw error
    }

    // Refresh sponsors list
    await getAllSponsors()

    return data
  }

  // Delete a sponsor
  const deleteSponsor = async (id: string): Promise<void> => {
    const { error } = await supabase
      .from('sponsors')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting sponsor:', error)
      throw error
    }

    // Refresh sponsors list
    await getAllSponsors()
  }

  // Upload sponsor logo
  const uploadSponsorLogo = async (file: File, sponsorId?: string): Promise<string> => {
    const fileExt = file.name.split('.').pop()
    const fileName = `${sponsorId || Date.now()}.${fileExt}`
    const filePath = `sponsor-logos/${fileName}`

    const { data, error } = await supabase.storage
      .from('general-photos')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      })

    if (error) {
      console.error('Error uploading sponsor logo:', error)
      throw error
    }

    const { data: publicUrlData } = supabase.storage
      .from('general-photos')
      .getPublicUrl(data.path)

    return publicUrlData.publicUrl
  }

  // Initialize with active sponsors by default
  const initialize = async () => {
    await getActiveSponsors()
  }

  return {
    sponsors: readonly(sponsors),
    loading: readonly(loading),
    getActiveSponsors,
    getAllSponsors,
    createSponsor,
    updateSponsor,
    deleteSponsor,
    uploadSponsorLogo,
    initialize
  }
}