<script setup lang="ts">
definePageMeta({ layout: 'default' })

useSeoMeta({
  title: 'À propos | BilletEvent',
  description: 'Découvrez BilletEvent, la plateforme de billetterie conçue pour l\'Afrique de l\'Ouest.',
})

const missions = [
  {
    title: 'Simplifier la publication',
    desc: 'Nous rendons la création et la publication de vos événements aussi simple que possible, en quelques clics.',
    icon: 'rocket',
  },
  {
    title: 'Sécuriser les transactions',
    desc: 'Chaque paiement est protégé par des protocoles de sécurité avancés pour garantir la confiance de vos participants.',
    icon: 'shield',
  },
  {
    title: 'Support réactif',
    desc: 'Notre équipe vous accompagne à chaque étape, avec un support humain disponible et professionnel.',
    icon: 'headset',
  },
]

const solutions = [
  {
    title: 'Une marketplace active 24/7',
    desc: 'Vendez vos billets en continu via notre marketplace multicanal : site web, WhatsApp et points de vente physiques. Vos événements sont accessibles partout, tout le temps.',
    icon: 'globe',
  },
  {
    title: 'Des fonctionnalités complètes',
    desc: 'Gestion des stocks de billets, suivi des ventes en temps réel, promotions ciblées, invitations VIP et presse — tout est intégré dans une plateforme intuitive.',
    icon: 'tools',
  },
  {
    title: 'Une expertise reconnue',
    desc: 'Des milliers d\'utilisateurs nous font déjà confiance. BilletEvent est la référence n°1 de la billetterie événementielle en Afrique de l\'Ouest.',
    icon: 'trophy',
  },
]

const values = [
  { title: 'Innovation', desc: 'Nous repoussons les limites de la technologie pour offrir des solutions toujours plus performantes.', icon: 'bulb' },
  { title: 'Passion', desc: 'Chaque événement est unique. Nous mettons notre passion au service de votre succès.', icon: 'heart' },
  { title: 'Confiance', desc: 'La transparence et la fiabilité sont au cœur de chacune de nos interactions.', icon: 'trust' },
]

const partners = [
  'AfriEvents', 'KolaBiz', 'Sunu Festival', 'DakarNights',
  'AbidjanLive', 'Festival Maquis', 'Bamako Expo', 'CotoFest',
]
</script>

