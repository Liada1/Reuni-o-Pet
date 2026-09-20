"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { BotaoCopiar } from "@/components/ui/botao-copiar";
import { revogarConvite } from "../actions";
import type { ConviteComGat } from "../types";
import type { ProfileRole } from "@/lib/supabase/types";

const NOMES_PAPEL: Record<ProfileRole, string> = {
  coordenacao: "Coordenação",
  participante: "Participante",
  relator: "Relator(a)",
};

export function ConvitesAtivosLista({ convites }: { convites: ConviteComGat[] }) {
  const [pending, startTransition] = useTransition();

  if (convites.length === 0) return null;

  return (
    <ul className="space-y-2">
      {convites.map((c) => {
        const link =
          typeof window !== "undefined"
            ? `${window.location.origin}/convite/${c.code}`
            : `/convite/${c.code}`;
        const expirado = c.expires_at ? new Date(c.expires_at) < new Date() : false;

        return (
          <li
            key={c.id}
            className="flex flex-wrap items-center gap-3 rounded-[var(--radius-panel)] border border-border bg-surface p-3 text-sm"
          >
            <span className="font-mono text-ink">{c.code}</span>
            <span className="text-ink-muted">{NOMES_PAPEL[c.role]}</span>
            {c.gats?.nome && <span className="text-ink-muted">· {c.gats.nome}</span>}
            {expirado && <span className="text-alert">expirado</span>}
            <span className="ml-auto flex gap-2">
              <BotaoCopiar texto={link} label="Copiar link" />
              <Button
                type="button"
                variant="fantasma"
                disabled={pending}
                onClick={() => startTransition(() => revogarConvite(c.id))}
              >
                Revogar
              </Button>
            </span>
          </li>
        );
      })}
    </ul>
  );
}
