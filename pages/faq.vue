<script setup lang="ts">
definePageMeta({ layout: 'default' })

useSeoMeta({
  title: 'FAQ | BilletEvent',
  description: 'Questions fréquentes sur BilletEvent : création d\'événements, paiements, billets, remboursements.',
})

const searchQuery = ref('')
const activeTab = ref('participants')
const openQuestion = ref(null)

function toggleQuestion(id) {
  openQuestion.value = openQuestion.value === id ? null : id
}

const participantFaq = [
  { id: 'p1', q: 'Comment acheter des billets sur BilletEvent ?', a: "Rendez-vous sur la page de l'événement qui vous intéresse, sélectionnez le type de billet et la quantité, puis cliquez sur \"Acheter\". Vous serez guidé à travers un processus de paiement sécurisé. Une fois le paiement confirmé, votre billet numérique avec QR code sera envoyé par email et accessible depuis votre compte personnel." },
  { id: 'p2', q: 'Quels moyens de paiement sont acceptés ?', a: "BilletEvent accepte Wave, Orange Money, Free Money, les cartes bancaires (Visa, Mastercard) et PayPal. Le paiement par mobile money est le plus rapide : vous recevez une notification sur votre téléphone, confirmez le paiement, et votre billet est généré instantanément." },
  { id: 'p3', q: 'Comment accéder à mes billets après l\'achat ?', a: "Vos billets sont accessibles de plusieurs façons : par email (un email de confirmation contenant votre billet en PDF est envoyé immédiatement après l'achat), depuis votre compte personnel sur BilletEvent dans la section \"Mes billets\", et en téléchargeant le PDF directement depuis la plateforme. Chaque billet contient un QR code unique." },
  { id: 'p4', q: 'Puis-je acheter des billets pour d\'autres personnes ?', a: "Oui, vous pouvez acheter plusieurs billets et les attribuer à d'autres personnes. Lors de l'achat, vous pouvez saisir le nom et l'email de chaque participant. Chaque personne recevra son billet directement par email. Vous pouvez également transférer un billet déjà acheté depuis votre compte personnel." },
  { id: 'p5', q: 'Comment valider mon billet le jour de l\'événement ?', a: "Le jour de l'événement, présentez le QR code de votre billet à l'entrée. Le personnel de l'événement scannera votre QR code avec l'application BilletEvent. Le scan confirme instantanément la validité de votre billet et enregistre votre entrée. Vous pouvez présenter le QR code depuis votre téléphone ou sur une copie imprimée." },
  { id: 'p6', q: 'Les prix affichés sont-ils toutes taxes comprises ?', a: "Les prix affichés sur les pages d'événements sont fixés par l'organisateur. Des frais de service peuvent être ajoutés au moment du paiement, selon le moyen de paiement choisi. Le montant total incluant tous les frais est clairement affiché avant la confirmation de la commande, sans surprise." },
  { id: 'p7', q: 'Quelle est la politique de remboursement ?', a: "La politique de remboursement dépend de chaque événement. En cas d'annulation par l'organisateur, vous êtes automatiquement remboursé sous 7 jours ouvrés. En cas de report, vos billets restent valides pour la nouvelle date, avec la possibilité de demander un remboursement sous 14 jours. Pour les annulations personnelles, consultez les conditions spécifiques de l'événement." },
  { id: 'p8', q: 'Comment appliquer un code promo ?', a: "Lors du processus d'achat, vous trouverez un champ \"Code promo\" sur la page de paiement. Entrez votre code et cliquez sur \"Appliquer\". La réduction sera immédiatement calculée et déduite du montant total. Les codes promo ne sont pas cumulables et sont soumis aux conditions de validité fixées par l'organisateur." },
  { id: 'p9', q: 'Et si je n\'ai pas reçu mon billet ?', a: "Vérifiez d'abord votre dossier spam ou courrier indésirable. Si vous ne trouvez pas l'email, connectez-vous à votre compte BilletEvent et allez dans \"Mes billets\" pour télécharger votre billet. Si le problème persiste, contactez notre support à support@billetevent.com avec votre numéro de commande." },
  { id: 'p10', q: 'Comment transférer un billet à quelqu\'un d\'autre ?', a: "Depuis votre section \"Mes billets\", sélectionnez le billet que vous souhaitez transférer et cliquez sur \"Transférer\". Entrez le nom et l'email du nouveau destinataire. Le billet sera automatiquement réattribué et un nouveau QR code sera généré pour le destinataire. Votre ancien QR code sera désactivé." },
  { id: 'p11', q: 'Puis-je annuler ma réservation ?', a: "L'annulation dépend de la politique définie par l'organisateur pour son événement. Certains événements permettent l'annulation gratuite jusqu'à une certaine date, d'autres appliquent des frais d'annulation. Consultez les conditions de l'événement sur sa page dédiée ou contactez l'organisateur directement via la plateforme." },
  { id: 'p12', q: 'Comment contacter l\'organisateur de l\'événement ?', a: "Sur chaque page d'événement, vous trouverez les coordonnées de l'organisateur. Vous pouvez également utiliser le formulaire de contact intégré sur la page de l'événement pour envoyer un message directement à l'organisateur. Les réponses vous seront envoyées par email." },
  { id: 'p13', q: 'Les billets sont-ils personnalisés ?', a: "Par défaut, les billets BilletEvent sont personnalisés : ils portent le nom du participant saisi lors de l'achat. Certains organisateurs peuvent exiger une vérification d'identité à l'entrée. Si vous avez acheté un billet pour quelqu'un d'autre, assurez-vous que le nom sur le billet correspond au participant." },
  { id: 'p14', q: 'Comment fonctionne le scan du QR code à l\'entrée ?', a: "Chaque billet contient un QR code unique et sécurisé. À l'entrée de l'événement, le personnel scanne votre QR code avec l'application BilletEvent. Le système vérifie la validité du billet en temps réel, détecte les doublons et enregistre votre heure d'arrivée. Le processus prend moins de 2 secondes." },
  { id: 'p15', q: 'Où puis-je acheter des billets dans un point de vente physique ?', a: "Certains événements proposent la vente de billets dans des points de vente physiques (boutiques, kiosques, partenaires). La liste des points de vente est affichée sur la page de l'événement dans la section \"Points de vente\". Vous recevrez un billet imprimé avec QR code, identique au billet numérique." }
]

