"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/features/auth";
import { isCoordenacao } from "@/lib/permissions";
import { formatarDataSimples } from "@/lib/dates";
import type {
  AttendanceStatus,
  NoteTipo,
  MinuteStatus,
  ActionItemStatus,
} from "@/lib/supabase/types";

async function exigirPerfil() {
  const perfil = await getCurrentProfile();
  if (!perfil) throw new Error("É preciso estar autenticado.");
  return perfil;
}

async function podeEditarAta(meetingId: string): Promise<boolean> {
  const perfil = await getCurrentProfile();
  if (!perfil) return false;
  if (isCoordenacao(perfil)) return true;
  const supabase = await createClient();
  const { data } = await supabase
    .from("meetings")
    .select("relator_id")
    .eq("id", meetingId)
    .maybeSingle();
  return data?.relator_id === perfil.id;
}

async function exigirPodeEditarAta(meetingId: string) {
  const perfil = await exigirPerfil();
  if (!(await podeEditarAta(meetingId))) {
    throw new Error("Só a coordenação ou quem foi designado como relator pode editar esta ata.");
  }
  return perfil;
}

// ---------------------------------------------------------------------------
// Pauta
// ---------------------------------------------------------------------------

export async function sugerirTopico(meetingId: string, titulo: string) {
  const perfil = await exigirPerfil();
  const supabase = await createClient();
  const { data: existentes } = await supabase
    .from("agenda_items")
    .select("ordem")
    .eq("meeting_id", meetingId)
    .order("ordem", { ascending: false })
    .limit(1);
  const ordem = (existentes?.[0]?.ordem ?? -1) + 1;

  const { error } = await supabase.from("agenda_items").insert({
    meeting_id: meetingId,
    titulo,
    ordem,
    sugerido_por: perfil.id,
    aceito: false,
  });
  if (error) throw new Error(error.message);
  revalidatePath(`/reunioes/${meetingId}`);
}

export async function criarTopicoPauta(meetingId: string, titulo: string) {
  await exigirPodeEditarAta(meetingId);
  const supabase = await createClient();
  const { data: existentes } = await supabase
    .from("agenda_items")
    .select("ordem")
    .eq("meeting_id", meetingId)
    .order("ordem", { ascending: false })
    .limit(1);
  const ordem = (existentes?.[0]?.ordem ?? -1) + 1;

  const { error } = await supabase
    .from("agenda_items")
    .insert({ meeting_id: meetingId, titulo, ordem, aceito: true });
  if (error) throw new Error(error.message);
  revalidatePath(`/reunioes/${meetingId}`);
}

export async function criarTopicoRetomada(
  meetingId: string,
  itens: { descricao: string; responsavel: string | null; prazo: string | null }[],
) {
  await exigirPodeEditarAta(meetingId);
  const linhas = itens
    .map(
      (i) =>
        `- ${i.descricao}${i.responsavel ? ` (${i.responsavel})` : ""}${i.prazo ? ` — prazo ${formatarDataSimples(i.prazo)}` : ""}`,
    )
    .join("\n");
  await criarTopicoPauta(meetingId, `Retomada dos encaminhamentos\n${linhas}`);
}

export async function aceitarTopico(id: string, meetingId: string) {
  await exigirPodeEditarAta(meetingId);
  const supabase = await createClient();
  const { error } = await supabase.from("agenda_items").update({ aceito: true }).eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath(`/reunioes/${meetingId}`);
}

export async function removerTopico(id: string, meetingId: string) {
  const perfil = await exigirPerfil();
  const supabase = await createClient();
  const { data: item } = await supabase
    .from("agenda_items")
    .select("sugerido_por, aceito")
    .eq("id", id)
    .maybeSingle();
  const podeRemoverProprio = item && !item.aceito && item.sugerido_por === perfil.id;
  if (!podeRemoverProprio && !(await podeEditarAta(meetingId))) {
    throw new Error("Sem permissão para remover este tópico.");
  }
  const { error } = await supabase.from("agenda_items").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath(`/reunioes/${meetingId}`);
}

export async function designarRelator(meetingId: string, profileId: string | null) {
  const perfil = await exigirPerfil();
  if (!isCoordenacao(perfil)) throw new Error("Apenas a coordenação designa quem escreve a ata.");
  const supabase = await createClient();
  const { error } = await supabase
    .from("meetings")
    .update({ relator_id: profileId })
    .eq("id", meetingId);
  if (error) throw new Error(error.message);
  revalidatePath(`/reunioes/${meetingId}`);
}

