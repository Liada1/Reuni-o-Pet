import Link from "next/link";
import { ChevronLeft, ChevronRight, CalendarRange } from "lucide-react";
import { getProgramaSettings } from "@/features/configuracoes";
import { getPlanoDoMes, SemanaLinha, ExportarCronograma } from "@/features/planejamento";
import { Surface } from "@/components/ui/surface";
import { EstadoVazio } from "@/components/ui/estado-vazio";
import { mesValido, mesVizinho, rotuloMes } from "@/lib/periodos";
import { formatarMinutos } from "@/lib/duracao";
import { cn } from "@/lib/utils";

export const metadata = { title: "Planejamento" };

export default async function PlanejamentoPage({
  searchParams,
}: {
  searchParams: Promise<{ mes?: string }>;
}) {
  const { mes: mesParam } = await searchParams;
  const programa = await getProgramaSettings();
  const mesISO = mesValido(mesParam, programa.fuso_horario);
  const plano = await getPlanoDoMes(mesISO, programa.fuso_horario);

  const semanasAbaixo = plano.semanas.filter(
    (s) => !(s.cumpreEncontros && s.cumpreHoras),
  ).length;

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-8">
      <div>
        <h1 className="font-display text-2xl font-semibold text-ink">Planejamento</h1>
        <p className="text-sm text-ink-muted">
          O que o grupo programou em cada semana, comparado às metas.
        </p>
      </div>

      <div className="flex items-center justify-between gap-2">
        <Link
          href={`/planejamento?mes=${mesVizinho(mesISO, -1)}`}
          className="flex h-9 w-9 items-center justify-center rounded-[var(--radius-control)] border border-border text-ink-muted hover:bg-paper"
          aria-label="Mês anterior"
        >
          <ChevronLeft className="h-4 w-4" strokeWidth={1.75} />
        </Link>
        <p className="font-display text-lg font-medium text-ink">{rotuloMes(mesISO)}</p>
        <Link
          href={`/planejamento?mes=${mesVizinho(mesISO, 1)}`}
          className="flex h-9 w-9 items-center justify-center rounded-[var(--radius-control)] border border-border text-ink-muted hover:bg-paper"
          aria-label="Próximo mês"
        >
          <ChevronRight className="h-4 w-4" strokeWidth={1.75} />
        </Link>
      </div>

      <Surface className="grid grid-cols-2 gap-4 p-4 sm:grid-cols-3">
        <div>
          <p className="text-xs uppercase tracking-wide text-ink-muted">Encontros no mês</p>
          <p className="font-mono text-xl text-ink">{plano.totalEncontros}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-ink-muted">Carga horária</p>
          <p className="font-mono text-xl text-ink">{formatarMinutos(plano.totalMinutos)}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-ink-muted">Semanas abaixo</p>
          <p
            className={cn(
              "font-mono text-xl",
              semanasAbaixo === 0 ? "text-primary" : "text-alert",
            )}
          >
            {semanasAbaixo} de {plano.semanas.length}
          </p>
        </div>
      </Surface>

      <p className="text-xs text-ink-muted">
        Meta: {plano.metaEncontros}{" "}
        {plano.metaEncontros === 1 ? "encontro" : "encontros"} e {plano.metaHoras}h por
        semana.{" "}
        <Link href="/configuracoes" className="underline">
          Ajustar
        </Link>
      </p>

      {plano.tiposObrigatorios.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-semibold uppercase tracking-wide text-ink-muted">
            Obrigatórios no mês
          </p>
          <div className="flex flex-wrap gap-2">
            {plano.tiposObrigatorios.map((tipo) => (
              <span
                key={tipo.id}
                className={cn(
                  "flex items-center gap-2 rounded-[var(--radius-control)] border px-3 py-1.5 text-sm",
                  tipo.quantidade > 0
                    ? "border-border text-ink"
                    : "border-alert/40 text-alert",
                )}
              >
                <span
                  className="h-1.5 w-1.5 rounded-full"
                  style={{ backgroundColor: tipo.cor }}
                />
                {tipo.nome}
                <span className="font-mono text-xs">
                  {tipo.quantidade > 0 ? `${tipo.quantidade}×` : "faltando"}
                </span>
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-2">
        <p className="text-sm font-semibold uppercase tracking-wide text-ink-muted">
          Semanas
        </p>
        {plano.semanas.map((semana) => (
          <SemanaLinha
            key={semana.inicioISO}
            semana={semana}
            metaEncontros={plano.metaEncontros}
            metaHoras={plano.metaHoras}
            fusoHorario={programa.fuso_horario}
          />
        ))}
      </div>

      {plano.cronograma.length === 0 ? (
        <EstadoVazio
          icone={CalendarRange}
          titulo="Nenhum encontro neste mês"
          descricao="Quando houver encontros agendados, o cronograma aparece aqui e pode ser exportado."
        />
      ) : (
        <ExportarCronograma
          linhas={plano.cronograma}
          mesISO={mesISO}
          totalEncontros={plano.totalEncontros}
          totalMinutos={plano.totalMinutos}
          fusoHorario={programa.fuso_horario}
          programa={{
            nomePrograma: programa.nome_programa,
            nomeGrupo: programa.nome_grupo,
            logoPetUrl: programa.logo_pet_url,
            logoInstituicaoUrl: programa.logo_instituicao_url,
          }}
        />
      )}
    </div>
  );
}
