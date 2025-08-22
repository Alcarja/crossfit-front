import stpApi from "@/utils/stp-api";
import { SaveWeekPayload } from "../queries/schedule";

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

export const deleteClass = async (id: number) => {
  return await stpApi.delete(`/api/classes/${id}`);
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

export const updateStock = async (data: {
  itemId: number;
  quantity: number;
  action: string;
}) => {
  return await stpApi.put("/api/inventory/update-stock", { data });
};

export const getInventoryTransactionsByMonthAndYear = async (
  month: number,
  year: number
) => {
  return await stpApi.get(
    `/api/inventory/inventory-transactions/${month}/${year}`
  );
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
  customPrice?: number;
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

//Schedule
export const createSchedule = async (data: {
  settings?: {
    name?: string;
    timezone?: string;
    validFrom?: string; // "YYYY-MM-DD"
    validTo?: string | null;
  };
  templates: {
    name: string;
    type:
      | "WOD"
      | "Gymnastics"
      | "Weightlifting"
      | "Endurance"
      | "Foundations"
      | "Kids";
    dayOfWeek: number; // 0–6 (Sun–Sat)
    startTime: string; // "HH:mm"
    endTime: string; // "HH:mm"
    capacity: number;
    coachId?: number;
    zoneName?: string;
    isActive?: boolean;
  }[];
  replaceExisting?: boolean;
}) => {
  return await stpApi.post("/api/schedule", data);
};

export const getSchedule = async () => {
  return await stpApi.get("/api/schedule");
};

export const getWeek = async (startDate: string) => {
  return await stpApi.get("/api/schedule/week", {
    params: { startDate }, // ?startDate=YYYY-MM-DD
  });
};

export const getClassesByDay = async (date: string) => {
  return await stpApi.get("/api/schedule/classes-by-day", {
    params: { date }, // ?date=YYYY-MM-DD
  });
};

export const saveWeek = async (data: SaveWeekPayload) => {
  return await stpApi.put("/api/schedule/week", data);
};

export const enrollInClass = async (data: {
  userId: number;
  classId: number;
}) => {
  return await stpApi.post(
    `/api/schedule/enroll-in-class/${data.classId}`,
    data
  );
};

export const cancelEnrollment = async (userId: number, classId: number) => {
  return await stpApi.delete(
    `/api/schedule/delete-enrollment/${classId}/${userId}`
  );
};

export const reinstateEnrollment = async (userId: number, classId: number) => {
  return await stpApi.put(
    `/api/schedule/reinstate-enrollment/${classId}/${userId}`,
    {}
  );
};

export const moveToWaitlist = async (userId: number, classId: number) => {
  return await stpApi.put(
    `/api/schedule/move-to-waitlist/${classId}/${userId}`,
    {}
  );
};

export const promoteFromWaitlist = (userId: number, classId: number) =>
  stpApi.put(`/api/schedule/promote-from-waitlist/${classId}/${userId}`, {});

export const waitlistToCancel = (userId: number, classId: number) =>
  stpApi.put(`/api/schedule/waitlist-to-cancel/${classId}/${userId}`, {});

export const getClassEnrollments = async (classId: number) => {
  return await stpApi.get(`/api/schedule/get-enrollments/${classId}`);
};

//Tariffs
export const createMonthlyTariff = async (data: {
  name: string;
  price: number;
  isActive: boolean;
  creditQty: number | null;
  maxPerDay: number | null;
}) => {
  return await stpApi.post(`/api/tariffs/create-monthly-tariff`, data);
};

export const getAllMonthlyTariffs = async () => {
  return await stpApi.get(`/api/tariffs/get-all-monthly-tariffs`);
};

export const updateMonthlyTariff = (
  id: number,
  data: {
    name?: string;
    price?: number;
    isActive?: boolean;
    creditQty?: number | null;
    maxPerDay?: number | null;
  }
) => stpApi.put(`/api/tariffs/update-monthly-tariff/${id}`, data);

export const getAllBonoTariffs = async () => {
  return await stpApi.get(`/api/tariffs/get-all-bono-tariffs`);
};

export const createBonoTariff = async (data: {
  name: string;
  price: number;
  isActive: boolean;
  creditQty: number;
}) => {
  return await stpApi.post(`/api/tariffs/create-bono-tariff`, data);
};

export const updatebonoTariff = (
  id: number,
  data: {
    name?: string;
    price?: number;
    isActive?: boolean;
    creditQty?: number | null;
  }
) => stpApi.put(`/api/tariffs/update-bono-tariff/${id}`, data);
