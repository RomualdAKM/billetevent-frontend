<script setup>
definePageMeta({ layout: 'default' })

const tickets = [
  {
    type: 'presentiel-payant',
    typeLabel: 'Présentiel · Payant',
    headerClass: 'bg-blue-main',
    eventName: 'Vibe Venture 2025',
    date: '19 Juillet 2025 · 20h00',
    location: 'Résidence Mamoune, Dakar',
    badgeText: 'Billet valide · Entrée physique',
    badgeClass: 'bg-white/[0.18]',
    holderName: 'Fatou Sarr',
    passType: 'Pass VIP — Lounge + Artistes',
    details: ['Adulte · 1 place', 'fatou.sarr@gmail.com'],
    order: 'Commande · #VV-00891',
    hasQr: true,
    qrColor: '#1B2B5E',
    qrLabel: 'Scanner à l\'entrée',
    qrLabelColor: '',
    amount: '25 000 FCFA',
    amountFree: false,
    amountSub: 'Payé le 05 Juin 2025',
    paymentIcon: 'W',
    paymentIconBg: '#F97316',
    paymentText: 'Via Wave',
    hasLink: false,
    locationIcon: true
  },
  {
    type: 'presentiel-gratuit',
    typeLabel: 'Présentiel · Gratuit sur inscription',
    headerClass: 'bg-green-dark',
    eventName: 'Forum Jeunesse Dakar',
    date: '02 Août 2025 · 09h00',
    location: 'Place de l\'Indépendance, Dakar',
    badgeText: 'Inscription confirmée · QR requis',
    badgeClass: 'bg-white/20',
    holderName: 'Moussa Diallo',
    passType: 'Pass Participant — Accès complet',
    details: ['Adulte · 1 place', 'moussa.diallo@outlook.com'],
    order: 'Inscription · #FJD-00124',
    hasQr: true,
    qrColor: '#1A6B45',
    qrLabel: 'Scanner à l\'entrée',
    qrLabelColor: 'text-green-dark',
    amount: 'Gratuit',
    amountFree: true,
    amountSub: 'Inscrit le 10 Juillet 2025',
    paymentIcon: '',
    paymentIconBg: '',
    paymentText: 'Inscription validée',
    hasLink: false,
    locationIcon: true
  },
  {
    type: 'en-ligne-payant',
    typeLabel: 'En ligne · Payant',
    headerClass: 'bg-gradient-to-br from-orange-primary to-orange-light',
    eventName: 'Masterclass Design UI/UX',
    date: '25 Juillet 2025 · 15h00',
    location: 'Zoom · En ligne',
    badgeText: 'Accès en ligne · Lien + code',
    badgeClass: 'bg-white/[0.18]',
    holderName: 'Aïssatou Ndiaye',
    passType: 'Pass Standard — Accès live + replay 30 jours',
    details: ['aissatou@gmail.com'],
    order: 'Commande · #MC-00345',
    hasQr: false,
    qrColor: '',
    qrLabel: '',
    qrLabelColor: '',
    amount: '12 000 FCFA',
    amountFree: false,
    amountSub: 'Payé le 18 Juillet 2025',
    paymentIcon: 'OM',
    paymentIconBg: '#00A651',
    paymentText: 'Via Orange Money',
    hasLink: true,
    linkUrl: 'zoom.us/j/8849203710?pwd=••••••',
    accessCode: 'VIB-7742',
    linkColor: '',
    locationIcon: false
  },
  {
    type: 'en-ligne-gratuit',
    typeLabel: 'En ligne · Gratuit',
    headerClass: 'bg-gradient-to-br from-[#4F46E5] to-purple',
    eventName: 'Webinaire FinTech Afrique',
    date: '10 Août 2025 · 18h30',
    location: 'YouTube Live',
    badgeText: 'Inscription confirmée · Lien inclus',
    badgeClass: 'bg-white/[0.18]',
    holderName: 'Ibrahima Koné',
    passType: 'Webinaire gratuit — Accès libre',
    details: ['ibrahima.kone@protonmail.com', '1 247 inscrits'],
    order: 'Inscription · #WB-00062',
    hasQr: false,
    qrColor: '',
    qrLabel: '',
    qrLabelColor: '',
    amount: 'Gratuit',
    amountFree: true,
    amountSub: 'Inscrit le 28 Juillet 2025',
    paymentIcon: '',
    paymentIconBg: '',
    paymentText: 'Confirmé par email',
    hasLink: true,
    linkUrl: 'youtube.com/live/fintech-afrique-2025',
    accessCode: '',
    linkColor: 'purple',
    linkNote: 'Le lien sera actif 30 min avant le début',
    locationIcon: false
  }
]

