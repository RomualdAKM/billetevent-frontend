<script setup lang="ts">
definePageMeta({ layout: 'default' })

useSeoMeta({
  title: 'Conditions Générales d\'Utilisation | BilletEvent',
  description: 'Consultez les conditions générales d\'utilisation de la plateforme BilletEvent.',
})

const lastUpdate = '1er avril 2026'

const sections = [
  {
    title: "1. Objet et champ d'application",
    content: `Les présentes Conditions Générales d'Utilisation (ci-après "CGU") définissent les modalités d'accès et d'utilisation de la plateforme BilletEvent, accessible à l'adresse www.billetevent.com et via ses applications mobiles. Elles s'appliquent à tout utilisateur naviguant sur la plateforme, qu'il soit organisateur d'événements, acheteur de billets ou simple visiteur.\n\nEn accédant à la plateforme ou en créant un compte, l'utilisateur reconnaît avoir pris connaissance des présentes CGU et les accepte sans réserve. Ces conditions complètent les Conditions Générales de Vente disponibles sur la page dédiée.`
  },
  {
    title: '2. Accès à la plateforme',
    content: `BilletEvent est accessible gratuitement depuis tout appareil disposant d'une connexion internet. La plateforme est optimisée pour les navigateurs web modernes (Chrome, Firefox, Safari, Edge) et pour un usage mobile.\n\nBilletEvent s'efforce d'assurer une disponibilité permanente de la plateforme mais ne saurait garantir une accessibilité ininterrompue. Des opérations de maintenance, des mises à jour ou des événements indépendants de notre volonté peuvent entraîner des interruptions temporaires.\n\nBilletEvent se réserve le droit de restreindre l'accès à tout ou partie de la plateforme, de manière temporaire ou définitive, sans préavis ni indemnité.`
  },
  {
    title: '3. Création de compte utilisateur',
    content: `La création d'un compte est nécessaire pour acheter des billets, créer des événements ou accéder aux fonctionnalités personnalisées de la plateforme. L'inscription s'effectue en renseignant une adresse email valide, un mot de passe sécurisé et les informations personnelles requises.\n\nL'utilisateur peut également s'inscrire via un compte tiers (Google, Facebook) sous réserve d'accepter le partage des informations nécessaires.\n\nChaque personne physique ou morale ne peut détenir qu'un seul compte sur la plateforme. L'utilisateur s'engage à maintenir ses informations à jour et à ne pas usurper l'identité d'un tiers.`
  },
  {
    title: "4. Obligations de l'utilisateur",
    content: `Tout utilisateur de la plateforme s'engage à :\n\n• Utiliser la plateforme conformément à sa destination et dans le respect des lois en vigueur.\n• Ne pas tenter de contourner les mesures de sécurité ou d'accéder à des zones non autorisées de la plateforme.\n• Ne pas utiliser de robots, scripts automatisés ou tout autre moyen technique pour collecter des données ou interférer avec le fonctionnement de la plateforme.\n• Respecter les droits de propriété intellectuelle de BilletEvent et des autres utilisateurs.\n• Ne pas publier de contenu diffamatoire, discriminatoire, illicite ou portant atteinte aux droits d'autrui.\n• Signaler immédiatement toute utilisation non autorisée de son compte ou toute faille de sécurité constatée.`
  },
  {
    title: '5. Contenu publié par les organisateurs',
    content: `Les organisateurs sont seuls responsables du contenu qu'ils publient sur la plateforme, incluant les descriptions d'événements, visuels, programmes et toute autre information communiquée aux participants.\n\nBilletEvent n'effectue pas de contrôle a priori du contenu publié mais se réserve le droit de retirer ou suspendre tout contenu qui violerait les présentes CGU, la législation en vigueur ou les droits de tiers, après signalement ou à sa propre initiative.\n\nLes organisateurs garantissent qu'ils disposent de tous les droits nécessaires sur les contenus publiés (textes, images, logos, vidéos) et qu'ils ne portent pas atteinte aux droits de tiers.`
  },
  {
    title: '6. Propriété intellectuelle',
    content: `La plateforme BilletEvent, son interface, son code source, ses bases de données, ses textes, graphismes, logos et tout autre élément la composant sont protégés par le droit de la propriété intellectuelle et sont la propriété exclusive de BilletEvent.\n\nL'utilisateur bénéficie d'un droit d'usage personnel et non transférable de la plateforme dans le cadre de son utilisation normale. Toute reproduction, extraction, réutilisation ou exploitation non expressément autorisée est interdite.`
  },
  {
    title: '7. Données personnelles',
    content: `BilletEvent collecte et traite des données personnelles dans le cadre de l'utilisation de la plateforme, conformément à la réglementation applicable en matière de protection des données personnelles.\n\nPour connaître les modalités de collecte, de traitement et de protection de vos données personnelles, nous vous invitons à consulter notre Politique de confidentialité disponible à l'adresse /legal/privacy.\n\nEn utilisant la plateforme, l'utilisateur consent au traitement de ses données dans les conditions décrites dans ladite politique.`
  },
  {
    title: '8. Sanctions et résiliation',
    content: `En cas de manquement aux présentes CGU, BilletEvent se réserve le droit de prendre les mesures suivantes, sans préavis ni indemnité :\n\n• Avertissement par email adressé à l'utilisateur.\n• Suspension temporaire du compte et des fonctionnalités associées.\n• Suppression définitive du compte et de l'ensemble des données associées.\n• Annulation des événements publiés en cas de manquement grave de l'organisateur.\n\nL'utilisateur peut à tout moment résilier son compte en adressant une demande à l'équipe support ou depuis les paramètres de son compte. La résiliation entraîne la suppression des données personnelles dans les délais prévus par notre politique de confidentialité.`
  },
  {
    title: '9. Limitation de responsabilité',
    content: `BilletEvent met en œuvre les moyens raisonnables pour assurer le bon fonctionnement de la plateforme et la sécurité des transactions. Toutefois, BilletEvent ne saurait être tenu responsable :\n\n• Des interruptions ou dysfonctionnements de la plateforme résultant de cas de force majeure, de problèmes techniques ou de maintenance.\n• Du contenu publié par les organisateurs ou de la qualité des événements proposés.\n• Des pertes de données résultant d'une négligence de l'utilisateur dans la gestion de son compte.\n• Des litiges entre organisateurs et participants relatifs à l'exécution d'un événement.\n\nLa responsabilité totale de BilletEvent envers un utilisateur est limitée au montant des commissions perçues au cours des 12 derniers mois.`
  },
  {
    title: '10. Droit applicable et juridiction',
    content: `Les présentes CGU sont soumises au droit sénégalais. Tout litige relatif à leur interprétation ou à leur exécution sera soumis aux juridictions compétentes de Dakar, Sénégal, après tentative de résolution amiable.\n\nSi une disposition des présentes CGU est déclarée nulle ou inapplicable, les autres dispositions demeurent pleinement en vigueur. Le fait pour BilletEvent de ne pas exercer un droit prévu par les présentes CGU ne constitue pas une renonciation à ce droit.`
  }
]
</script>

<template>
  <div>
    <section class="bg-white border-b border-border-light">
      <div class="max-w-[900px] mx-auto px-5 md:px-10 py-12 md:py-16">
        <h1 class="font-serif text-3xl md:text-4xl leading-tight text-text-primary mb-3">Conditions Générales d'Utilisation</h1>
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
          <p class="text-text-tertiary text-sm mb-4">Des questions sur nos conditions ?</p>
          <NuxtLink to="/faq" class="text-orange-primary font-semibold text-sm hover:underline">Consultez notre FAQ</NuxtLink>
        </div>
      </div>
    </section>
  </div>
</template>
