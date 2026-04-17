import React, { useEffect, useState } from "react";
import api from "../../services/api";
import { ENDPOINTS } from "../../constants/api";
import { useAuth } from "../../hooks/useAuth";

export default function Perfil() {
  const { medico, fazerLogout, recarregarPerfil } = useAuth();
  const [certificado, setCertificado] = useState<any>(null);
  const [carregando, setCarregando] = useState(true);
  const [modalCertAberto, setModalCertAberto] = useState(false);
  const [modalPerfilAberto, setModalPerfilAberto] = useState(false);
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [senha, setSenha] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [mensagem, setMensagem] = useState<{ tipo: "sucesso" | "erro"; texto: string } | null>(null);
  const [mensagemPerfil, setMensagemPerfil] = useState<{ tipo: "sucesso" | "erro"; texto: string } | null>(null);

  const [formPerfil, setFormPerfil] = useState({
    nome: "",
    crm: "",
    documento: "",
    tipo_documento: "cpf",
    inscricao_municipal: "",
    aliquota_iss: "",
    codigo_tributario_municipio: "",
    codigo_servico: "",
  });

  useEffect(() => {
    api.get(ENDPOINTS.CERTIFICADO_STATUS)
      .then(r => setCertificado(r.data))
      .catch(console.error)
      .finally(() => setCarregando(false));
  }, []);

  useEffect(() => {
    if (medico) {
      setFormPerfil({
        nome: medico.nome || "",
        crm: medico.crm || "",
        documento: medico.documento || "",
        tipo_documento: medico.tipo_documento || "cpf",
        inscricao_municipal: medico.inscricao_municipal || "",
        aliquota_iss: medico.aliquota_iss || "",
        codigo_tributario_municipio: medico.codigo_tributario_municipio || "",
        codigo_servico: medico.codigo_servico || "",
      });
    }
  }, [medico]);

  const corCertificado = () => {
    if (!certificado?.possui_certificado) return "#7c7f8e";
    if (certificado.vencido) return "#dc2626";
    if (certificado.vencendo_em_breve) return "#d97706";
    return "#1a6b4a";
  };

  const iconeCertificado = () => {
    if (!certificado?.possui_certificado) return "⊘";
    if (certificado.vencido) return "!";
    if (certificado.vencendo_em_breve) return "⚠";
    return "✓";
  };

  const textoCertificado = () => {
    if (!certificado?.possui_certificado) return "Nenhum certificado";
    if (certificado.vencido) return "Vencido";
    if (certificado.vencendo_em_breve) return `Vence em ${certificado.dias_restantes} dias`;
    return `Válido por ${certificado.dias_restantes} dias`;
  };

  const enviarCertificado = async () => {
    if (!arquivo || !senha) {
      setMensagem({ tipo: "erro", texto: "Selecione um arquivo e insira a senha" });
      return;
    }
    setEnviando(true);
    const formData = new FormData();
    formData.append("arquivo", arquivo);
    formData.append("senha", senha);
    try {
      await api.post(ENDPOINTS.CERTIFICADO_UPLOAD, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setMensagem({ tipo: "sucesso", texto: "Certificado enviado com sucesso!" });
      setTimeout(() => {
        setModalCertAberto(false);
        setArquivo(null);
        setSenha("");
        setMensagem(null);
        api.get(ENDPOINTS.CERTIFICADO_STATUS).then(r => setCertificado(r.data)).catch(console.error);
      }, 1500);
    } catch (error: any) {
      let msg = "Erro ao enviar certificado";
      if (error.response?.data?.detail) msg = error.response.data.detail;
      setMensagem({ tipo: "erro", texto: msg });
    } finally {
      setEnviando(false);
    }
  };

  const salvarPerfil = async () => {
    setSalvando(true);
    setMensagemPerfil(null);
    try {
      await api.patch(ENDPOINTS.PERFIL, formPerfil);
      setMensagemPerfil({ tipo: "sucesso", texto: "Perfil atualizado com sucesso!" });
      if (recarregarPerfil) await recarregarPerfil();
      setTimeout(() => {
        setModalPerfilAberto(false);
        setMensagemPerfil(null);
      }, 1500);
    } catch (error: any) {
      let msg = "Erro ao salvar perfil";
      if (error.response?.data?.detail) msg = error.response.data.detail;
      setMensagemPerfil({ tipo: "erro", texto: msg });
    } finally {
      setSalvando(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "10px 12px",
    borderRadius: "8px",
    border: "1.5px solid rgba(15, 17, 23, 0.1)",
    fontSize: "14px",
    boxSizing: "border-box",
    fontFamily: "system-ui",
    outline: "none",
  };

  const labelStyle: React.CSSProperties = {
    display: "block",
    fontSize: "13px",
    fontWeight: 600,
    color: "#7c7f8e",
    marginBottom: "6px",
    textTransform: "uppercase",
    letterSpacing: "0.3px",
  };

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f5f5f7" }}>
      {/* Header */}
      <div style={{
        backgroundColor: "#ffffff",
        boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
        padding: "16px 32px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        position: "sticky",
        top: 0,
        zIndex: 100
      }}>
        <a href="/" style={{ color: "#1a6b4a", textDecoration: "none", fontSize: "14px", fontWeight: 500 }}>← Voltar</a>
        <h1 style={{ fontFamily: "Georgia, serif", fontSize: "24px", color: "#000", fontWeight: 600, margin: 0 }}>
          Per<span style={{ color: "#1a6b4a" }}>fil</span>
        </h1>
        <div style={{ width: "40px" }} />
      </div>

      <div style={{ maxWidth: "680px", margin: "0 auto", padding: "32px 24px 64px" }}>

        {/* Dados Pessoais */}
        <div style={{ marginBottom: "32px" }}>
          <p style={{ fontSize: "12px", fontWeight: 600, color: "#7c7f8e", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "12px" }}>
            Informações
          </p>
          <div style={{ backgroundColor: "#ffffff", borderRadius: "12px", padding: "24px", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: "16px", marginBottom: "20px" }}>
              <div style={{ width: "56px", height: "56px", borderRadius: "28px", backgroundColor: "#e8f4ef", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "28px", flexShrink: 0 }}>
                👨‍⚕️
              </div>
              <div style={{ flex: 1 }}>
                <h2 style={{ fontSize: "18px", fontWeight: 700, color: "#0f1117", margin: "0 0 4px 0" }}>{medico?.nome}</h2>
                <p style={{ fontSize: "14px", color: "#7c7f8e", margin: "0 0 2px 0" }}>{medico?.email}</p>
                {medico?.crm && <p style={{ fontSize: "13px", color: "#7c7f8e", margin: 0 }}>CRM {medico.crm}</p>}
                {medico?.documento && (
                  <p style={{ fontSize: "13px", color: "#7c7f8e", margin: "2px 0 0 0" }}>
                    {medico.tipo_documento?.toUpperCase()} {medico.documento}
                  </p>
                )}
              </div>
            </div>
            <button
              onClick={() => setModalPerfilAberto(true)}
              style={{ width: "100%", padding: "10px", backgroundColor: "#f5f5f7", border: "1.5px solid rgba(15,17,23,0.1)", borderRadius: "10px", fontSize: "14px", fontWeight: 600, color: "#0f1117", cursor: "pointer" }}
            >
              ✏️ Editar dados
            </button>
          </div>
        </div>

        {/* Dados Fiscais */}
        <div style={{ marginBottom: "32px" }}>
          <p style={{ fontSize: "12px", fontWeight: 600, color: "#7c7f8e", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "12px" }}>
            Dados Fiscais
          </p>
          <div style={{ backgroundColor: "#ffffff", borderRadius: "12px", padding: "24px", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
            {[
              { label: "Inscrição Municipal", value: medico?.inscricao_municipal },
              { label: "Alíquota ISS (%)", value: medico?.aliquota_iss },
              { label: "Código Tributário Municipal", value: medico?.codigo_tributario_municipio },
              { label: "Código do Serviço", value: medico?.codigo_servico },
            ].map((item, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingVertical: "10px", borderBottom: i < 3 ? "1px solid rgba(15,17,23,0.06)" : "none", padding: "10px 0" }}>
                <span style={{ fontSize: "14px", color: "#7c7f8e" }}>{item.label}</span>
                <span style={{ fontSize: "14px", fontWeight: 500, color: item.value ? "#0f1117" : "#d97706" }}>
                  {item.value || "⚠ Não informado"}
                </span>
              </div>
            ))}
            <button
              onClick={() => setModalPerfilAberto(true)}
              style={{ width: "100%", padding: "10px", backgroundColor: "#e8f4ef", border: "none", borderRadius: "10px", fontSize: "14px", fontWeight: 600, color: "#1a6b4a", cursor: "pointer", marginTop: "16px" }}
            >
              ✏️ Editar dados fiscais
            </button>
          </div>
        </div>

        {/* Municípios */}
        {medico?.municipios && medico.municipios.length > 0 && (
          <div style={{ marginBottom: "32px" }}>
            <p style={{ fontSize: "12px", fontWeight: 600, color: "#7c7f8e", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "12px" }}>
              Municípios
            </p>
            <div style={{ backgroundColor: "#ffffff", borderRadius: "12px", padding: "20px", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                {medico.municipios.map((m: any) => (
                  <div key={m.id} style={{
                    display: "flex", alignItems: "center", gap: "6px",
                    backgroundColor: m.principal ? "#e8f4ef" : "rgba(0,0,0,0.02)",
                    borderRadius: "20px", padding: "6px 12px",
                    fontSize: "13px", color: m.principal ? "#1a6b4a" : "#0f1117",
                    fontWeight: m.principal ? 500 : 400
                  }}>
                    <span>{m.nome_municipio} - {m.uf}</span>
                    {m.principal && <span style={{ fontSize: "11px" }}>★</span>}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Certificado Digital */}
        <div style={{ marginBottom: "32px" }}>
          <p style={{ fontSize: "12px", fontWeight: 600, color: "#7c7f8e", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "12px" }}>
            Certificado Digital
          </p>
          <div style={{ backgroundColor: "#ffffff", borderRadius: "12px", padding: "24px", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
            {carregando ? <p style={{ color: "#7c7f8e", fontSize: "14px", margin: 0 }}>Carregando...</p> : (
              <>
                <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "20px", padding: "12px 16px", backgroundColor: corCertificado() === "#1a6b4a" ? "#e8f4ef" : corCertificado() === "#d97706" ? "rgba(217,119,6,0.06)" : corCertificado() === "#dc2626" ? "rgba(220,38,38,0.06)" : "rgba(0,0,0,0.02)", borderRadius: "10px", borderLeft: `3px solid ${corCertificado()}` }}>
                  <div style={{ width: "32px", height: "32px", borderRadius: "50%", backgroundColor: corCertificado(), display: "flex", alignItems: "center", justifyContent: "center", color: "#ffffff", fontSize: "16px", fontWeight: 600 }}>
                    {iconeCertificado()}
                  </div>
                  <p style={{ fontSize: "13px", fontWeight: 600, color: corCertificado(), margin: 0 }}>{textoCertificado()}</p>
                </div>
                {certificado?.possui_certificado && (
                  <div style={{ marginBottom: "20px" }}>
                    <div style={{ height: "4px", backgroundColor: "rgba(0,0,0,0.06)", borderRadius: "2px", overflow: "hidden", marginBottom: "8px" }}>
                      <div style={{ height: "100%", backgroundColor: corCertificado(), width: `${Math.min(100, Math.max(0, (certificado.dias_restantes / 365) * 100))}%`, borderRadius: "2px" }} />
                    </div>
                    <p style={{ fontSize: "12px", color: "#7c7f8e", margin: 0 }}>
                      Válido até {new Date(certificado.valido_ate).toLocaleDateString("pt-BR")}
                    </p>
                  </div>
                )}
                <button
                  onClick={() => setModalCertAberto(true)}
                  style={{ width: "100%", padding: "12px 16px", backgroundColor: "#1a6b4a", color: "#ffffff", border: "none", borderRadius: "10px", fontSize: "14px", fontWeight: 600, cursor: "pointer" }}
                >
                  {certificado?.possui_certificado ? "📁 Atualizar certificado" : "➕ Cadastrar certificado"}
                </button>
              </>
            )}
          </div>
        </div>

        {/* Sair */}
        <button
          onClick={fazerLogout}
          style={{ width: "100%", padding: "14px 16px", backgroundColor: "rgba(220,38,38,0.06)", color: "#dc2626", border: "none", borderRadius: "10px", fontSize: "14px", fontWeight: 600, cursor: "pointer" }}
        >
          🚪 Sair da conta
        </button>
      </div>

      {/* Modal Certificado */}
      {modalCertAberto && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(15,17,23,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "16px" }} onClick={() => { setModalCertAberto(false); setArquivo(null); setSenha(""); setMensagem(null); }}>
          <div onClick={(e) => e.stopPropagation()} style={{ backgroundColor: "#ffffff", borderRadius: "16px", padding: "32px", maxWidth: "440px", width: "100%", boxShadow: "0 8px 32px rgba(0,0,0,0.12)" }}>
            <h2 style={{ fontSize: "18px", fontWeight: 700, color: "#0f1117", margin: "0 0 24px 0" }}>📁 Certificado Digital</h2>
            {mensagem && (
              <div style={{ padding: "12px 16px", borderRadius: "10px", marginBottom: "20px", backgroundColor: mensagem.tipo === "sucesso" ? "#dcfce7" : "#fee2e2", color: mensagem.tipo === "sucesso" ? "#134e4a" : "#991b1b", fontSize: "13px", fontWeight: 500 }}>
                {mensagem.texto}
              </div>
            )}
            <div style={{ marginBottom: "16px" }}>
              <label style={labelStyle}>Arquivo .pfx</label>
              <input type="file" accept=".pfx" onChange={(e) => setArquivo(e.target.files?.[0] || null)} style={inputStyle} />
              {arquivo && <p style={{ fontSize: "12px", color: "#1a6b4a", margin: "6px 0 0 0" }}>✓ {arquivo.name}</p>}
            </div>
            <div style={{ marginBottom: "24px" }}>
              <label style={labelStyle}>Senha do certificado</label>
              <input type="password" value={senha} onChange={(e) => setSenha(e.target.value)} placeholder="••••••••" style={inputStyle} />
            </div>
            <div style={{ display: "flex", gap: "12px" }}>
              <button onClick={() => { setModalCertAberto(false); setArquivo(null); setSenha(""); setMensagem(null); }} style={{ flex: 1, padding: "12px", backgroundColor: "rgba(0,0,0,0.04)", border: "none", borderRadius: "10px", fontSize: "14px", fontWeight: 600, color: "#0f1117", cursor: "pointer" }}>Cancelar</button>
              <button onClick={enviarCertificado} disabled={enviando} style={{ flex: 1, padding: "12px", backgroundColor: "#1a6b4a", color: "#ffffff", border: "none", borderRadius: "10px", fontSize: "14px", fontWeight: 600, cursor: enviando ? "not-allowed" : "pointer", opacity: enviando ? 0.6 : 1 }}>
                {enviando ? "⏳ Enviando..." : "✓ Enviar"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Editar Perfil */}
      {modalPerfilAberto && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(15,17,23,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "16px", overflowY: "auto" }} onClick={() => { setModalPerfilAberto(false); setMensagemPerfil(null); }}>
          <div onClick={(e) => e.stopPropagation()} style={{ backgroundColor: "#ffffff", borderRadius: "16px", padding: "32px", maxWidth: "520px", width: "100%", boxShadow: "0 8px 32px rgba(0,0,0,0.12)", maxHeight: "90vh", overflowY: "auto" }}>
            <h2 style={{ fontSize: "18px", fontWeight: 700, color: "#0f1117", margin: "0 0 8px 0" }}>✏️ Editar Perfil</h2>
            <p style={{ fontSize: "13px", color: "#7c7f8e", margin: "0 0 24px 0" }}>Atualize seus dados pessoais e fiscais</p>

            {mensagemPerfil && (
              <div style={{ padding: "12px 16px", borderRadius: "10px", marginBottom: "20px", backgroundColor: mensagemPerfil.tipo === "sucesso" ? "#dcfce7" : "#fee2e2", color: mensagemPerfil.tipo === "sucesso" ? "#134e4a" : "#991b1b", fontSize: "13px", fontWeight: 500 }}>
                {mensagemPerfil.texto}
              </div>
            )}

            {/* Dados Pessoais */}
            <p style={{ fontSize: "11px", fontWeight: 700, color: "#7c7f8e", textTransform: "uppercase", letterSpacing: "0.5px", margin: "0 0 12px 0" }}>Dados Pessoais</p>

            <div style={{ marginBottom: "16px" }}>
              <label style={labelStyle}>Nome</label>
              <input value={formPerfil.nome} onChange={(e) => setFormPerfil({ ...formPerfil, nome: e.target.value })} style={inputStyle} />
            </div>

            <div style={{ marginBottom: "16px" }}>
              <label style={labelStyle}>CRM</label>
              <input value={formPerfil.crm} onChange={(e) => setFormPerfil({ ...formPerfil, crm: e.target.value })} placeholder="Ex: 12345/CE" style={inputStyle} />
            </div>

            <div style={{ marginBottom: "16px" }}>
              <label style={labelStyle}>Tipo de documento</label>
              <select value={formPerfil.tipo_documento} onChange={(e) => setFormPerfil({ ...formPerfil, tipo_documento: e.target.value })} style={{ ...inputStyle, backgroundColor: "#fff" }}>
                <option value="cpf">CPF</option>
                <option value="cnpj">CNPJ</option>
              </select>
            </div>

            <div style={{ marginBottom: "24px" }}>
              <label style={labelStyle}>{formPerfil.tipo_documento === "cnpj" ? "CNPJ" : "CPF"}</label>
              <input value={formPerfil.documento} onChange={(e) => setFormPerfil({ ...formPerfil, documento: e.target.value })} placeholder={formPerfil.tipo_documento === "cnpj" ? "00.000.000/0000-00" : "000.000.000-00"} style={inputStyle} />
            </div>

            {/* Dados Fiscais */}
            <p style={{ fontSize: "11px", fontWeight: 700, color: "#7c7f8e", textTransform: "uppercase", letterSpacing: "0.5px", margin: "0 0 12px 0" }}>Dados Fiscais</p>

            <div style={{ marginBottom: "16px" }}>
              <label style={labelStyle}>Inscrição Municipal</label>
              <input value={formPerfil.inscricao_municipal} onChange={(e) => setFormPerfil({ ...formPerfil, inscricao_municipal: e.target.value })} placeholder="Ex: 1234567" style={inputStyle} />
            </div>

            <div style={{ marginBottom: "16px" }}>
              <label style={labelStyle}>Alíquota ISS (%)</label>
              <input value={formPerfil.aliquota_iss} onChange={(e) => setFormPerfil({ ...formPerfil, aliquota_iss: e.target.value })} placeholder="Ex: 2.01" style={inputStyle} />
              <p style={{ fontSize: "11px", color: "#7c7f8e", margin: "4px 0 0 0" }}>Consulte seu contador ou verifique uma nota antiga</p>
            </div>

            <div style={{ marginBottom: "16px" }}>
              <label style={labelStyle}>Código Tributário Municipal</label>
              <input value={formPerfil.codigo_tributario_municipio} onChange={(e) => setFormPerfil({ ...formPerfil, codigo_tributario_municipio: e.target.value })} placeholder="Ex: 731900200" style={inputStyle} />
              <p style={{ fontSize: "11px", color: "#7c7f8e", margin: "4px 0 0 0" }}>Verifique em uma nota já emitida pela sua empresa</p>
            </div>

            <div style={{ marginBottom: "24px" }}>
              <label style={labelStyle}>Código do Serviço (Item Lista)</label>
              <input value={formPerfil.codigo_servico} onChange={(e) => setFormPerfil({ ...formPerfil, codigo_servico: e.target.value })} placeholder="Ex: 0401 (consultas médicas)" style={inputStyle} />
              <p style={{ fontSize: "11px", color: "#7c7f8e", margin: "4px 0 0 0" }}>Código da lista de serviços da Lei Complementar 116/2003</p>
            </div>

            <div style={{ display: "flex", gap: "12px" }}>
              <button onClick={() => { setModalPerfilAberto(false); setMensagemPerfil(null); }} style={{ flex: 1, padding: "12px", backgroundColor: "rgba(0,0,0,0.04)", border: "none", borderRadius: "10px", fontSize: "14px", fontWeight: 600, color: "#0f1117", cursor: "pointer" }}>Cancelar</button>
              <button onClick={salvarPerfil} disabled={salvando} style={{ flex: 1, padding: "12px", backgroundColor: "#1a6b4a", color: "#ffffff", border: "none", borderRadius: "10px", fontSize: "14px", fontWeight: 600, cursor: salvando ? "not-allowed" : "pointer", opacity: salvando ? 0.6 : 1 }}>
                {salvando ? "⏳ Salvando..." : "✓ Salvar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