<template>
  <div>
    <section class="bg-bg-primary">
      <div class="px-5 md:px-10 pt-20 pb-16 max-w-[1200px] mx-auto text-center">
        <h1 class="font-serif text-4xl md:text-5xl text-blue-main leading-tight mb-5">
          Bien plus que de la billetterie,<br />une <em class="italic text-orange-primary">expérience</em>
        </h1>
        <p class="text-text-secondary text-lg max-w-[640px] mx-auto leading-relaxed">
          BilletEvent accompagne les organisateurs d'événements avec une plateforme complète et fiable, conçue pour l'Afrique. De la création à la vente, nous simplifions chaque étape.
        </p>
      </div>
    </section>

    <section>
      <div class="px-5 md:px-10 py-20 max-w-[1200px] mx-auto">
        <div class="text-center mb-14">
          <div class="text-xs font-bold tracking-widest uppercase text-orange-primary mb-2.5">Notre mission</div>
          <h2 class="font-serif text-3xl md:text-4xl leading-tight text-text-primary">Ce qui nous anime au quotidien</h2>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div v-for="(m, i) in missions" :key="i" class="border border-border-light rounded-xl p-6">
            <div class="text-orange-primary mb-4">
              <svg v-if="m.icon === 'rocket'" class="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/><path d="M12 15l-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/><path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"/><path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"/></svg>
              <svg v-else-if="m.icon === 'shield'" class="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><polyline points="9 12 11 14 15 10"/></svg>
              <svg v-else-if="m.icon === 'headset'" class="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 18v-6a9 9 0 0 1 18 0v6"/><path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3z"/><path d="M3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"/></svg>
            </div>
            <h3 class="font-semibold text-lg text-text-primary mb-2">{{ m.title }}</h3>
            <p class="text-sm text-text-secondary leading-relaxed">{{ m.desc }}</p>
          </div>
        </div>
      </div>
    </section>

    <section class="bg-white">
      <div class="px-5 md:px-10 py-20 max-w-[1200px] mx-auto">
        <div class="text-center mb-14">
          <div class="text-xs font-bold tracking-widest uppercase text-orange-primary mb-2.5">Notre solution</div>
          <h2 class="font-serif text-3xl md:text-4xl leading-tight text-text-primary">Pourquoi choisir BilletEvent</h2>
        </div>
        <div class="flex flex-col gap-16">
          <div
            v-for="(s, i) in solutions"
            :key="i"
            class="grid grid-cols-1 md:grid-cols-2 gap-10 items-center"
          >
            <div :class="{ 'md:order-2': i % 2 === 1 }">
              <div class="text-orange-primary mb-4">
                <svg v-if="s.icon === 'globe'" class="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
                <svg v-else-if="s.icon === 'tools'" class="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>
                <svg v-else-if="s.icon === 'trophy'" class="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/></svg>
              </div>
              <h3 class="font-serif text-xl md:text-2xl text-text-primary mb-3">{{ s.title }}</h3>
              <p class="text-sm text-text-secondary leading-relaxed">{{ s.desc }}</p>
            </div>
            <div :class="{ 'md:order-1': i % 2 === 1 }">
              <div class="aspect-[4/3] rounded-xl bg-bg-surface flex items-center justify-center border border-border-light">
                <div class="text-orange-primary">
                  <svg v-if="s.icon === 'globe'" class="w-16 h-16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
                  <svg v-else-if="s.icon === 'tools'" class="w-16 h-16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>
                  <svg v-else-if="s.icon === 'trophy'" class="w-16 h-16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/></svg>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section>
      <div class="px-5 md:px-10 py-20 max-w-[1200px] mx-auto">
        <div class="text-center mb-14">
          <div class="text-xs font-bold tracking-widest uppercase text-orange-primary mb-2.5">Nos valeurs</div>
          <h2 class="font-serif text-3xl md:text-4xl leading-tight text-text-primary">Ce en quoi nous croyons</h2>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div v-for="(v, i) in values" :key="i" class="border border-border-light rounded-xl p-6 text-center">
            <div class="text-orange-primary mx-auto mb-4 flex justify-center">
              <svg v-if="v.icon === 'bulb'" class="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18h6"/><path d="M10 22h4"/><path d="M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0 0 18 8 6 6 0 0 0 6 8c0 1 .23 2.23 1.5 3.5A4.61 4.61 0 0 1 8.91 14"/></svg>
              <svg v-else-if="v.icon === 'heart'" class="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
              <svg v-else-if="v.icon === 'trust'" class="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
            </div>
            <h3 class="font-semibold text-lg text-text-primary mb-2">{{ v.title }}</h3>
            <p class="text-sm text-text-secondary leading-relaxed">{{ v.desc }}</p>
          </div>
        </div>
      </div>
    </section>

    <section class="bg-white">
      <div class="px-5 md:px-10 py-20 max-w-[1200px] mx-auto">
        <div class="text-center mb-14">
          <div class="text-xs font-bold tracking-widest uppercase text-orange-primary mb-2.5">Partenaires</div>
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
              Prêt à lancer<br />votre <em class="italic text-orange-primary">événement ?</em>
            </h2>
            <p class="text-base text-text-secondary mb-9 leading-relaxed">
              Rejoignez les milliers d'organisateurs qui font confiance à BilletEvent pour créer et vendre leurs événements.
            </p>
            <div class="flex items-center justify-center gap-3 flex-wrap">
              <NuxtLink to="/dashboard/events/create" class="bg-orange-primary text-white px-8 py-3.5 rounded-full text-sm font-bold transition-colors duration-200 inline-flex items-center gap-2 hover:bg-orange-light">
                Organiser un événement
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
              </NuxtLink>
              <NuxtLink to="/events" class="border border-border-light text-text-primary px-8 py-3.5 rounded-full text-sm font-bold transition-colors duration-200 inline-flex items-center gap-2 hover:bg-bg-primary">
                Découvrir les événements
              </NuxtLink>
            </div>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>
