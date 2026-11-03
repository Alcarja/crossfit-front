import {
  getAllUsers,
  getUserById,
  updateUserById,
  updateUserByIdAdmin,
  updateUserRole,
  type UserRole,
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
  }) => {
    return await updateUserByIdAdmin(userId, userData);
  },
});

// Callbacks live on the useMutation options, so name/lastName travel in the
// variables for them; the request itself only uses userId and role.
export const updateUserRoleMutationOptions = () => ({
  mutationKey: ["updateUserRole"],
  mutationFn: async ({
    userId,
    role,
  }: {
    userId: number;
    role: UserRole;
    name: string;
    lastName: string;
  }) => {
    return await updateUserRole(userId, role);
  },
});
