<template>
  <div class="hidden lg:flex w-[380px] shrink-0 bg-blue-main flex-col items-center justify-center px-10 py-12 relative overflow-hidden min-h-screen">
    <div class="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(240,90,40,0.25)_0%,transparent_50%),radial-gradient(circle_at_80%_80%,rgba(240,90,40,0.15)_0%,transparent_50%)]"></div>
    <div class="absolute inset-0 overflow-hidden pointer-events-none">
      <div class="absolute w-[320px] h-[320px] rounded-full border border-white/[0.07] -top-20 -left-20"></div>
      <div class="absolute w-[200px] h-[200px] rounded-full border border-white/[0.06] bottom-10 -right-15"></div>
    </div>
    <div class="relative z-10 flex flex-col items-center gap-8 text-center">
      <img src="/logo.png" alt="BilletEvent" class="h-20 object-contain brightness-0 invert" />
      <div class="font-serif text-[1.55rem] text-white leading-[1.35] tracking-tight">
        Vendez vos billets,<br /><em class="text-orange-light italic">gérez vos événements</em><br />en toute simplicité.
      </div>
      <div class="text-[0.84rem] text-white/55 leading-[1.65] max-w-[260px]">
        La plateforme tout-en-un pour les organisateurs d'événements au Sénégal et en Afrique francophone.
      </div>
      <div class="flex gap-6 mt-1">
        <div class="text-center">
          <div class="text-[1.4rem] font-bold text-white">12k+</div>
          <div class="text-[0.68rem] text-white/45 uppercase tracking-[0.09em] mt-0.5">Événements</div>
        </div>
        <div class="text-center">
          <div class="text-[1.4rem] font-bold text-white">850k</div>
          <div class="text-[0.68rem] text-white/45 uppercase tracking-[0.09em] mt-0.5">Billets vendus</div>
        </div>
        <div class="text-center">
          <div class="text-[1.4rem] font-bold text-white">4.9★</div>
          <div class="text-[0.68rem] text-white/45 uppercase tracking-[0.09em] mt-0.5">Note moyenne</div>
        </div>
      </div>
    </div>
  </div>
</template>
