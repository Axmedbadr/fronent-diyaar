import { apiClient } from "./client";

export const loginRequest = async (email, password) => {
  const response = await apiClient.post("/auth/login", { email, password });
  return response.data;
};

export const registerRequest = async (name, email, password) => {
  const response = await apiClient.post("/auth/register", { name, email, password });
  return response.data;
};

export const refreshRequest = async () => {
  const response = await apiClient.post("/auth/refresh");
  return response.data;
};

export const logoutRequest = async () => {
  const response = await apiClient.post("/auth/logout");
  return response.data;
};

export const meRequest = async () => {
  const response = await apiClient.get("/auth/me");
  return response.data;
};
