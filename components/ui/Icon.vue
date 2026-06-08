<script setup lang="ts">
/**
 * UiIcon — wrapper unifié autour de Phosphor Icons (@phosphor-icons/vue).
 *
 * Pourquoi un wrapper :
 * 1. Permet de changer la lib en 1 endroit (vs 500+ inline SVG).
 * 2. Standardise les weights par contexte (action=bold, nav=regular, hero=duotone)
 *    pour briser l'uniformité Feather "tout en stroke 2".
 * 3. Donne un nom métier ("ticket") au lieu d'une métaphore SVG, plus lisible.
 *
 * Usage :
 *   <UiIcon name="ticket" />                 // regular 20px default
 *   <UiIcon name="ticket" weight="duotone" /> // pour les héros visuels
 *   <UiIcon name="wallet" :size="24" weight="bold" />
 *
 * Si le `name` est inconnu, on tombe sur `Question` (placeholder safe).
 */
import {
  PhArrowLeft, PhArrowRight, PhCaretDown, PhCaretLeft, PhCaretRight, PhCaretUp,
  PhCheck, PhCheckCircle, PhX, PhPlus, PhMinus, PhMagnifyingGlass,
  PhTicket, PhCalendarBlank, PhMapPin, PhClock, PhUsers, PhUser, PhUserCircle,
  PhEnvelope, PhPhone, PhWhatsappLogo, PhInstagramLogo, PhFacebookLogo, PhTwitterLogo, PhLinkedinLogo, PhTelegramLogo,
  PhHeart, PhShareNetwork, PhCopy, PhDownloadSimple, PhUploadSimple,
  PhBell, PhGear, PhSignOut, PhSignIn, PhUserPlus, PhHouse,
  PhSquaresFour, PhChartBar, PhChartLine, PhStorefront, PhMegaphone,
  PhWallet, PhBank, PhCreditCard, PhCurrencyCircleDollar, PhPercent,
  PhShieldCheck, PhWarningCircle, PhInfo, PhQuestion, PhLock, PhLockKey,
  PhEye, PhEyeSlash, PhTrash, PhPencilSimple, PhDotsThreeVertical, PhDotsThree,
  PhQrCode, PhScan, PhFlashlight, PhCamera, PhSpeakerHigh, PhSpeakerSlash,
  PhFileText, PhListChecks, PhPaperPlaneTilt, PhCheckSquare, PhSquare,
  PhStar, PhTrophy, PhFire, PhSparkle, PhConfetti,
  PhMusicNote, PhMicrophone, PhPaintBrush, PhFootball, PhGraduationCap, PhCode, PhForkKnife,
  PhPlay, PhPause,
} from '@phosphor-icons/vue'

type IconName =
  | 'arrow-left' | 'arrow-right' | 'caret-down' | 'caret-left' | 'caret-right' | 'caret-up'
  | 'check' | 'check-circle' | 'close' | 'plus' | 'minus' | 'search'
  | 'ticket' | 'calendar' | 'map-pin' | 'clock' | 'users' | 'user' | 'user-circle'
  | 'email' | 'phone' | 'whatsapp' | 'instagram' | 'facebook' | 'twitter' | 'linkedin' | 'telegram'
  | 'heart' | 'share' | 'copy' | 'download' | 'upload'
  | 'bell' | 'settings' | 'sign-out' | 'sign-in' | 'user-plus' | 'home'
  | 'dashboard' | 'chart-bar' | 'chart-line' | 'storefront' | 'megaphone'
  | 'wallet' | 'bank' | 'card' | 'money' | 'percent'
  | 'shield' | 'warning' | 'info' | 'question' | 'lock' | 'lock-key'
  | 'eye' | 'eye-off' | 'trash' | 'edit' | 'dots-vertical' | 'dots'
  | 'qr-code' | 'scan' | 'flashlight' | 'camera' | 'speaker-on' | 'speaker-off'
  | 'file' | 'list-checks' | 'send' | 'check-square' | 'square'
  | 'star' | 'trophy' | 'fire' | 'sparkle' | 'confetti'
  | 'music' | 'mic' | 'art' | 'sport' | 'formation' | 'tech' | 'food'
  | 'play' | 'pause'

const props = withDefaults(defineProps<{
  name: IconName | string
  size?: number | string
  weight?: 'thin' | 'light' | 'regular' | 'bold' | 'fill' | 'duotone'
  color?: string
}>(), {
  size: 20,
  weight: 'regular',
  color: 'currentColor',
})

const map: Record<string, any> = {
  'arrow-left': PhArrowLeft, 'arrow-right': PhArrowRight,
  'caret-down': PhCaretDown, 'caret-left': PhCaretLeft, 'caret-right': PhCaretRight, 'caret-up': PhCaretUp,
  'check': PhCheck, 'check-circle': PhCheckCircle, 'close': PhX, 'plus': PhPlus, 'minus': PhMinus, 'search': PhMagnifyingGlass,
  'ticket': PhTicket, 'calendar': PhCalendarBlank, 'map-pin': PhMapPin, 'clock': PhClock,
  'users': PhUsers, 'user': PhUser, 'user-circle': PhUserCircle,
  'email': PhEnvelope, 'phone': PhPhone,
  'whatsapp': PhWhatsappLogo, 'instagram': PhInstagramLogo, 'facebook': PhFacebookLogo,
  'twitter': PhTwitterLogo, 'linkedin': PhLinkedinLogo, 'telegram': PhTelegramLogo,
  'heart': PhHeart, 'share': PhShareNetwork, 'copy': PhCopy, 'download': PhDownloadSimple, 'upload': PhUploadSimple,
  'bell': PhBell, 'settings': PhGear, 'sign-out': PhSignOut, 'sign-in': PhSignIn, 'user-plus': PhUserPlus, 'home': PhHouse,
  'dashboard': PhSquaresFour, 'chart-bar': PhChartBar, 'chart-line': PhChartLine, 'storefront': PhStorefront, 'megaphone': PhMegaphone,
  'wallet': PhWallet, 'bank': PhBank, 'card': PhCreditCard, 'money': PhCurrencyCircleDollar, 'percent': PhPercent,
  'shield': PhShieldCheck, 'warning': PhWarningCircle, 'info': PhInfo, 'question': PhQuestion, 'lock': PhLock, 'lock-key': PhLockKey,
  'eye': PhEye, 'eye-off': PhEyeSlash, 'trash': PhTrash, 'edit': PhPencilSimple,
  'dots-vertical': PhDotsThreeVertical, 'dots': PhDotsThree,
  'qr-code': PhQrCode, 'scan': PhScan, 'flashlight': PhFlashlight, 'camera': PhCamera,
  'speaker-on': PhSpeakerHigh, 'speaker-off': PhSpeakerSlash,
  'file': PhFileText, 'list-checks': PhListChecks, 'send': PhPaperPlaneTilt,
  'check-square': PhCheckSquare, 'square': PhSquare,
  'star': PhStar, 'trophy': PhTrophy, 'fire': PhFire, 'sparkle': PhSparkle, 'confetti': PhConfetti,
  'music': PhMusicNote, 'mic': PhMicrophone, 'art': PhPaintBrush, 'sport': PhFootball,
  'formation': PhGraduationCap, 'tech': PhCode, 'food': PhForkKnife,
  'play': PhPlay, 'pause': PhPause,
}

const component = computed(() => map[props.name] || PhQuestion)
</script>

<template>
  <component :is="component" :size="size" :weight="weight" :color="color" />
</template>
