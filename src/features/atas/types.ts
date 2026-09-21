import type { Database } from "@/lib/supabase/types";

export type AgendaItem = Database["public"]["Tables"]["agenda_items"]["Row"];
export type Attendance = Database["public"]["Tables"]["attendance"]["Row"];
export type Minute = Database["public"]["Tables"]["minutes"]["Row"];
export type ActionItem = Database["public"]["Tables"]["action_items"]["Row"];
export type MinuteNote = Database["public"]["Tables"]["minute_notes"]["Row"];
export type MinuteComment = Database["public"]["Tables"]["minute_comments"]["Row"];
export type MinutePdf = Database["public"]["Tables"]["minute_pdfs"]["Row"];
export type Attachment = Database["public"]["Tables"]["attachments"]["Row"];

export interface AttendanceComPerfil extends Attendance {
  profiles: { nome_completo: string; nome_exibicao: string; foto_url: string | null } | null;
}

export interface ActionItemComResponsavel extends ActionItem {
  profiles: { nome_exibicao: string } | null;
}

export interface MinuteNoteComAutor extends MinuteNote {
  profiles: { nome_exibicao: string } | null;
}

export interface CommentComPerfil extends MinuteComment {
  profiles: { nome_exibicao: string; foto_url: string | null } | null;
}

export interface EncaminhamentoComContexto extends ActionItem {
  profiles: { nome_exibicao: string } | null;
  minutes: {
    meeting_id: string;
    meetings: {
      titulo: string | null;
      inicio: string;
      meeting_type_id: string;
      meeting_types: { nome: string; cor: string } | null;
    } | null;
  } | null;
}

export interface AtaComContexto extends Minute {
  meetings: {
    titulo: string | null;
    inicio: string;
    meeting_type_id: string;
    meeting_types: { nome: string; cor: string } | null;
  } | null;
}

export interface AtaCompleta {
  minute: Minute;
  meeting: Database["public"]["Tables"]["meetings"]["Row"] & {
    meeting_types: { nome: string; cor: string } | null;
    locations: { nome: string; endereco: string | null } | null;
  };
  agendaItems: AgendaItem[];
  attendance: AttendanceComPerfil[];
  notes: MinuteNoteComAutor[];
  actionItems: ActionItemComResponsavel[];
  comments: CommentComPerfil[];
  attachments: Attachment[];
}
