"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { BotaoCopiar } from "@/components/ui/botao-copiar";
import { revogarConvite } from "../actions";
import { agora } from "@/lib/dates";
import type { ConviteComGat } from "../types";
import type { ProfileRole } from "@/lib/supabase/types";

const NOMES_PAPEL: Record<ProfileRole, string> = {
  coordenacao: "Coordenação",
  participante: "Participante",
  relator: "Relator(a)",
};

export function ConvitesAtivosLista({
  convites,
  origin,
}: {
  convites: ConviteComGat[];
  origin: string;
}) {
  const [pending, startTransition] = useTransition();
  const [erro, setErro] = useState<string | null>(null);

  if (convites.length === 0) return null;

  function revogar(id: string) {
    setErro(null);
    startTransition(async () => {
      try {
        await revogarConvite(id);
      } catch (e) {
        setErro(e instanceof Error ? e.message : "Não foi possível revogar o convite.");
      }
    });
  }

  return (
    <div className="space-y-2">
      {erro && (
        <p role="alert" className="text-sm text-alert">
          {erro}
        </p>
      )}
      <ul className="space-y-2">
        {convites.map((c) => {
          const link = `${origin}/convite/${c.code}`;
          const expirado = c.expires_at ? new Date(c.expires_at) < agora() : false;

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
                  onClick={() => revogar(c.id)}
                >
                  Revogar
                </Button>
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
