export const API_URL = "https://medinf-backend-production.up.railway.app";

export const ENDPOINTS = {
  LOGIN: "/api/v1/auth/login",
  CADASTRO: "/api/v1/auth/cadastro",
  ME: "/api/v1/auth/me",
  PERFIL: "/api/v1/medico/perfil",
  RECUPERAR_SENHA: "/api/v1/auth/recuperar-senha",
  REDEFINIR_SENHA: "/api/v1/auth/redefinir-senha",
  ASSINATURA_STATUS: "/api/v1/assinatura/status",
  ASSINATURA_CHECKOUT: "/api/v1/assinatura/checkout",
  CERTIFICADO_UPLOAD: "/api/v1/certificado/upload",
  CERTIFICADO_STATUS: "/api/v1/certificado/status",
  EXTRAIR_TEXTO: "/api/v1/extracao/extrair-texto",
  EXTRAIR_IMAGEM: "/api/v1/extracao/extrair-imagem",
  EMITIR_NF: "/api/v1/notas/emitir",
  HOME_STATS: "/api/v1/notas/home",
  LISTAR_NOTAS: "/api/v1/relatorio/notas",
  EXPORTAR_CSV: "/api/v1/relatorio/exportar-csv",
};
