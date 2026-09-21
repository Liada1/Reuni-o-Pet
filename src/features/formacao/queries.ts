import { createClient } from "@/lib/supabase/server";
import { bimestresDoAno } from "@/lib/periodos";
import type { ReuniaoComDetalhes } from "@/features/agenda";
import type { Formacao, BimestreComFormacao } from "./types";

// `!inner` é obrigatório aqui: sem ele o filtro por data valeria só para o
// recurso embutido, e a formação voltaria com `meetings: null` em vez de
// ficar de fora do resultado.
const EMBED_REUNIAO =
  "*, meetings!inner(*, meeting_types(nome, cor), locations(nome, endereco))";

/**
 * O que define uma formação é ter registro em `formacoes`, não o tipo do
 * encontro: a coordenação pode renomear tipos, e uma formação pode
 * acontecer dentro de um encontro de qualquer tipo.
 */
export async function getFormacoesDoAno(
  ano: number,
  fusoHorario: string,
): Promise<BimestreComFormacao[]> {
  const bimestres = bimestresDoAno(ano, fusoHorario);
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("formacoes")
    .select(EMBED_REUNIAO)
    .gte("meetings.inicio", bimestres[0].inicioUtc.toISOString())
    .lt("meetings.inicio", bimestres[5].fimUtc.toISOString());
  if (error) throw new Error(error.message);

  const linhas = (data as unknown as (Formacao & { meetings: ReuniaoComDetalhes | null })[]) ?? [];

  return bimestres.map((bimestre, i) => ({
    numero: (i + 1) as BimestreComFormacao["numero"],
    inicioISO: bimestre.inicioISO,
    fimISO: bimestre.fimISO,
    encontros: linhas
      .filter((l) => {
        if (!l.meetings) return false;
        const inicio = new Date(l.meetings.inicio);
        return inicio >= bimestre.inicioUtc && inicio < bimestre.fimUtc;
      })
      .sort(
        (a, b) =>
          new Date(b.meetings!.inicio).getTime() - new Date(a.meetings!.inicio).getTime(),
      )
      .map((l) => ({ reuniao: l.meetings!, formacao: l })),
  }));
}

/**
 * Carga horária das formações, por reunião — usada para somar horas no
 * planejador e na frequência, onde ela substitui a duração do encontro.
 */
export async function getCargaHorariaPorReuniao(
  meetingIds: string[],
): Promise<Map<string, number>> {
  if (meetingIds.length === 0) return new Map();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("formacoes")
    .select("meeting_id, carga_horaria_minutos")
    .in("meeting_id", meetingIds);
  if (error) throw new Error(error.message);
  return new Map((data ?? []).map((f) => [f.meeting_id, f.carga_horaria_minutos]));
}

/** Reuniões já realizadas do período que ainda não têm formação registrada. */
export async function getReunioesSemFormacao(
  inicioUtc: Date,
  fimUtc: Date,
): Promise<ReuniaoComDetalhes[]> {
  const supabase = await createClient();

  const { data: reunioes, error } = await supabase
    .from("meetings")
    .select("*, meeting_types(nome, cor), locations(nome, endereco)")
    .neq("status", "cancelada")
    .gte("inicio", inicioUtc.toISOString())
    .lt("inicio", fimUtc.toISOString())
    .order("inicio", { ascending: false });
  if (error) throw new Error(error.message);

  const lista = (reunioes as unknown as ReuniaoComDetalhes[]) ?? [];
  const jaTem = await getCargaHorariaPorReuniao(lista.map((r) => r.id));
  return lista.filter((r) => !jaTem.has(r.id));
}
