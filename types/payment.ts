export interface CartItem {
  id: number | string
  name: string
  price: number
  quantity: number
}

export interface CheckoutPayload {
  event_id: number | string
  items: Array<{ pass_id: number | string; quantity: number }>
  payment_method: 'mobile_money' | 'card' | 'free'
  operator_key?: string
  phone_number?: string
  country_code?: string
  promo_code?: string
  guest_name?: string
  guest_email?: string
  guest_phone?: string
  guest_company?: string
}

export interface PaymentResponse {
  payment_url?: string
  client_secret?: string
  requires_confirmation?: boolean
  status?: string
}

export interface CheckoutResponse {
  order_id?: number | string
  reference?: string
  payment_status?: string
  payment_response?: PaymentResponse
}

export interface WizallConfirmPayload {
  order_id: number | string
  authorization_code: string
}

export interface PromoValidatePayload {
  code: string
  event_id: number | string
}

export interface PromoValidateResponse {
  discount: number
}

export type PaymentState =
  | 'idle'
  | 'validating'
  | 'processing'
  | 'awaiting_confirmation'
  | 'pending'
  | 'success'
  | 'failed'
  | 'timeout'

export interface Country {
  code: string
  name: string
  flag: string
  dialCode: string
  operators: string[]
}

export interface FormErrors {
  paymentMode?: string
  country?: string
  operator?: string
  phone?: string
  cart?: string
  guestName?: string
  guestEmail?: string
  guestPhone?: string
  cardNumber?: string
  cardExpiry?: string
  cardCvv?: string
  cardName?: string
}
