<script setup>
const props = defineProps({
  eventName: { type: String, default: 'Vibe Venture 2025' },
  tickets: {
    type: Array,
    default: () => [
      { id: 1, name: 'Pass Standard', desc: 'Accès journée · Boisson de bienvenue', price: '10 000', per: 'FCFA / pers.', icon: 'std', badge: null, urgent: null },
      { id: 2, name: 'Pass VIP', desc: 'Lounge · Rencontre artistes · Kit cadeau', price: '25 000', per: 'FCFA / pers.', icon: 'vip', badge: '⭐ Le plus choisi', urgent: '⏰ 28 places restantes' },
      { id: 3, name: 'Pass Groupe', desc: '5 personnes · Tarif réduit', price: '35 000', per: 'FCFA / 5 pers.', icon: 'grp', badge: 'Économisez 20%', badgeColor: 'green', urgent: null }
    ]
  }
})

const selectedTicket = ref(0)

function selectTicket(index) {
  selectedTicket.value = index
}
</script>

<template>
  <div class="bg-surface border border-border-light rounded-[20px] overflow-hidden">
    <div class="px-6 pt-5 pb-4">
      <div class="text-[0.68rem] font-bold tracking-[0.12em] uppercase text-text-tertiary mb-1">Réserver ma place</div>
      <div class="font-serif text-[1.1rem] text-text-primary">{{ eventName }}</div>
    </div>
    <div class="h-px bg-border-light"></div>

    <div
      v-for="(ticket, index) in tickets"
      :key="ticket.id"
      class="px-6 py-4 border-b border-border-light cursor-pointer transition-colors relative"
      :class="{
        'bg-[rgba(240,90,40,0.04)]': selectedTicket === index,
        'hover:bg-bg-primary': selectedTicket !== index
      }"
      @click="selectTicket(index)"
    >
      <div
        v-if="selectedTicket === index"
        class="absolute left-0 top-0 bottom-0 w-[3px] bg-orange-primary rounded-r-sm"
      ></div>
      <div class="flex items-start gap-3">
        <div
          class="w-9 h-9 rounded-lg flex items-center justify-center text-base shrink-0"
          :class="{
            'bg-[#EDE7F6]': ticket.icon === 'std',
            'bg-[#FFF3E0]': ticket.icon === 'vip',
            'bg-[#E8F5E9]': ticket.icon === 'grp'
          }"
        >
          <svg v-if="ticket.icon === 'std'" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2z"/><line x1="9" y1="9" x2="9" y2="15"/></svg>
          <svg v-else-if="ticket.icon === 'vip'" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
          <svg v-else-if="ticket.icon === 'grp'" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
        </div>
        <div class="flex-1 min-w-0">
          <div class="text-sm font-semibold text-text-primary mb-0.5">{{ ticket.name }}</div>
          <div class="text-xs text-text-tertiary leading-relaxed">{{ ticket.desc }}</div>
          <span
            v-if="ticket.badge"
            class="text-[0.62rem] font-bold tracking-[0.07em] uppercase text-white px-[7px] py-[2px] rounded mt-[5px] inline-block"
            :class="ticket.badgeColor === 'green' ? 'bg-green-dark' : 'bg-orange-primary'"
          >{{ ticket.badge }}</span>
        </div>
        <div class="text-right shrink-0">
          <div class="font-serif text-[1.2rem] text-text-primary">{{ ticket.price }}</div>
          <div class="text-[0.67rem] text-text-tertiary mt-[1px]">{{ ticket.per }}</div>
          <div v-if="ticket.urgent" class="text-[0.67rem] text-[#D32F2F] font-semibold mt-[3px]">{{ ticket.urgent }}</div>
        </div>
      </div>
    </div>

    <div class="px-6 pt-4 pb-5">
      <button class="flex items-center justify-center gap-2 w-full bg-orange-primary text-white py-3.5 rounded-xl text-base font-bold border-none cursor-pointer transition-all hover:bg-orange-light font-sans">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2z"/></svg>
        Choisir mon billet
      </button>
      <div class="flex justify-center gap-3.5 flex-wrap mt-3">
        <span class="flex items-center gap-[5px] text-[0.7rem] text-text-tertiary">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
          Paiement sécurisé
        </span>
        <span class="flex items-center gap-[5px] text-[0.7rem] text-text-tertiary">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
          Reçu instantané
        </span>
        <span class="flex items-center gap-[5px] text-[0.7rem] text-text-tertiary">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
          Remboursable
        </span>
      </div>
    </div>
  </div>
</template>
