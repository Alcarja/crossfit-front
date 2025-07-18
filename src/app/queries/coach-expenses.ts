/* eslint-disable @typescript-eslint/no-explicit-any */
import { useMutation } from "@tanstack/react-query";
import {
  createCoachExpense,
  deleteCoachExpense,
  getCoachExpensesByMonthAndYear,
  updateClass,
} from "../adapters/api";

export const useCreateCoachExpenseMutation = () =>
  useMutation({
    mutationFn: (data: {
      coachId: number;
      inventoryId: string;
      quantity: number;
      date: string;
    }) => createCoachExpense(data),
  });

export const coachExpensesByMonthAndYearQueryOptions = (
  month: string,
  year: string
) => ({
  queryKey: ["expenses", "byMonth", month, year],
  queryFn: async () => {
    return await getCoachExpensesByMonthAndYear(month, year);
  },
  enabled: !!month && !!year, // Only fetch when both values are present
});

export const useUpdateClassQuery = () =>
  useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: number;
      data: {
        start?: string;
        end?: string;
        coachId?: number;
        type?: string;
        isOpen?: boolean;
        isClose?: boolean;
      };
    }) => updateClass(id, data),
  });

export const useDeleteCoachExpenseMutation = () =>
  useMutation({
    mutationFn: deleteCoachExpense,
  });
