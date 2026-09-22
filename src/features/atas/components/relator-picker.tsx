"use client";

import { useTransition } from "react";
import { Select } from "@/components/ui/select";
import { designarRelator } from "../actions";

interface Membro {
  id: string;
  nome_exibicao: string;
}

export function RelatorPicker({
  meetingId,
  relatorId,
  membros,
}: {
  meetingId: string;
  relatorId: string | null;
  membros: Membro[];
}) {
  const [pending, startTransition] = useTransition();

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-ink-muted">Relator(a) desta reunião:</span>
      <Select
        aria-label="Relator(a) desta reunião"
        value={relatorId ?? ""}
        disabled={pending}
        onChange={(e) =>
          startTransition(() => designarRelator(meetingId, e.target.value || null))
        }
        className="w-auto"
      >
        <option value="">Coordenação (padrão)</option>
        {membros.map((m) => (
          <option key={m.id} value={m.id}>
            {m.nome_exibicao}
          </option>
        ))}
      </Select>
    </div>
  );
}
