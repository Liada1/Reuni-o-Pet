import Link from "next/link";
import { Plus } from "lucide-react";
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  addMonths,
  subMonths,
  addWeeks,
  subWeeks,
  format,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import { toZonedTime } from "date-fns-tz";
import { getCurrentProfile } from "@/features/auth";
import { getProgramaSettings } from "@/features/configuracoes";
import { getReunioes } from "@/features/agenda";
import { agora, agoraMaisMs } from "@/lib/dates";
import { MesGrid } from "@/features/agenda/components/mes-grid";
import { Lista } from "@/features/agenda/components/lista";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { isCoordenacao } from "@/lib/permissions";

type Visualizacao = "mes" | "semana" | "lista";

export default async function AgendaPage({
  searchParams,
}: {
  searchParams: Promise<{ visualizacao?: string; data?: string }>;
}) {
  const { visualizacao: visualizacaoParam, data: dataParam } = await searchParams;
  const visualizacao: Visualizacao =
    visualizacaoParam === "semana" || visualizacaoParam === "lista"
      ? visualizacaoParam
      : "mes";

  const [perfil, programa] = await Promise.all([getCurrentProfile(), getProgramaSettings()]);
  const coordenacao = isCoordenacao(perfil);
  // "hoje" precisa refletir o fuso do grupo, não o do servidor (ex: Vercel
  // roda em UTC, mas o grupo pode estar em America/Fortaleza) — senão o mês
  // corrente e o destaque de "hoje" ficam errados perto da meia-noite.
  const hoje = toZonedTime(agora(), programa.fuso_horario);
  const ancora = dataParam ? new Date(`${dataParam}T00:00:00`) : hoje;

  const mesAncora = startOfMonth(ancora);
  const inicioGrade = startOfWeek(mesAncora, { weekStartsOn: 1 });
  const fimGrade = endOfWeek(endOfMonth(mesAncora), { weekStartsOn: 1 });
  const diasDoMes = eachDayOfInterval({ start: inicioGrade, end: fimGrade });

  const inicioSemana = startOfWeek(ancora, { weekStartsOn: 1 });
  const fimSemana = endOfWeek(ancora, { weekStartsOn: 1 });

  let conteudo: React.ReactNode;

  if (visualizacao === "lista") {
    const reunioes = await getReunioes({
      inicio: agora(),
      fim: agoraMaisMs(180 * 86_400_000),
    });
    conteudo = <Lista reunioes={reunioes} fusoHorario={programa.fuso_horario} />;
  } else if (visualizacao === "semana") {
    const reunioes = await getReunioes({
      inicio: inicioSemana,
      fim: new Date(fimSemana.getTime() + 86_400_000),
    });
    conteudo = <Lista reunioes={reunioes} fusoHorario={programa.fuso_horario} />;
  } else {
    const reunioes = await getReunioes({
      inicio: inicioGrade,
      fim: new Date(fimGrade.getTime() + 86_400_000),
    });
    conteudo = (
      <>
        <div className="hidden md:block">
          <MesGrid
            dias={diasDoMes}
            mesAncora={mesAncora}
            hoje={hoje}
            reunioes={reunioes}
            fusoHorario={programa.fuso_horario}
          />
        </div>
        <div className="md:hidden">
          <Lista reunioes={reunioes} fusoHorario={programa.fuso_horario} />
        </div>
      </>
    );
  }

  const anteriorHref =
    visualizacao === "semana"
      ? `/agenda?visualizacao=semana&data=${format(subWeeks(ancora, 1), "yyyy-MM-dd")}`
      : `/agenda?data=${format(subMonths(mesAncora, 1), "yyyy-MM-dd")}`;
  const proximoHref =
    visualizacao === "semana"
      ? `/agenda?visualizacao=semana&data=${format(addWeeks(ancora, 1), "yyyy-MM-dd")}`
      : `/agenda?data=${format(addMonths(mesAncora, 1), "yyyy-MM-dd")}`;

  return (
    <div className="mx-auto max-w-3xl space-y-4 px-4 py-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold text-ink">Agenda</h1>
          {visualizacao !== "lista" && (
            <p className="text-sm capitalize text-ink-muted">
              {visualizacao === "semana"
                ? `Semana de ${format(inicioSemana, "dd/MM")} a ${format(fimSemana, "dd/MM")}`
                : format(mesAncora, "MMMM 'de' yyyy", { locale: ptBR })}
            </p>
          )}
        </div>
        {coordenacao && (
          <Link href="/agenda/nova">
            <Button type="button">
              <Plus className="h-4 w-4" strokeWidth={1.75} />
              Nova reunião
            </Button>
          </Link>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-1">
          {(["mes", "semana", "lista"] as const).map((v) => (
            <Link
              key={v}
              href={v === "mes" ? "/agenda" : `/agenda?visualizacao=${v}`}
              className={cn(
                "rounded-[var(--radius-control)] px-3 py-1.5 text-sm font-medium",
                visualizacao === v ? "bg-primary/10 text-primary" : "text-ink-muted hover:bg-paper",
              )}
            >
              {v === "mes" ? "Mês" : v === "semana" ? "Semana" : "Lista"}
            </Link>
          ))}
        </div>
        {visualizacao !== "lista" && (
          <div className="flex gap-1">
            <Link
              href={anteriorHref}
              className="rounded-[var(--radius-control)] border border-border px-3 py-1.5 text-sm text-ink-muted hover:bg-paper"
            >
              Anterior
            </Link>
            <Link
              href={proximoHref}
              className="rounded-[var(--radius-control)] border border-border px-3 py-1.5 text-sm text-ink-muted hover:bg-paper"
            >
              Próximo
            </Link>
          </div>
        )}
      </div>

      {conteudo}
    </div>
  );
}