// ---------------------------------------------------------------------------
// Modo reunião — chamadas diretamente quando online, ou despachadas pela
// fila de sincronização em src/lib/offline/sync.ts quando não. Por isso
// todas usam ids gerados no cliente e upsert/on-conflict idempotente: a
// mesma mutação pode ser reaplicada com segurança se a fila reprocessar.
// ---------------------------------------------------------------------------

export interface IniciarReuniaoInput {
  meetingId: string;
  minutesId: string;
  iniciadaEmISO: string;
}

export async function iniciarReuniaoAction(input: IniciarReuniaoInput) {
  const perfil = await exigirPodeEditarAta(input.meetingId);
  const supabase = await createClient();

  const { error: erroMinute } = await supabase.from("minutes").upsert(
    {
      id: input.minutesId,
      meeting_id: input.meetingId,
      status: "rascunho",
      reporter_id: perfil.id,
    },
    { onConflict: "meeting_id", ignoreDuplicates: true },
  );
  if (erroMinute) throw new Error(erroMinute.message);

  const { error: erroMeeting } = await supabase
    .from("meetings")
    .update({ inicio_real: input.iniciadaEmISO, status: "em_andamento" })
    .eq("id", input.meetingId);
  if (erroMeeting) throw new Error(erroMeeting.message);

  revalidatePath(`/reunioes/${input.meetingId}`);
}

export interface EncerrarReuniaoInput {
  meetingId: string;
  encerradaEmISO: string;
}

export async function encerrarReuniaoAction(input: EncerrarReuniaoInput) {
  await exigirPodeEditarAta(input.meetingId);
  const supabase = await createClient();
  const { error } = await supabase
    .from("meetings")
    .update({ fim_real: input.encerradaEmISO, status: "realizada" })
    .eq("id", input.meetingId);
  if (error) throw new Error(error.message);
  revalidatePath(`/reunioes/${input.meetingId}`);
}

export interface UpsertPresencaInput {
  id: string;
  meetingId: string;
  profileId: string | null;
  visitanteNome: string | null;
  visitanteInstituicao: string | null;
  status: AttendanceStatus;
}

export async function upsertPresencaAction(input: UpsertPresencaInput) {
  await exigirPodeEditarAta(input.meetingId);
  const supabase = await createClient();
  const { error } = await supabase.from("attendance").upsert(
    {
      id: input.id,
      meeting_id: input.meetingId,
      profile_id: input.profileId,
      visitante_nome: input.visitanteNome,
      visitante_instituicao: input.visitanteInstituicao,
      status: input.status,
    },
    { onConflict: input.profileId ? "meeting_id,profile_id" : "id" },
  );
  if (error) throw new Error(error.message);
  revalidatePath(`/reunioes/${input.meetingId}`);
}

export interface CriarTopicoLiveInput {
  id: string;
  meetingId: string;
  titulo: string;
  ordem: number;
}

export async function criarTopicoLiveAction(input: CriarTopicoLiveInput) {
  await exigirPodeEditarAta(input.meetingId);
  const supabase = await createClient();
  const { error } = await supabase.from("agenda_items").upsert(
    {
      id: input.id,
      meeting_id: input.meetingId,
      titulo: input.titulo,
      ordem: input.ordem,
      aceito: true,
    },
    { onConflict: "id", ignoreDuplicates: true },
  );
  if (error) throw new Error(error.message);
  revalidatePath(`/reunioes/${input.meetingId}`);
}

export interface CriarNotaInput {
  id: string;
  meetingId: string;
  minutesId: string;
  agendaItemId: string | null;
  texto: string;
  tipo: NoteTipo;
  horaISO: string;
  actionItemId: string | null;
  responsavelId: string | null;
  prazo: string | null;
}

