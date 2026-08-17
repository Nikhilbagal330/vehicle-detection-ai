import api from "./client";

export const signup = async ({ name, email, password }) => {
  const response = await api.post("/api/auth/signup", {
    name,
    email,
    password,
  });

  return response.data;
};

export const login = async ({ email, password }) => {
  const response = await api.post("/api/auth/login", {
    email,
    password,
  });

  return response.data;
};
