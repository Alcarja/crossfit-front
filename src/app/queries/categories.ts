import { useMutation } from "@tanstack/react-query";
import {
  createCategory,
  deleteCategory,
  getAllCategories,
} from "../adapters/api";

export const allCategoriesQueryOptions = () => ({
  queryKey: ["categories"],
  queryFn: async () => {
    return await getAllCategories();
  },
});

export const useCreateCategory = () =>
  useMutation({
    mutationFn: (name: string) => createCategory(name),
  });

export const useDeleteCategory = () =>
  useMutation({
    mutationFn: (categoryId: number) => deleteCategory(categoryId),
  });
