<script setup lang="ts">
definePageMeta({ layout: 'dashboard', middleware: ['auth', 'organizer'] })
</script>

<template>
  <div>
    <UiPageHeader title="Support" subtitle="Besoin d'aide ? Contactez notre équipe" />

    <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
      <!-- Carte Email -->
      <div class="bg-surface border border-border-light rounded-xl p-8 flex flex-col items-center text-center">
        <div class="mb-4">
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="var(--color-orange-primary, #E8590C)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <rect x="2" y="4" width="20" height="16" rx="2" />
            <path d="M22 7l-10 7L2 7" />
          </svg>
        </div>
        <h3 class="font-serif text-lg text-text-primary mb-1">Email</h3>
        <p class="text-sm text-text-secondary mb-4">support@billetevent.online</p>
        <a
          href="mailto:support@billetevent.online"
          class="px-6 py-2.5 rounded-lg text-sm font-semibold bg-orange-primary text-white hover:bg-orange-light transition-colors"
        >
          Envoyer un email
        </a>
      </div>

      <!-- Carte WhatsApp -->
      <div class="bg-surface border border-border-light rounded-xl p-8 flex flex-col items-center text-center">
        <div class="mb-4">
          <svg width="36" height="36" viewBox="0 0 24 24" fill="#25D366">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
            <path d="M12 0C5.373 0 0 5.373 0 12c0 2.134.558 4.133 1.528 5.875L.057 23.5a.5.5 0 00.61.61l5.794-1.497A11.95 11.95 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.793 9.793 0 01-5.017-1.381l-.36-.214-3.732.963.993-3.642-.235-.374A9.789 9.789 0 012.182 12C2.182 6.57 6.57 2.182 12 2.182S21.818 6.57 21.818 12 17.43 21.818 12 21.818z"/>
          </svg>
        </div>
        <h3 class="font-serif text-lg text-text-primary mb-1">WhatsApp</h3>
        <p class="text-sm text-text-secondary mb-4">+229 0168295838</p>
        <a
          href="https://wa.me/2290168295838"
          target="_blank"
          class="px-6 py-2.5 rounded-lg text-sm font-semibold bg-[#25D366] text-white hover:bg-[#20BD5A] transition-colors"
        >
          Ouvrir WhatsApp
        </a>
      </div>
    </div>
  </div>
</template>
