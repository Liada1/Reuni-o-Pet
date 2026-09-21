import { createClient } from "@/lib/supabase/server";
import { getMetasSettings, getMeetingTypes } from "@/features/configuracoes";
import { getCargaHorariaPorReuniao } from "@/features/formacao";
import { semanasDoMes, periodoDoMes } from "@/lib/periodos";
import { minutosDoEncontro, emHoras } from "@/lib/duracao";
import { formatInTimeZone } from "date-fns-tz";
import type { ReuniaoComDetalhes } from "@/features/agenda";
import type { MeetingStatus } from "@/lib/supabase/types";
import type { PlanoDoMes, SemanaPlanejada, LinhaCronograma } from "./types";

/**
 * Encontros que contam para a meta: tudo que está de pé, agendado ou já
 * realizado. Cancelada e remarcada ficam de fora — a remarcada vira outro
 * registro na data nova, e contar as duas inflaria a semana.
 */
const STATUS_QUE_CONTAM: MeetingStatus[] = ["agendada", "em_andamento", "realizada"];

export async function getPlanoDoMes(
  mesISO: string,
  fusoHorario: string,
): Promise<PlanoDoMes> {
  const semanas = semanasDoMes(mesISO, fusoHorario);
  const mes = periodoDoMes(mesISO, fusoHorario);
  const supabase = await createClient();

  // A primeira e a última semana invadem o mês vizinho, então a busca vai
  // da borda da primeira semana até a borda da última, não do mês.
  const { data, error } = await supabase
    .from("meetings")
    .select("*, meeting_types(nome, cor), locations(nome, endereco)")
    .in("status", STATUS_QUE_CONTAM)
    .gte("inicio", semanas[0].inicioUtc.toISOString())
    .lt("inicio", semanas[semanas.length - 1].fimUtc.toISOString())
    .order("inicio");
  if (error) throw new Error(error.message);

  const encontros = (data as unknown as ReuniaoComDetalhes[]) ?? [];
  const cargaPorReuniao = await getCargaHorariaPorReuniao(encontros.map((e) => e.id));

  const [metas, tipos] = await Promise.all([getMetasSettings(), getMeetingTypes()]);

  const agoraMs = Date.now();
  const semanasPlanejadas: SemanaPlanejada[] = semanas.map((semana) => {
    const daSemana = encontros.filter((e) => {
      const inicio = new Date(e.inicio);
      return inicio >= semana.inicioUtc && inicio < semana.fimUtc;
    });
    const minutos = daSemana.reduce(
      (soma, e) => soma + minutosDoEncontro(e, cargaPorReuniao.get(e.id)),
      0,
    );
    return {
      inicioISO: semana.inicioISO,
      fimISO: semana.fimISO,
      encontros: daSemana,
      minutos,
      encerrada: semana.fimUtc.getTime() <= agoraMs,
      contemHoje:
        semana.inicioUtc.getTime() <= agoraMs && agoraMs < semana.fimUtc.getTime(),
      cumpreEncontros: daSemana.length >= metas.encontros_por_semana,
      cumpreHoras: emHoras(minutos) >= metas.horas_por_semana,
    };
  });

  // Os obrigatórios são contados no mês de verdade, não na grade de
  // semanas: um encontro do dia 30 do mês anterior não cumpre este mês.
  const doMes = encontros.filter((e) => {
    const inicio = new Date(e.inicio);
    return inicio >= mes.inicioUtc && inicio < mes.fimUtc;
  });

  const cronograma: LinhaCronograma[] = encontros.map((e) => ({
    data: formatInTimeZone(e.inicio, fusoHorario, "dd/MM/yyyy"),
    hora: formatInTimeZone(e.inicio, fusoHorario, "HH:mm"),
    tipo: e.meeting_types?.nome ?? "—",
    titulo: e.titulo ?? "",
    modalidade: e.modalidade === "online" ? "Online" : "Presencial",
    local: e.modalidade === "online" ? "Online" : e.locations?.nome ?? "A definir",
    minutos: minutosDoEncontro(e, cargaPorReuniao.get(e.id)),
    status: e.status,
  }));

  return {
    mesISO,
    cronograma,
    metaEncontros: metas.encontros_por_semana,
    metaHoras: metas.horas_por_semana,
    semanas: semanasPlanejadas,
    totalEncontros: doMes.length,
    totalMinutos: doMes.reduce(
      (soma, e) => soma + minutosDoEncontro(e, cargaPorReuniao.get(e.id)),
      0,
    ),
    tiposObrigatorios: metas.tipos_obrigatorios_por_mes
      .map((id) => {
        const tipo = tipos.find((t) => t.id === id);
        if (!tipo) return null;
        return {
          id: tipo.id,
          nome: tipo.nome,
          cor: tipo.cor,
          quantidade: doMes.filter((e) => e.meeting_type_id === id).length,
        };
      })
      .filter((t): t is NonNullable<typeof t> => t !== null),
  };
}

