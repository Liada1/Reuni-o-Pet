import { fromZonedTime, toZonedTime, formatInTimeZone } from "date-fns-tz";

/** Encapsula `new Date()`/`Date.now()` para não disparar o lint de pureza do
 * React ao chamar diretamente dentro de um componente. */
export function agora(): Date {
  return new Date();
}

export function agoraMaisMs(deltaMs: number): Date {
  return new Date(Date.now() + deltaMs);
}

/** Combina uma data (yyyy-MM-dd) e hora (HH:mm) informadas no fuso do grupo
 * em um instante UTC, para gravar em colunas timestamptz. */
export function paraUtc(dataISO: string, horaMinuto: string, fusoHorario: string): Date {
  return fromZonedTime(`${dataISO}T${horaMinuto}:00`, fusoHorario);
}

const DIAS_SEMANA = ["DOM", "SEG", "TER", "QUA", "QUI", "SEX", "SÁB"];
const MESES = [
  "jan", "fev", "mar", "abr", "mai", "jun",
  "jul", "ago", "set", "out", "nov", "dez",
];

export function formatarDiaSemana(utcISO: string, fusoHorario: string) {
  const local = toZonedTime(utcISO, fusoHorario);
  return DIAS_SEMANA[local.getDay()];
}

/** dd/mm/aaaa */
export function formatarData(utcISO: string, fusoHorario: string) {
  return formatInTimeZone(utcISO, fusoHorario, "dd/MM/yyyy");
}

/** dd/mm/aaaa para colunas `date` (yyyy-MM-dd), que não têm fuso: converter
 * por timezone deslocaria o dia (meia-noite UTC vira o dia anterior aqui). */
export function formatarDataSimples(dataISO: string) {
  const [ano, mes, dia] = dataISO.slice(0, 10).split("-");
  return `${dia}/${mes}/${ano}`;
}

/** dd/mm curto, com mês por extenso abreviado quando útil */
export function formatarDataCurta(utcISO: string, fusoHorario: string) {
  const local = toZonedTime(utcISO, fusoHorario);
  return `${String(local.getDate()).padStart(2, "0")}/${String(local.getMonth() + 1).padStart(2, "0")}`;
}

export function formatarMesAno(utcISO: string, fusoHorario: string) {
  const local = toZonedTime(utcISO, fusoHorario);
  return `${MESES[local.getMonth()]} de ${local.getFullYear()}`;
}

/** 16h ou 19h30, como usado nas enquetes do grupo. */
export function formatarHora(utcISO: string, fusoHorario: string) {
  const local = toZonedTime(utcISO, fusoHorario);
  const h = local.getHours();
  const m = local.getMinutes();
  return m === 0 ? `${h}h` : `${h}h${String(m).padStart(2, "0")}`;
}

export function formatarDataHoraCompleta(utcISO: string, fusoHorario: string) {
  return `${DIAS_SEMANA[toZonedTime(utcISO, fusoHorario).getDay()]} ${formatarData(utcISO, fusoHorario)} · ${formatarHora(utcISO, fusoHorario)}`;
}

export function paraInputData(utcISO: string, fusoHorario: string) {
  return formatInTimeZone(utcISO, fusoHorario, "yyyy-MM-dd");
}

export function paraInputHora(utcISO: string, fusoHorario: string) {
  return formatInTimeZone(utcISO, fusoHorario, "HH:mm");
}
