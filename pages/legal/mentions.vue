<script setup lang="ts">
definePageMeta({ layout: 'default' })

useSeoMeta({
  title: 'Mentions légales | BilletEvent',
  description: 'Consultez les mentions légales de la plateforme BilletEvent.',
})

const lastUpdate = '1er avril 2026'

const sections = [
  {
    title: '1. Éditeur du site',
    content: `Le site www.billetevent.com est édité par :\n\nBilletEvent SAS\nSociété par Actions Simplifiée au capital de 5 000 000 FCFA\nSiège social : Immeuble Keur Gorgui, 5ème étage, Rue KG-28, Dakar, Sénégal\nRCCM : SN-DKR-2024-B-12345\nNINEA : 12345678 2G3\nTéléphone : +221 33 800 00 00\nEmail : contact@billetevent.com`
  },
  {
    title: '2. Directeur de la publication',
    content: `Le directeur de la publication du site www.billetevent.com est M. Amadou Diallo, en sa qualité de Président Directeur Général de BilletEvent SAS.\n\nContact : direction@billetevent.com`
  },
  {
    title: '3. Hébergement',
    content: `Le site www.billetevent.com est hébergé par :\n\nVercel Inc.\n340 S Lemon Ave #4133\nWalnut, CA 91789\nÉtats-Unis\nSite web : www.vercel.com\n\nLes données utilisateurs sont stockées sur des serveurs sécurisés conformes aux normes internationales de protection des données.`
  },
  {
    title: '4. Propriété intellectuelle',
    content: `L'ensemble du contenu du site www.billetevent.com est protégé par les lois sénégalaises et internationales relatives à la propriété intellectuelle.\n\nLe nom "BilletEvent", le logo, la charte graphique, les textes, illustrations, images, sons, vidéos et tout autre élément composant le site sont la propriété exclusive de BilletEvent SAS ou font l'objet d'une autorisation d'utilisation.\n\nToute reproduction, représentation, diffusion ou redistribution totale ou partielle du contenu de ce site, par quelque procédé que ce soit, sans l'autorisation expresse et préalable de BilletEvent SAS, est interdite et constitue une contrefaçon sanctionnée par les articles du Code de la propriété intellectuelle.`
  },
  {
    title: '5. Crédits',
    content: `Conception et développement : Équipe technique BilletEvent\nDesign UI/UX : Équipe design BilletEvent\nPhotographies : les images utilisées sur la plateforme proviennent de banques d'images libres de droits (Unsplash, Pexels) ou sont la propriété de BilletEvent SAS et de ses utilisateurs organisateurs.\nIconographie : Feather Icons, sous licence MIT.\nPolices : DM Sans et DM Serif Display, sous licence Open Font (Google Fonts).`
  },
  {
    title: '6. Contact',
    content: `Pour toute question, suggestion ou réclamation, vous pouvez contacter BilletEvent par les moyens suivants :\n\n• Email : contact@billetevent.com\n• Téléphone : +221 33 800 00 00\n• WhatsApp : +221 77 800 00 00\n• Adresse postale : BilletEvent SAS, Immeuble Keur Gorgui, 5ème étage, Rue KG-28, Dakar, Sénégal\n• Horaires du support : du lundi au vendredi, de 9h à 18h (GMT)`
  }
]
</script>

<template>
  <div>
    <section class="bg-white border-b border-border-light">
      <div class="max-w-[900px] mx-auto px-5 md:px-10 py-12 md:py-16">
        <h1 class="font-serif text-3xl md:text-4xl leading-tight text-text-primary mb-3">Mentions légales</h1>
        <p class="text-sm text-text-tertiary">Dernière mise à jour : {{ lastUpdate }}</p>
      </div>
    </section>

    <section>
      <div class="max-w-[900px] mx-auto px-5 md:px-10 py-8">
        <div
          v-for="(section, i) in sections"
          :key="i"
          class="py-6 border-b border-border-light"
        >
          <h2 class="font-serif text-xl md:text-2xl text-blue-main mb-4">{{ section.title }}</h2>
          <p class="text-text-secondary leading-relaxed text-sm whitespace-pre-line">{{ section.content }}</p>
        </div>

        <div class="py-10 text-center">
          <p class="text-text-tertiary text-sm mb-4">Des questions ?</p>
          <NuxtLink to="/faq" class="text-orange-primary font-semibold text-sm hover:underline">Consultez notre FAQ</NuxtLink>
        </div>
      </div>
    </section>
  </div>
</template>
