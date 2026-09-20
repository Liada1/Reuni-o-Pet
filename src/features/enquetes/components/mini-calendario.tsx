"use client";

import { useState } from "react";
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  addMonths,
  subMonths,
  format,
  isSameMonth,
  isToday,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface MiniCalendarioProps {
  selecionadas: Set<string>;
  onToggle: (dataISO: string) => void;
}

export function MiniCalendario({ selecionadas, onToggle }: MiniCalendarioProps) {
  const [mesAtual, setMesAtual] = useState(() => startOfMonth(new Date()));

  const inicio = startOfWeek(startOfMonth(mesAtual), { weekStartsOn: 1 });
  const fim = endOfWeek(endOfMonth(mesAtual), { weekStartsOn: 1 });
  const dias = eachDayOfInterval({ start: inicio, end: fim });

  return (
    <div className="rounded-[var(--radius-panel)] border border-border bg-surface p-3">
      <div className="mb-2 flex items-center justify-between">
        <button
          type="button"
          onClick={() => setMesAtual((m) => subMonths(m, 1))}
          className="rounded-[var(--radius-control)] p-1.5 text-ink-muted hover:bg-paper"
          aria-label="Mês anterior"
        >
          <ChevronLeft className="h-4 w-4" strokeWidth={1.75} />
        </button>
        <p className="text-sm font-medium capitalize text-ink">
          {format(mesAtual, "MMMM 'de' yyyy", { locale: ptBR })}
        </p>
        <button
          type="button"
          onClick={() => setMesAtual((m) => addMonths(m, 1))}
          className="rounded-[var(--radius-control)] p-1.5 text-ink-muted hover:bg-paper"
          aria-label="Próximo mês"
        >
          <ChevronRight className="h-4 w-4" strokeWidth={1.75} />
        </button>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center">
        {["SEG", "TER", "QUA", "QUI", "SEX", "SÁB", "DOM"].map((d) => (
          <span key={d} className="py-1 font-mono text-[10px] text-ink-muted">
            {d}
          </span>
        ))}
        {dias.map((dia) => {
          const iso = format(dia, "yyyy-MM-dd");
          const selecionado = selecionadas.has(iso);
          return (
            <button
              key={iso}
              type="button"
              onClick={() => onToggle(iso)}
              className={cn(
                "aspect-square rounded-[var(--radius-control)] font-mono text-xs",
                !isSameMonth(dia, mesAtual) && "text-ink-muted/40",
                isSameMonth(dia, mesAtual) && !selecionado && "text-ink hover:bg-paper",
                selecionado && "bg-primary text-white",
                isToday(dia) && !selecionado && "font-semibold text-primary",
              )}
            >
              {format(dia, "d")}
            </button>
          );
        })}
      </div>
    </div>
  );
}
