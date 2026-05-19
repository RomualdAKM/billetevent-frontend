<script setup lang="ts">
definePageMeta({ layout: 'default' })

useSeoMeta({
  title: 'BilletEvent — Billetterie événementielle en Afrique',
  ogTitle: 'BilletEvent — Billetterie événementielle en Afrique',
  description: 'Créez, promouvez et vendez des billets pour vos événements. Paiement mobile money, QR code, scan instantané.',
  ogDescription: 'Créez, promouvez et vendez des billets pour vos événements. Paiement mobile money, QR code, scan instantané.',
  ogImage: '/logo.png',
  ogUrl: 'https://billetevent.com',
  ogType: 'website',
  twitterCard: 'summary_large_image',
})

const { getPublicStats } = usePublicApi()
const { getEvents } = useEventsApi()

const stats = ref({ participants: 0, tickets_sold: 0, revenue: 0, active_events: 0 })
const featuredEvents = ref([])

onMounted(async () => {
  try {
    const [statsData, eventsData] = await Promise.all([
      getPublicStats(),
      getEvents({ featured: true, per_page: 6 })
    ])
    if (statsData?.data) stats.value = statsData.data
    else if (statsData) stats.value = statsData
    featuredEvents.value = eventsData?.data || []
  } catch (err) {
    console.error('Error loading homepage:', err)
  }
})

const formatStat = (val) => {
  if (!val) return '0'
  return new Intl.NumberFormat('fr-FR').format(val)
}

const openFaq = ref(null)

function toggleFaq(index) {
  openFaq.value = openFaq.value === index ? null : index
}

const marqueeItems = [
  'Concerts', 'Formations', 'Ateliers', 'Séminaires', 'Webinaires', 'Expositions',
  'Compétitions', 'Spectacles', 'Salons', 'Meetups', 'Lancements', 'Festivals',
  'Conférences', 'Masterclass', 'Galas', 'Mariages', 'Soirées', 'Cérémonies',
  'Hackathons', 'Tournois', 'Collectes de fonds', 'Réseautage', 'Événements religieux',
  'Conférences tech', 'Événements sportifs',
]

const features = [
  { title: 'Page événement personnalisée', desc: 'Créez une page dédiée pour votre événement avec description, images, programme et informations importantes.', featured: false },
  { title: 'Billetterie en ligne', desc: 'Vendez vos billets facilement et acceptez plusieurs moyens de paiement : cartes bancaires, PayPal, mobile money et plus.', featured: true },
  { title: 'Gestion des participants', desc: 'Organisez votre événement avec un programme clair : sessions, horaires, ateliers et intervenants.', featured: false },
  { title: 'Tableau de bord complet', desc: 'Analysez les ventes, inscriptions et performances de vos événements en temps réel.', featured: false },
  { title: 'Gestion du programme', desc: 'Créez une page dédiée pour votre événement avec description, images, programme et informations importantes.', featured: false },
  { title: 'Promotion & marketing', desc: 'Partagez votre événement sur les réseaux sociaux et intégrez des outils marketing comme le pixel Facebook.', featured: false },
]

const howSteps = [
  { num: '1', title: 'Créez votre événement', desc: 'Remplissez les détails, ajoutez votre flyer et définissez vos types de billets.' },
  { num: '2', title: 'Configurez la billetterie', desc: 'Définissez vos prix, capacités et options de paiement mobile money.' },
  { num: '3', title: 'Partagez votre événement', desc: 'Publiez et partagez votre page sur WhatsApp, Instagram et vos réseaux.' },
  { num: '4', title: 'Vendez vos billets', desc: 'Suivez vos ventes en temps réel et scannez les billets à l\'entrée.' },
]

const eventTypes = [
  { name: 'Présentiel payant', desc: 'Billet numérique avec QR code unique, scan à l\'entrée, reversement automatique.', icon: 'location' },
  { name: 'Présentiel gratuit avec inscription', desc: 'Contrôlez la capacité et gérez les inscrits même pour les événements gratuits.', icon: 'ticket' },
  { name: 'En ligne payant', desc: 'Lien d\'accès sécurisé envoyé après paiement, code d\'accès personnalisé.', icon: 'monitor' },
  { name: 'En ligne gratuit', desc: 'Lien de participation envoyé par email, gestion de la liste des inscrits.', icon: 'phone' },
  { name: 'Formation & Masterclass', desc: 'Gestion des sessions, certificats de présence, suivi de présence.', icon: 'mic' },
  { name: 'Événement communautaire', desc: 'Religieux, culturel, politique — gérez vos événements de toutes tailles.', icon: 'users' },
]

const testimonials = [
  { quote: 'BilletEvent nous a permis de créer rapidement une page événement claire et professionnelle. La gestion des inscriptions et des paiements s\'est faite sans effort.', name: 'Yannick Tshamba', role: 'Organisateur d\'événements', initials: 'YT', featured: true },
  { quote: 'J\'organise régulièrement des formations et ateliers. Avec BilletEvent, je peux gérer mon programme, mes participants et mes ventes depuis un seul outil.', name: 'Moussa Kébé', role: 'Coach & formateur indépendant', initials: 'MK', avatarClass: 'bg-orange-dim text-orange-primary' },
  { quote: 'La plateforme est simple et très intuitive. Nous avons pu vendre nos billets en ligne et suivre les ventes en temps réel.', name: 'Ndeye Kouyaté', role: 'Responsable culturelle', initials: 'NK', avatarClass: 'bg-blue-main/8 text-text-secondary' },
  { quote: 'BilletEvent nous a aidés à structurer notre événement du début à la fin : page, billetterie, participants et suivi post-événement.', name: 'Landry Sissoko', role: 'Directeur événementiel', initials: 'LS', avatarClass: 'bg-green-dim text-green-dark' },
  { quote: 'Grâce à BilletEvent, nous avons pu accepter plusieurs moyens de paiement, rendant notre événement accessible à un plus large public.', name: 'Léa Montclair', role: 'Responsable culturelle & business', initials: 'LM', avatarClass: 'bg-orange-dim text-orange-primary' },
]

const faqItems = [
  { q: 'Qu\'est-ce que BilletEvent ?', a: 'BilletEvent est une plateforme sénégalaise de billetterie en ligne qui permet aux organisateurs de créer des pages événements, vendre des billets, gérer les participants et suivre leurs ventes en temps réel. Elle accepte les paiements via Wave, Orange Money et Free Money.' },
  { q: 'Quels types d\'événements puis-je organiser ?', a: 'BilletEvent supporte tous types d\'événements : concerts, formations, masterclass, conférences, événements religieux, politiques, culturels, soirées, mariages, compétitions sportives, et bien d\'autres. Que l\'événement soit présentiel ou en ligne, payant ou gratuit.' },
  { q: 'Qu\'est-ce que le client reçoit après avoir acheté un billet ?', a: 'Pour un événement présentiel, le client reçoit un billet numérique par email contenant un QR code unique, son nom, les détails de l\'événement et le type de pass. Pour un événement en ligne, il reçoit le lien d\'accès sécurisé. Dans tous les cas, un email de confirmation est envoyé immédiatement après le paiement.' },
  { q: 'Quels moyens de paiement sont acceptés ?', a: 'BilletEvent accepte Wave, Orange Money, Free Money et les cartes bancaires. Les reversements sont effectués automatiquement vers le compte mobile money de l\'organisateur après chaque événement.' },
  { q: 'Comment vérifier les billets à l\'entrée ?', a: 'Depuis votre tableau de bord BilletEvent, vous pouvez scanner les QR codes des billets avec votre smartphone. Le système vérifie instantanément la validité du billet et bloque les doublons. Vous pouvez aussi utiliser la liste des participants pour un check-in manuel.' },
  { q: 'Puis-je créer une page personnalisée pour mon événement ?', a: 'Oui. Chaque événement dispose d\'une page publique avec votre flyer, la description, le programme détaillé, les intervenants, le lieu avec carte, et le bouton d\'achat de billets. La page est partageable directement sur WhatsApp, Instagram et les réseaux sociaux.' },
  { q: 'Puis-je gérer plusieurs événements en même temps ?', a: 'Oui. Votre tableau de bord vous permet de gérer autant d\'événements simultanément que vous le souhaitez. Vous pouvez suivre les ventes, les participants et les revenus de chaque événement séparément ou en vue agrégée.' },
]


