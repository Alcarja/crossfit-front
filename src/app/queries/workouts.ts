import { useMutation } from "@tanstack/react-query";
import {
  createWorkout,
  deleteWorkoutById,
  getWorkoutsByDateRange,
  updateWorkoutById,
} from "../adapters/api";

export const useCreateWorkoutQuery = () =>
  useMutation({
    mutationFn: (data: {
      date: string;
      type: string;
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

export const useUpdateWorkoutQuery = () =>
  useMutation({
    mutationFn: ({
      workoutId,
      data,
    }: {
      workoutId: number;
      data: {
        date: string;
        type: string;
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
      };
    }) => updateWorkoutById(workoutId, data),
  });

export const useDeleteWorkoutMutation = () =>
  useMutation({
    mutationFn: deleteWorkoutById,
  });
