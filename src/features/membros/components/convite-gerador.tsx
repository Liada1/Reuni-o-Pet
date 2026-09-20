"use client";

import { useState, useTransition } from "react";
import { Link as LinkIcon } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { BotaoCopiar } from "@/components/ui/botao-copiar";
import { gerarConvite } from "../actions";
import { linkWhatsApp, mensagemConvite } from "@/lib/whatsapp";
import type { Database, ProfileRole } from "@/lib/supabase/types";

type Gat = Database["public"]["Tables"]["gats"]["Row"];

const NOMES_PAPEL: Record<ProfileRole, string> = {
  coordenacao: "Coordenação",
  participante: "Participante",
  relator: "Relator(a)",
};

export function ConviteGerador({
  gats,
  nomePrograma,
  nomeGrupo,
}: {
  gats: Gat[];
  nomePrograma: string;
  nomeGrupo: string;
}) {
  const [role, setRole] = useState<ProfileRole>("participante");
  const [gatId, setGatId] = useState<string>("");
  const [expiraEmDias, setExpiraEmDias] = useState<string>("");
  const [link, setLink] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function gerar() {
    startTransition(async () => {
      const { code } = await gerarConvite({
        role,
        gat_id: gatId || null,
        expira_em_dias: expiraEmDias ? Number(expiraEmDias) : null,
      });
      setLink(`${window.location.origin}/convite/${code}`);
    });
  }

  if (link) {
    const mensagem = mensagemConvite({ nomePrograma, nomeGrupo, link });
    return (
      <div className="space-y-3 rounded-[var(--radius-panel)] border border-border bg-paper p-4">
        <p className="font-mono text-sm text-ink">{link}</p>
        <div className="flex flex-wrap gap-2">
          <BotaoCopiar texto={link} label="Copiar link" />
          <BotaoCopiar texto={mensagem} label="Copiar mensagem" />
          <a href={linkWhatsApp(mensagem)} target="_blank" rel="noopener noreferrer">
            <Button type="button" variant="secundario">
              Abrir no WhatsApp
            </Button>
          </a>
          <Button type="button" variant="fantasma" onClick={() => setLink(null)}>
            Gerar outro
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <Label htmlFor="convite_role">Perfil de entrada</Label>
          <Select
            id="convite_role"
            value={role}
            onChange={(e) => setRole(e.target.value as ProfileRole)}
          >
            <option value="participante">{NOMES_PAPEL.participante}</option>
            <option value="relator">{NOMES_PAPEL.relator}</option>
            <option value="coordenacao">{NOMES_PAPEL.coordenacao}</option>
          </Select>
        </div>
        <div>
          <Label htmlFor="convite_gat">GAT</Label>
          <Select
            id="convite_gat"
            value={gatId}
            onChange={(e) => setGatId(e.target.value)}
          >
            <option value="">Sem GAT definido</option>
            {gats.map((g) => (
              <option key={g.id} value={g.id}>
                {g.nome}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label htmlFor="convite_expira">Expira em</Label>
          <Select
            id="convite_expira"
            value={expiraEmDias}
            onChange={(e) => setExpiraEmDias(e.target.value)}
          >
            <option value="">Sem prazo</option>
            <option value="1">1 dia</option>
            <option value="7">7 dias</option>
            <option value="30">30 dias</option>
          </Select>
        </div>
      </div>
      <Button type="button" onClick={gerar} disabled={pending}>
        <LinkIcon className="h-4 w-4" strokeWidth={1.75} />
        {pending ? "Gerando…" : "Gerar link de convite"}
      </Button>
    </div>
  );
}
