import { useMutation, useQuery } from "@tanstack/react-query";
import {
  createSchedule,
  enrollInClass,
  getClassById,
  getClassEnrollments,
  getClassesByDay,
  getSchedule,
  getWeek,
  reinstateEnrollment,
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

export type SaveWeekPayload = {
  startDate: string;
  classes: {
    id?: string; // server id when editing
    dateISO: string;
    startTime: string;
    endTime: string;
    name: string;
    type: string;
    zoneName?: string | null;
    coachId?: number | null;
    capacity: number;
  }[];
  affectedDates?: string[];
  deletedIds?: string[];
};

export const useSaveWeek = () =>
  useMutation({
    mutationFn: (data: SaveWeekPayload) => saveWeek(data),
  });

export const useEnrollInClass = () =>
  useMutation({
    mutationFn: (data: { userId: number; classId: number }) =>
      enrollInClass(data),
  });

export const useReinstateEnrollment = () =>
  useMutation({
    mutationFn: ({ userId, classId }: { userId: number; classId: number }) =>
      reinstateEnrollment(userId, classId),
  });

export const useGetClassEnrollments = (classId: number) => ({
  queryKey: ["classEnrollments", classId],
  queryFn: async () => {
    const res = await getClassEnrollments(classId);
    return res;
  },
  enabled: !!classId, // only run if date is provided
});

export const useGetClassById = (classId: number | null) => ({
  queryKey: ["classById", classId],
  queryFn: async () => {
    const res = await getClassById(classId);
    return res;
  },
  enabled: !!classId, // only run if date is provided
});