const organizerFaq = [
  { id: 'o1', q: 'Comment créer et publier un événement ?', a: "Connectez-vous à votre compte BilletEvent, accédez à votre tableau de bord et cliquez sur \"Créer un événement\". Remplissez les informations requises : titre, description, date, lieu, visuels et types de billets. Prévisualisez votre page événement, puis cliquez sur \"Publier\". Votre événement sera immédiatement accessible au public." },
  { id: 'o2', q: 'Quels sont les tarifs pour les organisateurs ?', a: "BilletEvent prélève une commission de 10 % sur chaque billet vendu. Cette commission couvre l'hébergement de votre page événement, le traitement des paiements, les outils de gestion des participants et le support technique. La création d'événements gratuits avec inscription est offerte sans frais." },
  { id: 'o3', q: 'Comment recevoir mes revenus ?', a: "Vos revenus de vente sont automatiquement transférés sur votre compte mobile money (Wave, Orange Money, Free Money) ou compte bancaire sous 48 à 72 heures après la clôture de votre événement. Vous pouvez suivre l'état de vos versements en temps réel depuis votre tableau de bord." },
  { id: 'o4', q: 'Comment gérer les billets d\'invitation ?', a: "Depuis la section \"Invitations\" de votre tableau de bord, vous pouvez générer des billets gratuits pour vos invités. Entrez le nom et l'email de chaque invité, choisissez le type de billet, et BilletEvent enverra automatiquement l'invitation avec le billet numérique. Vous pouvez suivre les confirmations en temps réel." },
  { id: 'o5', q: 'Qu\'est-ce qu\'un événement vérifié ?', a: "Un événement vérifié porte un badge de confiance indiquant que l'organisateur a été authentifié par BilletEvent. Pour obtenir ce badge, l'organisateur doit compléter la procédure KYC (vérification d'identité) et avoir organisé avec succès au moins un événement. Les événements vérifiés bénéficient d'une meilleure visibilité." },
  { id: 'o6', q: 'Comment configurer des points de vente physiques ?', a: "Rendez-vous dans la section \"Points de vente\" de votre tableau de bord. Ajoutez les détails de chaque point de vente (nom, adresse, contact). Chaque point de vente reçoit un accès dédié pour scanner et vendre des billets. Vous pouvez suivre les ventes par point de vente et gérer les quotas alloués à chacun." },
  { id: 'o7', q: 'Comment lancer une campagne marketing (email/SMS) ?', a: "Depuis la section \"Marketing\" de votre tableau de bord, créez une campagne email ou SMS. Rédigez votre message, sélectionnez votre audience (anciens participants, abonnés, liste personnalisée) et planifiez l'envoi. BilletEvent fournit des statistiques détaillées : taux d'ouverture, clics et conversions." },
  { id: 'o8', q: 'Comment fonctionne le check-in le jour de l\'événement ?', a: "Le jour J, utilisez l'application BilletEvent sur votre smartphone pour scanner les QR codes des participants à l'entrée. Le système vérifie instantanément chaque billet, détecte les doublons et compte les entrées en temps réel. Vous pouvez également effectuer un check-in manuel depuis la liste des participants." },
  { id: 'o9', q: 'Puis-je créer des codes de réduction ?', a: "Oui, depuis votre tableau de bord, allez dans \"Codes promo\" et créez des codes personnalisés. Définissez le type de réduction (pourcentage ou montant fixe), la période de validité, le nombre maximum d'utilisations et les types de billets éligibles. Partagez ensuite vos codes sur les réseaux sociaux ou par email." },
  { id: 'o10', q: 'Comment gérer les remboursements ?', a: "Les demandes de remboursement sont accessibles depuis votre tableau de bord dans la section \"Remboursements\". Vous pouvez approuver ou rejeter chaque demande selon votre politique. Si vous annulez votre événement, les remboursements sont automatiquement déclenchés par BilletEvent pour tous les acheteurs." },
  { id: 'o11', q: 'Comment modifier mon événement après publication ?', a: "Vous pouvez modifier votre événement à tout moment depuis votre tableau de bord : description, visuels, horaires, ajout de catégories de billets. Notez que certaines modifications (date, lieu) déclenchent une notification automatique aux participants. Les billets déjà vendus restent valides après modification." },
  { id: 'o12', q: 'Comment consulter mes statistiques de vente ?', a: "Votre tableau de bord vous offre une vue complète de vos performances : billets vendus par catégorie, revenus en temps réel, courbe de ventes, taux de remplissage, origine des acheteurs et comparaison entre événements. Vous pouvez exporter vos données au format CSV pour une analyse approfondie." },
  { id: 'o13', q: 'Qu\'est-ce que la vérification KYC ?', a: "La vérification KYC (Know Your Customer) est une procédure obligatoire pour les organisateurs d'événements payants. Elle consiste à fournir une pièce d'identité valide, un justificatif de domicile et vos coordonnées bancaires ou mobile money. Cette vérification garantit la sécurité des transactions et protège les acheteurs." },
  { id: 'o14', q: 'BilletEvent m\'aide-t-il le jour de l\'événement ?', a: "BilletEvent met à votre disposition tous les outils nécessaires pour le jour J : application de scan, liste des participants en temps réel, compteur d'entrées et support technique prioritaire. Pour les grands événements, notre équipe peut également vous assister sur place (sur demande préalable)." },
  { id: 'o15', q: 'Comment contacter le support BilletEvent ?', a: "Notre équipe de support est disponible du lundi au vendredi, de 9h à 18h (GMT). Contactez-nous par email à support@billetevent.com, par WhatsApp au +221 77 800 00 00, ou via le formulaire de contact accessible depuis votre tableau de bord. Les organisateurs d'événements vérifiés bénéficient d'un support prioritaire." }
]

