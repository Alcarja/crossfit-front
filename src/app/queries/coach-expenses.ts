import { useMutation } from "@tanstack/react-query";
import {
  createCoachExpense,
  deleteCoachExpense,
  getCoachExpensesByMonthAndYear,
} from "../adapters/api";

export const useCreateCoachExpenseMutation = () =>
  useMutation({
    mutationFn: (data: {
      coachId: number;
      inventoryId: string;
      quantity: number;
      date: string;
      customPrice?: number;
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

export const useDeleteCoachExpenseMutation = () =>
  useMutation({
    mutationFn: deleteCoachExpense,
  });
