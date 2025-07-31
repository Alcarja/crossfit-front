import stpApi from "@/utils/stp-api";

// 🧑‍💻 Auth
export const register = async (userData: {
  name: string;
  lastName: string;
  email: string;
  password: string;
}) => {
  return stpApi.post("/api/auth/register", userData);
};

export const login = async (userData: { email: string; password: string }) => {
  return stpApi.post("/api/auth/login", userData);
};

export const logout = async () => {
  return await stpApi.post("/api/auth/logout", {});
};

export const getCurrentUser = async () => {
  return await stpApi.get("/api/auth/me");
};

export const getAllUsers = async () => {
  return await stpApi.get("/api/users/allUsers");
};

export const getUserById = async (userId: number) => {
  return await stpApi.get(`/api/users/${userId}`);
};

export const updateUserById = async (
  userId: number,
  userData: {
    name: string;
    lastName: string;
    email: string;
    oldPassword?: string;
    newPassword?: string;
  }
) => {
  return stpApi.put(`/api/users/${userId}`, userData);
};

export const updateUserByIdAdmin = async (
  userId: number,
  userData: {
    name: string;
    lastName: string;
    email: string;
    newPassword?: string;
    repeatNewPassword?: string;
  }
) => {
  return stpApi.put(`/api/users/${userId}/admin`, userData);
};

//Classes
export const createClass = async (
  userId: number,
  classData: {
    start: string;
    end: string;
    coach: string;
    type: string;
    isOpen: boolean;
    isClose: boolean;
  }
) => {
  return stpApi.post(`/api/classes/${userId}`, classData);
};

export const getClasses = async (start: string, end: string) => {
  return await stpApi.get("/api/classes", {
    params: { start, end },
  });
};

export const getClassesByMonthAndYear = async (month: string, year: string) => {
  return await stpApi.get(`/api/classes/${month}/${year}`, {});
};

export const updateClass = async (
  id: number,
  data: {
    start?: string;
    end?: string;
    coachId?: number;
    type?: string;
    isOpen?: boolean;
    isClose?: boolean;
  }
) => {
  return await stpApi.put(`/api/classes/${id}`, data);
};

//Categories
export const getAllCategories = async () => {
  return await stpApi.get("/api/categories", {});
};

export const createCategory = async (name: string) => {
  return await stpApi.post("/api/categories", { name });
};

export const deleteCategory = async (categoryId: number) => {
  return await stpApi.delete("/api/categories", { categoryId });
};

//Inventory
export const getAllInventory = async () => {
  return await stpApi.get("/api/inventory", {});
};

export const createInventoryItem = async (
  name: string,
  categoryId: number,
  priceRegular: number,
  priceCoach: number
) => {
  return await stpApi.post("/api/inventory", {
    name,
    categoryId,
    priceRegular,
    priceCoach,
  });
};

export const deleteInventoryItem = async (inventoryItemId: number) => {
  return await stpApi.delete("/api/inventory", { inventoryItemId });
};

export const updateInventoryItem = async (data: {
  inventoryItemId: number;
  name: string;
  categoryId: number;
  priceRegular: number;
  priceCoach: number;
}) => {
  return await stpApi.put("/api/inventory", { data });
};

//Coach expenses
export const getCoachExpensesByMonthAndYear = async (
  month: string,
  year: string
) => {
  return await stpApi.get(`/api/coach-expenses/${month}/${year}`, {});
};

export const createCoachExpense = async (data: {
  coachId: number;
  inventoryId: string;
  quantity: number;
  date: string;
}) => {
  return await stpApi.post(`/api/coach-expenses`, data);
};

export const deleteCoachExpense = async (expenseId: number) => {
  return await stpApi.delete(`/api/coach-expenses/${expenseId}`);
};

//Workouts
export const createWorkout = async (data: {
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
}) => {
  return await stpApi.post("/api/workouts", data);
};

export const getWorkoutsByDateRange = async (start: string, end: string) => {
  const data = await stpApi.get("/api/workouts", {
    params: { start, end },
  });
  return data;
};

export const updateWorkoutById = async (
  workoutId: number,
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
  }
) => {
  return await stpApi.put(`/api/workouts/${workoutId}`, data);
};

export const deleteWorkoutById = async (workoutId: number) => {
  return await stpApi.delete(`/api/workouts/${workoutId}`);
};
