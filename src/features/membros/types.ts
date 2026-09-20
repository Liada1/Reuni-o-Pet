import type { Database } from "@/lib/supabase/types";

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type Invite = Database["public"]["Tables"]["invites"]["Row"];

export interface MembroComGat extends Profile {
  gats: { nome: string } | null;
}

export interface ConviteComGat extends Invite {
  gats: { nome: string } | null;
}
