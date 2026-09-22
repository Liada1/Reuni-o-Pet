"use client";

import { useState } from "react";
import { UserCheck, UserX, UserMinus, UserPlus } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { PresencaLocal } from "@/lib/offline/types";
import type { AttendanceStatus } from "@/lib/supabase/types";

interface MembroEsperado {
  id: string;
  nome_exibicao: string;
  foto_url: string | null;
}

interface PresencaListaProps {
  presencas: PresencaLocal[];
  membros: MembroEsperado[];
  onMarcar: (presencaId: string, status: AttendanceStatus) => void;
  onMarcarTodos: () => void;
  onAdicionarVisitante: (nome: string, instituicao: string) => void;
}

const CICLO: AttendanceStatus[] = ["ausente", "presente", "justificado"];

const ICONE: Record<AttendanceStatus, typeof UserCheck> = {
  presente: UserCheck,
  ausente: UserX,
  justificado: UserMinus,
};

const ROTULO: Record<AttendanceStatus, string> = {
  presente: "presente",
  ausente: "ausente",
  justificado: "falta justificada",
};

const ESTILO: Record<AttendanceStatus, string> = {
  presente: "border-primary bg-primary/10 text-primary",
  ausente: "border-border text-ink-muted",
  justificado: "border-accent bg-accent/20 text-ink",
};

export function PresencaLista({
  presencas,
  membros,
  onMarcar,
  onMarcarTodos,
  onAdicionarVisitante,
}: PresencaListaProps) {
  const [aberto, setAberto] = useState(false);
  const [nomeVisitante, setNomeVisitante] = useState("");
  const [instituicaoVisitante, setInstituicaoVisitante] = useState("");

  const membrosPorId = new Map(membros.map((m) => [m.id, m]));
  const presentesCount = presencas.filter((p) => p.status === "presente").length;

  function proximoStatus(atual: AttendanceStatus) {
    const i = CICLO.indexOf(atual);
    return CICLO[(i + 1) % CICLO.length];
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {presencas.map((p) => {
          const membro = p.profileId ? membrosPorId.get(p.profileId) : null;
          const nome = membro?.nome_exibicao ?? p.visitanteNome ?? "?";
          const Icone = ICONE[p.status];
          return (
            <button
              key={p.id}
              type="button"
              aria-label={`${nome}: ${ROTULO[p.status]}. Tocar para marcar como ${ROTULO[proximoStatus(p.status)]}`}
              onClick={() => onMarcar(p.id, proximoStatus(p.status))}
              className={cn(
                "flex min-h-[48px] items-center gap-2 rounded-full border pl-1 pr-3 py-1",
                ESTILO[p.status],
              )}
            >
              <Avatar nome={nome} fotoUrl={membro?.foto_url} tamanho="sm" />
              <span className="text-sm font-medium">{nome}</span>
              <Icone className="h-4 w-4" strokeWidth={1.75} />
            </button>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs text-ink-muted">
          {presentesCount} {presentesCount === 1 ? "presente" : "presentes"}
        </span>
        <Button type="button" variant="secundario" onClick={onMarcarTodos}>
          Marcar todos presentes
        </Button>
        <Button type="button" variant="fantasma" onClick={() => setAberto((v) => !v)}>
          <UserPlus className="h-4 w-4" strokeWidth={1.75} />
          Visitante
        </Button>
      </div>

      {aberto && (
        <div className="flex flex-wrap items-center gap-2 rounded-[var(--radius-panel)] border border-border bg-paper p-3">
          <Input
            aria-label="Nome do visitante"
            placeholder="Nome do visitante"
            value={nomeVisitante}
            onChange={(e) => setNomeVisitante(e.target.value)}
            className="max-w-xs"
          />
          <Input
            aria-label="Instituição do visitante (opcional)"
            placeholder="Instituição (opcional)"
            value={instituicaoVisitante}
            onChange={(e) => setInstituicaoVisitante(e.target.value)}
            className="max-w-xs"
          />
          <Button
            type="button"
            onClick={() => {
              if (!nomeVisitante.trim()) return;
              onAdicionarVisitante(nomeVisitante.trim(), instituicaoVisitante.trim());
              setNomeVisitante("");
              setInstituicaoVisitante("");
              setAberto(false);
            }}
          >
            Adicionar
          </Button>
        </div>
      )}
    </div>
  );
}
