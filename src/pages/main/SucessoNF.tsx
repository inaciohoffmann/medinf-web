import React from "react";
import { useLocation } from "react-router-dom";

export default function SucessoNF() {
  const location = useLocation();
  const nota = location.state?.nota || {};

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f7f6f2", display: "flex", alignItems: "center", justifyContent: "center", padding: "32px" }}>
      <div style={{ maxWidth: "480px", width: "100%", textAlign: "center" }}>
        <div style={{ width: "80px", height: "80px", borderRadius: "40px", backgroundColor: "#e8f4ef", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px", fontSize: "36px" }}>
          ✓
        </div>

        <h1 style={{ fontFamily: "Georgia, serif", fontSize: "28px", color: "#0f1117", marginBottom: "8px" }}>
          {nota.status === "emitida" ? "NF emitida!" : "NF em processamento"}
        </h1>
        <p style={{ color: "#7c7f8e", marginBottom: "40px" }}>
          {nota.status === "emitida" ? "Sua nota fiscal foi emitida com sucesso." : "Sua nota está sendo processada pela prefeitura."}
        </p>

        <div style={{ backgroundColor: "#ffffff", borderRadius: "16px", padding: "24px", border: "1px solid rgba(15,17,23,0.08)", marginBottom: "24px", textAlign: "left" }}>
          {[
            { label: "Paciente", value: nota.paciente_nome },
            { label: "Valor", value: `R$ ${Number(nota.valor || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}` },
            { label: "Número NF", value: nota.numero_nf || "Aguardando..." },
            { label: "Status", value: nota.status === "emitida" ? "✓ Emitida" : "⏳ Processando" },
          ].map((item, i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", paddingBottom: i < 3 ? "12px" : 0, marginBottom: i < 3 ? "12px" : 0, borderBottom: i < 3 ? "1px solid rgba(15,17,23,0.06)" : "none" }}>
              <span style={{ color: "#7c7f8e", fontSize: "14px" }}>{item.label}</span>
              <span style={{ color: "#0f1117", fontSize: "14px", fontWeight: 500 }}>{item.value}</span>
            </div>
          ))}
        </div>

        {nota.url_pdf && (
          <a href={nota.url_pdf} target="_blank" rel="noreferrer" style={{ display: "block", padding: "16px", backgroundColor: "#0f1117", color: "#ffffff", borderRadius: "100px", fontSize: "16px", fontWeight: 600, textDecoration: "none", marginBottom: "12px" }}>
            📄 Baixar nota fiscal
          </a>
        )}

        <a href="/" style={{ display: "block", padding: "16px", backgroundColor: "#ffffff", color: "#0f1117", border: "1.5px solid rgba(15,17,23,0.10)", borderRadius: "100px", fontSize: "16px", fontWeight: 500, textDecoration: "none" }}>
          Voltar para Home
        </a>
      </div>
    </div>
  );
}