export async function criarNotaAction(input: CriarNotaInput) {
  const perfil = await exigirPodeEditarAta(input.meetingId);
  const supabase = await createClient();

  if (input.tipo === "encaminhamento" && input.actionItemId) {
    const { error: erroAction } = await supabase.from("action_items").upsert(
      {
        id: input.actionItemId,
        minutes_id: input.minutesId,
        descricao: input.texto,
        responsavel_id: input.responsavelId,
        prazo: input.prazo,
        status: "pendente",
      },
      { onConflict: "id", ignoreDuplicates: true },
    );
    if (erroAction) throw new Error(erroAction.message);
  }

  const { error } = await supabase.from("minute_notes").upsert(
    {
      id: input.id,
      minutes_id: input.minutesId,
      agenda_item_id: input.agendaItemId,
      autor_id: perfil.id,
      texto: input.texto,
      tipo: input.tipo,
      action_item_id: input.tipo === "encaminhamento" ? input.actionItemId : null,
      hora: input.horaISO,
    },
    { onConflict: "id", ignoreDuplicates: true },
  );
  if (error) throw new Error(error.message);
  revalidatePath(`/reunioes/${input.meetingId}`);
}

export interface AtualizarNotaInput {
  id: string;
  meetingId: string;
  minutesId: string;
  texto: string;
  tipo: NoteTipo;
  actionItemId: string | null;
  responsavelId: string | null;
  prazo: string | null;
}

export async function atualizarNotaAction(input: AtualizarNotaInput) {
  await exigirPodeEditarAta(input.meetingId);
  const supabase = await createClient();

  let actionItemId = input.actionItemId;
  if (input.tipo === "encaminhamento") {
    if (!actionItemId) throw new Error("Encaminhamento sem identificador.");
    const { error: erroAction } = await supabase.from("action_items").upsert(
      {
        id: actionItemId,
        minutes_id: input.minutesId,
        descricao: input.texto,
        responsavel_id: input.responsavelId,
        prazo: input.prazo,
        status: "pendente",
      },
      { onConflict: "id" },
    );
    if (erroAction) throw new Error(erroAction.message);
  } else {
    actionItemId = null;
  }

  const { error } = await supabase
    .from("minute_notes")
    .update({ texto: input.texto, tipo: input.tipo, action_item_id: actionItemId })
    .eq("id", input.id);
  if (error) throw new Error(error.message);
  revalidatePath(`/reunioes/${input.meetingId}`);
}

export interface UploadFotoInput {
  id: string;
  meetingId: string;
  minutesId: string;
  nome: string;
  base64: string;
  contentType: string;
}

export async function uploadFotoAction(input: UploadFotoInput) {
  const perfil = await exigirPodeEditarAta(input.meetingId);
  const supabase = await createClient();

  const caminho = `minutes/${input.minutesId}/${input.id}-${input.nome}`;
  const bytes = Buffer.from(input.base64, "base64");
  const { error: erroUpload } = await supabase.storage
    .from("atas")
    .upload(caminho, bytes, { contentType: input.contentType, upsert: true });
  if (erroUpload) throw new Error(erroUpload.message);

  const { error } = await supabase.from("attachments").upsert(
    {
      id: input.id,
      minutes_id: input.minutesId,
      storage_path: caminho,
      nome: input.nome,
      uploaded_by: perfil.id,
    },
    { onConflict: "id", ignoreDuplicates: true },
  );
  if (error) throw new Error(error.message);
  revalidatePath(`/reunioes/${input.meetingId}`);
}

export async function removerAnexo(id: string, meetingId: string, storagePath: string) {
  await exigirPodeEditarAta(meetingId);
  const supabase = await createClient();
  await supabase.storage.from("atas").remove([storagePath]);
  const { error } = await supabase.from("attachments").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath(`/reunioes/${meetingId}`);
}

export async function urlAssinadaAnexo(storagePath: string) {
  const supabase = await createClient();
  const { data, error } = await supabase.storage
    .from("atas")
    .createSignedUrl(storagePath, 60 * 10);
  if (error || !data) throw new Error(error?.message ?? "Erro ao gerar link do anexo.");
  return data.signedUrl;
}

// ---------------------------------------------------------------------------
// Revisão e aprovação
// ---------------------------------------------------------------------------

export async function atualizarRelato(
  minutesId: string,
  meetingId: string,
  chave: string,
  texto: string,
) {
  await exigirPodeEditarAta(meetingId);
  const supabase = await createClient();
  // Merge atômico no banco (função merge_relato) em vez de ler+escrever no
  // cliente — evita que dois tópicos salvando quase ao mesmo tempo (ex:
  // auto-save do rascunho inicial de cada RelatoEditor ao montar) percam a
  // escrita um do outro.
  const { error } = await supabase.rpc("merge_relato", {
    p_minutes_id: minutesId,
    p_chave: chave,
    p_texto: texto,
  });
  if (error) throw new Error(error.message);
  revalidatePath(`/reunioes/${meetingId}/ata`);
}

