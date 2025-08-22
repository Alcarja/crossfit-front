import { useMutation, useQuery } from "@tanstack/react-query";
import {
  createBonoTariff,
  createMonthlyTariff,
  getAllBonoTariffs,
  getAllMonthlyTariffs,
  updatebonoTariff,
  updateMonthlyTariff,
} from "../adapters/api";

export const useCreateMonthlyTariff = () =>
  useMutation({
    mutationFn: (data: {
      name: string;
      price: number;
      isActive: boolean;
      creditQty: number | null;
      maxPerDay: number | null;
    }) => createMonthlyTariff(data),
  });

export const useAllMonthlyTariffs = () =>
  useQuery({
    queryKey: ["allMonthlyTariffs"],
    queryFn: getAllMonthlyTariffs,
  });

export const useUpdateMonthlyTariff = () =>
  useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: number;
      data: {
        name?: string;
        price?: number;
        isActive?: boolean;
        creditQty?: number | null;
        maxPerDay?: number | null;
      };
    }) => updateMonthlyTariff(id, data),
  });

export const useAllBonoTariffs = () =>
  useQuery({
    queryKey: ["allBonoTariffs"],
    queryFn: getAllBonoTariffs,
  });

export const useCreateBonoTariff = () =>
  useMutation({
    mutationFn: (data: {
      name: string;
      price: number;
      isActive: boolean;
      creditQty: number;
    }) => createBonoTariff(data),
  });

export const useUpdateBonoTariff = () =>
  useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: number;
      data: {
        name?: string;
        price?: number;
        isActive?: boolean;
        creditQty?: number | null;
      };
    }) => updatebonoTariff(id, data),
  });
