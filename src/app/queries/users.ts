import { getAllUsers, getUserById } from "../adapters/api";

export const usersQueryOptions = () => ({
  queryKey: ["users"],
  queryFn: async () => {
    return await getAllUsers();
  },
});

export const userByIdQueryOptions = (userId: number) => ({
  queryKey: ["user", userId],
  queryFn: async () => {
    return await getUserById(userId);
  },
});