export async function definirProximaReuniao(
  minutesId: string,
  meetingId: string,
  proximaReuniaoId: string | null,
) {
  await exigirPodeEditarAta(meetingId);
  const supabase = await createClient();
  const { error } = await supabase
    .from("minutes")
    .update({ proxima_reuniao_id: proximaReuniaoId })
    .eq("id", minutesId);
  if (error) throw new Error(error.message);
  revalidatePath(`/reunioes/${meetingId}/ata`);
}

export async function mudarStatusAta(minutesId: string, meetingId: string, status: MinuteStatus) {
  const perfil = await exigirPodeEditarAta(meetingId);
  if (status === "aprovada" && !isCoordenacao(perfil)) {
    throw new Error("Só a coordenação aprova a ata.");
  }
  const supabase = await createClient();
  const dados =
    status === "aprovada"
      ? { status, aprovada_por: perfil.id, aprovada_em: new Date().toISOString() }
      : { status };
  const { error } = await supabase.from("minutes").update(dados).eq("id", minutesId);
  if (error) throw new Error(error.message);
  revalidatePath(`/reunioes/${meetingId}/ata`);
  revalidatePath("/atas");
}

export async function comentarAta(minutesId: string, meetingId: string, texto: string) {
  const perfil = await exigirPerfil();
  const supabase = await createClient();
  const { error } = await supabase
    .from("minute_comments")
    .insert({ minutes_id: minutesId, profile_id: perfil.id, texto });
  if (error) throw new Error(error.message);
  revalidatePath(`/reunioes/${meetingId}/ata`);
}

export async function removerComentario(id: string, meetingId: string) {
  const perfil = await exigirPerfil();
  const supabase = await createClient();
  const { data: comentario } = await supabase
    .from("minute_comments")
    .select("profile_id")
    .eq("id", id)
    .maybeSingle();
  if (comentario?.profile_id !== perfil.id && !(await podeEditarAta(meetingId))) {
    throw new Error("Sem permissão para remover este comentário.");
  }
  const { error } = await supabase.from("minute_comments").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath(`/reunioes/${meetingId}/ata`);
}

export async function atualizarStatusEncaminhamento(id: string, status: ActionItemStatus) {
  const perfil = await exigirPerfil();
  const supabase = await createClient();
  const { data: item } = await supabase
    .from("action_items")
    .select("responsavel_id")
    .eq("id", id)
    .maybeSingle();
  if (item?.responsavel_id !== perfil.id && !isCoordenacao(perfil)) {
    throw new Error("Só o responsável ou a coordenação mudam o status.");
  }
  const { error } = await supabase.from("action_items").update({ status }).eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/encaminhamentos");
  revalidatePath("/");
}

export async function editarEncaminhamento(
  id: string,
  meetingId: string,
  dados: { descricao?: string; responsavelId?: string | null; prazo?: string | null },
) {
  await exigirPodeEditarAta(meetingId);
  const supabase = await createClient();
  const { error } = await supabase
    .from("action_items")
    .update({
      descricao: dados.descricao,
      responsavel_id: dados.responsavelId,
      prazo: dados.prazo,
    })
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath(`/reunioes/${meetingId}/ata`);
  revalidatePath("/encaminhamentos");
}

export async function registrarPdfGerado(minutesId: string, meetingId: string, storagePath: string) {
  const perfil = await exigirPodeEditarAta(meetingId);
  const supabase = await createClient();
  const { data: ultima } = await supabase
    .from("minute_pdfs")
    .select("versao")
    .eq("minutes_id", minutesId)
    .order("versao", { ascending: false })
    .limit(1);
  const versao = (ultima?.[0]?.versao ?? 0) + 1;

  const { error } = await supabase
    .from("minute_pdfs")
    .insert({ minutes_id: minutesId, versao, storage_path: storagePath, gerado_por: perfil.id });
  if (error) throw new Error(error.message);
  revalidatePath(`/reunioes/${meetingId}/ata`);
  return { versao };
}
