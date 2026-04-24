<script setup lang="ts">
definePageMeta({ layout: 'dashboard', middleware: ['auth', 'organizer'] })

const api = useOrganizerApi()
const { success, error: notifyError } = useNotification()

const loading = ref(true)
const resending = ref(false)
const searchQuery = ref('')
const activeFilter = ref('all')
const emailModalOpen = ref(false)
const resendTicketOpen = ref(false)
const selectedParticipant = ref<any>(null)
const emailSubject = ref('')
const emailMessage = ref('')
const currentPage = ref(1)
const totalPages = ref(1)

const evtFilters = ref<{ key: string; label: string }[]>([
  { key: 'all', label: 'Tous' },
])
const filters = computed(() => evtFilters.value)

const headers = ['Participant', 'Email', 'Événement', 'Pass', 'Inscription', 'Check-in', 'Actions']

const tableColumns = [
  { key: 'name', label: 'Participant' },
  { key: 'email', label: 'Email', hideOnMobile: true },
  { key: 'event', label: 'Événement', hideOnMobile: true },
  { key: 'pass', label: 'Pass' },
  { key: 'guestInfo', label: 'Infos inscription', hideOnMobile: true },
  { key: 'inscription', label: 'Inscription', hideOnMobile: true },
  { key: 'checkin', label: 'Check-in' },
]

const participants = ref<any[]>([])

const avatarColors = ['var(--color-orange-primary)', 'var(--color-blue-main)', 'var(--color-green-dark)', 'var(--color-gold)', 'var(--color-ink2)']

const getInitials = (name: string) => {
  const parts = name.trim().split(' ')
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase()
  return name.substring(0, 2).toUpperCase()
}

const checkinClassMap: Record<string, string> = {
  scanned: 'text-green-dark',
  checked_in: 'text-green-dark',
  used: 'text-green-dark',
  pending: 'text-orange-primary',
  waiting: 'text-orange-primary',
  valid: 'text-orange-primary',
  cancelled: 'text-red-500',
}

const checkinLabelMap: Record<string, string> = {
  scanned: 'Validé',
  checked_in: 'Validé',
  used: 'Validé',
  pending: 'En attente',
  waiting: 'En attente',
  valid: 'En attente',
  cancelled: 'Annulé',
}

const checkinVariantMap: Record<string, 'success' | 'warning' | 'error' | 'info' | 'neutral'> = {
  'Validé': 'success',
  'En attente': 'warning',
  'Annulé': 'error',
}

const passVariant = (pass: string): 'warning' | 'neutral' => {
  return pass?.toLowerCase().includes('vip') ? 'warning' : 'neutral'
}

const filteredParticipants = computed(() => {
  let result = participants.value
  if (activeFilter.value !== 'all') {
    if (activeFilter.value === 'vip') {
      result = result.filter(p => p.pass?.toLowerCase().includes('vip'))
    } else {
      result = result.filter(p => p.evtKey === activeFilter.value)
    }
  }
  if (searchQuery.value.trim()) {
    const q = searchQuery.value.toLowerCase().trim()
    result = result.filter(p => p.name.toLowerCase().includes(q) || p.email.toLowerCase().includes(q))
  }
  return result
})

const loadParticipants = async () => {
  loading.value = true
  try {
    const params: Record<string, unknown> = { page: currentPage.value, per_page: 50 }
    if (searchQuery.value.trim()) params.search = searchQuery.value.trim()

    const [participantsRes, eventsRes] = await Promise.allSettled([
      api.getParticipants(params),
      api.getEvents(),
    ])

    if (eventsRes.status === 'fulfilled') {
      const data = (eventsRes.value as any)?.data ?? eventsRes.value
      const evts = Array.isArray(data) ? data : []
      evtFilters.value = [
        { key: 'all', label: `Tous (${evts.reduce((s: number, e: any) => s + (e.tickets_sold ?? 0), 0)})` },
        ...evts.map((e: any) => ({ key: String(e.id), label: e.title })),
        { key: 'vip', label: 'Pass VIP' },
      ]
    }

    if (participantsRes.status === 'fulfilled') {
      const raw = (participantsRes.value as any)?.data ?? participantsRes.value
      const items = Array.isArray(raw) ? raw : (raw?.data || [])
      totalPages.value = raw?.last_page || raw?.meta?.last_page || 1
      participants.value = items.map((p: any, i: number) => {
        const name = p.user?.name || p.name || p.buyer_name || ''
        const passName = p.pass_type || p.pass_name || p.pass?.name || ''
        return {
          id: p.id || p.ticket_id,
          name,
          initials: getInitials(name),
          email: p.user?.email || p.email || '',
          event: p.event_title || p.event?.title || p.event_name || '',
          evtKey: String(p.event_id || p.event?.id || ''),
          pass: passName,
          passClass: passName.toLowerCase().includes('vip') ? 'text-orange-primary' : 'text-text-secondary',
          inscription: p.order_date || p.date_label || (p.order_date_iso ? new Date(p.order_date_iso).toLocaleDateString('fr-FR') : '') || '',
          checkin: checkinLabelMap[p.ticket_status] || checkinLabelMap[p.checkin_status] || checkinLabelMap[p.status] || 'En attente',
          checkinClass: checkinClassMap[p.ticket_status] || checkinClassMap[p.checkin_status] || checkinClassMap[p.status] || 'text-orange-primary',
          avatarColor: avatarColors[i % avatarColors.length],
          guestName: p.guest_name || '',
          guestEmail: p.guest_email || '',
          guestPhone: p.guest_phone || '',
          guestCompany: p.guest_company || '',
          hasGuestInfo: !!(p.guest_name || p.guest_email || p.guest_phone || p.guest_company),
        }
      })
    }
  } catch {
    notifyError('Impossible de charger les participants')
  } finally {
    loading.value = false
  }
}

