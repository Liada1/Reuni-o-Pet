"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Mic } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useModoReuniao } from "../hooks/use-modo-reuniao";
import { IndicadorStatus } from "./indicador-status";
import { PresencaLista } from "./presenca-lista";
import { TopicosAoVivo } from "./topicos-ao-vivo";
import { CampoAnotacao } from "./campo-anotacao";
import { paraInputData, paraInputHora, paraUtc } from "@/lib/dates";
import type { AtaCompleta } from "../types";

interface MembroEsperado {
  id: string;
  nome_exibicao: string;
  foto_url: string | null;
}

interface ModoReuniaoProps {
  meetingId: string;
  meetingTitulo: string;
  membros: MembroEsperado[];
  pautaAceita: { id: string; titulo: string; ordem: number }[];
  ataExistente: AtaCompleta | null;
  fusoHorario: string;
}

export function ModoReuniao({
  meetingId,
  meetingTitulo,
  membros,
  pautaAceita,
  ataExistente,
  fusoHorario,
}: ModoReuniaoProps) {
  const router = useRouter();
  const {
    rascunho,
    carregando,
    status,
    iniciar,
    encerrar,
    marcarPresenca,
    marcarTodosPresentes,
    adicionarVisitante,
    adicionarTopico,
    adicionarNota,
    retagNota,
    enviarFoto,
  } = useModoReuniao({ meetingId, membros, pautaAceita, ataExistente });

  const [topicoAtivoId, setTopicoAtivoId] = useState<string | null>(null);
  const [encerrando, setEncerrando] = useState(false);
  const [dataEncerramento, setDataEncerramento] = useState("");
  const [horaEncerramento, setHoraEncerramento] = useState("");

  if (carregando) {
    return <p className="p-6 text-sm text-ink-muted">Carregando…</p>;
  }

  if (!rascunho) {
    return (
      <div className="flex flex-col items-center gap-4 px-4 py-16 text-center">
        <p className="text-sm text-ink-muted">
          Toque para começar a registrar &ldquo;{meetingTitulo}&rdquo;.
        </p>
        <Button type="button" tamanho="grande" onClick={iniciar}>
          Iniciar reunião
        </Button>
      </div>
    );
  }

  async function confirmarEncerramento() {
    const iso = paraUtc(dataEncerramento, horaEncerramento, fusoHorario).toISOString();
    await encerrar(iso);
    router.push(`/reunioes/${meetingId}/ata`);
  }

  function abrirEncerramento() {
    const agora = new Date().toISOString();
    setDataEncerramento(paraInputData(agora, fusoHorario));
    setHoraEncerramento(paraInputHora(agora, fusoHorario));
    setEncerrando(true);
  }

  return (
    <div className="flex min-h-svh flex-col pauta-linhas">
      <header className="sticky top-0 z-10 flex items-center justify-between gap-2 border-b border-border bg-surface px-4 py-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-ink">{meetingTitulo}</p>
          <IndicadorStatus status={status} />
        </div>
        <Button type="button" variant="perigo" onClick={abrirEncerramento}>
          Encerrar
        </Button>
      </header>

      {encerrando && (
        <div className="space-y-3 border-b border-border bg-paper p-4">
          <p className="text-sm font-medium text-ink">Horário de término</p>
          <div className="flex flex-wrap items-center gap-2">
            <Input
              type="date"
              value={dataEncerramento}
              onChange={(e) => setDataEncerramento(e.target.value)}
            />
            <Input
              type="time"
              value={horaEncerramento}
              onChange={(e) => setHoraEncerramento(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <Button type="button" onClick={confirmarEncerramento}>
              Confirmar e ir para revisão
            </Button>
            <Button type="button" variant="fantasma" onClick={() => setEncerrando(false)}>
              Voltar
            </Button>
          </div>
        </div>
      )}

      <div className="flex-1 space-y-6 px-4 py-4">
        <section className="space-y-2">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-muted">
            Presença
          </h2>
          <PresencaLista
            presencas={rascunho.presencas}
            membros={membros}
            onMarcar={marcarPresenca}
            onMarcarTodos={marcarTodosPresentes}
            onAdicionarVisitante={adicionarVisitante}
          />
        </section>

        <section className="space-y-2">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-muted">Pauta</h2>
          <p className="flex items-center gap-1.5 text-xs text-ink-muted">
            <Mic className="h-3.5 w-3.5" strokeWidth={1.75} />
            Toque num tópico pra anotar nele — as anotações vão pro campo abaixo.
          </p>
          <TopicosAoVivo
            topicos={rascunho.topicos}
            notas={rascunho.notas}
            membros={membros}
            fusoHorario={fusoHorario}
            topicoAtivoId={topicoAtivoId}
            onSelecionarTopico={setTopicoAtivoId}
            onAdicionarTopico={async (titulo) => {
              const id = await adicionarTopico(titulo);
              if (id) setTopicoAtivoId(id);
            }}
            onRetagNota={retagNota}
          />
        </section>
      </div>

      <CampoAnotacao
        onEnviar={(texto) => adicionarNota(texto, topicoAtivoId)}
        onFoto={enviarFoto}
      />
    </div>
  );
}
