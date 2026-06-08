<script setup lang="ts">
definePageMeta({ layout: 'default' })

const route = useRoute()

// Buyers coming from the marketing landing (/e/[slug]?from=landing) should
// keep the chrome-less BilletEvent-free feel through to payment. We swap
// the layout dynamically when ?from=landing is present.
const fromLanding = computed(() => route.query.from === 'landing')
if (fromLanding.value) {
  setPageLayout('landing')
}

const {
  eventId,
  eventSlug,
  eventName,
  eventDate,
  eventLocation,
  eventData,
  isFreeEvent,
  accessMode,
  isLibre,
  isInscription,
  initFromHistoryState,
  loadEventDetails,
  ensureAuthValid,
  isGuest,
  guestInfo,
  sessionInvalid,
  paymentState,
  isProcessing,
  paymentMode,
  selectedCountry,
  selectedOperator,
  mobileNumber,
  cardNumber,
  cardExpiry,
  cardCvv,
  cardName,
  formErrors,
  promoInput,
  promoLoading,
  promoApplied,
  wizallCode,
  wizallLoading,
  pendingMessage,
  registrationData,
  items,
  subtotal,
  serviceFee,
  promoDiscount,
  totalTTC,
  countries,
  countryOperators,
  countryDialCode,
  pay,
  applyPromo,
  confirmWizallCode,
  formatPrice,
} = useCheckout()

const cartStore = useCartStore()
const { initPixels, trackInitiateCheckout } = useTracking()

initFromHistoryState()
onMounted(async () => {
  // Vérifier que le token Sanctum est encore valide côté backend AVANT
  // de laisser l'utilisateur soumettre — sinon il prend un 422 mystérieux
  // sur guest_* alors que le formulaire identité n'est même pas affiché.
  await ensureAuthValid()
  await loadEventDetails()

  // Tracking pixels : tracker le début du checkout
  try {
    const orgId = eventData.value?.organizer?.id || eventData.value?.user_id
    if (orgId) {
      await initPixels(orgId)
      trackInitiateCheckout({
        value: totalTTC.value,
        currency: 'XOF',
        items: items.value.map(i => ({
          id: i.id,
          name: i.name,
          quantity: i.quantity,
          price: i.price,
        })),
      })
    }
  } catch {
    // Silencieux — le tracking ne doit pas bloquer le checkout
  }
})

const eventLink = computed(() => {
  const slug = eventSlug.value
  // Send the buyer back where they came from: the marketing landing if they
  // arrived via /e/[slug], or the regular event page otherwise.
  const base = fromLanding.value ? '/e/' : '/events/'
  return slug ? base + slug : (eventId.value ? base + eventId.value : '/events')
})

const countryOptions = computed(() =>
  countries.value.map((c: any) => ({ label: `${c.flag} ${c.name}`, value: c.code }))
)

const operatorOptions = computed(() =>
  countryOperators.value.map((op: any) => ({ label: op.name || op, value: op.key || op }))
)

// ── Billet IRL : reference de souche + horodatage ──
// Hash deterministe de l'eventId pour generer un suffixe 4 chiffres stable
// (la souche d'une meme commande/event garde toujours la meme reference).
function hashEventId(id: string | number | null | undefined): string {
  const src = id != null ? String(id) : 'anon'
  let h = 0
  for (let i = 0; i < src.length; i++) {
    h = ((h << 5) - h + src.charCodeAt(i)) | 0
  }
  const n = Math.abs(h) % 10000
  return n.toString().padStart(4, '0')
}

