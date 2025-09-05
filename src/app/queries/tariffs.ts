import { useMutation, useQuery } from "@tanstack/react-query";
import {
  assignMonthlyTariff,
  createBonoTariff,
  createMonthlyTariff,
  getAllBonoTariffs,
  getAllGroupedActiveOrFutureMontlhyUserTariffs,
  getAllMonthlyTariffs,
  getUserFutureTariffs,
  getUserTariffHistory,
  updatebonoTariff,
  updateMonthlyTariff,
  updateUserMonthlyTariff,
  upgradeUserTariff,
} from "../adapters/api";
import { ClassType } from "@/modules/dashboard/admin/classes/tariffs/ui/components/plansTab";

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
      paymentMethod: string; // "cash" | "card"
      collectWhen: "now" | "later"; // when to collect payment
      graceDays?: number;
    }) => assignMonthlyTariff(data),
  });

export const useAllGroupedActiveOrFutureMonthlyUserTariffs = () =>
  useQuery({
    queryKey: ["allGroupedActiveMonthlyUserTariffs"],
    queryFn: getAllGroupedActiveOrFutureMontlhyUserTariffs,
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

export const useUpdateUserMonthlyTariff = () =>
  useMutation({
    mutationFn: (v: {
      tariffId: number; // 👈 explicit
      userId: number;
      planId?: number;
      startsOn?: string;
      customExpiresOn?: string | null;
      note?: string | null;
      remainingCredits?: number | null;
    }) => updateUserMonthlyTariff(v.tariffId, v),
  });

export const useUpgradeUserTariff = () =>
  useMutation({
    mutationFn: (v: {
      // which tariff to modify
      tariffId: number; // user_tariffs.id
      userId: number;

      // plan change
      fromPlanId: number;
      toPlanId: number;

      // pricing (in cents)
      baseDiffCents: number;
      totalCents: number;
      commissionCents?: number;

      // currency
      currency: "eur";

      // audit
      commissionPct?: number | null;
      note?: string | null;

      // payment choice
      paymentMethod: "card" | "cash";
    }) => upgradeUserTariff(v),
  });
