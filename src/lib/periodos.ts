import {
  startOfMonth,
  endOfMonth,
  endOfWeek,
  eachWeekOfInterval,
  addDays,
  addMonths,
  format,
} from "date-fns";
import { fromZonedTime, formatInTimeZone } from "date-fns-tz";

/**
 * Períodos (mês, semana, bimestre) calculados no fuso do grupo.
 *
 * O cuidado aqui é não misturar as duas naturezas de data: o calendário
 * (yyyy-MM-dd, sem fuso) e o instante (timestamptz no banco). As contas de
 * calendário são feitas em datas "ingênuas" — só os campos de ano/mês/dia
 * são lidos, nunca `toISOString()` — e só na hora de consultar o banco cada
 * borda vira instante UTC com `fromZonedTime`. Assim o resultado é o mesmo
 * rodando local ou na Vercel (que roda em UTC).
 */

export interface Periodo {
  /** Primeiro dia, yyyy-MM-dd no fuso do grupo. */
  inicioISO: string;
  /** Último dia (inclusivo), yyyy-MM-dd no fuso do grupo. */
  fimISO: string;
  /** Instante do começo do primeiro dia. */
  inicioUtc: Date;
  /** Instante do começo do dia seguinte ao último — use com `<`. */
  fimUtc: Date;
}

function dataIngenua(dataISO: string) {
  return new Date(`${dataISO}T00:00:00`);
}

function periodo(inicio: Date, fim: Date, fusoHorario: string): Periodo {
  const inicioISO = format(inicio, "yyyy-MM-dd");
  const fimISO = format(fim, "yyyy-MM-dd");
  return {
    inicioISO,
    fimISO,
    inicioUtc: fromZonedTime(`${inicioISO}T00:00:00`, fusoHorario),
    fimUtc: fromZonedTime(`${format(addDays(fim, 1), "yyyy-MM-dd")}T00:00:00`, fusoHorario),
  };
}

/** Mês corrente no fuso do grupo, como yyyy-MM. */
export function mesCorrente(fusoHorario: string): string {
  return formatInTimeZone(new Date(), fusoHorario, "yyyy-MM");
}

/** Ano corrente no fuso do grupo. */
export function anoCorrente(fusoHorario: string): number {
  return Number(formatInTimeZone(new Date(), fusoHorario, "yyyy"));
}

/** Aceita yyyy-MM; devolve o mês corrente quando o parâmetro não serve. */
export function mesValido(mesISO: string | undefined, fusoHorario: string): string {
  return mesISO && /^\d{4}-\d{2}$/.test(mesISO) ? mesISO : mesCorrente(fusoHorario);
}

export function mesVizinho(mesISO: string, passo: number): string {
  return format(addMonths(dataIngenua(`${mesISO}-01`), passo), "yyyy-MM");
}

export function periodoDoMes(mesISO: string, fusoHorario: string): Periodo {
  const primeiro = dataIngenua(`${mesISO}-01`);
  return periodo(startOfMonth(primeiro), endOfMonth(primeiro), fusoHorario);
}

/**
 * Semanas que tocam o mês, começando na segunda (mesma convenção da
 * Agenda). A primeira e a última podem invadir o mês vizinho — é o
 * comportamento certo: a semana é a unidade da meta, não o mês.
 */
export function semanasDoMes(mesISO: string, fusoHorario: string): Periodo[] {
  const primeiro = dataIngenua(`${mesISO}-01`);
  return eachWeekOfInterval(
    { start: startOfMonth(primeiro), end: endOfMonth(primeiro) },
    { weekStartsOn: 1 },
  ).map((inicio) => periodo(inicio, endOfWeek(inicio, { weekStartsOn: 1 }), fusoHorario));
}

/** Os 6 bimestres do ano, na ordem. */
export function bimestresDoAno(ano: number, fusoHorario: string): Periodo[] {
  return Array.from({ length: 6 }, (_, i) => {
    const inicio = dataIngenua(`${ano}-${String(i * 2 + 1).padStart(2, "0")}-01`);
    return periodo(startOfMonth(inicio), endOfMonth(addMonths(inicio, 1)), fusoHorario);
  });
}

const MESES_CURTOS = [
  "jan", "fev", "mar", "abr", "mai", "jun",
  "jul", "ago", "set", "out", "nov", "dez",
];

/** "set de 2026" */
export function rotuloMes(mesISO: string): string {
  const [ano, mes] = mesISO.split("-");
  return `${MESES_CURTOS[Number(mes) - 1]} de ${ano}`;
}

/** "31/08 – 06/09" */
export function rotuloPeriodoCurto(p: Periodo): string {
  const curto = (iso: string) => `${iso.slice(8, 10)}/${iso.slice(5, 7)}`;
  return `${curto(p.inicioISO)} – ${curto(p.fimISO)}`;
}
