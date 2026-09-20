"use client";

import { useState, useTransition } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { atualizarPerfisNomes } from "../actions";
import type { PerfisNomesSettings } from "../types";

export function PerfisNomesForm({ inicial }: { inicial: PerfisNomesSettings }) {
  const [dados, setDados] = useState(inicial);
  const [pending, startTransition] = useTransition();
  const [salvo, setSalvo] = useState(false);

  function salvar() {
    setSalvo(false);
    startTransition(async () => {
      await atualizarPerfisNomes(dados);
      setSalvo(true);
    });
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <Label htmlFor="p_coordenacao">Coordenação</Label>
          <Input
            id="p_coordenacao"
            value={dados.coordenacao}
            onChange={(e) => setDados({ ...dados, coordenacao: e.target.value })}
          />
        </div>
        <div>
          <Label htmlFor="p_participante">Participante</Label>
          <Input
            id="p_participante"
            value={dados.participante}
            onChange={(e) => setDados({ ...dados, participante: e.target.value })}
          />
        </div>
        <div>
          <Label htmlFor="p_relator">Relator(a)</Label>
          <Input
            id="p_relator"
            value={dados.relator}
            onChange={(e) => setDados({ ...dados, relator: e.target.value })}
          />
        </div>
      </div>
      <div className="flex items-center gap-3">
        <Button type="button" onClick={salvar} disabled={pending}>
          {pending ? "Salvando…" : "Salvar"}
        </Button>
        {salvo && <span className="text-sm text-primary">Salvo.</span>}
      </div>
    </div>
  );
}
