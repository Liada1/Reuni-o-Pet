function paraUtcCompacto(iso: string) {
  return iso.replace(/[-:]/g, "").split(".")[0] + "Z";
}

function escaparTexto(texto: string) {
  return texto.replace(/[,;\\]/g, (c) => `\\${c}`).replace(/\n/g, "\\n");
}

export interface EventoIcs {
  uid: string;
  titulo: string;
  inicioUtc: string;
  fimUtc: string;
  local?: string;
  descricao?: string;
}

export function gerarIcs(evento: EventoIcs) {
  const linhas = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//PET//Reunioes//PT-BR",
    "CALSCALE:GREGORIAN",
    "BEGIN:VEVENT",
    `UID:${evento.uid}`,
    `DTSTAMP:${paraUtcCompacto(new Date().toISOString())}`,
    `DTSTART:${paraUtcCompacto(evento.inicioUtc)}`,
    `DTEND:${paraUtcCompacto(evento.fimUtc)}`,
    `SUMMARY:${escaparTexto(evento.titulo)}`,
    evento.local ? `LOCATION:${escaparTexto(evento.local)}` : null,
    evento.descricao ? `DESCRIPTION:${escaparTexto(evento.descricao)}` : null,
    "END:VEVENT",
    "END:VCALENDAR",
  ].filter(Boolean);

  return linhas.join("\r\n");
}

export function icsParaDataUri(evento: EventoIcs) {
  const conteudo = gerarIcs(evento);
  return `data:text/calendar;charset=utf-8,${encodeURIComponent(conteudo)}`;
}

function paraGoogleCompacto(iso: string) {
  return iso.replace(/[-:]/g, "").split(".")[0] + "Z";
}

export function linkGoogleAgenda(evento: EventoIcs) {
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: evento.titulo,
    dates: `${paraGoogleCompacto(evento.inicioUtc)}/${paraGoogleCompacto(evento.fimUtc)}`,
  });
  if (evento.local) params.set("location", evento.local);
  if (evento.descricao) params.set("details", evento.descricao);
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}
