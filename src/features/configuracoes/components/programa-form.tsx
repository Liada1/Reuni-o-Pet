"use client";

import { useState, useTransition } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { atualizarPrograma } from "../actions";
import { LogoUpload } from "./logo-upload";
import type { ProgramaSettings } from "../types";

const FUSOS = [
  "America/Fortaleza",
  "America/Sao_Paulo",
  "America/Manaus",
  "America/Belem",
  "America/Rio_Branco",
];

export function ProgramaForm({ inicial }: { inicial: ProgramaSettings }) {
  const [dados, setDados] = useState(inicial);
  const [pending, startTransition] = useTransition();
  const [salvo, setSalvo] = useState(false);

  function salvar() {
    setSalvo(false);
    startTransition(async () => {
      await atualizarPrograma(dados);
      setSalvo(true);
    });
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="nome_programa">Nome do programa</Label>
          <Input
            id="nome_programa"
            value={dados.nome_programa}
            onChange={(e) => setDados({ ...dados, nome_programa: e.target.value })}
          />
        </div>
        <div>
          <Label htmlFor="nome_grupo">Nome do grupo</Label>
          <Input
            id="nome_grupo"
            value={dados.nome_grupo}
            onChange={(e) => setDados({ ...dados, nome_grupo: e.target.value })}
          />
        </div>
      </div>
      <div className="max-w-xs">
        <Label htmlFor="fuso">Fuso horário</Label>
        <Select
          id="fuso"
          value={dados.fuso_horario}
          onChange={(e) => setDados({ ...dados, fuso_horario: e.target.value })}
        >
          {FUSOS.map((f) => (
            <option key={f} value={f}>
              {f}
            </option>
          ))}
        </Select>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <LogoUpload
          label="Logo do PET"
          urlAtual={dados.logo_pet_url}
          onChange={(url) => setDados({ ...dados, logo_pet_url: url })}
        />
        <LogoUpload
          label="Logo da instituição"
          urlAtual={dados.logo_instituicao_url}
          onChange={(url) => setDados({ ...dados, logo_instituicao_url: url })}
        />
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
