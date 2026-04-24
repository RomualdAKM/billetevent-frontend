<script setup>
const show = ref(false)

onMounted(() => {
  const consent = localStorage.getItem('billetevent_cookie_consent')
  if (!consent) {
    show.value = true
  }
})

const accept = () => {
  localStorage.setItem('billetevent_cookie_consent', 'accepted')
  show.value = false
}

const refuse = () => {
  localStorage.setItem('billetevent_cookie_consent', 'refused')
  show.value = false
}
</script>

<template>
  <Transition name="slide-up">
    <div
      v-if="show"
      class="fixed bottom-0 left-0 right-0 z-[100] bg-surface border-t border-border-light px-4 md:px-8 py-5"
    >
      <div class="max-w-[1200px] mx-auto flex flex-col md:flex-row items-start md:items-center gap-4">
        <p class="text-sm text-text-secondary leading-relaxed flex-1">
          Nous utilisons des cookies pour améliorer votre expérience. En continuant, vous acceptez notre utilisation des cookies.
          <NuxtLink to="/legal/privacy" class="text-orange-primary font-semibold hover:underline ml-1">En savoir plus</NuxtLink>
        </p>
        <div class="flex items-center gap-3 shrink-0">
          <button
            class="px-5 py-2.5 rounded-lg text-sm font-semibold bg-bg-surface-2 text-text-primary transition-colors duration-200 hover:bg-surface-3 cursor-pointer"
            @click="refuse"
          >
            Refuser
          </button>
          <button
            class="px-5 py-2.5 rounded-lg text-sm font-semibold bg-orange-primary text-white transition-colors duration-200 hover:bg-orange-light cursor-pointer"
            @click="accept"
          >
            Accepter
          </button>
        </div>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.slide-up-enter-active,
.slide-up-leave-active {
  transition: transform 0.4s ease, opacity 0.4s ease;
}
.slide-up-enter-from,
.slide-up-leave-to {
  transform: translateY(100%);
  opacity: 0;
}
</style>
