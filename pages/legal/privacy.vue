<script setup lang="ts">
definePageMeta({ layout: 'default' })

useSeoMeta({
  title: 'Politique de confidentialité | BilletEvent',
  description: 'Consultez la politique de confidentialité et de protection des données de BilletEvent.',
})

const lastUpdate = '1er avril 2026'

const sections = [
  {
    title: '1. Introduction et responsable du traitement',
    content: `La présente Politique de confidentialité décrit comment BilletEvent, société enregistrée au Sénégal sous le numéro RCCM SN-DKR-2024-B-12345, collecte, utilise, stocke et protège les données personnelles de ses utilisateurs.\n\nBilletEvent agit en qualité de responsable du traitement des données personnelles collectées via la plateforme www.billetevent.com et ses applications associées.\n\nNous nous engageons à protéger la vie privée de nos utilisateurs et à traiter leurs données personnelles de manière transparente, conformément à la loi sénégalaise n° 2008-12 sur la protection des données à caractère personnel et au Règlement Général sur la Protection des Données (RGPD) pour les utilisateurs européens.`
  },
  {
    title: '2. Données personnelles collectées',
    content: `Données collectées automatiquement :\n• Adresse IP et géolocalisation approximative\n• Type et version du navigateur, système d'exploitation\n• Appareil utilisé (mobile, tablette, ordinateur)\n• Pages visitées, durée de navigation, interactions sur la plateforme\n• Données de connexion (horodatage, fréquence)\n\nDonnées fournies par l'utilisateur :\n• Informations d'identification : nom, prénom, adresse email, numéro de téléphone\n• Informations de paiement : numéro de mobile money, coordonnées bancaires (traitées par nos prestataires de paiement sécurisés)\n• Documents de vérification KYC : pièce d'identité, justificatif de domicile (pour les organisateurs)\n• Contenus publiés : descriptions d'événements, images, commentaires\n• Informations professionnelles : nom de l'organisation, fonction, secteur d'activité`
  },
  {
    title: '3. Finalités du traitement',
    content: `Vos données personnelles sont traitées pour les finalités suivantes :\n\n• Gestion de votre compte utilisateur et authentification\n• Traitement des commandes de billets et des transactions financières\n• Communication relative aux événements (confirmations, rappels, modifications)\n• Envoi de notifications de service (sécurité, mises à jour, maintenance)\n• Amélioration de la plateforme et personnalisation de l'expérience utilisateur\n• Statistiques et analyses anonymisées pour optimiser nos services\n• Prévention de la fraude et sécurisation des transactions\n• Respect de nos obligations légales et réglementaires\n• Envoi de communications marketing (avec votre consentement préalable)`
  },
  {
    title: '4. Base légale du traitement',
    content: `Le traitement de vos données repose sur les bases légales suivantes :\n\n• L'exécution du contrat : le traitement est nécessaire à la fourniture des services que vous avez demandés (création de compte, achat de billets, gestion d'événements).\n• Le consentement : pour l'envoi de communications marketing et l'utilisation de cookies non essentiels. Vous pouvez retirer votre consentement à tout moment.\n• L'intérêt légitime : pour l'amélioration de nos services, la prévention de la fraude et la sécurité de la plateforme.\n• L'obligation légale : pour le respect de nos obligations comptables, fiscales et réglementaires.`
  },
  {
    title: '5. Partage des données',
    content: `Vos données personnelles peuvent être partagées avec les catégories de destinataires suivantes :\n\n• Partenaires de paiement : Wave, Orange Money, Free Money, Stripe et PayPal pour le traitement sécurisé des transactions financières. Ces partenaires sont certifiés PCI-DSS.\n• Organisateurs d'événements : les organisateurs reçoivent les informations nécessaires à la gestion de leur événement (nom, email, type de billet des participants).\n• Prestataires techniques : hébergeurs, services d'envoi d'emails et de SMS, outils d'analyse, dans le cadre strict de la fourniture de nos services.\n• Autorités compétentes : en cas d'obligation légale, de décision de justice ou de requête des autorités administratives habilitées.\n\nBilletEvent ne vend jamais vos données personnelles à des tiers à des fins commerciales.`
  },
  {
    title: '6. Transferts internationaux',
    content: `Certaines données peuvent être transférées vers des pays situés en dehors du Sénégal ou de l'Espace Économique Européen dans le cadre de l'utilisation de nos prestataires techniques (hébergement cloud, services d'email).\n\nDans ce cas, BilletEvent s'assure que ces transferts sont encadrés par des garanties appropriées : clauses contractuelles types approuvées par la Commission européenne, certification Privacy Shield ou tout autre mécanisme reconnu assurant un niveau de protection adéquat de vos données.`
  },
  {
    title: '7. Durée de conservation',
    content: `Vos données personnelles sont conservées pour les durées suivantes :\n\n• Données de compte utilisateur : pendant toute la durée de votre inscription, puis 2 ans après la suppression du compte ou la dernière activité.\n• Données de transaction : 10 ans à compter de la transaction, conformément aux obligations comptables et fiscales en vigueur.\n• Documents KYC : 5 ans après la fin de la relation contractuelle, conformément aux obligations de lutte contre le blanchiment.\n• Données de navigation et cookies : 13 mois maximum.\n• Communications marketing : jusqu'au retrait de votre consentement, avec un maximum de 3 ans d'inactivité.\n\nÀ l'expiration de ces délais, vos données sont supprimées ou anonymisées de manière irréversible.`
  },
  {
    title: '8. Vos droits',
    content: `Conformément à la réglementation applicable, vous disposez des droits suivants :\n\n• Droit d'accès : obtenir la confirmation du traitement de vos données et en recevoir une copie.\n• Droit de rectification : demander la correction de données inexactes ou incomplètes.\n• Droit à l'effacement : demander la suppression de vos données dans les cas prévus par la loi.\n• Droit d'opposition : vous opposer au traitement de vos données pour des motifs légitimes ou à des fins de prospection commerciale.\n• Droit à la portabilité : recevoir vos données dans un format structuré et lisible par machine, et les transmettre à un autre responsable de traitement.\n• Droit à la limitation : demander la suspension du traitement de vos données dans certains cas.\n\nPour exercer vos droits, contactez notre Délégué à la Protection des Données à l'adresse dpo@billetevent.com. Nous nous engageons à répondre dans un délai de 30 jours.`
  },
  {
    title: '9. Cookies et technologies similaires',
    content: `BilletEvent utilise des cookies et technologies similaires pour améliorer votre expérience sur la plateforme :\n\n• Cookies essentiels : nécessaires au fonctionnement de la plateforme (authentification, panier, préférences de session). Ils ne peuvent pas être désactivés.\n• Cookies analytiques : permettent de mesurer l'audience et d'analyser la navigation pour améliorer nos services (Google Analytics).\n• Cookies marketing : utilisés pour personnaliser les publicités et mesurer l'efficacité des campagnes (pixel Facebook, Google Ads).\n\nLors de votre première visite, un bandeau vous permet de paramétrer vos préférences de cookies. Vous pouvez modifier ces préférences à tout moment depuis les paramètres de votre navigateur ou depuis notre page de gestion des cookies.`
  },
  {
    title: '10. Sécurité des données',
    content: `BilletEvent met en œuvre des mesures techniques et organisationnelles appropriées pour protéger vos données personnelles contre tout accès non autorisé, modification, divulgation ou destruction :\n\n• Chiffrement des données en transit (TLS/SSL) et au repos.\n• Authentification à deux facteurs disponible pour les comptes utilisateurs.\n• Contrôle d'accès strict basé sur les rôles pour les équipes internes.\n• Audits de sécurité réguliers et tests de pénétration.\n• Hébergement sur des infrastructures certifiées ISO 27001.\n• Procédures de notification en cas de violation de données conformément à la réglementation.`
  },
  {
    title: '11. Modification de la politique',
    content: `BilletEvent se réserve le droit de modifier la présente Politique de confidentialité à tout moment. En cas de modification substantielle, les utilisateurs seront informés par email ou par notification sur la plateforme au moins 15 jours avant l'entrée en vigueur des modifications.\n\nLa date de dernière mise à jour est indiquée en haut de cette page. Nous vous encourageons à consulter régulièrement cette politique pour rester informé de nos pratiques en matière de protection des données.`
  },
  {
    title: '12. Contact DPO',
    content: `Pour toute question relative à la protection de vos données personnelles ou pour exercer vos droits, vous pouvez contacter notre Délégué à la Protection des Données :\n\n• Email : dpo@billetevent.com\n• Courrier : BilletEvent — DPO, Immeuble Keur Gorgui, 5ème étage, Dakar, Sénégal\n• Téléphone : +221 33 800 00 00\n\nSi vous estimez que le traitement de vos données constitue une violation de vos droits, vous pouvez introduire une réclamation auprès de la Commission des Données Personnelles (CDP) du Sénégal ou de l'autorité de contrôle compétente de votre pays de résidence.`
  }
]
</script>

<template>
  <div>
    <section class="bg-white border-b border-border-light">
      <div class="max-w-[900px] mx-auto px-5 md:px-10 py-12 md:py-16">
        <h1 class="font-serif text-3xl md:text-4xl leading-tight text-text-primary mb-3">Politique de confidentialité</h1>
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
          <p class="text-text-tertiary text-sm mb-4">Des questions sur la gestion de vos données ?</p>
          <NuxtLink to="/faq" class="text-orange-primary font-semibold text-sm hover:underline">Consultez notre FAQ</NuxtLink>
        </div>
      </div>
    </section>
  </div>
</template>
