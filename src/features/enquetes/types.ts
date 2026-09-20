import type { Database } from "@/lib/supabase/types";

export type { PollVoto } from "@/lib/supabase/types";
export type Poll = Database["public"]["Tables"]["polls"]["Row"];
export type PollOption = Database["public"]["Tables"]["poll_options"]["Row"];
export type PollVote = Database["public"]["Tables"]["poll_votes"]["Row"];
export type PollComment = Database["public"]["Tables"]["poll_comments"]["Row"];

export interface PollComMeta extends Poll {
  meeting_types: { nome: string; cor: string } | null;
}

export interface VotoComPerfil extends PollVote {
  profiles: { nome_exibicao: string; foto_url: string | null } | null;
}

export interface OpcaoComVotos extends PollOption {
  locations: { nome: string } | null;
  poll_votes: VotoComPerfil[];
}

export interface EnqueteDetalhe extends PollComMeta {
  poll_options: OpcaoComVotos[];
}

export interface ComentarioComPerfil extends PollComment {
  profiles: { nome_exibicao: string; foto_url: string | null } | null;
}

export interface MembroElegivel {
  id: string;
  nome_exibicao: string;
  foto_url: string | null;
}

export interface NovaOpcaoInput {
  dataISO: string;
  horaMinuto: string;
  modalidade: "presencial" | "online";
  locationId?: string | null;
  linkOnline?: string | null;
}