let searchTimeout: ReturnType<typeof setTimeout> | null = null
watch(searchQuery, () => {
  if (searchTimeout) clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => loadParticipants(), 400)
})

const openEmailModal = (p: any) => {
  selectedParticipant.value = p
  emailSubject.value = ''
  emailMessage.value = ''
  emailModalOpen.value = true
}

const sendEmail = async () => {
  if (!selectedParticipant.value) return
  if (!emailSubject.value.trim() || !emailMessage.value.trim()) {
    notifyError('Veuillez remplir l\'objet et le message')
    return
  }
  try {
    await api.sendEmailToParticipant(selectedParticipant.value.id, {
      subject: emailSubject.value,
      message: emailMessage.value,
    })
    emailModalOpen.value = false
    success(`Email envoyé à ${selectedParticipant.value.name}`)
  } catch {
    notifyError('Impossible d\'envoyer l\'email')
  }
}

const openResendTicket = (p: any) => {
  selectedParticipant.value = p
  resendTicketOpen.value = true
}

const confirmResendTicket = async () => {
  if (!selectedParticipant.value) return
  resending.value = true
  try {
    await api.resendTicket(selectedParticipant.value.id)
    success(`Billet renvoyé à ${selectedParticipant.value.name}`)
  } catch {
    notifyError('Impossible de renvoyer le billet')
  } finally {
    resending.value = false
    resendTicketOpen.value = false
  }
}

onMounted(() => loadParticipants())
</script>

