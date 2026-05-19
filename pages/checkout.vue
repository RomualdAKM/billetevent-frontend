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
  isGuest,
  guestInfo,
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
</script>

<template>
  <div class="min-h-screen bg-[#F4F6FA]">
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
        <p class="text-sm text-text-tertiary mb-5">Ajoutez des billets depuis un evenement.</p>
        <NuxtLink to="/events" class="bg-orange-primary text-white px-5 py-2.5 rounded-lg text-sm font-medium no-underline hover:opacity-90 transition-opacity">
          Parcourir les evenements
        </NuxtLink>
      </div>

      <!-- Checkout grid: form left, summary right (reversed on mobile) -->
      <div v-else class="grid grid-cols-1 md:grid-cols-[1fr_380px] gap-8 items-start">

        <!-- Summary (appears first on mobile) -->
        <div class="order-first md:order-last md:sticky md:top-8">
          <div class="bg-white rounded-xl p-6">
            <h2 class="text-lg font-semibold text-text-primary mb-4">Recapitulatif</h2>

            <p class="font-medium text-text-primary mb-1">{{ eventName }}</p>
            <div v-if="eventDate" class="text-sm text-text-tertiary mb-0.5">{{ eventDate }}</div>
            <div v-if="eventLocation" class="text-sm text-text-tertiary mb-4">{{ eventLocation }}</div>

            <div class="h-px bg-gray-100 my-4" />

            <!-- Items -->
            <div v-for="item in items" :key="item.name" class="flex justify-between py-1.5 text-sm">
              <span class="text-text-secondary">{{ item.name }} x {{ item.quantity }}</span>
              <span class="text-text-primary font-medium">{{ formatPrice(item.price * item.quantity) }}</span>
            </div>

            <div class="h-px bg-gray-100 my-4" />

            <!-- Totals -->
            <div class="flex justify-between py-1 text-sm">
              <span class="text-text-secondary">Sous-total</span>
              <span class="text-text-primary">{{ formatPrice(subtotal) }}</span>
            </div>
            <div v-if="serviceFee > 0" class="flex justify-between py-1 text-sm">
              <span class="text-text-secondary">Frais de service</span>
              <span class="text-text-primary">{{ formatPrice(serviceFee) }}</span>
            </div>
            <div v-if="promoDiscount > 0" class="flex justify-between py-1 text-sm">
              <span class="text-green-600">Reduction promo</span>
              <span class="text-green-600 font-medium">-{{ formatPrice(promoDiscount) }}</span>
            </div>

            <div class="h-px bg-gray-100 my-4" />

            <div class="flex justify-between items-center">
              <span class="text-base font-semibold text-text-primary">Total</span>
              <span class="text-xl font-bold text-text-primary">{{ formatPrice(totalTTC) }}</span>
            </div>

            <!-- Promo code -->
            <div class="mt-5">
              <div v-if="!promoApplied" class="flex gap-2">
                <UiBaseInput
                  v-model="promoInput"
                  placeholder="Code promo"
                  class="flex-1"
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
              <p v-else class="text-sm text-green-600 font-medium">
                Code applique : {{ cartStore.promoCode }}
              </p>
            </div>
          </div>
        </div>

        <!-- Form column -->
        <div class="order-last md:order-first flex flex-col gap-8">

          <!-- Section: Guest buyer identity (unauthenticated checkout) -->
          <div v-if="isGuest" class="flex flex-col gap-4">
            <div>
              <h2 class="text-lg font-semibold text-text-primary">Vos informations</h2>
              <p class="text-sm text-text-secondary mt-1">
                Vous recevrez vos billets à cette adresse email.
                <NuxtLink
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
            />
            <UiBaseInput
              v-model="guestInfo.phone"
              label="Numéro de téléphone"
              type="tel"
              autocomplete="tel"
              inputmode="tel"
              placeholder="+221 77 123 45 67"
              :error="formErrors.guestPhone"
            />
          </div>

          <!-- Section: Informations -->
          <div v-if="isFreeEvent" class="flex flex-col gap-4">
            <h2 class="text-lg font-semibold text-text-primary">Informations</h2>
            <p class="text-sm text-text-secondary">{{ isInscription ? 'Inscription gratuite — confirmez votre participation ci-dessous.' : 'Cet evenement est gratuit. Confirmez votre inscription ci-dessous.' }}</p>
          </div>

          <!-- Récapitulatif inscription -->
          <div v-if="isInscription && (registrationData.guest_name || registrationData.guest_email || registrationData.guest_phone || registrationData.guest_company)" class="bg-white rounded-xl p-5">
            <h3 class="text-sm font-semibold text-text-primary mb-3">Vos informations d'inscription</h3>
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
              <h2 class="text-lg font-semibold text-text-primary">Paiement</h2>

              <!-- Payment mode pills -->
              <div class="flex gap-3">
                <button
                  class="px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-200 border cursor-pointer"
                  :class="paymentMode === 'mobile'
                    ? 'bg-text-primary text-white border-text-primary'
                    : 'bg-white text-text-secondary border-border-light hover:border-text-tertiary'"
                  @click="paymentMode = 'mobile'"
                >
                  Mobile Money
                </button>
                <button
                  class="px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-200 border cursor-pointer"
                  :class="paymentMode === 'card'
                    ? 'bg-text-primary text-white border-text-primary'
                    : 'bg-white text-text-secondary border-border-light hover:border-text-tertiary'"
                  @click="paymentMode = 'card'"
                >
                  Carte bancaire
                </button>
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
                  placeholder="Selectionnez votre pays"
                  :error="formErrors.country"
                  @update:model-value="selectedCountry = String($event)"
                />

                <Transition name="fade-slide">
                  <UiBaseSelect
                    v-if="selectedCountry && operatorOptions.length"
                    :model-value="selectedOperator"
                    label="Operateur"
                    :options="operatorOptions"
                    placeholder="Choisissez un operateur"
                    :error="formErrors.operator"
                    @update:model-value="selectedOperator = String($event)"
                  />
                </Transition>

                <Transition name="fade-slide">
                  <UiBaseInput
                    v-if="selectedOperator"
                    v-model="mobileNumber"
                    label="Numero de telephone"
                    type="tel"
                    autocomplete="tel-national"
                    inputmode="tel"
                    placeholder="77 123 45 67"
                    :prefix="countryDialCode"
                    :error="formErrors.phone"
                  />
                </Transition>
              </div>
            </Transition>

            <!-- Card form -->
            <Transition name="fade-slide">
              <div v-if="paymentMode === 'card'" class="flex flex-col gap-4">
                <div class="bg-gray-50 border border-gray-100 rounded-lg p-4">
                  <p class="text-sm text-text-secondary">
                    Vous serez redirige vers la passerelle de paiement securisee pour finaliser votre achat.
                  </p>
                </div>
              </div>
            </Transition>
          </template>

          <!-- Action button -->
          <div class="flex flex-col gap-3">
            <UiBaseButton
              variant="primary"
              size="md"
              :loading="isProcessing"
              :disabled="isProcessing"
              class="w-full !py-3 !text-base"
              @click="pay"
            >
              <template v-if="isFreeEvent">{{ isInscription ? 'Confirmer mon inscription' : 'Confirmer ma commande' }}</template>
              <template v-else>Payer {{ formatPrice(totalTTC) }}</template>
            </UiBaseButton>

            <p class="text-xs text-text-tertiary text-center">
              Paiement securise — vos donnees sont protegees
            </p>
          </div>

          <!-- Wizall confirmation -->
          <Transition name="fade-slide">
            <div v-if="paymentState === 'awaiting_confirmation'" class="bg-white rounded-xl p-5 flex flex-col gap-3">
              <p class="text-sm font-semibold text-text-primary">Confirmation Wizall</p>
              <p class="text-sm text-text-tertiary">Entrez le code d'autorisation recu par SMS</p>
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
