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
            <label style={{ display: "block", fontSize: "13px", fontWeight: 500, color: "#3d3f4a", marginBottom: "8px" }}>Dados do paciente</label>
            <textarea
              value={texto}
              onChange={e => setTexto(e.target.value)}
              placeholder={"Nome: João da Silva\nCPF: 123.456.789-01\nValor: R$ 250,00\nServiço: Consulta médica"}
              rows={6}
              style={{ width: "100%", padding: "16px", borderRadius: "12px", border: "1.5px solid rgba(15,17,23,0.10)", fontSize: "15px", color: "#0f1117", backgroundColor: "#f7f6f2", outline: "none", resize: "vertical", boxSizing: "border-box", marginBottom: "16px" }}
            />
            <button onClick={extrairDeTexto} disabled={carregando} style={{ width: "100%", padding: "16px", backgroundColor: "#1a6b4a", color: "#ffffff", border: "none", borderRadius: "100px", fontSize: "16px", fontWeight: 600, cursor: carregando ? "not-allowed" : "pointer", opacity: carregando ? 0.7 : 1 }}>
              {carregando ? "Extraindo com IA..." : "Extrair dados com IA"}
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
