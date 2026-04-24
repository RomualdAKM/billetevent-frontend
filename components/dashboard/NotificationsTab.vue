<script setup lang="ts">
const api = useOrganizerApi()
const { success, error } = useNotification()

const loading = ref(false)
const saving = ref(false)

const notifEmailVente = ref(true)
const notifResume = ref(true)
const notifRemboursements = ref(false)
const notifRappel = ref(true)
const notifPostEvent = ref(true)

async function loadNotifPrefs() {
  loading.value = true
  try {
    const res = await api.getNotificationPrefs()
    const data = (res as any).data ?? res
    const prefs = data.preferences ?? data
    notifEmailVente.value = prefs.sale_email ?? prefs.email_on_sale ?? true
    notifResume.value = prefs.daily_summary ?? true
    notifRemboursements.value = prefs.refund_notifications ?? prefs.refund_alerts ?? false
    notifRappel.value = prefs.event_reminder ?? true
    notifPostEvent.value = prefs.post_event_report ?? true
  } catch {
    error('Impossible de charger les préférences de notification')
  } finally {
    loading.value = false
  }
}

async function saveNotifications() {
  saving.value = true
  try {
    await api.updateNotificationPrefs({
      sale_email: notifEmailVente.value,
      daily_summary: notifResume.value,
      refund_notifications: notifRemboursements.value,
      event_reminder: notifRappel.value,
      post_event_report: notifPostEvent.value,
    })
    success('Préférences de notifications sauvegardées')
  } catch (err: any) {
    error(err?.message || err?.data?.message || 'Erreur')
  } finally {
    saving.value = false
  }
}

onMounted(() => { loadNotifPrefs() })
</script>

<template>
  <div>
    <div class="mb-8">
      <h1 class="text-xl font-semibold text-text-primary">Notifications</h1>
      <p class="text-sm text-text-tertiary mt-1">Choisissez quand et comment être notifié</p>
    </div>

    <div class="divide-y divide-border-light/50">
      <div class="py-4 first:pt-0">
        <UiBaseToggle
          :model-value="notifEmailVente"
          label="Email à chaque vente"
          description="Reçois un email pour chaque billet vendu"
          @update:model-value="notifEmailVente = $event"
        />
      </div>
      <div class="py-4">
        <UiBaseToggle
          :model-value="notifResume"
          label="Résumé journalier"
          description="Un rapport quotidien de tes ventes"
          @update:model-value="notifResume = $event"
        />
      </div>
      <div class="py-4">
        <UiBaseToggle
          :model-value="notifRemboursements"
          label="Alertes remboursements"
          description="Notifié immédiatement en cas de remboursement"
          @update:model-value="notifRemboursements = $event"
        />
      </div>
      <div class="py-4">
        <UiBaseToggle
          :model-value="notifRappel"
          label="Rappel avant événement"
          description="Notification 48h avant le début de l'événement"
          @update:model-value="notifRappel = $event"
        />
      </div>
      <div class="py-4 last:pb-0">
        <UiBaseToggle
          :model-value="notifPostEvent"
          label="Rapport post-événement"
          description="Résumé complet des ventes après l'événement"
          @update:model-value="notifPostEvent = $event"
        />
      </div>
    </div>

    <div class="mt-8 flex justify-end">
      <UiBaseButton variant="primary" :loading="saving" @click="saveNotifications">
        Enregistrer
      </UiBaseButton>
    </div>
  </div>
</template>
