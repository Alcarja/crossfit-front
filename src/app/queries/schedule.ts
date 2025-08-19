/* eslint-disable @typescript-eslint/no-explicit-any */
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  createSchedule,
  getSchedule,
  getWeek,
  saveWeek,
} from "../adapters/api";

export function useCreateSchedule() {
  return useMutation({
    mutationFn: createSchedule,
  });
}

export const scheduleQueryOptions = () => ({
  queryKey: ["schedule"],
  queryFn: async () => {
    const res = await getSchedule();
    return res;
  },
});

export const useGetWeek = (startDate: string) =>
  useQuery({
    queryKey: ["week", startDate],
    queryFn: async () => {
      const res = await getWeek(startDate);
      return res;
    },
    enabled: !!startDate, // only fetch when startDate is set
  });

export const useSaveWeek = () =>
  useMutation({
    mutationFn: (data: { startDate: string; classes: any[] }) => saveWeek(data),
  });
