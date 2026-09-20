export function linkWhatsApp(texto: string) {
  return `https://wa.me/?text=${encodeURIComponent(texto)}`;
}

export function mensagemConvite(params: {
  nomePrograma: string;
  nomeGrupo: string;
  link: string;
}) {
  return `Olá! Você está convidado(a) para o ${params.nomePrograma} — ${params.nomeGrupo}.\nEntre pelo link para completar seu cadastro:\n${params.link}`;
}

export function mensagemEnquete(params: {
  titulo: string;
  tipoEncontro: string;
  prazoFormatado: string | null;
  link: string;
}) {
  const prazo = params.prazoFormatado
    ? `Votem até ${params.prazoFormatado}:\n`
    : "";
  return `📅 ${params.titulo} (${params.tipoEncontro})\n${prazo}${params.link}`;
}

export function mensagemLembrete(params: { titulo: string; nomes: string[]; link: string }) {
  return `Oi, pessoal! Ainda faltam votos na enquete "${params.titulo}":\n${params.nomes
    .map((n) => `- ${n}`)
    .join("\n")}\n\nVotem aqui: ${params.link}`;
}

export function mensagemConfirmacao(params: {
  tituloReuniao: string;
  dataHoraFormatada: string;
  local: string;
  link: string;
}) {
  return `✅ Reunião confirmada: ${params.tituloReuniao}\n${params.dataHoraFormatada} · ${params.local}\nAdicione à sua agenda: ${params.link}`;
}

export function mensagemRemarcacaoCancelamento(params: {
  tituloReuniao: string;
  status: "remarcada" | "cancelada";
  motivo?: string;
  dataHoraFormatada?: string;
}) {
  const acao = params.status === "cancelada" ? "cancelada" : "remarcada";
  const novaData = params.dataHoraFormatada ? `\nNova data: ${params.dataHoraFormatada}` : "";
  const motivo = params.motivo ? `\nMotivo: ${params.motivo}` : "";
  return `⚠️ A reunião "${params.tituloReuniao}" foi ${acao}.${novaData}${motivo}`;
}
