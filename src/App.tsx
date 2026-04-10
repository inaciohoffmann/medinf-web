import React, { useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./hooks/useAuth";
import Login from "./pages/auth/Login";
import Cadastro from "./pages/auth/Cadastro";
import Home from "./pages/main/Home";
import EmitirNF from "./pages/main/EmitirNF";
import RevisarNF from "./pages/main/RevisarNF";
import SucessoNF from "./pages/main/SucessoNF";
import Perfil from "./pages/main/Perfil";

function TelaAssinatura() {
  const { linkCheckout, recarregarPerfil, assinaturaAtiva } = useAuth();
  const [verificando, setVerificando] = useState(false);

  const verificarAssinatura = async () => {
    setVerificando(true);
    try {
      await recarregarPerfil();
      if (assinaturaAtiva) {
        window.location.href = "/";
      }
    } catch (error) {
      console.error("Erro ao verificar assinatura:", error);
    } finally {
      setVerificando(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f7f6f2", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ backgroundColor: "#ffffff", borderRadius: "24px", padding: "48px", maxWidth: "440px", width: "100%", textAlign: "center" }}>
        <h1 style={{ fontFamily: "Georgia, serif", fontSize: "28px", color: "#0f1117", marginBottom: "16px" }}>
          Medi<span style={{ color: "#1a6b4a" }}>NF</span>
        </h1>
        <p style={{ color: "#7c7f8e", marginBottom: "32px" }}>Para emitir notas fiscais você precisa de uma assinatura ativa.</p>
        <a href={linkCheckout || "#"} target="_blank" rel="noreferrer" style={{ display: "block", padding: "16px", backgroundColor: "#1a6b4a", color: "#ffffff", borderRadius: "100px", fontSize: "16px", fontWeight: 600, textDecoration: "none", marginBottom: "12px" }}>
          Assinar por R$ 14,90/mês
        </a>
        <button
          onClick={verificarAssinatura}
          disabled={verificando}
          style={{
            width: "100%",
            padding: "12px 16px",
            backgroundColor: "#ffffff",
            border: "1px solid rgba(26, 107, 74, 0.3)",
            borderRadius: "100px",
            fontSize: "14px",
            fontWeight: 600,
            color: "#1a6b4a",
            cursor: verificando ? "not-allowed" : "pointer",
            opacity: verificando ? 0.6 : 1,
            marginBottom: "16px",
          }}
        >
          {verificando ? "Verificando..." : "Já paguei — verificar"}
        </button>
        <p style={{ fontSize: "12px", color: "#7c7f8e" }}>Após o pagamento clique em 'Já paguei' para liberar o acesso.</p>
      </div>
    </div>
  );
}


function AppRoutes() {
  const { medico, assinaturaAtiva, carregando, linkCheckout } = useAuth();

  if (carregando) {
    return (
      <div style={{ minHeight: "100vh", backgroundColor: "#f7f6f2", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <p style={{ color: "#1a6b4a", fontSize: "16px" }}>Carregando...</p>
      </div>
    );
  }

  if (!medico) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/cadastro" element={<Cadastro />} />
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    );
  }

  if (!assinaturaAtiva) {
    return (
      <Routes>
        <Route path="/assinatura" element={<TelaAssinatura />} />
        <Route path="*" element={<Navigate to="/assinatura" />} />
      </Routes>
    );
  }

  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/emitir" element={<EmitirNF />} />
      <Route path="/revisar" element={<RevisarNF />} />
      <Route path="/sucesso" element={<SucessoNF />} />
      <Route path="/perfil" element={<Perfil />} />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}
