import type { NoteTipo, AttendanceStatus } from "@/lib/supabase/types";

export interface PresencaLocal {
  id: string;
  profileId: string | null;
  visitanteNome: string | null;
  visitanteInstituicao: string | null;
  status: AttendanceStatus;
}

export interface NotaLocal {
  id: string;
  agendaItemId: string | null;
  texto: string;
  tipo: NoteTipo;
  actionItemId: string | null;
  responsavelId: string | null;
  prazo: string | null;
  hora: string;
}

export interface TopicoLocal {
  id: string;
  titulo: string;
  ordem: number;
}

export interface RascunhoReuniao {
  meetingId: string;
  minutesId: string;
  iniciadaEm: string | null;
  encerradaEm: string | null;
  presencas: PresencaLocal[];
  topicos: TopicoLocal[];
  notas: NotaLocal[];
  atualizadoEm: number;
}

export type MutacaoKind =
  | "iniciar_reuniao"
  | "encerrar_reuniao"
  | "upsert_presenca"
  | "criar_topico"
  | "criar_nota"
  | "atualizar_nota"
  | "upload_foto";

export interface MutacaoOutbox {
  seq?: number;
  id: string;
  meetingId: string;
  kind: MutacaoKind;
  payload: unknown;
  createdAt: number;
  tentativas: number;
}