<template>
  <div>
    <UiPageHeader title="Participants" subtitle="Retrouvez tous les participants de vos événements" />

    <!-- Barre de recherche -->
    <div class="flex items-center gap-2.5 bg-surface border border-border-light rounded-lg px-4 py-2.5 mb-4 transition-[border-color] duration-200 focus-within:border-orange-primary">
      <span class="text-text-tertiary">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
      </span>
      <input
        v-model="searchQuery"
        type="text"
        placeholder="Rechercher un participant par nom, email…"
        class="bg-transparent border-none outline-none font-sans text-sm text-text-primary flex-1 placeholder:text-text-tertiary"
      />
    </div>

    <!-- Filtres événements -->
    <div class="flex gap-2 mb-5 flex-wrap">
      <button
        v-for="f in filters"
        :key="f.key"
        class="px-3.5 py-1.5 rounded-full text-xs font-semibold bg-surface-2 border border-border-light text-text-secondary cursor-pointer transition-all duration-150 shrink-0 hover:bg-orange-dim hover:border-orange-primary hover:text-orange-primary"
        :class="activeFilter === f.key ? 'bg-orange-dim !border-orange-primary !text-orange-primary' : ''"
        @click="activeFilter = f.key"
      >{{ f.label }}</button>
    </div>

    <!-- Table via DataTable -->
    <UiDataTable
      :columns="tableColumns"
      :rows="filteredParticipants"
      :loading="loading"
      empty-title="Aucun participant"
      empty-description="Il n'y a pas encore de participants pour vos événements."
    >
      <template #cell-name="{ row }">
        <div class="flex items-center gap-3">
          <div
            class="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
            :style="{ background: row.avatarColor }"
          >{{ row.initials }}</div>
          <span class="font-semibold text-text-primary">{{ row.name }}</span>
        </div>
      </template>

      <template #cell-email="{ row }">
        <span class="text-xs text-text-secondary">{{ row.email }}</span>
      </template>

      <template #cell-pass="{ row }">
        <UiStatusBadge
          v-if="row.pass"
          :variant="passVariant(row.pass)"
          :label="row.pass"
        />
      </template>

      <template #cell-guestInfo="{ row }">
        <div v-if="row.hasGuestInfo" class="relative group">
          <button class="text-xs text-orange-primary font-medium cursor-pointer bg-transparent border-none font-sans">
            Voir
          </button>
          <div class="absolute z-10 hidden group-hover:block left-0 top-full mt-1 bg-white border border-border-light rounded-lg p-3 min-w-[200px]">
            <div v-if="row.guestName" class="text-xs text-text-secondary mb-1">
              <span class="font-medium text-text-primary">Nom :</span> {{ row.guestName }}
            </div>
            <div v-if="row.guestEmail && row.guestEmail !== row.email" class="text-xs text-text-secondary mb-1">
              <span class="font-medium text-text-primary">Email :</span> {{ row.guestEmail }}
            </div>
            <div v-if="row.guestPhone" class="text-xs text-text-secondary mb-1">
              <span class="font-medium text-text-primary">Tél. :</span> {{ row.guestPhone }}
            </div>
            <div v-if="row.guestCompany" class="text-xs text-text-secondary">
              <span class="font-medium text-text-primary">Entreprise :</span> {{ row.guestCompany }}
            </div>
          </div>
        </div>
        <span v-else class="text-xs text-text-tertiary">—</span>
      </template>

      <template #cell-inscription="{ row }">
        <span class="text-xs text-text-secondary">{{ row.inscription }}</span>
      </template>

      <template #cell-checkin="{ row }">
        <UiStatusBadge
          :variant="checkinVariantMap[row.checkin] || 'neutral'"
          :label="row.checkin"
        />
      </template>

      <template #actions="{ row }">
        <div class="flex gap-1.5 justify-end">
          <button
            class="w-9 h-9 rounded-lg bg-surface-2 border border-border-light flex items-center justify-center cursor-pointer transition-all duration-150 text-text-secondary hover:bg-surface-3 hover:text-text-primary hover:border-border-medium"
            title="Envoyer un email"
            @click.stop="openEmailModal(row)"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
          </button>
          <button
            class="w-9 h-9 rounded-lg bg-surface-2 border border-border-light flex items-center justify-center cursor-pointer transition-all duration-150 text-text-secondary hover:bg-surface-3 hover:text-text-primary hover:border-border-medium"
            title="Renvoyer le billet"
            @click.stop="openResendTicket(row)"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2z"/></svg>
          </button>
        </div>
      </template>
    </UiDataTable>

    <!-- Modal email -->
    <UiBaseModal
      :is-open="emailModalOpen"
      :title="'Envoyer un email à ' + (selectedParticipant?.name || '')"
      size="md"
      @close="emailModalOpen = false"
    >
      <div class="space-y-5">
        <div>
          <label class="block text-xs font-semibold text-text-secondary mb-2">Destinataire</label>
          <div class="px-4 py-3 rounded-lg bg-surface-2 border border-border-light text-sm text-text-primary">{{ selectedParticipant?.email }}</div>
        </div>
        <div>
          <label class="block text-xs font-semibold text-text-secondary mb-2">Objet</label>
          <input
            v-model="emailSubject"
            type="text"
            placeholder="Objet de l'email"
            class="w-full px-4 py-3 rounded-lg bg-surface border border-border-light text-sm text-text-primary font-sans outline-none transition-[border-color] duration-150 focus:border-orange-primary placeholder:text-text-tertiary"
          />
        </div>
        <div>
          <label class="block text-xs font-semibold text-text-secondary mb-2">Message</label>
          <textarea
            v-model="emailMessage"
            rows="5"
            placeholder="Votre message..."
            class="w-full px-4 py-3 rounded-lg bg-surface border border-border-light text-sm text-text-primary font-sans outline-none transition-[border-color] duration-150 focus:border-orange-primary placeholder:text-text-tertiary resize-none leading-relaxed"
          />
        </div>
      </div>
      <template #footer>
        <div class="flex items-center justify-end gap-3">
          <button
            class="px-5 py-2.5 rounded-lg text-sm font-medium text-text-secondary bg-surface-2 hover:bg-surface-3 transition-colors cursor-pointer"
            @click="emailModalOpen = false"
          >Annuler</button>
          <button
            class="px-5 py-2.5 rounded-lg text-sm font-medium text-white bg-orange-primary hover:bg-orange-light transition-colors cursor-pointer"
            @click="sendEmail"
          >Envoyer</button>
        </div>
      </template>
    </UiBaseModal>

    <UiConfirmModal
      :is-open="resendTicketOpen"
      title="Renvoyer le billet"
      :message="'Renvoyer le billet à ' + (selectedParticipant?.name || '') + ' (' + (selectedParticipant?.email || '') + ') ?'"
      confirm-text="Renvoyer"
      cancel-text="Annuler"
      variant="info"
      @confirm="confirmResendTicket"
      @cancel="resendTicketOpen = false"
    />
  </div>
</template>
