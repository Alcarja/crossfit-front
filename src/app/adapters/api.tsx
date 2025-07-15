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

export const updateClass = async (
  id: number,
  data: {
    start?: string;
    end?: string;
    coachId?: number;
    type?: string;
  }
) => {
  return await stpApi.put(`/api/classes/${id}`, data);
};
