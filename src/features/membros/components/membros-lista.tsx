"use client";

import { useState, useTransition } from "react";
import { Avatar } from "@/components/ui/avatar";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { EstadoVazio } from "@/components/ui/estado-vazio";
import { Users } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  aprovarMembro,
  desativarMembro,
  reativarMembro,
  atualizarPapelEGat,
} from "../actions";
import type { Database, ProfileRole, ProfileStatus } from "@/lib/supabase/types";
import type { MembroComGat } from "../types";

type Gat = Database["public"]["Tables"]["gats"]["Row"];

const ABAS: { chave: ProfileStatus; nome: string }[] = [
  { chave: "pendente", nome: "Pendentes" },
  { chave: "ativo", nome: "Ativos" },
  { chave: "inativo", nome: "Inativos" },
];

export function MembrosLista({ membros, gats }: { membros: MembroComGat[]; gats: Gat[] }) {
  const [aba, setAba] = useState<ProfileStatus>("pendente");
  const [pending, startTransition] = useTransition();

  const filtrados = membros.filter((m) => m.status === aba);
  const pendentesCount = membros.filter((m) => m.status === "pendente").length;

  return (
    <div className="space-y-4">
      <div className="flex gap-1 border-b border-border">
        {ABAS.map((a) => (
          <button
            key={a.chave}
            onClick={() => setAba(a.chave)}
            className={cn(
              "relative px-3 py-2 text-sm font-medium",
              aba === a.chave ? "text-primary" : "text-ink-muted hover:text-ink",
            )}
          >
            {a.nome}
            {a.chave === "pendente" && pendentesCount > 0 && (
              <span className="ml-1.5 rounded-full bg-accent px-1.5 py-0.5 text-xs text-ink">
                {pendentesCount}
              </span>
            )}
            {aba === a.chave && (
              <span className="absolute inset-x-0 -bottom-px h-0.5 bg-primary" />
            )}
          </button>
        ))}
      </div>

      {filtrados.length === 0 ? (
        <EstadoVazio
          icone={Users}
          titulo={`Nenhum membro ${aba === "pendente" ? "pendente" : aba}.`}
        />
      ) : (
        <ul className="space-y-2">
          {filtrados.map((m) => (
            <li
              key={m.id}
              className="flex flex-wrap items-center gap-3 rounded-[var(--radius-panel)] border border-border bg-surface p-3"
            >
              <Avatar nome={m.nome_exibicao} fotoUrl={m.foto_url} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-ink">
                  {m.nome_completo}
                </p>
                <p className="truncate text-xs text-ink-muted">{m.email}</p>
              </div>

              <Select
                aria-label={`Perfil de ${m.nome_completo}`}
                value={m.role}
                disabled={pending}
                className="w-auto"
                onChange={(e) =>
                  startTransition(() =>
                    atualizarPapelEGat(m.id, { role: e.target.value as ProfileRole }),
                  )
                }
              >
                <option value="participante">Participante</option>
                <option value="relator">Relator(a)</option>
                <option value="coordenacao">Coordenação</option>
              </Select>

              <Select
                aria-label={`GAT de ${m.nome_completo}`}
                value={m.gat_id ?? ""}
                disabled={pending}
                className="w-auto"
                onChange={(e) =>
                  startTransition(() =>
                    atualizarPapelEGat(m.id, { gat_id: e.target.value || null }),
                  )
                }
              >
                <option value="">Sem GAT</option>
                {gats.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.nome}
                  </option>
                ))}
              </Select>

              {m.status === "pendente" && (
                <Button
                  type="button"
                  onClick={() => startTransition(() => aprovarMembro(m.id))}
                  disabled={pending}
                >
                  Aprovar
                </Button>
              )}
              {m.status === "ativo" && (
                <Button
                  type="button"
                  variant="secundario"
                  onClick={() => startTransition(() => desativarMembro(m.id))}
                  disabled={pending}
                >
                  Desativar
                </Button>
              )}
              {m.status === "inativo" && (
                <Button
                  type="button"
                  variant="secundario"
                  onClick={() => startTransition(() => reativarMembro(m.id))}
                  disabled={pending}
                >
                  Reativar
                </Button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
