import React, { useEffect, useState } from "react";
import api from "../../services/api";
import { ENDPOINTS } from "../../constants/api";
import { useAuth } from "../../hooks/useAuth";

export default function Home() {
  const { medico } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [certificado, setCertificado] = useState<any>(null);
  const [notas, setNotas] = useState<any[]>([]);
  const [notasPorDiaLocal, setNotasPorDiaLocal] = useState<any>({});
  const [notasProcessando, setNotasProcessando] = useState<any[]>([]);
  const [cancelando, setCancelando] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(true);

  const mesAtual = new Date().getMonth() + 1;
  const anoAtual = new Date().getFullYear();
  const nomeMes = new Date().toLocaleDateString("pt-BR", { month: "long", year: "numeric" });

  useEffect(() => {
    carregarDados();
  }, []);

  useEffect(() => {
    if (notasProcessando.length === 0) return;
    const interval = setInterval(async () => {
      const atualizadas = await Promise.all(
        notasProcessando.map(async (nota) => {
          try {
            const res = await api.get(`/api/v1/notas/${nota.id}`);
            return res.data;
          } catch {
            return nota;
          }
        })
      );
      const aindaPendentes = atualizadas.filter((n) => n.status === "pendente");
      setNotasProcessando(aindaPendentes);
      if (aindaPendentes.length < notasProcessando.length) {
        carregarDados(); // Recarrega tudo quando alguma nota for autorizada
      }
    }, 15000);
    return () => clearInterval(interval);
  }, [notasProcessando]);

  const carregarDados = async () => {
    try {
      const [statsRes, certRes, notasRes] = await Promise.all([
        api.get(`${ENDPOINTS.HOME_STATS}?mes=${mesAtual}&ano=${anoAtual}`),
        api.get(ENDPOINTS.CERTIFICADO_STATUS),
        api.get(`${ENDPOINTS.LISTAR_NOTAS}?mes=${mesAtual}&ano=${anoAtual}`),
      ]);
      setStats(statsRes.data);
      setCertificado(certRes.data);
      setNotas(notasRes.data);
      // Agrupa todas as notas por dia para o calendário (incluindo pendentes)
      const todasNotas = notasRes.data;
      const porDia: any = {};
      todasNotas.forEach((nota: any) => {
        const dia = new Date(nota.criado_em).getDate();
        if (!porDia[dia]) porDia[dia] = [];
        porDia[dia].push(nota);
      });
      setNotasPorDiaLocal(porDia);
      const pendentes = notasRes.data.filter((n: any) => n.status === "pendente");
      setNotasProcessando(pendentes);
    } catch (error) {
      console.error(error);
    } finally {
      setCarregando(false);
    }
  };

  const cancelarNota = async (notaId: string) => {
    if (!window.confirm("Tem certeza que deseja cancelar esta nota?")) return;
    setCancelando(notaId);
    try {
      await api.delete(`/api/v1/notas/${notaId}/cancelar`);
      await carregarDados();
    } catch (error: any) {
      alert(error.response?.data?.detail || "Erro ao cancelar nota");
    } finally {
      setCancelando(null);
    }
  };

  const getAvatarLetras = () => {
    if (!medico?.nome) return "?";
    return medico.nome
      .split(" ")
      .map((n: string) => n[0])
      .join("")
      .substring(0, 2)
      .toUpperCase();
  };

  const getBannerState = () => {
    if (certificado?.vencido) {
      return {
        show: true,
        type: "erro",
        texto: "🚨 Seu certificado está vencido. Você não consegue emitir notas até renovar.",
        botao: "Renovar agora",
      };
    }
    if (certificado?.vencendo_em_breve) {
      return {
        show: true,
        type: "aviso",
        texto: `⚠️ Seu certificado vence em ${certificado.dias_restantes} dias. Renove para continuar emitindo notas.`,
        botao: "Renovar",
      };
    }
    if (!certificado?.possui_certificado) {
      return {
        show: true,
        type: "aviso",
        texto: "⚠️ Você ainda não cadastrou seu certificado digital. Sem ele não é possível emitir notas.",
        botao: "Cadastrar agora",
      };
    }
    return { show: false };
  };

  const banner = getBannerState();

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f5f5f7" }}>
      {/* Header */}
      <div
        style={{
          backgroundColor: "#ffffff",
          borderBottom: "1px solid rgba(0,0,0,0.06)",
          padding: "12px 24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
        }}
      >
        <h1 style={{ fontFamily: "Georgia, serif", fontSize: "24px", color: "#000", fontWeight: 600, margin: 0 }}>
          Medi<span style={{ color: "#1a6b4a" }}>NF</span>
        </h1>
        <a
          href="/perfil"
          style={{
            width: "40px",
            height: "40px",
            borderRadius: "50%",
            backgroundColor: "#1a6b4a",
            color: "#ffffff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "14px",
            fontWeight: 600,
            textDecoration: "none",
            cursor: "pointer",
          }}
        >
          {getAvatarLetras()}
        </a>
      </div>

      <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "24px" }}>
        {/* Banner de notificação */}
        {banner.show && (
          <div
            style={{
              backgroundColor: "#ffffff",
              borderLeft: `4px solid ${banner.type === "erro" ? "#dc2626" : "#d97706"}`,
              borderRadius: "8px",
              padding: "16px 20px",
              marginBottom: "24px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
            }}
          >
            <span style={{ fontSize: "14px", color: "#1f2937", fontWeight: 400 }}>{banner.texto}</span>
            <a
              href="/perfil"
              style={{
                padding: "8px 16px",
                backgroundColor: banner.type === "erro" ? "#dc2626" : "#d97706",
                color: "#ffffff",
                borderRadius: "6px",
                fontSize: "13px",
                fontWeight: 600,
                textDecoration: "none",
                whiteSpace: "nowrap",
                marginLeft: "16px",
              }}
            >
              {banner.botao}
            </a>
          </div>
        )}

        {/* Título do mês */}
        <h2 style={{ fontSize: "28px", fontWeight: 600, color: "#000", marginBottom: "24px", margin: 0 }}>
          {nomeMes.charAt(0).toUpperCase() + nomeMes.slice(1)}
        </h2>

        {/* Cards de stats */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: "16px",
            marginBottom: "32px",
          }}
        >
          <div
            style={{
              backgroundColor: "#1a6b4a",
              borderRadius: "12px",
              padding: "20px 24px",
              boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
            }}
          >
            <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "13px", fontWeight: 400, marginBottom: "8px", margin: 0 }}>
              NFs emitidas
            </p>
            <p style={{ color: "#ffffff", fontSize: "36px", fontWeight: 600, margin: 0 }}>{stats?.total_mes || 0}</p>
          </div>

          <div
            style={{
              backgroundColor: "#ffffff",
              borderRadius: "12px",
              padding: "20px 24px",
              boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
              border: "1px solid rgba(0,0,0,0.06)",
            }}
          >
            <p style={{ color: "#6b7280", fontSize: "13px", fontWeight: 400, marginBottom: "8px", margin: 0 }}>Total do mês</p>
            <p style={{ color: "#000", fontSize: "28px", fontWeight: 600, margin: 0 }}>
              R$ {Number(stats?.valor_total_mes || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </p>
          </div>

          <div
            style={{
              backgroundColor: "#ffffff",
              borderRadius: "12px",
              padding: "20px 24px",
              boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
              border: "1px solid rgba(0,0,0,0.06)",
            }}
          >
            <p style={{ color: "#6b7280", fontSize: "13px", fontWeight: 400, marginBottom: "12px", margin: 0 }}>Relatório</p>
            <button
              onClick={exportarCSV}
              style={{
                width: "100%",
                backgroundColor: "#f3f4f6",
                color: "#1a6b4a",
                border: "none",
                borderRadius: "8px",
                padding: "10px",
                fontSize: "13px",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Exportar CSV
            </button>
          </div>
        </div>

        {/* Calendário e Notas lado a lado */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px", marginBottom: "32px" }}>
          {/* Calendário */}
          <CalendarioMensal mes={mesAtual} ano={anoAtual} notasPorDia={notasPorDiaLocal} />

          {/* Lista de notas */}
          {notas.length > 0 && (
            <div style={{ backgroundColor: "#ffffff", borderRadius: "12px", padding: "24px", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
              <h3 style={{ fontSize: "16px", fontWeight: 600, color: "#000", marginBottom: "16px", margin: 0 }}>Notas emitidas</h3>
              <div style={{ maxHeight: "400px", overflowY: "auto" }}>
                {notas.map((nota) => (
                  <div
                    key={nota.id}
                    style={{
                      paddingBottom: "12px",
                      marginBottom: "12px",
                      borderBottom: "1px solid rgba(0,0,0,0.06)",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: "14px", fontWeight: 600, color: "#000", marginBottom: "4px", margin: 0 }}>
                        {nota.paciente_nome}
                      </p>
                      {nota.status === "erro" && (
                        <p style={{ fontSize: "12px", color: "#dc2626", fontWeight: 500, marginBottom: "4px", margin: 0 }}>
                          Erro: {nota.erro_mensagem}
                        </p>
                      )}
                      <p style={{ fontSize: "12px", color: "#6b7280", fontWeight: 400, margin: 0 }}>
                        NF {nota.numero_nf || "—"} · {new Date(nota.emitida_em || nota.criado_em).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", marginLeft: "12px" }}>
                      <p style={{ fontSize: "14px", fontWeight: 600, color: "#1a6b4a", whiteSpace: "nowrap", margin: 0 }}>
                        R$ {Number(nota.valor).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                      </p>
                      {(nota.status === "emitida" || nota.status === "pendente") && (
                        <button
                          onClick={() => cancelarNota(nota.id)}
                          disabled={cancelando === nota.id}
                          style={{
                            marginLeft: "8px",
                            padding: "4px 10px",
                            backgroundColor: "rgba(220,38,38,0.08)",
                            color: "#dc2626",
                            border: "none",
                            borderRadius: "6px",
                            fontSize: "12px",
                            fontWeight: 600,
                            cursor: cancelando === nota.id ? "not-allowed" : "pointer",
                            opacity: cancelando === nota.id ? 0.6 : 1,
                            whiteSpace: "nowrap",
                          }}
                        >
                          {cancelando === nota.id ? "..." : "Cancelar"}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {notasProcessando.length > 0 && (
          <div style={{ backgroundColor: "#fffbeb", borderRadius: "12px", padding: "20px 24px", marginBottom: "24px", border: "1px solid rgba(217,119,6,0.2)", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
            <h3 style={{ fontSize: "15px", fontWeight: 600, color: "#92400e", marginBottom: "12px", margin: "0 0 12px 0" }}>
              ⏳ Notas em processamento ({notasProcessando.length})
            </h3>
            {notasProcessando.map((nota) => (
              <div key={nota.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: "1px solid rgba(217,119,6,0.1)" }}>
                <div>
                  <p style={{ fontSize: "14px", fontWeight: 500, color: "#92400e", margin: 0 }}>{nota.paciente_nome}</p>
                  <p style={{ fontSize: "12px", color: "#b45309", margin: 0 }}>Aguardando prefeitura...</p>
                </div>
                <p style={{ fontSize: "14px", fontWeight: 600, color: "#92400e", margin: 0 }}>
                  R$ {Number(nota.valor).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* FAB - Floating Action Button */}
      <a
        href="/emitir"
        style={{
          position: "fixed",
          bottom: "32px",
          right: "32px",
          padding: "0 20px",
          height: "56px",
          borderRadius: "28px",
          backgroundColor: "#1a6b4a",
          color: "#ffffff",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "8px",
          fontSize: "16px",
          fontWeight: 600,
          textDecoration: "none",
          boxShadow: "0 4px 12px rgba(26, 107, 74, 0.4)",
          transition: "all 0.2s ease",
          cursor: "pointer",
          whiteSpace: "nowrap",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.boxShadow = "0 8px 16px rgba(26, 107, 74, 0.5)";
          e.currentTarget.style.transform = "scale(1.1)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.boxShadow = "0 4px 12px rgba(26, 107, 74, 0.4)";
          e.currentTarget.style.transform = "scale(1)";
        }}
      >
        <span style={{ fontSize: "20px" }}>+</span>
        Emitir nota
      </a>
    </div>
  );

  function exportarCSV() {
    const exportarCSVAsync = async () => {
      try {
        const response = await api.get(`${ENDPOINTS.EXPORTAR_CSV}?mes=${mesAtual}&ano=${anoAtual}`, {
          responseType: "blob",
        });
        const url = window.URL.createObjectURL(response.data);
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", `relatorio-${mesAtual}-${anoAtual}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      } catch (error) {
        console.error("Erro ao exportar:", error);
      }
    };
    exportarCSVAsync();
  }
}

function CalendarioMensal({ mes, ano, notasPorDia }: { mes: number; ano: number; notasPorDia: any }) {
  const diasSemana = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
  const primeiroDia = new Date(ano, mes - 1, 1).getDay();
  const diasNoMes = new Date(ano, mes, 0).getDate();

  const dias: (number | null)[] = [];
  for (let i = 0; i < primeiroDia; i++) {
    dias.push(null);
  }
  for (let i = 1; i <= diasNoMes; i++) {
    dias.push(i);
  }

  return (
    <div style={{ backgroundColor: "#ffffff", borderRadius: "12px", padding: "24px", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
      {/* Cabeçalho com dias da semana */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "8px", marginBottom: "12px" }}>
        {diasSemana.map((dia) => (
          <div
            key={dia}
            style={{
              textAlign: "center",
              fontSize: "12px",
              fontWeight: 600,
              color: "#6b7280",
              paddingBottom: "8px",
              borderBottom: "1px solid rgba(0,0,0,0.06)",
            }}
          >
            {dia}
          </div>
        ))}
      </div>

      {/* Grid de dias */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "8px" }}>
        {dias.map((dia, index) => (
          <div
            key={index}
            style={{
              aspectRatio: "1",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexDirection: "column",
              position: "relative",
              color: dia ? "#000" : "#d1d5db",
              fontSize: "13px",
              fontWeight: 500,
              borderRadius: "8px",
              backgroundColor: dia ? "rgba(0,0,0,0.02)" : "transparent",
            }}
          >
            {dia}
            {dia && notasPorDia[dia] && (
              <div style={{ position: "absolute", bottom: "4px", width: "4px", height: "4px", backgroundColor: "#1a6b4a", borderRadius: "50%" }} />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
