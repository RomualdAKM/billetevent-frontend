import type {
  CheckoutPayload,
  CheckoutResponse,
  WizallConfirmPayload,
  PromoValidatePayload,
  PromoValidateResponse,
} from '~/types/payment'

export const useCheckoutApi = () => {
  const { post } = useApi()

  const submitCheckout = (payload: CheckoutPayload) =>
    post<{ data: CheckoutResponse }>('/checkout', payload)

  const confirmWizall = (payload: WizallConfirmPayload) =>
    post('/checkout/wizall-confirm', payload)

  const validatePromo = (payload: PromoValidatePayload) =>
    post<{ data: PromoValidateResponse }>('/promo-codes/validate', payload)

  return { submitCheckout, confirmWizall, validatePromo }
}