const filteredParticipant = computed(() => {
  if (!searchQuery.value.trim()) return participantFaq
  const q = searchQuery.value.toLowerCase()
  return participantFaq.filter(item => item.q.toLowerCase().includes(q) || item.a.toLowerCase().includes(q))
})

const filteredOrganizer = computed(() => {
  if (!searchQuery.value.trim()) return organizerFaq
  const q = searchQuery.value.toLowerCase()
  return organizerFaq.filter(item => item.q.toLowerCase().includes(q) || item.a.toLowerCase().includes(q))
})

const totalResults = computed(() => {
  return filteredParticipant.value.length + filteredOrganizer.value.length
})
</script>

<template>
  <div>
    <section class="bg-white border-b border-border-light">
      <div class="max-w-[900px] mx-auto px-5 md:px-10 py-12 md:py-16 text-center">
        <h1 class="font-serif text-3xl md:text-4xl leading-tight text-text-primary mb-3">Questions fréquemment posées</h1>
        <p class="text-base text-text-tertiary leading-relaxed max-w-[480px] mx-auto mb-8">Trouvez rapidement les réponses à vos questions</p>

        <div class="max-w-[520px] mx-auto relative">
          <svg class="absolute left-4 top-1/2 -translate-y-1/2 text-text-tertiary" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Rechercher une question..."
            class="w-full pl-11 pr-4 py-3.5 rounded-xl border border-border-light bg-bg-primary text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-orange-primary focus:ring-2 focus:ring-orange-primary/10 transition-colors"
          />
        </div>

        <p v-if="searchQuery.trim()" class="text-xs text-text-tertiary mt-3">
          {{ totalResults }} résultat{{ totalResults !== 1 ? 's' : '' }} trouvé{{ totalResults !== 1 ? 's' : '' }}
        </p>
      </div>
    </section>

    <section>
      <div class="max-w-[900px] mx-auto px-5 md:px-10 py-8">
        <div class="flex gap-0 border-b border-border-light mb-8">
          <button
            class="px-6 py-3.5 text-sm font-semibold transition-colors relative cursor-pointer"
            :class="activeTab === 'participants' ? 'text-orange-primary' : 'text-text-tertiary hover:text-text-secondary'"
            @click="activeTab = 'participants'; openQuestion = null"
          >
            Participants
            <span v-if="searchQuery.trim()" class="ml-1.5 text-xs bg-orange-dim text-orange-primary px-1.5 py-0.5 rounded-full font-bold">{{ filteredParticipant.length }}</span>
            <div v-if="activeTab === 'participants'" class="absolute bottom-0 left-0 right-0 h-[2px] bg-orange-primary rounded-full"></div>
          </button>
          <button
            class="px-6 py-3.5 text-sm font-semibold transition-colors relative cursor-pointer"
            :class="activeTab === 'organizers' ? 'text-orange-primary' : 'text-text-tertiary hover:text-text-secondary'"
            @click="activeTab = 'organizers'; openQuestion = null"
          >
            Organisateurs
            <span v-if="searchQuery.trim()" class="ml-1.5 text-xs bg-orange-dim text-orange-primary px-1.5 py-0.5 rounded-full font-bold">{{ filteredOrganizer.length }}</span>
            <div v-if="activeTab === 'organizers'" class="absolute bottom-0 left-0 right-0 h-[2px] bg-orange-primary rounded-full"></div>
          </button>
        </div>

        <div v-if="activeTab === 'participants'">
          <div v-if="filteredParticipant.length === 0" class="py-12 text-center">
            <p class="text-text-tertiary text-sm">Aucune question ne correspond à votre recherche.</p>
          </div>
          <div v-else class="flex flex-col">
            <div
              v-for="item in filteredParticipant"
              :key="item.id"
              class="border-b border-border-light"
            >
              <button
                class="w-full flex items-center justify-between py-4 text-sm font-semibold text-left gap-4 cursor-pointer transition-colors duration-150"
                :class="openQuestion === item.id ? 'text-orange-primary' : 'text-text-primary hover:text-orange-primary'"
                @click="toggleQuestion(item.id)"
              >
                {{ item.q }}
                <div
                  class="w-[22px] h-[22px] rounded-full border-[1.5px] shrink-0 flex items-center justify-center transition-all duration-200"
                  :class="openQuestion === item.id ? 'bg-orange-primary border-orange-primary text-white rotate-45' : 'border-border-medium text-text-tertiary'"
                >
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
                </div>
              </button>
              <div
                v-if="openQuestion === item.id"
                class="pb-4 text-sm leading-relaxed text-text-tertiary"
              >
                {{ item.a }}
              </div>
            </div>
          </div>
        </div>

        <div v-if="activeTab === 'organizers'">
          <div v-if="filteredOrganizer.length === 0" class="py-12 text-center">
            <p class="text-text-tertiary text-sm">Aucune question ne correspond à votre recherche.</p>
          </div>
          <div v-else class="flex flex-col">
            <div
              v-for="item in filteredOrganizer"
              :key="item.id"
              class="border-b border-border-light"
            >
              <button
                class="w-full flex items-center justify-between py-4 text-sm font-semibold text-left gap-4 cursor-pointer transition-colors duration-150"
                :class="openQuestion === item.id ? 'text-orange-primary' : 'text-text-primary hover:text-orange-primary'"
                @click="toggleQuestion(item.id)"
              >
                {{ item.q }}
                <div
                  class="w-[22px] h-[22px] rounded-full border-[1.5px] shrink-0 flex items-center justify-center transition-all duration-200"
                  :class="openQuestion === item.id ? 'bg-orange-primary border-orange-primary text-white rotate-45' : 'border-border-medium text-text-tertiary'"
                >
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
                </div>
              </button>
              <div
                v-if="openQuestion === item.id"
                class="pb-4 text-sm leading-relaxed text-text-tertiary"
              >
                {{ item.a }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section class="bg-white border-t border-border-light">
      <div class="max-w-[600px] mx-auto px-5 md:px-10 py-16 text-center">
        <h2 class="font-serif text-2xl md:text-3xl text-text-primary mb-3">Vous n'avez pas trouvé votre réponse ?</h2>
        <p class="text-sm text-text-tertiary leading-relaxed mb-8">Notre équipe est disponible pour répondre à toutes vos questions et vous accompagner sur BilletEvent.</p>
        <div class="flex items-center justify-center gap-3 flex-wrap">
          <NuxtLink to="/contact" class="bg-orange-primary text-white px-7 py-3 rounded-full text-sm font-bold transition-colors duration-200 hover:bg-orange-light inline-flex items-center gap-2">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" /></svg>
            Nous contacter
          </NuxtLink>
          <a href="https://wa.me/221778000000" target="_blank" rel="noopener" class="bg-[#25D366] text-white px-7 py-3 rounded-full text-sm font-bold transition-colors duration-200 hover:bg-[#20BD5A] inline-flex items-center gap-2">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" /></svg>
            WhatsApp
          </a>
        </div>
      </div>
    </section>
  </div>
</template>
