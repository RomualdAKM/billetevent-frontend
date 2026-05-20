<script setup lang="ts">
definePageMeta({ layout: 'auth', middleware: 'guest' })

const route = useRoute()
const { verifyOtp, resendOtp: resendOtpApi } = useAuthApi()
const authStore = useAuthStore()
const { success, error: notifyError, info } = useNotification()
const { getSafeRedirect } = useSafeRedirect()

const userEmail = computed(() => (route.query.email as string) || (authStore.user?.email as string) || '')

const otpDigits = ref(['', '', '', '', '', ''])
const otpRefs = ref<HTMLInputElement[]>([])
const otpError = ref('')
const loading = ref(false)
const resendCooldown = ref(0)
let cooldownInterval: ReturnType<typeof setInterval> | null = null

const handleInput = (index: number, event: Event) => {
  const value = (event.target as HTMLInputElement).value
  if (value && index < 5) {
    nextTick(() => {
      otpRefs.value[index + 1]?.focus()
    })
  }
  otpError.value = ''
}

const handleKeydown = (index: number, event: KeyboardEvent) => {
  if (event.key === 'Backspace' && !otpDigits.value[index] && index > 0) {
    nextTick(() => {
      otpRefs.value[index - 1]?.focus()
    })
  }
}

const handlePaste = (event: ClipboardEvent) => {
  const paste = event.clipboardData?.getData('text') || ''
  const digits = paste.replace(/\D/g, '').slice(0, 6).split('')
  digits.forEach((d, i) => {
    otpDigits.value[i] = d
  })
  if (digits.length > 0) {
    const focusIndex = Math.min(digits.length, 5)
    nextTick(() => {
      otpRefs.value[focusIndex]?.focus()
    })
  }
  otpError.value = ''
  event.preventDefault()
}

const handleVerifyOtp = async () => {
  const code = otpDigits.value.join('')
  if (code.length < 6 || !/^\d{6}$/.test(code)) {
    otpError.value = 'Veuillez entrer le code à 6 chiffres'
    notifyError('Code incomplet ou invalide')
    return
  }
  try {
    loading.value = true
    const response = await verifyOtp({ email: userEmail.value, otp: code })
    authStore.setAuth(response.user as Record<string, unknown>, response.token)
    success('Compte vérifié avec succès !')
    await navigateTo(getSafeRedirect(route.query.redirect))
  } catch (err: any) {
    if (err?.status === 422 && err?.errors) {
      if (err.errors.otp) otpError.value = err.errors.otp[0]
      else if (err.errors.email) otpError.value = err.errors.email[0]
      else otpError.value = 'Code OTP invalide ou expiré'
    } else if (err?.response?.status === 429 || err?.status === 429) {
      notifyError(err?.message || err?.data?.message || 'Trop de tentatives. Réessayez plus tard.')
    } else {
      notifyError(err?.message || err?.data?.message || 'Code OTP invalide ou expiré')
    }
  } finally {
    loading.value = false
  }
}

const handleResendOtp = async () => {
  if (resendCooldown.value > 0) return
  try {
    await resendOtpApi({ email: userEmail.value })
    info('Un nouveau code a été envoyé à votre email')
    resendCooldown.value = 60
    cooldownInterval = setInterval(() => {
      resendCooldown.value--
      if (resendCooldown.value <= 0 && cooldownInterval) {
        clearInterval(cooldownInterval)
      }
    }, 1000)
  } catch (err: any) {
    if (err?.response?.status === 429 || err?.status === 429) {
      notifyError('Veuillez patienter avant de renvoyer un code')
    } else {
      notifyError(err?.message || err?.data?.message || 'Une erreur est survenue')
    }
  }
}

onUnmounted(() => {
  if (cooldownInterval) clearInterval(cooldownInterval)
})
</script>

<template>
  <div class="contents">
  <AuthAuthPanel />
  <div class="flex-1 flex items-center justify-center px-6 py-10 lg:px-12 bg-bg-primary">
    <form @submit.prevent="handleVerifyOtp" class="w-full max-w-[480px] bg-surface rounded-[20px] border border-border-light px-10 py-11 ">
      <NuxtLink :to="{ path: '/auth/register', query: typeof route.query.redirect === 'string' ? { redirect: route.query.redirect } : undefined }" class="inline-flex items-center gap-1.5 text-[0.78rem] text-text-tertiary mb-5">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
        Changer l'adresse email
      </NuxtLink>
      <div class="text-orange-primary mb-5 text-center">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class="inline-block"><rect x="5" y="2" width="14" height="20" rx="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg>
      </div>
      <div class="mb-7 text-center">
        <div class="font-serif text-[1.6rem] text-text-primary mb-1.5">Vérification du compte</div>
        <div class="text-[0.83rem] text-text-secondary leading-[1.55]">Un code à 6 chiffres a été envoyé à <strong>{{ userEmail }}</strong>. Il est valide pendant 10 minutes.</div>
      </div>
      <div class="flex gap-2.5 justify-center my-2 mb-2" @paste="handlePaste">
        <input
          v-for="(digit, index) in otpDigits"
          :key="index"
          :ref="(el) => { if (el) otpRefs[index] = el }"
          v-model="otpDigits[index]"
          type="text"
          maxlength="1"
          inputmode="numeric"
          pattern="[0-9]*"
          :autocomplete="index === 0 ? 'one-time-code' : 'off'"
          :autofocus="index === 0"
          @input="handleInput(index, $event)"
          @keydown="handleKeydown(index, $event)"
          class="w-14 h-[60px] border-[1.5px] rounded-[10px] text-[1.5rem] font-bold text-center font-sans outline-none transition-colors"
          :class="[
            otpError ? 'border-red-error' : otpDigits[index] ? 'border-orange-primary text-orange-primary' : 'border-border-light text-text-primary bg-surface'
          ]"
        />
      </div>
      <p v-if="otpError" class="text-[0.75rem] text-red-error text-center mb-4">{{ otpError }}</p>
      <div v-else class="mb-4"></div>
      <button
        type="submit"
        :disabled="loading"
        class="w-full py-3 bg-orange-primary text-white rounded-lg border-none text-[0.9rem] font-bold font-sans flex items-center justify-center gap-2 hover:bg-orange-light transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
      >
        <svg v-if="!loading" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
        <svg v-else class="animate-spin" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10" stroke-opacity="0.3"/><path d="M12 2a10 10 0 0 1 10 10"/></svg>
        {{ loading ? 'Vérification...' : 'Vérifier le code' }}
      </button>
      <div class="text-center mt-4 text-[0.8rem] text-text-tertiary">
        Vous n'avez pas reçu le code ?
        <button
          type="button"
          class="text-orange-primary font-semibold bg-transparent border-none cursor-pointer font-sans disabled:opacity-50 disabled:cursor-not-allowed"
          :disabled="resendCooldown > 0"
          @click="handleResendOtp"
        >
          {{ resendCooldown > 0 ? `Renvoyer (${resendCooldown}s)` : 'Renvoyer' }}
        </button>
      </div>
      <div class="text-center mt-4">
        <NuxtLink to="/" class="text-sm text-gray-500 hover:text-orange-500 transition-colors">
          Retour à l'accueil
        </NuxtLink>
      </div>
    </form>
  </div>
  </div>
</template>
