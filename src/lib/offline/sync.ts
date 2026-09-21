"use client";

import {
  listarPendentes,
  removerMutacao,
  incrementarTentativa,
} from "./db";
import {
  iniciarReuniaoAction,
  encerrarReuniaoAction,
  upsertPresencaAction,
  criarTopicoLiveAction,
  criarNotaAction,
  atualizarNotaAction,
  uploadFotoAction,
} from "@/features/atas/actions";
import type { MutacaoOutbox } from "./types";

type Ouvinte = (status: StatusSync) => void;
export type StatusSync = "salvo" | "salvando" | "offline" | "erro";

const ouvintesPorReuniao = new Map<string, Set<Ouvinte>>();
const sincronizandoPorReuniao = new Set<string>();

export function ouvirStatusSync(meetingId: string, ouvinte: Ouvinte) {
  if (!ouvintesPorReuniao.has(meetingId)) ouvintesPorReuniao.set(meetingId, new Set());
  ouvintesPorReuniao.get(meetingId)!.add(ouvinte);
  return () => ouvintesPorReuniao.get(meetingId)?.delete(ouvinte);
}

function notificar(meetingId: string, status: StatusSync) {
  ouvintesPorReuniao.get(meetingId)?.forEach((fn) => fn(status));
}

async function executar(mutacao: MutacaoOutbox): Promise<void> {
  switch (mutacao.kind) {
    case "iniciar_reuniao":
      return iniciarReuniaoAction(mutacao.payload as Parameters<typeof iniciarReuniaoAction>[0]);
    case "encerrar_reuniao":
      return encerrarReuniaoAction(
        mutacao.payload as Parameters<typeof encerrarReuniaoAction>[0],
      );
    case "upsert_presenca":
      return upsertPresencaAction(
        mutacao.payload as Parameters<typeof upsertPresencaAction>[0],
      );
    case "criar_topico":
      return criarTopicoLiveAction(
        mutacao.payload as Parameters<typeof criarTopicoLiveAction>[0],
      );
    case "criar_nota":
      return criarNotaAction(mutacao.payload as Parameters<typeof criarNotaAction>[0]);
    case "atualizar_nota":
      return atualizarNotaAction(
        mutacao.payload as Parameters<typeof atualizarNotaAction>[0],
      );
    case "upload_foto":
      return uploadFotoAction(mutacao.payload as Parameters<typeof uploadFotoAction>[0]);
  }
}

/** Processa a fila de uma reunião em ordem, parando no primeiro erro (a
 * ordem importa: "iniciar_reuniao" precisa ter sido aplicada no servidor
 * antes de notas/presenças que dependem do id da ata existir lá). */
export async function tentarSincronizar(meetingId: string): Promise<void> {
  if (sincronizandoPorReuniao.has(meetingId)) return;
  if (typeof navigator !== "undefined" && !navigator.onLine) {
    notificar(meetingId, "offline");
    return;
  }

  sincronizandoPorReuniao.add(meetingId);
  notificar(meetingId, "salvando");

  try {
    const pendentes = await listarPendentes(meetingId);
    pendentes.sort((a, b) => (a.seq ?? 0) - (b.seq ?? 0));

    for (const mutacao of pendentes) {
      try {
        await executar(mutacao);
        if (mutacao.seq !== undefined) await removerMutacao(mutacao.seq);
      } catch {
        await incrementarTentativa(mutacao);
        notificar(meetingId, navigator.onLine ? "erro" : "offline");
        return;
      }
    }
    notificar(meetingId, "salvo");
  } finally {
    sincronizandoPorReuniao.delete(meetingId);
  }
}

let ouvintesGlobaisRegistrados = false;
const reunioesAtivas = new Set<string>();

export function registrarReuniaoParaSync(meetingId: string) {
  reunioesAtivas.add(meetingId);

  if (!ouvintesGlobaisRegistrados && typeof window !== "undefined") {
    ouvintesGlobaisRegistrados = true;
    window.addEventListener("online", () => {
      reunioesAtivas.forEach((id) => tentarSincronizar(id));
    });
    setInterval(() => {
      reunioesAtivas.forEach((id) => tentarSincronizar(id));
    }, 15_000);
  }

  return () => reunioesAtivas.delete(meetingId);
}
