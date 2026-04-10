import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../../services/api";
import { ENDPOINTS } from "../../constants/api";
import { useAuth } from "../../hooks/useAuth";

export default function Cadastro() {
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [documento, setDocumento] = useState("");
  const [crm, setCrm] = useState("");
  const [municipioBusca, setMunicipioBusca] = useState("");
  const [municipios, setMunicipios] = useState<any[]>([]);
  const [municipioSelecionado, setMunicipioSelecionado] = useState<any>(null);
  const [carregando, setCarregando] = useState(false);
  const [buscandoMunicipio, setBuscandoMunicipio] = useState(false);
  const [erro, setErro] = useState("");
  const navigate = useNavigate();
  const { recarregarPerfil } = useAuth();

  useEffect(() => {
    const timer = setTimeout(() => {
      if (municipioBusca.length >= 3) buscarMunicipios();
    }, 500);
    return () => clearTimeout(timer);
  }, [municipioBusca]);

  const buscarMunicipios = async () => {
    setBuscandoMunicipio(true);
    try {
      const response = await api.get(`/api/v1/medico/municipios?q=${municipioBusca}`);
      setMunicipios(response.data);
    } catch (error) {
      console.error(error);
    } finally {
      setBuscandoMunicipio(false);
    }
  };

  const handleCadastro = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!municipioSelecionado) { setErro("Selecione seu município."); return; }
    setErro(""); setCarregando(true);
    try {
      await api.post(ENDPOINTS.CADASTRO, {
        nome,
        email,
        senha,
        documento: documento.replace(/\D/g, ""),
        crm,
        municipios: [{ codigo_ibge: municipioSelecionado.codigo_ibge, principal: true }],
      });
      const { login } = await import("../../services/auth");
      await login(email, senha);
      await recarregarPerfil();
      navigate("/assinatura");
    } catch (error: any) {
      setErro(error.response?.data?.detail || "Erro ao criar conta.");
    } finally {
      setCarregando(false);
    }
  };

  const inputStyle = { width: "100%", padding: "14px 16px", borderRadius: "12px", border: "1.5px solid rgba(15,17,23,0.10)", fontSize: "15px", color: "#0f1117", backgroundColor: "#f7f6f2", outline: "none", boxSizing: "border-box" as const };
  const labelStyle = { display: "block", fontSize: "13px", fontWeight: 500 as const, color: "#3d3f4a", marginBottom: "8px" };

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f7f6f2", display: "flex", alignItems: "center", justifyContent: "center", padding: "24px" }}>
      <div style={{ backgroundColor: "#ffffff", borderRadius: "24px", padding: "48px", maxWidth: "480px", width: "100%", border: "1px solid rgba(15,17,23,0.08)" }}>
        <div style={{ marginBottom: "32px" }}>
          <h1 style={{ fontFamily: "Georgia, serif", fontSize: "28px", color: "#0f1117", letterSpacing: "-1px", marginBottom: "8px" }}>
            Criar conta
          </h1>
          <p style={{ color: "#7c7f8e", fontSize: "15px" }}>Comece a emitir notas em segundos.</p>
        </div>

        {erro && <div style={{ backgroundColor: "#fef2f2", borderRadius: "10px", padding: "12px 16px", color: "#dc2626", fontSize: "14px", marginBottom: "16px" }}>{erro}</div>}

        <form onSubmit={handleCadastro}>
          <div style={{ marginBottom: "16px" }}>
            <label style={labelStyle}>Nome completo</label>
            <input value={nome} onChange={e => setNome(e.target.value)} placeholder="Dr. João da Silva" style={inputStyle} required />
          </div>
          <div style={{ marginBottom: "16px" }}>
            <label style={labelStyle}>E-mail</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="seu@email.com" style={inputStyle} required />
          </div>
          <div style={{ marginBottom: "16px" }}>
            <label style={labelStyle}>Senha</label>
            <input type="password" value={senha} onChange={e => setSenha(e.target.value)} placeholder="••••••••" style={inputStyle} required />
          </div>
          <div style={{ marginBottom: "16px" }}>
            <label style={labelStyle}>CPF ou CNPJ</label>
            <input value={documento} onChange={e => setDocumento(e.target.value)} placeholder="000.000.000-00" style={inputStyle} required />
          </div>
          <div style={{ marginBottom: "16px" }}>
            <label style={labelStyle}>CRM (opcional)</label>
            <input value={crm} onChange={e => setCrm(e.target.value)} placeholder="12345-CE" style={inputStyle} />
          </div>
          <div style={{ marginBottom: "24px" }}>
            <label style={labelStyle}>Município</label>
            <input
              value={municipioSelecionado ? `${municipioSelecionado.nome_municipio} - ${municipioSelecionado.uf}` : municipioBusca}
              onChange={e => { setMunicipioBusca(e.target.value); setMunicipioSelecionado(null); }}
              placeholder="Digite o nome da cidade..."
              style={inputStyle}
            />
            {municipios.length > 0 && !municipioSelecionado && (
              <div style={{ backgroundColor: "#ffffff", border: "1px solid rgba(15,17,23,0.10)", borderRadius: "12px", marginTop: "4px", overflow: "hidden" }}>
                {municipios.slice(0, 5).map((m) => (
                  <div key={m.codigo_ibge} onClick={() => { setMunicipioSelecionado(m); setMunicipios([]); }} style={{ padding: "12px 16px", cursor: "pointer", borderBottom: "1px solid rgba(15,17,23,0.06)", fontSize: "14px", color: "#0f1117" }}>
                    {m.nome_municipio} - {m.uf}
                  </div>
                ))}
              </div>
            )}
          </div>

          <button type="submit" disabled={carregando} style={{ width: "100%", padding: "16px", backgroundColor: "#1a6b4a", color: "#ffffff", border: "none", borderRadius: "100px", fontSize: "16px", fontWeight: 600, cursor: carregando ? "not-allowed" : "pointer", opacity: carregando ? 0.7 : 1 }}>
            {carregando ? "Criando conta..." : "Criar conta"}
          </button>
        </form>

        <p style={{ textAlign: "center", marginTop: "16px", fontSize: "12px", color: "#7c7f8e" }}>
          Ao criar sua conta você concorda com os{" "}
          <a href="https://medinf.com.br/termos.html" target="_blank" rel="noreferrer" style={{ color: "#1a6b4a" }}>Termos de Uso</a>
          {" "}e{" "}
          <a href="https://medinf.com.br/privacidade.html" target="_blank" rel="noreferrer" style={{ color: "#1a6b4a" }}>Política de Privacidade</a>
        </p>

        <div style={{ display: "flex", alignItems: "center", margin: "24px 0" }}>
          <div style={{ flex: 1, height: "1px", backgroundColor: "rgba(15,17,23,0.10)" }} />
          <span style={{ margin: "0 16px", color: "#7c7f8e", fontSize: "13px" }}>ou</span>
          <div style={{ flex: 1, height: "1px", backgroundColor: "rgba(15,17,23,0.10)" }} />
        </div>

        <Link to="/login" style={{ display: "block", width: "100%", padding: "16px", backgroundColor: "#ffffff", color: "#0f1117", border: "1.5px solid rgba(15,17,23,0.10)", borderRadius: "100px", fontSize: "16px", fontWeight: 500, textAlign: "center", textDecoration: "none", boxSizing: "border-box" }}>
          Já tenho conta
        </Link>
      </div>
    </div>
  );
}
