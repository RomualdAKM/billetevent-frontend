/**
 * Form errors helper — focus + scroll vers le premier champ en erreur.
 *
 * Pourquoi : aujourd'hui, beaucoup de pages affichent `notifyError("Corrigez
 * les erreurs du formulaire")` puis laissent l'utilisateur scroller en haut
 * pour trouver le ou les champs concernés. Sur mobile c'est particulièrement
 * frustrant.
 *
 * Usage typique côté form :
 *   const { scrollToFirstError } = useFormErrors()
 *   if (!validate()) {
 *     notifyError('Corrigez les erreurs du formulaire')
 *     scrollToFirstError(errors.value)
 *     return
 *   }
 *
 * Convention : l'objet `errors` est { fieldName: 'message' }. On cherche un
 * input/select/textarea avec [name=fieldName] OU [id=fieldName] OU
 * [data-field=fieldName].
 */
export const useFormErrors = () => {
  function scrollToFirstError(errors: Record<string, any>): void {
    if (!import.meta.client) return
    const firstField = Object.keys(errors).find(k => !!errors[k])
    if (!firstField) return

    // Attendre le prochain tick pour que le DOM ait rendu les bordures
    // rouges / aria-invalid avant le scroll.
    nextTick(() => {
      const selectors = [
        `[name="${firstField}"]`,
        `#${firstField}`,
        `[data-field="${firstField}"]`,
      ]
      let target: HTMLElement | null = null
      for (const sel of selectors) {
        try {
          target = document.querySelector(sel) as HTMLElement | null
          if (target) break
        } catch { /* querySelector peut throw sur id contenant chars spéciaux */ }
      }
      if (!target) return

      target.scrollIntoView({ behavior: 'smooth', block: 'center' })
      // Tente de focus si l'élément est focusable
      if (typeof (target as any).focus === 'function') {
        setTimeout(() => (target as any).focus({ preventScroll: true }), 300)
      }
    })
  }

  return { scrollToFirstError }
}
