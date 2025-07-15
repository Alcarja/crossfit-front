import { getAllUsers } from "../adapters/api";

export const usersQueryOptions = () => ({
  queryKey: ["users"],
  queryFn: async () => {
    return await getAllUsers();
  },
});
