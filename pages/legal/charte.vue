<script setup lang="ts">
definePageMeta({ layout: 'default' })

useSeoMeta({
  title: 'Charte de bonne conduite | BilletEvent',
  description: 'Consultez la charte de bonne conduite de la plateforme BilletEvent.',
})

const lastUpdate = '1er avril 2026'

const sections = [
  {
    title: '1. Préambule — Notre engagement communautaire',
    content: `BilletEvent est une plateforme de billetterie en ligne qui rassemble organisateurs et participants autour d'événements de toutes natures. Nous croyons en une communauté basée sur la confiance, le respect mutuel et la transparence.\n\nCette charte de bonne conduite a pour objectif de définir les règles de comportement attendues de chaque utilisateur de la plateforme, qu'il soit organisateur d'événements ou participant. En utilisant BilletEvent, chaque utilisateur s'engage à respecter ces principes et à contribuer à un environnement sûr et agréable pour tous.`
  },
  {
    title: '2. Règles pour les organisateurs',
    content: `En tant qu'organisateur sur BilletEvent, vous vous engagez à :\n\n• Publier des événements authentiques : chaque événement publié doit correspondre à un événement réel, avec des informations exactes sur le lieu, la date, le programme et les intervenants.\n• Agir avec honnêteté : ne pas induire les participants en erreur sur la nature, le contenu ou la qualité de l'événement. Les visuels et descriptions doivent refléter fidèlement ce qui sera proposé.\n• Respecter vos engagements : honorer les billets vendus, respecter les horaires annoncés et fournir les prestations décrites sur la page de l'événement.\n• Communiquer de manière transparente : informer rapidement les participants en cas de modification, de report ou d'annulation de l'événement.\n• Respecter les délais de reversement : ne pas créer d'événements fictifs dans le but de percevoir indûment des fonds via la plateforme.\n• Assurer la sécurité : prendre les mesures nécessaires pour garantir la sécurité des participants lors de l'événement et respecter les réglementations locales en vigueur.`
  },
  {
    title: '3. Règles pour les acheteurs',
    content: `En tant que participant et acheteur de billets sur BilletEvent, vous vous engagez à :\n\n• Adopter un comportement respectueux : faire preuve de courtoisie envers les organisateurs, le personnel de l'événement et les autres participants, tant en ligne que lors des événements.\n• Utiliser les billets de manière personnelle : sauf indication contraire de l'organisateur, les billets sont nominatifs et destinés à un usage personnel.\n• Ne pas revendre les billets de manière non autorisée : la revente de billets à un prix supérieur au tarif d'achat est strictement interdite, sauf si l'organisateur autorise expressément le transfert.\n• Respecter les règles de l'événement : se conformer aux conditions d'accès, au règlement intérieur du lieu et aux consignes de sécurité communiquées par l'organisateur.\n• Fournir des informations exactes : les données renseignées lors de l'achat doivent être véridiques et correspondre à l'identité du participant.`
  },
  {
    title: '4. Contenu interdit',
    content: `Il est strictement interdit de publier ou de diffuser via la plateforme BilletEvent tout contenu :\n\n• Haineux ou discriminatoire : tout propos incitant à la haine, à la violence ou à la discrimination fondée sur l'origine, le genre, l'orientation sexuelle, la religion, le handicap ou toute autre caractéristique protégée par la loi.\n• Illégal : tout contenu contraire aux lois et réglementations en vigueur, incluant la promotion d'activités illicites, la vente de substances interdites ou le blanchiment d'argent.\n• Trompeur ou frauduleux : toute information fausse ou trompeuse visant à induire les utilisateurs en erreur, les arnaques, le phishing ou les escroqueries.\n• Portant atteinte aux droits d'autrui : contenu violant les droits de propriété intellectuelle, le droit à l'image ou la vie privée de tiers.\n• À caractère pornographique ou violent : tout contenu explicitement sexuel, violent ou choquant non approprié au contexte de la plateforme.`
  },
  {
    title: '5. Modération et signalement',
    content: `BilletEvent dispose d'une équipe de modération dédiée qui veille au respect de la présente charte. La modération s'exerce de la manière suivante :\n\n• Vérification des événements : les événements publiés peuvent faire l'objet d'une vérification avant ou après publication pour s'assurer de leur conformité.\n• Signalement par les utilisateurs : tout utilisateur peut signaler un contenu ou un comportement contraire à la charte en utilisant le bouton de signalement disponible sur chaque page événement ou en contactant le support.\n• Traitement des signalements : chaque signalement est examiné par notre équipe dans un délai de 48 heures ouvrables. L'utilisateur signalant est informé de la suite donnée à sa demande.\n• Collaboration avec les autorités : en cas de contenu ou de comportement constituant une infraction pénale, BilletEvent se réserve le droit de transmettre les informations pertinentes aux autorités compétentes.`
  },
  {
    title: '6. Sanctions',
    content: `En cas de non-respect de la présente charte, BilletEvent se réserve le droit d'appliquer les sanctions suivantes, de manière proportionnée à la gravité du manquement :\n\n• Avertissement : notification écrite rappelant les règles de la charte et demandant la mise en conformité immédiate.\n• Suspension temporaire : désactivation du compte pour une durée déterminée (7, 14 ou 30 jours selon la gravité). Pendant la suspension, l'utilisateur ne peut ni publier d'événements ni acheter de billets.\n• Exclusion définitive : suppression permanente du compte et interdiction de création d'un nouveau compte. Cette sanction est appliquée en cas de récidive grave, de fraude avérée ou de mise en danger des utilisateurs.\n• Annulation d'événements : retrait immédiat des événements non conformes et remboursement automatique des participants.`
  },
  {
    title: '7. Processus de recours',
    content: `Tout utilisateur faisant l'objet d'une sanction dispose d'un droit de recours :\n\n• Délai de recours : la contestation doit être formulée dans les 15 jours suivant la notification de la sanction.\n• Forme du recours : le recours doit être adressé par email à recours@billetevent.com en précisant les motifs de la contestation et en joignant tout document justificatif.\n• Examen du recours : le recours est examiné par un membre de la direction qui n'a pas participé à la décision initiale. Une réponse motivée est communiquée dans un délai de 10 jours ouvrables.\n• Décision finale : la décision rendue à l'issue du recours est définitive. En cas de maintien de la sanction, l'utilisateur peut saisir les juridictions compétentes.`
  }
]
</script>

<template>
  <div>
    <section class="bg-white border-b border-border-light">
      <div class="max-w-[900px] mx-auto px-5 md:px-10 py-12 md:py-16">
        <h1 class="font-serif text-3xl md:text-4xl leading-tight text-text-primary mb-3">Charte de bonne conduite</h1>
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
          <p class="text-text-tertiary text-sm mb-4">Des questions sur notre charte ?</p>
          <NuxtLink to="/faq" class="text-orange-primary font-semibold text-sm hover:underline">Consultez notre FAQ</NuxtLink>
        </div>
      </div>
    </section>
  </div>
</template>
