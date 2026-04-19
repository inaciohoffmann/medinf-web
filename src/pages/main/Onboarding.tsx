import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import { ENDPOINTS } from "../../constants/api";

const verde = "#1a6b4a";

const cardStyle: React.CSSProperties = {
  backgroundColor: "#ffffff",
  borderRadius: "24px",
  padding: "48px",
  maxWidth: "520px",
  width: "100%",
  boxShadow: "0 4px 32px rgba(0,0,0,0.08)",
  border: "1px solid rgba(15,17,23,0.06)",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "14px 16px",
  borderRadius: "12px",
  border: "1.5px solid rgba(15,17,23,0.10)",
  fontSize: "15px",
  color: "#0f1117",
  backgroundColor: "#f7f6f2",
  outline: "none",
  boxSizing: "border-box",
};

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: "13px",
  fontWeight: 500,
  color: "#3d3f4a",
  marginBottom: "8px",
};

const btnPrimary: React.CSSProperties = {
  width: "100%",
  padding: "16px",
  backgroundColor: verde,
  color: "#ffffff",
  border: "none",
  borderRadius: "100px",
  fontSize: "16px",
  fontWeight: 600,
  cursor: "pointer",
};

const btnSecondary: React.CSSProperties = {
  width: "100%",
  padding: "14px",
  backgroundColor: "#ffffff",
  color: verde,
  border: `1.5px solid ${verde}`,
  borderRadius: "100px",
  fontSize: "15px",
  fontWeight: 600,
  cursor: "pointer",
};

function ProgressBar({ passo }: { passo: number }) {
  return (
    <div style={{ marginBottom: "40px" }}>
      <p style={{ fontSize: "13px", color: "#7c7f8e", marginBottom: "12px", textAlign: "center" }}>
        Passo {passo} de 3
      </p>
      <div style={{ display: "flex", gap: "8px" }}>
        {[1, 2, 3].map((n) => (
          <div
            key={n}
            style={{
              flex: 1,
              height: "4px",
              borderRadius: "100px",
              backgroundColor: n <= passo ? verde : "rgba(15,17,23,0.10)",
              transition: "background-color 0.3s",
            }}
          />
        ))}
      </div>
    </div>
  );
}

