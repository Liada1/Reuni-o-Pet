import Link from "next/link";
import { isSameMonth, isToday, format } from "date-fns";
import { cn } from "@/lib/utils";
import { formatarHora, paraInputData } from "@/lib/dates";
import type { ReuniaoComDetalhes } from "../types";

interface MesGridProps {
  dias: Date[];
  mesAncora: Date;
  reunioes: ReuniaoComDetalhes[];
  fusoHorario: string;
}

export function MesGrid({ dias, mesAncora, reunioes, fusoHorario }: MesGridProps) {
  return (
    <div className="grid grid-cols-7 gap-px overflow-hidden rounded-[var(--radius-panel)] border border-border bg-border">
      {["SEG", "TER", "QUA", "QUI", "SEX", "SÁB", "DOM"].map((d) => (
        <div key={d} className="bg-paper py-1.5 text-center font-mono text-[10px] text-ink-muted">
          {d}
        </div>
      ))}
      {dias.map((dia) => {
        const iso = format(dia, "yyyy-MM-dd");
        const doDia = reunioes.filter((r) => paraInputData(r.inicio, fusoHorario) === iso);
        return (
          <div
            key={iso}
            className={cn(
              "min-h-24 bg-surface p-1.5",
              !isSameMonth(dia, mesAncora) && "bg-paper/60",
            )}
          >
            <p
              className={cn(
                "font-mono text-xs",
                isSameMonth(dia, mesAncora) ? "text-ink-muted" : "text-ink-muted/40",
                isToday(dia) && "font-semibold text-primary",
              )}
            >
              {format(dia, "d")}
            </p>
            <div className="mt-1 space-y-0.5">
              {doDia.slice(0, 3).map((r) => (
                <Link
                  key={r.id}
                  href={`/reunioes/${r.id}`}
                  className={cn(
                    "block truncate rounded px-1 py-0.5 text-[10px] leading-tight text-white",
                    r.status === "cancelada" && "opacity-50 line-through",
                  )}
                  style={{ backgroundColor: r.meeting_types?.cor ?? "#2F6B4F" }}
                >
                  {formatarHora(r.inicio, fusoHorario)} {r.titulo || r.meeting_types?.nome}
                </Link>
              ))}
              {doDia.length > 3 && (
                <p className="text-[10px] text-ink-muted">+{doDia.length - 3}</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
