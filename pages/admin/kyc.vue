<script setup lang="ts">
definePageMeta({ layout: 'admin', middleware: ['auth', 'admin'] })

const api = useAdminApi()
const { success, error: notifyError } = useNotification()

const loading = ref(true)
const activeTab = ref('pending')
const expandedId = ref<number | null>(null)
const showRejectModal = ref(false)
const rejectingId = ref<number | null>(null)
const rejectReason = ref('')
const processingId = ref<number | null>(null)

const kycList = ref<any[]>([])

const pendingList = computed(() => kycList.value.filter((k: any) => k.status === 'pending' || k.status === 'submitted'))
const displayList = computed(() => activeTab.value === 'pending' ? pendingList.value : kycList.value)

const toggleExpand = async (id: number) => {
  if (expandedId.value === id) {
    expandedId.value = null
    return
  }
  try {
    const response = await api.getKycDetail(id)
    const detail = response?.data || response
    const idx = kycList.value.findIndex((k: any) => k.id === id)
    if (idx !== -1 && detail) {
      kycList.value[idx] = {
        ...kycList.value[idx],
        ...detail,
        firstName: detail.identity_first_name || detail.firstName || kycList.value[idx].firstName || '',
        lastName: detail.identity_last_name || detail.lastName || kycList.value[idx].lastName || '',
        dob: detail.identity_birth_date || detail.dob || kycList.value[idx].dob || '',
        docNumber: detail.document_number || detail.docNumber || kycList.value[idx].docNumber || '',
        documentRectoUrl: detail.document_recto_url || null,
        documentVersoUrl: detail.document_verso_url || null,
        selfieUrl: detail.selfie_url || null,
        businessDocumentUrl: detail.business_document_url || null,
      }
    }
  } catch (err) {
    console.error('Erreur chargement détail KYC:', err)
  }
  expandedId.value = id
}

const approveKyc = async (id: number) => {
  processingId.value = id
  try {
    await api.reviewKyc(id, { decision: 'approved' })
    const idx = kycList.value.findIndex((k: any) => k.id === id)
    if (idx !== -1) {
      kycList.value[idx].status = 'validated'
      expandedId.value = null
      success('KYC approuvé pour ' + kycList.value[idx].name)
    }
  } catch (err: any) {
    notifyError(err?.message || err?.data?.message || 'Erreur lors de l\'approbation')
  } finally {
    processingId.value = null
  }
}

const openReject = (id: number) => {
  rejectingId.value = id
  rejectReason.value = ''
  showRejectModal.value = true
}

const confirmReject = async () => {
  if (!rejectReason.value.trim() || !rejectingId.value) return
  processingId.value = rejectingId.value
  try {
    await api.reviewKyc(rejectingId.value, { decision: 'rejected', rejection_reason: rejectReason.value })
    const idx = kycList.value.findIndex((k: any) => k.id === rejectingId.value)
    if (idx !== -1) {
      kycList.value[idx].status = 'rejected'
      kycList.value[idx].rejectReason = rejectReason.value
      expandedId.value = null
      success('KYC rejeté pour ' + kycList.value[idx].name)
    }
    showRejectModal.value = false
    rejectingId.value = null
    rejectReason.value = ''
  } catch (err: any) {
    notifyError(err?.message || err?.data?.message || 'Erreur lors du rejet')
  } finally {
    processingId.value = null
  }
}

const statusLabel = (s: string) => {
  if (s === 'pending' || s === 'submitted') return 'En attente'
  if (s === 'approved' || s === 'validated') return 'Approuvé'
  if (s === 'rejected') return 'Rejeté'
  return s
}

const statusClass = (s: string) => {
  if (s === 'pending' || s === 'submitted') return 'bg-gold/10 text-gold'
  if (s === 'approved' || s === 'validated') return 'bg-green-dark/10 text-green-dark'
  if (s === 'rejected') return 'bg-red-error/10 text-red-error'
  return ''
}

const formatDate = (dateStr: string) => {
  if (!dateStr) return '\u2014'
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return dateStr
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
}

