import {
  cancelOpenOrder,
  createNewPaymentForOrder,
  createStripePaymentIntent,
  finalizePendingCashPayment,
  finalizeStripeCardPayment,
  switchPaymentToCash,
  switchPendingCashToCard,
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

export const switchPendingCashToCardQueryOptions = (
  orderId: number,
  note?: string
) => ({
  queryKey: ["switchPendingCashToCard", orderId, note ?? null],
  queryFn: () => switchPendingCashToCard(orderId, note),
  enabled: !!orderId,
});

export const finalizePendingCashPaymentQueryOptions = (params: {
  orderId: number;
  amount?: number;
  note?: string;
  recordedByCoachId?: number;
}) => ({
  queryKey: [
    "finalizePendingCashPayment",
    params.orderId,
    params.amount ?? null,
    params.note ?? null,
    params.recordedByCoachId ?? null,
  ],
  queryFn: () => finalizePendingCashPayment(params),
  enabled: !!params?.orderId,
});

export const cancelOpenOrderQueryOptions = (params: {
  orderId: number;
  reason?: string;
}) => ({
  queryKey: ["cancelOpenOrder", params.orderId, params.reason ?? null],
  queryFn: () => cancelOpenOrder(params),
  enabled: !!params?.orderId,
});

export const createNewPaymentForOrderQueryOptions = (body: {
  orderId: number;
  method: "card" | "cash";
  note?: string;
  recordedByCoachId?: number;
  amount?: number;
}) => ({
  queryKey: [
    "createNewPaymentForOrder",
    body.orderId,
    body.method,
    body.note ?? null,
    body.recordedByCoachId ?? null,
    body.amount ?? null,
  ],
  queryFn: () => createNewPaymentForOrder(body),
  enabled: !!body?.orderId && !!body?.method,
});
