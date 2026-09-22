"use client";

import { useState } from "react";
import { CheckCircle2, ListTodo, HelpCircle, StickyNote } from "lucide-react";
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { NotaLocal } from "@/lib/offline/types";
import type { NoteTipo } from "@/lib/supabase/types";

interface Membro {
  id: string;
  nome_exibicao: string;
}

const CONFIG_TIPO: Record<NoteTipo, { rotulo: string; icone: typeof StickyNote; cor: string }> = {
  nota: { rotulo: "Nota", icone: StickyNote, cor: "text-ink-muted" },
  decisao: { rotulo: "Decisão", icone: CheckCircle2, cor: "text-primary" },
  encaminhamento: { rotulo: "Encaminhamento", icone: ListTodo, cor: "text-accent" },
  duvida: { rotulo: "Dúvida", icone: HelpCircle, cor: "text-alert" },
};

export function NotaItem({
  nota,
  membros,
  fusoHorario,
  onRetag,
}: {
  nota: NotaLocal;
  membros: Membro[];
  fusoHorario: string;
  onRetag: (
    tipo: NoteTipo,
    extra?: { responsavelId?: string | null; prazo?: string | null },
  ) => void;
}) {
  const [formEncaminhamento, setFormEncaminhamento] = useState(false);
  const [responsavelId, setResponsavelId] = useState(nota.responsavelId ?? "");
  const [prazo, setPrazo] = useState(nota.prazo ?? "");
  const config = CONFIG_TIPO[nota.tipo];
  const Icone = config.icone;

  function escolherTipo(tipo: NoteTipo) {
    if (tipo === "encaminhamento") {
      setFormEncaminhamento(true);
      return;
    }
    onRetag(tipo);
  }

  function confirmarEncaminhamento() {
    if (!responsavelId) return;
    onRetag("encaminhamento", { responsavelId, prazo: prazo || null });
    setFormEncaminhamento(false);
  }

  const hora = new Intl.DateTimeFormat("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: fusoHorario,
  }).format(new Date(nota.hora));

  return (
    <div className="rounded-[var(--radius-control)] border border-border bg-surface p-2.5">
      <div className="flex items-start gap-2">
        <span className="mt-0.5 font-mono text-[10px] text-ink-muted">{hora}</span>
        <p className="flex-1 text-sm text-ink">{nota.texto}</p>
        <Icone className={cn("h-4 w-4 shrink-0", config.cor)} strokeWidth={1.75} />
      </div>
      <div className="mt-1.5 flex flex-wrap gap-1">
        {(Object.keys(CONFIG_TIPO) as NoteTipo[]).map((tipo) => (
          <button
            key={tipo}
            type="button"
            onClick={() => escolherTipo(tipo)}
            className={cn(
              "rounded-full border px-2 py-1 text-[11px] font-medium",
              nota.tipo === tipo
                ? "border-primary bg-primary/10 text-primary"
                : "border-border text-ink-muted hover:bg-paper",
            )}
          >
            {CONFIG_TIPO[tipo].rotulo}
          </button>
        ))}
      </div>
      {formEncaminhamento && (
        <div className="mt-2 flex flex-wrap items-center gap-2 rounded-[var(--radius-control)] bg-paper p-2">
          <Select
            aria-label="Responsável pelo encaminhamento"
            value={responsavelId}
            onChange={(e) => setResponsavelId(e.target.value)}
            className="max-w-[160px]"
          >
            <option value="">Responsável</option>
            {membros.map((m) => (
              <option key={m.id} value={m.id}>
                {m.nome_exibicao}
              </option>
            ))}
          </Select>
          <Input
            type="date"
            aria-label="Prazo do encaminhamento"
            value={prazo}
            onChange={(e) => setPrazo(e.target.value)}
            className="w-auto"
          />
          <Button type="button" onClick={confirmarEncaminhamento} disabled={!responsavelId}>
            Confirmar
          </Button>
        </div>
      )}
    </div>
  );
}