const loadKyc = async () => {
  loading.value = true
  try {
    const response = await api.getPendingKyc()
    const data = response?.data || response
    const items = Array.isArray(data) ? data : (data?.items || data?.kyc || [])
    kycList.value = items.map((k: any) => ({
      ...k,
      name: k.user?.name || k.name || ((k.firstName || k.first_name || '') + ' ' + (k.lastName || k.last_name || '')).trim(),
      email: k.user?.email || k.email || '',
      submittedAt: k.submitted_at || k.submittedAt || k.created_at || '',
      docType: k.document_type || k.docType || k.doc_type || '',
      status: k.status || 'pending',
      firstName: k.identity_first_name || k.firstName || k.first_name || k.user?.first_name || '',
      lastName: k.identity_last_name || k.lastName || k.last_name || k.user?.last_name || '',
      dob: k.identity_birth_date || k.dob || k.date_of_birth || '',
      docNumber: k.docNumber || k.doc_number || k.document_number || '',
      businessName: k.businessName || k.business_name || '',
      businessRegNumber: k.businessRegNumber || k.business_reg_number || '',
      rejectReason: k.rejection_reason || k.rejectReason || k.reject_reason || '',
      documentRectoUrl: null,
      documentVersoUrl: null,
      selfieUrl: null,
      businessDocumentUrl: null,
    }))
  } catch (err: any) {
    notifyError(err?.message || err?.data?.message || 'Erreur lors du chargement des KYC')
  } finally {
    loading.value = false
  }
}

onMounted(loadKyc)
</script>

