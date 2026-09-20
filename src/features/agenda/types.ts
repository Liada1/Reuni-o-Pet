import type { Database } from "@/lib/supabase/types";

export type Meeting = Database["public"]["Tables"]["meetings"]["Row"];

export interface ReuniaoComDetalhes extends Meeting {
  meeting_types: { nome: string; cor: string } | null;
  locations: { nome: string; endereco: string | null } | null;
}
