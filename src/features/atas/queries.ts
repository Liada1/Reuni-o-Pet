import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/features/auth";
import { isCoordenacao } from "@/lib/permissions";
import type {
  AgendaItem,
  AttendanceComPerfil,
  Minute,
  ActionItemComResponsavel,
  MinuteNoteComAutor,
  CommentComPerfil,
  Attachment,
  AtaCompleta,
  EncaminhamentoComContexto,
  AtaComContexto,
} from "./types";
import type { ActionItemStatus, MinuteStatus } from "@/lib/supabase/types";

export async function podeEditarAta(meetingId: string): Promise<boolean> {
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

export async function getPauta(meetingId: string): Promise<AgendaItem[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("agenda_items")
    .select("*")
    .eq("meeting_id", meetingId)
    .order("ordem");
  return data ?? [];
}

export async function getMinutePorMeeting(meetingId: string): Promise<Minute | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("minutes")
    .select("*")
    .eq("meeting_id", meetingId)
    .maybeSingle();
  return data;
}

export async function getAtaCompleta(meetingId: string): Promise<AtaCompleta | null> {
  const supabase = await createClient();

  const { data: meeting } = await supabase
    .from("meetings")
    .select("*, meeting_types(nome, cor), locations(nome, endereco)")
    .eq("id", meetingId)
    .maybeSingle();
  if (!meeting) return null;

  const { data: minute } = await supabase
    .from("minutes")
    .select("*")
    .eq("meeting_id", meetingId)
    .maybeSingle();
  if (!minute) return null;

  const [agendaItems, attendance, notes, actionItems, comments, attachments] = await Promise.all([
    supabase.from("agenda_items").select("*").eq("meeting_id", meetingId).order("ordem"),
    supabase
      .from("attendance")
      .select("*, profiles(nome_completo, nome_exibicao, foto_url)")
      .eq("meeting_id", meetingId),
    supabase
      .from("minute_notes")
      .select("*, profiles(nome_exibicao)")
      .eq("minutes_id", minute.id)
      .order("hora"),
    supabase
      .from("action_items")
      .select("*, profiles(nome_exibicao)")
      .eq("minutes_id", minute.id)
      .order("created_at"),
    supabase
      .from("minute_comments")
      .select("*, profiles(nome_exibicao, foto_url)")
      .eq("minutes_id", minute.id)
      .order("created_at"),
    supabase.from("attachments").select("*").eq("minutes_id", minute.id).order("created_at"),
  ]);

  return {
    minute,
    meeting: meeting as unknown as AtaCompleta["meeting"],
    agendaItems: agendaItems.data ?? [],
    attendance: (attendance.data as unknown as AttendanceComPerfil[]) ?? [],
    notes: (notes.data as unknown as MinuteNoteComAutor[]) ?? [],
    actionItems: (actionItems.data as unknown as ActionItemComResponsavel[]) ?? [],
    comments: (comments.data as unknown as CommentComPerfil[]) ?? [],
    attachments: (attachments.data as Attachment[]) ?? [],
  };
}

export async function getPdfsDaAta(minutesId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("minute_pdfs")
    .select("*")
    .eq("minutes_id", minutesId)
    .order("versao", { ascending: false });
  return data ?? [];
}

export interface FiltrosEncaminhamentos {
  responsavelId?: string;
  status?: ActionItemStatus;
  meetingId?: string;
}

export async function getEncaminhamentos(
  filtros: FiltrosEncaminhamentos = {},
): Promise<EncaminhamentoComContexto[]> {
  const supabase = await createClient();
  let query = supabase
    .from("action_items")
    .select(
      "*, profiles(nome_exibicao), minutes(meeting_id, meetings!minutes_meeting_id_fkey(titulo, inicio, meeting_type_id, meeting_types(nome, cor)))",
    )
    .order("prazo", { ascending: true, nullsFirst: false });

  if (filtros.responsavelId) query = query.eq("responsavel_id", filtros.responsavelId);
  if (filtros.status) query = query.eq("status", filtros.status);
  if (filtros.meetingId) {
    const { data: minute } = await supabase
      .from("minutes")
      .select("id")
      .eq("meeting_id", filtros.meetingId)
      .maybeSingle();
    query = query.eq("minutes_id", minute?.id ?? "00000000-0000-0000-0000-000000000000");
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return (data as unknown as EncaminhamentoComContexto[]) ?? [];
}

/** Encaminhamentos pendentes/em andamento de reuniões passadas do mesmo
 * tipo, para sugerir "Retomada dos encaminhamentos" na pauta da próxima. */
export async function getEncaminhamentosAbertosPorTipo(meetingTypeId: string) {
  const supabase = await createClient();
  const { data: reunioesDoTipo } = await supabase
    .from("meetings")
    .select("id")
    .eq("meeting_type_id", meetingTypeId);
  const idsReunioes = (reunioesDoTipo ?? []).map((r) => r.id);
  if (idsReunioes.length === 0) return [];

  const { data: minutesDoTipo } = await supabase
    .from("minutes")
    .select("id")
    .in("meeting_id", idsReunioes);
  const idsMinutes = (minutesDoTipo ?? []).map((m) => m.id);
  if (idsMinutes.length === 0) return [];

  const { data } = await supabase
    .from("action_items")
    .select("*, profiles(nome_exibicao)")
    .in("minutes_id", idsMinutes)
    .in("status", ["pendente", "em_andamento"])
    .order("prazo", { ascending: true, nullsFirst: false });
  return (data as unknown as ActionItemComResponsavel[]) ?? [];
}

export interface FiltrosAtas {
  meetingTypeId?: string;
  status?: MinuteStatus;
}

export async function getAtas(filtros: FiltrosAtas = {}): Promise<AtaComContexto[]> {
  const supabase = await createClient();
  let query = supabase
    .from("minutes")
    .select("*, meetings!minutes_meeting_id_fkey(titulo, inicio, meeting_type_id, meeting_types(nome, cor))")
    .order("created_at", { ascending: false });

  if (filtros.status) query = query.eq("status", filtros.status);

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  let linhas = (data as unknown as AtaComContexto[]) ?? [];
  if (filtros.meetingTypeId) {
    linhas = linhas.filter((l) => l.meetings?.meeting_type_id === filtros.meetingTypeId);
  }
  return linhas;
}

/** Busca simples por texto dentro das anotações da ata (relato corrido). */
export async function buscarAtasPorTexto(termo: string): Promise<AtaComContexto[]> {
  const supabase = await createClient();
  const { data: notas } = await supabase
    .from("minute_notes")
    .select("minutes_id")
    .ilike("texto", `%${termo}%`)
    .limit(100);

  const idsMinutes = Array.from(new Set((notas ?? []).map((n) => n.minutes_id)));
  if (idsMinutes.length === 0) return [];

  const { data, error } = await supabase
    .from("minutes")
    .select("*, meetings!minutes_meeting_id_fkey(titulo, inicio, meeting_type_id, meeting_types(nome, cor))")
    .in("id", idsMinutes)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data as unknown as AtaComContexto[]) ?? [];
}
