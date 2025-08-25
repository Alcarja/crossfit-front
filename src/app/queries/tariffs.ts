import { useMutation, useQuery } from "@tanstack/react-query";
import {
  assignMonthlyTariff,
  createBonoTariff,
  createMonthlyTariff,
  getAllActiveMonthlyUserTariffs,
  getAllBonoTariffs,
  getAllMonthlyTariffs,
  getUserFutureTariffs,
  getUserTariffHistory,
  updatebonoTariff,
  updateMonthlyTariff,
} from "../adapters/api";
import { ClassType } from "@/modules/dashboard/classes/tariffs/ui/components/plansTab";

export const useCreateMonthlyTariff = () =>
  useMutation({
    mutationFn: (data: {
      name: string;
      price: number;
      isActive: boolean;
      creditQty: number | null;
      maxPerDay: number | null;
      weeklyRules?: {
        classType:
          | "WOD"
          | "Gymnastics"
          | "Weightlifting"
          | "Endurance"
          | "Open Box"
          | "Foundations"
          | "Kids";
        isAllowed: boolean;
        maxPerWeek: number | null;
      }[];
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
        weeklyRules?: {
          classType: ClassType;
          isAllowed: boolean;
          maxPerWeek: number | null;
        }[]; // authoritative list
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

export const useAssignMonthlyTariff = () =>
  useMutation({
    mutationFn: (data: {
      userId: number;
      planId: number;
      customExpiresOn?: string;
      startsOn?: string;
      remainingCredits?: number;
      note?: string;
    }) => assignMonthlyTariff(data),
  });

export const useAllActiveMonthlyUserTariffs = () =>
  useQuery({
    queryKey: ["allActiveMonthlyUserTariffs"],
    queryFn: getAllActiveMonthlyUserTariffs,
  });

export const useUserTariffHistory = (userId: number) =>
  useQuery({
    queryKey: ["userTariffHistory", userId],
    queryFn: () => getUserTariffHistory(userId),
    enabled: !!userId, // only run if userId is defined
  });

export const useUserFutureTariffs = (userId: number) =>
  useQuery({
    enabled: !!userId,
    queryKey: ["userFutureTariffs", userId],
    queryFn: () => getUserFutureTariffs(userId),
  });
