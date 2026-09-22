"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import { Surface } from "@/components/ui/surface";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Carimbo } from "@/components/ui/carimbo";
import { BotaoCopiar } from "@/components/ui/botao-copiar";
import { Avatar } from "@/components/ui/avatar";
import { RelatoEditor } from "./relato-editor";
import { EncaminhamentosTabela } from "./encaminhamentos-tabela";
import { ComentariosAta } from "./comentarios-ata";
import { AnexosLista } from "./anexos-lista";
import { GerarPdfButton } from "./gerar-pdf-button";
import { mudarStatusAta, definirProximaReuniao, urlAssinadaAnexo } from "../actions";
import { mensagemResumoAta, linkWhatsApp } from "@/lib/whatsapp";
import { formatarData, formatarDiaSemana, formatarHora } from "@/lib/dates";
import type { AtaCompleta, MinutePdf } from "../types";
import type { DadosProgramaPdf } from "../pdf/ata-documento";
import type { Database, MinuteStatus } from "@/lib/supabase/types";

type ReuniaoFutura = Database["public"]["Tables"]["meetings"]["Row"];

const STATUS_TEXTO: Record<MinuteStatus, string> = {
  rascunho: "Rascunho",
  em_revisao: "Em revisão",
  aprovada: "Aprovada",
};

const STATUS_PRESENCA_TEXTO: Record<string, string> = {
  presente: "Presente",
  ausente: "Ausente",
  justificado: "Justificado",
};

interface Membro {
  id: string;
  nome_exibicao: string;
}

interface RevisaoAtaProps {
  ata: AtaCompleta;
  programaPdf: DadosProgramaPdf;
  fusoHorario: string;
  membros: Membro[];
  reunioesFuturas: ReuniaoFutura[];
  pdfs: MinutePdf[];
  meuId: string;
  podeEditar: boolean;
  isCoordenacao: boolean;
}

