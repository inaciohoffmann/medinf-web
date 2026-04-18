import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import api from "../../services/api";
import { ENDPOINTS } from "../../constants/api";
import { useAuth } from "../../hooks/useAuth";

export default function RevisarNF() {
  const navigate = useNavigate();
  const location = useLocation();
  const { medico } = useAuth();
  const dados = location.state?.dados || {};

  const [nome, setNome] = useState(dados.paciente_nome || "");
  const [cpf, setCpf] = useState(dados.paciente_cpf || "");
  const [valor, setValor] = useState(String(dados.valor || ""));
  const [descricao, setDescricao] = useState(dados.descricao_servico || "");
  const [municipio, setMunicipio] = useState(medico?.municipios?.[0]?.codigo_ibge || "");
  const [codigoServico, setCodigoServico] = useState(dados.codigo_servico || medico?.codigo_servico || "");
  const [codigoTributario, setCodigoTributario] = useState(dados.codigo_tributario_municipio || medico?.codigo_tributario_municipio || "");
  const [aliquota, setAliquota] = useState(dados.aliquota_iss || medico?.aliquota_iss || "");
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState("");

  const emitirNF = async () => {
    if (!nome || !cpf || !valor || !descricao || !municipio) {
      setErro("Preencha todos os campos."); return;
    }
    setCarregando(true); setErro("");
    try {
      const response = await api.post(ENDPOINTS.EMITIR_NF, {
        paciente_nome: nome,
        paciente_cpf: cpf.replace(/\D/g, ""),
        valor: parseFloat(valor.replace(",", ".")),
        descricao_servico: descricao,
        codigo_ibge_municipio: municipio,
        codigo_servico: codigoServico || undefined,
        codigo_tributario_municipio: codigoTributario || undefined,
      });
      navigate("/sucesso", { state: { nota: response.data } });
    } catch (error: any) {
      setErro(error.response?.data?.detail || "Erro ao emitir nota.");
    } finally { setCarregando(false); }
  };

  const inputStyle = { width: "100%", padding: "14px 16px", borderRadius: "12px", border: "1.5px solid rgba(15,17,23,0.10)", fontSize: "15px", color: "#0f1117", backgroundColor: "#f7f6f2", outline: "none", boxSizing: "border-box" as const, marginBottom: "16px" };
  const labelStyle = { display: "block", fontSize: "13px", fontWeight: 500 as const, color: "#3d3f4a", marginBottom: "8px" };

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f7f6f2" }}>
      <div style={{ backgroundColor: "#ffffff", borderBottom: "1px solid rgba(15,17,23,0.08)", padding: "16px 32px", display: "flex", alignItems: "center", gap: "16px" }}>
        <a href="/emitir" style={{ color: "#1a6b4a", textDecoration: "none", fontSize: "15px" }}>← Voltar</a>
        <h1 style={{ fontFamily: "Georgia, serif", fontSize: "20px", color: "#0f1117" }}>Revisar dados</h1>
      </div>

      <div style={{ maxWidth: "640px", margin: "0 auto", padding: "40px 32px" }}>
        {dados.confianca && (
          <div style={{ backgroundColor: dados.confianca === "alta" ? "#e8f4ef" : "#fef9e7", borderRadius: "100px", padding: "8px 16px", display: "inline-block", marginBottom: "24px" }}>
            <span style={{ fontSize: "13px", fontWeight: 500, color: dados.confianca === "alta" ? "#1a6b4a" : "#856404" }}>
              {dados.confianca === "alta" ? "✓ Confiança alta" : "⚠ Verifique os dados"}
            </span>
          </div>
        )}

        {erro && <div style={{ backgroundColor: "#fef2f2", borderRadius: "10px", padding: "12px 16px", color: "#dc2626", fontSize: "14px", marginBottom: "16px" }}>{erro}</div>}

        <div style={{ backgroundColor: "#ffffff", borderRadius: "16px", padding: "24px", border: "1px solid rgba(15,17,23,0.08)", marginBottom: "24px" }}>
          <label style={labelStyle}>Nome do paciente</label>
          <input value={nome} onChange={e => setNome(e.target.value)} placeholder="Nome completo" style={inputStyle} />

          <label style={labelStyle}>CPF do paciente</label>
          <input value={cpf} onChange={e => setCpf(e.target.value)} placeholder="00000000000" style={inputStyle} />

          <label style={labelStyle}>Valor (R$)</label>
          <input value={valor} onChange={e => setValor(e.target.value)} placeholder="0,00" style={inputStyle} />

          <label style={labelStyle}>Descrição do serviço</label>
          <input value={descricao} onChange={e => setDescricao(e.target.value)} placeholder="Consulta médica" style={inputStyle} />

          <label style={labelStyle}>Município</label>
          <select value={municipio} onChange={e => setMunicipio(e.target.value)} style={{ ...inputStyle, cursor: "pointer" }}>
            {medico?.municipios?.map((m: any) => (
              <option key={m.codigo_ibge} value={m.codigo_ibge}>{m.nome_municipio} - {m.uf}</option>
            ))}
          </select>

          <div style={{ backgroundColor: "#f7f6f2", borderRadius: "10px", padding: "14px 16px", marginBottom: "16px" }}>
            <p style={{ fontSize: "12px", fontWeight: 600, color: "#7c7f8e", margin: "0 0 8px 0" }}>DADOS FISCAIS</p>
            <p style={{ fontSize: "13px", color: "#3d3f4a", margin: "0 0 4px 0" }}>
              Código serviço: <strong>{codigoServico || "⚠ Não configurado"}</strong>
            </p>
            <p style={{ fontSize: "13px", color: "#3d3f4a", margin: "0 0 4px 0" }}>
              Código tributário: <strong>{codigoTributario || "⚠ Não configurado"}</strong>
            </p>
            <p style={{ fontSize: "13px", color: "#3d3f4a", margin: 0 }}>
              Alíquota ISS: <strong>{aliquota ? `${aliquota}%` : "⚠ Não configurada"}</strong>
            </p>
            {(!codigoServico || !codigoTributario) && (
              <a href="/perfil" style={{ display: "inline-block", marginTop: "8px", fontSize: "12px", color: "#1a6b4a", fontWeight: 600 }}>
                → Configurar no perfil
              </a>
            )}
          </div>
        </div>

        <button onClick={emitirNF} disabled={carregando} style={{ width: "100%", padding: "16px", backgroundColor: "#1a6b4a", color: "#ffffff", border: "none", borderRadius: "100px", fontSize: "16px", fontWeight: 600, cursor: carregando ? "not-allowed" : "pointer", opacity: carregando ? 0.7 : 1 }}>
          {carregando ? "Emitindo nota..." : "Emitir nota fiscal"}
        </button>
      </div>
    </div>
  );
}
