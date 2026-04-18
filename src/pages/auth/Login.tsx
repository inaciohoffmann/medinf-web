import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { login } from "../../services/auth";
import { useAuth } from "../../hooks/useAuth";

export default function Login() {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [verSenha, setVerSenha] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState("");
  const navigate = useNavigate();
  const { recarregarPerfil } = useAuth();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro("");
    setCarregando(true);
    try {
      await login(email, senha);
      await recarregarPerfil();
      navigate("/");
    } catch (error: any) {
      setErro(error.response?.data?.detail || "E-mail ou senha incorretos.");
    } finally {
      setCarregando(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f7f6f2", display: "flex", alignItems: "center", justifyContent: "center", padding: "24px" }}>
      <div style={{ backgroundColor: "#ffffff", borderRadius: "24px", padding: "48px", maxWidth: "440px", width: "100%", border: "1px solid rgba(15,17,23,0.08)" }}>
        <div style={{ marginBottom: "40px" }}>
          <h1 style={{ fontFamily: "Georgia, serif", fontSize: "32px", color: "#0f1117", letterSpacing: "-1px", marginBottom: "8px" }}>
            Medi<span style={{ color: "#1a6b4a" }}>NF</span>
          </h1>
          <p style={{ color: "#7c7f8e", fontSize: "15px" }}>Notas fiscais sem dor.</p>
        </div>

        {erro && (
          <div style={{ backgroundColor: "#fef2f2", borderRadius: "10px", padding: "12px 16px", color: "#dc2626", fontSize: "14px", marginBottom: "16px" }}>
            {erro}
          </div>
        )}

        <form onSubmit={handleLogin}>
          <div style={{ marginBottom: "16px" }}>
            <label style={{ display: "block", fontSize: "13px", fontWeight: 500, color: "#3d3f4a", marginBottom: "8px" }}>E-mail</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="seu@email.com"
              style={{ width: "100%", padding: "14px 16px", borderRadius: "12px", border: "1.5px solid rgba(15,17,23,0.10)", fontSize: "15px", color: "#0f1117", backgroundColor: "#f7f6f2", outline: "none", boxSizing: "border-box" }}
            />
          </div>

          <div style={{ marginBottom: "24px" }}>
            <label style={{ display: "block", fontSize: "13px", fontWeight: 500, color: "#3d3f4a", marginBottom: "8px" }}>Senha</label>
            <div style={{ position: "relative" }}>
              <input
                type={verSenha ? "text" : "password"}
                value={senha}
                onChange={e => setSenha(e.target.value)}
                placeholder="••••••••"
                style={{ width: "100%", padding: "14px 48px 14px 16px", borderRadius: "12px", border: "1.5px solid rgba(15,17,23,0.10)", fontSize: "15px", color: "#0f1117", backgroundColor: "#f7f6f2", outline: "none", boxSizing: "border-box" }}
              />
              <button
                type="button"
                onClick={() => setVerSenha(!verSenha)}
                style={{ position: "absolute", right: "14px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", fontSize: "18px", color: "#7c7f8e", padding: "0" }}
              >
                {verSenha ? "🙈" : "👁️"}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={carregando}
            style={{ width: "100%", padding: "16px", backgroundColor: "#1a6b4a", color: "#ffffff", border: "none", borderRadius: "100px", fontSize: "16px", fontWeight: 600, cursor: carregando ? "not-allowed" : "pointer", opacity: carregando ? 0.7 : 1 }}
          >
            {carregando ? "Entrando..." : "Entrar"}
          </button>
        </form>

        <div style={{ textAlign: "center", marginTop: "24px" }}>
          <Link to="/recuperar-senha" style={{ color: "#7c7f8e", fontSize: "14px", textDecoration: "none" }}>Esqueci minha senha</Link>
        </div>

        <div style={{ display: "flex", alignItems: "center", margin: "24px 0" }}>
          <div style={{ flex: 1, height: "1px", backgroundColor: "rgba(15,17,23,0.10)" }} />
          <span style={{ margin: "0 16px", color: "#7c7f8e", fontSize: "13px" }}>ou</span>
          <div style={{ flex: 1, height: "1px", backgroundColor: "rgba(15,17,23,0.10)" }} />
        </div>

        <Link to="/cadastro" style={{ display: "block", width: "100%", padding: "16px", backgroundColor: "#ffffff", color: "#0f1117", border: "1.5px solid rgba(15,17,23,0.10)", borderRadius: "100px", fontSize: "16px", fontWeight: 500, textAlign: "center", textDecoration: "none", boxSizing: "border-box" }}>
          Criar conta
        </Link>
      </div>
    </div>
  );
}