<template>
  <div>
    <div class="mb-6">
      <p class="text-sm text-text-secondary">Gérez les demandes de vérification d'identité des organisateurs</p>
    </div>

    <div class="flex gap-2 mb-5">
      <button
        class="px-4 py-1.5 rounded-full text-sm font-semibold cursor-pointer border-none transition-colors"
        :class="activeTab === 'pending' ? 'bg-orange-primary text-white' : 'bg-surface-2 text-text-secondary'"
        @click="activeTab = 'pending'"
      >En attente ({{ pendingList.length }})</button>
      <button
        class="px-4 py-1.5 rounded-full text-sm font-semibold cursor-pointer border-none transition-colors"
        :class="activeTab === 'all' ? 'bg-orange-primary text-white' : 'bg-surface-2 text-text-secondary'"
        @click="activeTab = 'all'"
      >Tous ({{ kycList.length }})</button>
    </div>

    <div class="bg-surface border border-border-light rounded-xl overflow-hidden">
      <table class="w-full hidden md:table">
        <thead>
          <tr class="border-b border-border-light">
            <th class="text-left text-xs font-semibold text-text-tertiary uppercase tracking-wide px-4 py-3">Organisateur</th>
            <th class="text-left text-xs font-semibold text-text-tertiary uppercase tracking-wide px-4 py-3">Date</th>
            <th class="text-left text-xs font-semibold text-text-tertiary uppercase tracking-wide px-4 py-3">Document</th>
            <th class="text-left text-xs font-semibold text-text-tertiary uppercase tracking-wide px-4 py-3">Statut</th>
            <th class="text-right text-xs font-semibold text-text-tertiary uppercase tracking-wide px-4 py-3">Actions</th>
          </tr>
        </thead>
        <tbody>
          <template v-for="kyc in displayList" :key="kyc.id">
            <tr class="border-b border-border-light">
              <td class="px-4 py-3">
                <div class="text-sm font-medium text-text-primary">{{ kyc.name }}</div>
                <div class="text-xs text-text-tertiary">{{ kyc.email }}</div>
              </td>
              <td class="px-4 py-3 text-sm text-text-secondary">{{ formatDate(kyc.submittedAt) }}</td>
              <td class="px-4 py-3 text-sm text-text-secondary">{{ kyc.docType }}</td>
              <td class="px-4 py-3">
                <span class="inline-flex px-2 py-0.5 rounded-full text-xs font-semibold" :class="statusClass(kyc.status)">{{ statusLabel(kyc.status) }}</span>
              </td>
              <td class="px-4 py-3 text-right">
                <button
                  class="text-sm font-medium text-orange-primary hover:underline cursor-pointer"
                  @click="toggleExpand(kyc.id)"
                >{{ expandedId === kyc.id ? 'Masquer' : 'Voir' }}</button>
              </td>
            </tr>
            <tr v-if="expandedId === kyc.id">
              <td colspan="5" class="bg-bg-primary px-6 py-5 border-b border-border-light">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <div class="text-xs font-semibold text-text-tertiary uppercase tracking-wide mb-3">Informations d'identité</div>
                    <div class="flex flex-col gap-2">
                      <div class="flex justify-between text-sm"><span class="text-text-secondary">Prénom</span><span class="text-text-primary font-medium">{{ kyc.firstName || '\u2014' }}</span></div>
                      <div class="flex justify-between text-sm"><span class="text-text-secondary">Nom</span><span class="text-text-primary font-medium">{{ kyc.lastName || '\u2014' }}</span></div>
                      <div class="flex justify-between text-sm"><span class="text-text-secondary">Date de naissance</span><span class="text-text-primary font-medium">{{ kyc.dob ? formatDate(kyc.dob) : '\u2014' }}</span></div>
                      <div class="flex justify-between text-sm"><span class="text-text-secondary">N° document</span><span class="text-text-primary font-medium">{{ kyc.docNumber || '\u2014' }}</span></div>
                    </div>
                  </div>
                  <div>
                    <div class="text-xs font-semibold text-text-tertiary uppercase tracking-wide mb-3">Document</div>
                    <div class="flex gap-3 mb-4 flex-wrap">
                      <div class="w-32 h-20 bg-surface-2 border border-border-light rounded-lg flex items-center justify-center text-xs text-text-tertiary overflow-hidden">
                        <img v-if="kyc.documentRectoUrl" :src="kyc.documentRectoUrl" alt="Recto" class="w-full h-full object-cover" />
                        <span v-else>Recto</span>
                      </div>
                      <div class="w-32 h-20 bg-surface-2 border border-border-light rounded-lg flex items-center justify-center text-xs text-text-tertiary overflow-hidden">
                        <img v-if="kyc.documentVersoUrl" :src="kyc.documentVersoUrl" alt="Verso" class="w-full h-full object-cover" />
                        <span v-else>Verso</span>
                      </div>
                      <div class="w-32 h-20 bg-surface-2 border border-border-light rounded-lg flex items-center justify-center text-xs text-text-tertiary overflow-hidden">
                        <img v-if="kyc.selfieUrl" :src="kyc.selfieUrl" alt="Selfie" class="w-full h-full object-cover" />
                        <span v-else>Selfie</span>
                      </div>
                    </div>
                    <template v-if="kyc.businessName">
                      <div class="text-xs font-semibold text-text-tertiary uppercase tracking-wide mb-3 mt-4">Documents business</div>
                      <div class="flex flex-col gap-2">
                        <div class="flex justify-between text-sm"><span class="text-text-secondary">Entreprise</span><span class="text-text-primary font-medium">{{ kyc.businessName }}</span></div>
                        <div v-if="kyc.businessRegNumber" class="flex justify-between text-sm"><span class="text-text-secondary">N° registre</span><span class="text-text-primary font-medium">{{ kyc.businessRegNumber }}</span></div>
                      </div>
                    </template>
                  </div>
                </div>
                <div v-if="kyc.status === 'pending' || kyc.status === 'submitted'" class="flex items-center gap-3 mt-6 pt-4 border-t border-border-light">
                  <button
                    class="px-5 py-2 rounded-lg text-sm font-semibold bg-green-dark text-white border-none cursor-pointer transition-opacity hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                    :disabled="processingId === kyc.id"
                    @click="approveKyc(kyc.id)"
                  >{{ processingId === kyc.id ? 'Traitement...' : 'Approuver' }}</button>
                  <button
                    class="px-5 py-2 rounded-lg text-sm font-semibold bg-red-error text-white border-none cursor-pointer transition-opacity hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                    :disabled="processingId === kyc.id"
                    @click="openReject(kyc.id)"
                  >Rejeter</button>
                </div>
                <div v-if="kyc.status === 'rejected' && kyc.rejectReason" class="mt-4 p-3 bg-red-error/5 border border-red-error/20 rounded-lg">
                  <div class="text-xs font-semibold text-red-error mb-1">Raison du rejet</div>
                  <div class="text-sm text-text-secondary">{{ kyc.rejectReason }}</div>
                </div>
              </td>
            </tr>
          </template>
        </tbody>
      </table>

      <div class="flex flex-col md:hidden">
        <div v-for="kyc in displayList" :key="kyc.id" class="border-b border-border-light last:border-b-0 p-4">
          <div class="flex items-center justify-between mb-2">
            <div>
              <div class="text-sm font-medium text-text-primary">{{ kyc.name }}</div>
              <div class="text-xs text-text-tertiary">{{ kyc.email }}</div>
            </div>
            <span class="inline-flex px-2 py-0.5 rounded-full text-xs font-semibold" :class="statusClass(kyc.status)">{{ statusLabel(kyc.status) }}</span>
          </div>
          <div class="flex items-center justify-between text-xs text-text-secondary mb-2">
            <span>{{ kyc.docType }}</span>
            <span>{{ formatDate(kyc.submittedAt) }}</span>
          </div>
          <button
            class="text-sm font-medium text-orange-primary hover:underline cursor-pointer"
            @click="toggleExpand(kyc.id)"
          >{{ expandedId === kyc.id ? 'Masquer' : 'Voir détails' }}</button>
          <div v-if="expandedId === kyc.id" class="mt-3 pt-3 border-t border-border-light">
            <div class="flex flex-col gap-2 mb-3">
              <div class="flex justify-between text-sm"><span class="text-text-secondary">Prénom</span><span class="text-text-primary font-medium">{{ kyc.firstName || '\u2014' }}</span></div>
              <div class="flex justify-between text-sm"><span class="text-text-secondary">Nom</span><span class="text-text-primary font-medium">{{ kyc.lastName || '\u2014' }}</span></div>
              <div class="flex justify-between text-sm"><span class="text-text-secondary">Date de naissance</span><span class="text-text-primary font-medium">{{ kyc.dob ? formatDate(kyc.dob) : '\u2014' }}</span></div>
            </div>
            <div v-if="kyc.status === 'pending' || kyc.status === 'submitted'" class="flex items-center gap-3">
              <button class="px-4 py-2 rounded-lg text-sm font-semibold bg-green-dark text-white border-none cursor-pointer disabled:opacity-50" :disabled="processingId === kyc.id" @click="approveKyc(kyc.id)">{{ processingId === kyc.id ? 'Traitement...' : 'Approuver' }}</button>
              <button class="px-4 py-2 rounded-lg text-sm font-semibold bg-red-error text-white border-none cursor-pointer disabled:opacity-50" :disabled="processingId === kyc.id" @click="openReject(kyc.id)">Rejeter</button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <UiBaseModal :is-open="showRejectModal" title="Rejeter le KYC" size="md" @close="showRejectModal = false">
      <div class="flex flex-col gap-4">
        <p class="text-sm text-text-secondary">Indiquez la raison du rejet. L'organisateur sera notifié.</p>
        <div>
          <label class="block text-sm font-medium text-text-secondary mb-1.5">Raison du rejet</label>
          <textarea
            v-model="rejectReason"
            rows="4"
            placeholder="Ex: Document illisible, informations incorrectes..."
            class="w-full px-4 py-2.5 rounded-lg border border-border-light bg-bg-primary text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-orange-primary/30 focus:border-orange-primary transition resize-none"
          />
        </div>
        <button
          class="bg-red-error text-white w-full py-2.5 rounded-lg font-semibold border-none cursor-pointer transition-opacity hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
          :disabled="!rejectReason.trim()"
          @click="confirmReject"
        >Confirmer le rejet</button>
      </div>
    </UiBaseModal>
  </div>
</template>