const orderRef = computed(() => {
  // Code pays ISO depuis eventData.country (fallback "BE")
  const rawCountry: any = (eventData.value as any)?.country
  let countryCode = 'BE'
  if (rawCountry) {
    if (typeof rawCountry === 'string') {
      countryCode = rawCountry.slice(0, 2).toUpperCase()
    } else if (typeof rawCountry === 'object') {
      countryCode = String(rawCountry.code || rawCountry.iso || rawCountry.iso_code || 'BE').slice(0, 2).toUpperCase()
    }
  }
  const year = new Date().getFullYear()
  // Type du premier item : VIP si l'intitule contient "vip", sinon STD
  const firstItem: any = items.value?.[0]
  const itemName: string = (firstItem?.name || '').toString().toLowerCase()
  const itemType = itemName.includes('vip') ? 'VIP' : 'STD'
  const suffix = hashEventId(eventId.value)
  return `${countryCode}-${year}-${itemType}-${suffix}`
})

// Horodatage cote client uniquement pour eviter le mismatch SSR/CSR.
// Format "08.06.2026 14h32".
const issuedAt = ref('')
onMounted(() => {
  const d = new Date()
  const pad = (n: number) => n.toString().padStart(2, '0')
  issuedAt.value = `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()} ${pad(d.getHours())}h${pad(d.getMinutes())}`
})
</script>

