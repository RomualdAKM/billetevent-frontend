<template>
  <footer id="contact" class="bg-blue-main text-white/70 pt-15 pb-8 px-5 md:px-10">
    <div class="max-w-[1200px] mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_1fr] gap-8 lg:gap-12 pb-12 border-b border-white/10 mb-8">
      <div>
        <div class="flex items-center gap-2.5 text-[1.1rem] font-bold text-white mb-3.5">
          <NuxtImg src="/logo.png" alt="BilletEvent" class="h-[80px] w-auto" :width="80" :height="80" loading="lazy" :placeholder="[20, 20]" />
        </div>
        <p class="text-sm leading-[1.7] text-white/50 max-w-[260px]">Billetterie en ligne pour concerts, conférences, formations et soirées en Afrique francophone.</p>
        <div class="flex gap-3 mt-5">
          <a href="https://facebook.com/billetevent" target="_blank" rel="noopener noreferrer" aria-label="BilletEvent sur Facebook" class="w-8 h-8 rounded-lg bg-white/8 flex items-center justify-center text-white/50 hover:bg-white/15 hover:text-white transition-all duration-150">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>
          </a>
          <a href="https://twitter.com/billetevent" target="_blank" rel="noopener noreferrer" aria-label="BilletEvent sur X (Twitter)" class="w-8 h-8 rounded-lg bg-white/8 flex items-center justify-center text-white/50 hover:bg-white/15 hover:text-white transition-all duration-150">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z"/></svg>
          </a>
          <a href="https://instagram.com/billetevent" target="_blank" rel="noopener noreferrer" aria-label="BilletEvent sur Instagram" class="w-8 h-8 rounded-lg bg-white/8 flex items-center justify-center text-white/50 hover:bg-white/15 hover:text-white transition-all duration-150">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><rect x="2" y="2" width="20" height="20" rx="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>
          </a>
          <a href="https://tiktok.com/@billetevent" target="_blank" rel="noopener noreferrer" aria-label="BilletEvent sur TikTok" class="w-8 h-8 rounded-lg bg-white/8 flex items-center justify-center text-white/50 hover:bg-white/15 hover:text-white transition-all duration-150">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1 0-5.78 2.92 2.92 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 3 15.57 6.33 6.33 0 0 0 9.37 22a6.33 6.33 0 0 0 6.37-6.22V9.4a8.16 8.16 0 0 0 3.85.96V7.11a4.85 4.85 0 0 1-0-.42z"/></svg>
          </a>
          <a href="https://linkedin.com/company/billetevent" target="_blank" rel="noopener noreferrer" aria-label="BilletEvent sur LinkedIn" class="w-8 h-8 rounded-lg bg-white/8 flex items-center justify-center text-white/50 hover:bg-white/15 hover:text-white transition-all duration-150">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/></svg>
          </a>
          <a href="https://discord.gg/billetevent" target="_blank" rel="noopener noreferrer" aria-label="BilletEvent sur Discord" class="w-8 h-8 rounded-lg bg-white/8 flex items-center justify-center text-white/50 hover:bg-white/15 hover:text-white transition-all duration-150">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M21 2H3v16h5v4l4-4h5l4-4V2zm-10 9H8V7h3v4zm5 0h-3V7h3v4z"/></svg>
          </a>
        </div>
      </div>

      <div>
        <div class="text-xs font-bold tracking-[0.1em] uppercase text-white/40 mb-4">Produit</div>
        <ul class="flex flex-col gap-2.5 list-none">
          <li><NuxtLink to="/events" class="text-sm text-white/60 hover:text-white transition-colors duration-150">Événements</NuxtLink></li>
          <li><NuxtLink to="/dashboard/events/create" class="text-sm text-white/60 hover:text-white transition-colors duration-150">Créer un événement</NuxtLink></li>
          <li><NuxtLink to="/pricing" class="text-sm text-white/60 hover:text-white transition-colors duration-150">Tarifs</NuxtLink></li>
          <!-- <li><NuxtLink to="/points-de-vente" class="text-sm text-white/60 hover:text-white transition-colors duration-150">Points de vente</NuxtLink></li> -->
        </ul>
      </div>

      <div>
        <div class="text-xs font-bold tracking-[0.1em] uppercase text-white/40 mb-4">Entreprise</div>
        <ul class="flex flex-col gap-2.5 list-none">
          <li><NuxtLink to="/about" class="text-sm text-white/60 hover:text-white transition-colors duration-150">À propos</NuxtLink></li>
          <li><NuxtLink to="/contact" class="text-sm text-white/60 hover:text-white transition-colors duration-150">Nous contacter</NuxtLink></li>
          <li><NuxtLink to="/social" class="text-sm text-white/60 hover:text-white transition-colors duration-150">Réseaux sociaux</NuxtLink></li>
          <li><NuxtLink to="/faq" class="text-sm text-white/60 hover:text-white transition-colors duration-150">FAQ</NuxtLink></li>
        </ul>
      </div>

      <div>
        <div class="text-xs font-bold tracking-[0.1em] uppercase text-white/40 mb-4">Légal</div>
        <ul class="flex flex-col gap-2.5 list-none">
          <li><NuxtLink to="/legal/cgv" class="text-sm text-white/60 hover:text-white transition-colors duration-150">CGV</NuxtLink></li>
          <li><NuxtLink to="/legal/cgu" class="text-sm text-white/60 hover:text-white transition-colors duration-150">CGU</NuxtLink></li>
          <li><NuxtLink to="/legal/privacy" class="text-sm text-white/60 hover:text-white transition-colors duration-150">Confidentialité</NuxtLink></li>
          <li><NuxtLink to="/legal/mentions" class="text-sm text-white/60 hover:text-white transition-colors duration-150">Mentions légales</NuxtLink></li>
          <li><NuxtLink to="/legal/charte" class="text-sm text-white/60 hover:text-white transition-colors duration-150">Charte</NuxtLink></li>
        </ul>
      </div>
    </div>

    <div class="max-w-[1200px] mx-auto flex items-center justify-center flex-wrap gap-3">
      <div class="text-xs text-white/35">&copy; 2025 BilletEvent &middot; Tous droits réservés.</div>
    </div>
  </footer>
</template>
