"use client";

import { useState, useTransition } from "react";
import { Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { formatarData } from "@/lib/dates";
import { registrarFormacao } from "../actions";
import type { ReuniaoComDetalhes } from "@/features/agenda";

export function RegistrarFormacao({
  reunioesDisponiveis,
  fusoHorario,
}: {
  reunioesDisponiveis: ReuniaoComDetalhes[];
  fusoHorario: string;
}) {
  const [aberto, setAberto] = useState(false);
  const [meetingId, setMeetingId] = useState("");
  const [tema, setTema] = useState("");
  const [horas, setHoras] = useState("2");
  const [pending, startTransition] = useTransition();
  const [erro, setErro] = useState<string | null>(null);

  function registrar() {
    setErro(null);
    startTransition(async () => {
      try {
        await registrarFormacao({
          meetingId,
          tema,
          cargaHorariaMinutos: Math.round(Number(horas) * 60),
        });
        setAberto(false);
        setMeetingId("");
        setTema("");
        setHoras("2");
      } catch (e) {
        setErro(e instanceof Error ? e.message : "Não foi possível registrar.");
      }
    });
  }

  if (reunioesDisponiveis.length === 0) {
    return (
      <p className="text-xs text-ink-muted">
        Nenhum encontro deste bimestre está livre para virar formação.
      </p>
    );
  }

  if (!aberto) {
    return (
      <Button type="button" variant="secundario" onClick={() => setAberto(true)}>
        <Plus className="h-4 w-4" strokeWidth={1.75} />
        Registrar formação
      </Button>
    );
  }

  return (
    <div className="space-y-2 rounded-[var(--radius-control)] border border-border bg-paper p-3">
      <Select
        aria-label="Encontro da formação"
        value={meetingId}
        onChange={(e) => setMeetingId(e.target.value)}
      >
        <option value="">Escolha o encontro…</option>
        {reunioesDisponiveis.map((r) => (
          <option key={r.id} value={r.id}>
            {formatarData(r.inicio, fusoHorario)} —{" "}
            {r.titulo || r.meeting_types?.nome || "Encontro"}
          </option>
        ))}
      </Select>
      <Input
        aria-label="Tema da formação"
        value={tema}
        onChange={(e) => setTema(e.target.value)}
        placeholder="Tema da formação"
      />
      <div className="flex items-center gap-2">
        <Input
          type="number"
          min={0.5}
          step="0.5"
          aria-label="Horas certificadas"
          value={horas}
          onChange={(e) => setHoras(e.target.value)}
          className="w-28"
        />
        <span className="text-sm text-ink-muted">horas certificadas</span>
        <Button
          type="button"
          onClick={registrar}
          disabled={pending || !meetingId || !tema.trim()}
          className="ml-auto"
        >
          {pending ? "Registrando…" : "Registrar"}
        </Button>
        <Button type="button" variant="fantasma" onClick={() => setAberto(false)}>
          Cancelar
        </Button>
      </div>
      {erro && <p className="text-sm text-alert">{erro}</p>}
    </div>
  );
}
