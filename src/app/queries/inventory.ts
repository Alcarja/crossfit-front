import { useMutation } from "@tanstack/react-query";
import {
  createInventoryItem,
  deleteInventoryItem,
  getAllInventory,
  updateInventoryItem,
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
