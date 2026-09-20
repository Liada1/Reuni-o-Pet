import { MapPin, Video } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { formatarDiaSemana, formatarData, formatarHora } from "@/lib/dates";
import { cn } from "@/lib/utils";
import type { OpcaoComVotos } from "../types";

interface OpcaoCardProps {
  opcao: OpcaoComVotos;
  fusoHorario: string;
  votosVisiveis: boolean;
  destaque?: boolean;
  children?: React.ReactNode;
}

export function OpcaoHeader({ opcao, fusoHorario, destaque }: Omit<OpcaoCardProps, "votosVisiveis">) {
  return (
    <div>
      <p className="font-mono text-sm font-semibold text-ink">
        {formatarDiaSemana(opcao.inicio, fusoHorario)}{" "}
        {formatarData(opcao.inicio, fusoHorario)} · {formatarHora(opcao.inicio, fusoHorario)}
        {destaque && <span className="ml-2 text-accent">●</span>}
      </p>
      <p className="mt-0.5 flex items-center gap-1.5 text-xs text-ink-muted">
        {opcao.modalidade === "presencial" ? (
          <>
            <MapPin className="h-3.5 w-3.5" strokeWidth={1.75} />
            {opcao.locations?.nome ?? "Local a definir"}
          </>
        ) : (
          <>
            <Video className="h-3.5 w-3.5" strokeWidth={1.75} />
            Online
          </>
        )}
      </p>
    </div>
  );
}

export function PilhaAvatares({
  votos,
}: {
  votos: { profiles: { nome_exibicao: string; foto_url: string | null } | null }[];
}) {
  const visiveis = votos.slice(0, 5);
  const resto = votos.length - visiveis.length;
  return (
    <div className="flex items-center">
      {visiveis.map((v, i) => (
        <Avatar
          key={i}
          nome={v.profiles?.nome_exibicao ?? "?"}
          fotoUrl={v.profiles?.foto_url}
          tamanho="sm"
          className={cn("ring-2 ring-surface", i > 0 && "-ml-2")}
        />
      ))}
      {resto > 0 && (
        <span className="-ml-2 flex h-7 w-7 items-center justify-center rounded-full bg-paper text-[10px] font-medium text-ink-muted ring-2 ring-surface">
          +{resto}
        </span>
      )}
    </div>
  );
}
