<script setup lang="ts">
definePageMeta({ layout: 'admin', middleware: ['auth', 'admin'] })

const api = useAdminApi()
const { error: notifyError } = useNotification()

const loading = ref(true)
const formatPrice = (v: number) => new Intl.NumberFormat('fr-FR').format(v) + ' F CFA'

const stats = ref<any[]>([])
const revenueByMethod = ref<any[]>([])
const revenueByCountry = ref<any[]>([])
const topOrganizers = ref<any[]>([])

const loadDashboard = async () => {
  loading.value = true
  try {
    const [overview, byMethod, byCountry, payouts] = await Promise.all([
      api.getOverview(),
      api.getRevenueByMethod(),
      api.getRevenueByCountry(),
      api.getPendingPayouts(),
    ])

    const overviewData = overview?.data || overview
    if (overviewData?.stats) {
      stats.value = overviewData.stats
    } else if (Array.isArray(overviewData)) {
      stats.value = overviewData
    } else {
      stats.value = [
        { value: formatPrice(overviewData?.total_revenue_platform ?? 0), label: 'Revenus BilletEvent', color: 'orange', icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>' },
        { value: formatPrice(overviewData?.total_revenue_gateway ?? 0), label: 'Revenus Agr\u00e9gateurs', color: 'blue', icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>' },
        { value: (overviewData?.total_transactions ?? 0).toLocaleString('fr-FR'), label: 'Transactions totales', color: 'orange', icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>' },
        { value: formatPrice(overviewData?.total_amount_processed ?? 0), label: 'Volume trait\u00e9 (FCFA)', color: 'orange', icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2z"/><line x1="9" y1="9" x2="9" y2="15"/></svg>' },
        { value: (overviewData?.conversion_rate ?? 0) + '%', label: 'Taux de conversion', color: 'green', icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>' },
        { value: (overviewData?.active_organizers ?? 0).toLocaleString('fr-FR'), label: 'Organisateurs actifs', color: 'blue', icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>' },
      ]
    }

    // Revenue by method : mapper les cles backend vers le format attendu par le template
    const methodData = byMethod?.data || byMethod
    const methodArray = Array.isArray(methodData) ? methodData : (methodData?.items || [])
    revenueByMethod.value = methodArray.map((row: any) => ({
      operator: row.operator_key ?? row.operator ?? 'Inconnu',
      transactions: row.transactions_count ?? row.transactions ?? 0,
      total: row.total_amount ?? row.total ?? 0,
      platformFees: row.platform_fees ?? row.platformFees ?? 0,
      gatewayFees: row.gateway_fees ?? row.gatewayFees ?? 0,
    }))

    // Revenue by country : mapper les cles backend
    const countryData = byCountry?.data || byCountry
    const countryArray = Array.isArray(countryData) ? countryData : (countryData?.items || [])
    revenueByCountry.value = countryArray.map((row: any) => ({
      country: row.country_code ?? row.country ?? 'N/A',
      flag: row.flag ?? '',
      transactions: row.transactions_count ?? row.transactions ?? 0,
      total: row.total_amount ?? row.total ?? 0,
      fees: row.platform_fees ?? row.fees ?? 0,
    }))

    // Pending payouts : extraire top_organizers et mapper la structure
    const payoutsData = payouts?.data || payouts
    const payoutsArray = payoutsData?.top_organizers || (Array.isArray(payoutsData) ? payoutsData : [])
    topOrganizers.value = payoutsArray.map((item: any) => ({
      name: item.organizer?.name ?? item.name ?? 'N/A',
      email: item.organizer?.email ?? item.email ?? '',
      events: item.events ?? '-',
      balance: item.available_balance ?? item.balance ?? 0,
    }))
  } catch (err: any) {
    notifyError(err?.message || err?.data?.message || 'Erreur lors du chargement du dashboard')
  } finally {
    loading.value = false
  }
}

onMounted(loadDashboard)
</script>

<template>
  <div>
    <div class="mb-6">
      <h2 class="font-serif text-2xl text-text-primary mb-1">Dashboard Administration</h2>
      <p class="text-sm text-text-secondary">Vue d'ensemble de la plateforme BilletEvent</p>
    </div>

    <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 mb-6">
      <DashboardStatCard
        v-for="stat in stats"
        :key="stat.label"
        :value="stat.value"
        :label="stat.label"
        :color="stat.color"
        :trend="stat.trend"
      >
        <template #icon><span v-html="stat.icon" /></template>
      </DashboardStatCard>
    </div>

    <div class="bg-surface border border-border-light rounded-xl overflow-hidden mb-6">
      <div class="flex items-center justify-between px-5 py-4 border-b border-border-light">
        <div class="text-sm font-semibold text-text-primary">Revenus par méthode</div>
      </div>
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead>
            <tr class="border-b border-border-light">
              <th class="text-left text-xs font-semibold text-text-tertiary uppercase tracking-wide px-4 py-3">Opérateur</th>
              <th class="text-right text-xs font-semibold text-text-tertiary uppercase tracking-wide px-4 py-3">Transactions</th>
              <th class="text-right text-xs font-semibold text-text-tertiary uppercase tracking-wide px-4 py-3">Montant total</th>
              <th class="text-right text-xs font-semibold text-text-tertiary uppercase tracking-wide px-4 py-3">Frais plateforme</th>
              <th class="text-right text-xs font-semibold text-text-tertiary uppercase tracking-wide px-4 py-3">Frais gateway</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in revenueByMethod" :key="row.operator" class="border-b border-border-light last:border-b-0">
              <td class="px-4 py-3 text-sm font-medium text-text-primary">{{ row.operator }}</td>
              <td class="px-4 py-3 text-sm text-text-secondary text-right">{{ (row.transactions ?? 0).toLocaleString('fr-FR') }}</td>
              <td class="px-4 py-3 text-sm text-text-primary text-right font-medium">{{ formatPrice(row.total ?? 0) }}</td>
              <td class="px-4 py-3 text-sm text-orange-primary text-right font-medium">{{ formatPrice(row.platformFees ?? 0) }}</td>
              <td class="px-4 py-3 text-sm text-text-secondary text-right">{{ formatPrice(row.gatewayFees ?? 0) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
      <div class="bg-surface border border-border-light rounded-xl overflow-hidden">
        <div class="flex items-center justify-between px-5 py-4 border-b border-border-light">
          <div class="text-sm font-semibold text-text-primary">Revenus par pays</div>
        </div>
        <div class="overflow-x-auto">
          <table class="w-full">
            <thead>
              <tr class="border-b border-border-light">
                <th class="text-left text-xs font-semibold text-text-tertiary uppercase tracking-wide px-4 py-3">Pays</th>
                <th class="text-right text-xs font-semibold text-text-tertiary uppercase tracking-wide px-4 py-3">Transactions</th>
                <th class="text-right text-xs font-semibold text-text-tertiary uppercase tracking-wide px-4 py-3">Montant</th>
                <th class="text-right text-xs font-semibold text-text-tertiary uppercase tracking-wide px-4 py-3">Frais</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in revenueByCountry" :key="row.country" class="border-b border-border-light last:border-b-0">
                <td class="px-4 py-3 text-sm font-medium text-text-primary">{{ row.flag }} {{ row.country }}</td>
                <td class="px-4 py-3 text-sm text-text-secondary text-right">{{ (row.transactions ?? 0).toLocaleString('fr-FR') }}</td>
                <td class="px-4 py-3 text-sm text-text-primary text-right font-medium">{{ formatPrice(row.total ?? 0) }}</td>
                <td class="px-4 py-3 text-sm text-orange-primary text-right font-medium">{{ formatPrice(row.fees ?? 0) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div class="bg-surface border border-border-light rounded-xl overflow-hidden">
        <div class="flex items-center justify-between px-5 py-4 border-b border-border-light">
          <div class="text-sm font-semibold text-text-primary">Top organisateurs (soldes dus)</div>
        </div>
        <div class="overflow-x-auto">
          <table class="w-full">
            <thead>
              <tr class="border-b border-border-light">
                <th class="text-left text-xs font-semibold text-text-tertiary uppercase tracking-wide px-4 py-3">Organisateur</th>
                <th class="text-right text-xs font-semibold text-text-tertiary uppercase tracking-wide px-4 py-3">Événements</th>
                <th class="text-right text-xs font-semibold text-text-tertiary uppercase tracking-wide px-4 py-3">Solde dû</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(org, idx) in topOrganizers" :key="org.email || idx" class="border-b border-border-light last:border-b-0">
                <td class="px-4 py-3">
                  <div class="text-sm font-medium text-text-primary">{{ org.name || 'N/A' }}</div>
                  <div class="text-xs text-text-tertiary">{{ org.email || '' }}</div>
                </td>
                <td class="px-4 py-3 text-sm text-text-secondary text-right">{{ org.events ?? '-' }}</td>
                <td class="px-4 py-3 text-sm text-orange-primary text-right font-semibold">{{ formatPrice(org.balance ?? 0) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>
