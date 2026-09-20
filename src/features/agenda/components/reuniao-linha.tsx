import Link from "next/link";
import { MapPin, Video } from "lucide-react";
import { Surface } from "@/components/ui/surface";
import { cn } from "@/lib/utils";
import { formatarHora } from "@/lib/dates";
import type { ReuniaoComDetalhes } from "../types";

export function ReuniaoLinha({
  reuniao,
  fusoHorario,
}: {
  reuniao: ReuniaoComDetalhes;
  fusoHorario: string;
}) {
  return (
    <Link href={`/reunioes/${reuniao.id}`}>
      <Surface
        className={cn(
          "flex items-center gap-3 p-3 transition-colors hover:bg-paper",
          reuniao.status === "cancelada" && "opacity-60",
        )}
      >
        <span
          className="h-full min-h-8 w-1 shrink-0 rounded-full"
          style={{ backgroundColor: reuniao.meeting_types?.cor ?? "#2F6B4F" }}
        />
        <span className="w-14 shrink-0 font-mono text-sm text-ink">
          {formatarHora(reuniao.inicio, fusoHorario)}
        </span>
        <div className="min-w-0 flex-1">
          <p
            className={cn(
              "truncate text-sm font-medium text-ink",
              reuniao.status === "cancelada" && "line-through",
            )}
          >
            {reuniao.titulo || reuniao.meeting_types?.nome}
          </p>
          <p className="flex items-center gap-1 truncate text-xs text-ink-muted">
            {reuniao.modalidade === "presencial" ? (
              <>
                <MapPin className="h-3 w-3 shrink-0" strokeWidth={1.75} />
                {reuniao.locations?.nome ?? "Local a definir"}
              </>
            ) : (
              <>
                <Video className="h-3 w-3 shrink-0" strokeWidth={1.75} />
                Online
              </>
            )}
          </p>
        </div>
        {reuniao.status === "cancelada" && (
          <span className="shrink-0 text-xs font-medium text-alert">Cancelada</span>
        )}
        {reuniao.status === "realizada" && (
          <span className="shrink-0 text-xs font-medium text-ink-muted">Realizada</span>
        )}
      </Surface>
    </Link>
  );
}
