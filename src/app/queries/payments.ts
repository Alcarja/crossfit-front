import {
  createStripePaymentIntent,
  finalizeStripeCardPayment,
  switchPaymentToCash,
} from "../adapters/api";

export const stripePaymentIntentQueryOptions = (orderId: number) => ({
  queryKey: ["stripePaymentIntent", orderId],
  queryFn: () => createStripePaymentIntent(orderId),
  enabled: !!orderId,
});

export const finalizeStripeCardPaymentQueryOptions = (orderId: number) => ({
  queryKey: ["finalizeStripeCardPayment", orderId],
  queryFn: () => finalizeStripeCardPayment(orderId),
  enabled: !!orderId,
});

// Switch payment to cash query
export const switchPaymentToCashQueryOptions = (params: {
  orderId: number;
  amount?: number;
  note?: string;
  recordedByCoachId?: number;
}) => ({
  queryKey: ["switchPaymentToCash", params.orderId],
  queryFn: () => switchPaymentToCash(params),
  enabled: !!params?.orderId,
});
