<script setup lang="ts">
definePageMeta({ layout: 'default' })

useSeoMeta({
  title: 'Tarifs | BilletEvent',
  description: 'Découvrez les tarifs transparents de BilletEvent. Commission simple, pas de frais cachés.',
})

const features = [
  { title: 'Vente en ligne 24/7', desc: 'Votre billetterie ne dort jamais. Vos participants achètent leurs billets à tout moment.', icon: 'clock' },
  // { title: 'Points de vente', desc: 'Activez la vente physique via notre réseau de points de vente partenaires.', icon: 'store' },
  { title: 'Vente WhatsApp', desc: 'Partagez un lien direct vers vos billets sur WhatsApp et vendez instantanément.', icon: 'whatsapp' },
  // { title: 'Impression de billets', desc: 'Générez des billets physiques et électroniques avec des QR codes uniques.', icon: 'print' },
  { title: 'Billets d\'invitation', desc: 'Invitez vos VIP, votre presse ou vos partenaires avec des billets nominatifs gratuits.', icon: 'vip' },
  { title: 'Validateur QR code', desc: 'Scannez et validez les billets le jour J depuis votre smartphone.', icon: 'qr' },
  { title: 'Campagne email', desc: 'Envoyez des emails ciblés pour promouvoir vos événements.', icon: 'mail' },
  // { title: 'Campagne SMS', desc: 'Atteignez votre audience directement via des campagnes SMS personnalisées.', icon: 'sms' },
  { title: 'Sponsoring réseaux sociaux', desc: 'Boostez votre visibilité avec des campagnes sponsorisées intégrées.', icon: 'social' },
  { title: 'Communication ciblée', desc: 'Segmentez votre audience et envoyez le bon message au bon moment.', icon: 'target' },
  { title: 'Promotions et offres limitées', desc: 'Créez des offres flash, early bird et promotions temporaires.', icon: 'promo' },
  { title: 'Codes de réduction', desc: 'Générez des codes promo personnalisés pour vos partenaires et influenceurs.', icon: 'coupon' },
]

const steps = [
  { num: '1', title: 'Remplissez les détails', desc: 'Ajoutez le titre, la date, le lieu, vos images et définissez vos types de billets.' },
  { num: '2', title: 'Publiez votre événement', desc: 'Votre page événement est en ligne immédiatement, prête à être partagée.' },
  { num: '3', title: 'Gérez et validez', desc: 'Scannez les billets le jour J, gagnez du temps et prévenez la fraude.' },
  { num: '4', title: 'Recevez vos paiements', desc: 'Les virements sont effectués automatiquement après chaque événement.' },
]

const advantages = [
  { title: 'Vendez partout', desc: 'Marketplace active 24/7, multicanal : site web, WhatsApp.', icon: 'globe' },
  { title: 'Zéro paperasse', desc: 'Tout est digital, tout est fluide. Fini les fichiers Excel et les listes papier.', icon: 'digital' },
  { title: 'Simple et rapide', desc: 'Créez votre événement et commencez à vendre vos billets en quelques minutes.', icon: 'flash' },
  { title: 'Support humain', desc: 'Notre équipe est disponible pour vous accompagner à chaque étape.', icon: 'support' },
]

// Partners list is intentionally empty — NEVER add fictional partner names.
// Section is hidden via v-if="partners.length" until real partners exist.
const partners: string[] = []
</script>

