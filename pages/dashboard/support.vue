<script setup lang="ts">
definePageMeta({ layout: 'dashboard', middleware: ['auth', 'organizer'] })

const api = useOrganizerApi()
const { success, error: notifyError } = useNotification()

const tickets = ref<any[]>([])
const loading = ref(false)
const showNewTicket = ref(false)
const submitting = ref(false)

const form = ref({
  subject_category: 'question_generale',
  priority: 'normal',
  description: '',
})

const categories = [
  { value: 'question_generale', label: 'Question générale' },
  { value: 'probleme_paiement', label: 'Problème de paiement' },
  { value: 'probleme_billet', label: 'Problème de billet' },
  { value: 'compte_utilisateur', label: 'Compte utilisateur' },
  { value: 'integration_technique', label: 'Intégration technique' },
  { value: 'autre', label: 'Autre' },
]

const priorityLabels: Record<string, string> = {
  normal: 'Normale',
  urgent: 'Urgente',
  critical: 'Critique',
}

const priorityClasses: Record<string, string> = {
  normal: 'bg-blue-dim text-blue-main',
  urgent: 'bg-orange-dim text-orange-primary',
  critical: 'bg-red-dim text-red-error',
}

const statusLabels: Record<string, string> = {
  open: 'Ouvert',
  in_progress: 'En cours',
  resolved: 'Résolu',
  closed: 'Fermé',
}

const statusClasses: Record<string, string> = {
  open: 'bg-blue-dim text-blue-main',
  in_progress: 'bg-orange-dim text-orange-primary',
  resolved: 'bg-green-100 text-green-700',
  closed: 'bg-surface-2 text-text-secondary',
}

async function loadTickets() {
  loading.value = true
  try {
    const res: any = await api.getSupportTickets()
    tickets.value = res?.data ?? res ?? []
  } catch (err: any) {
    notifyError(err?.message || 'Impossible de charger les tickets')
  } finally {
    loading.value = false
  }
}

async function submitTicket() {
  if (!form.value.description.trim()) {
    notifyError('Veuillez décrire votre problème')
    return
  }
  submitting.value = true
  try {
    await api.createSupportTicket({ ...form.value })
    success('Ticket créé — notre équipe va vous répondre rapidement.')
    form.value = { subject_category: 'question_generale', priority: 'normal', description: '' }
    showNewTicket.value = false
    await loadTickets()
  } catch (err: any) {
    notifyError(err?.message || err?.data?.message || 'Erreur')
  } finally {
    submitting.value = false
  }
}

function formatDate(iso?: string) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })
}

onMounted(loadTickets)
</script>

