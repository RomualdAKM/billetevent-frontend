<script setup lang="ts">
definePageMeta({ layout: 'event-form', middleware: ['auth', 'organizer'] })

const api = useOrganizerApi()
const { success, error: notifyError } = useNotification()

const route = useRoute()
const editId = computed(() => route.query.edit as string | undefined)
const isEdit = computed(() => !!editId.value)

const sidebarOpen = ref(false)
const loading = ref(false)
const submitting = ref(false)
const saving = ref(false)
const fieldErrors = ref<Record<string, string[]>>({})

const currentStep = ref(1)
const draftStatus = ref('Brouillon')
const eventType = ref('presentiel')
const accessMode = ref('payant')
const refundPolicy = ref('none')
const showCustomRefund = ref(false)
const customRefundDays = ref<number | null>(null)
const showCatCustom = ref(false)
const emailCampaignType = ref('invitation')
const smsCharCount = ref(0)
const selectedCategory = ref('')

const eventTitle = ref('')
const eventDescription = ref('')
const eventDate = ref('')
const eventTime = ref('')
const eventEndTime = ref('')
const eventEndDate = ref('')

// Min date = aujourd'hui (empêche la sélection de dates passées au niveau navigateur).
// Le format ISO YYYY-MM-DD est ce qu'attend l'attribut HTML5 `min` des input[type=date].
const todayIso = computed(() => {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
})
// Min de la date de fin = date de début (sinon today)
const minEndDate = computed(() => eventDate.value || todayIso.value)
// Pour les inputs datetime-local des passes (sale_start_date / sale_end_date) :
// min = maintenant, max = date+heure de l'événement (vendre après l'event = absurde)
const nowDateTimeIso = computed(() => {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const h = String(d.getHours()).padStart(2, '0')
  const min = String(d.getMinutes()).padStart(2, '0')
  return `${y}-${m}-${day}T${h}:${min}`
})
const eventDateTimeIso = computed(() => {
  if (!eventDate.value) return ''
  return `${eventDate.value}T${eventTime.value || '23:59'}`
})
// Validation cross-field : si on a déjà tout, vérifier que fin > début
const dateRangeError = computed(() => {
  if (!eventDate.value) return ''
  if (eventDate.value < todayIso.value) return 'La date de début doit être aujourd\'hui ou ultérieure.'
  if (eventEndDate.value && eventEndDate.value < eventDate.value) return 'La date de fin doit être après la date de début.'
  if (eventEndDate.value && eventEndDate.value === eventDate.value && eventTime.value && eventEndTime.value && eventEndTime.value <= eventTime.value) return 'L\'heure de fin doit être après l\'heure de début.'
  return ''
})
const eventVenue = ref('')
const eventCity = ref('')
const eventAddress = ref('')
const eventCapacity = ref<number | null>(null)
const eventFlyer = ref<File | null>(null)
const eventCountry = ref('')
const eventLatitude = ref<number | null>(null)
const eventLongitude = ref<number | null>(null)
const onlinePlatform = ref('')
const onlineLink = ref('')
const videoUrl = ref('')

const { COUNTRY_OPTIONS } = useCountries()

const { suggestions: citySuggestions, loading: cityLoading, searchCities } = useCityAutocomplete()
const { suggestions: addressSuggestions, loading: addressLoading, searchAddresses, getCoordinates } = useAddressAutocomplete()

function onCitySearch(query: string) {
  searchCities(eventCountry.value, query)
}

function onAddressSearch(query: string) {
  searchAddresses(query, eventCountry.value, eventCity.value)
}

watch(eventAddress, (newVal) => {
  if (newVal) {
    const coords = getCoordinates(newVal)
    if (coords) {
      eventLatitude.value = coords.lat
      eventLongitude.value = coords.lon
    }
  }
})

watch(eventCountry, () => {
  eventCity.value = ''
  eventAddress.value = ''
  eventLatitude.value = null
  eventLongitude.value = null
})

watch(eventType, (newType) => {
  if (newType === 'presentiel') {
    onlinePlatform.value = ''
    onlineLink.value = ''
  }
})

const existingFlyerUrl = ref('')
const existingGallery = ref<string[]>([])

const galleryImages = ref<{ file: File; preview: string }[]>([])
const galleryInputRefs = ref<HTMLInputElement[]>([])
const artistImageRefs = ref<HTMLInputElement[]>([])
const MAX_GALLERY = 8

const requiredSteps = [
  { id: 1, title: 'Informations', sub: 'Titre, date, lieu' },
  { id: 2, title: 'Billets & Prix', sub: 'Types, tarifs, capacité' },
  { id: 3, title: 'Médias', sub: 'Couverture, galerie' }
]
const optionalSteps = [
  { id: 4, title: 'Programme', sub: 'Déroulé de la journée', icon: 'clipboard' },
  { id: 5, title: 'Artistes', sub: 'Intervenants, performers', icon: 'mic' },
  { id: 6, title: 'FAQ', sub: 'Questions fréquentes', icon: 'help' },
  { id: 7, title: 'Accès & Transports', sub: 'Lieu, itinéraire', icon: 'map' },
  { id: 9, title: 'Billets d\'invitation', sub: 'VIP, presse, partenaires', icon: 'mail' },
  { id: 10, title: 'Codes de réduction', sub: 'Promo, early bird', icon: 'tag' },
  { id: 11, title: 'Campagne Email', sub: 'Invitations, rappels', icon: 'mail' },
  { id: 12, title: 'Campagne SMS', sub: 'Notifications, rappels', icon: 'sms' },
  { id: 13, title: 'Points de vente', sub: 'Vente physique, guichets', icon: 'store' }
]
// Aligned 1:1 with App\Enums\EventCategory (backend). Adding a value here without
// matching the enum will be silently rejected by the API.
const categories = [
  { value: 'musique',     label: 'Musique & Concert' },
  { value: 'art',         label: 'Art, Théâtre & Spectacle' },
  { value: 'business',    label: 'Business & Networking' },
  { value: 'formation',   label: 'Formation & Conférence' },
  { value: 'tech',        label: 'Tech & Digital' },
  { value: 'sport',       label: 'Sport & Bien-être' },
  { value: 'gastronomie', label: 'Gastronomie & Lifestyle' },
  { value: 'autre',       label: 'Autre' },
]
const isPrivate = ref(false)
const isInvitationOnly = ref(false)
const maxInvitations = ref<number | null>(null)
const accessInstructions = ref('')

const invitationType = ref('')
const invitationQuantity = ref<number | null>(null)
const invitationMessage = ref('')
const invitationEmails = ref('')

const promoCode = ref('')
const promoType = ref('percentage')
const promoValue = ref<number | null>(null)
const promoMaxUsage = ref<number | null>(null)
const promoExpiration = ref('')
const promoMinOrderAmount = ref<number | null>(null)
const promoMaxPerUser = ref<number | null>(null)
const promoCodes = ref<any[]>([])

const campaignName = ref('')
const campaignSubject = ref('')
const campaignSenderName = ref('')
const campaignBody = ref('')
function insertCampaignTag(tag: string) {
  campaignBody.value += ` ${tag} `
}
const campaignRecipientType = ref('all')
const campaignSchedule = ref('now')
const campaignContacts = ref('')
const campaignStatus = ref<'draft' | 'scheduled' | 'sent'>('draft')

const pdvName = ref('')
const pdvType = ref('Guichet officiel')
const pdvAddress = ref('')
const pdvCity = ref('')
const pdvHours = ref('')
const pdvPhone = ref('')
const pdvTicketTypes = ref('all')
const pdvMaxCapacity = ref<number | null>(null)
const pdvInstructions = ref('')
const pdvList = ref<any[]>([])

const ticketTypes = ref([{ id: undefined as number | undefined, name: '', desc: '', price: null as number | null, capacity: null as number | null, sale_start_date: '', sale_end_date: '', max_per_order: null as number | null }, { id: undefined as number | undefined, name: 'Pass VIP', desc: '', price: null as number | null, capacity: null as number | null, sale_start_date: '', sale_end_date: '', max_per_order: null as number | null }])
const programItems = ref<{ id?: number; title: string; description: string; start_time: string; end_time: string; speaker_name: string }[]>([
  { title: '', description: '', start_time: '19:00', end_time: '', speaker_name: '' },
  { title: '', description: '', start_time: '20:30', end_time: '', speaker_name: '' }
])
const artists = ref<{ id?: number; name: string; role: string; image: File | null; preview: string }[]>([
  { name: '', role: '', image: null, preview: '' },
  { name: '', role: '', image: null, preview: '' }
])
// IMPORTANT : NE PAS pré-remplir d'engagement contractuel (remboursement,
// transfert, etc.) — chaque organisateur configure sa propre refund_policy
// dans l'étape billetterie. Pré-remplir "remboursement 14 jours" ici crée
// un engagement potentiellement faux si l'organisateur publie sans relire.
// Le placeholder neutre invite l'organisateur à saisir ses propres FAQs.
const faqItems = ref<{ id?: number; q: string; a: string }[]>([
  { q: '', a: '' },
])
const sectionStates = ref<Record<string, boolean>>({ prog: true, artists: true, faq: true, acces: true })
const transportOptions = ref([
  { label: 'Voiture', selected: true }, { label: 'Bus / TC', selected: true },
  { label: 'Train', selected: false }, { label: 'Parking', selected: true },
  { label: 'Vélo', selected: false }, { label: 'Aéroport proche', selected: false }
])
const INSCRIPTION_FIELD_DEFS = [
  { key: 'email', label: 'Email' },
  { key: 'full_name', label: 'Nom complet' },
  { key: 'phone', label: 'Téléphone' },
  { key: 'company', label: 'Entreprise' },
]
const inscriptionFields = ref(
  INSCRIPTION_FIELD_DEFS.map(f => ({ ...f, selected: f.key === 'email' || f.key === 'full_name' }))
)
const progTypes = ['Accueil', 'Performance', 'Dégustation', 'Atelier', 'Conférence', 'Pause']
const visitedSteps = ref(new Set([1]))

function goStep(n: number) {
  if (n > currentStep.value && currentStep.value <= 3) visitedSteps.value.add(currentStep.value)
  currentStep.value = n
  sidebarOpen.value = false
  window.scrollTo({ top: 0, behavior: 'smooth' })
}
function addTicket() { ticketTypes.value.push({ name: '', desc: '', price: null, capacity: null, sale_start_date: '', sale_end_date: '', max_per_order: null }) }
function removeTicket(i: number) { ticketTypes.value.splice(i, 1) }
function addProgItem() { programItems.value.push({ title: '', description: '', start_time: '', end_time: '', speaker_name: '' }) }
function removeProgItem(i: number) {
  const p = programItems.value[i]
  if (p?.id && editId.value) {
    api.deleteEventProgram(editId.value, p.id).catch(() => {})
  }
  programItems.value.splice(i, 1)
}
function addArtist() {
  artists.value.push({ name: '', role: '', image: null, preview: '' })
}

function triggerGalleryInput(index: number) {
  galleryInputRefs.value[index]?.click()
}

function onGallerySelect(event: Event, index: number) {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (!file) return
  if (index < galleryImages.value.length) {
    const existing = galleryImages.value[index]
    if (existing) URL.revokeObjectURL(existing.preview)
    galleryImages.value[index] = { file, preview: URL.createObjectURL(file) }
  } else {
    galleryImages.value.push({ file, preview: URL.createObjectURL(file) })
  }
  (event.target as HTMLInputElement).value = ''
}

function removeGalleryImage(index: number) {
  const img = galleryImages.value[index]
  if (img) URL.revokeObjectURL(img.preview)
  galleryImages.value.splice(index, 1)
}

function triggerArtistImage(index: number) {
  artistImageRefs.value[index]?.click()
}

function onArtistImageSelect(event: Event, index: number) {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (!file) return
  const artist = artists.value[index]
  if (!artist) return
  if (artist.preview) URL.revokeObjectURL(artist.preview)
  artist.image = file
  artist.preview = URL.createObjectURL(file)
  ;(event.target as HTMLInputElement).value = ''
}

const gallerySlots = computed(() => {
  const count = galleryImages.value.length
  return count < MAX_GALLERY ? count + 1 : count
})

const flyerPreview = ref('')

onBeforeUnmount(() => {
  galleryImages.value.forEach(g => URL.revokeObjectURL(g.preview))
  artists.value.forEach(a => { if (a.preview) URL.revokeObjectURL(a.preview) })
  if (flyerPreview.value) URL.revokeObjectURL(flyerPreview.value)
})
function removeArtist(i: number) {
  const artist = artists.value[i]
  if (artist?.preview) URL.revokeObjectURL(artist.preview)
  if (artist?.id && editId.value) {
    api.deleteEventArtist(editId.value, artist.id).catch(() => {})
  }
  artists.value.splice(i, 1)
}
function addFaq() { faqItems.value.push({ q: '', a: '' }) }
function removeFaq(i: number) {
  const f = faqItems.value[i]
  if (f?.id && editId.value) {
    api.deleteEventFaq(editId.value, f.id).catch(() => {})
  }
  faqItems.value.splice(i, 1)
}
function toggleSection(key: string) { sectionStates.value[key] = !sectionStates.value[key] }
function selectRefund(val: string) { refundPolicy.value = val; showCustomRefund.value = val === 'custom'; if (val !== 'custom') customRefundDays.value = null }
function onCategoryChange(e: Event) {
  showCatCustom.value = (e.target as HTMLSelectElement).value === 'autre'
}
const showPublishModal = ref(false)

// Kit marketing post-publication (modal qui s'affiche après publish réussi)
const showPostPublishKit = ref(false)
const publishedEventUrl = ref('')
const publishedEventTitle = ref('')
const kitLinkCopied = ref(false)

async function kitCopyLink() {
  try {
    await navigator.clipboard.writeText(publishedEventUrl.value)
    kitLinkCopied.value = true
    setTimeout(() => { kitLinkCopied.value = false }, 2500)
  } catch {
    notifyError('Copie impossible')
  }
}

function kitShareWhatsApp() {
  const msg = encodeURIComponent(
    `${publishedEventTitle.value}\n\nJe vous invite à mon événement. Réservez votre billet ici :\n${publishedEventUrl.value}`
  )
  window.open(`https://wa.me/?text=${msg}`, '_blank')
}