</script>

<template>
  <div>
    <section>
      <div class="px-5 md:px-10 pt-5 pb-10 max-w-[1200px] mx-auto grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-15 items-center">
        <div>
          <h1 class="font-serif text-[2.2rem] sm:text-[2.8rem] lg:text-[3.4rem] leading-[1.1] text-text-primary mb-5 tracking-tight">
            Créez, vendez et gérez <em class="italic text-orange-primary">vos événements</em><br />
            en un clic
          </h1>
          <p class="text-base text-text-tertiary leading-[1.7] mb-9 max-w-[460px]">
            Une plateforme de billetterie simple et efficace pour tous vos événements. Suivez vos ventes en temps réel et offrez une expérience fluide à vos participants.
          </p>
          <div class="flex items-center gap-3.5 flex-wrap">
            <NuxtLink to="/dashboard/events/create" class="bg-orange-primary text-white px-[30px] py-[14px] rounded-full text-[0.9rem] font-bold transition-all duration-200 inline-flex items-center gap-2 hover:bg-orange-light hover:-translate-y-0.5 ">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              Créer un événement
            </NuxtLink>
            <NuxtLink to="/events" class="border border-border-light text-text-primary px-[26px] py-[13px] rounded-full text-[0.9rem] font-bold transition-all duration-200 inline-flex items-center gap-2 hover:border-orange-primary hover:text-orange-primary">
              Parcourir les événements
            </NuxtLink>
          </div>
        </div>

        <div class="flex items-center justify-center">
          <NuxtImg
            src="~/assets/banner.png"
            alt="Billet BilletEvent"
            class="w-full max-w-[320px] md:max-w-[380px] rounded-lg"
            preload
          />
        </div>
      </div>
    </section>

    <div class="overflow-hidden py-2 flex justify-center">
      <div class="bg-[#E2E5EC] rounded-full overflow-hidden w-[calc(100%+120px)] -mx-15 py-3.5">
        <div class="flex w-full overflow-hidden">
          <div class="flex items-center whitespace-nowrap shrink-0 animate-marquee gap-0">
            <span v-for="(item, i) in marqueeItems" :key="'a'+i" class="contents"><span class="text-[0.78rem] font-medium text-[#6B7490] px-1.5 tracking-tight">{{ item }}</span><span class="text-[#B0B6C8] px-0.5">·</span></span>
          </div>
          <div class="flex items-center whitespace-nowrap shrink-0 animate-marquee gap-0" aria-hidden="true">
            <span v-for="(item, i) in marqueeItems" :key="'b'+i" class="contents"><span class="text-[0.78rem] font-medium text-[#6B7490] px-1.5 tracking-tight">{{ item }}</span><span class="text-[#B0B6C8] px-0.5">·</span></span>
          </div>
        </div>
      </div>
    </div>

    <section id="fonctionnalites">
      <div class="py-16 md:py-20 px-5 md:px-10 max-w-[1100px] mx-auto">
        <div class="mb-10">
          <h2 class="font-serif text-[1.8rem] md:text-[2.2rem] leading-[1.2] text-text-primary mb-2.5">Tout ce dont vous avez besoin<br />pour organiser vos événements</h2>
          <p class="text-[0.92rem] text-text-tertiary leading-[1.7] max-w-[520px]">Créez vos pages événements, vendez vos billets et gérez vos participants depuis une plateforme simple et puissante.</p>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div
            v-for="(f, i) in features"
            :key="i"
            :class="[
              'rounded-xl px-7 py-6 transition-all duration-200 cursor-default',
              f.featured
                ? 'bg-blue-main hover:bg-[#2E3F7A]'
                : 'bg-surface-2 hover:bg-[#E4E8F2]'
            ]"
          >
            <div :class="['text-[0.92rem] font-bold mb-1.5', f.featured ? 'text-white' : 'text-text-primary']">{{ f.title }}</div>
            <div :class="['text-[0.8rem] leading-[1.6]', f.featured ? 'text-white/65' : 'text-text-tertiary']">{{ f.desc }}</div>
          </div>
        </div>
      </div>
    </section>

    <section>
      <div class="py-24 px-5 md:px-10 bg-white">
        <div class="max-w-[1200px] mx-auto">
          <div class="text-center max-w-[560px] mx-auto">
            <div class="text-[0.7rem] font-bold tracking-[0.12em] uppercase text-orange-primary mb-2.5 flex items-center justify-center gap-2">Comment ça marche</div>
            <h2 class="font-serif text-[1.8rem] md:text-[2.2rem] leading-[1.2] text-text-primary mb-3.5">Créez, publiez et vendez<br />en quelques étapes simples</h2>
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 mt-14 relative">
            <div class="hidden lg:block absolute top-7 left-[12.5%] right-[12.5%] h-px bg-border-light z-0"></div>
            <div v-for="(step, i) in howSteps" :key="i" class="text-center px-5 relative z-[1] mb-8 sm:mb-0 group">
              <div class="w-14 h-14 rounded-full bg-white border-2 border-border-light flex items-center justify-center font-serif text-[1.3rem] text-text-primary mx-auto mb-5 relative z-[1] transition-all duration-200 group-hover:bg-orange-primary group-hover:border-orange-primary group-hover:text-white">{{ step.num }}</div>
              <div class="text-[0.92rem] font-bold text-text-primary mb-2">{{ step.title }}</div>
              <div class="text-[0.8rem] text-text-tertiary leading-[1.6]">{{ step.desc }}</div>
            </div>
          </div>
          <div class="mt-10 text-center">
            <NuxtLink to="/pricing" class="inline-flex items-center gap-2 text-[0.88rem] font-semibold text-orange-primary hover:underline">
              Voir nos tarifs
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
            </NuxtLink>
          </div>
        </div>
      </div>
    </section>

    <section>
      <div class="py-24 px-5 md:px-10 max-w-[1100px] mx-auto text-center">
        <div class="text-[0.7rem] font-bold tracking-[0.12em] uppercase text-orange-primary mb-2.5 flex items-center justify-center gap-2">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>
          Dashboard
        </div>
        <h2 class="font-serif text-[1.8rem] md:text-[2.2rem] leading-[1.2] text-text-primary mb-3.5 text-center">Suivez tout d'un<br /><em class="italic text-orange-primary">coup d'oeil</em></h2>
        <p class="text-[0.92rem] text-text-tertiary leading-[1.7] max-w-[520px] mx-auto mb-12 text-center">Gerez vos evenements, suivez vos ventes et analysez vos performances depuis un tableau de bord intuitif.</p>

        <div class="bg-white rounded-[20px] border border-border-light overflow-hidden">
          <!-- Barre navigateur -->
          <div class="bg-[#F0F2F7] px-3 sm:px-4 py-2 sm:py-2.5 flex items-center gap-2 sm:gap-2.5 border-b border-border-light">
            <div class="flex gap-1 sm:gap-1.5">
              <div class="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-[#FF5F57]"></div>
              <div class="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-[#FEBC2E]"></div>
              <div class="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-[#28C840]"></div>
            </div>
            <div class="flex-1 bg-white rounded-md px-2 sm:px-3 py-0.5 sm:py-1 text-[0.6rem] sm:text-[0.72rem] text-text-tertiary border border-border-light text-left truncate">app.billetevent.com/dashboard</div>
          </div>

          <!-- Desktop + Tablette : sidebar + contenu -->
          <div class="hidden md:flex min-h-[520px] lg:min-h-[620px] font-sans">
            <!-- Sidebar fidele au vrai dashboard -->
            <div class="w-[160px] lg:w-[200px] shrink-0 bg-white border-r border-border-light flex flex-col">
              <div class="px-3 lg:px-4 pt-3 lg:pt-4 pb-2.5 lg:pb-3 border-b border-border-light flex items-center justify-center">
                <span class="font-bold text-[0.78rem] lg:text-[0.92rem] text-text-primary tracking-tight">BilletEvent</span>
              </div>
              <div class="px-1.5 lg:px-2 pt-2 flex-1 overflow-hidden">
                <div class="flex items-center gap-1.5 lg:gap-2 px-2 lg:px-2.5 py-1.5 lg:py-[7px] rounded-lg bg-orange-primary/8 mb-0.5">
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#F05A28" stroke-width="2" stroke-linecap="round" class="shrink-0 lg:w-[12px] lg:h-[12px]"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>
                  <span class="text-[0.62rem] lg:text-[0.72rem] font-semibold text-orange-primary">Vue d'ensemble</span>
                </div>
                <div class="text-[0.42rem] lg:text-[0.48rem] font-bold tracking-[0.08em] uppercase text-text-tertiary px-2 pt-2.5 pb-1">Gestion des evenements</div>
                <div class="flex items-center gap-1.5 lg:gap-2 px-2 lg:px-2.5 py-1 lg:py-[6px] rounded-lg mb-px">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#8A93B2" stroke-width="2" stroke-linecap="round" class="shrink-0 lg:w-[12px] lg:h-[12px]"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                  <span class="text-[0.58rem] lg:text-[0.68rem] text-text-secondary">Mes evenements</span>
                  <span class="ml-auto bg-orange-primary text-white text-[0.4rem] lg:text-[0.45rem] font-bold px-1 lg:px-1.5 py-0.5 rounded-full leading-none">3</span>
                </div>
                <div class="flex items-center gap-1.5 lg:gap-2 px-2 lg:px-2.5 py-1 lg:py-[6px] rounded-lg mb-px">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#8A93B2" stroke-width="2" stroke-linecap="round" class="shrink-0 lg:w-[12px] lg:h-[12px]"><path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2z"/><line x1="9" y1="9" x2="9" y2="15"/></svg>
                  <span class="text-[0.58rem] lg:text-[0.68rem] text-text-secondary">Billets & Ventes</span>
                </div>
                <div class="flex items-center gap-1.5 lg:gap-2 px-2 lg:px-2.5 py-1 lg:py-[6px] rounded-lg mb-px">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#8A93B2" stroke-width="2" stroke-linecap="round" class="shrink-0 lg:w-[12px] lg:h-[12px]"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                  <span class="text-[0.58rem] lg:text-[0.68rem] text-text-secondary">Participants</span>
                </div>
                <div class="flex items-center gap-1.5 lg:gap-2 px-2 lg:px-2.5 py-1 lg:py-[6px] rounded-lg mb-px">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#8A93B2" stroke-width="2" stroke-linecap="round" class="shrink-0 lg:w-[12px] lg:h-[12px]"><path d="M3 7V5a2 2 0 0 1 2-2h2M17 3h2a2 2 0 0 1 2 2v2M21 17v2a2 2 0 0 1-2 2h-2M7 21H5a2 2 0 0 1-2-2v-2"/><rect x="7" y="7" width="10" height="10"/></svg>
                  <span class="text-[0.58rem] lg:text-[0.68rem] text-text-secondary">Scan & Check-in</span>
                </div>
                <div class="text-[0.42rem] lg:text-[0.48rem] font-bold tracking-[0.08em] uppercase text-text-tertiary px-2 pt-2 pb-1">Revenus & finances</div>
                <div class="flex items-center gap-1.5 lg:gap-2 px-2 lg:px-2.5 py-1 lg:py-[6px] rounded-lg mb-px">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#8A93B2" stroke-width="2" stroke-linecap="round" class="shrink-0 lg:w-[12px] lg:h-[12px]"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M2 10h20"/><circle cx="18" cy="15" r="1"/></svg>
                  <span class="text-[0.58rem] lg:text-[0.68rem] text-text-secondary">Portefeuille</span>
                </div>
                <div class="flex items-center gap-1.5 lg:gap-2 px-2 lg:px-2.5 py-1 lg:py-[6px] rounded-lg mb-px">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#8A93B2" stroke-width="2" stroke-linecap="round" class="shrink-0 lg:w-[12px] lg:h-[12px]"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>
                  <span class="text-[0.58rem] lg:text-[0.68rem] text-text-secondary">Codes promo</span>
                </div>
                <div class="flex items-center gap-1.5 lg:gap-2 px-2 lg:px-2.5 py-1 lg:py-[6px] rounded-lg mb-px">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#8A93B2" stroke-width="2" stroke-linecap="round" class="shrink-0 lg:w-[12px] lg:h-[12px]"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
                  <span class="text-[0.58rem] lg:text-[0.68rem] text-text-secondary">Points de vente</span>
                </div>
                <div class="text-[0.42rem] lg:text-[0.48rem] font-bold tracking-[0.08em] uppercase text-text-tertiary px-2 pt-2 pb-1">Marketing & audience</div>
                <div class="flex items-center gap-1.5 lg:gap-2 px-2 lg:px-2.5 py-1 lg:py-[6px] rounded-lg mb-px">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#8A93B2" stroke-width="2" stroke-linecap="round" class="shrink-0 lg:w-[12px] lg:h-[12px]"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                  <span class="text-[0.58rem] lg:text-[0.68rem] text-text-secondary">Invitations</span>
                </div>
                <div class="flex items-center gap-1.5 lg:gap-2 px-2 lg:px-2.5 py-1 lg:py-[6px] rounded-lg mb-px">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#8A93B2" stroke-width="2" stroke-linecap="round" class="shrink-0 lg:w-[12px] lg:h-[12px]"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
                  <span class="text-[0.58rem] lg:text-[0.68rem] text-text-secondary">Abonnes</span>
                </div>
                <div class="flex items-center gap-1.5 lg:gap-2 px-2 lg:px-2.5 py-1 lg:py-[6px] rounded-lg mb-px">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#8A93B2" stroke-width="2" stroke-linecap="round" class="shrink-0 lg:w-[12px] lg:h-[12px]"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>
                  <span class="text-[0.58rem] lg:text-[0.68rem] text-text-secondary">Campagnes</span>
                </div>
                <div class="text-[0.42rem] lg:text-[0.48rem] font-bold tracking-[0.08em] uppercase text-text-tertiary px-2 pt-2 pb-1">Compte</div>
                <div class="flex items-center gap-1.5 lg:gap-2 px-2 lg:px-2.5 py-1 lg:py-[6px] rounded-lg mb-px">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#8A93B2" stroke-width="2" stroke-linecap="round" class="shrink-0 lg:w-[12px] lg:h-[12px]"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>
                  <span class="text-[0.58rem] lg:text-[0.68rem] text-text-secondary">Verification KYC</span>
                </div>
                <div class="flex items-center gap-1.5 lg:gap-2 px-2 lg:px-2.5 py-1 lg:py-[6px] rounded-lg mb-px">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#8A93B2" stroke-width="2" stroke-linecap="round" class="shrink-0 lg:w-[12px] lg:h-[12px]"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4"/></svg>
                  <span class="text-[0.58rem] lg:text-[0.68rem] text-text-secondary">Parametres</span>
                </div>
                <div class="flex items-center gap-1.5 lg:gap-2 px-2 lg:px-2.5 py-1 lg:py-[6px] rounded-lg mb-px">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#8A93B2" stroke-width="2" stroke-linecap="round" class="shrink-0 lg:w-[12px] lg:h-[12px]"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                  <span class="text-[0.58rem] lg:text-[0.68rem] text-text-secondary">Support</span>
                </div>
              </div>
              <div class="px-1.5 lg:px-2 py-2 lg:py-2.5 border-t border-border-light">
                <div class="flex items-center gap-1.5 lg:gap-2 px-1.5 lg:px-2 py-1.5 lg:py-2 rounded-lg bg-surface-2">
                  <div class="w-6 lg:w-7 h-6 lg:h-7 rounded-full bg-gradient-to-br from-orange-primary to-orange-light flex items-center justify-center text-[0.55rem] lg:text-[0.65rem] font-bold text-white shrink-0">SA</div>
                  <div class="min-w-0">
                    <div class="text-[0.6rem] lg:text-[0.7rem] font-semibold text-text-primary truncate">Sarah A.</div>
                    <div class="text-[0.48rem] lg:text-[0.55rem] text-text-tertiary">Organisateur</div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Zone principale -->
            <div class="flex-1 flex flex-col min-w-0 overflow-hidden">
              <!-- Header -->
              <div class="bg-white border-b border-border-light px-3 lg:px-5 py-2.5 lg:py-3 shrink-0">
                <div class="flex items-center justify-between mb-1">
                  <div class="min-w-0">
                    <div class="text-[0.78rem] lg:text-[0.92rem] font-semibold text-text-primary">Vue d'ensemble</div>
                    <div class="text-[0.52rem] lg:text-[0.62rem] text-text-tertiary">Suivez vos performances et votre activite en temps reel</div>
                  </div>
                  <div class="bg-orange-primary text-white px-2.5 lg:px-3.5 py-1 lg:py-1.5 rounded-lg text-[0.6rem] lg:text-[0.7rem] font-bold flex items-center gap-1 shrink-0">
                    <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" class="lg:w-[10px] lg:h-[10px]"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                    <span class="hidden lg:inline">Nouvel evenement</span>
                    <span class="lg:hidden">Nouveau</span>
                  </div>
                </div>
                <div class="flex items-center gap-1">
                  <div class="flex bg-surface-2 rounded-md p-0.5 gap-px">
                    <span class="px-1.5 lg:px-2 py-0.5 rounded text-[0.48rem] lg:text-[0.55rem] font-semibold text-text-tertiary">7j</span>
                    <span class="px-1.5 lg:px-2 py-0.5 rounded bg-white text-[0.48rem] lg:text-[0.55rem] font-semibold text-text-primary">30j</span>
                    <span class="px-1.5 lg:px-2 py-0.5 rounded text-[0.48rem] lg:text-[0.55rem] font-semibold text-text-tertiary">3 mois</span>
                    <span class="px-1.5 lg:px-2 py-0.5 rounded text-[0.48rem] lg:text-[0.55rem] font-semibold text-text-tertiary">12 mois</span>
                  </div>
                </div>
              </div>

              <!-- Contenu dashboard -->
              <div class="flex-1 p-3 lg:p-[18px] bg-bg-primary overflow-hidden">
                <!-- 4 stat cards -->
                <div class="grid grid-cols-2 lg:grid-cols-4 gap-2 lg:gap-2.5 mb-3 lg:mb-3.5">
                  <div class="bg-white rounded-[8px] lg:rounded-[10px] px-2.5 lg:px-3.5 py-2 lg:py-3 border border-border-light">
                    <div class="flex items-center justify-between mb-1 lg:mb-1.5">
                      <span class="text-[0.48rem] lg:text-[0.58rem] font-semibold text-text-tertiary">Billets vendus</span>
                      <div class="w-5 lg:w-6 h-5 lg:h-6 rounded-md bg-orange-dim flex items-center justify-center">
                        <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#F05A28" stroke-width="2.5" stroke-linecap="round" class="lg:w-[11px] lg:h-[11px]"><path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2z"/><line x1="9" y1="9" x2="9" y2="15"/></svg>
                      </div>
                    </div>
                    <div class="font-serif text-[1rem] lg:text-[1.3rem] text-text-primary leading-none">247</div>
                    <div class="text-[0.48rem] lg:text-[0.58rem] text-text-tertiary mt-0.5 lg:mt-1">depuis 30 jours</div>
                  </div>
                  <div class="bg-white rounded-[8px] lg:rounded-[10px] px-2.5 lg:px-3.5 py-2 lg:py-3 border border-border-light">
                    <div class="flex items-center justify-between mb-1 lg:mb-1.5">
                      <span class="text-[0.48rem] lg:text-[0.58rem] font-semibold text-text-tertiary">Revenus FCFA</span>
                      <div class="w-5 lg:w-6 h-5 lg:h-6 rounded-md bg-orange-dim flex items-center justify-center">
                        <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#F05A28" stroke-width="2.5" stroke-linecap="round" class="lg:w-[11px] lg:h-[11px]"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
                      </div>
                    </div>
                    <div class="font-serif text-[1rem] lg:text-[1.3rem] text-text-primary leading-none">1 850 000</div>
                    <div class="text-[0.48rem] lg:text-[0.58rem] text-text-tertiary mt-0.5 lg:mt-1">ce mois</div>
                  </div>
                  <div class="bg-white rounded-[8px] lg:rounded-[10px] px-2.5 lg:px-3.5 py-2 lg:py-3 border border-border-light">
                    <div class="flex items-center justify-between mb-1 lg:mb-1.5">
                      <span class="text-[0.48rem] lg:text-[0.58rem] font-semibold text-text-tertiary">Evenements actifs</span>
                      <div class="w-5 lg:w-6 h-5 lg:h-6 rounded-md bg-orange-dim flex items-center justify-center">
                        <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#F05A28" stroke-width="2.5" stroke-linecap="round" class="lg:w-[11px] lg:h-[11px]"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                      </div>
                    </div>
                    <div class="font-serif text-[1rem] lg:text-[1.3rem] text-text-primary leading-none">5</div>
                    <div class="text-[0.48rem] lg:text-[0.58rem] text-text-tertiary mt-0.5 lg:mt-1">en cours</div>
                  </div>
                  <div class="bg-white rounded-[8px] lg:rounded-[10px] px-2.5 lg:px-3.5 py-2 lg:py-3 border border-border-light">
                    <div class="flex items-center justify-between mb-1 lg:mb-1.5">
                      <span class="text-[0.48rem] lg:text-[0.58rem] font-semibold text-text-tertiary">Participants inscrits</span>
                      <div class="w-5 lg:w-6 h-5 lg:h-6 rounded-md bg-orange-dim flex items-center justify-center">
                        <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#F05A28" stroke-width="2.5" stroke-linecap="round" class="lg:w-[11px] lg:h-[11px]"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                      </div>
                    </div>
                    <div class="font-serif text-[1rem] lg:text-[1.3rem] text-text-primary leading-none">1 024</div>
                    <div class="text-[0.48rem] lg:text-[0.58rem] text-text-tertiary mt-0.5 lg:mt-1">total cumule</div>
                  </div>
                </div>

                <!-- Ventes par evenement + Types de pass -->
                <div class="grid grid-cols-1 lg:grid-cols-[1.6fr_1fr] gap-2 lg:gap-2.5 mb-3 lg:mb-3.5">
                  <div class="bg-white rounded-[8px] lg:rounded-[10px] border border-border-light overflow-hidden">
                    <div class="flex items-center justify-between px-2.5 lg:px-3.5 py-1.5 lg:py-2.5 border-b border-border-light">
                      <div>
                        <div class="text-[0.6rem] lg:text-[0.7rem] font-semibold text-text-primary">Ventes par evenement</div>
                        <div class="text-[0.45rem] lg:text-[0.52rem] text-text-tertiary">Repartition de vos ventes</div>
                      </div>
                      <span class="text-[0.48rem] lg:text-[0.56rem] text-orange-primary font-semibold">Voir details →</span>
                    </div>
                    <div class="px-2.5 lg:px-3.5 py-2 lg:py-3 flex flex-col gap-2.5">
                      <div>
                        <div class="flex justify-between items-center mb-1">
                          <div class="flex items-center gap-1.5"><div class="w-2 h-2 rounded-full bg-orange-primary"></div><span class="text-[0.52rem] lg:text-[0.62rem] font-semibold text-text-primary">Concert Afrobeats</span></div>
                          <div class="flex items-center gap-2"><span class="text-[0.5rem] lg:text-[0.6rem] font-bold text-text-primary">180</span><span class="text-[0.45rem] lg:text-[0.52rem] text-text-tertiary">900 000 F</span></div>
                        </div>
                        <div class="h-[4px] lg:h-[5px] rounded-full bg-surface-2 overflow-hidden"><div class="h-full rounded-full bg-orange-primary" style="width: 72%"></div></div>
                        <div class="flex justify-between mt-0.5"><span class="text-[0.42rem] lg:text-[0.48rem] text-text-tertiary">Capacite : 250</span><span class="text-[0.42rem] lg:text-[0.48rem] font-semibold text-orange-primary">72% rempli</span></div>
                      </div>
                      <div class="border-t border-border-light pt-2">
                        <div class="flex justify-between items-center mb-1">
                          <div class="flex items-center gap-1.5"><div class="w-2 h-2 rounded-full bg-[#1B2B5E]"></div><span class="text-[0.52rem] lg:text-[0.62rem] font-semibold text-text-primary">Masterclass Digital</span></div>
                          <div class="flex items-center gap-2"><span class="text-[0.5rem] lg:text-[0.6rem] font-bold text-text-primary">45</span><span class="text-[0.45rem] lg:text-[0.52rem] text-text-tertiary">450 000 F</span></div>
                        </div>
                        <div class="h-[4px] lg:h-[5px] rounded-full bg-surface-2 overflow-hidden"><div class="h-full rounded-full bg-[#1B2B5E]" style="width: 45%"></div></div>
                        <div class="flex justify-between mt-0.5"><span class="text-[0.42rem] lg:text-[0.48rem] text-text-tertiary">Capacite : 100</span><span class="text-[0.42rem] lg:text-[0.48rem] font-semibold text-[#1B2B5E]">45% rempli</span></div>
                      </div>
                    </div>
                  </div>
                  <div class="bg-white rounded-[8px] lg:rounded-[10px] border border-border-light overflow-hidden">
                    <div class="px-2.5 lg:px-3.5 py-1.5 lg:py-2.5 border-b border-border-light">
                      <div class="text-[0.6rem] lg:text-[0.7rem] font-semibold text-text-primary">Types de pass</div>
                      <div class="text-[0.45rem] lg:text-[0.52rem] text-text-tertiary">Distribution des billets vendus</div>
                    </div>
                    <div class="px-2.5 lg:px-3.5 py-2 lg:py-3 flex flex-col gap-2">
                      <div>
                        <div class="flex justify-between mb-0.5"><div class="flex items-center gap-1.5"><div class="w-2 h-2 rounded-full bg-orange-primary"></div><span class="text-[0.5rem] lg:text-[0.6rem] text-text-primary">Standard</span></div><span class="text-[0.5rem] lg:text-[0.6rem] font-bold text-text-primary">58%</span></div>
                        <div class="h-[4px] lg:h-[5px] rounded-full bg-surface-2 overflow-hidden"><div class="h-full rounded-full bg-orange-primary" style="width: 58%"></div></div>
                      </div>
                      <div>
                        <div class="flex justify-between mb-0.5"><div class="flex items-center gap-1.5"><div class="w-2 h-2 rounded-full bg-[#1B2B5E]"></div><span class="text-[0.5rem] lg:text-[0.6rem] text-text-primary">VIP</span></div><span class="text-[0.5rem] lg:text-[0.6rem] font-bold text-text-primary">28%</span></div>
                        <div class="h-[4px] lg:h-[5px] rounded-full bg-surface-2 overflow-hidden"><div class="h-full rounded-full bg-[#1B2B5E]" style="width: 28%"></div></div>
                      </div>
                      <div>
                        <div class="flex justify-between mb-0.5"><div class="flex items-center gap-1.5"><div class="w-2 h-2 rounded-full bg-[#8A93B2]"></div><span class="text-[0.5rem] lg:text-[0.6rem] text-text-primary">Early Bird</span></div><span class="text-[0.5rem] lg:text-[0.6rem] font-bold text-text-primary">14%</span></div>
                        <div class="h-[4px] lg:h-[5px] rounded-full bg-surface-2 overflow-hidden"><div class="h-full rounded-full bg-[#8A93B2]" style="width: 14%"></div></div>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Evenements recents + Activite recente -->
                <div class="grid grid-cols-1 lg:grid-cols-2 gap-2 lg:gap-2.5">
                  <div class="bg-white rounded-[8px] lg:rounded-[10px] border border-border-light overflow-hidden">
                    <div class="flex items-center justify-between px-2.5 lg:px-3.5 py-1.5 lg:py-2 border-b border-border-light">
                      <span class="text-[0.6rem] lg:text-[0.7rem] font-semibold text-text-primary">Evenements recents</span>
                      <span class="text-[0.48rem] lg:text-[0.56rem] text-orange-primary font-semibold">Voir tout →</span>
                    </div>
                    <div class="px-2 lg:px-3 py-2 flex flex-col gap-1.5">
                      <div class="flex items-center justify-between p-2 lg:p-2.5 rounded-lg border border-border-light">
                        <div class="min-w-0"><div class="text-[0.52rem] lg:text-[0.62rem] font-semibold text-text-primary">Concert Afrobeats</div><div class="text-[0.42rem] lg:text-[0.5rem] text-text-tertiary">15 avr. 2026</div></div>
                        <div class="flex flex-col items-end gap-0.5"><span class="text-[0.4rem] lg:text-[0.48rem] font-bold px-1.5 py-0.5 rounded-full bg-green-dim text-green-dark">En vente</span><span class="text-[0.4rem] lg:text-[0.48rem] text-text-secondary">180 / 250</span></div>
                      </div>
                      <div class="flex items-center justify-between p-2 lg:p-2.5 rounded-lg border border-border-light">
                        <div class="min-w-0"><div class="text-[0.52rem] lg:text-[0.62rem] font-semibold text-text-primary">Masterclass Digital</div><div class="text-[0.42rem] lg:text-[0.5rem] text-text-tertiary">22 avr. 2026</div></div>
                        <div class="flex flex-col items-end gap-0.5"><span class="text-[0.4rem] lg:text-[0.48rem] font-bold px-1.5 py-0.5 rounded-full bg-green-dim text-green-dark">En vente</span><span class="text-[0.4rem] lg:text-[0.48rem] text-text-secondary">45 / 100</span></div>
                      </div>
                      <div class="flex items-center justify-between p-2 lg:p-2.5 rounded-lg border border-border-light">
                        <div class="min-w-0"><div class="text-[0.52rem] lg:text-[0.62rem] font-semibold text-text-primary">Gala de bienfaisance</div><div class="text-[0.42rem] lg:text-[0.5rem] text-text-tertiary">3 mai 2026</div></div>
                        <div class="flex flex-col items-end gap-0.5"><span class="text-[0.4rem] lg:text-[0.48rem] font-bold px-1.5 py-0.5 rounded-full bg-surface-2 text-text-secondary">Brouillon</span><span class="text-[0.4rem] lg:text-[0.48rem] text-text-secondary">0 / 200</span></div>
                      </div>
                    </div>
                  </div>
                  <div class="bg-white rounded-[8px] lg:rounded-[10px] border border-border-light overflow-hidden">
                    <div class="px-2.5 lg:px-3.5 py-1.5 lg:py-2 border-b border-border-light">
                      <span class="text-[0.6rem] lg:text-[0.7rem] font-semibold text-text-primary">Activite recente</span>
                    </div>
                    <div class="px-2.5 lg:px-3.5 py-2 flex flex-col">
                      <div class="flex items-start gap-2 py-1.5 border-b border-border-light/60">
                        <div class="w-5 lg:w-6 h-5 lg:h-6 rounded-full bg-green-dim flex items-center justify-center shrink-0 mt-0.5"><svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="#1A6B45" stroke-width="2.5" stroke-linecap="round" class="lg:w-[10px] lg:h-[10px]"><polyline points="20 6 9 17 4 12"/></svg></div>
                        <div class="min-w-0"><div class="text-[0.48rem] lg:text-[0.58rem] text-text-primary">Nouvelle vente - Concert Afrobeats</div><div class="text-[0.4rem] lg:text-[0.48rem] text-text-tertiary">il y a 12 min</div></div>
                      </div>
                      <div class="flex items-start gap-2 py-1.5 border-b border-border-light/60">
                        <div class="w-5 lg:w-6 h-5 lg:h-6 rounded-full bg-orange-dim flex items-center justify-center shrink-0 mt-0.5"><svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="#F05A28" stroke-width="2.5" stroke-linecap="round" class="lg:w-[10px] lg:h-[10px]"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg></div>
                        <div class="min-w-0"><div class="text-[0.48rem] lg:text-[0.58rem] text-text-primary">Evenement publie - Masterclass</div><div class="text-[0.4rem] lg:text-[0.48rem] text-text-tertiary">il y a 2h</div></div>
                      </div>
                      <div class="flex items-start gap-2 py-1.5">
                        <div class="w-5 lg:w-6 h-5 lg:h-6 rounded-full bg-green-dim flex items-center justify-center shrink-0 mt-0.5"><svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="#1A6B45" stroke-width="2.5" stroke-linecap="round" class="lg:w-[10px] lg:h-[10px]"><polyline points="20 6 9 17 4 12"/></svg></div>
                        <div class="min-w-0"><div class="text-[0.48rem] lg:text-[0.58rem] text-text-primary">3 billets VIP vendus - Concert</div><div class="text-[0.4rem] lg:text-[0.48rem] text-text-tertiary">il y a 5h</div></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Mobile : version sans sidebar -->
          <div class="md:hidden font-sans">
            <!-- Header mobile -->
            <div class="bg-white border-b border-border-light px-3 py-2 shrink-0">
              <div class="flex items-center justify-between mb-1">
                <div class="min-w-0">
                  <div class="text-[0.72rem] font-semibold text-text-primary">Vue d'ensemble</div>
                  <div class="text-[0.48rem] text-text-tertiary">Suivez vos performances en temps reel</div>
                </div>
                <div class="bg-orange-primary text-white px-2 py-1 rounded-lg text-[0.55rem] font-bold flex items-center gap-0.5 shrink-0">
                  <svg width="7" height="7" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                  Nouveau
                </div>
              </div>
              <div class="flex bg-surface-2 rounded-md p-0.5 gap-px w-fit">
                <span class="px-1.5 py-0.5 rounded text-[0.45rem] font-semibold text-text-tertiary">7j</span>
                <span class="px-1.5 py-0.5 rounded bg-white text-[0.45rem] font-semibold text-text-primary">30j</span>
                <span class="px-1.5 py-0.5 rounded text-[0.45rem] font-semibold text-text-tertiary">3 mois</span>
                <span class="px-1.5 py-0.5 rounded text-[0.45rem] font-semibold text-text-tertiary">12 mois</span>
              </div>
            </div>
            <!-- Contenu mobile -->
            <div class="p-2.5 bg-bg-primary">
              <!-- Stats 2x2 -->
              <div class="grid grid-cols-2 gap-1.5 mb-2.5">
                <div class="bg-white rounded-[7px] px-2.5 py-2 border border-border-light">
                  <div class="flex items-center justify-between mb-1">
                    <span class="text-[0.48rem] font-semibold text-text-tertiary">Billets vendus</span>
                    <div class="w-4 h-4 rounded bg-orange-dim flex items-center justify-center">
                      <svg width="7" height="7" viewBox="0 0 24 24" fill="none" stroke="#F05A28" stroke-width="2.5" stroke-linecap="round"><path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2z"/><line x1="9" y1="9" x2="9" y2="15"/></svg>
                    </div>
                  </div>
                  <div class="font-serif text-[0.95rem] text-text-primary leading-none">247</div>
                  <div class="text-[0.42rem] text-text-tertiary mt-0.5">depuis 30 jours</div>
                </div>
                <div class="bg-white rounded-[7px] px-2.5 py-2 border border-border-light">
                  <div class="flex items-center justify-between mb-1">
                    <span class="text-[0.48rem] font-semibold text-text-tertiary">Revenus FCFA</span>
                    <div class="w-4 h-4 rounded bg-orange-dim flex items-center justify-center">
                      <svg width="7" height="7" viewBox="0 0 24 24" fill="none" stroke="#F05A28" stroke-width="2.5" stroke-linecap="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
                    </div>
                  </div>
                  <div class="font-serif text-[0.95rem] text-text-primary leading-none">1 850 000</div>
                  <div class="text-[0.42rem] text-text-tertiary mt-0.5">ce mois</div>
                </div>
                <div class="bg-white rounded-[7px] px-2.5 py-2 border border-border-light">
                  <div class="flex items-center justify-between mb-1">
                    <span class="text-[0.48rem] font-semibold text-text-tertiary">Evenements actifs</span>
                    <div class="w-4 h-4 rounded bg-orange-dim flex items-center justify-center">
                      <svg width="7" height="7" viewBox="0 0 24 24" fill="none" stroke="#F05A28" stroke-width="2.5" stroke-linecap="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                    </div>
                  </div>
                  <div class="font-serif text-[0.95rem] text-text-primary leading-none">5</div>
                  <div class="text-[0.42rem] text-text-tertiary mt-0.5">en cours</div>
                </div>
                <div class="bg-white rounded-[7px] px-2.5 py-2 border border-border-light">
                  <div class="flex items-center justify-between mb-1">
                    <span class="text-[0.48rem] font-semibold text-text-tertiary">Participants inscrits</span>
                    <div class="w-4 h-4 rounded bg-orange-dim flex items-center justify-center">
                      <svg width="7" height="7" viewBox="0 0 24 24" fill="none" stroke="#F05A28" stroke-width="2.5" stroke-linecap="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                    </div>
                  </div>
                  <div class="font-serif text-[0.95rem] text-text-primary leading-none">1 024</div>
                  <div class="text-[0.42rem] text-text-tertiary mt-0.5">total cumule</div>
                </div>
              </div>
              <!-- Ventes par evenement mobile -->
              <div class="bg-white rounded-[7px] px-2.5 py-2 border border-border-light mb-2">
                <div class="flex items-center justify-between mb-1.5">
                  <div class="text-[0.58rem] font-semibold text-text-primary">Ventes par evenement</div>
                  <span class="text-[0.45rem] text-orange-primary font-semibold">Voir details</span>
                </div>
                <div class="flex flex-col gap-2">
                  <div>
                    <div class="flex justify-between items-center mb-0.5">
                      <div class="flex items-center gap-1"><div class="w-1.5 h-1.5 rounded-full bg-orange-primary"></div><span class="text-[0.5rem] font-semibold text-text-primary">Concert Afrobeats</span></div>
                      <span class="text-[0.45rem] font-semibold text-orange-primary">72%</span>
                    </div>
                    <div class="h-[3px] rounded-full bg-surface-2 overflow-hidden"><div class="h-full rounded-full bg-orange-primary" style="width: 72%"></div></div>
                  </div>
                  <div>
                    <div class="flex justify-between items-center mb-0.5">
                      <div class="flex items-center gap-1"><div class="w-1.5 h-1.5 rounded-full bg-[#1B2B5E]"></div><span class="text-[0.5rem] font-semibold text-text-primary">Masterclass Digital</span></div>
                      <span class="text-[0.45rem] font-semibold text-[#1B2B5E]">45%</span>
                    </div>
                    <div class="h-[3px] rounded-full bg-surface-2 overflow-hidden"><div class="h-full rounded-full bg-[#1B2B5E]" style="width: 45%"></div></div>
                  </div>
                </div>
              </div>
              <!-- Evenements recents mobile -->
              <div class="bg-white rounded-[7px] px-2.5 py-2 border border-border-light">
                <div class="flex items-center justify-between mb-1.5">
                  <span class="text-[0.58rem] font-semibold text-text-primary">Evenements recents</span>
                  <span class="text-[0.45rem] text-orange-primary font-semibold">Voir tout</span>
                </div>
                <div class="flex flex-col gap-1.5">
                  <div class="flex items-center justify-between p-1.5 rounded-md border border-border-light">
                    <div class="min-w-0"><div class="text-[0.5rem] font-semibold text-text-primary">Concert Afrobeats</div><div class="text-[0.4rem] text-text-tertiary">15 avr. 2026</div></div>
                    <div class="flex flex-col items-end gap-0.5"><span class="text-[0.38rem] font-bold px-1 py-0.5 rounded-full bg-green-dim text-green-dark">En vente</span><span class="text-[0.38rem] text-text-secondary">180 / 250</span></div>
                  </div>
                  <div class="flex items-center justify-between p-1.5 rounded-md border border-border-light">
                    <div class="min-w-0"><div class="text-[0.5rem] font-semibold text-text-primary">Masterclass Digital</div><div class="text-[0.4rem] text-text-tertiary">22 avr. 2026</div></div>
                    <div class="flex flex-col items-end gap-0.5"><span class="text-[0.38rem] font-bold px-1 py-0.5 rounded-full bg-green-dim text-green-dark">En vente</span><span class="text-[0.38rem] text-text-secondary">45 / 100</span></div>
                  </div>
                  <div class="flex items-center justify-between p-1.5 rounded-md border border-border-light">
                    <div class="min-w-0"><div class="text-[0.5rem] font-semibold text-text-primary">Gala de bienfaisance</div><div class="text-[0.4rem] text-text-tertiary">3 mai 2026</div></div>
                    <div class="flex flex-col items-end gap-0.5"><span class="text-[0.38rem] font-bold px-1 py-0.5 rounded-full bg-surface-2 text-text-secondary">Brouillon</span><span class="text-[0.38rem] text-text-secondary">0 / 200</span></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section id="types">
      <div class="py-24 px-5 md:px-10 max-w-[1200px] mx-auto">
        <div class="text-[0.7rem] font-bold tracking-[0.12em] uppercase text-orange-primary mb-2.5 flex items-center gap-2">Types d'événements</div>
        <h2 class="font-serif text-[1.8rem] md:text-[2.2rem] leading-[1.2] text-text-primary mb-3.5">Une plateforme adaptée<br />à tous vos événements</h2>
        <p class="text-[0.92rem] text-text-tertiary leading-[1.7] max-w-[520px]">Que votre événement soit présentiel ou en ligne, payant ou gratuit, BilletEvent s'adapte à toutes les situations.</p>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-14">
          <div
            v-for="(t, i) in eventTypes"
            :key="i"
            class="rounded-[14px] p-6 border border-border-light bg-white transition-all duration-200 cursor-default hover:border-orange-primary hover:bg-orange-dim hover:-translate-y-0.5 group"
          >
            <div class="w-10 h-10 rounded-[9px] bg-bg-primary flex items-center justify-center text-orange-primary mb-3.5 transition-all duration-200 group-hover:bg-orange-primary group-hover:text-white">
              <svg v-if="t.icon==='location'" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
              <svg v-else-if="t.icon==='ticket'" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2z"/></svg>
              <svg v-else-if="t.icon==='monitor'" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
              <svg v-else-if="t.icon==='phone'" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.18 2 2 0 0 1 3.6 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 8.91a16 16 0 0 0 6 6l.77-.77a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
              <svg v-else-if="t.icon==='mic'" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>
              <svg v-else-if="t.icon==='users'" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
            </div>
            <div class="text-[0.9rem] font-bold text-text-primary mb-1">{{ t.name }}</div>
            <div class="text-[0.78rem] text-text-tertiary leading-[1.5]">{{ t.desc }}</div>
          </div>
        </div>
      </div>
    </section>

    <section id="temoignages">
      <div class="py-24 px-5 md:px-10 bg-white">
        <div class="max-w-[1100px] mx-auto">
          <div class="text-center mb-12">
            <div class="text-[0.7rem] font-bold tracking-[0.12em] uppercase text-orange-primary mb-2.5 flex items-center justify-center gap-2">Témoignages clients</div>
            <h2 class="font-serif text-[1.8rem] md:text-[2.2rem] leading-[1.2] text-text-primary mb-3.5">Une plateforme conçue<br />pour <em class="italic text-text-primary">vos événements</em></h2>
            <p class="text-[0.92rem] text-text-tertiary leading-[1.7] max-w-[520px] mx-auto text-center">BilletEvent vous permet de créer, organiser, gérer et vendre des événements de tous types.</p>
          </div>
          <div class="grid grid-cols-1 md:grid-cols-[2fr_3fr] gap-4 items-stretch">
            <div class="bg-orange-primary rounded-[14px] p-7 md:p-8 flex flex-col justify-between">
              <div class="font-serif text-[1.1rem] leading-[1.65] text-white mb-7 flex-1">"{{ testimonials[0].quote }}"</div>
              <div class="flex items-center gap-2.5">
                <div class="w-9 h-9 rounded-full bg-white/15 flex items-center justify-center text-[0.72rem] font-bold text-white shrink-0">{{ testimonials[0].initials }}</div>
                <div>
                  <div class="text-[0.82rem] font-bold text-white">{{ testimonials[0].name }}</div>
                  <div class="text-[0.72rem] text-white/55">{{ testimonials[0].role }}</div>
                </div>
              </div>
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div
                v-for="(t, i) in testimonials.slice(1)"
                :key="i"
                class="bg-bg-primary border border-border-light rounded-[14px] p-7 flex flex-col justify-between"
              >
                <div class="text-[0.85rem] leading-[1.7] text-text-secondary italic mb-5 flex-1">"{{ t.quote }}"</div>
                <div class="flex items-center gap-2.5">
                  <div :class="['w-9 h-9 rounded-full flex items-center justify-center text-[0.72rem] font-bold shrink-0', t.avatarClass || 'bg-surface-2 text-text-secondary']">{{ t.initials }}</div>
                  <div>
                    <div class="text-[0.82rem] font-bold text-text-primary">{{ t.name }}</div>
                    <div class="text-[0.72rem] text-text-tertiary">{{ t.role }}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section id="faq">
      <div class="py-24 px-5 md:px-10 max-w-[800px] mx-auto">
        <div class="text-center mb-0">
          <div class="text-[0.7rem] font-bold tracking-[0.12em] uppercase text-orange-primary mb-2.5 flex items-center justify-center gap-2">Questions fréquentes</div>
          <h2 class="font-serif text-[1.8rem] md:text-[2.2rem] leading-[1.2] text-text-primary mb-3.5">Tout ce que vous voulez savoir</h2>
          <p class="text-[0.92rem] text-text-tertiary leading-[1.7] max-w-[520px] mx-auto">Tout ce qu'il faut savoir pour organiser et vendre vos événements avec BilletEvent.</p>
        </div>
        <div class="mt-12 flex flex-col">
          <div v-for="(faq, i) in faqItems" :key="i" class="border-b border-border-light" :class="{ 'border-t': i === 0 }">
            <button
              class="w-full flex items-center justify-between py-[18px] text-[0.92rem] font-semibold text-left gap-4 cursor-pointer transition-colors duration-150"
              :class="openFaq === i ? 'text-orange-primary' : 'text-text-primary hover:text-orange-primary'"
              @click="toggleFaq(i)"
            >
              {{ faq.q }}
              <div
                class="w-[22px] h-[22px] rounded-full border-[1.5px] shrink-0 flex items-center justify-center transition-all duration-200"
                :class="openFaq === i ? 'bg-orange-primary border-orange-primary text-white rotate-45' : 'border-border-medium text-text-tertiary'"
              >
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              </div>
            </button>
            <div v-if="openFaq === i" class="pb-[18px] text-[0.88rem] leading-[1.7] text-text-tertiary">{{ faq.a }}</div>
          </div>
        </div>
        <div class="mt-8 text-center">
          <NuxtLink to="/faq" class="inline-flex items-center gap-2 text-[0.88rem] font-semibold text-orange-primary hover:underline">
            Voir toutes les questions
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
          </NuxtLink>
        </div>
      </div>
    </section>

    <section>
      <div class="px-5 md:px-10 py-10">
        <div class="px-5 md:px-14 py-16 md:py-20 bg-gradient-to-br from-blue-main to-[#2E3F7A] max-w-[1100px] mx-auto rounded-[28px] relative overflow-hidden">
          <div class="absolute -top-[120px] -right-[80px] w-[400px] h-[400px] rounded-full bg-orange-primary/12"></div>
          <div class="absolute -bottom-[100px] -left-[60px] w-[300px] h-[300px] rounded-full bg-white/4"></div>
          <div class="max-w-[700px] mx-auto text-center relative z-[1]">
            <h2 class="font-serif text-[2rem] md:text-[2.8rem] leading-[1.15] text-white mb-4 tracking-tight">Prêt à organiser<br /><em class="italic text-orange-light">votre prochain événement ?</em></h2>
            <p class="text-[0.95rem] text-white/60 mb-9 leading-[1.7]">Rejoignez les organisateurs qui font confiance à BilletEvent pour vendre leurs billets et gérer leurs participants en toute simplicité.</p>
            <div class="flex items-center justify-center gap-8 mb-10 flex-wrap">
              <div class="text-center">
                <div class="w-10 h-10 rounded-full bg-white/10 border-2 border-white/20 flex items-center justify-center font-serif text-base text-white mx-auto mb-2">1</div>
                <div class="text-[0.72rem] text-white/50 font-semibold">Créez votre événement</div>
              </div>
              <div class="w-10 h-px bg-white/15 hidden sm:block"></div>
              <div class="text-center">
                <div class="w-10 h-10 rounded-full bg-white/10 border-2 border-white/20 flex items-center justify-center font-serif text-base text-white mx-auto mb-2">2</div>
                <div class="text-[0.72rem] text-white/50 font-semibold">Configurez vos billets</div>
              </div>
              <div class="w-10 h-px bg-white/15 hidden sm:block"></div>
              <div class="text-center">
                <div class="w-10 h-10 rounded-full bg-white/10 border-2 border-white/20 flex items-center justify-center font-serif text-base text-white mx-auto mb-2">3</div>
                <div class="text-[0.72rem] text-white/50 font-semibold">Vendez en ligne</div>
              </div>
            </div>
            <div class="flex items-center justify-center gap-3 flex-wrap">
              <NuxtLink to="/auth/register" class="bg-white text-text-primary px-8 py-3.5 rounded-full text-[0.9rem] font-bold transition-all duration-200 inline-flex items-center gap-2 hover:bg-bg-primary hover:-translate-y-0.5 ">
                Commencer maintenant
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
              </NuxtLink>
            </div>
          </div>
        </div>
      </div>
    </section>

    <div class="bg-transparent py-8 px-5 md:px-10 pb-15 flex flex-col items-center gap-4">
      <span class="text-[0.7rem] font-bold tracking-[0.1em] uppercase text-text-tertiary flex items-center gap-2">
        <span class="w-1.5 h-1.5 rounded-full bg-text-tertiary inline-block"></span>
        Paiements acceptés
      </span>
      <div class="flex items-center gap-3 flex-wrap justify-center">
        <div class="bg-white border-[1.5px] border-border-light rounded-[10px] px-5 h-11 flex items-center gap-2 text-[0.82rem] font-extrabold text-text-secondary tracking-tight hover:border-border-medium transition-all duration-150">
          <svg width="42" height="14" viewBox="0 0 42 14" xmlns="http://www.w3.org/2000/svg"><text x="0" y="13" font-family="Arial, sans-serif" font-weight="900" font-style="italic" font-size="15" fill="#1A1F71">VISA</text></svg>
        </div>
        <div class="bg-white border-[1.5px] border-border-light rounded-[10px] px-5 h-11 flex items-center gap-2 text-[0.82rem] font-extrabold text-text-secondary tracking-tight hover:border-border-medium transition-all duration-150">
          <svg width="34" height="22" viewBox="0 0 34 22" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="11" r="10" fill="#EB001B"/><circle cx="22" cy="11" r="10" fill="#F79E1B"/><path d="M17 3.8a10 10 0 0 1 0 14.4A10 10 0 0 1 17 3.8z" fill="#FF5F00"/></svg>
          <span class="text-[0.72rem] font-bold text-[#252525]">Mastercard</span>
        </div>
        <div class="bg-white border-[1.5px] border-border-light rounded-[10px] px-5 h-11 flex items-center gap-2 text-[0.82rem] font-extrabold text-text-secondary tracking-tight hover:border-border-medium transition-all duration-150">
          <svg width="14" height="18" viewBox="0 0 14 18" xmlns="http://www.w3.org/2000/svg"><path d="M11.5 2C11.5 5 9.5 6.5 6.5 6.5H4.5L3.2 14H1L3 1H8C10 1 11.5 1.6 11.5 2Z" fill="#009CDE"/><path d="M13 3.5C13 6.5 11 8 8 8H6L4.7 15.5H2.5L4.5 2.5H9.5C11.5 2.5 13 3.1 13 3.5Z" fill="#003087" opacity="0.85"/></svg>
          <span class="font-extrabold text-[0.85rem]"><span class="text-[#003087]">Pay</span><span class="text-[#009CDE]">Pal</span></span>
        </div>
        <div class="bg-white border-[1.5px] border-border-light rounded-[10px] px-5 h-11 flex items-center gap-2 text-[0.82rem] font-extrabold text-text-secondary tracking-tight hover:border-border-medium transition-all duration-150">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#8A93B2" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg>
          <span class="font-bold text-text-secondary text-[0.8rem]">Mobiles Money</span>
        </div>
      </div>
    </div>
  </div>
</template>
