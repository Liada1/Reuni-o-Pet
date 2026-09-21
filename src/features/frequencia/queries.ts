import { createClient } from "@/lib/supabase/server";
import { getMetasSettings } from "@/features/configuracoes";
import { getMembros } from "@/features/membros";
import { getCargaHorariaPorReuniao } from "@/features/formacao";
import { semanasDoMes, periodoDoMes } from "@/lib/periodos";
import { minutosDoEncontro, emHoras } from "@/lib/duracao";
import type { AttendanceStatus } from "@/lib/supabase/types";
import type { RelatorioFrequencia, FrequenciaPessoa } from "./types";

interface ReuniaoRealizada {
  id: string;
  inicio: string;
  fim_previsto: string;
  inicio_real: string | null;
  fim_real: string | null;
}

/**
 * Frequência do mês, pessoa a pessoa.
 *
 * Só entram encontros com status `realizada`: é onde existe lista de
 * presença. Quem não tem linha de presença num encontro realizado conta
 * como ausente — a ausência é a falta de registro, não um registro de
 * falta. Falta justificada aparece separada e **não** soma horas, mas
 * continua no denominador do percentual.
 */
export async function getRelatorioFrequencia(
  mesISO: string,
  fusoHorario: string,
): Promise<RelatorioFrequencia> {
  const mes = periodoDoMes(mesISO, fusoHorario);
  const semanas = semanasDoMes(mesISO, fusoHorario);
  const supabase = await createClient();

  // A busca cobre a grade de semanas (que invade os meses vizinhos) porque
  // o recorte semanal precisa dela; os totais do mês filtram depois.
  const { data: dados, error } = await supabase
    .from("meetings")
    .select("id, inicio, fim_previsto, inicio_real, fim_real")
    .eq("status", "realizada")
    .gte("inicio", semanas[0].inicioUtc.toISOString())
    .lt("inicio", semanas[semanas.length - 1].fimUtc.toISOString())
    .order("inicio");
  if (error) throw new Error(error.message);

  const encontros = (dados as ReuniaoRealizada[]) ?? [];
  const ids = encontros.map((e) => e.id);

  const [membros, metas, cargaPorReuniao] = await Promise.all([
    getMembros(),
    getMetasSettings(),
    getCargaHorariaPorReuniao(ids),
  ]);

  let presencas: { meeting_id: string; profile_id: string | null; status: AttendanceStatus }[] =
    [];
  if (ids.length > 0) {
    const { data, error: erroPresenca } = await supabase
      .from("attendance")
      .select("meeting_id, profile_id, status")
      .in("meeting_id", ids);
    if (erroPresenca) throw new Error(erroPresenca.message);
    presencas = data ?? [];
  }

  const minutosPorEncontro = new Map(
    encontros.map((e) => [e.id, minutosDoEncontro(e, cargaPorReuniao.get(e.id))]),
  );
  const encontrosDoMes = encontros.filter((e) => {
    const inicio = new Date(e.inicio);
    return inicio >= mes.inicioUtc && inicio < mes.fimUtc;
  });
  const idsDoMes = new Set(encontrosDoMes.map((e) => e.id));

  // status por (pessoa, encontro), para não varrer a lista inteira por pessoa
  const statusPorPessoa = new Map<string, Map<string, AttendanceStatus>>();
  for (const p of presencas) {
    if (!p.profile_id) continue; // visitante não entra na frequência do grupo
    const daPessoa = statusPorPessoa.get(p.profile_id) ?? new Map();
    daPessoa.set(p.meeting_id, p.status);
    statusPorPessoa.set(p.profile_id, daPessoa);
  }

  const pessoas: FrequenciaPessoa[] = membros
    .filter((m) => m.status === "ativo")
    .map((membro) => {
      const daPessoa = statusPorPessoa.get(membro.id) ?? new Map<string, AttendanceStatus>();

      let presentes = 0;
      let justificadas = 0;
      let minutos = 0;
      for (const id of idsDoMes) {
        const status = daPessoa.get(id);
        if (status === "presente") {
          presentes += 1;
          minutos += minutosPorEncontro.get(id) ?? 0;
        } else if (status === "justificado") {
          justificadas += 1;
        }
      }

      return {
        perfilId: membro.id,
        nome: membro.nome_exibicao,
        nomeCompleto: membro.nome_completo,
        presentes,
        justificadas,
        ausentes: idsDoMes.size - presentes - justificadas,
        minutos,
        percentual: idsDoMes.size === 0 ? 0 : Math.round((presentes / idsDoMes.size) * 100),
        semanas: semanas.map((semana) => {
          const naSemana = encontros.filter((e) => {
            const inicio = new Date(e.inicio);
            return (
              inicio >= semana.inicioUtc &&
              inicio < semana.fimUtc &&
              daPessoa.get(e.id) === "presente"
            );
          });
          const minutosSemana = naSemana.reduce(
            (soma, e) => soma + (minutosPorEncontro.get(e.id) ?? 0),
            0,
          );
          return {
            inicioISO: semana.inicioISO,
            fimISO: semana.fimISO,
            encontros: naSemana.length,
            minutos: minutosSemana,
            cumpreEncontros: naSemana.length >= metas.encontros_por_semana,
            cumpreHoras: emHoras(minutosSemana) >= metas.horas_por_semana,
          };
        }),
      };
    })
    .sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));

  return {
    mesISO,
    metaEncontros: metas.encontros_por_semana,
    metaHoras: metas.horas_por_semana,
    totalEncontros: idsDoMes.size,
    pessoas,
  };
}
