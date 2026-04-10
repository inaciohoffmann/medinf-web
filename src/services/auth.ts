import api from "./api";
import { ENDPOINTS } from "../constants/api";

export const login = async (email: string, senha: string) => {
  const response = await api.post(ENDPOINTS.LOGIN, { email, senha });
  localStorage.setItem("token", response.data.access_token);
  return response.data;
};

export const logout = () => {
  localStorage.removeItem("token");
};

export const obterPerfil = async () => {
  const response = await api.get(ENDPOINTS.ME);
  return response.data;
};

export const obterStatusAssinatura = async () => {
  const response = await api.get(ENDPOINTS.ASSINATURA_STATUS);
  return response.data;
};

export const obterCheckout = async () => {
  const response = await api.get(ENDPOINTS.ASSINATURA_CHECKOUT);
  return response.data;
};
