"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { Surface } from "@/components/ui/surface";
import { Button } from "@/components/ui/button";
import { BotaoCopiar } from "@/components/ui/botao-copiar";
import { OpcaoHeader } from "./opcao-card";
import { confirmarData } from "../actions";
import {
  mensagemEnquete,
  mensagemLembrete,
  mensagemConfirmacao,
  linkWhatsApp,
} from "@/lib/whatsapp";
import { formatarDataHoraCompleta } from "@/lib/dates";
import { icsParaDataUri, linkGoogleAgenda } from "@/lib/ics";
import type { EnqueteDetalhe, MembroElegivel } from "../types";

interface AcompanharEnqueteProps {
  poll: EnqueteDetalhe;
  elegiveis: MembroElegivel[];
  fusoHorario: string;
  origin: string;
}

export function AcompanharEnquete({ poll, elegiveis, fusoHorario, origin }: AcompanharEnqueteProps) {
  const [pending, startTransition] = useTransition();
  const [erro, setErro] = useState<string | null>(null);
  const [confirmada, setConfirmada] = useState<{
    opcaoId: string;
    meetingId: string;
  } | null>(
    poll.status === "confirmada" && poll.confirmed_option_id
      ? { opcaoId: poll.confirmed_option_id, meetingId: poll.meeting_id! }
      : null,
  );

  const link = `${origin}/e/${poll.code}`;

  const rankeadas = [...poll.poll_options].sort((a, b) => {
    const podeA = a.poll_votes.filter((v) => v.valor === "pode").length;
    const podeB = b.poll_votes.filter((v) => v.valor === "pode").length;
    if (podeB !== podeA) return podeB - podeA;
    const sePrecisarA = a.poll_votes.filter((v) => v.valor === "se_precisar").length;
    const sePrecisarB = b.poll_votes.filter((v) => v.valor === "se_precisar").length;
    return sePrecisarB - sePrecisarA;
  });

  const votantesIds = new Set(poll.poll_options.flatMap((o) => o.poll_votes.map((v) => v.profile_id)));
  const naoVotaram = elegiveis.filter((m) => !votantesIds.has(m.id));

  function confirmar(opcaoId: string) {
    setErro(null);
    startTransition(async () => {
      try {
        const { meetingId } = await confirmarData(poll.id, opcaoId);
        setConfirmada({ opcaoId, meetingId });
      } catch (e) {
        setErro(e instanceof Error ? e.message : "Não foi possível confirmar.");
      }
    });
  }

  if (confirmada) {
    const opcao = poll.poll_options.find((o) => o.id === confirmada.opcaoId)!;
    const fim = new Date(
      new Date(opcao.inicio).getTime() + poll.duracao_minutos * 60_000,
    ).toISOString();
    const local = opcao.modalidade === "presencial" ? opcao.locations?.nome ?? "Local a definir" : "Online";
    const evento = {
      uid: `${poll.id}@pet-reunioes`,
      titulo: poll.titulo,
      inicioUtc: opcao.inicio,
      fimUtc: fim,
      local,
    };
    const mensagem = mensagemConfirmacao({
      tituloReuniao: poll.titulo,
      dataHoraFormatada: formatarDataHoraCompleta(opcao.inicio, fusoHorario),
      local,
      link: linkGoogleAgenda(evento),
    });

    return (
      <Surface className="space-y-4 p-5">
        <div className="flex items-center gap-2 text-primary">
          <CheckCircle2 className="h-5 w-5" strokeWidth={1.75} />
          <p className="font-medium">Reunião confirmada</p>
        </div>
        <OpcaoHeader opcao={opcao} fusoHorario={fusoHorario} />
        <div className="flex flex-wrap gap-2">
          <BotaoCopiar texto={mensagem} label="Copiar mensagem" />
          <a href={linkWhatsApp(mensagem)} target="_blank" rel="noopener noreferrer">
            <Button type="button" variant="secundario">
              Abrir no WhatsApp
            </Button>
          </a>
          <a href={icsParaDataUri(evento)} download={`reuniao-${poll.code}.ics`}>
            <Button type="button" variant="secundario">
              Baixar .ics
            </Button>
          </a>
          <a href={linkGoogleAgenda(evento)} target="_blank" rel="noopener noreferrer">
            <Button type="button" variant="secundario">
              Google Agenda
            </Button>
          </a>
        </div>
        <Link href={`/reunioes/${confirmada.meetingId}`} className="text-sm text-primary underline">
          Ver reunião na agenda
        </Link>
      </Surface>
    );
  }

  return (
    <div className="space-y-6">
      {poll.status === "aberta" && (
        <Surface className="space-y-3 p-4">
          <p className="text-sm font-semibold uppercase tracking-wide text-ink-muted">
            Compartilhar
          </p>
          <p className="font-mono text-sm text-ink">{link}</p>
          <div className="flex flex-wrap gap-2">
            <BotaoCopiar texto={link} label="Copiar link" />
            <BotaoCopiar
              texto={mensagemEnquete({
                titulo: poll.titulo,
                tipoEncontro: poll.meeting_types?.nome ?? "",
                prazoFormatado: poll.prazo_votacao
                  ? formatarDataHoraCompleta(poll.prazo_votacao, fusoHorario)
                  : null,
                link,
              })}
              label="Copiar mensagem"
            />
            <a
              href={linkWhatsApp(
                mensagemEnquete({
                  titulo: poll.titulo,
                  tipoEncontro: poll.meeting_types?.nome ?? "",
                  prazoFormatado: poll.prazo_votacao
                    ? formatarDataHoraCompleta(poll.prazo_votacao, fusoHorario)
                    : null,
                  link,
                }),
              )}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button type="button" variant="secundario">
                Abrir no WhatsApp
              </Button>
            </a>
          </div>
        </Surface>
      )}

      {naoVotaram.length > 0 && (
        <Surface className="space-y-2 p-4">
          <p className="text-sm font-medium text-ink">
            {naoVotaram.length} {naoVotaram.length === 1 ? "pessoa não votou" : "pessoas não votaram"}
          </p>
          <p className="text-xs text-ink-muted">
            {naoVotaram.map((m) => m.nome_exibicao).join(", ")}
          </p>
          <BotaoCopiar
            texto={mensagemLembrete({
              titulo: poll.titulo,
              nomes: naoVotaram.map((m) => m.nome_exibicao),
              link,
            })}
            label="Copiar lembrete para o WhatsApp"
          />
        </Surface>
      )}

      {erro && <p className="text-sm text-alert">{erro}</p>}

      <div className="space-y-3">
        {rankeadas.map((opcao, indice) => {
          const pode = opcao.poll_votes.filter((v) => v.valor === "pode").length;
          const sePrecisar = opcao.poll_votes.filter((v) => v.valor === "se_precisar").length;
          const total = elegiveis.length || 1;
          const idsVotaramNestaOpcao = new Set(opcao.poll_votes.map((v) => v.profile_id));
          const naoPodem = elegiveis.filter((m) => !idsVotaramNestaOpcao.has(m.id));

          return (
            <Surface key={opcao.id} className="space-y-3 p-4">
              <div className="flex items-start justify-between gap-3">
                <OpcaoHeader opcao={opcao} fusoHorario={fusoHorario} destaque={indice === 0} />
                {poll.status === "aberta" && (
                  <Button type="button" onClick={() => confirmar(opcao.id)} disabled={pending}>
                    Confirmar esta data
                  </Button>
                )}
              </div>
              <div className="space-y-1">
                <div className="h-2 overflow-hidden rounded-full bg-paper">
                  <div
                    className="h-full bg-primary"
                    style={{ width: `${Math.min(100, (pode / total) * 100)}%` }}
                  />
                </div>
                <p className="text-xs text-ink-muted">
                  {pode} podem · {sePrecisar} se precisar
                </p>
              </div>
              {naoPodem.length > 0 && (
                <p className="text-xs text-ink-muted">
                  Não podem: {naoPodem.map((m) => m.nome_exibicao).join(", ")}
                </p>
              )}
            </Surface>
          );
        })}
      </div>
    </div>
  );
}
