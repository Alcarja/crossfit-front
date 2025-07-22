import { useMutation } from "@tanstack/react-query";
import {
  createWorkout,
  getClasses,
  getWorkoutsByDateRange,
  updateClass,
} from "../adapters/api";

export const useCreateWorkoutQuery = () =>
  useMutation({
    mutationFn: (data: {
      date: string;
      type: string;
      focus?: string[];
      parts?: {
        title: string;
        format?: string;
        content: string;
        notes?: string;
        cap?: string;
        versions?: {
          rx?: { description: string };
          scaled?: { description: string };
          beginner?: { description: string };
        };
      }[];
    }) => createWorkout(data),
  });

export const classesQueryOptions = (start: string, end: string) => ({
  queryKey: ["classes", start, end],
  queryFn: async () => {
    return await getClasses(start, end);
  },
  enabled: !!start && !!end, // only runs if both dates exist
});

export const workoutsByDateRangeQueryOptions = (
  start: string,
  end: string
) => ({
  queryKey: ["workouts", "byRange", start, end],
  queryFn: async () => {
    const response = await getWorkoutsByDateRange(start, end);
    return response.results ?? []; // ✅ now this works
  },
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
