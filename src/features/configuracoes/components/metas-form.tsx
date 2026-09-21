"use client";

import { useState, useTransition } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { atualizarMetas } from "../actions";
import type { MetasSettings } from "../types";

interface TipoEncontro {
  id: string;
  nome: string;
  ativo: boolean;
}

export function MetasForm({
  inicial,
  tiposEncontro,
}: {
  inicial: MetasSettings;
  tiposEncontro: TipoEncontro[];
}) {
  const [dados, setDados] = useState(inicial);
  const [pending, startTransition] = useTransition();
  const [salvo, setSalvo] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const tiposAtivos = tiposEncontro.filter((t) => t.ativo);

  function alternarTipo(id: string, marcado: boolean) {
    setDados({
      ...dados,
      tipos_obrigatorios_por_mes: marcado
        ? [...dados.tipos_obrigatorios_por_mes, id]
        : dados.tipos_obrigatorios_por_mes.filter((t) => t !== id),
    });
  }

  function salvar() {
    setSalvo(false);
    setErro(null);
    startTransition(async () => {
      try {
        await atualizarMetas(dados);
        setSalvo(true);
      } catch (e) {
        setErro(e instanceof Error ? e.message : "Não foi possível salvar as metas.");
      }
    });
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="meta_encontros">Encontros por semana</Label>
          <Input
            id="meta_encontros"
            type="number"
            min={0}
            value={dados.encontros_por_semana}
            onChange={(e) =>
              setDados({ ...dados, encontros_por_semana: Number(e.target.value) })
            }
          />
        </div>
        <div>
          <Label htmlFor="meta_horas">Horas por semana</Label>
          <Input
            id="meta_horas"
            type="number"
            min={0}
            step="0.5"
            value={dados.horas_por_semana}
            onChange={(e) => setDados({ ...dados, horas_por_semana: Number(e.target.value) })}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Tipos obrigatórios por mês</Label>
        <p className="text-xs text-ink-muted">
          O planejador avisa quando o mês termina sem nenhum encontro destes tipos.
        </p>
        <div className="flex flex-wrap gap-x-4 gap-y-2">
          {tiposAtivos.map((tipo) => (
            <label key={tipo.id} className="flex items-center gap-2 text-sm text-ink">
              <input
                type="checkbox"
                checked={dados.tipos_obrigatorios_por_mes.includes(tipo.id)}
                onChange={(e) => alternarTipo(tipo.id, e.target.checked)}
              />
              {tipo.nome}
            </label>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Button type="button" onClick={salvar} disabled={pending}>
          {pending ? "Salvando…" : "Salvar"}
        </Button>
        {salvo && <span className="text-sm text-primary">Salvo.</span>}
        {erro && <span className="text-sm text-alert">{erro}</span>}
      </div>
    </div>
  );
}
