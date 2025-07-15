/* eslint-disable @typescript-eslint/no-explicit-any */
import { useMutation } from "@tanstack/react-query";
import { createClass, getClasses, updateClass } from "../adapters/api";

export const useCreateClassQuery = () =>
  useMutation({
    mutationFn: ({ userId, classData }: { userId: number; classData: any }) =>
      createClass(userId, classData),
  });

export const classesQueryOptions = (start: string, end: string) => ({
  queryKey: ["classes", start, end],
  queryFn: async () => {
    return await getClasses(start, end);
  },
  enabled: !!start && !!end, // only runs if both dates exist
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
      };
    }) => updateClass(id, data),
  });
