import { createStripePaymentIntent } from "../adapters/api";

export const stripePaymentIntentQueryOptions = (orderId: number) => ({
  queryKey: ["stripePaymentIntent", orderId],
  queryFn: () => createStripePaymentIntent(orderId),
  enabled: !!orderId,
});