<template>
  <div>
    <section class="bg-bg-primary">
      <div class="px-5 md:px-10 pt-20 pb-16 max-w-[1200px] mx-auto text-center">
        <h1 class="font-serif text-4xl md:text-5xl text-blue-main leading-tight mb-5">
          Nous croyons en votre succès.
        </h1>
        <p class="text-text-secondary text-lg max-w-[560px] mx-auto leading-relaxed">
          Pas de frais fixes, pas de surprises. Une tarification simple et transparente pour tous les organisateurs.
        </p>
      </div>
    </section>

    <section>
      <div class="px-5 md:px-10 py-20 max-w-[1200px] mx-auto text-center">
        <div class="bg-bg-surface rounded-xl p-10 md:p-16 max-w-[700px] mx-auto border border-border-light">
          <div class="text-4xl font-bold text-orange-primary mb-4">10%</div>
          <div class="font-serif text-xl md:text-2xl text-text-primary mb-3">Commission uniquement sur les billets vendus</div>
          <p class="text-text-secondary text-base leading-relaxed">
            Vous ne payez que si vous vendez. Pas d'abonnement, pas de frais cachés. Créez votre événement gratuitement et ne payez que sur le succès.
          </p>
        </div>
      </div>
    </section>

    <section class="bg-white">
      <div class="px-5 md:px-10 py-20 max-w-[1200px] mx-auto">
        <div class="text-center mb-14">
          <div class="text-xs font-bold tracking-widest uppercase text-orange-primary mb-2.5">Fonctionnalités</div>
          <h2 class="font-serif text-3xl md:text-4xl leading-tight text-text-primary">Ce que vous obtenez</h2>
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div v-for="(f, i) in features" :key="i" class="border border-border-light rounded-xl p-6 transition-colors duration-200 hover:border-orange-primary/30">
            <div class="text-orange-primary mb-4">
              <svg v-if="f.icon === 'clock'" class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              <svg v-else-if="f.icon === 'store'" class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
              <svg v-else-if="f.icon === 'whatsapp'" class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>
              <svg v-else-if="f.icon === 'print'" class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
              <svg v-else-if="f.icon === 'vip'" class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
              <svg v-else-if="f.icon === 'qr'" class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="3" height="3"/><line x1="21" y1="14" x2="21" y2="14.01"/><line x1="21" y1="21" x2="21" y2="21.01"/></svg>
              <svg v-else-if="f.icon === 'mail'" class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22 6 12 13 2 6"/></svg>
              <svg v-else-if="f.icon === 'sms'" class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
              <svg v-else-if="f.icon === 'social'" class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
              <svg v-else-if="f.icon === 'target'" class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>
              <svg v-else-if="f.icon === 'promo'" class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="20 12 20 22 4 22 4 12"/><rect x="2" y="7" width="20" height="5"/><line x1="12" y1="22" x2="12" y2="7"/><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/></svg>
              <svg v-else-if="f.icon === 'coupon'" class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2z"/><line x1="9" y1="9" x2="9" y2="9.01"/><line x1="15" y1="15" x2="15" y2="15.01"/><line x1="9" y1="15" x2="15" y2="9"/></svg>
            </div>
            <h3 class="font-semibold text-sm text-text-primary mb-1.5">{{ f.title }}</h3>
            <p class="text-xs text-text-secondary leading-relaxed">{{ f.desc }}</p>
          </div>
        </div>
      </div>
    </section>

    <section>
      <div class="px-5 md:px-10 py-20 max-w-[1200px] mx-auto">
        <div class="text-center mb-14">
          <div class="text-xs font-bold tracking-widest uppercase text-orange-primary mb-2.5">Processus</div>
          <h2 class="font-serif text-3xl md:text-4xl leading-tight text-text-primary">Créez et vendez vos billets en 4 étapes</h2>
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 relative">
          <div class="hidden lg:block absolute top-7 left-[12.5%] right-[12.5%] h-px bg-border-light z-0"></div>
          <div v-for="(s, i) in steps" :key="i" class="text-center px-5 relative z-[1] mb-8 lg:mb-0">
            <div class="w-14 h-14 rounded-full bg-white border-2 border-border-light flex items-center justify-center font-serif text-xl text-text-primary mx-auto mb-5 relative z-[1]">{{ s.num }}</div>
            <div class="text-sm font-bold text-text-primary mb-2">{{ s.title }}</div>
            <div class="text-xs text-text-tertiary leading-relaxed">{{ s.desc }}</div>
          </div>
        </div>
      </div>
    </section>

    <section class="bg-white">
      <div class="px-5 md:px-10 py-20 max-w-[1200px] mx-auto">
        <div class="text-center mb-14">
          <div class="text-xs font-bold tracking-widest uppercase text-orange-primary mb-2.5">Avantages</div>
          <h2 class="font-serif text-3xl md:text-4xl leading-tight text-text-primary">Pourquoi les organisateurs nous choisissent</h2>
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div v-for="(a, i) in advantages" :key="i" class="border border-border-light rounded-xl p-6">
            <div class="text-orange-primary mb-4">
              <svg v-if="a.icon === 'globe'" class="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
              <svg v-else-if="a.icon === 'digital'" class="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
              <svg v-else-if="a.icon === 'flash'" class="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
              <svg v-else-if="a.icon === 'support'" class="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M3 18v-6a9 9 0 0 1 18 0v6"/><path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3z"/><path d="M3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"/></svg>
            </div>
            <h3 class="font-semibold text-lg text-text-primary mb-2">{{ a.title }}</h3>
            <p class="text-sm text-text-secondary leading-relaxed">{{ a.desc }}</p>
          </div>
        </div>
      </div>
    </section>

    <section v-if="partners.length > 0">
      <div class="px-5 md:px-10 py-20 max-w-[1200px] mx-auto">
        <div class="text-center mb-14">
          <div class="text-xs font-bold tracking-widest uppercase text-orange-primary mb-2.5">Références</div>
          <h2 class="font-serif text-3xl md:text-4xl leading-tight text-text-primary">Ils nous font confiance</h2>
        </div>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div
            v-for="(p, i) in partners"
            :key="i"
            class="h-20 rounded-xl bg-bg-surface border border-border-light flex items-center justify-center"
          >
            <span class="font-semibold text-sm text-text-secondary">{{ p }}</span>
          </div>
        </div>
      </div>
    </section>

    <section>
      <div class="px-5 md:px-10 py-10">
        <div class="px-5 md:px-14 py-16 md:py-20 bg-bg-secondary max-w-[1200px] mx-auto rounded-xl">
          <div class="max-w-[700px] mx-auto text-center">
            <h2 class="font-serif text-3xl md:text-4xl leading-tight text-text-primary mb-4 tracking-tight">
              Prêt à commencer ?
            </h2>
            <p class="text-base text-text-secondary mb-9 leading-relaxed">
              Créez votre premier événement gratuitement et ne payez que sur le succès.
            </p>
            <div class="flex items-center justify-center gap-3 flex-wrap">
              <NuxtLink to="/dashboard/events/create" class="bg-orange-primary text-white px-8 py-3.5 rounded-full text-sm font-bold transition-colors duration-200 inline-flex items-center gap-2 hover:bg-orange-light">
                Organiser un événement
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
              </NuxtLink>
              <a href="https://wa.me/221770000000" target="_blank" class="border border-border-light text-text-primary px-8 py-3.5 rounded-full text-sm font-bold transition-colors duration-200 inline-flex items-center gap-2 hover:bg-bg-primary">
                Contacter un conseiller
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>
