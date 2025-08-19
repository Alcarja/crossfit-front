import { useMutation } from "@tanstack/react-query";
import { createSchedule, getSchedule } from "../adapters/api";

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
