"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { lerRascunho, salvarRascunho, enfileirarMutacao } from "@/lib/offline/db";
import { registrarReuniaoParaSync, tentarSincronizar, ouvirStatusSync } from "@/lib/offline/sync";
import type { StatusSync } from "@/lib/offline/sync";
import type { RascunhoReuniao, PresencaLocal, NotaLocal, TopicoLocal } from "@/lib/offline/types";
import type { NoteTipo, AttendanceStatus } from "@/lib/supabase/types";
import type { AtaCompleta } from "../types";

interface MembroEsperado {
  id: string;
  nome_exibicao: string;
  foto_url: string | null;
}

interface UseModoReuniaoParams {
  meetingId: string;
  membros: MembroEsperado[];
  pautaAceita: { id: string; titulo: string; ordem: number }[];
  ataExistente: AtaCompleta | null;
}

function gerarUuid() {
  return crypto.randomUUID();
}

function seedDeAtaExistente(
  meetingId: string,
  membros: MembroEsperado[],
  pautaAceita: { id: string; titulo: string; ordem: number }[],
  ata: AtaCompleta,
): RascunhoReuniao {
  const presencasPorMembro = new Map(ata.attendance.filter((a) => a.profile_id).map((a) => [a.profile_id, a]));
  const presencas: PresencaLocal[] = membros.map((m) => {
    const existente = presencasPorMembro.get(m.id);
    return {
      id: existente?.id ?? gerarUuid(),
      profileId: m.id,
      visitanteNome: null,
      visitanteInstituicao: null,
      status: existente?.status ?? "ausente",
    };
  });
  const visitantes: PresencaLocal[] = ata.attendance
    .filter((a) => !a.profile_id)
    .map((a) => ({
      id: a.id,
      profileId: null,
      visitanteNome: a.visitante_nome,
      visitanteInstituicao: a.visitante_instituicao,
      status: a.status,
    }));

  const topicos: TopicoLocal[] = ata.agendaItems
    .filter((t) => t.aceito)
    .map((t) => ({ id: t.id, titulo: t.titulo, ordem: t.ordem }));

  const notas: NotaLocal[] = ata.notes.map((n) => ({
    id: n.id,
    agendaItemId: n.agenda_item_id,
    texto: n.texto,
    tipo: n.tipo,
    actionItemId: n.action_item_id,
    responsavelId:
      ata.actionItems.find((a) => a.id === n.action_item_id)?.responsavel_id ?? null,
    prazo: ata.actionItems.find((a) => a.id === n.action_item_id)?.prazo ?? null,
    hora: n.hora,
  }));

  return {
    meetingId,
    minutesId: ata.minute.id,
    iniciadaEm: ata.meeting.inicio_real,
    encerradaEm: ata.meeting.fim_real,
    presencas: [...presencas, ...visitantes],
    topicos: topicos.length > 0 ? topicos : pautaAceita.map((p) => ({ id: p.id, titulo: p.titulo, ordem: p.ordem })),
    notas,
    atualizadoEm: Date.now(),
  };
}