<template>
  <div>
    <UiPageHeader title="Support" subtitle="Besoin d'aide ? Contactez notre équipe">
      <template #actions>
        <button
          class="px-5 py-2.5 rounded-lg text-sm font-semibold bg-orange-primary text-white hover:bg-orange-light transition-colors cursor-pointer"
          @click="showNewTicket = true"
        >
          Nouveau ticket
        </button>
      </template>
    </UiPageHeader>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
      <div class="bg-surface border border-border-light rounded-xl p-6 flex items-center gap-4">
        <div class="w-12 h-12 rounded-xl bg-orange-primary/10 flex items-center justify-center shrink-0">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--color-orange-primary, #E8590C)" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
            <rect x="2" y="4" width="20" height="16" rx="2" />
            <path d="M22 7l-10 7L2 7" />
          </svg>
        </div>
        <div class="flex-1 min-w-0">
          <div class="text-xs text-text-tertiary mb-0.5">Email</div>
          <a href="mailto:support@billetevent.online" class="font-semibold text-text-primary text-sm hover:text-orange-primary transition-colors break-all">support@billetevent.online</a>
        </div>
      </div>

      <div class="bg-surface border border-border-light rounded-xl p-6 flex items-center gap-4">
        <div class="w-12 h-12 rounded-xl bg-[#25D366]/10 flex items-center justify-center shrink-0">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="#25D366">
            <path d="M12 0C5.373 0 0 5.373 0 12c0 2.134.558 4.133 1.528 5.875L.057 23.5a.5.5 0 00.61.61l5.794-1.497A11.95 11.95 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0z"/>
          </svg>
        </div>
        <div class="flex-1 min-w-0">
          <div class="text-xs text-text-tertiary mb-0.5">WhatsApp</div>
          <a href="https://wa.me/2290168295838" target="_blank" rel="noopener" class="font-semibold text-text-primary text-sm hover:text-orange-primary transition-colors">+229 01 68 29 58 38</a>
        </div>
      </div>
    </div>

    <div class="mt-8">
      <h2 class="font-serif text-xl text-text-primary mb-4">Mes tickets</h2>

      <div v-if="loading" class="bg-surface border border-border-light rounded-xl p-10 text-center text-sm text-text-tertiary">
        Chargement…
      </div>

      <div v-else-if="tickets.length === 0" class="bg-surface border border-border-light rounded-xl p-10 text-center">
        <p class="text-sm text-text-secondary">Vous n'avez pas encore créé de ticket.</p>
        <button class="mt-3 text-sm font-semibold text-orange-primary hover:underline cursor-pointer" @click="showNewTicket = true">Créer mon premier ticket</button>
      </div>

      <div v-else class="bg-surface border border-border-light rounded-xl overflow-hidden">
        <ul class="divide-y divide-border-light">
          <li v-for="ticket in tickets" :key="ticket.id" class="p-5 hover:bg-surface-2 transition-colors">
            <div class="flex items-start justify-between gap-3 flex-wrap">
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2 flex-wrap mb-1">
                  <span class="font-mono text-xs text-text-tertiary">{{ ticket.ticket_number }}</span>
                  <span :class="['px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide', statusClasses[ticket.status] || 'bg-surface-2 text-text-secondary']">
                    {{ statusLabels[ticket.status] || ticket.status }}
                  </span>
                  <span :class="['px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide', priorityClasses[ticket.priority] || 'bg-surface-2 text-text-secondary']">
                    {{ priorityLabels[ticket.priority] || ticket.priority }}
                  </span>
                </div>
                <div class="font-semibold text-sm text-text-primary mb-1">
                  {{ categories.find(c => c.value === ticket.subject_category)?.label || ticket.subject_category }}
                </div>
                <p class="text-sm text-text-secondary line-clamp-2">{{ ticket.description }}</p>
              </div>
              <div class="text-xs text-text-tertiary shrink-0">{{ formatDate(ticket.created_at) }}</div>
            </div>
          </li>
        </ul>
      </div>
    </div>

    <UiBaseModal :is-open="showNewTicket" title="Nouveau ticket" size="md" @close="showNewTicket = false">
      <div class="flex flex-col gap-5">
        <div>
          <label class="text-xs font-bold text-text-secondary block mb-2">Catégorie <span class="text-orange-primary">*</span></label>
          <select v-model="form.subject_category" class="w-full px-4 py-3 rounded-lg border border-border-light bg-surface text-sm text-text-primary outline-none transition-all cursor-pointer focus:border-orange-primary">
            <option v-for="c in categories" :key="c.value" :value="c.value">{{ c.label }}</option>
          </select>
        </div>
        <div>
          <label class="text-xs font-bold text-text-secondary block mb-2">Priorité <span class="text-orange-primary">*</span></label>
          <select v-model="form.priority" class="w-full px-4 py-3 rounded-lg border border-border-light bg-surface text-sm text-text-primary outline-none transition-all cursor-pointer focus:border-orange-primary">
            <option value="normal">Normale</option>
            <option value="urgent">Urgente</option>
            <option value="critical">Critique</option>
          </select>
        </div>
        <div>
          <label class="text-xs font-bold text-text-secondary block mb-2">Description <span class="text-orange-primary">*</span></label>
          <textarea v-model="form.description" rows="6" placeholder="Décrivez votre problème en détail…" class="w-full px-4 py-3 rounded-lg border border-border-light bg-surface text-sm text-text-primary outline-none transition-all resize-y min-h-[160px] leading-relaxed focus:border-orange-primary" />
        </div>
      </div>
      <template #footer>
        <div class="flex items-center justify-end gap-2.5">
          <button :disabled="submitting" class="px-5 py-2.5 rounded-lg text-sm font-semibold text-text-secondary bg-surface-2 hover:bg-surface-3 transition-colors cursor-pointer disabled:opacity-60" @click="showNewTicket = false">Annuler</button>
          <button :disabled="submitting" class="px-5 py-2.5 rounded-lg text-sm font-semibold text-white bg-orange-primary hover:bg-orange-light transition-colors cursor-pointer disabled:opacity-60" @click="submitTicket">
            {{ submitting ? 'Envoi…' : 'Envoyer' }}
          </button>
        </div>
      </template>
    </UiBaseModal>
  </div>
</template>