function kitShareEmail() {
  const subject = encodeURIComponent(publishedEventTitle.value)
  const body = encodeURIComponent(`Bonjour,\n\nJe vous invite à mon événement « ${publishedEventTitle.value} ».\n\nLien de réservation : ${publishedEventUrl.value}\n\nÀ bientôt !`)
  window.open(`mailto:?subject=${subject}&body=${body}`, '_blank')
}

function kitGoToEvents() {
  showPostPublishKit.value = false
  navigateTo('/dashboard/events')
}

const buildFormData = () => {
  const fd = new FormData()
  fd.append('title', eventTitle.value)
  fd.append('description', eventDescription.value)
  fd.append('category', selectedCategory.value)
  fd.append('date_start', `${eventDate.value} ${eventTime.value || '00:00'}`)
  fd.append('date_end', `${eventEndDate.value || eventDate.value} ${eventEndTime.value || '23:59'}`)
  fd.append('location', eventAddress.value || eventVenue.value)
  fd.append('city', eventCity.value)
  fd.append('country', eventCountry.value)
  fd.append('venue', eventVenue.value)
  fd.append('access_mode', accessMode.value)
  if (eventCapacity.value) fd.append('max_capacity', String(eventCapacity.value))
  if (eventFlyer.value) fd.append('flyer', eventFlyer.value)
  galleryImages.value.forEach(g => fd.append('gallery[]', g.file))
  fd.append('event_format', eventType.value)
  fd.append('is_private', isPrivate.value ? '1' : '0')
  fd.append('is_invitation_only', isInvitationOnly.value ? '1' : '0')
  if (maxInvitations.value) fd.append('max_invitations', String(maxInvitations.value))
  if (accessInstructions.value) fd.append('access_instructions', accessInstructions.value)
  const selectedTransport = transportOptions.value.filter(t => t.selected).map(t => t.label)
  if (selectedTransport.length) selectedTransport.forEach(option => fd.append('transport_options[]', option))
  fd.append('refund_policy', refundPolicy.value)
  if (refundPolicy.value === 'custom' && customRefundDays.value) {
    fd.append('refund_custom_days', String(customRefundDays.value))
  }
  if (eventLatitude.value) fd.append('latitude', String(eventLatitude.value))
  if (eventLongitude.value) fd.append('longitude', String(eventLongitude.value))
  // Envoyer les champs d'inscription sélectionnés
  if (accessMode.value === 'inscription') {
    inscriptionFields.value
      .filter((f: any) => f.selected)
      .forEach((f: any) => fd.append('registration_fields[]', f.key))
  }
  if (eventType.value === 'enligne' || eventType.value === 'hybride') {
    if (onlinePlatform.value) fd.append('online_platform', onlinePlatform.value)
    if (onlineLink.value) fd.append('online_link', onlineLink.value)
  }
  if (videoUrl.value) fd.append('video_url', videoUrl.value)
  if (isEdit.value) fd.append('_method', 'PUT')
  return fd
}

function addPromoCode() {
  if (!promoCode.value || !promoValue.value) return
  promoCodes.value.push({
    code: promoCode.value,
    type: promoType.value,
    value: promoValue.value,
    usage_limit: promoMaxUsage.value,
    expires_at: promoExpiration.value,
    min_order_amount: promoMinOrderAmount.value,
    max_per_user: promoMaxPerUser.value
  })
  promoCode.value = ''
  promoValue.value = null
  promoMaxUsage.value = null
  promoExpiration.value = ''
  promoMinOrderAmount.value = null
  promoMaxPerUser.value = null
}
function removePromoCode(i: number) { promoCodes.value.splice(i, 1) }

function addPdv() {
  if (!pdvName.value || !pdvAddress.value) return
  pdvList.value.push({
    name: pdvName.value, type: pdvType.value, address: pdvAddress.value,
    city: pdvCity.value, hours: pdvHours.value, phone: pdvPhone.value,
    ticket_types: pdvTicketTypes.value, max_capacity: pdvMaxCapacity.value,
    instructions: pdvInstructions.value
  })
  pdvName.value = ''
  pdvAddress.value = ''
  pdvCity.value = ''
  pdvHours.value = ''
  pdvPhone.value = ''
  pdvMaxCapacity.value = null
  pdvInstructions.value = ''
}
function removePdv(i: number) { pdvList.value.splice(i, 1) }

const saveOrPublish = async (publish: boolean) => {
  // Garde-fou : pas de publication avec date passée ou range incohérente.
  // (Le navigateur respecte `min` mais l'utilisateur peut taper au clavier.)
  if (dateRangeError.value) {
    notifyError(dateRangeError.value)
    return
  }
  const ref$ = publish ? submitting : saving
  ref$.value = true
  fieldErrors.value = {}
  try {
    let eventRes: any
    const fd = buildFormData()
    if (publish) fd.append('publish', '1')

    if (isEdit.value) {
      eventRes = await api.updateEvent(editId.value!, fd as unknown as Record<string, unknown>)
    } else {
      eventRes = await api.createEvent(fd as unknown as Record<string, unknown>)
    }

    const created = eventRes?.data ?? eventRes
    const createdId = created?.id

    if (createdId && accessMode.value === 'payant') {
      const validPasses = ticketTypes.value.filter(t => t.name && t.price != null)
      const passResults = await Promise.allSettled(
        validPasses.map(pass => {
          const payload = {
            name: pass.name, description: pass.desc, price: pass.price,
            capacity: pass.capacity ?? 100,
            sale_start_date: pass.sale_start_date || undefined,
            sale_end_date: pass.sale_end_date || undefined,
            max_per_order: pass.max_per_order || undefined
          }
          return pass.id
            ? api.updatePass(createdId, pass.id, payload)
            : api.createPass(createdId, payload)
        })
      )
      passResults.forEach((result, i) => {
        if (result.status === 'rejected') {
          console.error(`Erreur pass:`, result.reason)
          notifyError(`Erreur lors du pass "${validPasses[i]?.name}"`)
        }
      })
    }

    // Programmes
    if (createdId && sectionStates.value.prog) {
      const validPrograms = programItems.value.filter(p => p.title && p.start_time)
      const existingPrograms = validPrograms.filter(p => p.id)
      const newPrograms = validPrograms.filter(p => !p.id)

      if (existingPrograms.length) {
        const progUpdateResults = await Promise.allSettled(
          existingPrograms.map(p => api.updateEventProgram(createdId, p.id!, {
            title: p.title, description: p.description || '', start_time: p.start_time,
            end_time: p.end_time || '', speaker_name: p.speaker_name || ''
          }))
        )
        progUpdateResults.forEach((result) => {
          if (result.status === 'rejected') {
            console.error('Erreur mise à jour programme:', result.reason)
            notifyError('Erreur lors de la mise à jour d\'un programme')
          }
        })
      }

      const progResults = await Promise.allSettled(
        newPrograms.map(p => api.createEventProgram(createdId, {
          title: p.title, description: p.description || '', start_time: p.start_time,
          end_time: p.end_time || '', speaker_name: p.speaker_name || ''
        }))
      )
      progResults.forEach((result) => {
        if (result.status === 'rejected') {
          console.error('Erreur création programme:', result.reason)
          notifyError('Erreur lors de l\'ajout d\'un programme')
        }
      })
    }

    if (createdId && sectionStates.value.artists) {
      const validArtists = artists.value.filter(a => a.name)
      const existingArtists = validArtists.filter(a => a.id)
      const newArtists = validArtists.filter(a => !a.id)

      if (existingArtists.length) {
        const updateResults = await Promise.allSettled(
          existingArtists.map(a => api.updateEventArtist(createdId, a.id!, { name: a.name, role: a.role }))
        )
        updateResults.forEach((result, i) => {
          if (result.status === 'rejected') {
            console.error(`Erreur mise à jour artiste "${existingArtists[i].name}":`, result.reason)
            notifyError(`Erreur lors de la mise à jour de l'artiste "${existingArtists[i].name}"`)
          }
        })
      }

      const artistResults = await Promise.allSettled(
        newArtists.map((a, idx) => {
          const afd = new FormData()
          afd.append('name', a.name)
          afd.append('role', a.role || '')
          if (a.image) afd.append('image', a.image)
          afd.append('sort_order', String(idx))
          return api.createEventArtist(createdId, afd)
        })
      )
      artistResults.forEach((result, i) => {
        if (result.status === 'rejected') {
          console.error(`Erreur création artiste "${newArtists[i]?.name}":`, result.reason)
          notifyError(`Erreur lors de l'ajout de l'artiste "${newArtists[i]?.name}"`)
        }
      })
    }

    if (createdId && sectionStates.value.faq) {
      const validFaqs = faqItems.value.filter(f => f.q && f.a)
      const existingFaqs = validFaqs.filter(f => f.id)
      const newFaqs = validFaqs.filter(f => !f.id)

      if (existingFaqs.length) {
        const faqUpdateResults = await Promise.allSettled(
          existingFaqs.map(f => api.updateEventFaq(createdId, f.id!, { question: f.q, answer: f.a }))
        )
        faqUpdateResults.forEach((result) => {
          if (result.status === 'rejected') {
            console.error('Erreur mise à jour FAQ:', result.reason)
            notifyError('Erreur lors de la mise à jour d\'une FAQ')
          }
        })
      }

      const faqResults = await Promise.allSettled(
        newFaqs.map((f, idx) => api.createEventFaq(createdId, { question: f.q, answer: f.a, sort_order: idx }))
      )
      faqResults.forEach((result) => {
        if (result.status === 'rejected') {
          console.error('Erreur création FAQ:', result.reason)
          notifyError('Erreur lors de l\'ajout d\'une FAQ')
        }
      })
    }

    if (createdId && invitationEmails.value.trim()) {
      const emails = invitationEmails.value.split('\n').map(e => e.trim()).filter(Boolean)
      const invitationResults = await Promise.allSettled(
        emails.map(email => api.createInvitation(createdId, {
          type: invitationType.value || 'vip',
          first_name: email.split('@')[0],
          last_name: '',
          email,
          pass_id: ticketTypes.value[0]?.id || null,
          quantity: invitationQuantity.value || 1,
          message: invitationMessage.value || undefined
        }))
      )
      invitationResults.forEach((result, i) => {
        if (result.status === 'rejected') {
          console.error('Erreur création invitation:', result.reason)
          notifyError(`Erreur lors de l'envoi de l'invitation à ${emails[i]}`)
        }
      })
    }

    if (createdId && promoCodes.value.length) {
      const promoResults = await Promise.allSettled(
        promoCodes.value.map(pc => api.createPromoCode({
          code: pc.code, type: pc.type, value: pc.value,
          usage_limit: pc.usage_limit, expires_at: pc.expires_at,
          event_id: createdId,
          min_order_amount: pc.min_order_amount,
          max_per_user: pc.max_per_user
        }))
      )
      promoResults.forEach((result, i) => {
        if (result.status === 'rejected') {
          console.error('Erreur création code promo:', result.reason)
          notifyError(`Erreur lors de l'ajout du code promo "${promoCodes.value[i].code}"`)
        }
      })
    }

    if (createdId && campaignSubject.value && campaignBody.value) {
      try {
        const campaignPayload: Record<string, unknown> = {
          event_id: createdId,
          name: campaignName.value || campaignSubject.value,
          type: emailCampaignType.value === 'invitation' || emailCampaignType.value === 'rappel' || emailCampaignType.value === 'relance' ? 'email' : emailCampaignType.value,
          status: campaignStatus.value === 'sent' ? 'draft' : campaignStatus.value,
          subject: campaignSubject.value,
          sender_name: campaignSenderName.value,
          body: campaignBody.value,
          recipient_type: campaignRecipientType.value,
          schedule: campaignSchedule.value,
          contacts: campaignContacts.value
        }
        const res = await api.createCampaign(campaignPayload)
        if (campaignStatus.value === 'sent') {
          const created = (res as any).data ?? res
          await api.sendCampaign(created.id)
        }
      } catch (err: any) {
        console.error('Erreur création campagne:', err)
        notifyError(err?.message || err?.data?.message || 'Erreur lors de la création de la campagne')
      }
    }

    if (createdId && pdvList.value.length) {
      const pdvResults = await Promise.allSettled(
        pdvList.value.map(async (pdv) => {
          const pdvRes: any = await api.createPdv({
            name: pdv.name, type: pdv.type, address: pdv.address,
            city: pdv.city, hours: pdv.hours, phone: pdv.phone,
            instructions: pdv.instructions
          })
          const pdvId = pdvRes?.data?.id ?? pdvRes?.id
          if (pdvId) await api.assignEventToPdv(pdvId, createdId)
        })
      )
      pdvResults.forEach((result, i) => {
        if (result.status === 'rejected') {
          console.error('Erreur création PDV:', result.reason)
          notifyError(`Erreur lors de l'ajout du point de vente "${pdvList.value[i].name}"`)
        }
      })
    }

    if (publish) {
      draftStatus.value = 'En ligne'
      success('Événement publié avec succès !')
      // Persisted successfully — drop the unsaved-changes guard
      isDirty.value = false
      // Construire le lien public — soit /e/[slug] (landing marketing)
      // soit /events/[slug] en fallback.
      const slugForLink = created?.slug || createdId
      if (slugForLink) {
        const requestUrl = useRequestURL()
        publishedEventUrl.value = `${requestUrl.origin}/e/${slugForLink}`
        publishedEventTitle.value = eventTitle.value
        showPostPublishKit.value = true
        // Pas de navigation immédiate — l'utilisateur ferme le modal puis
        // peut soit aller à la liste, soit gérer plus tard.
        return
      }
      // Pas de slug récupéré → fallback ancien comportement
      setTimeout(() => navigateTo('/dashboard/events'), 600)
    } else {
      draftStatus.value = 'Brouillon sauvegardé'
      success('Brouillon sauvegardé')
      isDirty.value = false
      setTimeout(() => navigateTo('/dashboard/events'), 600)
    }
  } catch (err: any) {
    if (err?.status === 422 && err?.errors) {
      fieldErrors.value = err.errors
      notifyError('Veuillez corriger les erreurs du formulaire')
    } else {
      notifyError(err?.message || err?.data?.message || 'Une erreur est survenue lors de la sauvegarde')
    }
  } finally {
    ref$.value = false
  }
}