export default function Onboarding() {
  const navigate = useNavigate();

  const [passo, setPasso] = useState(1);
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [senha, setSenha] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState("");
  const [modoFiscal, setModoFiscal] = useState<"nota" | "manual" | null>(null);
  const [arquivoNota, setArquivoNota] = useState<File | null>(null);
  const [dadosFiscais, setDadosFiscais] = useState({
    inscricao_municipal: "",
    aliquota_iss: "",
    codigo_tributario_municipio: "",
    codigo_servico: "",
  });

  // ── Passo 1: enviar certificado ───────────────────────────────────────────
  const enviarCertificado = async () => {
    if (!arquivo) { setErro("Selecione o arquivo .pfx."); return; }
    if (!senha) { setErro("Informe a senha do certificado."); return; }
    setErro(""); setEnviando(true);
    try {
      const form = new FormData();
      form.append("arquivo", arquivo);
      form.append("senha", senha);
      await api.post(ENDPOINTS.CERTIFICADO_UPLOAD, form, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setPasso(2);
    } catch (e: any) {
      setErro(e.response?.data?.detail || "Erro ao enviar certificado.");
    } finally {
      setEnviando(false);
    }
  };

  // ── Passo 2A: extrair nota anterior ──────────────────────────────────────
  const extrairNota = async () => {
    if (!arquivoNota) { setErro("Selecione o arquivo da nota."); return; }
    setErro(""); setEnviando(true);
    try {
      const form = new FormData();
      form.append("arquivo", arquivoNota);
      const { data } = await api.post(ENDPOINTS.EXTRAIR_NOTA_ANTERIOR, form, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      // O endpoint retorna DadosExtradios; tenta mapear campos fiscais úteis
      setDadosFiscais((prev) => ({
        ...prev,
        ...(data.inscricao_municipal ? { inscricao_municipal: data.inscricao_municipal } : {}),
        ...(data.aliquota_iss ? { aliquota_iss: String(data.aliquota_iss) } : {}),
        ...(data.codigo_tributario_municipio ? { codigo_tributario_municipio: data.codigo_tributario_municipio } : {}),
        ...(data.codigo_servico ? { codigo_servico: data.codigo_servico } : {}),
      }));
      setModoFiscal("manual"); // mostra formulário pré-preenchido para revisão
    } catch (e: any) {
      setErro(e.response?.data?.detail || "Não foi possível extrair os dados. Preencha manualmente.");
      setModoFiscal("manual");
    } finally {
      setEnviando(false);
    }
  };

  // ── Passo 2: salvar dados fiscais ────────────────────────────────────────
  const salvarDadosFiscais = async () => {
    setErro(""); setEnviando(true);
    try {
      const payload: Record<string, any> = {};
      if (dadosFiscais.inscricao_municipal) payload.inscricao_municipal = dadosFiscais.inscricao_municipal;
      if (dadosFiscais.aliquota_iss) payload.aliquota_iss = parseFloat(dadosFiscais.aliquota_iss);
      if (dadosFiscais.codigo_tributario_municipio) payload.codigo_tributario_municipio = dadosFiscais.codigo_tributario_municipio;
      if (dadosFiscais.codigo_servico) payload.codigo_servico = dadosFiscais.codigo_servico;
      await api.patch(ENDPOINTS.PERFIL, payload);
      setPasso(3);
    } catch (e: any) {
      setErro(e.response?.data?.detail || "Erro ao salvar dados fiscais.");
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#f7f6f2",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
      }}
    >
      <div style={cardStyle}>
        {/* Logo */}
        <h1
          style={{
            fontFamily: "Georgia, serif",
            fontSize: "24px",
            color: "#0f1117",
            textAlign: "center",
            marginBottom: "32px",
            letterSpacing: "-0.5px",
          }}
        >
          Medi<span style={{ color: verde }}>NF</span>
        </h1>

        <ProgressBar passo={passo} />

        {/* ── PASSO 1 ────────────────────────────────────────────────────── */}
        {passo === 1 && (
          <>
            <h2 style={{ fontSize: "22px", fontWeight: 700, color: "#0f1117", marginBottom: "8px" }}>
              Certificado digital
            </h2>
            <p style={{ fontSize: "15px", color: "#7c7f8e", marginBottom: "28px" }}>
              Envie o arquivo .pfx do seu certificado A1 para emitir notas com segurança.
            </p>

            {erro && (
              <div style={{ backgroundColor: "#fef2f2", borderRadius: "10px", padding: "12px 16px", color: "#dc2626", fontSize: "14px", marginBottom: "16px" }}>
                {erro}
              </div>
            )}

            <div style={{ marginBottom: "16px" }}>
              <label style={labelStyle}>Arquivo .pfx</label>
              <label
                style={{
                  display: "block",
                  padding: "14px 16px",
                  borderRadius: "12px",
                  border: "1.5px dashed rgba(26,107,74,0.4)",
                  backgroundColor: "#f7f6f2",
                  color: arquivo ? "#0f1117" : "#7c7f8e",
                  fontSize: "15px",
                  cursor: "pointer",
                  textAlign: "center",
                }}
              >
                {arquivo ? arquivo.name : "Clique para selecionar"}
                <input
                  type="file"
                  accept=".pfx"
                  style={{ display: "none" }}
                  onChange={(e) => setArquivo(e.target.files?.[0] || null)}
                />
              </label>
            </div>

            <div style={{ marginBottom: "28px" }}>
              <label style={labelStyle}>Senha do certificado</label>
              <input
                type="password"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                placeholder="••••••••"
                style={inputStyle}
              />
            </div>

            <button
              onClick={enviarCertificado}
              disabled={enviando}
              style={{ ...btnPrimary, opacity: enviando ? 0.7 : 1, cursor: enviando ? "not-allowed" : "pointer" }}
            >
              {enviando ? "Enviando..." : "Enviar certificado →"}
            </button>

            <button
              onClick={() => { setErro(""); setPasso(2); }}
              style={{ ...btnSecondary, marginTop: "12px" }}
            >
              Pular por agora
            </button>
          </>
        )}

        {/* ── PASSO 2 ────────────────────────────────────────────────────── */}
        {passo === 2 && (
          <>
            <h2 style={{ fontSize: "22px", fontWeight: 700, color: "#0f1117", marginBottom: "8px" }}>
              Dados fiscais
            </h2>
            <p style={{ fontSize: "15px", color: "#7c7f8e", marginBottom: "28px" }}>
              Configure os dados para a emissão das notas.
            </p>

            {erro && (
              <div style={{ backgroundColor: "#fef2f2", borderRadius: "10px", padding: "12px 16px", color: "#dc2626", fontSize: "14px", marginBottom: "16px" }}>
                {erro}
              </div>
            )}

            {/* Seleção de modo */}
            {modoFiscal === null && (
              <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "8px" }}>
                <button
                  onClick={() => setModoFiscal("nota")}
                  style={{
                    padding: "18px 20px",
                    borderRadius: "16px",
                    border: "1.5px solid rgba(26,107,74,0.3)",
                    backgroundColor: "#f0faf5",
                    cursor: "pointer",
                    textAlign: "left",
                  }}
                >
                  <p style={{ fontWeight: 700, color: "#0f1117", marginBottom: "4px" }}>📄 Tenho uma nota anterior</p>
                  <p style={{ fontSize: "13px", color: "#7c7f8e" }}>
                    Envie o XML e preenchemos tudo automaticamente.
                  </p>
                </button>
                <button
                  onClick={() => setModoFiscal("manual")}
                  style={{
                    padding: "18px 20px",
                    borderRadius: "16px",
                    border: "1.5px solid rgba(15,17,23,0.10)",
                    backgroundColor: "#ffffff",
                    cursor: "pointer",
                    textAlign: "left",
                  }}
                >
                  <p style={{ fontWeight: 700, color: "#0f1117", marginBottom: "4px" }}>✏️ Ainda não tenho nota</p>
                  <p style={{ fontSize: "13px", color: "#7c7f8e" }}>Preencho os dados manualmente.</p>
                </button>
              </div>
            )}

            {/* Modo: upload de nota anterior */}
            {modoFiscal === "nota" && !dadosFiscais.inscricao_municipal && (
              <>
                <div
                  style={{
                    backgroundColor: "#fffbea",
                    borderRadius: "10px",
                    padding: "12px 16px",
                    fontSize: "13px",
                    color: "#92400e",
                    marginBottom: "20px",
                  }}
                >
                  💡 Peça o XML ao seu contador ou baixe no portal da prefeitura.
                </div>

                <div style={{ marginBottom: "20px" }}>
                  <label style={labelStyle}>Arquivo XML ou imagem da nota</label>
                  <label
                    style={{
                      display: "block",
                      padding: "14px 16px",
                      borderRadius: "12px",
                      border: "1.5px dashed rgba(26,107,74,0.4)",
                      backgroundColor: "#f7f6f2",
                      color: arquivoNota ? "#0f1117" : "#7c7f8e",
                      fontSize: "15px",
                      cursor: "pointer",
                      textAlign: "center",
                    }}
                  >
                    {arquivoNota ? arquivoNota.name : "Clique para selecionar"}
                    <input
                      type="file"
                      accept=".xml,image/*"
                      style={{ display: "none" }}
                      onChange={(e) => setArquivoNota(e.target.files?.[0] || null)}
                    />
                  </label>
                </div>

                <button
                  onClick={extrairNota}
                  disabled={enviando}
                  style={{ ...btnPrimary, marginBottom: "12px", opacity: enviando ? 0.7 : 1, cursor: enviando ? "not-allowed" : "pointer" }}
                >
                  {enviando ? "Extraindo dados..." : "Extrair dados da nota →"}
                </button>
                <button onClick={() => setModoFiscal(null)} style={{ ...btnSecondary }}>
                  Voltar
                </button>
              </>
            )}

            {/* Formulário manual (ou pré-preenchido após extração) */}
            {modoFiscal === "manual" && (
              <>
                <div style={{ marginBottom: "16px" }}>
                  <label style={labelStyle}>Inscrição municipal</label>
                  <input
                    value={dadosFiscais.inscricao_municipal}
                    onChange={(e) => setDadosFiscais((p) => ({ ...p, inscricao_municipal: e.target.value }))}
                    placeholder="Ex: 123456"
                    style={inputStyle}
                  />
                </div>
                <div style={{ marginBottom: "16px" }}>
                  <label style={labelStyle}>Alíquota ISS (%)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={dadosFiscais.aliquota_iss}
                    onChange={(e) => setDadosFiscais((p) => ({ ...p, aliquota_iss: e.target.value }))}
                    placeholder="Ex: 2.01"
                    style={inputStyle}
                  />
                </div>
                <div style={{ marginBottom: "16px" }}>
                  <label style={labelStyle}>Código tributário municipal</label>
                  <input
                    value={dadosFiscais.codigo_tributario_municipio}
                    onChange={(e) => setDadosFiscais((p) => ({ ...p, codigo_tributario_municipio: e.target.value }))}
                    placeholder="Ex: 731900200"
                    style={inputStyle}
                  />
                </div>
                <div style={{ marginBottom: "28px" }}>
                  <label style={labelStyle}>Código do serviço (LC116)</label>
                  <input
                    value={dadosFiscais.codigo_servico}
                    onChange={(e) => setDadosFiscais((p) => ({ ...p, codigo_servico: e.target.value }))}
                    placeholder="Ex: 4.01"
                    style={inputStyle}
                  />
                </div>

                <button
                  onClick={salvarDadosFiscais}
                  disabled={enviando}
                  style={{ ...btnPrimary, marginBottom: "12px", opacity: enviando ? 0.7 : 1, cursor: enviando ? "not-allowed" : "pointer" }}
                >
                  {enviando ? "Salvando..." : "Salvar dados fiscais →"}
                </button>
                <button onClick={() => { setModoFiscal(null); setDadosFiscais({ inscricao_municipal: "", aliquota_iss: "", codigo_tributario_municipio: "", codigo_servico: "" }); }} style={{ ...btnSecondary }}>
                  Voltar
                </button>
              </>
            )}

            {modoFiscal === null && (
              <button
                onClick={() => { setErro(""); setPasso(3); }}
                style={{ ...btnSecondary, marginTop: "12px" }}
              >
                Pular por agora
              </button>
            )}
          </>
        )}

        {/* ── PASSO 3 ────────────────────────────────────────────────────── */}
        {passo === 3 && (
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: "64px", marginBottom: "24px" }}>🎉</div>
            <h2 style={{ fontSize: "26px", fontWeight: 700, color: "#0f1117", marginBottom: "12px" }}>
              Tudo pronto!
            </h2>
            <p style={{ fontSize: "15px", color: "#7c7f8e", marginBottom: "40px", lineHeight: 1.6 }}>
              Sua conta está configurada. Agora você pode emitir notas fiscais com facilidade.
            </p>
            <button
              onClick={() => navigate("/")}
              style={btnPrimary}
            >
              Começar a usar →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
