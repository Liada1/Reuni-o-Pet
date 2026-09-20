import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

interface EstadoVazioProps {
  icone: LucideIcon;
  titulo: string;
  descricao?: string;
  acao?: ReactNode;
}

export function EstadoVazio({ icone: Icone, titulo, descricao, acao }: EstadoVazioProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-[var(--radius-panel)] border border-dashed border-border px-6 py-12 text-center">
      <Icone className="h-8 w-8 text-ink-muted" strokeWidth={1.5} />
      <p className="font-medium text-ink">{titulo}</p>
      {descricao && <p className="max-w-sm text-sm text-ink-muted">{descricao}</p>}
      {acao}
    </div>
  );
}