function saveDraft() { saveOrPublish(false) }
function publishEvent() { showPublishModal.value = true }
async function confirmPublish() { await saveOrPublish(true); showPublishModal.value = false }
function updateSmsCount(e: Event) { smsCharCount.value = (e.target as HTMLTextAreaElement).value.length }

const loadEditEvent = async () => {
  if (!editId.value) return
  loading.value = true
  try {
    const res = await api.getEvent(editId.value) as any
    const e = res?.data ?? res
    eventTitle.value = e.title || ''
    eventDescription.value = e.description || ''
    selectedCategory.value = e.category || ''
    if (e.date_start) {
      const ds = new Date(e.date_start)
      eventDate.value = ds.toISOString().slice(0, 10)
      eventTime.value = ds.toTimeString().slice(0, 5)
    }
    if (e.date_end) {
      const de = new Date(e.date_end)
      eventEndDate.value = de.toISOString().slice(0, 10)
      eventEndTime.value = de.toTimeString().slice(0, 5)
    }
    eventVenue.value = e.venue || e.location || ''
    // Définir le pays AVANT la ville pour éviter que le watch(eventCountry) ne réinitialise la ville
    eventCountry.value = e.country || ''
    await nextTick()
    eventCity.value = e.city || ''
    eventAddress.value = e.address || e.location || ''
    eventLatitude.value = e.latitude || null
    eventLongitude.value = e.longitude || null
    eventCapacity.value = e.max_capacity || null
    eventType.value = e.event_type || e.event_format || 'presentiel'
    onlinePlatform.value = e.online_platform || ''
    onlineLink.value = e.online_link || ''
    videoUrl.value = e.video_url || ''
    accessMode.value = e.access_mode || 'payant'
    draftStatus.value = e.status === 'published' ? 'En ligne' : 'Brouillon'
    isPrivate.value = !!e.is_private
    isInvitationOnly.value = !!e.is_invitation_only
    
    maxInvitations.value = e.max_invitations || null
    accessInstructions.value = e.access_instructions || ''
    refundPolicy.value = e.refund_policy || 'none'
    customRefundDays.value = e.refund_custom_days || null
    showCustomRefund.value = refundPolicy.value === 'custom'

    // Charger les champs d'inscription
    if (e.registration_fields) {
      inscriptionFields.value = INSCRIPTION_FIELD_DEFS.map(def => ({
        ...def,
        selected: e.registration_fields.includes(def.key),
      }))
    }

    // Charger les images existantes
    if (e.flyer_url) existingFlyerUrl.value = e.flyer_url
    if (e.gallery && Array.isArray(e.gallery)) existingGallery.value = e.gallery

    // Charger les transport options
    if (e.transport_options) {
      try {
        const saved = typeof e.transport_options === 'string' ? JSON.parse(e.transport_options) : e.transport_options
        if (Array.isArray(saved)) {
          transportOptions.value.forEach(t => { t.selected = saved.includes(t.label) })
          sectionStates.value.acces = true
        }
      } catch {}
    }

    // Charger les passes existantes
    if (e.passes?.length) {
      ticketTypes.value = e.passes.map((p: any) => ({
        id: p.id, name: p.name, desc: p.description || '', price: p.price,
        capacity: p.capacity || null,
        sale_start_date: p.sale_start_date || '', sale_end_date: p.sale_end_date || '',
        max_per_order: p.max_per_order || null
      }))
    }

    // Charger les artistes
    try {
      const artistRes = await api.getEventArtists(editId.value) as any
      const artistData = artistRes?.data ?? artistRes
      if (Array.isArray(artistData) && artistData.length) {
        artists.value = artistData.map((a: any) => ({
          id: a.id, name: a.name, role: a.role || '',
          // Defensive: backend may return raw path OR absolute URL.
          // If it already starts with http(s), don't prefix /storage/.
          image: null,
          preview: a.image_path
            ? (/^https?:\/\//i.test(a.image_path) ? a.image_path : `/storage/${a.image_path}`)
            : ''
        }))
        sectionStates.value.artists = true
      }
    } catch {}

    // Charger les FAQs
    try {
      const faqRes = await api.getEventFaqs(editId.value) as any
      const faqData = faqRes?.data ?? faqRes
      if (Array.isArray(faqData) && faqData.length) {
        faqItems.value = faqData.map((f: any) => ({ id: f.id, q: f.question, a: f.answer }))
        sectionStates.value.faq = true
      }
    } catch {}

    // Charger les programmes
    try {
      const progRes = await api.getEventPrograms(editId.value) as any
      const progData = progRes?.data ?? progRes
      if (Array.isArray(progData) && progData.length) {
        programItems.value = progData.map((p: any) => ({
          id: p.id, title: p.title || '', description: p.description || '',
          start_time: p.start_time || '', end_time: p.end_time || '',
          speaker_name: p.speaker_name || ''
        }))
        sectionStates.value.prog = true
      }
    } catch {}
  } catch {
    notifyError('Impossible de charger l\'événement')
  } finally {
    loading.value = false
  }
}

// ── Unsaved-changes guard ────────────────────────────────────
// Prevents losing data on tab close or accidental nav. Tracks the main
// content fields; tweaks to ancillary refs (gallery uploads, etc.) are
// not watched to keep the watcher list cheap.
const isDirty = ref(false)
let suppressDirtyTracking = true
const markDirty = () => { if (!suppressDirtyTracking) isDirty.value = true }

watch(
  [
    eventTitle, eventDescription, eventDate, eventTime, eventEndDate, eventEndTime,
    eventVenue, eventCity, eventAddress, eventCountry, eventCapacity,
    selectedCategory, eventType, accessMode, refundPolicy,
  ],
  markDirty,
)
watch(ticketTypes, markDirty, { deep: true })
watch(promoCodes, markDirty, { deep: true })
watch(pdvList, markDirty, { deep: true })
watch(programItems, markDirty, { deep: true })
watch(artists, markDirty, { deep: true })
watch(faqItems, markDirty, { deep: true })

const handleBeforeUnload = (e: BeforeUnloadEvent) => {
  if (isDirty.value) {
    e.preventDefault()
    e.returnValue = ''
  }
}

onMounted(async () => {
  window.addEventListener('beforeunload', handleBeforeUnload)
  await loadEditEvent()
  // Wait for hydration writes to flush before re-enabling dirty tracking
  await nextTick()
  isDirty.value = false
  suppressDirtyTracking = false
})

onBeforeUnmount(() => {
  window.removeEventListener('beforeunload', handleBeforeUnload)
})

onBeforeRouteLeave(() => {
  if (!isDirty.value) return true
  return window.confirm('Vous avez des modifications non enregistrées. Quitter cette page ?')
})

// Boutons d'action rendus directement en sticky (plus de Teleport)

const finputClass = 'py-2.5 px-3.5 rounded-lg border-[1.5px] border-border-light bg-surface text-sm text-text-primary outline-none w-full transition-all focus:border-orange-primary focus:ring-2 focus:ring-orange-primary/10'
</script>

<template>
  <div>
    <!-- Barre d'action sticky (remplace le Teleport pour fiabilité SPA) -->
    <div class="sticky top-14 z-30 bg-white/95 backdrop-blur-sm border-b border-border-light px-5 sm:px-8 py-2 flex items-center justify-end gap-2.5">
      <button class="min-[901px]:hidden mr-auto p-1.5 text-text-secondary" @click="sidebarOpen = !sidebarOpen">
        <svg v-if="!sidebarOpen" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
        <svg v-else width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>
      <div class="flex items-center gap-1.5 max-sm:hidden">
        <div class="w-[7px] h-[7px] rounded-full shadow-[0_0_0_3px_rgba(217,119,6,0.2)]" :class="draftStatus === 'En ligne' ? 'bg-green-dark' : 'bg-gold'"></div>
        <span class="text-[0.72rem] text-text-tertiary">{{ draftStatus }}</span>
      </div>
      <button class="px-[18px] py-[7px] rounded-full text-[0.78rem] font-bold bg-blue-dim text-text-primary border-[1.5px] border-border-medium hover:bg-[rgba(27,43,94,0.12)] flex items-center gap-1.5 transition-all max-sm:px-3" :class="{ 'opacity-60 cursor-not-allowed': saving || submitting }" :disabled="saving || submitting" @click="saveDraft">
        <svg v-if="saving" class="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10" stroke-opacity="0.25"/><path d="M12 2a10 10 0 0 1 10 10" stroke-opacity="0.75"/></svg>
        <svg v-else width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1-2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
        <span class="max-sm:hidden">{{ saving ? 'Sauvegarde en cours...' : (isEdit ? 'Sauvegarder en brouillon' : 'Sauvegarder') }}</span>
      </button>
      <button class="px-[18px] py-[7px] rounded-full text-[0.78rem] font-bold bg-orange-primary text-white border-none hover:bg-orange-light flex items-center gap-1.5 transition-all max-sm:px-3" :class="{ 'opacity-60 cursor-not-allowed': submitting || saving }" :disabled="submitting || saving" @click="publishEvent">
        <svg v-if="submitting" class="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10" stroke-opacity="0.25"/><path d="M12 2a10 10 0 0 1 10 10" stroke-opacity="0.75"/></svg>
        <svg v-else width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
        <span class="max-sm:hidden">{{ submitting ? (isEdit ? 'Enregistrement en cours...' : 'Publication en cours...') : (isEdit ? 'Enregistrer les modifications' : 'Publier') }}</span>
      </button>
    </div>

    <div v-if="isEdit && loading" class="flex items-center justify-center min-h-[60vh]">
      <div class="text-text-tertiary text-[0.9rem]">Chargement de l'événement…</div>
    </div>

    <div v-else class="flex min-h-[calc(100vh-56px)] max-[900px]:flex-col">
      <!-- Overlay mobile -->
      <Transition name="fade-overlay">
        <div v-if="sidebarOpen" class="min-[901px]:hidden fixed inset-0 bg-black/30 z-40" @click="sidebarOpen = false" />
      </Transition>
      <!-- Sidebar : toujours visible desktop, overlay mobile -->
      <nav class="w-60 shrink-0 bg-surface border-r border-border-light py-8 sticky top-14 h-[calc(100vh-56px)] overflow-y-auto max-[900px]:fixed max-[900px]:left-0 max-[900px]:top-0 max-[900px]:z-50 max-[900px]:h-full max-[900px]:border-r max-[900px]:transition-transform max-[900px]:duration-300 max-[900px]:ease-in-out" :class="{ 'max-[900px]:-translate-x-full': !sidebarOpen }">
        <div class="text-[0.65rem] font-bold uppercase tracking-[0.12em] text-text-tertiary px-6 mb-2.5">Étapes requises</div>
        <div v-for="step in requiredSteps" :key="step.id" class="flex items-center gap-3 px-6 py-[13px] cursor-pointer transition-colors border-l-[3px]" :class="currentStep === step.id ? 'border-l-orange-primary bg-white' : 'border-l-transparent hover:bg-bg-primary'" @click="goStep(step.id)">
          <div class="w-7 h-7 rounded-full border-2 flex items-center justify-center text-[0.72rem] font-bold shrink-0" :class="currentStep === step.id ? 'bg-orange-primary text-white border-orange-primary' : visitedSteps.has(step.id) ? 'bg-green-dark text-white border-green-dark' : 'bg-bg-primary text-text-tertiary border-border-medium'">
            <svg v-if="visitedSteps.has(step.id) && currentStep !== step.id" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><polyline points="20 6 9 17 4 12"/></svg>
            <span v-else>{{ step.id }}</span>
          </div>
          <div><div class="text-[0.85rem] font-semibold" :class="currentStep === step.id ? 'text-orange-primary' : 'text-ink2'">{{ step.title }}</div><div class="text-[0.72rem] text-text-tertiary mt-px">{{ step.sub }}</div></div>
        </div>
        <div class="h-px bg-border-light mx-6 my-4"></div>
        <div class="text-[0.65rem] font-bold uppercase tracking-[0.12em] text-text-tertiary px-6 mb-2.5">Sections optionnelles</div>
        <div v-for="step in optionalSteps" :key="step.id" class="flex items-center gap-3 px-6 py-[11px] cursor-pointer transition-colors border-l-[3px]" :class="currentStep === step.id ? 'border-l-orange-primary bg-white' : 'border-l-transparent hover:bg-bg-primary'" @click="goStep(step.id)">
          <div class="w-7 h-7 rounded-lg border flex items-center justify-center text-[0.85rem] shrink-0" :class="currentStep === step.id ? 'border-orange-primary':'bg-bg-primary border-border-light'">
            <svg v-if="step.icon==='clipboard'" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="1"/></svg>
            <svg v-else-if="step.icon==='mic'" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/></svg>
            <svg v-else-if="step.icon==='help'" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
            <svg v-else-if="step.icon==='map'" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/></svg>
            <svg v-else-if="step.icon==='tag'" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>
            <svg v-else-if="step.icon==='sms'" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
            <svg v-else-if="step.icon==='store'" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
            <svg v-else width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
          </div>
          <div><div class="text-[0.85rem] font-semibold" :class="currentStep === step.id ? 'text-orange-primary' : 'text-ink2'">{{ step.title }}</div><div class="text-[0.72rem] text-text-tertiary mt-px">{{ step.sub }}</div></div>
        </div>
        <div class="h-px bg-border-light mx-6 my-4"></div>
        <div class="flex items-center gap-3 px-6 py-[13px] cursor-pointer border-l-[3px]" :class="currentStep === 8 ? 'border-l-orange-primary bg-white' : 'border-l-transparent hover:bg-bg-primary'" @click="goStep(8)">
          <div class="w-7 h-7 rounded-full border-2 flex items-center justify-center text-[0.72rem] font-bold shrink-0" :class="currentStep === 8 ? 'bg-orange-primary text-white border-orange-primary' : 'bg-bg-primary text-text-tertiary border-border-medium'">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><polyline points="20 6 9 17 4 12"/></svg>
          </div>
          <div><div class="text-[0.85rem] font-semibold" :class="currentStep === 8 ? 'text-orange-primary' : 'text-ink2'">Publication</div><div class="text-[0.72rem] text-text-tertiary mt-px">Récapitulatif & mise en ligne</div></div>
        </div>
      </nav>

      <div class="flex-1 min-w-0 py-10 px-8 lg:px-12 max-[900px]:px-5 max-[900px]:py-6">
       <div class="max-w-3xl">

        <div v-show="currentStep === 1">
          <div class="mb-9"><div class="text-[0.7rem] font-bold uppercase tracking-[0.12em] text-text-primary opacity-50 mb-2">Étape 1 sur 3</div><h1 class="font-serif text-[1.8rem] mb-2">Informations générales</h1><p class="text-[0.9rem] text-text-tertiary leading-relaxed">Informations essentielles</p></div>
          <div class="flex flex-col gap-[7px] mb-6"><label class="text-[0.78rem] font-bold text-ink2 tracking-wide">Nom de l'événement <span class="text-red-error ml-0.5">*</span></label><input v-model="eventTitle" :class="finputClass" placeholder="ex : Vibe Venture 2025 — Wine & Music Festival" /></div>
          <div class="flex flex-col gap-[7px] mb-6"><label class="text-[0.78rem] font-bold text-ink2 tracking-wide">Description <span class="text-red-error ml-0.5">*</span></label><textarea v-model="eventDescription" :class="finputClass + ' resize-y min-h-[100px] leading-relaxed'" rows="4" placeholder="Décrivez votre événement…"></textarea></div>
          <div class="grid grid-cols-2 gap-5 mb-6 max-[900px]:grid-cols-1">
            <div class="flex flex-col gap-[7px]"><label class="text-[0.78rem] font-bold text-ink2 tracking-wide">Catégorie <span class="text-red-error ml-0.5">*</span></label><select :class="finputClass" v-model="selectedCategory" @change="onCategoryChange"><option value="">Choisir une catégorie</option><option v-for="c in categories" :key="c.value" :value="c.value">{{ c.label }}</option></select><input v-if="showCatCustom" :class="finputClass + ' mt-2'" placeholder="Précisez votre catégorie…" /></div>
            <div class="flex flex-col gap-[7px]"><label class="text-[0.78rem] font-bold text-ink2 tracking-wide">Langue principale</label><select :class="finputClass"><option>Français</option><option>Anglais</option><option>Wolof</option><option>Arabe</option></select></div>
          </div>
          <div class="grid grid-cols-2 gap-5 mb-6 max-[900px]:grid-cols-1"><div class="flex flex-col gap-[7px]"><label class="text-[0.78rem] font-bold text-ink2 tracking-wide">Date de début <span class="text-red-error ml-0.5">*</span></label><input v-model="eventDate" type="date" :min="todayIso" :class="finputClass" /></div><div class="flex flex-col gap-[7px]"><label class="text-[0.78rem] font-bold text-ink2 tracking-wide">Heure de début <span class="text-red-error ml-0.5">*</span></label><input v-model="eventTime" type="time" :class="finputClass" /></div></div>
                    <div class="grid grid-cols-2 gap-5 mb-6 max-[900px]:grid-cols-1"><div class="flex flex-col gap-[7px]"><label class="text-[0.78rem] font-bold text-ink2 tracking-wide">Date de fin</label><input v-model="eventEndDate" type="date" :min="minEndDate" :class="finputClass" /></div><div class="flex flex-col gap-[7px]"><label class="text-[0.78rem] font-bold text-ink2 tracking-wide">Heure de fin</label><input v-model="eventEndTime" type="time" :class="finputClass" /></div></div>
                    <div v-if="dateRangeError" class="text-xs text-red-error mb-4 -mt-3 flex items-center gap-1.5"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>{{ dateRangeError }}</div>
          <div class="flex flex-col gap-[7px] mb-6"><label class="text-[0.78rem] font-bold text-ink2 tracking-wide">Type d'événement <span class="text-red-error ml-0.5">*</span></label><div class="flex gap-2.5 flex-wrap"><div v-for="t in ['presentiel','enligne','hybride']" :key="t" class="flex items-center gap-2 px-4 py-2.5 rounded-lg border-[1.5px] cursor-pointer transition-all bg-surface text-sm font-medium" :class="eventType===t?'border-orange-primary text-orange-primary':'border-border-light hover:border-border-medium'" @click="eventType=t"><div class="w-3.5 h-3.5 rounded-full border-2 shrink-0" :class="eventType===t?'border-orange-primary bg-orange-primary':'border-border-medium'"></div>{{ t==='presentiel'?'Présentiel':t==='enligne'?'En ligne':'Hybride' }}</div></div></div>
          <div v-if="eventType==='presentiel'||eventType==='hybride'">
            <div class="grid grid-cols-2 gap-5 mb-6 max-[900px]:grid-cols-1"><div class="flex flex-col gap-[7px]"><label class="text-[0.78rem] font-bold text-ink2 tracking-wide">Pays <span class="text-red-error ml-0.5">*</span></label><select v-model="eventCountry" :class="finputClass"><option value="" disabled>Sélectionnez un pays</option><option v-for="c in COUNTRY_OPTIONS" :key="c.code" :value="c.code">{{ c.label }}</option></select></div><div><UiBaseAutocomplete v-model="eventCity" label="Ville" :placeholder="eventCountry ? 'Commencez à taper une ville...' : 'Sélectionnez d\'abord un pays'" :suggestions="citySuggestions" :loading="cityLoading" :disabled="!eventCountry" required @search="onCitySearch" /></div></div>
            <div class="grid grid-cols-2 gap-5 mb-6 max-[900px]:grid-cols-1"><div class="flex flex-col gap-[7px]"><label class="text-[0.78rem] font-bold text-ink2 tracking-wide">Nom du lieu <span class="text-red-error ml-0.5">*</span></label><input v-model="eventVenue" :class="finputClass" placeholder="ex : Résidences Mamoune" /></div><div><UiBaseAutocomplete v-model="eventAddress" label="Adresse / Localisation" :placeholder="eventCity ? 'Rechercher un lieu, hôtel, salle...' : 'Sélectionnez d\'abord une ville'" :suggestions="addressSuggestions" :loading="addressLoading" :disabled="!eventCity" @search="onAddressSearch" /></div></div>
            <div class="grid grid-cols-2 gap-5 mb-6 max-[900px]:grid-cols-1"><div class="flex flex-col gap-[7px]"><label class="text-[0.78rem] font-bold text-ink2 tracking-wide">Capacité maximale <span class="text-red-error ml-0.5">*</span></label><input v-model.number="eventCapacity" type="number" :class="finputClass" placeholder="ex : 2000" /></div><div class="flex flex-col gap-[7px]"><label class="text-[0.78rem] font-bold text-ink2 tracking-wide">Récurrence <span class="text-[0.72rem] font-medium text-text-tertiary ml-1">(optionnel)</span></label><select :class="finputClass"><option value="">Événement unique</option><option>Hebdomadaire</option><option>Mensuel</option><option>Personnalisé</option></select></div></div>
          </div>
          <div v-if="eventType==='enligne'||eventType==='hybride'">
            <div class="grid grid-cols-2 gap-5 mb-6 max-[900px]:grid-cols-1"><div class="flex flex-col gap-[7px]"><label class="text-[0.78rem] font-bold text-ink2 tracking-wide">Plateforme <span class="text-red-error ml-0.5">*</span></label><select v-model="onlinePlatform" :class="finputClass"><option value="">Choisir une plateforme</option><option>Zoom</option><option>YouTube Live</option><option>Facebook Live</option><option>Google Meet</option><option>Autre</option></select></div><div class="flex flex-col gap-[7px]"><label class="text-[0.78rem] font-bold text-ink2 tracking-wide">Lien de l'événement</label><input v-model="onlineLink" :class="finputClass" placeholder="ex : https://zoom.us/j/…" /></div></div>
          </div>
          <div class="flex items-center justify-between py-7 mt-4 border-t border-border-light"><span class="text-[0.78rem] text-text-tertiary">Étape 1 sur 3 — Informations requises</span><button class="px-[26px] py-2.5 rounded-full bg-orange-primary text-white text-[0.85rem] font-bold border-none cursor-pointer hover:bg-orange-light" @click="goStep(2)">Suivant → Billets & Prix</button></div>
        </div>

        <div v-show="currentStep === 2">
          <div class="mb-9"><div class="text-[0.7rem] font-bold uppercase tracking-[0.12em] text-text-primary opacity-50 mb-2">Étape 2 sur 3</div><h1 class="font-serif text-[1.8rem] mb-2">Accès & Billets</h1><p class="text-[0.9rem] text-text-tertiary leading-relaxed">Mode d'accès à l'événement</p></div>
          <div class="mb-7"><label class="text-[0.78rem] font-bold text-ink2 tracking-wide">Type d'accès <span class="text-red-error ml-0.5">*</span></label><div class="grid grid-cols-3 gap-3 mt-2 max-[900px]:grid-cols-1"><div v-for="m in [{id:'payant',t:'Payant',d:'Billets avec tarifs définis'},{id:'inscription',t:'Gratuit sur inscription',d:'Inscription obligatoire'},{id:'libre',t:'Entrée libre',d:'Aucune inscription requise'}]" :key="m.id" class="flex flex-col items-center text-center gap-2 p-5 rounded-lg border-2 bg-white cursor-pointer transition-all" :class="accessMode===m.id?'border-orange-primary border-2':'border-border-light hover:border-border-medium'" @click="accessMode=m.id"><div class="text-[0.88rem] font-bold" :class="accessMode===m.id?'text-orange-primary':'text-text-primary'">{{ m.t }}</div><div class="text-[0.72rem] text-text-tertiary">{{ m.d }}</div></div></div></div>
          <div v-if="accessMode==='payant'">
            <div class="mb-6"><label class="text-[0.78rem] font-bold text-ink2 tracking-wide">Politique de remboursement</label><div class="flex gap-2.5 flex-wrap mt-2"><div v-for="r in [{v:'none',l:'Non remboursable'},{v:'j14',l:'Remboursable J-14'},{v:'j7',l:'Remboursable J-7'},{v:'j2',l:'Remboursable J-2'},{v:'custom',l:'Délai personnalisé'}]" :key="r.v" class="flex items-center gap-2 px-4 py-2.5 rounded-lg border-[1.5px] cursor-pointer transition-all bg-surface text-sm font-medium" :class="refundPolicy===r.v?'border-orange-primary text-orange-primary':'border-border-light hover:border-border-medium'" @click="selectRefund(r.v)"><div class="w-3.5 h-3.5 rounded-full border-2 shrink-0" :class="refundPolicy===r.v?'border-orange-primary bg-orange-primary':'border-border-medium'"></div>{{ r.l }}</div></div>
<div v-if="showCustomRefund" class="mt-3">
    <label class="block text-sm font-medium text-text-secondary mb-1">Nombre de jours avant l'événement</label>
    <input v-model.number="customRefundDays" type="number" min="1" max="90" placeholder="Ex: 10"
        class="w-40 px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-primary/20 focus:border-orange-primary" />
</div>
</div>
            
            <label class="text-[0.78rem] font-bold text-ink2 tracking-wide mb-2 block">Types de billets <span class="text-red-error ml-0.5">*</span></label>
            <div class="flex flex-col gap-3">
              <div v-for="(t,i) in ticketTypes" :key="i" class="bg-surface border-[1.5px] border-border-light rounded-xl p-4 grid grid-cols-[1fr_1fr_120px_120px_36px] gap-3 items-start max-[900px]:grid-cols-[1fr_1fr] max-[900px]:grid-rows-[auto_auto] hover:border-border-medium">
                <div><div class="text-[0.72rem] font-bold uppercase tracking-wide text-text-tertiary mb-1">Nom du billet</div><input v-model="t.name" class="bg-transparent border-none outline-none text-[0.9rem] text-text-primary w-full placeholder:text-border-medium" placeholder="ex : Pass Standard" /></div>
                <div><div class="text-[0.72rem] font-bold uppercase tracking-wide text-text-tertiary mb-1">Description</div><input v-model="t.desc" class="bg-transparent border-none outline-none text-[0.9rem] text-text-primary w-full placeholder:text-border-medium" placeholder="ex : Accès journée complet" /></div>
                <div><div class="text-[0.72rem] font-bold uppercase tracking-wide text-text-tertiary mb-1">Prix (FCFA)</div><input v-model.number="t.price" type="number" class="bg-transparent border-none outline-none font-serif text-[1.1rem] text-text-primary w-full placeholder:text-border-medium" placeholder="0" /></div>
                                <div><div class="text-[0.72rem] font-bold uppercase tracking-wide text-text-tertiary mb-1">Capacité <span class="text-red-error">*</span></div><input v-model.number="t.capacity" type="number" class="bg-transparent border-none outline-none font-serif text-[1.1rem] text-text-primary w-full placeholder:text-border-medium" placeholder="ex : 500" /></div>
                <button class="w-8 h-8 rounded-lg border border-border-light text-text-tertiary flex items-center justify-center hover:bg-red-dim hover:text-red-error hover:border-red-error transition-all mt-1" @click="removeTicket(i)"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>
                <div class="col-span-full grid grid-cols-3 gap-3 border-t border-border-light pt-3 mt-1 max-[900px]:grid-cols-1"><div><div class="text-[0.72rem] font-bold uppercase tracking-wide text-text-tertiary mb-1">Début ventes</div><input v-model="t.sale_start_date" type="datetime-local" :min="nowDateTimeIso" :max="eventDateTimeIso || undefined" class="bg-transparent border border-border-light rounded-lg outline-none text-[0.8rem] text-text-primary w-full px-2 py-1.5 focus:border-orange-primary" /></div><div><div class="text-[0.72rem] font-bold uppercase tracking-wide text-text-tertiary mb-1">Fin ventes</div><input v-model="t.sale_end_date" type="datetime-local" :min="t.sale_start_date || nowDateTimeIso" :max="eventDateTimeIso || undefined" class="bg-transparent border border-border-light rounded-lg outline-none text-[0.8rem] text-text-primary w-full px-2 py-1.5 focus:border-orange-primary" /></div><div><div class="text-[0.72rem] font-bold uppercase tracking-wide text-text-tertiary mb-1">Max par commande</div><input v-model.number="t.max_per_order" type="number" min="1" class="bg-transparent border border-border-light rounded-lg outline-none text-[0.8rem] text-text-primary w-full px-2 py-1.5 focus:border-orange-primary" placeholder="Illimité" /></div></div>
              </div>
              <button class="flex items-center justify-center gap-2 p-3 rounded-xl border-[1.5px] border-dashed border-border-medium bg-transparent text-text-tertiary text-[0.85rem] font-semibold w-full hover:border-orange-primary hover:text-orange-primary hover:bg-orange-dim transition-all" @click="addTicket"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg> Ajouter un type de billet</button>
            </div>
          </div>
          <div v-if="accessMode==='inscription'">
            <p class="text-sm text-text-secondary mb-4">Les participants devront s'inscrire pour obtenir leur place.</p>
            <label class="text-[0.78rem] font-bold text-ink2 tracking-wide mb-2 block">Informations collectées à l'inscription</label>
            <div class="flex gap-2.5 flex-wrap mb-6"><div v-for="f in inscriptionFields" :key="f.label" class="flex items-center gap-2 px-4 py-2.5 rounded-lg border-[1.5px] cursor-pointer transition-all bg-surface text-sm font-medium" :class="f.selected?'border-orange-primary text-orange-primary':'border-border-light'" @click="f.selected=!f.selected"><div class="w-3.5 h-3.5 rounded-full border-2 shrink-0" :class="f.selected?'border-orange-primary bg-orange-primary':'border-border-medium'"></div>{{ f.label }}</div></div>

          </div>
          <div v-if="accessMode==='libre'"><p class="text-sm text-text-secondary mb-4">Aucune inscription requise. Votre page affichera "Entrée libre".</p></div>
          <div class="flex items-center justify-between py-7 mt-4 border-t border-border-light"><span class="text-[0.78rem] text-text-tertiary">Étape 2 sur 3</span><div class="flex gap-2.5"><button class="px-[22px] py-2.5 rounded-full border-[1.5px] border-border-light bg-surface text-[0.85rem] font-semibold text-ink2 hover:border-text-primary hover:text-text-primary" @click="goStep(1)">← Retour</button><button class="px-[26px] py-2.5 rounded-full bg-orange-primary text-white text-[0.85rem] font-bold border-none cursor-pointer hover:bg-orange-light" @click="goStep(3)">Suivant → Médias</button></div></div>
        </div>

        <div v-show="currentStep === 3">
          <div class="mb-9"><div class="text-[0.7rem] font-bold uppercase tracking-[0.12em] text-text-primary opacity-50 mb-2">Étape 3 sur 3</div><h1 class="font-serif text-[1.8rem] mb-2">Médias</h1><p class="text-[0.9rem] text-text-tertiary leading-relaxed">Image de couverture et photos.</p></div>
          <div class="mb-6"><label class="text-[0.78rem] font-bold text-ink2 tracking-wide mb-2 block">Image de couverture <span class="text-red-error ml-0.5">*</span></label><div class="border-2 border-dashed border-border-medium rounded-2xl min-h-[200px] flex items-center justify-center flex-col gap-3 cursor-pointer transition-all bg-surface hover:border-orange-primary hover:bg-orange-dim" @click="($refs.flyerInput as HTMLInputElement)?.click()" @dragover.prevent @drop.prevent="(e: DragEvent) => { if (e.dataTransfer?.files[0]) { eventFlyer = e.dataTransfer.files[0]; existingFlyerUrl = '' } }"><input ref="flyerInput" type="file" accept="image/jpeg,image/png,image/webp" class="hidden" @change="(e: Event) => { const f = (e.target as HTMLInputElement).files?.[0]; if (f) { eventFlyer = f; existingFlyerUrl = '' } }" /><template v-if="eventFlyer"><div class="text-[0.85rem] font-semibold text-orange-primary">{{ eventFlyer.name }}</div><div class="text-[0.75rem] text-text-tertiary">{{ (eventFlyer.size / 1024).toFixed(0) }} Ko</div></template><template v-else-if="existingFlyerUrl"><img :src="existingFlyerUrl" class="max-h-[180px] rounded-xl object-contain" /><div class="text-[0.75rem] text-text-tertiary mt-1">Image actuelle — Cliquez pour remplacer</div></template><template v-else><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="text-text-tertiary"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg><div class="text-[0.85rem] font-semibold text-text-tertiary">Cliquez ou glissez votre image ici</div><div class="text-[0.75rem] text-border-medium">JPG, PNG, WebP — 1920×1080px recommandé</div></template></div></div>
          <div class="mb-6"><label class="text-[0.78rem] font-bold text-ink2 tracking-wide mb-2 block">Lien vidéo <span class="text-[0.72rem] font-medium text-text-tertiary ml-1">(optionnel)</span></label><input v-model="videoUrl" :class="finputClass" placeholder="ex : https://youtube.com/watch?v=…" /><div class="text-[0.73rem] text-text-tertiary mt-1.5">Optionnel</div></div>
          <div class="mb-6"><label class="text-[0.78rem] font-bold text-ink2 tracking-wide mb-2 block">Galerie photos <span class="text-[0.72rem] font-medium text-text-tertiary ml-1">(optionnel — {{ galleryImages.length + existingGallery.length }}/{{ MAX_GALLERY }})</span></label><div class="grid grid-cols-4 gap-2.5"><div v-for="(url, idx) in existingGallery" :key="'eg-'+idx" class="aspect-square rounded-[10px] border-[1.5px] border-border-medium bg-surface relative overflow-hidden group"><img :src="url" class="w-full h-full object-cover" /><button type="button" class="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity" @click="existingGallery.splice(idx, 1)"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button></div><div v-for="(img, idx) in galleryImages" :key="'gi-'+idx" class="aspect-square rounded-[10px] border-[1.5px] border-border-medium bg-surface relative overflow-hidden group"><img :src="img.preview" class="w-full h-full object-cover" /><button type="button" class="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity" @click="removeGalleryImage(idx)"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button><input :ref="(el: any) => { if (el) galleryInputRefs[idx] = el }" type="file" accept="image/*" class="hidden" @change="(e: Event) => onGallerySelect(e, idx)" /></div><div v-if="(galleryImages.length + existingGallery.length) < MAX_GALLERY" class="aspect-square rounded-[10px] border-[1.5px] border-dashed border-border-medium bg-surface flex items-center justify-center cursor-pointer text-[1.2rem] text-text-tertiary hover:border-orange-primary hover:text-orange-primary" @click="triggerGalleryInput(galleryImages.length)"><input :ref="(el: any) => { if (el) galleryInputRefs[galleryImages.length] = el }" type="file" accept="image/*" class="hidden" @change="(e: Event) => onGallerySelect(e, galleryImages.length)" />＋</div></div></div>
          <div class="flex items-center justify-between py-7 mt-4 border-t border-border-light"><span class="text-[0.78rem] text-text-tertiary">Étape 3 sur 3 — Sections optionnelles disponibles</span><div class="flex gap-2.5"><button class="px-[22px] py-2.5 rounded-full border-[1.5px] border-border-light bg-surface text-[0.85rem] font-semibold text-ink2 hover:border-text-primary" @click="goStep(2)">← Retour</button><button class="px-[26px] py-2.5 rounded-full bg-orange-primary text-white text-[0.85rem] font-bold border-none cursor-pointer hover:bg-orange-light" @click="goStep(4)">Suivant → Sections optionnelles</button></div></div>
        </div>

        <div v-show="currentStep === 4">
          <div class="mb-9"><div class="text-[0.7rem] font-bold uppercase tracking-[0.12em] text-text-primary opacity-50 mb-2">Section optionnelle</div><h1 class="font-serif text-[1.8rem] mb-2">Programme</h1><p class="text-[0.9rem] text-text-tertiary leading-relaxed">Déroulé de votre événement.</p></div>
          <div class="border-[1.5px] rounded-2xl overflow-hidden mb-5 transition-colors" :class="sectionStates.prog?'border-orange-primary':'border-border-light'"><div class="flex items-center justify-between p-4 px-5 cursor-pointer bg-white hover:bg-bg-primary select-none" @click="toggleSection('prog')"><div class="flex items-center gap-3"><div class="w-9 h-9 rounded-[10px] flex items-center justify-center text-[1.1rem] shrink-0 border" :class="sectionStates.prog?'border-orange-primary':'bg-bg-primary border-border-light'"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="1"/></svg></div><div><div class="text-[0.9rem] font-semibold text-text-primary">Inclure un programme</div><div class="text-[0.75rem] text-text-tertiary mt-px">Déroulé horaire de la journée</div></div></div><div class="w-10 h-[22px] rounded-full relative shrink-0 transition-colors" :class="sectionStates.prog?'bg-orange-primary':'bg-border-medium'"><div class="absolute top-[3px] left-[3px] w-4 h-4 rounded-full bg-white shadow-sm transition-transform" :class="sectionStates.prog?'translate-x-[18px]':''"></div></div></div>
          <div v-show="sectionStates.prog" class="p-5 border-t border-border-light bg-bg-primary">
            <div class="flex flex-col gap-2.5">
              <div v-for="(p,i) in programItems" :key="i" class="bg-surface border-[1.5px] border-border-light rounded-xl p-3.5 relative">
                <div class="grid grid-cols-2 gap-2.5 mb-2">
                  <div><label class="text-[0.72rem] font-bold text-ink2 mb-1 block">Heure début *</label><input v-model="p.start_time" type="time" class="bg-transparent border border-border-light rounded-lg outline-none text-[0.85rem] text-text-primary w-full px-2.5 py-1.5 focus:border-orange-primary" /></div>
                  <div><label class="text-[0.72rem] font-bold text-ink2 mb-1 block">Heure fin</label><input v-model="p.end_time" type="time" :min="p.start_time || undefined" class="bg-transparent border border-border-light rounded-lg outline-none text-[0.85rem] text-text-primary w-full px-2.5 py-1.5 focus:border-orange-primary" :class="p.end_time && p.start_time && p.end_time <= p.start_time ? 'border-red-error' : ''" /></div>
                </div>
                <input v-model="p.title" class="bg-transparent border-none outline-none text-[0.88rem] font-semibold text-text-primary w-[calc(100%-32px)] mb-1.5 placeholder:text-border-medium" placeholder="Titre de l'activité *" />
                <input v-model="p.description" class="bg-transparent border-none outline-none text-[0.82rem] text-text-tertiary w-[calc(100%-32px)] mb-1.5 placeholder:text-border-medium" placeholder="Description courte…" />
                <input v-model="p.speaker_name" class="bg-transparent border-none outline-none text-[0.82rem] text-text-tertiary w-[calc(100%-32px)] placeholder:text-border-medium" placeholder="Nom de l'intervenant (optionnel)" />
                <button class="absolute top-2.5 right-2.5 w-6 h-6 rounded-md bg-bg-primary border border-border-light text-text-tertiary flex items-center justify-center hover:bg-red-dim hover:text-red-error hover:border-red-error transition-all" @click="removeProgItem(i)"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>
              </div>
            </div>
            <button class="flex items-center justify-center gap-2 p-2.5 rounded-xl border-[1.5px] border-dashed border-border-medium bg-transparent text-text-tertiary text-[0.83rem] font-semibold w-full mt-2.5 hover:border-orange-primary hover:text-orange-primary hover:bg-orange-dim transition-all" @click="addProgItem"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg> Ajouter une activité</button>
          </div></div>
          <div class="flex items-center justify-between py-7 mt-4 border-t border-border-light"><span class="text-[0.78rem] text-text-tertiary">Section optionnelle</span><div class="flex gap-2.5"><button class="px-[22px] py-2.5 rounded-full border-[1.5px] border-border-light bg-surface text-[0.85rem] font-semibold text-ink2" @click="goStep(3)">← Retour</button><button class="px-[26px] py-2.5 rounded-full bg-orange-primary text-white text-[0.85rem] font-bold border-none cursor-pointer hover:bg-orange-light" @click="goStep(5)">Suivant → Artistes</button></div></div>
        </div>

        <div v-show="currentStep === 5">
          <div class="mb-9"><div class="text-[0.7rem] font-bold uppercase tracking-[0.12em] text-text-primary opacity-50 mb-2">Section optionnelle</div><h1 class="font-serif text-[1.8rem] mb-2">Artistes & Intervenants</h1><p class="text-[0.9rem] text-text-tertiary leading-relaxed">Artistes, speakers ou intervenants.</p></div>
          <div class="border-[1.5px] rounded-2xl overflow-hidden mb-5" :class="sectionStates.artists?'border-orange-primary':'border-border-light'"><div class="flex items-center justify-between p-4 px-5 cursor-pointer bg-white hover:bg-bg-primary select-none" @click="toggleSection('artists')"><div class="flex items-center gap-3"><div class="w-9 h-9 rounded-[10px] flex items-center justify-center shrink-0 border" :class="sectionStates.artists?'border-orange-primary':'bg-bg-primary border-border-light'"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/></svg></div><div><div class="text-[0.9rem] font-semibold text-text-primary">Inclure des artistes / intervenants</div><div class="text-[0.75rem] text-text-tertiary mt-px">Photos, noms et rôles</div></div></div><div class="w-10 h-[22px] rounded-full relative shrink-0" :class="sectionStates.artists?'bg-orange-primary':'bg-border-medium'"><div class="absolute top-[3px] left-[3px] w-4 h-4 rounded-full bg-white shadow-sm transition-transform" :class="sectionStates.artists?'translate-x-[18px]':''"></div></div></div>
          <div v-show="sectionStates.artists" class="p-5 border-t border-border-light bg-bg-primary"><div class="grid grid-cols-3 gap-3.5 max-[900px]:grid-cols-2">
            <div v-for="(a,i) in artists" :key="i" class="bg-surface border-[1.5px] border-border-light rounded-lg p-[18px] flex flex-col items-center gap-2.5 relative hover:border-border-medium"><div class="w-[72px] h-[72px] rounded-full border-2 border-border-light bg-bg-primary overflow-hidden shrink-0 cursor-pointer hover:border-orange-primary" @click="triggerArtistImage(i)"><img v-if="a.preview" :src="a.preview" class="w-full h-full object-cover block" /><div v-else class="w-full h-full flex items-center justify-center text-text-tertiary"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg></div><input :ref="(el: any) => { if (el) artistImageRefs[i] = el }" type="file" accept="image/*" class="hidden" @change="(e: Event) => onArtistImageSelect(e, i)" /></div><input class="bg-transparent border-none border-b border-border-light outline-none text-[0.85rem] text-center text-text-primary w-full pb-1 focus:border-b-orange-primary" :value="a.name" placeholder="Nom de l'artiste" @input="(e: Event) => a.name = (e.target as HTMLInputElement).value" /><input class="bg-transparent border-none border-b border-border-light outline-none text-[0.72rem] text-center text-text-tertiary w-full pb-1" :value="a.role" placeholder="Rôle" @input="(e: Event) => a.role = (e.target as HTMLInputElement).value" /><button class="absolute top-2 right-2 w-[22px] h-[22px] rounded-full bg-bg-primary border border-border-light text-text-tertiary flex items-center justify-center opacity-0 hover:bg-red-dim hover:text-red-error hover:border-red-error group-hover:opacity-100" style="opacity:1" @click="removeArtist(i)"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button></div>
            <button class="flex flex-col items-center justify-center gap-2 p-[18px] border-[1.5px] border-dashed border-border-medium rounded-lg bg-transparent text-text-tertiary min-h-[160px] hover:border-orange-primary hover:text-orange-primary hover:bg-orange-dim transition-all" @click="addArtist"><div class="text-[1.6rem]">＋</div><div class="text-[0.8rem] font-semibold">Ajouter</div></button>
          </div></div></div>
          <div class="flex items-center justify-between py-7 mt-4 border-t border-border-light"><span class="text-[0.78rem] text-text-tertiary">Section optionnelle</span><div class="flex gap-2.5"><button class="px-[22px] py-2.5 rounded-full border-[1.5px] border-border-light bg-surface text-[0.85rem] font-semibold text-ink2" @click="goStep(4)">← Retour</button><button class="px-[26px] py-2.5 rounded-full bg-orange-primary text-white text-[0.85rem] font-bold border-none cursor-pointer hover:bg-orange-light" @click="goStep(6)">Suivant → FAQ</button></div></div>
        </div>

        <div v-show="currentStep === 6">
          <div class="mb-9"><div class="text-[0.7rem] font-bold uppercase tracking-[0.12em] text-text-primary opacity-50 mb-2">Section optionnelle</div><h1 class="font-serif text-[1.8rem] mb-2">Questions fréquentes</h1><p class="text-[0.9rem] text-text-tertiary leading-relaxed">Questions fréquentes de vos participants.</p></div>
          <div class="border-[1.5px] rounded-2xl overflow-hidden mb-5" :class="sectionStates.faq?'border-orange-primary':'border-border-light'"><div class="flex items-center justify-between p-4 px-5 cursor-pointer bg-white hover:bg-bg-primary select-none" @click="toggleSection('faq')"><div class="flex items-center gap-3"><div class="w-9 h-9 rounded-[10px] flex items-center justify-center shrink-0 border" :class="sectionStates.faq?'border-orange-primary':'bg-bg-primary border-border-light'"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg></div><div><div class="text-[0.9rem] font-semibold text-text-primary">Inclure une FAQ</div><div class="text-[0.75rem] text-text-tertiary mt-px">Questions & réponses pour vos participants</div></div></div><div class="w-10 h-[22px] rounded-full relative shrink-0" :class="sectionStates.faq?'bg-orange-primary':'bg-border-medium'"><div class="absolute top-[3px] left-[3px] w-4 h-4 rounded-full bg-white shadow-sm transition-transform" :class="sectionStates.faq?'translate-x-[18px]':''"></div></div></div>
          <div v-show="sectionStates.faq" class="p-5 border-t border-border-light bg-bg-primary"><div class="flex flex-col gap-2.5">
            <div v-for="(f,i) in faqItems" :key="i" class="bg-surface border-[1.5px] border-border-light rounded-xl p-3.5 relative"><input class="bg-transparent border-none outline-none text-[0.88rem] font-semibold text-text-primary w-[calc(100%-32px)] mb-2 placeholder:text-border-medium" :value="f.q" placeholder="Question…" @input="(e: Event) => f.q = (e.target as HTMLInputElement).value" /><textarea class="bg-transparent border-none outline-none text-[0.82rem] text-text-tertiary leading-relaxed w-[calc(100%-32px)] resize-none placeholder:text-border-medium" rows="2" :value="f.a" placeholder="Réponse…" @input="(e: Event) => f.a = (e.target as HTMLTextAreaElement).value"></textarea><button class="absolute top-2.5 right-2.5 w-6 h-6 rounded-md bg-bg-primary border border-border-light text-text-tertiary flex items-center justify-center hover:bg-red-dim hover:text-red-error hover:border-red-error transition-all" @click="removeFaq(i)"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button></div>
          </div><button class="flex items-center justify-center gap-2 p-2.5 rounded-xl border-[1.5px] border-dashed border-border-medium bg-transparent text-text-tertiary text-[0.83rem] font-semibold w-full mt-2.5 hover:border-orange-primary hover:text-orange-primary hover:bg-orange-dim transition-all" @click="addFaq"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg> Ajouter une question</button></div></div>
          <div class="flex items-center justify-between py-7 mt-4 border-t border-border-light"><span class="text-[0.78rem] text-text-tertiary">Section optionnelle</span><div class="flex gap-2.5"><button class="px-[22px] py-2.5 rounded-full border-[1.5px] border-border-light bg-surface text-[0.85rem] font-semibold text-ink2" @click="goStep(5)">← Retour</button><button class="px-[26px] py-2.5 rounded-full bg-orange-primary text-white text-[0.85rem] font-bold border-none cursor-pointer hover:bg-orange-light" @click="goStep(7)">Suivant → Accès & Transports</button></div></div>
        </div>

        <div v-show="currentStep === 7">
          <div class="mb-9"><div class="text-[0.7rem] font-bold uppercase tracking-[0.12em] text-text-primary opacity-50 mb-2">Section optionnelle</div><h1 class="font-serif text-[1.8rem] mb-2">Accès & Transports</h1><p class="text-[0.9rem] text-text-tertiary leading-relaxed">Informations d'accès au lieu.</p></div>
          <div class="border-[1.5px] rounded-2xl overflow-hidden mb-5" :class="sectionStates.acces?'border-orange-primary':'border-border-light'"><div class="flex items-center justify-between p-4 px-5 cursor-pointer bg-white hover:bg-bg-primary select-none" @click="toggleSection('acces')"><div class="flex items-center gap-3"><div class="w-9 h-9 rounded-[10px] flex items-center justify-center shrink-0 border" :class="sectionStates.acces?'border-orange-primary':'bg-bg-primary border-border-light'"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/></svg></div><div><div class="text-[0.9rem] font-semibold text-text-primary">Inclure infos d'accès</div><div class="text-[0.75rem] text-text-tertiary mt-px">Carte, transports, parking</div></div></div><div class="w-10 h-[22px] rounded-full relative shrink-0" :class="sectionStates.acces?'bg-orange-primary':'bg-border-medium'"><div class="absolute top-[3px] left-[3px] w-4 h-4 rounded-full bg-white shadow-sm transition-transform" :class="sectionStates.acces?'translate-x-[18px]':''"></div></div></div>
          <div v-show="sectionStates.acces" class="p-5 border-t border-border-light bg-bg-primary"><label class="text-[0.78rem] font-bold text-ink2 tracking-wide mb-2 block">Moyens d'accès disponibles</label><div class="flex gap-2.5 flex-wrap mb-5"><div v-for="t in transportOptions" :key="t.label" class="flex items-center gap-2 px-4 py-2.5 rounded-lg border-[1.5px] cursor-pointer transition-all bg-surface text-sm font-medium" :class="t.selected?'border-orange-primary text-orange-primary':'border-border-light'" @click="t.selected=!t.selected"><div class="w-3.5 h-3.5 rounded-full border-2 shrink-0" :class="t.selected?'border-orange-primary bg-orange-primary':'border-border-medium'"></div>{{ t.label }}</div></div><div class="flex flex-col gap-[7px]"><label class="text-[0.78rem] font-bold text-ink2 tracking-wide">Instructions d'accès <span class="text-[0.72rem] font-medium text-text-tertiary ml-1">(optionnel)</span></label><textarea :class="finputClass + ' resize-y min-h-[80px]'" rows="3" placeholder="ex : Prendre la sortie autoroute n°3…" v-model="accessInstructions"></textarea></div></div></div>
          <div class="flex items-center justify-between py-7 mt-4 border-t border-border-light"><span class="text-[0.78rem] text-text-tertiary">Section optionnelle</span><div class="flex gap-2.5"><button class="px-[22px] py-2.5 rounded-full border-[1.5px] border-border-light bg-surface text-[0.85rem] font-semibold text-ink2" @click="goStep(6)">← Retour</button><button class="px-[26px] py-2.5 rounded-full bg-orange-primary text-white text-[0.85rem] font-bold border-none cursor-pointer hover:bg-orange-light" @click="goStep(9)">Suivant → Invitations</button></div></div>
        </div>

        <div v-show="currentStep === 9">
          <div class="mb-9"><div class="text-[0.7rem] font-bold uppercase tracking-[0.12em] text-text-primary opacity-50 mb-2">Section optionnelle</div><h1 class="font-serif text-[1.8rem] mb-2">Billets d'invitation</h1><p class="text-[0.9rem] text-text-tertiary leading-relaxed">Billets d'invitation gratuits</p></div>
          <div class="bg-bg-primary border border-border-light rounded-lg p-3 px-4 mb-5 flex items-center gap-2.5"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-orange-primary shrink-0"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg><div class="text-[0.8rem] text-ink2"><strong>Événement présentiel</strong> — Les invités recevront un <strong>billet PDF avec QR code</strong> à scanner à l'entrée.</div></div>
          <div class="grid grid-cols-2 gap-5 mb-6 max-[900px]:grid-cols-1"><div class="flex flex-col gap-[7px]"><label class="text-[0.78rem] font-bold text-ink2 tracking-wide">Type d'invitation</label><select v-model="invitationType" :class="finputClass"><option value="">Choisir un type</option><option value="vip">VIP</option><option value="presse">Presse</option><option value="partenaire">Partenaire</option><option value="staff">Équipe / Staff</option><option value="sponsor">Sponsor</option><option value="artiste">Artiste / Intervenant</option></select></div><div class="flex flex-col gap-[7px]"><label class="text-[0.78rem] font-bold text-ink2 tracking-wide">Nombre de billets</label><input v-model.number="invitationQuantity" type="number" :class="finputClass" placeholder="Ex : 10" /></div></div>
          <div class="flex flex-col gap-[7px] mb-6"><label class="text-[0.78rem] font-bold text-ink2 tracking-wide">Message personnalisé <span class="text-[0.72rem] font-medium text-text-tertiary ml-1">(optionnel)</span></label><input v-model="invitationMessage" :class="finputClass" placeholder="Ex : Entrée réservée — Accès VIP" /></div>
          <div class="flex flex-col gap-[7px] mb-6"><label class="text-[0.78rem] font-bold text-ink2 tracking-wide">Envoi par email <span class="text-[0.72rem] font-medium text-text-tertiary ml-1">(optionnel)</span></label><textarea v-model="invitationEmails" :class="finputClass + ' resize-y'" rows="3" placeholder="Entrez les adresses email, une par ligne"></textarea></div>
          <div class="flex items-center justify-between py-7 mt-4 border-t border-border-light"><span class="text-[0.78rem] text-text-tertiary">Section optionnelle</span><div class="flex gap-2.5"><button class="px-[22px] py-2.5 rounded-full border-[1.5px] border-border-light bg-surface text-[0.85rem] font-semibold text-ink2" @click="goStep(7)">← Retour</button><button class="px-[26px] py-2.5 rounded-full bg-orange-primary text-white text-[0.85rem] font-bold border-none cursor-pointer hover:bg-orange-light" @click="goStep(10)">Suivant → Codes de réduction</button></div></div>
        </div>

        <div v-show="currentStep === 10">
          <div class="mb-9"><div class="text-[0.7rem] font-bold uppercase tracking-[0.12em] text-text-primary opacity-50 mb-2">Section optionnelle</div><h1 class="font-serif text-[1.8rem] mb-2">Codes de réduction</h1><p class="text-[0.9rem] text-text-tertiary leading-relaxed">Codes promo et réductions.</p></div>
          <div class="bg-bg-primary border border-border-light rounded-2xl p-5 mb-5"><div class="text-[0.82rem] font-bold text-ink2 mb-4">Nouveau code de réduction</div><div class="grid grid-cols-2 gap-5 mb-5 max-[900px]:grid-cols-1"><div class="flex flex-col gap-[7px]"><label class="text-[0.78rem] font-bold text-ink2 tracking-wide">Code promo <span class="text-red-error ml-0.5">*</span></label><input v-model="promoCode" :class="finputClass + ' uppercase'" placeholder="Ex : EARLYBIRD2025" /></div><div class="flex flex-col gap-[7px]"><label class="text-[0.78rem] font-bold text-ink2 tracking-wide">Type de réduction <span class="text-red-error ml-0.5">*</span></label><select v-model="promoType" :class="finputClass"><option value="percentage">Pourcentage (%)</option><option value="fixed">Montant fixe (FCFA)</option><option value="free">Accès gratuit</option></select></div></div><div class="grid grid-cols-3 gap-5 mb-5 max-[900px]:grid-cols-1"><div class="flex flex-col gap-[7px]"><label class="text-[0.78rem] font-bold text-ink2 tracking-wide">Valeur <span class="text-red-error ml-0.5">*</span></label><input v-model.number="promoValue" type="number" :class="finputClass" placeholder="Ex : 20" /></div><div class="flex flex-col gap-[7px]"><label class="text-[0.78rem] font-bold text-ink2 tracking-wide">Utilisations max</label><input v-model.number="promoMaxUsage" type="number" :class="finputClass" placeholder="Illimité si vide" /></div><div class="flex flex-col gap-[7px]"><label class="text-[0.78rem] font-bold text-ink2 tracking-wide">Expiration</label><input v-model="promoExpiration" type="date" :min="todayIso" :class="finputClass" /></div></div><div class="grid grid-cols-2 gap-5 mb-5 max-[900px]:grid-cols-1"><div class="flex flex-col gap-[7px]"><label class="text-[0.78rem] font-bold text-ink2 tracking-wide">Montant min. de commande <span class="text-[0.72rem] font-medium text-text-tertiary ml-1">(optionnel)</span></label><input v-model.number="promoMinOrderAmount" type="number" :class="finputClass" placeholder="Ex : 5000" /></div><div class="flex flex-col gap-[7px]"><label class="text-[0.78rem] font-bold text-ink2 tracking-wide">Max par utilisateur <span class="text-[0.72rem] font-medium text-text-tertiary ml-1">(optionnel)</span></label><input v-model.number="promoMaxPerUser" type="number" :class="finputClass" placeholder="Ex : 1" /></div></div><button type="button" class="w-full py-[11px] rounded-[9px] bg-orange-primary text-white text-[0.85rem] font-bold border-none cursor-pointer hover:bg-orange-light" @click="addPromoCode">+ Ajouter ce code</button></div>
                    <div v-if="promoCodes.length" class="mb-5"><div class="text-[0.82rem] font-bold text-ink2 mb-3">Codes ajoutés</div><div class="flex flex-col gap-2"><div v-for="(pc, i) in promoCodes" :key="i" class="flex items-center justify-between p-3 rounded-lg border border-border-light bg-surface"><div class="flex items-center gap-3"><span class="font-mono font-bold text-[0.85rem] text-orange-primary uppercase">{{ pc.code }}</span><span class="text-[0.78rem] text-text-tertiary">{{ pc.type === 'percentage' ? pc.value + '%' : pc.type === 'free' ? 'Gratuit' : pc.value + ' FCFA' }}</span><span v-if="pc.min_order_amount" class="text-[0.72rem] text-text-tertiary">Min: {{ pc.min_order_amount }} FCFA</span><span v-if="pc.max_per_user" class="text-[0.72rem] text-text-tertiary">Max/user: {{ pc.max_per_user }}</span></div><button class="w-7 h-7 rounded-md border border-border-light text-text-tertiary flex items-center justify-center hover:bg-red-dim hover:text-red-error hover:border-red-error transition-all" @click="removePromoCode(i)"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button></div></div></div>
          <div class="flex items-center justify-between py-7 mt-4 border-t border-border-light"><span class="text-[0.78rem] text-text-tertiary">Section optionnelle</span><div class="flex gap-2.5"><button class="px-[22px] py-2.5 rounded-full border-[1.5px] border-border-light bg-surface text-[0.85rem] font-semibold text-ink2" @click="goStep(9)">← Retour</button><button class="px-[26px] py-2.5 rounded-full bg-orange-primary text-white text-[0.85rem] font-bold border-none cursor-pointer hover:bg-orange-light" @click="goStep(11)">Suivant → Campagne Email</button></div></div>
        </div>

        <div v-show="currentStep === 11">
          <div class="mb-9"><div class="text-[0.7rem] font-bold uppercase tracking-[0.12em] text-text-primary opacity-50 mb-2">Section optionnelle</div><h1 class="font-serif text-[1.8rem] mb-2">Campagne Email</h1><p class="text-[0.9rem] text-text-tertiary leading-relaxed">Emails d'invitation, confirmation ou rappel.</p></div>
          <div class="mb-6"><label class="text-[0.78rem] font-bold text-ink2 tracking-wide">Type de campagne <span class="text-red-error ml-0.5">*</span></label><div class="grid grid-cols-3 gap-2.5 mt-2 max-[900px]:grid-cols-1"><div v-for="c in [{id:'invitation',t:'Invitation',d:'Invitez des contacts'},{id:'rappel',t:'Rappel',d:'Rappel avant l\'événement'},{id:'relance',t:'Relance',d:'Relancez les non-inscrits'}]" :key="c.id" class="flex flex-col items-center text-center gap-1.5 p-4 rounded-lg border-2 bg-surface cursor-pointer transition-all" :class="emailCampaignType===c.id?'border-orange-primary':'border-border-light'" @click="emailCampaignType=c.id"><div class="text-[0.88rem] font-bold" :class="emailCampaignType===c.id?'text-orange-primary':'text-text-primary'">{{ c.t }}</div><div class="text-[0.72rem] text-text-tertiary">{{ c.d }}</div></div></div></div>
          <div class="flex flex-col gap-[7px] mb-6"><label class="text-[0.78rem] font-bold text-ink2 tracking-wide">Nom de la campagne <span class="text-red-error ml-0.5">*</span></label><input v-model="campaignName" :class="finputClass" placeholder="Ex : Invitation Vibe Venture 2025" /></div>
          <div class="grid grid-cols-2 gap-5 mb-6 max-[900px]:grid-cols-1"><div class="flex flex-col gap-[7px]"><label class="text-[0.78rem] font-bold text-ink2 tracking-wide">Objet de l'email <span class="text-red-error ml-0.5">*</span></label><input v-model="campaignSubject" :class="finputClass" placeholder="Ex : Vous êtes invité — Vibe Venture 2025" /></div><div class="flex flex-col gap-[7px]"><label class="text-[0.78rem] font-bold text-ink2 tracking-wide">Nom de l'expéditeur</label><input v-model="campaignSenderName" :class="finputClass" placeholder="Ex : Vibe Events Dakar" /></div></div>
          <div class="flex flex-col gap-[7px] mb-6"><label class="text-[0.78rem] font-bold text-ink2 tracking-wide">Corps de l'email <span class="text-red-error ml-0.5">*</span></label><textarea v-model="campaignBody" :class="finputClass + ' resize-y min-h-[120px] leading-relaxed'" rows="6" placeholder="Rédigez votre message ici. Utilisez {{first_name}}, {{last_name}}, {{event_name}}, {{event_date}}, {{event_location}} pour personnaliser."></textarea><div class="flex gap-2 flex-wrap mt-2"><button v-for="tag in ['{{first_name}}','{{last_name}}','{{event_name}}','{{event_date}}','{{event_location}}']" :key="tag" type="button" @click="insertCampaignTag(tag)" class="px-3 py-1 rounded-md bg-bg-primary border border-border-light text-[0.72rem] font-bold text-ink2 cursor-pointer hover:border-orange-primary hover:text-orange-primary transition-all">{{ tag }}</button></div></div>
          <div class="grid grid-cols-2 gap-5 mb-6 max-[900px]:grid-cols-1"><div class="flex flex-col gap-[7px]"><label class="text-[0.78rem] font-bold text-ink2 tracking-wide">Destinataires</label><select v-model="campaignRecipientType" :class="finputClass"><option value="all">Tous les participants</option><option value="vip">VIP uniquement</option><option value="recent">Acheteurs récents (30 jours)</option><option value="custom">Personnalisé</option></select></div><div class="flex flex-col gap-[7px]"><label class="text-[0.78rem] font-bold text-ink2 tracking-wide">Envoi programmé</label><select v-model="campaignSchedule" :class="finputClass"><option value="now">Envoyer maintenant</option><option value="7d">7 jours avant l'événement</option><option value="3d">3 jours avant l'événement</option><option value="1d">La veille de l'événement</option><option value="0d">Le jour de l'événement</option><option value="custom">Date personnalisée</option></select></div></div>
          <div class="flex flex-col gap-[7px] mb-6"><label class="text-[0.78rem] font-bold text-ink2 tracking-wide">Liste de contacts <span class="text-[0.72rem] font-medium text-text-tertiary ml-1">(si import manuel)</span></label><textarea v-model="campaignContacts" :class="finputClass + ' resize-y'" rows="3" placeholder="Entrez les emails, un par ligne ou séparés par des virgules"></textarea></div>
          <div class="bg-bg-primary border border-border-light rounded-2xl p-[18px] mb-5"><div class="flex items-center justify-between mb-3"><div class="text-[0.82rem] font-bold text-ink2">Aperçu de la campagne</div><button type="button" class="text-[0.75rem] font-semibold text-orange-primary border border-orange-primary bg-white px-3 py-[5px] rounded-md cursor-pointer hover:bg-orange-primary/5">Prévisualiser</button></div><div class="text-[0.8rem] text-text-tertiary">Remplissez les champs pour voir l'aperçu de votre campagne.</div></div>
          <div class="flex flex-wrap gap-2.5 mb-5">
            <button type="button" class="px-5 py-2.5 rounded-lg text-[0.85rem] font-semibold text-text-secondary bg-surface-2 hover:bg-surface-3 transition-colors cursor-pointer" @click="campaignStatus = 'draft'">Enregistrer le brouillon</button>
            <button type="button" class="px-5 py-2.5 rounded-lg text-[0.85rem] font-semibold text-white bg-ink2 hover:bg-ink2/90 transition-colors cursor-pointer" @click="campaignStatus = 'scheduled'">Planifier</button>
            <button type="button" class="px-5 py-2.5 rounded-lg text-[0.85rem] font-semibold text-white bg-orange-primary hover:bg-orange-light transition-colors cursor-pointer" @click="campaignStatus = 'sent'">Envoyer maintenant</button>
          </div>
          <div v-if="campaignStatus !== 'draft'" class="text-[0.78rem] text-text-tertiary mb-3">Action sélectionnée : <span class="font-bold" :class="campaignStatus === 'sent' ? 'text-orange-primary' : 'text-ink2'">{{ campaignStatus === 'sent' ? 'Envoyer maintenant' : 'Planifier' }}</span> — sera exécutée lors de la sauvegarde de l'événement.</div>
          <div class="flex items-center justify-between py-7 mt-4 border-t border-border-light"><span class="text-[0.78rem] text-text-tertiary">Section optionnelle</span><div class="flex gap-2.5"><button class="px-[22px] py-2.5 rounded-full border-[1.5px] border-border-light bg-surface text-[0.85rem] font-semibold text-ink2" @click="goStep(10)">← Retour</button><button class="px-[26px] py-2.5 rounded-full bg-orange-primary text-white text-[0.85rem] font-bold border-none cursor-pointer hover:bg-orange-light" @click="goStep(12)">Suivant → Campagne SMS</button></div></div>
        </div>

        <div v-show="currentStep === 12">
          <div class="mb-9"><div class="text-[0.7rem] font-bold uppercase tracking-[0.12em] text-text-primary opacity-50 mb-2">Section optionnelle</div><h1 class="font-serif text-[1.8rem] mb-2">Campagne SMS</h1><p class="text-[0.9rem] text-text-tertiary leading-relaxed">SMS d'invitation ou de rappel.</p></div>
          <p class="text-xs text-text-tertiary mb-3">Crédit disponible : 500 SMS — 1 SMS = 1 crédit</p>
          <div class="grid grid-cols-2 gap-5 mb-6 max-[900px]:grid-cols-1"><div class="flex flex-col gap-[7px]"><label class="text-[0.78rem] font-bold text-ink2 tracking-wide">Type de campagne <span class="text-red-error ml-0.5">*</span></label><select :class="finputClass"><option>Invitation à l'événement</option><option>Rappel 3 jours avant</option><option>Rappel la veille</option><option>Rappel le jour J</option><option>Relance non-inscrits</option><option>Confirmation d'inscription</option></select></div><div class="flex flex-col gap-[7px]"><label class="text-[0.78rem] font-bold text-ink2 tracking-wide">Expéditeur affiché</label><input :class="finputClass" placeholder="Ex : VibeEvents" maxlength="11" /><div class="text-[0.7rem] text-text-tertiary mt-1">11 caractères max, sans espaces ni caractères spéciaux.</div></div></div>
          <div class="flex flex-col gap-[7px] mb-6"><label class="text-[0.78rem] font-bold text-ink2 tracking-wide">Message SMS <span class="text-red-error ml-0.5">*</span></label><textarea :class="finputClass + ' resize-y'" rows="4" maxlength="160" placeholder="Rédigez votre SMS (160 caractères max). Utilisez {NOM}, {DATE}, {LIEN} pour personnaliser." @input="updateSmsCount"></textarea><div class="flex items-center justify-between mt-1.5 flex-wrap gap-2"><div class="flex gap-1.5 flex-wrap"><button v-for="tag in ['{NOM}','{DATE}','{LIEN}']" :key="tag" type="button" class="px-3 py-1 rounded-md bg-bg-primary border border-border-light text-[0.72rem] font-bold text-ink2 cursor-pointer hover:border-orange-primary hover:text-orange-primary transition-all">{{ tag }}</button></div><div class="text-[0.72rem] text-text-tertiary">{{ smsCharCount }} / 160 caractères</div></div></div>
          <div class="grid grid-cols-2 gap-5 mb-6 max-[900px]:grid-cols-1"><div class="flex flex-col gap-[7px]"><label class="text-[0.78rem] font-bold text-ink2 tracking-wide">Destinataires</label><select :class="finputClass"><option>Importer une liste de numéros</option><option>Tous les inscrits de cet événement</option><option>Contacts non encore inscrits</option><option>Saisie manuelle</option></select></div><div class="flex flex-col gap-[7px]"><label class="text-[0.78rem] font-bold text-ink2 tracking-wide">Envoi programmé</label><select :class="finputClass"><option>Envoyer maintenant</option><option>7 jours avant l'événement</option><option>3 jours avant l'événement</option><option>La veille de l'événement</option><option>Le jour de l'événement</option><option>Date personnalisée</option></select></div></div>
          <div class="flex flex-col gap-[7px] mb-6"><label class="text-[0.78rem] font-bold text-ink2 tracking-wide">Numéros de téléphone <span class="text-[0.72rem] font-medium text-text-tertiary ml-1">(si saisie manuelle)</span></label><textarea :class="finputClass + ' resize-y'" rows="3" placeholder="Ex : +221771234567, +221781234567&#10;Un numéro par ligne ou séparés par des virgules."></textarea></div>
          <div class="bg-bg-primary border border-border-light rounded-2xl p-[18px] mb-5"><div class="text-[0.82rem] font-bold text-ink2 mb-2.5">Résumé de la campagne</div><div class="grid grid-cols-3 gap-3"><div class="text-center"><div class="font-serif text-[1.5rem] text-text-primary">—</div><div class="text-[0.7rem] text-text-tertiary mt-0.5">Destinataires</div></div><div class="text-center"><div class="font-serif text-[1.5rem] text-text-primary">—</div><div class="text-[0.7rem] text-text-tertiary mt-0.5">Crédits utilisés</div></div><div class="text-center"><div class="font-serif text-[1.5rem] text-text-primary">500</div><div class="text-[0.7rem] text-text-tertiary mt-0.5">Crédits restants</div></div></div></div>
          <div class="flex items-center justify-between py-7 mt-4 border-t border-border-light"><span class="text-[0.78rem] text-text-tertiary">Section optionnelle</span><div class="flex gap-2.5"><button class="px-[22px] py-2.5 rounded-full border-[1.5px] border-border-light bg-surface text-[0.85rem] font-semibold text-ink2" @click="goStep(11)">← Retour</button><button class="px-[26px] py-2.5 rounded-full bg-orange-primary text-white text-[0.85rem] font-bold border-none cursor-pointer hover:bg-orange-light" @click="goStep(13)">Suivant → Points de vente</button></div></div>
        </div>

        <div v-show="currentStep === 13">
          <div class="mb-9"><div class="text-[0.7rem] font-bold uppercase tracking-[0.12em] text-text-primary opacity-50 mb-2">Section optionnelle — Présentiel uniquement</div><h1 class="font-serif text-[1.8rem] mb-2">Points de vente physiques</h1><p class="text-[0.9rem] text-text-tertiary leading-relaxed">Points de vente physiques pour la billetterie.</p></div>
          <div class="bg-bg-primary border border-border-light rounded-2xl p-5 mb-5"><div class="text-[0.82rem] font-bold text-ink2 mb-4">Ajouter un point de vente</div>
            <div class="grid grid-cols-2 gap-5 mb-5 max-[900px]:grid-cols-1"><div class="flex flex-col gap-[7px]"><label class="text-[0.78rem] font-bold text-ink2 tracking-wide">Nom du point de vente <span class="text-red-error ml-0.5">*</span></label><input v-model="pdvName" :class="finputClass" placeholder="Ex : Guichet principal — Stade" /></div><div class="flex flex-col gap-[7px]"><label class="text-[0.78rem] font-bold text-ink2 tracking-wide">Type <span class="text-red-error ml-0.5">*</span></label><select v-model="pdvType" :class="finputClass"><option>Guichet officiel</option><option>Boutique partenaire</option><option>Agent terrain</option><option>Hôtel / Réception</option><option>Autre</option></select></div></div>
            <div class="flex flex-col gap-[7px] mb-5"><label class="text-[0.78rem] font-bold text-ink2 tracking-wide">Adresse <span class="text-red-error ml-0.5">*</span></label><input v-model="pdvAddress" :class="finputClass" placeholder="Ex : Avenue Cheikh Anta Diop, Dakar" /></div>
            <div class="grid grid-cols-3 gap-5 mb-5 max-[900px]:grid-cols-1"><div class="flex flex-col gap-[7px]"><label class="text-[0.78rem] font-bold text-ink2 tracking-wide">Ville</label><input v-model="pdvCity" :class="finputClass" placeholder="Ex : Dakar" /></div><div class="flex flex-col gap-[7px]"><label class="text-[0.78rem] font-bold text-ink2 tracking-wide">Horaires d'ouverture</label><input v-model="pdvHours" :class="finputClass" placeholder="Ex : Lun–Sam · 9h–18h" /></div><div class="flex flex-col gap-[7px]"><label class="text-[0.78rem] font-bold text-ink2 tracking-wide">Téléphone contact <span class="text-[0.72rem] font-medium text-text-tertiary ml-1">(optionnel)</span></label><input v-model="pdvPhone" :class="finputClass" placeholder="Ex : +221 77 000 00 00" /></div></div>
            <div class="grid grid-cols-2 gap-5 mb-5 max-[900px]:grid-cols-1"><div class="flex flex-col gap-[7px]"><label class="text-[0.78rem] font-bold text-ink2 tracking-wide">Types de billets disponibles</label><select v-model="pdvTicketTypes" :class="finputClass"><option value="all">Tous les types de billets</option><option value="standard">Standard uniquement</option><option value="vip">VIP uniquement</option><option value="standard_vip">Standard + VIP</option></select></div><div class="flex flex-col gap-[7px]"><label class="text-[0.78rem] font-bold text-ink2 tracking-wide">Capacité de vente max <span class="text-[0.72rem] font-medium text-text-tertiary ml-1">(optionnel)</span></label><input v-model.number="pdvMaxCapacity" type="number" :class="finputClass" placeholder="Laisser vide = illimité" /></div></div>
            <div class="flex flex-col gap-[7px] mb-5"><label class="text-[0.78rem] font-bold text-ink2 tracking-wide">Instructions spéciales <span class="text-[0.72rem] font-medium text-text-tertiary ml-1">(optionnel)</span></label><input v-model="pdvInstructions" :class="finputClass" placeholder="Ex : Présenter une pièce d'identité — Paiement Wave uniquement" /></div>
            <button type="button" class="w-full py-[11px] rounded-[9px] bg-orange-primary text-white text-[0.85rem] font-bold border-none cursor-pointer hover:bg-orange-light" @click="addPdv">+ Ajouter ce point de vente</button>
          </div>
          <div><div class="text-[0.82rem] font-bold text-ink2 mb-3">Points de vente configurés</div><div v-if="!pdvList.length" class="bg-bg-primary border border-border-light rounded-[9px] p-4 text-center text-[0.8rem] text-text-tertiary">Aucun point de vente ajouté pour le moment.</div><div v-else class="flex flex-col gap-2"><div v-for="(pdv, i) in pdvList" :key="i" class="flex items-center justify-between p-3 rounded-lg border border-border-light bg-surface"><div><div class="text-[0.85rem] font-semibold text-text-primary">{{ pdv.name }}</div><div class="text-[0.75rem] text-text-tertiary">{{ pdv.address }} — {{ pdv.city }}</div></div><button class="w-7 h-7 rounded-md border border-border-light text-text-tertiary flex items-center justify-center hover:bg-red-dim hover:text-red-error hover:border-red-error transition-all" @click="removePdv(i)"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button></div></div></div>
          <div class="flex items-center justify-between py-7 mt-4 border-t border-border-light"><span class="text-[0.78rem] text-text-tertiary">Section optionnelle</span><div class="flex gap-2.5"><button class="px-[22px] py-2.5 rounded-full border-[1.5px] border-border-light bg-surface text-[0.85rem] font-semibold text-ink2" @click="goStep(12)">← Retour</button><button class="px-[26px] py-2.5 rounded-full bg-orange-primary text-white text-[0.85rem] font-bold border-none cursor-pointer hover:bg-orange-light" @click="goStep(8)">Suivant → Publication</button></div></div>
        </div>

        <div v-show="currentStep === 8">
          <div class="mb-9"><div class="text-[0.7rem] font-bold uppercase tracking-[0.12em] text-text-primary opacity-50 mb-2">Dernière étape</div><h1 class="font-serif text-[1.8rem] mb-2">Publication</h1><p class="text-[0.9rem] text-text-tertiary leading-relaxed">Vérifiez les informations et mettez votre événement en ligne.</p></div>
          <div class="flex flex-col gap-3 mb-7">
            <div class="flex items-center gap-3 p-3.5 rounded-xl border-l-2 border-l-green-600 border border-border-light bg-white"><span class="w-7 h-7 rounded-full border border-green-600 text-green-600 flex items-center justify-center shrink-0"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><polyline points="20 6 9 17 4 12"/></svg></span><div><div class="text-[0.85rem] font-semibold text-text-primary">Informations générales</div><div class="text-[0.72rem] text-text-tertiary">Titre, date et lieu renseignés</div></div></div>
            <div class="flex items-center gap-3 p-3.5 rounded-xl border-l-2 border-l-green-600 border border-border-light bg-white"><span class="w-7 h-7 rounded-full border border-green-600 text-green-600 flex items-center justify-center shrink-0"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><polyline points="20 6 9 17 4 12"/></svg></span><div><div class="text-[0.85rem] font-semibold text-text-primary">Billets & Prix</div><div class="text-[0.72rem] text-text-tertiary">Au moins un type de billet configuré</div></div></div>
            <div v-if="eventFlyer || existingFlyerUrl" class="flex items-center gap-3 p-3.5 rounded-xl border-l-2 border-l-green-600 border border-border-light bg-white"><span class="w-7 h-7 rounded-full border border-green-600 text-green-600 flex items-center justify-center shrink-0"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><polyline points="20 6 9 17 4 12"/></svg></span><div><div class="text-[0.85rem] font-semibold text-text-primary">Image de couverture</div><div class="text-[0.72rem] text-text-tertiary">Image ajoutée avec succès</div></div></div>
            <div v-else class="flex items-center gap-3 p-3.5 rounded-xl border-l-2 border-l-gray-300 border border-border-light bg-white"><span class="w-7 h-7 rounded-full border border-gray-400 text-gray-400 flex items-center justify-center shrink-0"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg></span><div><div class="text-[0.85rem] font-semibold text-text-primary">Image de couverture</div><div class="text-[0.72rem] text-text-tertiary">Aucune image ajoutée — fortement recommandé</div></div></div>
          </div>
          <div class="flex flex-col gap-[7px] mb-7"><label class="text-[0.78rem] font-bold text-ink2 tracking-wide">URL de la page publique</label><div class="flex items-center rounded-lg border-[1.5px] border-border-light bg-surface overflow-hidden"><span class="px-3.5 py-[11px] bg-bg-primary text-[0.85rem] font-semibold text-text-tertiary border-r border-border-light whitespace-nowrap">billetevent.sn/</span><input class="flex-1 py-[11px] px-3 border-none outline-none text-[0.9rem] text-text-primary bg-transparent" placeholder="mon-evenement-2025" /></div><div class="text-[0.73rem] text-text-tertiary mt-1.5">Personnalisez l'URL de votre page événement</div></div>
          <div class="grid grid-cols-2 gap-3 mb-5"><button type="button" class="flex items-center justify-center gap-2 py-3.5 rounded-xl border-[1.5px] border-border-medium bg-surface text-[0.88rem] font-bold text-ink2 cursor-pointer hover:border-text-primary transition-all" @click="saveDraft"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg> Sauvegarder en brouillon</button><button type="button" class="flex items-center justify-center gap-2 py-3.5 rounded-xl bg-orange-primary text-white text-[0.88rem] font-bold border-none cursor-pointer hover:bg-orange-light transition-all shadow-[0_4px_20px_rgba(240,90,40,0.3)]" @click="publishEvent"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg> Publier maintenant</button></div>
          <div class="flex items-center justify-between py-7 mt-4 border-t border-border-light"><span></span><div class="flex gap-2.5"><button class="px-[22px] py-2.5 rounded-full border-[1.5px] border-border-light bg-surface text-[0.85rem] font-semibold text-ink2" @click="goStep(13)">← Retour</button></div></div>
        </div>

       </div>
      </div>
    </div>

    <UiConfirmModal
      :is-open="showPublishModal"
      :title="isEdit ? 'Enregistrer les modifications' : 'Publier l\'événement'"
      :message="isEdit ? 'Êtes-vous sûr de vouloir enregistrer les modifications de cet événement ?' : 'Êtes-vous sûr de vouloir publier cet événement ? Il sera visible publiquement.'"
      :confirm-text="isEdit ? 'Enregistrer' : 'Publier'"
      :loading="submitting"
      :loading-text="isEdit ? 'Enregistrement en cours...' : 'Publication en cours...'"
      variant="info"
      @confirm="confirmPublish"
      @cancel="showPublishModal = false"
    />

    <!-- Kit marketing post-publication.
         Évite le toast → silence. Propose 3 actions de partage immédiates :
         WhatsApp (canal n°1 en Afrique de l'Ouest), copier le lien (Instagram bio
         ou diffusion), email (bases existantes). + bouton "Plus tard" qui mène à la liste. -->
    <UiBaseModal :is-open="showPostPublishKit" title="Votre événement est en ligne" size="md" @close="kitGoToEvents">
      <div class="text-center mb-5">
        <div class="w-14 h-14 rounded-full bg-green-dim flex items-center justify-center mx-auto mb-3">
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="var(--color-green-dark)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
        </div>
        <h3 class="font-serif text-lg text-text-primary mb-1">Maintenant, faisons-le décoller</h3>
        <p class="text-sm text-text-secondary">Partagez votre événement dans les 24h — c'est là que vous récoltez le maximum d'inscriptions.</p>
      </div>

      <div class="bg-surface-2 rounded-lg px-3 py-2.5 mb-4 flex items-center gap-2">
        <span class="text-xs text-text-tertiary font-mono flex-1 truncate min-w-0">{{ publishedEventUrl }}</span>
        <button
          type="button"
          class="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold bg-white border border-border-light hover:border-orange-primary hover:text-orange-primary transition-colors"
          :class="kitLinkCopied ? 'text-green-dark border-green-dark' : 'text-text-secondary'"
          @click="kitCopyLink"
        >
          <svg v-if="!kitLinkCopied" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
          <svg v-else width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><polyline points="20 6 9 17 4 12"/></svg>
          {{ kitLinkCopied ? 'Copié' : 'Copier le lien' }}
        </button>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        <button
          type="button"
          class="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-sm font-bold text-white bg-[#25D366] hover:bg-[#20BD5A] transition-colors"
          @click="kitShareWhatsApp"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/></svg>
          Partager sur WhatsApp
        </button>
        <button
          type="button"
          class="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-sm font-semibold text-text-primary bg-surface-2 hover:bg-surface-3 transition-colors"
          @click="kitShareEmail"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><polyline points="22 7 12 14 2 7"/></svg>
          Inviter par email
        </button>
      </div>

      <template #footer>
        <div class="flex items-center justify-between gap-2 w-full">
          <NuxtLink
            :to="publishedEventUrl"
            target="_blank"
            class="inline-flex items-center gap-1.5 text-xs text-text-tertiary hover:text-orange-primary"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
            Voir la page publique
          </NuxtLink>
          <button
            type="button"
            class="px-4 py-2 rounded-lg text-sm font-semibold text-text-secondary bg-surface-2 hover:bg-surface-3 transition-colors"
            @click="kitGoToEvents"
          >
            Aller à mes événements →
          </button>
        </div>
      </template>
    </UiBaseModal>
  </div>
</template>

<style scoped>
.fade-overlay-enter-active,
.fade-overlay-leave-active {
  transition: opacity 0.3s ease;
}
.fade-overlay-enter-from,
.fade-overlay-leave-to {
  opacity: 0;
}
</style>