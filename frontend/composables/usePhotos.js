// Create useState-based state for photos
const usePhotosState = () => {
  const generalPhotos = useState('photos-general-data', () => [])
  const racerPhotos = useState('photos-racer-data', () => [])
  const allPhotos = useState('photos-all-data', () => [])
  const loading = useState('photos-loading', () => false)
  const error = useState('photos-error', () => null)
  const channels = useState('photos-channels', () => ({
    generalPhotosChannel: null,
    racersChannel: null
  }))
  const initialized = useState('photos-initialized', () => false)

  return {
    generalPhotos,
    racerPhotos,
    allPhotos,
    loading,
    error,
    channels,
    initialized
  }
}

export const usePhotos = () => {
  const { $supabase } = useNuxtApp()
  // Get useState-based state
  const state = usePhotosState()

  // Use useState-based state
  const generalPhotos = state.generalPhotos
  const racerPhotos = state.racerPhotos
  const allPhotos = state.allPhotos
  const loading = state.loading
  const error = state.error

  // Photo fetching functions
  const fetchGeneralPhotos = async (filters = {}) => {
    try {
      let query = $supabase
        .from('general_photos')
        .select(
          `
          *,
          races(name)
        `
        )
        .order('uploaded_at', { ascending: false })

      // Apply filters
      if (filters.status) {
        query = query.eq('status', filters.status)
      }
      if (filters.raceId) {
        query = query.eq('race_id', filters.raceId)
      }
      if (filters.userId) {
        query = query.eq('user_id', filters.userId)
      }
      if (filters.featured !== undefined) {
        query = query.eq('featured', filters.featured)
      }

      const { data, error: fetchError } = await query

      if (fetchError) throw fetchError

      generalPhotos.value = data || []
      return data || []
    } catch (err) {
      // Keep essential error logging for production debugging
      console.error('Error fetching general photos:', err)
      error.value = err.message
      return []
    }
  }

  const fetchRacerPhotos = async (filters = {}) => {
    try {
      let query = $supabase
        .from('racers')
        .select('id, name, racer_number, photos, user_id, created_at')
        .not('photos', 'is', null)
        .order('created_at', { ascending: false })

      // Apply filters
      if (filters.userId) {
        query = query.eq('user_id', filters.userId)
      }

      const { data: racersData, error: racersError } = await query

      if (racersError) throw racersError

      const photos = []

      // Process racer photos
      for (const racer of racersData || []) {
        if (racer.photos && Array.isArray(racer.photos)) {
          for (const [index, photo] of racer.photos.entries()) {
            let photoObj = photo
            if (typeof photo === 'string') {
              try {
                photoObj = JSON.parse(photo)
              } catch {
                photoObj = { url: photo, status: 'approved' }
              }
            }

            // Apply status filter
            if (filters.status && photoObj.status !== filters.status) {
              continue
            }

            // Apply featured filter
            if (filters.featured !== undefined && !!photoObj.featured !== filters.featured) {
              continue
            }

            photos.push({
              id: `racer-${racer.id}-${index}`,
              url: photoObj.url || photoObj,
              status: photoObj.status || 'approved',
              featured: photoObj.featured || false,
              title: racer.name,
              subtitle: racer.racer_number,
              category: 'racer',
              categoryLabel: 'Racer Photo',
              uploadedAt: photoObj.uploadedAt || racer.created_at,
              type: 'racer',
              racerId: racer.id,
              racerName: racer.name,
              racerNumber: racer.racer_number,
              photoIndex: index,
              userId: racer.user_id,
              credit: photoObj.credit
            })
          }
        }
      }

      racerPhotos.value = photos
      return photos
    } catch (err) {
      // Keep essential error logging for production debugging
      console.error('Error fetching racer photos:', err)
      error.value = err.message
      return []
    }
  }

  const fetchAllPhotos = async (filters = {}) => {
    loading.value = true
    try {
      const [generalData, racerData] = await Promise.all([
        fetchGeneralPhotos(filters),
        fetchRacerPhotos(filters)
      ])

      // Transform general photos to unified format
      const transformedGeneral = generalData.map((photo) => ({
        id: `general-${photo.id}`,
        url: photo.url,
        status: photo.status,
        featured: photo.featured,
        title: photo.description || '',
        subtitle: '',
        description: photo.description,
        category: photo.category,
        categoryLabel: getCategoryLabel(photo.category),
        uploadedAt: photo.uploaded_at,
        type: 'general',
        raceId: photo.race_id,
        raceName: photo.races?.name || null,
        userId: photo.user_id,
        credit: photo.credit
      }))

      // Combine and sort all photos
      const combined = [...transformedGeneral, ...racerData].sort(
        (a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt)
      )

      allPhotos.value = combined
      return combined
    } finally {
      loading.value = false
    }
  }

  // Photo management functions
  const approvePhoto = async (photo) => {
    try {
      if (photo.type === 'general') {
        const photoId = photo.id.replace('general-', '')
        const { error } = await $supabase
          .from('general_photos')
          .update({ status: 'approved' })
          .eq('id', photoId)

        if (error) throw error

        // Update local state
        const generalIndex = generalPhotos.value.findIndex((p) => p.id === photoId)
        if (generalIndex !== -1) {
          generalPhotos.value[generalIndex].status = 'approved'
        }
      } else if (photo.type === 'racer') {
        const { data: racerData, error: fetchError } = await $supabase
          .from('racers')
          .select('photos')
          .eq('id', photo.racerId)
          .single()

        if (fetchError) throw fetchError

        const updatedPhotos = [...(racerData.photos || [])]
        if (updatedPhotos[photo.photoIndex]) {
          if (typeof updatedPhotos[photo.photoIndex] === 'string') {
            updatedPhotos[photo.photoIndex] = {
              url: updatedPhotos[photo.photoIndex],
              status: 'approved'
            }
          } else {
            updatedPhotos[photo.photoIndex].status = 'approved'
          }

          const { error: updateError } = await $supabase
            .from('racers')
            .update({ photos: updatedPhotos })
            .eq('id', photo.racerId)

          if (updateError) throw updateError
        }
      }

      // Update allPhotos state
      const photoIndex = allPhotos.value.findIndex((p) => p.id === photo.id)
      if (photoIndex !== -1) {
        allPhotos.value[photoIndex].status = 'approved'
      }

      return true
    } catch (err) {
      // Keep essential error logging for production debugging
      console.error('Error approving photo:', err)
      error.value = err.message
      throw err
    }
  }

  const rejectPhoto = async (photo) => {
    try {
      if (photo.type === 'general') {
        const photoId = photo.id.replace('general-', '')
        const { error } = await $supabase
          .from('general_photos')
          .update({ status: 'rejected' })
          .eq('id', photoId)

        if (error) throw error

        // Update local state
        const generalIndex = generalPhotos.value.findIndex((p) => p.id === photoId)
        if (generalIndex !== -1) {
          generalPhotos.value[generalIndex].status = 'rejected'
        }
      } else if (photo.type === 'racer') {
        const { data: racerData, error: fetchError } = await $supabase
          .from('racers')
          .select('photos')
          .eq('id', photo.racerId)
          .single()

        if (fetchError) throw fetchError

        const updatedPhotos = [...(racerData.photos || [])]
        if (updatedPhotos[photo.photoIndex]) {
          if (typeof updatedPhotos[photo.photoIndex] === 'string') {
            updatedPhotos[photo.photoIndex] = {
              url: updatedPhotos[photo.photoIndex],
              status: 'rejected'
            }
          } else {
            updatedPhotos[photo.photoIndex].status = 'rejected'
          }

          const { error: updateError } = await $supabase
            .from('racers')
            .update({ photos: updatedPhotos })
            .eq('id', photo.racerId)

          if (updateError) throw updateError
        }
      }

      // Update allPhotos state
      const photoIndex = allPhotos.value.findIndex((p) => p.id === photo.id)
      if (photoIndex !== -1) {
        allPhotos.value[photoIndex].status = 'rejected'
      }

      return true
    } catch (err) {
      // Keep essential error logging for production debugging
      console.error('Error rejecting photo:', err)
      error.value = err.message
      throw err
    }
  }

  const toggleFeatured = async (photo) => {
    try {
      const newFeaturedStatus = !photo.featured

      if (photo.type === 'general') {
        const photoId = photo.id.replace('general-', '')
        const { error } = await $supabase
          .from('general_photos')
          .update({ featured: newFeaturedStatus })
          .eq('id', photoId)

        if (error) throw error

        // Update local state
        const generalIndex = generalPhotos.value.findIndex((p) => p.id === photoId)
        if (generalIndex !== -1) {
          generalPhotos.value[generalIndex].featured = newFeaturedStatus
        }
      } else if (photo.type === 'racer') {
        const { data: racerData, error: fetchError } = await $supabase
          .from('racers')
          .select('photos')
          .eq('id', photo.racerId)
          .single()

        if (fetchError) throw fetchError

        const updatedPhotos = [...(racerData.photos || [])]
        if (updatedPhotos[photo.photoIndex]) {
          if (typeof updatedPhotos[photo.photoIndex] === 'string') {
            updatedPhotos[photo.photoIndex] = {
              url: updatedPhotos[photo.photoIndex],
              featured: newFeaturedStatus
            }
          } else {
            updatedPhotos[photo.photoIndex].featured = newFeaturedStatus
          }

          const { error: updateError } = await $supabase
            .from('racers')
            .update({ photos: updatedPhotos })
            .eq('id', photo.racerId)

          if (updateError) throw updateError
        }
      }

      // Update allPhotos state
      const photoIndex = allPhotos.value.findIndex((p) => p.id === photo.id)
      if (photoIndex !== -1) {
        allPhotos.value[photoIndex].featured = newFeaturedStatus
      }

      return newFeaturedStatus
    } catch (err) {
      // Keep essential error logging for production debugging
      console.error('Error toggling featured status:', err)
      error.value = err.message
      throw err
    }
  }

  const deletePhoto = async (photo) => {
    try {
      if (photo.type === 'general') {
        const photoId = photo.id.replace('general-', '')
        const { error } = await $supabase.from('general_photos').delete().eq('id', photoId)

        if (error) throw error

        // Remove from local state
        generalPhotos.value = generalPhotos.value.filter((p) => p.id !== photoId)
        allPhotos.value = allPhotos.value.filter((p) => p.id !== photo.id)
      } else if (photo.type === 'racer') {
        const { data: racerData, error: fetchError } = await $supabase
          .from('racers')
          .select('photos')
          .eq('id', photo.racerId)
          .single()

        if (fetchError) throw fetchError

        const updatedPhotos = [...(racerData.photos || [])]
        updatedPhotos.splice(photo.photoIndex, 1)

        const { error: updateError } = await $supabase
          .from('racers')
          .update({ photos: updatedPhotos })
          .eq('id', photo.racerId)

        if (updateError) throw updateError

        // Remove from local state and update indices
        allPhotos.value = allPhotos.value.filter((p) => p.id !== photo.id)
        racerPhotos.value = racerPhotos.value.filter((p) => p.id !== photo.id)

        // Update photo indices for remaining photos from the same racer
        allPhotos.value.forEach((p) => {
          if (
            p.type === 'racer' &&
            p.racerId === photo.racerId &&
            p.photoIndex > photo.photoIndex
          ) {
            p.photoIndex -= 1
            p.id = `racer-${p.racerId}-${p.photoIndex}`
          }
        })
        racerPhotos.value.forEach((p) => {
          if (p.racerId === photo.racerId && p.photoIndex > photo.photoIndex) {
            p.photoIndex -= 1
            p.id = `racer-${p.racerId}-${p.photoIndex}`
          }
        })
      }

      return true
    } catch (err) {
      // Keep essential error logging for production debugging
      console.error('Error deleting photo:', err)
      error.value = err.message
      throw err
    }
  }

  const updatePhotoMetadata = async (photo, metadata) => {
    try {
      if (photo.type === 'general') {
        const photoId = photo.id.replace('general-', '')
        const { error } = await $supabase
          .from('general_photos')
          .update({
            description: metadata.description?.trim() || null,
            credit: metadata.credit?.trim() || null,
            updated_at: new Date().toISOString()
          })
          .eq('id', photoId)

        if (error) throw error

        // Update local state
        const generalIndex = generalPhotos.value.findIndex((p) => p.id === photoId)
        if (generalIndex !== -1) {
          generalPhotos.value[generalIndex] = { ...generalPhotos.value[generalIndex], ...metadata }
        }

        const allIndex = allPhotos.value.findIndex((p) => p.id === photo.id)
        if (allIndex !== -1) {
          allPhotos.value[allIndex] = { ...allPhotos.value[allIndex], ...metadata }
        }
      }

      return true
    } catch (err) {
      // Keep essential error logging for production debugging
      console.error('Error updating photo metadata:', err)
      error.value = err.message
      throw err
    }
  }

  // Real-time subscriptions
  const setupSubscriptions = () => {
    // Only set up subscriptions once globally
    if (state.channels.value.generalPhotosChannel) {
      return
    }

    // Subscribe to general photos changes
    state.channels.value.generalPhotosChannel = $supabase
      .channel('global-general-photos-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'general_photos'
        },
        handleGeneralPhotoUpdate
      )
      .subscribe()

    // Subscribe to racer photos changes
    state.channels.value.racersChannel = $supabase
      .channel('global-racers-photos-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'racers'
        },
        handleRacerPhotoUpdate
      )
      .subscribe()
  }

  const handleGeneralPhotoUpdate = (payload) => {
    const { eventType, new: newRecord, old: oldRecord } = payload

    switch (eventType) {
      case 'INSERT': {
        // Add new photo to the list
        const newPhoto = {
          id: `general-${newRecord.id}`,
          url: newRecord.url,
          status: newRecord.status,
          featured: newRecord.featured,
          title: newRecord.description || '',
          subtitle: '',
          description: newRecord.description,
          category: newRecord.category,
          categoryLabel: getCategoryLabel(newRecord.category),
          uploadedAt: newRecord.uploaded_at,
          type: 'general',
          raceId: newRecord.race_id,
          userId: newRecord.user_id,
          credit: newRecord.credit
        }
        generalPhotos.value.unshift(newRecord)
        allPhotos.value.unshift(newPhoto)
        break
      }

      case 'UPDATE': {
        // Update existing photo
        const generalIndex = generalPhotos.value.findIndex((p) => p.id === newRecord.id)
        if (generalIndex !== -1) {
          generalPhotos.value[generalIndex] = newRecord
        }

        const allIndex = allPhotos.value.findIndex((p) => p.id === `general-${newRecord.id}`)
        if (allIndex !== -1) {
          allPhotos.value[allIndex] = {
            ...allPhotos.value[allIndex],
            status: newRecord.status,
            featured: newRecord.featured,
            description: newRecord.description,
            credit: newRecord.credit
          }
        }
        break
      }

      case 'DELETE': {
        // Remove photo from lists
        generalPhotos.value = generalPhotos.value.filter((p) => p.id !== oldRecord.id)
        allPhotos.value = allPhotos.value.filter((p) => p.id !== `general-${oldRecord.id}`)
        break
      }
    }
  }

  const handleRacerPhotoUpdate = (payload) => {
    const { eventType, new: newRecord, old: oldRecord } = payload

    if (eventType === 'UPDATE' && newRecord.photos !== oldRecord.photos) {
      // Racer photos were updated, refresh racer photos
      fetchRacerPhotos()
    }
  }

  // Cleanup subscriptions
  const cleanup = () => {
    if (state.channels.value.generalPhotosChannel) {
      $supabase.removeChannel(state.channels.value.generalPhotosChannel)
      state.channels.value.generalPhotosChannel = null
    }
    if (state.channels.value.racersChannel) {
      $supabase.removeChannel(state.channels.value.racersChannel)
      state.channels.value.racersChannel = null
    }
  }

  // Initialize
  const initialize = async (filters = {}) => {
    loading.value = true
    try {
      await fetchAllPhotos(filters)
      setupSubscriptions()
    } finally {
      loading.value = false
    }
  }

  // Utility functions
  const getCategoryLabel = (category) => {
    const categoryMap = {
      racer: 'Racer Photo',
      crowd: 'Crowd Photo',
      setup: 'Setup Photo',
      awards: 'Awards Photo',
      venue: 'Venue Photo',
      action: 'Action Shot',
      general: 'General Photo'
    }
    return categoryMap[category] || 'Photo'
  }

  // Computed properties
  const approvedPhotos = computed(() =>
    allPhotos.value.filter((photo) => photo.status === 'approved')
  )

  const pendingPhotos = computed(() =>
    allPhotos.value.filter((photo) => photo.status === 'pending' || !photo.status)
  )

  const rejectedPhotos = computed(() =>
    allPhotos.value.filter((photo) => photo.status === 'rejected')
  )

  const featuredPhotos = computed(() => allPhotos.value.filter((photo) => photo.featured))

  const photosByCategory = computed(() => {
    const categories = {}
    allPhotos.value.forEach((photo) => {
      if (!categories[photo.category]) {
        categories[photo.category] = []
      }
      categories[photo.category].push(photo)
    })
    return categories
  })

  const getPhotosByUser = (userId) => {
    return allPhotos.value.filter((photo) => photo.userId === userId)
  }

  const getPhotosByRace = (raceId) => {
    return allPhotos.value.filter((photo) => photo.raceId === raceId)
  }

  const getPhotosByRacer = (racerId) => {
    return allPhotos.value.filter((photo) => photo.type === 'racer' && photo.racerId === racerId)
  }

  return {
    // Data
    generalPhotos,
    racerPhotos,
    allPhotos,
    loading,
    error,

    // Computed
    approvedPhotos,
    pendingPhotos,
    rejectedPhotos,
    featuredPhotos,
    photosByCategory,

    // Methods
    initialize,
    fetchAllPhotos,
    fetchGeneralPhotos,
    fetchRacerPhotos,
    approvePhoto,
    rejectPhoto,
    toggleFeatured,
    deletePhoto,
    updatePhotoMetadata,
    getPhotosByUser,
    getPhotosByRace,
    getPhotosByRacer,
    cleanup
  }
}
