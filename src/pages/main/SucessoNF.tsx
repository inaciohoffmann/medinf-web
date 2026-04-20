import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import api from "../../services/api";

export default function SucessoNF() {
  const location = useLocation();
  const navigate = useNavigate();
  const nota = location.state?.nota || {};
  const [notaAtual, setNotaAtual] = useState(nota);

  useEffect(() => {
    if (notaAtual.status === "emitida" || notaAtual.status === "erro") return;
    const interval = setInterval(async () => {
      try {
        const response = await api.get(`/api/v1/notas/${notaAtual.id}`);
        setNotaAtual(response.data);
        if (response.data.status === "emitida" || response.data.status === "erro") {
          clearInterval(interval);
        }
      } catch (e) {}
    }, 10000);
    return () => clearInterval(interval);
  }, [notaAtual.status]);

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f7f6f2", display: "flex", alignItems: "center", justifyContent: "center", padding: "32px" }}>
      <div style={{ maxWidth: "480px", width: "100%", textAlign: "center" }}>
        <div style={{ width: "80px", height: "80px", borderRadius: "40px", backgroundColor: "#e8f4ef", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px", fontSize: "36px" }}>
          ✓
        </div>

        <h1 style={{ fontFamily: "Georgia, serif", fontSize: "28px", color: "#0f1117", marginBottom: "8px" }}>
          {notaAtual.status === "emitida" ? "NF emitida!" : "NF em processamento"}
        </h1>
        <p style={{ color: "#7c7f8e", marginBottom: "40px" }}>
          {notaAtual.status === "emitida" ? "Sua nota fiscal foi emitida com sucesso." : "Sua nota está sendo processada pela prefeitura."}
        </p>

        <div style={{ backgroundColor: "#ffffff", borderRadius: "16px", padding: "24px", border: "1px solid rgba(15,17,23,0.08)", marginBottom: "24px", textAlign: "left" }}>
          {[
            { label: "Paciente", value: notaAtual.paciente_nome },
            { label: "Valor", value: `R$ ${Number(notaAtual.valor || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}` },
            { label: "Número NF", value: notaAtual.numero_nf || "Aguardando..." },
            { label: "Status", value: notaAtual.status === "emitida" ? "✓ Emitida" : "⏳ Processando" },
          ].map((item, i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", paddingBottom: i < 3 ? "12px" : 0, marginBottom: i < 3 ? "12px" : 0, borderBottom: i < 3 ? "1px solid rgba(15,17,23,0.06)" : "none" }}>
              <span style={{ color: "#7c7f8e", fontSize: "14px" }}>{item.label}</span>
              <span style={{ color: "#0f1117", fontSize: "14px", fontWeight: 500 }}>{item.value}</span>
            </div>
          ))}
        </div>

        {notaAtual.status === "emitida" && (
          <div style={{ marginBottom: "12px" }}>
            {notaAtual.url_pdf && (
              <a
                href={notaAtual.url_pdf}
                target="_blank"
                rel="noreferrer"
                style={{ display: "block", padding: "16px", backgroundColor: "#1a6b4a", color: "#ffffff", borderRadius: "100px", fontSize: "16px", fontWeight: 600, textDecoration: "none", marginBottom: "8px", textAlign: "center" }}
              >
                📄 Baixar PDF da nota
              </a>
            )}
            {notaAtual.url_xml && (
              <a
                href={`https://medinf-backend-production.up.railway.app${notaAtual.url_xml}`}
                target="_blank"
                rel="noreferrer"
                style={{ display: "block", padding: "16px", backgroundColor: "#0f1117", color: "#ffffff", borderRadius: "100px", fontSize: "16px", fontWeight: 600, textDecoration: "none", marginBottom: "8px", textAlign: "center" }}
              >
                📎 Baixar XML
              </a>
            )}
            {notaAtual.url_nota && (
              <a
                href={notaAtual.url_nota}
                target="_blank"
                rel="noreferrer"
                style={{ display: "block", padding: "16px", backgroundColor: "#ffffff", color: "#1a6b4a", border: "1.5px solid #1a6b4a", borderRadius: "100px", fontSize: "16px", fontWeight: 600, textDecoration: "none", marginBottom: "8px", textAlign: "center" }}
              >
                🔗 Ver nota na prefeitura
              </a>
            )}
          </div>
        )}
        {notaAtual.status === "erro" && (
          <div style={{ backgroundColor: "#fef2f2", borderRadius: "12px", padding: "16px", marginBottom: "12px", textAlign: "left" }}>
            <p style={{ color: "#dc2626", fontSize: "14px", fontWeight: 600, margin: "0 0 4px 0" }}>Erro na emissão</p>
            <p style={{ color: "#dc2626", fontSize: "13px", margin: 0 }}>{notaAtual.erro_mensagem}</p>
          </div>
        )}

        <button
          onClick={() => navigate("/")}
          style={{ display: "block", width: "100%", padding: "16px", backgroundColor: "#ffffff", color: "#0f1117", border: "1.5px solid rgba(15,17,23,0.10)", borderRadius: "100px", fontSize: "16px", fontWeight: 500, cursor: "pointer", textDecoration: "none", boxSizing: "border-box" }}
        >
          Voltar para Home
        </button>
      </div>
    </div>
  );
}
