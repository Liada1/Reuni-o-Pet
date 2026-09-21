/**
 * Duração de um encontro em minutos, para somar horas no planejador e na
 * frequência.
 *
 * Ordem de precedência, da mais confiável para a menos:
 * 1. carga horária da formação, quando o encontro é uma formação bimestral
 *    registrada — é ela que vale para certificação, mesmo que a reunião
 *    tenha durado mais ou menos;
 * 2. o que de fato aconteceu (`inicio_real`/`fim_real`, gravados ao iniciar
 *    e encerrar o modo reunião);
 * 3. o que estava previsto — único disponível para reunião ainda futura,
 *    que é justamente o caso do planejamento.
 */
export interface ReuniaoComHorario {
  inicio: string;
  fim_previsto: string;
  inicio_real: string | null;
  fim_real: string | null;
}

export function minutosDoEncontro(
  reuniao: ReuniaoComHorario,
  cargaHorariaFormacaoMinutos?: number | null,
): number {
  if (cargaHorariaFormacaoMinutos != null) return cargaHorariaFormacaoMinutos;

  const [de, ate] =
    reuniao.inicio_real && reuniao.fim_real
      ? [reuniao.inicio_real, reuniao.fim_real]
      : [reuniao.inicio, reuniao.fim_previsto];

  const minutos = (new Date(ate).getTime() - new Date(de).getTime()) / 60_000;
  return minutos > 0 ? Math.round(minutos) : 0;
}

/** 90 → "1h30"; 120 → "2h"; 0 → "0h" */
export function formatarMinutos(minutos: number): string {
  const h = Math.floor(minutos / 60);
  const m = minutos % 60;
  if (m === 0) return `${h}h`;
  return `${h}h${String(m).padStart(2, "0")}`;
}

/** Minutos → horas decimais, para comparar com a meta (que é em horas). */
export function emHoras(minutos: number): number {
  return minutos / 60;
}
