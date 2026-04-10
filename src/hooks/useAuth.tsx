import React, { createContext, useContext, useEffect, useState } from "react";
import { obterPerfil, obterStatusAssinatura, obterCheckout, logout } from "../services/auth";

const AuthContext = createContext<any>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [medico, setMedico] = useState<any>(null);
  const [assinaturaAtiva, setAssinaturaAtiva] = useState(false);
  const [linkCheckout, setLinkCheckout] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    verificarSessao();
  }, []);

  const verificarSessao = async () => {
    const token = localStorage.getItem("token");
    if (token) {
      try {
        const perfil = await obterPerfil();
        setMedico(perfil);
        const assinatura = await obterStatusAssinatura();
        setAssinaturaAtiva(assinatura.ativa === true);
        if (!assinatura.ativa) {
          const checkout = await obterCheckout();
          setLinkCheckout(checkout.checkout_url);
        }
      } catch (error) {
        localStorage.removeItem("token");
      }
    }
    setCarregando(false);
  };

  const fazerLogout = () => {
    logout();
    setMedico(null);
    setAssinaturaAtiva(false);
  };

  const recarregarPerfil = async () => {
    const perfil = await obterPerfil();
    setMedico(perfil);
    const assinatura = await obterStatusAssinatura();
    setAssinaturaAtiva(assinatura.ativa === true);
    if (!assinatura.ativa) {
      const checkout = await obterCheckout();
      setLinkCheckout(checkout.checkout_url);
    }
  };

  return (
    <AuthContext.Provider value={{ medico, assinaturaAtiva, linkCheckout, carregando, fazerLogout, recarregarPerfil }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
