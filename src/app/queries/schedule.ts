/* eslint-disable @typescript-eslint/no-explicit-any */
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  createSchedule,
  getClassesByDay,
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

export const classesByDayQueryOptions = (date: string) => ({
  queryKey: ["day", date],
  queryFn: async () => {
    const res = await getClassesByDay(date);
    return res;
  },
  enabled: !!date, // only run if date is provided
});

export const useSaveWeek = () =>
  useMutation({
    mutationFn: (data: { startDate: string; classes: any[] }) => saveWeek(data),
  });
