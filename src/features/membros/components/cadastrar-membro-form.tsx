"use client";

import { useState, useTransition } from "react";
import { UserPlus } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { cadastrarMembroDireto } from "../actions";
import type { Database, ProfileRole } from "@/lib/supabase/types";

type Gat = Database["public"]["Tables"]["gats"]["Row"];

const VAZIO = {
  nome_completo: "",
  nome_exibicao: "",
  email: "",
  telefone: "",
  gat_id: "",
  role: "participante" as ProfileRole,
};

export function CadastrarMembroForm({ gats }: { gats: Gat[] }) {
  const [aberto, setAberto] = useState(false);
  const [dados, setDados] = useState(VAZIO);
  const [erro, setErro] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function enviar() {
    if (!dados.nome_completo || !dados.nome_exibicao || !dados.email) {
      setErro("Nome completo, nome de exibição e e-mail são obrigatórios.");
      return;
    }
    setErro(null);
    startTransition(async () => {
      try {
        await cadastrarMembroDireto({
          ...dados,
          gat_id: dados.gat_id || null,
        });
        setDados(VAZIO);
        setAberto(false);
      } catch (e) {
        setErro(e instanceof Error ? e.message : "Não foi possível cadastrar.");
      }
    });
  }

  if (!aberto) {
    return (
      <Button type="button" variant="secundario" onClick={() => setAberto(true)}>
        <UserPlus className="h-4 w-4" strokeWidth={1.75} />
        Cadastrar membro diretamente
      </Button>
    );
  }

  return (
    <div className="space-y-4 rounded-[var(--radius-panel)] border border-border bg-paper p-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="m_nome_completo">Nome completo</Label>
          <Input
            id="m_nome_completo"
            value={dados.nome_completo}
            onChange={(e) => setDados({ ...dados, nome_completo: e.target.value })}
          />
        </div>
        <div>
          <Label htmlFor="m_nome_exibicao">Nome de exibição</Label>
          <Input
            id="m_nome_exibicao"
            value={dados.nome_exibicao}
            onChange={(e) => setDados({ ...dados, nome_exibicao: e.target.value })}
          />
        </div>
        <div>
          <Label htmlFor="m_email">E-mail</Label>
          <Input
            id="m_email"
            type="email"
            value={dados.email}
            onChange={(e) => setDados({ ...dados, email: e.target.value })}
          />
        </div>
        <div>
          <Label htmlFor="m_telefone">Telefone (opcional)</Label>
          <Input
            id="m_telefone"
            value={dados.telefone}
            onChange={(e) => setDados({ ...dados, telefone: e.target.value })}
          />
        </div>
        <div>
          <Label htmlFor="m_gat">GAT</Label>
          <Select
            id="m_gat"
            value={dados.gat_id}
            onChange={(e) => setDados({ ...dados, gat_id: e.target.value })}
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
          <Label htmlFor="m_role">Perfil</Label>
          <Select
            id="m_role"
            value={dados.role}
            onChange={(e) => setDados({ ...dados, role: e.target.value as ProfileRole })}
          >
            <option value="participante">Participante</option>
            <option value="relator">Relator(a)</option>
            <option value="coordenacao">Coordenação</option>
          </Select>
        </div>
      </div>
      {erro && <p className="text-sm text-alert">{erro}</p>}
      <div className="flex items-center gap-2">
        <Button type="button" onClick={enviar} disabled={pending}>
          {pending ? "Cadastrando…" : "Cadastrar"}
        </Button>
        <Button type="button" variant="fantasma" onClick={() => setAberto(false)}>
          Cancelar
        </Button>
      </div>
    </div>
  );
}
