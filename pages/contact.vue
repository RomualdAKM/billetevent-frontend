<script setup lang="ts">
definePageMeta({ layout: 'default' })

useSeoMeta({
  title: 'Contact | BilletEvent',
  description: 'Contactez l\'équipe BilletEvent. Nous sommes là pour vous aider.',
})

const { success, error } = useNotification()
const { sendContactMessage } = usePublicApi()

const subjects = [
  'Question sur un événement',
  'Proposition de partenariat',
  'Problème technique',
  'Problème d\'accès ou de billet',
  'Question sur le paiement',
  'Autre',
]

const form = ref({
  name: '',
  email: '',
  subject: '',
  message: '',
  newsletter: false,
})

const errors = ref({})
const loading = ref(false)

function validate() {
  const e = {}
  if (!form.value.name.trim()) e.name = 'Le nom est requis'
  if (!form.value.email.trim()) e.email = 'L\'email est requis'
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.value.email)) e.email = 'Email invalide'
  if (!form.value.subject) e.subject = 'Le sujet est requis'
  if (!form.value.message.trim()) e.message = 'Le message est requis'
  errors.value = e
  return Object.keys(e).length === 0
}

async function handleSubmit() {
  if (!validate()) return
  loading.value = true
  try {
    await sendContactMessage({
      name: form.value.name,
      email: form.value.email,
      subject: form.value.subject,
      message: form.value.message
    })
    success('Votre message a été envoyé. Nous vous répondrons dans les plus brefs délais.')
    form.value = { name: '', email: '', subject: '', message: '', newsletter: false }
    errors.value = {}
  } catch (err) {
    error(err?.message || err?.data?.message || 'Erreur lors de l\'envoi du message')
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div>
    <section class="bg-bg-primary">
      <div class="px-5 md:px-10 pt-20 pb-16 max-w-[1200px] mx-auto text-center">
        <h1 class="font-serif text-4xl md:text-5xl text-blue-main leading-tight mb-5">Contactez-nous</h1>
        <p class="text-text-secondary text-lg max-w-[560px] mx-auto leading-relaxed">
          Notre équipe est disponible pour répondre à toutes vos questions et vous accompagner.
        </p>
      </div>
    </section>

    <section>
      <div class="px-5 md:px-10 py-12 max-w-[1200px] mx-auto grid grid-cols-1 md:grid-cols-2 gap-6">
        <div class="border border-border-light rounded-xl p-6">
          <div class="text-orange-primary mb-4">
            <svg class="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
          </div>
          <h3 class="font-semibold text-lg text-text-primary mb-2">Besoin d'une réponse rapide ?</h3>
          <p class="text-sm text-text-secondary leading-relaxed mb-6">Notre centre d'aide regroupe les réponses aux questions les plus fréquentes sur la billetterie, les paiements et l'organisation d'événements.</p>
          <NuxtLink to="/faq" class="bg-orange-primary text-white px-6 py-3 rounded-full text-sm font-bold inline-flex items-center gap-2 transition-colors duration-200 hover:bg-orange-light">
            Consulter la FAQ
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
          </NuxtLink>
        </div>

        <div class="border border-border-light rounded-xl p-6">
          <div class="text-orange-primary mb-4">
            <svg class="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>
          </div>
          <h3 class="font-semibold text-lg text-text-primary mb-2">Organisateur d'événement ?</h3>
          <p class="text-sm text-text-secondary leading-relaxed mb-6">Échangez directement avec un conseiller sur WhatsApp pour obtenir de l'aide à la création et la gestion de votre événement.</p>
          <a href="https://wa.me/221770000000" target="_blank" class="bg-orange-primary text-white px-6 py-3 rounded-full text-sm font-bold inline-flex items-center gap-2 transition-colors duration-200 hover:bg-orange-light">
            Contacter un conseiller
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
          </a>
        </div>
      </div>
    </section>

    <section class="bg-white">
      <div class="px-5 md:px-10 py-20 max-w-[760px] mx-auto">
        <div>
          <div>
            <h2 class="font-serif text-3xl md:text-4xl leading-tight text-text-primary mb-8">Écrivez-nous directement</h2>
            <form @submit.prevent="handleSubmit" class="flex flex-col gap-5">
              <div>
                <label class="block text-xs font-semibold text-text-primary mb-1.5">Votre nom *</label>
                <input
                  v-model="form.name"
                  type="text"
                  autocomplete="name"
                  placeholder="Awa Diallo"
                  class="w-full px-4 py-3 rounded-xl border border-border-light bg-bg-primary text-text-primary text-sm outline-none transition-colors duration-200 focus:border-orange-primary focus:ring-2 focus:ring-orange-primary/10"
                />
                <span v-if="errors.name" class="text-xs text-red-error mt-1">{{ errors.name }}</span>
              </div>
              <div>
                <label class="block text-xs font-semibold text-text-primary mb-1.5">Votre email *</label>
                <input
                  v-model="form.email"
                  type="email"
                  autocomplete="email"
                  inputmode="email"
                  placeholder="awa@exemple.com"
                  class="w-full px-4 py-3 rounded-xl border border-border-light bg-bg-primary text-text-primary text-sm outline-none transition-colors duration-200 focus:border-orange-primary focus:ring-2 focus:ring-orange-primary/10"
                />
                <span v-if="errors.email" class="text-xs text-red-error mt-1">{{ errors.email }}</span>
              </div>
              <div>
                <label class="block text-xs font-semibold text-text-primary mb-1.5">Sujet *</label>
                <select
                  v-model="form.subject"
                  class="w-full px-4 py-3 rounded-xl border border-border-light bg-bg-primary text-text-primary text-sm outline-none transition-colors duration-200 focus:border-orange-primary focus:ring-2 focus:ring-orange-primary/10"
                >
                  <option value="" disabled>Sélectionnez un sujet</option>
                  <option v-for="s in subjects" :key="s" :value="s">{{ s }}</option>
                </select>
                <span v-if="errors.subject" class="text-xs text-red-error mt-1">{{ errors.subject }}</span>
              </div>
              <div>
                <label class="block text-xs font-semibold text-text-primary mb-1.5">Votre message *</label>
                <textarea
                  v-model="form.message"
                  rows="5"
                  placeholder="Décrivez votre demande..."
                  class="w-full px-4 py-3 rounded-xl border border-border-light bg-bg-primary text-text-primary text-sm outline-none transition-colors duration-200 focus:border-orange-primary focus:ring-2 focus:ring-orange-primary/10 resize-none"
                ></textarea>
                <span v-if="errors.message" class="text-xs text-red-error mt-1">{{ errors.message }}</span>
              </div>
              <label class="flex items-center gap-2.5 cursor-pointer">
                <input v-model="form.newsletter" type="checkbox" class="w-4 h-4 rounded border-border-light accent-orange-primary" />
                <span class="text-xs text-text-secondary">S'inscrire à la newsletter</span>
              </label>
              <p class="text-xs text-text-tertiary">
                En envoyant ce message, vous acceptez notre
                <NuxtLink to="/privacy" class="text-orange-primary underline">Politique de confidentialité</NuxtLink>.
              </p>
              <button type="submit" :disabled="loading" class="bg-orange-primary text-white px-8 py-3.5 rounded-full text-sm font-bold transition-colors duration-200 inline-flex items-center gap-2 self-start hover:bg-orange-light cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed">
                Envoyer
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
              </button>
            </form>
          </div>

        </div>
      </div>
    </section>
  </div>
</template>