<template>
  <div class="min-h-screen bg-kraft">
    <div class="max-w-[1040px] mx-auto px-6 py-10 max-sm:px-4 max-sm:py-6">
      <!-- Back link -->
      <NuxtLink
        :to="eventLink"
        class="inline-flex items-center gap-1.5 text-sm font-medium text-text-secondary mb-6 transition-colors hover:text-text-primary"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
        Retour
      </NuxtLink>

      <h1 class="text-2xl font-semibold text-text-primary mb-8">{{ isInscription ? 'Confirmer mon inscription' : 'Finaliser la commande' }}</h1>

      <!-- Libre mode blocker -->
      <div v-if="isLibre" class="flex flex-col items-center justify-center py-20 text-center">
        <div class="w-14 h-14 rounded-full bg-white flex items-center justify-center mb-4">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="text-text-tertiary"><path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2z"/><polyline points="20 6 9 17 4 12"/></svg>
        </div>
        <p class="text-lg font-medium text-text-primary mb-1">Entrée libre</p>
        <p class="text-sm text-text-tertiary mb-5">Cet événement est en entrée libre, aucune inscription nécessaire.</p>
        <NuxtLink :to="eventLink" class="bg-orange-primary text-white px-5 py-2.5 rounded-lg text-sm font-medium no-underline hover:opacity-90 transition-opacity">
          Retour à l'événement
        </NuxtLink>
      </div>

      <!-- Empty cart -->
      <div v-else-if="items.length === 0" class="flex flex-col items-center justify-center py-20 text-center">
        <div class="w-14 h-14 rounded-full bg-white flex items-center justify-center mb-4">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" class="text-text-tertiary"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
        </div>
        <p class="text-lg font-medium text-text-primary mb-1">Votre panier est vide</p>
        <p class="text-sm text-text-tertiary mb-5">Ajoutez des billets depuis un événement.</p>
        <NuxtLink to="/events" class="bg-orange-primary text-white px-5 py-2.5 rounded-lg text-sm font-medium no-underline hover:opacity-90 transition-opacity">
          Parcourir les événements
        </NuxtLink>
      </div>

      <!-- Checkout : billet IRL (souche + form), Direction A -->
      <div v-else class="max-w-[1040px] mx-auto my-8 bg-paper border-2 border-ink">
        <!-- Header band : entete de souche -->
        <div class="border-b border-ink/30 px-6 md:px-8 py-3 flex items-center justify-between font-mono text-[0.7rem] text-ink uppercase tracking-tight flex-wrap gap-2">
          <span>BILLETEVENT // SOUCHE D ACHAT</span>
          <span>REF {{ orderRef }} . EMIS LE {{ issuedAt }}</span>
        </div>

        <!-- Grid : form + souche separes par une perforation verticale (md+) ou horizontale (mobile) -->
        <div class="grid grid-cols-1 md:grid-cols-[1.1fr_1fr] divide-y-2 md:divide-y-0 md:divide-x-2 divide-dashed divide-ink/40">

        <!-- Summary / souche (appears first on mobile, sticky top mobile, static desktop) -->
        <div class="bg-paper p-6 md:p-8 order-1 md:order-2 md:static sticky top-0 z-20">
          <!-- Header souche : titre event + date/lieu -->
          <h2 class="font-serif text-xl md:text-2xl text-ink mb-1">{{ eventName }}</h2>
          <div class="font-mono text-xs text-ink/70 uppercase leading-relaxed">
            <div v-if="eventDate">{{ eventDate }}</div>
            <div v-if="eventLocation">{{ eventLocation }}</div>
          </div>

          <div class="border-b border-dashed border-ink/40 my-4"></div>

          <!-- Items : liste monospace -->
          <div class="space-y-1.5 font-mono text-sm py-1">
            <div
              v-for="item in items"
              :key="item.name"
              class="flex justify-between items-baseline"
            >
              <span class="text-ink">{{ item.quantity }}x&nbsp;&nbsp;{{ item.name }}</span>
              <span class="text-ink tabular-nums">{{ formatPrice(item.price * item.quantity) }}</span>
            </div>

            <!-- Frais de service -->
            <div v-if="serviceFee > 0" class="flex justify-between items-baseline">
              <span class="text-ink">Frais de service</span>
              <span class="text-ink tabular-nums">{{ formatPrice(serviceFee) }}</span>
            </div>

            <!-- Reduction promo -->
            <div v-if="promoDiscount > 0" class="flex justify-between items-baseline">
              <span class="text-orange-primary">Reduction promo</span>
              <span class="text-orange-primary tabular-nums">-{{ formatPrice(promoDiscount) }}</span>
            </div>
          </div>

          <!-- Separateur double ligne avant total -->
          <div class="border-t-2 border-ink my-4"></div>

          <!-- Total -->
          <div class="flex justify-between items-baseline mb-5">
            <span class="font-mono text-xs uppercase text-ink/70 tracking-tight">A payer</span>
            <span class="font-serif text-3xl md:text-4xl text-ink tabular-nums leading-none">
              {{ formatPrice(totalTTC) }}<span class="font-mono text-base text-ink/70 ml-2">F CFA</span>
            </span>
          </div>

          <!-- Promo code toggle -->
          <div class="mb-5">
            <div v-if="!promoApplied" class="flex gap-2 items-end">
              <UiBaseInput
                v-model="promoInput"
                label="[+] CODE PROMO"
                placeholder="CODE"
                class="flex-1"
                :class="'!bg-transparent !border-0 !border-b-2 !border-ink/40 !rounded-none focus:!border-orange-primary'"
              />
              <UiBaseButton
                variant="secondary"
                size="md"
                :loading="promoLoading"
                :disabled="!promoInput.trim()"
                @click="applyPromo"
              >
                Appliquer
              </UiBaseButton>
            </div>
            <p v-else class="font-mono text-xs uppercase text-orange-primary">
              [ok] code applique : {{ cartStore.promoCode }}
            </p>
          </div>

          <!-- CTA principal (souche) : bouton natif billet IRL -->
          <button
            type="button"
            :disabled="isProcessing"
            class="w-full inline-flex items-center justify-center gap-2 px-6 py-4 bg-orange-primary text-white font-mono text-sm uppercase font-bold border-2 border-ink hover:bg-orange-light disabled:opacity-60 disabled:cursor-not-allowed tracking-tight"
            @click="pay"
          >
            <svg v-if="isProcessing" class="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="3" class="opacity-25"/>
              <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" class="opacity-75"/>
            </svg>
            <template v-if="isFreeEvent">
              {{ isInscription ? 'CONFIRMER MON INSCRIPTION >>>' : 'CONFIRMER MA COMMANDE >>>' }}
            </template>
            <template v-else>
              PAYER {{ formatPrice(totalTTC) }} &gt;&gt;&gt;
            </template>
          </button>

          <!-- Trust signals -->
          <div class="flex items-center justify-center gap-2 text-[0.65rem] font-mono uppercase text-ink/50 tracking-tight mt-3">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-ink/40" aria-hidden="true"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
            <span>paiement chiffre . wave . orange money . free money . carte</span>
          </div>

          <!-- Politique de remboursement -->
          <div v-if="eventData?.refund_policy_label" class="border-l-2 border-ink/30 pl-3 py-2 font-mono text-[0.7rem] text-ink/60 leading-relaxed mt-4">
            <strong class="text-ink">Politique de remboursement :</strong> {{ eventData.refund_policy_label }}
          </div>
        </div>

        <!-- Form column -->
        <div class="p-6 md:p-8 order-2 md:order-1 flex flex-col gap-8">

          <!-- Bandeau session expirée : informer l'utilisateur qu'il a été
               basculé en guest et lui proposer de se reconnecter sans perdre
               son panier. -->
          <div v-if="sessionInvalid" class="bg-gold-dim border border-gold/40 rounded-lg px-4 py-3 flex items-start gap-2.5">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-gold shrink-0 mt-0.5"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
            <div class="flex-1 text-sm text-text-secondary leading-relaxed">
              <strong class="text-text-primary">Votre session a expiré.</strong> Vous pouvez finaliser votre commande sans recréer de compte, ou
              <NuxtLink :to="{ path: '/auth/login', query: { redirect: '/checkout' } }" class="text-orange-primary font-medium hover:underline">vous reconnecter</NuxtLink>.
            </div>
          </div>

          <!-- Section: Guest buyer identity (unauthenticated checkout) -->
          <div v-if="isGuest" class="flex flex-col gap-4">
            <div>
              <h2 class="font-mono text-sm uppercase tracking-tight text-ink mb-1">01&nbsp;&nbsp;IDENTITE</h2>
              <div class="border-b border-ink/40 mb-5"></div>
              <p class="text-sm text-text-secondary mt-1">
                Vous recevrez vos billets à cette adresse email.
                <NuxtLink
                  v-if="!sessionInvalid"
                  :to="{ path: '/auth/login', query: { redirect: '/checkout' } }"
                  class="text-orange-primary font-medium hover:underline"
                >Déjà un compte ? Se connecter</NuxtLink>
              </p>
            </div>
            <UiBaseInput
              v-model="guestInfo.name"
              label="Nom complet"
              autocomplete="name"
              autocapitalize="words"
              placeholder="Awa Diallo"
              :error="formErrors.guestName"
              :class="'!bg-transparent !border-0 !border-b-2 !border-ink/40 !rounded-none focus:!border-orange-primary'"
            />
            <UiBaseInput
              v-model="guestInfo.email"
              label="Adresse email"
              type="email"
              autocomplete="email"
              inputmode="email"
              autocapitalize="off"
              autocorrect="off"
              spellcheck="false"
              placeholder="vous@example.com"
              :error="formErrors.guestEmail"
              :class="'!bg-transparent !border-0 !border-b-2 !border-ink/40 !rounded-none focus:!border-orange-primary'"
            />
            <UiBaseInput
              v-model="guestInfo.phone"
              label="Numéro de téléphone"
              type="tel"
              autocomplete="tel"
              inputmode="tel"
              placeholder="+221 77 123 45 67"
              :error="formErrors.guestPhone"
              :class="'!bg-transparent !border-0 !border-b-2 !border-ink/40 !rounded-none focus:!border-orange-primary'"
            />
          </div>

          <!-- Section: Informations -->
          <div v-if="isFreeEvent" class="flex flex-col gap-4">
            <h2 class="text-lg font-semibold text-text-primary">Informations</h2>
            <p class="text-sm text-text-secondary">{{ isInscription ? 'Inscription gratuite — confirmez votre participation ci-dessous.' : 'Cet événement est gratuit. Confirmez votre inscription ci-dessous.' }}</p>
          </div>

          <!-- Récapitulatif inscription -->
          <div v-if="isInscription && (registrationData.guest_name || registrationData.guest_email || registrationData.guest_phone || registrationData.guest_company)" class="bg-white rounded-xl p-5">
            <h2 class="font-mono text-sm uppercase tracking-tight text-ink mb-1">01&nbsp;&nbsp;INSCRIPTION</h2>
            <div class="border-b border-ink/40 mb-5"></div>
            <div class="flex flex-col gap-2">
              <div v-if="registrationData.guest_name" class="flex justify-between text-sm">
                <span class="text-text-secondary">Nom complet</span>
                <span class="text-text-primary font-medium">{{ registrationData.guest_name }}</span>
              </div>
              <div v-if="registrationData.guest_email" class="flex justify-between text-sm">
                <span class="text-text-secondary">Email</span>
                <span class="text-text-primary font-medium">{{ registrationData.guest_email }}</span>
              </div>
              <div v-if="registrationData.guest_phone" class="flex justify-between text-sm">
                <span class="text-text-secondary">Téléphone</span>
                <span class="text-text-primary font-medium">{{ registrationData.guest_phone }}</span>
              </div>
              <div v-if="registrationData.guest_company" class="flex justify-between text-sm">
                <span class="text-text-secondary">Entreprise</span>
                <span class="text-text-primary font-medium">{{ registrationData.guest_company }}</span>
              </div>
            </div>
          </div>

          <!-- Section: Payment method (paid events only) -->
          <template v-if="!isFreeEvent">
            <div class="flex flex-col gap-4">
              <div>
                <h2 class="font-mono text-sm uppercase tracking-tight text-ink mb-1">02&nbsp;&nbsp;PAIEMENT</h2>
                <div class="border-b border-ink/40 mb-5"></div>
              </div>

              <!-- Payment mode : radio list monospace billet IRL -->
              <div class="space-y-2 font-mono text-sm py-2">
                <label
                  class="flex items-center gap-2 cursor-pointer text-ink hover:text-orange-primary"
                  @click="paymentMode = 'mobile'"
                >
                  <span v-if="paymentMode === 'mobile'" class="text-orange-primary">(o)</span>
                  <span v-else class="text-ink/40">(.)</span>
                  <span :class="{ 'font-bold': paymentMode === 'mobile' }" class="text-ink">Mobile Money</span>
                </label>
                <label
                  class="flex items-center gap-2 cursor-pointer text-ink hover:text-orange-primary"
                  @click="paymentMode = 'card'"
                >
                  <span v-if="paymentMode === 'card'" class="text-orange-primary">(o)</span>
                  <span v-else class="text-ink/40">(.)</span>
                  <span :class="{ 'font-bold': paymentMode === 'card' }" class="text-ink">Carte bancaire</span>
                </label>
              </div>
              <p v-if="formErrors.paymentMode" class="text-xs text-red-500">{{ formErrors.paymentMode }}</p>
            </div>

            <!-- Mobile Money form -->
            <Transition name="fade-slide">
              <div v-if="paymentMode === 'mobile'" class="flex flex-col gap-4">
                <UiBaseSelect
                  :model-value="selectedCountry"
                  label="Pays"
                  :options="countryOptions"
                  placeholder="Sélectionnez votre pays"
                  :error="formErrors.country"
                  :class="'!bg-transparent !border-0 !border-b-2 !border-ink/40 !rounded-none focus:!border-orange-primary'"
                  @update:model-value="selectedCountry = String($event)"
                />

                <Transition name="fade-slide">
                  <UiBaseSelect
                    v-if="selectedCountry && operatorOptions.length"
                    :model-value="selectedOperator"
                    label="Opérateur"
                    :options="operatorOptions"
                    placeholder="Choisissez un opérateur"
                    :error="formErrors.operator"
                    :class="'!bg-transparent !border-0 !border-b-2 !border-ink/40 !rounded-none focus:!border-orange-primary'"
                    @update:model-value="selectedOperator = String($event)"
                  />
                </Transition>

                <Transition name="fade-slide">
                  <UiBaseInput
                    v-if="selectedOperator"
                    v-model="mobileNumber"
                    label="Numéro de téléphone"
                    type="tel"
                    autocomplete="tel-national"
                    inputmode="tel"
                    placeholder="77 123 45 67"
                    :prefix="countryDialCode"
                    :error="formErrors.phone"
                    :class="'!bg-transparent !border-0 !border-b-2 !border-ink/40 !rounded-none focus:!border-orange-primary'"
                  />
                </Transition>
              </div>
            </Transition>

            <!-- Card form -->
            <Transition name="fade-slide">
              <div v-if="paymentMode === 'card'" class="flex flex-col gap-4">
                <div class="bg-gray-50 border border-gray-100 rounded-lg p-4">
                  <p class="text-sm text-text-secondary">
                    Vous serez redirigé vers la passerelle de paiement sécurisée pour finaliser votre achat.
                  </p>
                </div>
              </div>
            </Transition>
          </template>

          <!-- Wizall confirmation -->
          <Transition name="fade-slide">
            <div v-if="paymentState === 'awaiting_confirmation'" class="bg-white rounded-xl p-5 flex flex-col gap-3">
              <p class="text-sm font-semibold text-text-primary">Confirmation Wizall</p>
              <p class="text-sm text-text-tertiary">Entrez le code d'autorisation reçu par SMS</p>
              <UiBaseInput
                v-model="wizallCode"
                placeholder="Code d'autorisation"
                inputmode="numeric"
                autocomplete="one-time-code"
              />
              <UiBaseButton
                variant="primary"
                size="md"
                :loading="wizallLoading"
                :disabled="!wizallCode.trim()"
                class="w-full"
                @click="confirmWizallCode"
              >
                Confirmer
              </UiBaseButton>
            </div>
          </Transition>

          <!-- Pending / Timeout states -->
          <Transition name="fade-slide">
            <div v-if="paymentState === 'pending' || paymentState === 'timeout'" class="bg-white rounded-xl p-5 text-center">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-orange-primary mx-auto mb-3 animate-pulse"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              <p class="text-sm font-semibold text-text-primary mb-1">
                {{ paymentState === 'timeout' ? 'Paiement en cours de traitement...' : 'Paiement en attente' }}
              </p>
              <p class="text-sm text-text-tertiary">{{ pendingMessage }}</p>
            </div>
          </Transition>
        </div>
        </div>

        <!-- Footer perforation : detacher ici -->
        <div class="border-t-2 border-dashed border-ink/40 py-3 px-6 flex items-center justify-between font-mono text-[0.7rem] text-ink/60 uppercase">
          <span>&lt; detacher ici</span>
          <span class="hidden md:inline">- - - - - - - - - -</span>
          <span>&gt;</span>
        </div>
      </div>
    </div>

    <!-- Sticky CTA mobile : "PAYER X F >>>" toujours visible en bas (Direction A billet IRL)
         Hidden sur desktop (md+) car le CTA principal de la souche est deja dans le flow. -->
    <div
      v-if="!cartStore.isEmpty"
      class="md:hidden fixed left-0 right-0 z-40 px-4 bg-orange-primary border-t-2 border-ink"
      :style="{ bottom: 0, paddingTop: '0.75rem', paddingBottom: 'calc(env(safe-area-inset-bottom) + 0.75rem)' }"
    >
      <button
        type="button"
        :disabled="isProcessing"
        class="w-full inline-flex items-center justify-center gap-2 px-6 py-3 bg-orange-primary text-white font-mono text-sm uppercase font-bold tracking-tight hover:bg-orange-light disabled:opacity-60 disabled:cursor-not-allowed"
        @click="pay"
      >
        <svg v-if="isProcessing" class="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="3" class="opacity-25"/><path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" class="opacity-75"/></svg>
        <template v-if="isProcessing">TRAITEMENT...</template>
        <template v-else-if="isFreeEvent">CONFIRMER &gt;&gt;&gt;</template>
        <template v-else>PAYER {{ formatPrice(totalTTC) }} &gt;&gt;&gt;</template>
      </button>
    </div>
  </div>
</template>

<style scoped>
.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}
.fade-slide-enter-from,
.fade-slide-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}
</style>
