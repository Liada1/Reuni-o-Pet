import { Cloud, CloudOff, Loader2 } from "lucide-react";
import type { StatusSync } from "@/lib/offline/sync";

const CONFIG: Record<StatusSync, { texto: string; icone: typeof Cloud; cor: string }> = {
  salvo: { texto: "Salvo", icone: Cloud, cor: "text-primary" },
  salvando: { texto: "Salvando…", icone: Loader2, cor: "text-ink-muted" },
  offline: { texto: "Sem internet — salvo neste aparelho", icone: CloudOff, cor: "text-accent" },
  erro: { texto: "Não sincronizou ainda — tentando de novo", icone: CloudOff, cor: "text-alert" },
};

export function IndicadorStatus({ status }: { status: StatusSync }) {
  const { texto, icone: Icone, cor } = CONFIG[status];
  return (
    <span
      role="status"
      aria-live="polite"
      className={`flex items-center gap-1.5 text-xs font-medium ${cor}`}
    >
      <Icone
        aria-hidden="true"
        className={`h-3.5 w-3.5 ${status === "salvando" ? "animate-spin" : ""}`}
        strokeWidth={1.75}
      />
      {texto}
    </span>
  );
}