const legendItems = [
  { color: 'bg-blue-main', label: 'Présentiel payant', desc: 'QR code unique généré au paiement. Scanné à l\'entrée. Montant + moyen de paiement affichés.' },
  { color: 'bg-green-dark', label: 'Présentiel gratuit', desc: 'Même structure que le payant. QR obligatoire pour contrôle capacité. Montant = 0 FCFA.' },
  { color: 'bg-orange-primary', label: 'En ligne payant', desc: 'Pas de QR. Lien de l\'événement + code d\'accès inclus. Confirmation par email automatique.' },
  { color: 'bg-purple', label: 'En ligne gratuit', desc: 'Lien direct visible. Pas de code d\'accès si non requis. Confirmation légère, pas de PDF.' }
]
</script>

<template>
  <div class="py-12 px-8 min-h-screen max-md:px-5 max-sm:px-4 max-sm:py-8">
    <div class="text-center mb-[52px]">
      <div class="text-[0.72rem] font-bold tracking-[0.15em] uppercase text-orange-primary mb-2.5">BilletEvent — Templates</div>
      <h1 class="font-serif text-3xl text-text-primary mb-2.5 max-sm:text-2xl">Formats de billets</h1>
      <p class="text-sm text-text-tertiary max-w-[520px] mx-auto leading-relaxed">Aperçu des 4 types de billets générés automatiquement selon le type d'événement et le mode d'accès choisi par l'organisateur.</p>
    </div>

    <div class="grid grid-cols-2 gap-9 max-w-[1080px] mx-auto max-md:grid-cols-1 max-md:max-w-[520px]">
      <div v-for="(ticket, i) in tickets" :key="i" class="flex flex-col gap-3.5">
        <div class="text-[0.68rem] font-bold tracking-[0.12em] uppercase text-text-tertiary pl-1">{{ ticket.typeLabel }}</div>

        <div class="w-full rounded-xl bg-surface overflow-hidden">
          <div class="rounded-t-xl overflow-hidden">
            <div class="px-6 pt-[22px] pb-[18px] relative" :class="ticket.headerClass">
              <div class="absolute inset-0 pointer-events-none"></div>
              <div class="relative z-[1]">
                <div class="font-serif text-[1.25rem] text-white leading-tight mb-2 tracking-tight">{{ ticket.eventName }}</div>
                <div class="flex flex-wrap gap-x-[14px] gap-y-1 text-xs text-white/75 mb-2.5">
                  <span class="flex items-center gap-[5px]">
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                    {{ ticket.date }}
                  </span>
                  <span class="flex items-center gap-[5px]">
                    <svg v-if="ticket.locationIcon" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                    <svg v-else-if="ticket.linkColor === 'purple'" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/></svg>
                    <svg v-else width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
                    {{ ticket.location }}
                  </span>
                </div>
                <div class="inline-flex items-center gap-[5px] text-[0.62rem] font-bold tracking-[0.08em] uppercase text-white/90 rounded-full px-2.5 py-[4px]" :class="ticket.badgeClass">
                  <svg v-if="ticket.type === 'presentiel-payant'" width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2z"/></svg>
                  <svg v-else-if="ticket.type === 'presentiel-gratuit'" width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                  <svg v-else-if="ticket.type === 'en-ligne-payant'" width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
                  <svg v-else width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                  {{ ticket.badgeText }}
                </div>
              </div>
            </div>

            <div class="px-6 py-5 flex gap-5" :class="{ 'flex-col': !ticket.hasQr }">
              <div class="flex-1 min-w-0">
                <div class="font-serif text-[1.05rem] text-text-primary mb-0.5">{{ ticket.holderName }}</div>
                <div class="text-[0.78rem] text-ink2 font-medium mb-3">{{ ticket.passType }}</div>
                <div class="flex flex-col gap-[7px] mb-3">
                  <div v-for="(detail, di) in ticket.details" :key="di" class="flex items-center gap-2 text-[0.75rem] text-text-tertiary">
                    <svg v-if="di === 0 && ticket.hasQr" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                    <svg v-else-if="detail.includes('@')" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                    <svg v-else width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                    {{ detail }}
                  </div>
                </div>
                <div v-if="ticket.hasLink" class="flex items-center gap-2.5 px-3 py-2.5 rounded-lg border mb-2" :class="ticket.linkColor === 'purple' ? 'bg-[rgba(124,58,237,0.06)] border-[rgba(124,58,237,0.2)]' : 'bg-bg-primary border-border-light'">
                  <div class="shrink-0" :class="ticket.linkColor === 'purple' ? 'text-purple' : 'text-text-tertiary'">
                    <svg v-if="ticket.linkColor === 'purple'" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/></svg>
                    <svg v-else width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
                  </div>
                  <div class="text-[0.78rem] font-medium truncate" :class="ticket.linkColor === 'purple' ? 'text-purple' : 'text-ink2'">{{ ticket.linkUrl }}</div>
                </div>
                <div v-if="ticket.accessCode" class="flex items-center gap-2 mb-2">
                  <span class="text-[0.72rem] text-text-tertiary">Code d'accès :</span>
                  <span class="text-[0.82rem] font-bold text-orange-primary tracking-wider font-mono bg-orange-dim px-2.5 py-1 rounded-md">{{ ticket.accessCode }}</span>
                </div>
                <div v-if="ticket.linkColor === 'purple' && ticket.linkNote" class="text-[0.7rem] text-text-tertiary flex items-center gap-1.5 mt-2 mb-3">
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                  {{ ticket.linkNote }}
                </div>
                <div class="text-[0.7rem] text-text-tertiary tracking-wide" :class="{ 'mt-3': ticket.hasLink }">{{ ticket.order }}</div>
              </div>

              <div v-if="ticket.hasQr" class="flex flex-col items-center gap-2 shrink-0">
                <div class="w-[100px] h-[100px] rounded-lg border-[1.5px] p-2 flex items-center justify-center" :style="{ borderColor: ticket.qrColor + '33' }">
                  <svg viewBox="0 0 21 21" xmlns="http://www.w3.org/2000/svg" class="w-full h-full">
                    <rect width="21" height="21" fill="white"/>
                    <rect x="1" y="1" width="7" height="7" fill="none" :stroke="ticket.qrColor" stroke-width="1"/>
                    <rect x="2" y="2" width="5" height="5" fill="none" :stroke="ticket.qrColor" stroke-width=".5"/>
                    <rect x="3" y="3" width="3" height="3" :fill="ticket.qrColor"/>
                    <rect x="13" y="1" width="7" height="7" fill="none" :stroke="ticket.qrColor" stroke-width="1"/>
                    <rect x="14" y="2" width="5" height="5" fill="none" :stroke="ticket.qrColor" stroke-width=".5"/>
                    <rect x="15" y="3" width="3" height="3" :fill="ticket.qrColor"/>
                    <rect x="1" y="13" width="7" height="7" fill="none" :stroke="ticket.qrColor" stroke-width="1"/>
                    <rect x="2" y="14" width="5" height="5" fill="none" :stroke="ticket.qrColor" stroke-width=".5"/>
                    <rect x="3" y="15" width="3" height="3" :fill="ticket.qrColor"/>
                    <rect x="9" y="1" width="1" height="1" :fill="ticket.qrColor"/><rect x="11" y="1" width="1" height="1" :fill="ticket.qrColor"/>
                    <rect x="9" y="3" width="2" height="1" :fill="ticket.qrColor"/><rect x="12" y="3" width="1" height="1" :fill="ticket.qrColor"/>
                    <rect x="9" y="5" width="1" height="2" :fill="ticket.qrColor"/><rect x="11" y="5" width="1" height="1" :fill="ticket.qrColor"/>
                    <rect x="9" y="9" width="1" height="1" :fill="ticket.qrColor"/><rect x="11" y="9" width="2" height="1" :fill="ticket.qrColor"/>
                    <rect x="9" y="11" width="2" height="2" :fill="ticket.qrColor"/><rect x="12" y="11" width="1" height="1" :fill="ticket.qrColor"/>
                    <rect x="1" y="9" width="2" height="1" :fill="ticket.qrColor"/><rect x="4" y="9" width="1" height="2" :fill="ticket.qrColor"/>
                    <rect x="6" y="9" width="2" height="1" :fill="ticket.qrColor"/><rect x="2" y="11" width="1" height="1" :fill="ticket.qrColor"/>
                    <rect x="5" y="11" width="2" height="2" :fill="ticket.qrColor"/>
                    <rect x="9" y="14" width="1" height="2" :fill="ticket.qrColor"/><rect x="11" y="13" width="2" height="1" :fill="ticket.qrColor"/>
                    <rect x="14" y="9" width="1" height="2" :fill="ticket.qrColor"/><rect x="16" y="9" width="2" height="1" :fill="ticket.qrColor"/>
                    <rect x="13" y="11" width="2" height="2" :fill="ticket.qrColor"/><rect x="16" y="11" width="1" height="1" :fill="ticket.qrColor"/>
                    <rect x="13" y="14" width="1" height="1" :fill="ticket.qrColor"/><rect x="15" y="14" width="2" height="2" :fill="ticket.qrColor"/>
                    <rect x="13" y="17" width="2" height="1" :fill="ticket.qrColor"/><rect x="16" y="17" width="2" height="2" :fill="ticket.qrColor"/>
                    <rect x="9" y="17" width="2" height="1" :fill="ticket.qrColor"/><rect x="12" y="17" width="1" height="2" :fill="ticket.qrColor"/>
                  </svg>
                </div>
                <div class="text-[0.62rem] font-bold tracking-[0.1em] uppercase" :class="ticket.qrLabelColor || 'text-text-tertiary'">{{ ticket.qrLabel }}</div>
              </div>
            </div>
          </div>

          <div class="relative h-0">
            <div class="absolute left-0 right-0 top-0 flex items-center px-3">
              <div class="absolute -left-[8px] w-4 h-4 rounded-full bg-bg-tickets"></div>
              <div class="flex-1 border-t-2 border-dashed border-border-light mx-4"></div>
              <div class="absolute -right-[8px] w-4 h-4 rounded-full bg-bg-tickets"></div>
            </div>
          </div>

          <div class="flex items-center justify-between px-6 py-4 bg-bg-primary/50">
            <div>
              <div class="font-serif text-[1.15rem]" :class="ticket.amountFree ? 'text-green-dark' : 'text-text-primary'">{{ ticket.amount }}</div>
              <div class="text-[0.7rem] text-text-tertiary mt-px">{{ ticket.amountSub }}</div>
            </div>
            <div class="flex items-center gap-2 text-[0.78rem] font-medium text-text-tertiary">
              <div v-if="ticket.paymentIcon" class="w-[26px] h-[26px] rounded-[7px] flex items-center justify-center text-white shrink-0" :style="{ background: ticket.paymentIconBg, fontSize: ticket.paymentIcon === 'OM' ? '0.55rem' : '0.72rem', fontWeight: 800 }">{{ ticket.paymentIcon }}</div>
              <svg v-else width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="20 6 9 17 4 12"/></svg>
              {{ ticket.paymentText }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="max-w-[1080px] mx-auto mt-14 bg-surface border border-border-light rounded-xl p-8 max-sm:p-5">
      <div class="font-serif text-[1.1rem] text-text-primary mb-5">Règles de génération</div>
      <div class="grid grid-cols-4 gap-5 max-md:grid-cols-2 max-sm:grid-cols-1">
        <div v-for="(item, i) in legendItems" :key="i">
          <div class="flex items-center gap-2 mb-1.5">
            <span class="w-[10px] h-[10px] rounded-full shrink-0" :class="item.color"></span>
            <span class="text-[0.82rem] font-bold text-text-primary">{{ item.label }}</span>
          </div>
          <div class="text-[0.75rem] text-text-tertiary leading-[1.6]">{{ item.desc }}</div>
        </div>
      </div>
    </div>
  </div>
</template>
