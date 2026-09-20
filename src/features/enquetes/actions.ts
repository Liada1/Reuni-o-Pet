"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/features/auth";
import { getProgramaSettings } from "@/features/configuracoes";
import { isCoordenacao } from "@/lib/permissions";
import { gerarCodigoConvite } from "@/lib/utils";
import { paraUtc } from "@/lib/dates";
import type { NovaOpcaoInput, PollVoto } from "./types";
import type { PollPublico } from "@/lib/supabase/types";

async function exigirCoordenacao() {
  const perfil = await getCurrentProfile();
  if (!isCoordenacao(perfil)) {
    throw new Error("Apenas a coordenação pode gerenciar enquetes.");
  }
  return perfil!;
}

export interface CriarEnqueteInput {
  titulo: string;
  descricao?: string;
  meetingTypeId: string;
  duracaoMinutos: number;
  opcoes: NovaOpcaoInput[];
  prazoVotacao?: { dataISO: string; horaMinuto: string } | null;
  publicoAlvo: PollPublico;
  gatId?: string | null;
  pessoasIds?: string[];
  votosVisiveis: boolean;
}

export async function criarEnquete(input: CriarEnqueteInput) {
  const perfil = await exigirCoordenacao();
  const supabase = await createClient();
  const programa = await getProgramaSettings();

  if (input.opcoes.length === 0) {
    throw new Error("Adicione ao menos uma opção de data.");
  }

  let code = "";
  for (let tentativa = 0; tentativa < 5; tentativa++) {
    const candidato = gerarCodigoConvite();
    const { data } = await supabase
      .from("polls")
      .select("id")
      .eq("code", candidato)
      .maybeSingle();
    if (!data) {
      code = candidato;
      break;
    }
  }
  if (!code) throw new Error("Não foi possível gerar um código único para a enquete.");

  const { data: poll, error } = await supabase
    .from("polls")
    .insert({
      code,
      titulo: input.titulo,
      descricao: input.descricao || null,
      meeting_type_id: input.meetingTypeId,
      duracao_minutos: input.duracaoMinutos,
      prazo_votacao: input.prazoVotacao
        ? paraUtc(input.prazoVotacao.dataISO, input.prazoVotacao.horaMinuto, programa.fuso_horario).toISOString()
        : null,
      publico_alvo: input.publicoAlvo,
      gat_id: input.publicoAlvo === "gat" ? input.gatId : null,
      votos_visiveis: input.votosVisiveis,
      created_by: perfil.id,
    })
    .select("id")
    .single();

  if (error || !poll) throw new Error(error?.message ?? "Erro ao criar enquete.");

  const opcoes = input.opcoes.map((o) => ({
    poll_id: poll.id,
    inicio: paraUtc(o.dataISO, o.horaMinuto, programa.fuso_horario).toISOString(),
    modalidade: o.modalidade,
    location_id: o.modalidade === "presencial" ? o.locationId || null : null,
    link_online: o.modalidade === "online" ? o.linkOnline || null : null,
  }));

  const { error: erroOpcoes } = await supabase.from("poll_options").insert(opcoes);
  if (erroOpcoes) throw new Error(erroOpcoes.message);

  if (input.publicoAlvo === "pessoas" && input.pessoasIds?.length) {
    const { error: erroVoters } = await supabase
      .from("poll_voters")
      .insert(input.pessoasIds.map((profile_id) => ({ poll_id: poll.id, profile_id })));
    if (erroVoters) throw new Error(erroVoters.message);
  }

  revalidatePath("/enquetes");
  return { id: poll.id, code };
}

export async function votar(
  pollId: string,
  votos: { optionId: string; valor: PollVoto }[],
  comentario?: string,
) {
  const perfil = await getCurrentProfile();
  if (!perfil) throw new Error("É preciso estar autenticado para votar.");

  const supabase = await createClient();

  const { data: poll } = await supabase
    .from("polls")
    .select("status")
    .eq("id", pollId)
    .maybeSingle();
  if (!poll) throw new Error("Enquete não encontrada.");
  if (poll.status !== "aberta") {
    throw new Error("Esta enquete já foi encerrada e não aceita mais votos.");
  }

  const { data: opcoesDaEnquete } = await supabase
    .from("poll_options")
    .select("id")
    .eq("poll_id", pollId);
  const idsOpcoes = (opcoesDaEnquete ?? []).map((o) => o.id);

  if (idsOpcoes.length > 0) {
    const { error: erroDelete } = await supabase
      .from("poll_votes")
      .delete()
      .eq("profile_id", perfil.id)
      .in("option_id", idsOpcoes);
    if (erroDelete) throw new Error(erroDelete.message);
  }

  if (votos.length > 0) {
    const { error: erroInsert } = await supabase.from("poll_votes").insert(
      votos.map((v) => ({
        option_id: v.optionId,
        profile_id: perfil.id,
        valor: v.valor,
      })),
    );
    if (erroInsert) throw new Error(erroInsert.message);
  }

  if (comentario?.trim()) {
    await supabase.from("poll_comments").insert({
      poll_id: pollId,
      profile_id: perfil.id,
      texto: comentario.trim(),
    });
  }

  revalidatePath(`/enquetes/${pollId}`);
}

export async function confirmarData(pollId: string, optionId: string) {
  const perfil = await exigirCoordenacao();
  const supabase = await createClient();

  const { data: poll } = await supabase.from("polls").select("*").eq("id", pollId).single();
  if (!poll) throw new Error("Enquete não encontrada.");

  const { data: opcao } = await supabase
    .from("poll_options")
    .select("*")
    .eq("id", optionId)
    .eq("poll_id", pollId)
    .maybeSingle();
  if (!opcao) throw new Error("Opção não encontrada para esta enquete.");

  // Trava otimista: só avança se a enquete ainda estiver aberta. Evita que
  // duas confirmações simultâneas (duas abas, duas pessoas da coordenação)
  // criem duas reuniões para a mesma enquete.
  const { data: travada, error: erroTrava } = await supabase
    .from("polls")
    .update({ status: "confirmada", confirmed_option_id: optionId })
    .eq("id", pollId)
    .eq("status", "aberta")
    .select("id")
    .maybeSingle();
  if (erroTrava) throw new Error(erroTrava.message);
  if (!travada) {
    throw new Error("Esta enquete já foi confirmada ou fechada por outra pessoa.");
  }

  const inicio = new Date(opcao.inicio);
  const fim = new Date(inicio.getTime() + poll.duracao_minutos * 60_000);

  const { data: meeting, error: erroMeeting } = await supabase
    .from("meetings")
    .insert({
      meeting_type_id: poll.meeting_type_id,
      titulo: poll.titulo,
      inicio: inicio.toISOString(),
      fim_previsto: fim.toISOString(),
      modalidade: opcao.modalidade,
      location_id: opcao.location_id,
      link_online: opcao.link_online,
      status: "agendada",
      poll_id: poll.id,
      created_by: perfil.id,
    })
    .select("id")
    .single();
  if (erroMeeting || !meeting) throw new Error(erroMeeting?.message ?? "Erro ao criar reunião.");

  const { error: erroPoll } = await supabase
    .from("polls")
    .update({ meeting_id: meeting.id })
    .eq("id", pollId);
  if (erroPoll) throw new Error(erroPoll.message);

  revalidatePath("/enquetes");
  revalidatePath(`/enquetes/${pollId}`);
  revalidatePath("/agenda");
  return { meetingId: meeting.id as string };
}
