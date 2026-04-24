<script setup lang="ts">
definePageMeta({ layout: 'default' })

useSeoMeta({
  title: 'Conditions Générales de Vente | BilletEvent',
  description: 'Consultez les conditions générales de vente de la plateforme BilletEvent.',
})

const lastUpdate = '1er avril 2026'

const sections = [
  {
    title: '1. Objet',
    content: `Les présentes Conditions Générales de Vente (ci-après "CGV") régissent l'ensemble des relations contractuelles entre la société BilletEvent et tout utilisateur de la plateforme accessible à l'adresse www.billetevent.com. BilletEvent est une plateforme de billetterie en ligne permettant aux organisateurs d'événements de créer, promouvoir et vendre des billets pour leurs événements, et aux participants d'acheter ces billets de manière sécurisée.`
  },
  {
    title: '2. Services proposés',
    content: `BilletEvent propose les services suivants aux organisateurs et aux participants :\n\n• Création et publication de pages événements personnalisées avec description, visuels, programme et informations pratiques.\n• Billetterie en ligne avec gestion des différentes catégories de billets (VIP, Standard, Early Bird, etc.).\n• Gestion des participants incluant listes d'inscrits, check-in par QR code et suivi en temps réel.\n• Configuration de points de vente physiques (PDV) pour la vente de billets en présentiel.\n• Outils marketing intégrés : campagnes email et SMS, codes promotionnels, liens de partage.\n• Tableau de bord analytique avec statistiques de ventes, revenus et performances.\n• Système de reversement automatique des revenus vers les organisateurs.`
  },
  {
    title: '3. Inscription et compte',
    content: `L'utilisation des services BilletEvent nécessite la création d'un compte utilisateur. L'utilisateur s'engage à fournir des informations exactes, complètes et à jour lors de son inscription. Chaque utilisateur est responsable de la confidentialité de ses identifiants de connexion et de toute activité effectuée depuis son compte.\n\nLes organisateurs souhaitant publier des événements payants doivent compléter une procédure de vérification d'identité (KYC) incluant la fourniture d'une pièce d'identité valide et des informations bancaires ou de mobile money pour les reversements.\n\nBilletEvent se réserve le droit de suspendre ou supprimer tout compte en cas de violation des présentes CGV ou de comportement frauduleux.`
  },
  {
    title: '4. Tarification et commissions',
    content: `BilletEvent applique une commission de 10% sur le montant de chaque billet vendu via la plateforme. Cette commission couvre les frais de traitement des paiements, l'hébergement de la page événement, les outils de gestion et le support technique.\n\nDes frais de service peuvent être appliqués à l'acheteur au moment du paiement. Ces frais sont clairement indiqués avant la validation de la commande et varient en fonction du moyen de paiement choisi.\n\nLa création d'événements gratuits sur inscription est proposée sans frais. Les organisateurs peuvent consulter le détail des commissions et frais depuis leur tableau de bord à tout moment.`
  },
  {
    title: '5. Moyens de paiement',
    content: `BilletEvent accepte les moyens de paiement suivants :\n\n• Mobile Money : Wave, Orange Money, Free Money — les moyens de paiement les plus utilisés en Afrique de l'Ouest, permettant un règlement rapide et sécurisé depuis un téléphone mobile.\n• Carte bancaire : Visa, Mastercard — paiement sécurisé via nos partenaires de paiement certifiés PCI-DSS.\n• PayPal — pour les paiements internationaux et les utilisateurs disposant d'un compte PayPal.\n\nLes reversements aux organisateurs sont effectués automatiquement selon un calendrier défini (généralement sous 48 à 72 heures après la clôture de l'événement) vers le compte mobile money ou le compte bancaire renseigné par l'organisateur.`
  },
  {
    title: '6. Politique de remboursement',
    content: `Les demandes de remboursement sont traitées selon les conditions suivantes :\n\n• En cas d'annulation de l'événement par l'organisateur, les acheteurs sont intégralement remboursés dans un délai de 7 jours ouvrables.\n• En cas de report de l'événement, les billets restent valides pour la nouvelle date. Les acheteurs ne souhaitant pas y assister peuvent demander un remboursement dans les 14 jours suivant l'annonce du report.\n• Les demandes de remboursement pour convenance personnelle sont soumises à la politique de l'organisateur, indiquée sur la page de l'événement.\n• Aucun remboursement ne sera accordé après la tenue de l'événement.\n\nLes frais de service ne sont pas remboursables sauf en cas d'annulation de l'événement par l'organisateur.`
  },
  {
    title: '7. Responsabilités',
    content: `Responsabilités de l'organisateur :\nL'organisateur est seul responsable de l'organisation, du contenu et du bon déroulement de son événement. Il garantit la véracité des informations publiées sur la page événement et s'engage à respecter la législation en vigueur.\n\nResponsabilités de l'acheteur :\nL'acheteur s'engage à utiliser les billets conformément aux conditions de l'événement. Il est responsable de la conservation de son billet numérique et de la présentation du QR code valide le jour de l'événement.\n\nResponsabilités de BilletEvent :\nBilletEvent agit en qualité d'intermédiaire technique entre l'organisateur et l'acheteur. BilletEvent s'engage à assurer la disponibilité et la sécurité de la plateforme, le traitement sécurisé des paiements et le support technique. BilletEvent ne saurait être tenu responsable de l'annulation, du report ou de la qualité d'un événement organisé par un tiers.`
  },
  {
    title: '8. Propriété intellectuelle',
    content: `L'ensemble des éléments constituant la plateforme BilletEvent (logo, charte graphique, textes, logiciels, bases de données, structure du site) sont protégés par les lois relatives à la propriété intellectuelle.\n\nToute reproduction, représentation, modification ou exploitation non autorisée de tout ou partie de ces éléments est strictement interdite et constitue une contrefaçon sanctionnée par la loi.\n\nLes organisateurs conservent la propriété intellectuelle de leurs contenus publiés sur la plateforme (textes, images, logos) et accordent à BilletEvent une licence non exclusive d'utilisation pour les besoins de la promotion de leurs événements.`
  },
  {
    title: '9. Litiges et droit applicable',
    content: `Les présentes CGV sont régies par le droit sénégalais. En cas de litige relatif à l'interprétation ou à l'exécution des présentes CGV, les parties s'engagent à rechercher une solution amiable avant toute action judiciaire.\n\nÀ défaut d'accord amiable dans un délai de 30 jours, tout litige sera soumis à la compétence exclusive des tribunaux de Dakar, Sénégal.\n\nLes utilisateurs résidant dans l'Union Européenne peuvent également recourir à la plateforme de résolution des litiges en ligne mise en place par la Commission européenne.`
  },
  {
    title: '10. Modification des CGV',
    content: `BilletEvent se réserve le droit de modifier les présentes CGV à tout moment. Les utilisateurs seront informés de toute modification substantielle par email ou par notification sur la plateforme au moins 30 jours avant l'entrée en vigueur des nouvelles conditions.\n\nL'utilisation continue de la plateforme après la date d'entrée en vigueur des modifications vaut acceptation des nouvelles CGV. En cas de désaccord, l'utilisateur peut résilier son compte sans frais avant cette date.\n\nLa version en vigueur des CGV est toujours accessible sur la page dédiée de la plateforme.`
  }
]
</script>

<template>
  <div>
    <section class="bg-white border-b border-border-light">
      <div class="max-w-[900px] mx-auto px-5 md:px-10 py-12 md:py-16">
        <h1 class="font-serif text-3xl md:text-4xl leading-tight text-text-primary mb-3">Conditions Générales de Vente</h1>
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
