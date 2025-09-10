import {
  getAllUsers,
  getUserById,
  updateUserById,
  updateUserByIdAdmin,
} from "../adapters/api";

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

//Used directly in the form component

export const updateUserByIdMutationOptions = (userId: number) => ({
  mutationKey: ["updateUser", userId],
  mutationFn: async (userData: {
    name: string;
    lastName: string;
    email: string;
    oldPassword?: string;
    newPassword?: string;
    country?: string;
    city?: string;
    postalCode?: string;
    address?: string;
    phoneNumber?: string;
    birthDay?: string;
  }) => {
    return await updateUserById(userId, userData);
  },
});

export const updateUserByIdAdminMutationOptions = (userId: number) => ({
  mutationKey: ["updateUser", userId],
  mutationFn: async (userData: {
    name: string;
    lastName: string;
    email: string;
    newPassword?: string;
    repeatNewPassword?: string;
    country?: string;
    city?: string;
    postalCode?: string;
    address?: string;
    phoneNumber?: string;
    birthDay?: string;
  }) => {
    return await updateUserByIdAdmin(userId, userData);
  },
});
