"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { EditorOpcoes } from "./editor-opcoes";
import { criarEnquete } from "../actions";
import { paraInputData, paraInputHora, agoraMaisMs } from "@/lib/dates";
import type { NovaOpcaoInput } from "../types";
import type { Database, ProfileRole } from "@/lib/supabase/types";

type MeetingType = Database["public"]["Tables"]["meeting_types"]["Row"];
type Gat = Database["public"]["Tables"]["gats"]["Row"];
type Location = Database["public"]["Tables"]["locations"]["Row"];
type Membro = { id: string; nome_exibicao: string; role: ProfileRole };

interface NovaEnqueteFormProps {
  tiposEncontro: MeetingType[];
  locais: Location[];
  gats: Gat[];
  membros: Membro[];
  fusoHorario: string;
}

export function NovaEnqueteForm({
  tiposEncontro,
  locais,
  gats,
  membros,
  fusoHorario,
}: NovaEnqueteFormProps) {
  const router = useRouter();

  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [tipoId, setTipoId] = useState(tiposEncontro[0]?.id ?? "");
  const [duracao, setDuracao] = useState(tiposEncontro[0]?.duracao_padrao_minutos ?? 120);
  const [opcoes, setOpcoes] = useState<NovaOpcaoInput[]>([]);
  const [prazoData, setPrazoData] = useState(() =>
    paraInputData(agoraMaisMs(48 * 60 * 60 * 1000).toISOString(), fusoHorario),
  );
  const [prazoHora, setPrazoHora] = useState(() =>
    paraInputHora(agoraMaisMs(48 * 60 * 60 * 1000).toISOString(), fusoHorario),
  );
  const [semPrazo, setSemPrazo] = useState(false);
  const [publicoAlvo, setPublicoAlvo] = useState<"todos" | "gat" | "pessoas">("todos");
  const [gatId, setGatId] = useState(gats[0]?.id ?? "");
  const [pessoasIds, setPessoasIds] = useState<Set<string>>(new Set());
  const [votosVisiveis, setVotosVisiveis] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function togglePessoa(id: string) {
    setPessoasIds((prev) => {
      const novo = new Set(prev);
      if (novo.has(id)) novo.delete(id);
      else novo.add(id);
      return novo;
    });
  }

  function enviar() {
    if (!titulo.trim()) return setErro("Dê um título para a enquete.");
    if (!tipoId) return setErro("Escolha o tipo de encontro.");
    if (opcoes.length === 0) return setErro("Adicione ao menos uma opção de data.");
    if (opcoes.some((o) => !o.dataISO)) return setErro("Preencha a data de todas as opções.");

    setErro(null);
    startTransition(async () => {
      try {
        const { id } = await criarEnquete({
          titulo,
          descricao,
          meetingTypeId: tipoId,
          duracaoMinutos: duracao,
          opcoes,
          prazoVotacao: semPrazo ? null : { dataISO: prazoData, horaMinuto: prazoHora },
          publicoAlvo,
          gatId: publicoAlvo === "gat" ? gatId : null,
          pessoasIds: publicoAlvo === "pessoas" ? Array.from(pessoasIds) : undefined,
          votosVisiveis,
        });
        router.push(`/enquetes/${id}`);
      } catch (e) {
        setErro(e instanceof Error ? e.message : "Não foi possível criar a enquete.");
      }
    });
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="titulo">Título</Label>
          <Input
            id="titulo"
            placeholder="Dia para nosso encontro"
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="tipo">Tipo de encontro</Label>
          <Select
            id="tipo"
            value={tipoId}
            onChange={(e) => {
              setTipoId(e.target.value);
              const tipo = tiposEncontro.find((t) => t.id === e.target.value);
              if (tipo) setDuracao(tipo.duracao_padrao_minutos);
            }}
          >
            {tiposEncontro.map((t) => (
              <option key={t.id} value={t.id}>
                {t.nome}
              </option>
            ))}
          </Select>
        </div>
      </div>

      <div>
        <Label htmlFor="descricao">Descrição (opcional)</Label>
        <Input
          id="descricao"
          value={descricao}
          onChange={(e) => setDescricao(e.target.value)}
        />
      </div>

      <div className="max-w-[160px]">
        <Label htmlFor="duracao">Duração prevista (min)</Label>
        <Input
          id="duracao"
          type="number"
          min={15}
          step={15}
          value={duracao}
          onChange={(e) => setDuracao(Number(e.target.value))}
        />
      </div>

      <div>
        <Label>Opções de data</Label>
        <EditorOpcoes value={opcoes} onChange={setOpcoes} locais={locais} />
      </div>

      <div>
        <Label>Prazo para votar</Label>
        <div className="flex flex-wrap items-center gap-2">
          <Input
            type="date"
            aria-label="Data do prazo para votar"
            value={prazoData}
            disabled={semPrazo}
            onChange={(e) => setPrazoData(e.target.value)}
            className="w-auto"
          />
          <Input
            type="time"
            aria-label="Hora do prazo para votar"
            value={prazoHora}
            disabled={semPrazo}
            onChange={(e) => setPrazoHora(e.target.value)}
            className="w-28"
          />
          <label className="flex items-center gap-2 text-sm text-ink-muted">
            <input
              type="checkbox"
              checked={semPrazo}
              onChange={(e) => setSemPrazo(e.target.checked)}
            />
            Sem prazo
          </label>
        </div>
      </div>

      <div>
        <Label>Quem deve votar</Label>
        <div className="flex flex-wrap gap-2">
          {(["todos", "gat", "pessoas"] as const).map((opcao) => (
            <button
              key={opcao}
              type="button"
              onClick={() => setPublicoAlvo(opcao)}
              className={`rounded-[var(--radius-control)] border px-3 py-2 text-sm font-medium ${
                publicoAlvo === opcao
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border text-ink-muted hover:bg-paper"
              }`}
            >
              {opcao === "todos" ? "Todos" : opcao === "gat" ? "Um GAT" : "Pessoas selecionadas"}
            </button>
          ))}
        </div>

        {publicoAlvo === "gat" && (
          <Select
            aria-label="GAT que deve votar"
            className="mt-2 max-w-xs"
            value={gatId}
            onChange={(e) => setGatId(e.target.value)}
          >
            {gats.map((g) => (
              <option key={g.id} value={g.id}>
                {g.nome}
              </option>
            ))}
          </Select>
        )}

        {publicoAlvo === "pessoas" && (
          <div className="mt-2 max-h-56 space-y-1 overflow-y-auto rounded-[var(--radius-panel)] border border-border bg-surface p-2">
            {membros.map((m) => (
              <label key={m.id} className="flex items-center gap-2 px-1 py-1 text-sm text-ink">
                <input
                  type="checkbox"
                  checked={pessoasIds.has(m.id)}
                  onChange={() => togglePessoa(m.id)}
                />
                {m.nome_exibicao}
              </label>
            ))}
          </div>
        )}
      </div>

      <label className="flex items-center gap-2 text-sm text-ink">
        <input
          type="checkbox"
          checked={votosVisiveis}
          onChange={(e) => setVotosVisiveis(e.target.checked)}
        />
        Mostrar quem votou em cada opção
      </label>

      {erro && <p className="text-sm text-alert">{erro}</p>}

      <Button type="button" onClick={enviar} disabled={pending}>
        {pending ? "Criando…" : "Criar enquete"}
      </Button>
    </div>
  );
}
