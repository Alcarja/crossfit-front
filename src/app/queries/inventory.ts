import { useMutation } from "@tanstack/react-query";
import {
  createInventoryItem,
  deleteInventoryItem,
  getAllInventory,
  getInventoryTransactionsByMonthAndYear,
  updateInventoryItem,
  updateStock,
} from "../adapters/api";

export const useAllInventoryQuery = () => ({
  queryKey: ["inventory"],
  queryFn: async () => {
    return await getAllInventory();
  },
});

export const useCreateInventoryItemQuery = () =>
  useMutation({
    mutationFn: ({
      name,
      categoryId,
      priceRegular,
      priceCoach,
    }: {
      name: string;
      categoryId: number;
      priceRegular: number;
      priceCoach: number;
    }) => createInventoryItem(name, categoryId, priceRegular, priceCoach),
  });

export const useDeleteInventoryItem = () =>
  useMutation({
    mutationFn: (inventoryItemId: number) =>
      deleteInventoryItem(inventoryItemId),
  });

export const useUpdateInventoryItem = () =>
  useMutation({
    mutationFn: (data: {
      inventoryItemId: number;
      name: string;
      categoryId: number;
      priceRegular: number;
      priceCoach: number;
    }) => updateInventoryItem(data),
  });

export const useUpdateStock = () =>
  useMutation({
    mutationFn: (data: { itemId: number; quantity: number; action: string }) =>
      updateStock(data),
  });

export const useInventoryTransactionsByMonthAndYear = (
  month: number,
  year: number
) => ({
  queryKey: ["inventory-transactions", month, year],
  queryFn: async () => {
    const response = await getInventoryTransactionsByMonthAndYear(month, year);
    return response;
  },
});
