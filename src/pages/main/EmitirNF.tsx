import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import { ENDPOINTS } from "../../constants/api";
import { useAuth } from "../../hooks/useAuth";

export default function EmitirNF() {
  const navigate = useNavigate();
  const { medico } = useAuth();
  const [modo, setModo] = useState<"texto" | "imagem">("texto");
  const [texto, setTexto] = useState("");
  const [imagem, setImagem] = useState<File | null>(null);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState("");
  const [formManual, setFormManual] = useState({
    paciente_nome: "",
    paciente_cpf: "",
    valor: "",
    descricao_servico: "",
    codigo_ibge_municipio: "",
    codigo_servico: "",
    codigo_tributario_municipio: "",
    aliquota_iss: "",
  });

  useEffect(() => {
    if (medico?.municipios?.length > 0) {
      const principal = medico.municipios.find((m: any) => m.principal) || medico.municipios[0];
      setFormManual(prev => ({
        ...prev,
        codigo_ibge_municipio: principal.codigo_ibge || "",
      }));
    }
    if (medico?.codigo_servico) {
      setFormManual(prev => ({
        ...prev,
        codigo_servico: medico.codigo_servico || "",
        codigo_tributario_municipio: medico.codigo_tributario_municipio || "",
        aliquota_iss: medico.aliquota_iss || "",
      }));
    }
  }, [medico]);

  const extrairDeTexto = async () => {
    if (texto.trim().length < 10) { setErro("Digite os dados do paciente."); return; }
    setCarregando(true); setErro("");
    try {
      const formData = new FormData();
      formData.append("texto", texto);
      const response = await api.post(ENDPOINTS.EXTRAIR_TEXTO, formData, { headers: { "Content-Type": "multipart/form-data" } });
      navigate("/revisar", { state: { dados: response.data } });
    } catch (error: any) {
      setErro(error.response?.data?.detail || "Erro ao extrair dados.");
    } finally { setCarregando(false); }
  };

  const extrairDeImagem = async () => {
    if (!imagem) { setErro("Selecione uma imagem."); return; }
    setCarregando(true); setErro("");
    try {
      const formData = new FormData();
      formData.append("imagem", imagem);
      const response = await api.post(ENDPOINTS.EXTRAIR_IMAGEM, formData, { headers: { "Content-Type": "multipart/form-data" } });
      navigate("/revisar", { state: { dados: response.data } });
    } catch (error: any) {
      setErro(error.response?.data?.detail || "Erro ao extrair dados da imagem.");
    } finally { setCarregando(false); }
  };

  const emitirManual = async () => {
    if (!formManual.paciente_nome || !formManual.paciente_cpf || !formManual.valor) {
      setErro("Preencha nome, CPF e valor.");
      return;
    }
    setCarregando(true);
    setErro("");
    try {
      const response = await api.post("/api/v1/notas/emitir", {
        paciente_nome: formManual.paciente_nome,
        paciente_cpf: formManual.paciente_cpf.replace(/\D/g, ""),
        valor: parseFloat(formManual.valor.replace(",", ".")),
        descricao_servico: formManual.descricao_servico || "Consulta médica",
        codigo_ibge_municipio: formManual.codigo_ibge_municipio,
        codigo_servico: formManual.codigo_servico || undefined,
        codigo_tributario_municipio: formManual.codigo_tributario_municipio || undefined,
      });
      navigate("/sucesso", { state: { nota: response.data } });
    } catch (error: any) {
      setErro(error.response?.data?.detail || "Erro ao emitir nota.");
    } finally {
      setCarregando(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f7f6f2" }}>
      <div style={{ backgroundColor: "#ffffff", borderBottom: "1px solid rgba(15,17,23,0.08)", padding: "16px 32px", display: "flex", alignItems: "center", gap: "16px" }}>
        <a href="/" style={{ color: "#1a6b4a", textDecoration: "none", fontSize: "15px" }}>← Voltar</a>
        <h1 style={{ fontFamily: "Georgia, serif", fontSize: "20px", color: "#0f1117" }}>Emitir NF</h1>
      </div>

      <div style={{ maxWidth: "640px", margin: "0 auto", padding: "40px 32px" }}>
        <p style={{ color: "#7c7f8e", marginBottom: "24px" }}>Digite os dados do paciente ou faça upload de uma imagem do prontuário.</p>

        {/* Seletor de modo */}
        <div style={{ display: "flex", backgroundColor: "#ffffff", borderRadius: "12px", padding: "4px", marginBottom: "24px", border: "1px solid rgba(15,17,23,0.08)" }}>
          <button onClick={() => setModo("texto")} style={{ flex: 1, padding: "12px", borderRadius: "10px", border: "none", backgroundColor: modo === "texto" ? "#1a6b4a" : "transparent", color: modo === "texto" ? "#ffffff" : "#7c7f8e", fontSize: "14px", fontWeight: 500, cursor: "pointer" }}>
            ✏️ Digitar
          </button>
          <button onClick={() => setModo("imagem")} style={{ flex: 1, padding: "12px", borderRadius: "10px", border: "none", backgroundColor: modo === "imagem" ? "#1a6b4a" : "transparent", color: modo === "imagem" ? "#ffffff" : "#7c7f8e", fontSize: "14px", fontWeight: 500, cursor: "pointer" }}>
            🖼️ Imagem
          </button>
        </div>

        {erro && <div style={{ backgroundColor: "#fef2f2", borderRadius: "10px", padding: "12px 16px", color: "#dc2626", fontSize: "14px", marginBottom: "16px" }}>{erro}</div>}

        {modo === "texto" && (
          <div>
            <div style={{ marginBottom: "16px" }}>
              <label style={{ display: "block", fontSize: "13px", fontWeight: 500, color: "#3d3f4a", marginBottom: "8px" }}>Nome do paciente *</label>
              <input value={formManual.paciente_nome} onChange={e => setFormManual({ ...formManual, paciente_nome: e.target.value })} placeholder="Nome completo" style={{ width: "100%", padding: "14px 16px", borderRadius: "12px", border: "1.5px solid rgba(15,17,23,0.10)", fontSize: "15px", backgroundColor: "#f7f6f2", outline: "none", boxSizing: "border-box" }} />
            </div>
            <div style={{ marginBottom: "16px" }}>
              <label style={{ display: "block", fontSize: "13px", fontWeight: 500, color: "#3d3f4a", marginBottom: "8px" }}>CPF do paciente *</label>
              <input value={formManual.paciente_cpf} onChange={e => setFormManual({ ...formManual, paciente_cpf: e.target.value })} placeholder="000.000.000-00" style={{ width: "100%", padding: "14px 16px", borderRadius: "12px", border: "1.5px solid rgba(15,17,23,0.10)", fontSize: "15px", backgroundColor: "#f7f6f2", outline: "none", boxSizing: "border-box" }} />
            </div>
            <div style={{ marginBottom: "16px" }}>
              <label style={{ display: "block", fontSize: "13px", fontWeight: 500, color: "#3d3f4a", marginBottom: "8px" }}>Valor (R$) *</label>
              <input value={formManual.valor} onChange={e => setFormManual({ ...formManual, valor: e.target.value })} placeholder="0,00" style={{ width: "100%", padding: "14px 16px", borderRadius: "12px", border: "1.5px solid rgba(15,17,23,0.10)", fontSize: "15px", backgroundColor: "#f7f6f2", outline: "none", boxSizing: "border-box" }} />
            </div>
            <div style={{ marginBottom: "16px" }}>
              <label style={{ display: "block", fontSize: "13px", fontWeight: 500, color: "#3d3f4a", marginBottom: "8px" }}>Descrição do serviço</label>
              <input value={formManual.descricao_servico} onChange={e => setFormManual({ ...formManual, descricao_servico: e.target.value })} placeholder="Ex: Consulta médica" style={{ width: "100%", padding: "14px 16px", borderRadius: "12px", border: "1.5px solid rgba(15,17,23,0.10)", fontSize: "15px", backgroundColor: "#f7f6f2", outline: "none", boxSizing: "border-box" }} />
            </div>
            <div style={{ marginBottom: "24px", backgroundColor: "#f7f6f2", borderRadius: "12px", padding: "16px" }}>
              <p style={{ fontSize: "13px", fontWeight: 600, color: "#7c7f8e", margin: "0 0 12px 0" }}>DADOS FISCAIS (do seu perfil)</p>
              <p style={{ fontSize: "13px", color: "#3d3f4a", margin: "0 0 4px 0" }}>Código do serviço: <strong>{formManual.codigo_servico || "⚠ Não configurado"}</strong></p>
              <p style={{ fontSize: "13px", color: "#3d3f4a", margin: "0 0 4px 0" }}>Alíquota ISS: <strong>{formManual.aliquota_iss ? `${formManual.aliquota_iss}%` : "⚠ Não configurada"}</strong></p>
              <p style={{ fontSize: "13px", color: "#3d3f4a", margin: 0 }}>Município: <strong>{formManual.codigo_ibge_municipio || "⚠ Não configurado"}</strong></p>
              {(!formManual.codigo_servico || !formManual.aliquota_iss) && (
                <a href="/perfil" style={{ display: "inline-block", marginTop: "8px", fontSize: "12px", color: "#1a6b4a", fontWeight: 600 }}>→ Configurar no perfil</a>
              )}
            </div>
            <button onClick={emitirManual} disabled={carregando} style={{ width: "100%", padding: "16px", backgroundColor: "#1a6b4a", color: "#ffffff", border: "none", borderRadius: "100px", fontSize: "16px", fontWeight: 600, cursor: carregando ? "not-allowed" : "pointer", opacity: carregando ? 0.7 : 1 }}>
              {carregando ? "Emitindo..." : "Emitir nota fiscal"}
            </button>
          </div>
        )}

        {modo === "imagem" && (
          <div>
            <div
              onClick={() => document.getElementById("fileInput")?.click()}
              style={{ border: "2px dashed rgba(15,17,23,0.15)", borderRadius: "16px", padding: "48px", textAlign: "center", cursor: "pointer", backgroundColor: imagem ? "#e8f4ef" : "#ffffff", marginBottom: "16px" }}
            >
              {imagem ? (
                <div>
                  <p style={{ fontSize: "32px", marginBottom: "8px" }}>✅</p>
                  <p style={{ fontWeight: 500, color: "#1a6b4a" }}>{imagem.name}</p>
                </div>
              ) : (
                <div>
                  <p style={{ fontSize: "32px", marginBottom: "8px" }}>🖼️</p>
                  <p style={{ fontWeight: 500, color: "#0f1117", marginBottom: "4px" }}>Clique para selecionar imagem</p>
                  <p style={{ fontSize: "13px", color: "#7c7f8e" }}>PNG, JPG ou JPEG</p>
                </div>
              )}
            </div>
            <input id="fileInput" type="file" accept="image/*" style={{ display: "none" }} onChange={e => setImagem(e.target.files?.[0] || null)} />
            <button onClick={extrairDeImagem} disabled={carregando || !imagem} style={{ width: "100%", padding: "16px", backgroundColor: "#1a6b4a", color: "#ffffff", border: "none", borderRadius: "100px", fontSize: "16px", fontWeight: 600, cursor: carregando ? "not-allowed" : "pointer", opacity: (carregando || !imagem) ? 0.7 : 1 }}>
              {carregando ? "Extraindo com IA..." : "Extrair dados com IA"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
