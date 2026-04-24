import type { Ref } from 'vue'

export function useFollowOrganizer(organizerId: Ref<number | null>, initialFollowing: Ref<boolean>) {
  const { toggleFollowOrganizer } = usePublicApi()
  const { success, info } = useNotification()

  const isFollowing = ref(initialFollowing.value)
  const followersCount = ref(0)
  const loading = ref(false)

  watch(initialFollowing, (val) => {
    isFollowing.value = val
  })

  async function toggleFollow() {
    if (!organizerId.value || loading.value) return
    loading.value = true

    // Optimistic update
    const previousState = isFollowing.value
    const previousCount = followersCount.value
    isFollowing.value = !previousState
    followersCount.value += isFollowing.value ? 1 : -1

    try {
      const res = await toggleFollowOrganizer(organizerId.value) as { following?: boolean }
      // Synchroniser avec la réponse serveur si disponible
      if (typeof res?.following === 'boolean') {
        isFollowing.value = res.following
      }
      if (isFollowing.value) {
        success('Vous suivez désormais cet organisateur')
      } else {
        info('Vous ne suivez plus cet organisateur')
      }
    } catch (_e) {
      // Rollback on error
      isFollowing.value = previousState
      followersCount.value = previousCount
    } finally {
      loading.value = false
    }
  }

  function setFollowersCount(count: number) {
    followersCount.value = count
  }

  return { isFollowing, followersCount, loading, toggleFollow, setFollowersCount }
}
