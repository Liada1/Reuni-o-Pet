"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Pencil, Trash2, X, Check } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { formatarMinutos } from "@/lib/duracao";
import { formatarData } from "@/lib/dates";
import { atualizarFormacao, removerFormacao } from "../actions";
import type { ReuniaoComDetalhes } from "@/features/agenda";
import type { Formacao } from "../types";

export function FormacaoItem({
  formacao,
  reuniao,
  podeEditar,
  fusoHorario,
}: {
  formacao: Formacao;
  reuniao: ReuniaoComDetalhes;
  podeEditar: boolean;
  fusoHorario: string;
}) {
  const [editando, setEditando] = useState(false);
  const [tema, setTema] = useState(formacao.tema);
  const [horas, setHoras] = useState(String(formacao.carga_horaria_minutos / 60));
  const [pending, startTransition] = useTransition();
  const [erro, setErro] = useState<string | null>(null);

  function salvar() {
    setErro(null);
    startTransition(async () => {
      try {
        await atualizarFormacao(formacao.id, {
          tema,
          cargaHorariaMinutos: Math.round(Number(horas) * 60),
        });
        setEditando(false);
      } catch (e) {
        setErro(e instanceof Error ? e.message : "Não foi possível salvar.");
      }
    });
  }

  function remover() {
    setErro(null);
    startTransition(async () => {
      try {
        await removerFormacao(formacao.id);
      } catch (e) {
        setErro(e instanceof Error ? e.message : "Não foi possível remover.");
      }
    });
  }

  if (editando) {
    return (
      <div className="space-y-2 rounded-[var(--radius-control)] border border-border bg-paper p-3">
        <Input
          aria-label="Tema da formação"
          value={tema}
          onChange={(e) => setTema(e.target.value)}
          placeholder="Tema"
        />
        <div className="flex items-center gap-2">
          <Input
            type="number"
            min={0.5}
            step="0.5"
            aria-label="Horas certificadas da formação"
            value={horas}
            onChange={(e) => setHoras(e.target.value)}
            className="w-28"
          />
          <span className="text-sm text-ink-muted">horas</span>
          <Button type="button" onClick={salvar} disabled={pending} className="ml-auto">
            <Check className="h-4 w-4" strokeWidth={1.75} />
            Salvar
          </Button>
          <Button
            type="button"
            variant="fantasma"
            aria-label="Cancelar edição"
            onClick={() => setEditando(false)}
          >
            <X className="h-4 w-4" strokeWidth={1.75} />
          </Button>
        </div>
        {erro && <p className="text-sm text-alert">{erro}</p>}
      </div>
    );
  }

  return (
    <div className="flex items-start gap-3 rounded-[var(--radius-control)] border border-border bg-surface p-3">
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-ink">{formacao.tema}</p>
        <p className="text-xs text-ink-muted">
          {formatarData(reuniao.inicio, fusoHorario)} ·{" "}
          {formatarMinutos(formacao.carga_horaria_minutos)} ·{" "}
          <Link href={`/reunioes/${reuniao.id}`} className="underline">
            ver encontro
          </Link>
        </p>
        {erro && <p className="text-sm text-alert">{erro}</p>}
      </div>
      {podeEditar && (
        <div className="flex shrink-0 gap-1">
          <button
            type="button"
            onClick={() => setEditando(true)}
            className="p-1 text-ink-muted hover:text-ink"
            aria-label="Editar formação"
          >
            <Pencil className="h-4 w-4" strokeWidth={1.75} />
          </button>
          <button
            type="button"
            onClick={remover}
            disabled={pending}
            className="p-1 text-ink-muted hover:text-alert"
            aria-label="Remover formação"
          >
            <Trash2 className="h-4 w-4" strokeWidth={1.75} />
          </button>
        </div>
      )}
    </div>
  );
}