export function useModoReuniao({ meetingId, membros, pautaAceita, ataExistente }: UseModoReuniaoParams) {
  const [rascunho, setRascunho] = useState<RascunhoReuniao | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [status, setStatus] = useState<StatusSync>("salvo");
  const rascunhoRef = useRef<RascunhoReuniao | null>(null);

  useEffect(() => {
    rascunhoRef.current = rascunho;
  }, [rascunho]);

  useEffect(() => {
    let ativo = true;
    (async () => {
      const existente = await lerRascunho(meetingId);
      if (!ativo) return;
      if (existente) {
        setRascunho(existente);
      } else if (ataExistente) {
        const seed = seedDeAtaExistente(meetingId, membros, pautaAceita, ataExistente);
        await salvarRascunho(seed);
        setRascunho(seed);
      }
      setCarregando(false);
    })();
    const pararSync = registrarReuniaoParaSync(meetingId);
    const pararOuvinte = ouvirStatusSync(meetingId, setStatus);
    return () => {
      ativo = false;
      pararSync();
      pararOuvinte();
    };
  }, [meetingId, ataExistente, membros, pautaAceita]);

  const persistir = useCallback(async (novo: RascunhoReuniao) => {
    setRascunho(novo);
    await salvarRascunho(novo);
  }, []);

  const iniciar = useCallback(async () => {
    const minutesId = gerarUuid();
    const agora = new Date().toISOString();
    const novo: RascunhoReuniao = {
      meetingId,
      minutesId,
      iniciadaEm: agora,
      encerradaEm: null,
      presencas: membros.map((m) => ({
        id: gerarUuid(),
        profileId: m.id,
        visitanteNome: null,
        visitanteInstituicao: null,
        status: "ausente",
      })),
      topicos: pautaAceita.map((p) => ({ id: p.id, titulo: p.titulo, ordem: p.ordem })),
      notas: [],
      atualizadoEm: Date.now(),
    };
    await persistir(novo);
    await enfileirarMutacao({
      id: gerarUuid(),
      meetingId,
      kind: "iniciar_reuniao",
      payload: { meetingId, minutesId, iniciadaEmISO: agora },
    });
    tentarSincronizar(meetingId);
  }, [meetingId, membros, pautaAceita, persistir]);

  const encerrar = useCallback(
    async (encerradaEmISO: string) => {
      if (!rascunhoRef.current) return;
      await persistir({ ...rascunhoRef.current, encerradaEm: encerradaEmISO });
      await enfileirarMutacao({
        id: gerarUuid(),
        meetingId,
        kind: "encerrar_reuniao",
        payload: { meetingId, encerradaEmISO },
      });
      tentarSincronizar(meetingId);
    },
    [meetingId, persistir],
  );

  const marcarPresenca = useCallback(
    async (presencaId: string, statusPresenca: AttendanceStatus) => {
      const atual = rascunhoRef.current;
      if (!atual) return;
      const presenca = atual.presencas.find((p) => p.id === presencaId);
      if (!presenca) return;
      const presencas = atual.presencas.map((p) =>
        p.id === presencaId ? { ...p, status: statusPresenca } : p,
      );
      await persistir({ ...atual, presencas });
      await enfileirarMutacao({
        id: gerarUuid(),
        meetingId,
        kind: "upsert_presenca",
        payload: {
          id: presenca.id,
          meetingId,
          profileId: presenca.profileId,
          visitanteNome: presenca.visitanteNome,
          visitanteInstituicao: presenca.visitanteInstituicao,
          status: statusPresenca,
        },
      });
      tentarSincronizar(meetingId);
    },
    [meetingId, persistir],
  );

  const marcarTodosPresentes = useCallback(async () => {
    const atual = rascunhoRef.current;
    if (!atual) return;
    const presencas = atual.presencas.map((p) =>
      p.profileId ? { ...p, status: "presente" as AttendanceStatus } : p,
    );
    await persistir({ ...atual, presencas });
    for (const p of presencas.filter((p) => p.profileId)) {
      await enfileirarMutacao({
        id: gerarUuid(),
        meetingId,
        kind: "upsert_presenca",
        payload: {
          id: p.id,
          meetingId,
          profileId: p.profileId,
          visitanteNome: null,
          visitanteInstituicao: null,
          status: "presente",
        },
      });
    }
    tentarSincronizar(meetingId);
  }, [meetingId, persistir]);

  const adicionarVisitante = useCallback(
    async (nome: string, instituicao: string) => {
      const atual = rascunhoRef.current;
      if (!atual) return;
      const id = gerarUuid();
      const presencas = [
        ...atual.presencas,
        {
          id,
          profileId: null,
          visitanteNome: nome,
          visitanteInstituicao: instituicao || null,
          status: "presente" as AttendanceStatus,
        },
      ];
      await persistir({ ...atual, presencas });
      await enfileirarMutacao({
        id: gerarUuid(),
        meetingId,
        kind: "upsert_presenca",
        payload: {
          id,
          meetingId,
          profileId: null,
          visitanteNome: nome,
          visitanteInstituicao: instituicao || null,
          status: "presente",
        },
      });
      tentarSincronizar(meetingId);
    },
    [meetingId, persistir],
  );

  const adicionarTopico = useCallback(
    async (titulo: string) => {
      const atual = rascunhoRef.current;
      if (!atual) return null;
      const id = gerarUuid();
      const ordem = atual.topicos.length;
      const topicos = [...atual.topicos, { id, titulo, ordem }];
      await persistir({ ...atual, topicos });
      await enfileirarMutacao({
        id: gerarUuid(),
        meetingId,
        kind: "criar_topico",
        payload: { id, meetingId, titulo, ordem },
      });
      tentarSincronizar(meetingId);
      return id;
    },
    [meetingId, persistir],
  );

  const adicionarNota = useCallback(
    async (
      texto: string,
      agendaItemId: string | null,
      tipo: NoteTipo = "nota",
      extra?: { responsavelId?: string | null; prazo?: string | null },
    ) => {
      const atual = rascunhoRef.current;
      if (!atual || !texto.trim()) return;
      const id = gerarUuid();
      const actionItemId = tipo === "encaminhamento" ? gerarUuid() : null;
      const hora = new Date().toISOString();
      const nota: NotaLocal = {
        id,
        agendaItemId,
        texto: texto.trim(),
        tipo,
        actionItemId,
        responsavelId: extra?.responsavelId ?? null,
        prazo: extra?.prazo ?? null,
        hora,
      };
      await persistir({ ...atual, notas: [...atual.notas, nota] });
      await enfileirarMutacao({
        id: gerarUuid(),
        meetingId,
        kind: "criar_nota",
        payload: {
          id,
          meetingId,
          minutesId: atual.minutesId,
          agendaItemId,
          texto: nota.texto,
          tipo,
          horaISO: hora,
          actionItemId,
          responsavelId: extra?.responsavelId ?? null,
          prazo: extra?.prazo ?? null,
        },
      });
      tentarSincronizar(meetingId);
    },
    [meetingId, persistir],
  );

  const retagNota = useCallback(
    async (
      notaId: string,
      tipo: NoteTipo,
      extra?: { responsavelId?: string | null; prazo?: string | null },
    ) => {
      const atual = rascunhoRef.current;
      if (!atual) return;
      const nota = atual.notas.find((n) => n.id === notaId);
      if (!nota) return;
      const actionItemId =
        tipo === "encaminhamento" ? nota.actionItemId ?? gerarUuid() : null;
      const notaAtualizada: NotaLocal = {
        ...nota,
        tipo,
        actionItemId,
        responsavelId: tipo === "encaminhamento" ? extra?.responsavelId ?? nota.responsavelId : null,
        prazo: tipo === "encaminhamento" ? extra?.prazo ?? nota.prazo : null,
      };
      await persistir({
        ...atual,
        notas: atual.notas.map((n) => (n.id === notaId ? notaAtualizada : n)),
      });
      await enfileirarMutacao({
        id: gerarUuid(),
        meetingId,
        kind: "atualizar_nota",
        payload: {
          id: notaId,
          meetingId,
          minutesId: atual.minutesId,
          texto: notaAtualizada.texto,
          tipo,
          actionItemId,
          responsavelId: notaAtualizada.responsavelId,
          prazo: notaAtualizada.prazo,
        },
      });
      tentarSincronizar(meetingId);
    },
    [meetingId, persistir],
  );

  const enviarFoto = useCallback(
    async (nome: string, base64: string, contentType: string) => {
      const atual = rascunhoRef.current;
      if (!atual) return;
      const id = gerarUuid();
      await enfileirarMutacao({
        id: gerarUuid(),
        meetingId,
        kind: "upload_foto",
        payload: { id, meetingId, minutesId: atual.minutesId, nome, base64, contentType },
      });
      tentarSincronizar(meetingId);
    },
    [meetingId],
  );

  return {
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
  };
}
