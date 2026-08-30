import { useMutation } from "@tanstack/react-query";
import {
  createCategory,
  deleteCategory,
  getAllCategories,
  renameCategory,
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

export const useRenameCategory = () =>
  useMutation({
    mutationFn: ({ categoryId, name }: { categoryId: number; name: string }) =>
      renameCategory(categoryId, name),
  });

export const useDeleteCategory = () =>
  useMutation({
    mutationFn: (categoryId: number) => deleteCategory(categoryId),
  });
