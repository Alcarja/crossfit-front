import {
  getOrderById,
  getOrdersByMonth,
  getPendingOrders,
} from "../adapters/api";

export const ordersByMonthQueryOptions = (start: string, end: string) => ({
  queryKey: ["orders", start, end],
  queryFn: async () => {
    return await getOrdersByMonth(start, end);
  },
  enabled: !!start && !!end, // only runs if both dates exist
});

export const pendingOrdersQueryOptions = () => ({
  queryKey: ["pending-orders"],
  queryFn: async () => {
    return await getPendingOrders();
  },
});

export const orderByIdQueryOptions = (orderId: number) => ({
  queryKey: ["order", orderId],
  queryFn: () => getOrderById(orderId),
  enabled: !!orderId,
});
