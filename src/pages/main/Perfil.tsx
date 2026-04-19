import React, { useEffect, useState } from "react";
import api from "../../services/api";
import { ENDPOINTS } from "../../constants/api";
import { useAuth } from "../../hooks/useAuth";

export default function Perfil() {
  const { medico, fazerLogout, recarregarPerfil } = useAuth();
  const [certificado, setCertificado] = useState<any>(null);
  const [carregando, setCarregando] = useState(true);
  const [modalCertAberto, setModalCertAberto] = useState(false);
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [senha, setSenha] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [mensagem, setMensagem] = useState<{ tipo: "sucesso" | "erro"; texto: string } | null>(null);
  const [modalPerfilAberto, setModalPerfilAberto] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [buscandoCnpj, setBuscandoCnpj] = useState(false);
  const [servicosSugeridos, setServicosSugeridos] = useState<any[]>([]);
  const [fotoPerfil, setFotoPerfil] = useState<string | null>(
    localStorage.getItem("foto_perfil")
  );
  const [mensagemPerfil, setMensagemPerfil] = useState<{ tipo: "sucesso" | "erro"; texto: string } | null>(null);
  const [formPerfil, setFormPerfil] = useState({
    nome: "", crm: "", documento: "", tipo_documento: "cpf",
    inscricao_municipal: "", aliquota_iss: "",
    codigo_tributario_municipio: "", codigo_servico: "",
    cep: "",
    optante_simples_nacional: true,
    regime_especial_tributacao: "",
    codigo_opcao_simples_nacional: "",
    regime_tributario_simples_nacional: "",
  });

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
        cep: medico.cep || "",
        optante_simples_nacional: medico.optante_simples_nacional ?? true,
        regime_especial_tributacao: medico.regime_especial_tributacao || "",
        codigo_opcao_simples_nacional: medico.codigo_opcao_simples_nacional || "",
        regime_tributario_simples_nacional: medico.regime_tributario_simples_nacional || "",
      });
    }
  }, [medico]);

  useEffect(() => {
    api.get(ENDPOINTS.CERTIFICADO_STATUS)
      .then(r => setCertificado(r.data))
      .catch(console.error)
      .finally(() => setCarregando(false));
  }, []);

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

  const escolherFoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      localStorage.setItem("foto_perfil", base64);
      setFotoPerfil(base64);
    };
    reader.readAsDataURL(file);
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
        api.get(ENDPOINTS.CERTIFICADO_STATUS)
          .then(r => setCertificado(r.data))
          .catch(console.error);
      }, 1500);
    } catch (error: any) {
      let mensagemErro = "Erro ao enviar certificado";
      if (error.response?.data?.detail) {
        mensagemErro = error.response.data.detail;
      } else if (error.response?.data?.message) {
        mensagemErro = error.response.data.message;
      } else if (error.response?.data?.error) {
        mensagemErro = error.response.data.error;
      } else if (error.response?.data?.errors?.[0]) {
        mensagemErro = error.response.data.errors[0];
      }
      setMensagem({
        tipo: "erro",
        texto: mensagemErro,
      });
    } finally {
      setEnviando(false);
    }
  };

  const buscarDadosCnpj = async () => {
    if (!formPerfil.documento || formPerfil.tipo_documento !== "cnpj") {
      setMensagemPerfil({ tipo: "erro", texto: "Preencha o CNPJ primeiro" });
      return;
    }
    setBuscandoCnpj(true);
    setMensagemPerfil(null);
    try {
      const cnpj = formPerfil.documento.replace(/\D/g, "");
      const response = await api.get(`/api/v1/medico/buscar-cnpj/${cnpj}`);
      const dados = response.data;
      if (dados.servicos && dados.servicos.length > 0) {
        setServicosSugeridos(dados.servicos);
        const principal = dados.servicos.find((s: any) => s.principal) || dados.servicos[0];
        setFormPerfil(prev => ({
          ...prev,
          nome: dados.razao_social || prev.nome,
          codigo_servico: principal.codigo_servico || prev.codigo_servico,
          codigo_tributario_municipio: principal.codigo_tributario_municipio || prev.codigo_tributario_municipio,
          aliquota_iss: String(principal.aliquota_iss) || prev.aliquota_iss,
        }));
      } else {
        setFormPerfil(prev => ({
          ...prev,
          nome: dados.razao_social || prev.nome,
        }));
      }
      setMensagemPerfil({
        tipo: "sucesso",
        texto: `✓ Dados encontrados! CNAE: ${dados.cnae}. ${dados.justificativa || ""}`,
      });
    } catch (error: any) {
      setMensagemPerfil({ tipo: "erro", texto: "CNPJ não encontrado na Receita Federal" });
    } finally {
      setBuscandoCnpj(false);
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

  const fecharModal = () => {
    setModalCertAberto(false);
    setArquivo(null);
    setSenha("");
    setMensagem(null);
  };

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f5f5f7" }}>
      {/* Header */}
      <div style={{
        backgroundColor: "#ffffff",
        boxShadow: "0 1px 3px rgba(0, 0, 0, 0.06)",
        padding: "16px 32px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        position: "sticky",
        top: 0,
        zIndex: 100
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <a href="/" style={{ color: "#1a6b4a", textDecoration: "none", fontSize: "14px", fontWeight: 500 }}>← Voltar</a>
        </div>
        <h1 style={{ fontFamily: "Georgia, serif", fontSize: "24px", color: "#000", fontWeight: 600, margin: 0 }}>
          Per<span style={{ color: "#1a6b4a" }}>fil</span>
        </h1>
        <div style={{ width: "40px" }} />
      </div>

      <div style={{ maxWidth: "680px", margin: "0 auto", padding: "32px 24px 64px" }}>
        
        {/* Section: Dados Principais */}
        <div style={{ marginBottom: "32px" }}>
          <p style={{ fontSize: "12px", fontWeight: 600, color: "#7c7f8e", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "12px" }}>
            Informações
          </p>
          
          <div style={{
            backgroundColor: "#ffffff",
            borderRadius: "12px",
            padding: "24px",
            boxShadow: "0 1px 3px rgba(0, 0, 0, 0.06)"
          }}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: "16px", marginBottom: "24px" }}>
              <div style={{ position: "relative", width: "56px", height: "56px", flexShrink: 0 }}>
                <div style={{ width: "56px", height: "56px", borderRadius: "28px", backgroundColor: "#e8f4ef", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "28px", overflow: "hidden" }}>
                  {fotoPerfil ? (
                    <img src={fotoPerfil} alt="Perfil" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  ) : (
                    "👨‍⚕️"
                  )}
                </div>
                <label style={{ position: "absolute", bottom: 0, right: 0, width: "20px", height: "20px", borderRadius: "50%", backgroundColor: "#1a6b4a", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize: "10px" }}>
                  ✏️
                  <input type="file" accept="image/*" onChange={escolherFoto} style={{ display: "none" }} />
                </label>
              </div>
              <div style={{ flex: 1 }}>
                <h2 style={{ fontSize: "18px", fontWeight: 700, color: "#0f1117", margin: "0 0 4px 0" }}>
                  {medico?.nome}
                </h2>
                <p style={{ fontSize: "14px", color: "#7c7f8e", margin: "0 0 2px 0" }}>
                  {medico?.email}
                </p>
                {medico?.crm && (
                  <p style={{ fontSize: "13px", color: "#7c7f8e", margin: 0 }}>
                    CRM {medico.crm}
                  </p>
                )}
              </div>
            </div>

            <button
              onClick={() => setModalPerfilAberto(true)}
              style={{
                width: "100%",
                padding: "10px 16px",
                backgroundColor: "rgba(26, 107, 74, 0.06)",
                color: "#1a6b4a",
                border: "1.5px solid rgba(26, 107, 74, 0.2)",
                borderRadius: "10px",
                fontSize: "14px",
                fontWeight: 600,
                cursor: "pointer",
                marginBottom: "16px",
                transition: "all 0.2s ease"
              }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "rgba(26, 107, 74, 0.12)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "rgba(26, 107, 74, 0.06)"; }}
            >
              ✏️ Editar dados
            </button>

            {medico?.municipios && medico.municipios.length > 0 && (
              <div style={{ borderTop: "1px solid rgba(15, 17, 23, 0.08)", paddingTop: "16px" }}>
                <p style={{ fontSize: "12px", fontWeight: 600, color: "#7c7f8e", margin: "0 0 12px 0" }}>
                  MUNICÍPIOS CADASTRADOS
                </p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                  {medico.municipios.map((m: any) => (
                    <div key={m.id} style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      backgroundColor: m.principal ? "#e8f4ef" : "rgba(0, 0, 0, 0.02)",
                      borderRadius: "20px",
                      padding: "6px 12px",
                      fontSize: "13px",
                      color: m.principal ? "#1a6b4a" : "#0f1117",
                      fontWeight: m.principal ? 500 : 400
                    }}>
                      <span>{m.nome_municipio}</span>
                      <span style={{ fontSize: "12px", color: m.principal ? "#1a6b4a" : "#7c7f8e" }}>
                        {m.uf}
                      </span>
                      {m.principal && <span style={{ fontSize: "11px", marginLeft: "4px" }}>★</span>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Section: Dados Fiscais */}
        <div style={{ marginBottom: "32px" }}>
          <p style={{ fontSize: "12px", fontWeight: 600, color: "#7c7f8e", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "12px" }}>
            Dados Fiscais
          </p>
          <div style={{ backgroundColor: "#ffffff", borderRadius: "12px", padding: "24px", boxShadow: "0 1px 3px rgba(0, 0, 0, 0.06)" }}>
            {[
              { label: "Inscrição Municipal", value: medico?.inscricao_municipal },
              { label: "Alíquota ISS (%)", value: medico?.aliquota_iss },
              { label: "Código Tributário Municipal", value: medico?.codigo_tributario_municipio },
              { label: "Código do Serviço", value: medico?.codigo_servico },
            ].map(({ label, value }) => (
              <div key={label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: "1px solid rgba(15, 17, 23, 0.06)" }}>
                <span style={{ fontSize: "13px", color: "#7c7f8e", fontWeight: 500 }}>{label}</span>
                <span style={{ fontSize: "13px", color: value ? "#0f1117" : "#d97706", fontWeight: value ? 400 : 500 }}>
                  {value || "⚠ Não informado"}
                </span>
              </div>
            ))}
            <button
              onClick={() => setModalPerfilAberto(true)}
              style={{
                marginTop: "20px",
                width: "100%",
                padding: "12px 16px",
                backgroundColor: "rgba(26, 107, 74, 0.06)",
                color: "#1a6b4a",
                border: "1.5px solid rgba(26, 107, 74, 0.2)",
                borderRadius: "10px",
                fontSize: "14px",
                fontWeight: 600,
                cursor: "pointer",
                transition: "all 0.2s ease"
              }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "rgba(26, 107, 74, 0.12)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "rgba(26, 107, 74, 0.06)"; }}
            >
              ✏️ Editar dados fiscais
            </button>
          </div>
        </div>

        {/* Section: Certificado Digital */}
        <div style={{ marginBottom: "32px" }}>
          <p style={{ fontSize: "12px", fontWeight: 600, color: "#7c7f8e", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "12px" }}>
            Certificado Digital
          </p>

          <div style={{
            backgroundColor: "#ffffff",
            borderRadius: "12px",
            padding: "24px",
            boxShadow: "0 1px 3px rgba(0, 0, 0, 0.06)"
          }}>
            {carregando ? (
              <p style={{ color: "#7c7f8e", fontSize: "14px", margin: 0 }}>Carregando...</p>
            ) : (
              <>
                {/* Status Badge */}
                <div style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  marginBottom: "20px",
                  padding: "12px 16px",
                  backgroundColor: corCertificado() === "#1a6b4a" ? "#e8f4ef" : 
                                   corCertificado() === "#d97706" ? "rgba(217, 119, 6, 0.06)" :
                                   corCertificado() === "#dc2626" ? "rgba(220, 38, 38, 0.06)" : "rgba(0, 0, 0, 0.02)",
                  borderRadius: "10px",
                  borderLeft: `3px solid ${corCertificado()}`
                }}>
                  <div style={{
                    width: "32px",
                    height: "32px",
                    borderRadius: "50%",
                    backgroundColor: corCertificado(),
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#ffffff",
                    fontSize: "16px",
                    fontWeight: 600,
                    flexShrink: 0
                  }}>
                    {iconeCertificado()}
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: "13px", fontWeight: 600, color: corCertificado(), margin: 0 }}>
                      {textoCertificado()}
                    </p>
                  </div>
                </div>

                {/* Validade Progressbar */}
                {certificado?.possui_certificado && (
                  <div style={{ marginBottom: "20px" }}>
                    <div style={{
                      height: "4px",
                      backgroundColor: "rgba(0, 0, 0, 0.06)",
                      borderRadius: "2px",
                      overflow: "hidden",
                      marginBottom: "8px"
                    }}>
                      <div style={{
                        height: "100%",
                        backgroundColor: corCertificado(),
                        width: `${Math.min(100, Math.max(0, (certificado.dias_restantes / 365) * 100))}%`,
                        borderRadius: "2px"
                      }} />
                    </div>
                    <p style={{ fontSize: "12px", color: "#7c7f8e", margin: 0 }}>
                      Válido até {new Date(certificado.valido_ate).toLocaleDateString("pt-BR")}
                    </p>
                  </div>
                )}

                {/* Botão Ação */}
                <button
                  onClick={() => setModalCertAberto(true)}
                  style={{
                    width: "100%",
                    padding: "12px 16px",
                    backgroundColor: "#1a6b4a",
                    color: "#ffffff",
                    border: "none",
                    borderRadius: "10px",
                    fontSize: "14px",
                    fontWeight: 600,
                    cursor: "pointer",
                    transition: "all 0.2s ease"
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = "#0f4a33";
                    e.currentTarget.style.boxShadow = "0 4px 12px rgba(26, 107, 74, 0.2)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "#1a6b4a";
                    e.currentTarget.style.boxShadow = "none";
                  }}
                >
                  {certificado?.possui_certificado ? "📁 Atualizar certificado" : "➕ Cadastrar certificado"}
                </button>
              </>
            )}
          </div>
        </div>

        {/* Botão Sair */}
        <button
          onClick={fazerLogout}
          style={{
            width: "100%",
            padding: "14px 16px",
            backgroundColor: "rgba(220, 38, 38, 0.06)",
            color: "#dc2626",
            border: "none",
            borderRadius: "10px",
            fontSize: "14px",
            fontWeight: 600,
            cursor: "pointer",
            transition: "all 0.2s ease"
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = "rgba(220, 38, 38, 0.12)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "rgba(220, 38, 38, 0.06)";
          }}
        >
          🚪 Sair da conta
        </button>
      </div>

      {/* Modal Certificado */}
      {modalCertAberto && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(15, 17, 23, 0.4)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: "16px"
          }}
          onClick={fecharModal}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: "#ffffff",
              borderRadius: "16px",
              padding: "32px",
              maxWidth: "440px",
              width: "100%",
              boxShadow: "0 8px 32px rgba(0, 0, 0, 0.12)"
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "24px" }}>
              <div style={{
                width: "40px",
                height: "40px",
                borderRadius: "20px",
                backgroundColor: "#e8f4ef",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "20px"
              }}>
                📁
              </div>
              <h2 style={{ fontSize: "18px", fontWeight: 700, color: "#0f1117", margin: 0 }}>
                Certificado Digital
              </h2>
            </div>

            {mensagem && (
              <div
                style={{
                  padding: "12px 16px",
                  borderRadius: "10px",
                  marginBottom: "20px",
                  backgroundColor: mensagem.tipo === "sucesso" ? "#dcfce7" : "#fee2e2",
                  color: mensagem.tipo === "sucesso" ? "#134e4a" : "#991b1b",
                  fontSize: "13px",
                  fontWeight: 500,
                  borderLeft: `3px solid ${mensagem.tipo === "sucesso" ? "#16a34a" : "#dc2626"}`
                }}
              >
                {mensagem.tipo === "sucesso" ? "✓ " : "⚠ "}{mensagem.texto}
              </div>
            )}

            <div style={{ marginBottom: "16px" }}>
              <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#7c7f8e", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.3px" }}>
                Arquivo .pfx
              </label>
              <input
                type="file"
                accept=".pfx"
                onChange={(e) => setArquivo(e.target.files?.[0] || null)}
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  borderRadius: "8px",
                  border: "1.5px solid rgba(15, 17, 23, 0.1)",
                  fontSize: "14px",
                  boxSizing: "border-box",
                  cursor: "pointer"
                }}
              />
              {arquivo && (
                <p style={{ fontSize: "12px", color: "#1a6b4a", margin: "6px 0 0 0" }}>
                  ✓ {arquivo.name}
                </p>
              )}
            </div>

            <div style={{ marginBottom: "24px" }}>
              <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#7c7f8e", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.3px" }}>
                Senha do certificado
              </label>
              <input
                type="password"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                placeholder="••••••••"
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  borderRadius: "8px",
                  border: "1.5px solid rgba(15, 17, 23, 0.1)",
                  fontSize: "14px",
                  boxSizing: "border-box",
                  fontFamily: "system-ui"
                }}
              />
            </div>

            <div style={{ display: "flex", gap: "12px" }}>
              <button
                onClick={fecharModal}
                style={{
                  flex: 1,
                  padding: "12px",
                  backgroundColor: "rgba(0, 0, 0, 0.04)",
                  border: "none",
                  borderRadius: "10px",
                  fontSize: "14px",
                  fontWeight: 600,
                  color: "#0f1117",
                  cursor: "pointer",
                  transition: "all 0.2s ease"
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = "rgba(0, 0, 0, 0.08)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "rgba(0, 0, 0, 0.04)";
                }}
              >
                Cancelar
              </button>
              <button
                onClick={enviarCertificado}
                disabled={enviando}
                style={{
                  flex: 1,
                  padding: "12px",
                  backgroundColor: "#1a6b4a",
                  color: "#ffffff",
                  border: "none",
                  borderRadius: "10px",
                  fontSize: "14px",
                  fontWeight: 600,
                  cursor: enviando ? "not-allowed" : "pointer",
                  opacity: enviando ? 0.6 : 1,
                  transition: "all 0.2s ease"
                }}
                onMouseEnter={(e) => {
                  if (!enviando) {
                    e.currentTarget.style.backgroundColor = "#0f4a33";
                    e.currentTarget.style.boxShadow = "0 4px 12px rgba(26, 107, 74, 0.3)";
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "#1a6b4a";
                  e.currentTarget.style.boxShadow = "none";
                }}
              >
                {enviando ? "⏳ Enviando..." : "✓ Enviar certificado"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Editar Perfil */}
      {modalPerfilAberto && (
        <div
          style={{
            position: "fixed",
            top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: "rgba(15, 17, 23, 0.4)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: "16px"
          }}
          onClick={() => setModalPerfilAberto(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: "#ffffff",
              borderRadius: "16px",
              padding: "32px",
              maxWidth: "480px",
              width: "100%",
              boxShadow: "0 8px 32px rgba(0, 0, 0, 0.12)",
              maxHeight: "90vh",
              overflowY: "auto"
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "24px" }}>
              <div style={{
                width: "40px", height: "40px", borderRadius: "20px",
                backgroundColor: "#e8f4ef",
                display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px"
              }}>✏️</div>
              <h2 style={{ fontSize: "18px", fontWeight: 700, color: "#0f1117", margin: 0 }}>Editar Perfil</h2>
            </div>

            {mensagemPerfil && (
              <div style={{
                padding: "12px 16px", borderRadius: "10px", marginBottom: "20px",
                backgroundColor: mensagemPerfil.tipo === "sucesso" ? "#dcfce7" : "#fee2e2",
                color: mensagemPerfil.tipo === "sucesso" ? "#134e4a" : "#991b1b",
                fontSize: "13px", fontWeight: 500,
                borderLeft: `3px solid ${mensagemPerfil.tipo === "sucesso" ? "#16a34a" : "#dc2626"}`
              }}>
                {mensagemPerfil.tipo === "sucesso" ? "✓ " : "⚠ "}{mensagemPerfil.texto}
              </div>
            )}

            {/* Dados Pessoais */}
            <p style={{ fontSize: "11px", fontWeight: 700, color: "#7c7f8e", textTransform: "uppercase", letterSpacing: "0.5px", margin: "0 0 12px 0" }}>Dados Pessoais</p>

            {([
              { label: "Nome", field: "nome", type: "text", placeholder: "Seu nome completo" },
              { label: "CRM", field: "crm", type: "text", placeholder: "Ex: 123456/SP" },
            ] as const).map(({ label, field, type, placeholder }) => (
              <div key={field} style={{ marginBottom: "14px" }}>
                <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#7c7f8e", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.3px" }}>{label}</label>
                <input
                  type={type}
                  value={formPerfil[field]}
                  onChange={(e) => setFormPerfil({ ...formPerfil, [field]: e.target.value })}
                  placeholder={placeholder}
                  style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1.5px solid rgba(15, 17, 23, 0.1)", fontSize: "14px", boxSizing: "border-box" }}
                />
              </div>
            ))}

            <div style={{ marginBottom: "14px" }}>
              <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#7c7f8e", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.3px" }}>Tipo Documento</label>
              <select
                value={formPerfil.tipo_documento}
                onChange={(e) => setFormPerfil({ ...formPerfil, tipo_documento: e.target.value })}
                style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1.5px solid rgba(15, 17, 23, 0.1)", fontSize: "14px", boxSizing: "border-box", backgroundColor: "#fff" }}
              >
                <option value="cpf">CPF</option>
                <option value="cnpj">CNPJ</option>
              </select>
            </div>

            <div style={{ marginBottom: "24px" }}>
              <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#7c7f8e", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.3px" }}>Documento</label>
              <input
                type="text"
                value={formPerfil.documento}
                onChange={(e) => setFormPerfil({ ...formPerfil, documento: e.target.value })}
                placeholder={formPerfil.tipo_documento === "cnpj" ? "00.000.000/0000-00" : "000.000.000-00"}
                style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1.5px solid rgba(15, 17, 23, 0.1)", fontSize: "14px", boxSizing: "border-box" }}
              />
              <button
                onClick={buscarDadosCnpj}
                disabled={buscandoCnpj || formPerfil.tipo_documento !== "cnpj"}
                style={{
                  width: "100%",
                  padding: "10px",
                  backgroundColor: buscandoCnpj ? "#e8f4ef" : "#1a6b4a",
                  color: buscandoCnpj ? "#1a6b4a" : "#ffffff",
                  border: "none",
                  borderRadius: "8px",
                  fontSize: "13px",
                  fontWeight: 600,
                  cursor: buscandoCnpj || formPerfil.tipo_documento !== "cnpj" ? "not-allowed" : "pointer",
                  opacity: formPerfil.tipo_documento !== "cnpj" ? 0.5 : 1,
                  marginTop: "8px",
                }}
              >
                {buscandoCnpj ? "⏳ Buscando..." : "🔍 Buscar dados do CNPJ"}
              </button>
            </div>

            {servicosSugeridos.length > 0 && (
              <div style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#7c7f8e", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.3px" }}>
                  Selecionar Serviço
                </label>
                <p style={{ fontSize: "12px", color: "#7c7f8e", margin: "0 0 8px 0" }}>
                  Escolha o serviço que melhor descreve sua atividade:
                </p>
                {servicosSugeridos.map((servico, index) => (
                  <div
                    key={index}
                    onClick={() => setFormPerfil(prev => ({
                      ...prev,
                      codigo_servico: servico.codigo_servico,
                      codigo_tributario_municipio: servico.codigo_tributario_municipio || prev.codigo_tributario_municipio,
                      aliquota_iss: servico.aliquota_iss,
                    }))}
                    style={{
                      padding: "12px",
                      borderRadius: "8px",
                      border: `1.5px solid ${formPerfil.codigo_servico === servico.codigo_servico ? "#1a6b4a" : "rgba(15,17,23,0.1)"}`,
                      backgroundColor: formPerfil.codigo_servico === servico.codigo_servico ? "#e8f4ef" : "#fff",
                      cursor: "pointer",
                      marginBottom: "8px",
                      transition: "all 0.2s ease",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontSize: "13px", fontWeight: 600, color: "#0f1117" }}>
                        {servico.codigo_servico} — {servico.descricao}
                      </span>
                      {servico.principal && (
                        <span style={{ fontSize: "11px", backgroundColor: "#e8f4ef", color: "#1a6b4a", padding: "2px 8px", borderRadius: "100px", fontWeight: 600 }}>
                          Principal
                        </span>
                      )}
                    </div>
                    <span style={{ fontSize: "12px", color: "#7c7f8e" }}>
                      Alíquota: {servico.aliquota_iss}%
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Dados Fiscais */}
            <p style={{ fontSize: "11px", fontWeight: 700, color: "#7c7f8e", textTransform: "uppercase", letterSpacing: "0.5px", margin: "0 0 12px 0" }}>Dados Fiscais</p>

            {([
              { label: "Inscrição Municipal", field: "inscricao_municipal", hint: "", placeholder: "Ex: 123456" },
              { label: "Alíquota ISS (%)", field: "aliquota_iss", hint: "Consulte seu contador", placeholder: "Ex: 5" },
              { label: "Código Tributário Municipal", field: "codigo_tributario_municipio", hint: "Verifique em uma nota já emitida", placeholder: "Ex: 040100" },
              { label: "Código do Serviço", field: "codigo_servico", hint: "Ex: 0401 para consultas médicas", placeholder: "Ex: 0401" },
              { label: "CEP", field: "cep", hint: "", placeholder: "Ex: 63034250" },
              { label: "Regime Especial Tributação", field: "regime_especial_tributacao", hint: "", placeholder: "Ex: 6 (Microempresa Municipal)" },
              { label: "Opção Simples Nacional", field: "codigo_opcao_simples_nacional", hint: "", placeholder: "Ex: 3 (Optante ME/EPP)" },
              { label: "Regime Tributário SN", field: "regime_tributario_simples_nacional", hint: "", placeholder: "Ex: 3 (Fed+Mun pela NFS-e)" },
            ] as const).map(({ label, field, hint, placeholder }) => (
              <div key={field} style={{ marginBottom: "14px" }}>
                <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#7c7f8e", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.3px" }}>{label}</label>
                <input
                  type="text"
                  value={formPerfil[field]}
                  onChange={(e) => setFormPerfil({ ...formPerfil, [field]: e.target.value })}
                  placeholder={placeholder}
                  style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1.5px solid rgba(15, 17, 23, 0.1)", fontSize: "14px", boxSizing: "border-box" }}
                />
                {hint && <p style={{ fontSize: "12px", color: "#7c7f8e", margin: "4px 0 0 0" }}>{hint}</p>}
              </div>
            ))}

            <div style={{ marginBottom: "14px" }}>
              <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#7c7f8e", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.3px" }}>
                Optante Simples Nacional
              </label>
              <select
                value={formPerfil.optante_simples_nacional ? "true" : "false"}
                onChange={e => setFormPerfil({ ...formPerfil, optante_simples_nacional: e.target.value === "true" })}
                style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1.5px solid rgba(15,17,23,0.1)", fontSize: "14px", boxSizing: "border-box", backgroundColor: "#fff" }}
              >
                <option value="true">Sim</option>
                <option value="false">Não</option>
              </select>
            </div>

            <div style={{ display: "flex", gap: "12px", marginTop: "8px" }}>
              <button
                onClick={() => { setModalPerfilAberto(false); setMensagemPerfil(null); }}
                style={{
                  flex: 1, padding: "12px",
                  backgroundColor: "rgba(0, 0, 0, 0.04)",
                  border: "none", borderRadius: "10px",
                  fontSize: "14px", fontWeight: 600, color: "#0f1117", cursor: "pointer"
                }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "rgba(0, 0, 0, 0.08)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "rgba(0, 0, 0, 0.04)"; }}
              >
                Cancelar
              </button>
              <button
                onClick={salvarPerfil}
                disabled={salvando}
                style={{
                  flex: 1, padding: "12px",
                  backgroundColor: "#1a6b4a", color: "#ffffff",
                  border: "none", borderRadius: "10px",
                  fontSize: "14px", fontWeight: 600,
                  cursor: salvando ? "not-allowed" : "pointer",
                  opacity: salvando ? 0.6 : 1,
                  transition: "all 0.2s ease"
                }}
                onMouseEnter={(e) => { if (!salvando) { e.currentTarget.style.backgroundColor = "#0f4a33"; e.currentTarget.style.boxShadow = "0 4px 12px rgba(26, 107, 74, 0.3)"; } }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "#1a6b4a"; e.currentTarget.style.boxShadow = "none"; }}
              >
                {salvando ? "⏳ Salvando..." : "✓ Salvar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