export function RevisaoAta({
  ata,
  programaPdf,
  fusoHorario,
  membros,
  reunioesFuturas,
  pdfs,
  meuId,
  podeEditar,
  isCoordenacao,
}: RevisaoAtaProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);

  const topicos = ata.agendaItems.filter((i) => i.aceito);
  const decisoes = ata.notes.filter((n) => n.tipo === "decisao");
  const editavel = podeEditar && ata.minute.status !== "aprovada";

  const mensagemWhats = mensagemResumoAta({
    tituloReuniao: ata.meeting.titulo || ata.meeting.meeting_types?.nome || "Reunião",
    decisoes: decisoes.map((d) => d.texto),
    encaminhamentos: ata.actionItems.map((e) => ({
      descricao: e.descricao,
      responsavel: e.profiles?.nome_exibicao ?? null,
      prazo: e.prazo,
    })),
  });

  function mudarStatus(status: MinuteStatus) {
    startTransition(async () => {
      await mudarStatusAta(ata.minute.id, ata.meeting.id, status);
      router.refresh();
    });
  }

  return (
    <div className="mx-auto max-w-2xl space-y-8 px-4 py-8">
      <div>
        <div className="flex items-center gap-2">
          <h1 className="font-display text-2xl font-semibold text-ink">
            Ata do {ata.meeting.meeting_types?.nome ?? "encontro"}
          </h1>
          <Carimbo texto={STATUS_TEXTO[ata.minute.status]} />
        </div>
        <p className="mt-1 font-mono text-sm text-ink-muted">
          {formatarDiaSemana(ata.meeting.inicio, fusoHorario)} {formatarData(ata.meeting.inicio, fusoHorario)}
          {ata.meeting.inicio_real &&
            ` · ${formatarHora(ata.meeting.inicio_real, fusoHorario)}${
              ata.meeting.fim_real ? ` às ${formatarHora(ata.meeting.fim_real, fusoHorario)}` : ""
            }`}
        </p>
      </div>

      <section className="space-y-2">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-muted">Presença</h2>
        <div className="flex flex-wrap gap-2">
          {ata.attendance.map((a) => (
            <span
              key={a.id}
              className="flex items-center gap-1.5 rounded-full border border-border bg-surface px-2.5 py-1 text-sm"
            >
              <Avatar
                nome={a.profiles?.nome_exibicao ?? a.visitante_nome ?? "?"}
                fotoUrl={a.profiles?.foto_url}
                tamanho="sm"
              />
              {a.profiles?.nome_exibicao ?? a.visitante_nome}
              <span className="text-xs text-ink-muted">
                · {STATUS_PRESENCA_TEXTO[a.status]}
              </span>
            </span>
          ))}
        </div>
      </section>

      <section className="space-y-2">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-muted">Pauta</h2>
        <ul className="list-inside list-disc text-sm text-ink">
          {topicos.map((t) => (
            <li key={t.id}>{t.titulo}</li>
          ))}
        </ul>
      </section>

      <section className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-muted">Relato</h2>
        {topicos.map((t) => {
          const notasDoTopico = ata.notes.filter((n) => n.agenda_item_id === t.id);
          const jaSalvo = ata.minute.relato[t.id] !== undefined;
          const padrao = ata.minute.relato[t.id] ?? notasDoTopico.map((n) => n.texto).join("\n");
          return (
            <RelatoEditor
              key={t.id}
              minutesId={ata.minute.id}
              meetingId={ata.meeting.id}
              chave={t.id}
              titulo={t.titulo}
              valorInicial={padrao}
              jaSalvoNoServidor={jaSalvo}
              editavel={editavel}
            />
          );
        })}
        {(() => {
          const notasGerais = ata.notes.filter((n) => !n.agenda_item_id);
          const jaSalvo = ata.minute.relato["geral"] !== undefined;
          const padrao = ata.minute.relato["geral"] ?? notasGerais.map((n) => n.texto).join("\n");
          if (!padrao && !editavel) return null;
          return (
            <RelatoEditor
              minutesId={ata.minute.id}
              meetingId={ata.meeting.id}
              chave="geral"
              titulo="Geral"
              valorInicial={padrao}
              jaSalvoNoServidor={jaSalvo}
              editavel={editavel}
            />
          );
        })()}
      </section>

      {decisoes.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-muted">Decisões</h2>
          <ul className="list-inside list-disc text-sm text-ink">
            {decisoes.map((d) => (
              <li key={d.id}>{d.texto}</li>
            ))}
          </ul>
        </section>
      )}

      <section className="space-y-2">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-muted">
          Encaminhamentos
        </h2>
        <EncaminhamentosTabela
          itens={ata.actionItems}
          meetingId={ata.meeting.id}
          membros={membros}
          podeEditarTudo={editavel}
          meuId={meuId}
        />
      </section>

      <section className="space-y-2">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-muted">
          Próxima reunião
        </h2>
        {editavel ? (
          <Select
            aria-label="Próxima reunião"
            value={ata.minute.proxima_reuniao_id ?? ""}
            onChange={(e) =>
              startTransition(() =>
                definirProximaReuniao(ata.minute.id, ata.meeting.id, e.target.value || null),
              )
            }
            className="max-w-xs"
          >
            <option value="">Ainda não definida</option>
            {reunioesFuturas.map((r) => (
              <option key={r.id} value={r.id}>
                {formatarData(r.inicio, fusoHorario)} · {r.titulo || "Reunião"}
              </option>
            ))}
          </Select>
        ) : (
          <p className="text-sm text-ink-muted">
            {reunioesFuturas.find((r) => r.id === ata.minute.proxima_reuniao_id)
              ? formatarData(
                  reunioesFuturas.find((r) => r.id === ata.minute.proxima_reuniao_id)!.inicio,
                  fusoHorario,
                )
              : "Ainda não definida"}
          </p>
        )}
      </section>

      <section className="space-y-2">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-muted">Anexos</h2>
        <AnexosLista anexos={ata.attachments} meetingId={ata.meeting.id} podeRemover={editavel} />
      </section>

      {ata.minute.status === "em_revisao" && (
        <section className="space-y-2">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-muted">
            Comentários
          </h2>
          <ComentariosAta
            minutesId={ata.minute.id}
            meetingId={ata.meeting.id}
            comentarios={ata.comments}
            meuId={meuId}
            podeRemoverTodos={podeEditar}
          />
        </section>
      )}

      <Surface className="space-y-3 p-4">
        <div className="flex flex-wrap items-center gap-2">
          {podeEditar && ata.minute.status === "rascunho" && (
            <Button type="button" onClick={() => mudarStatus("em_revisao")} disabled={pending}>
              Enviar para revisão
            </Button>
          )}
          {isCoordenacao && ata.minute.status === "em_revisao" && (
            <Button type="button" onClick={() => mudarStatus("aprovada")} disabled={pending}>
              <CheckCircle2 className="h-4 w-4" strokeWidth={1.75} />
              Aprovar ata
            </Button>
          )}
          {podeEditar && (
            <GerarPdfButton
              ata={ata}
              programa={programaPdf}
              fusoHorario={fusoHorario}
              onGerado={setPdfUrl}
            />
          )}
          {pdfUrl && (
            <a href={pdfUrl} target="_blank" rel="noopener noreferrer">
              <Button type="button" variant="secundario">
                Abrir PDF gerado
              </Button>
            </a>
          )}
          <BotaoCopiar texto={mensagemWhats} label="Copiar resumo para o WhatsApp" />
          <a href={linkWhatsApp(mensagemWhats)} target="_blank" rel="noopener noreferrer">
            <Button type="button" variant="secundario">
              Abrir no WhatsApp
            </Button>
          </a>
        </div>
        {pdfs.length > 0 && (
          <div className="space-y-1 border-t border-border pt-3">
            <p className="text-xs font-medium text-ink-muted">Versões geradas</p>
            <ul className="space-y-1">
              {pdfs.map((p) => (
                <li key={p.id}>
                  <button
                    type="button"
                    className="text-sm text-primary underline"
                    onClick={async () => {
                      const url = await urlAssinadaAnexo(p.storage_path);
                      window.open(url, "_blank", "noopener,noreferrer");
                    }}
                  >
                    Versão {p.versao} — {formatarData(p.gerado_em, fusoHorario)}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </Surface>
    </div>
  );
}
