import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { MembroComGat, ConviteComGat } from "./types";

export async function getMembros(): Promise<MembroComGat[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("*, gats(nome)")
    .order("nome_completo");
  return (data as unknown as MembroComGat[]) ?? [];
}

export async function contarPendentes(): Promise<number> {
  const supabase = await createClient();
  const { count } = await supabase
    .from("profiles")
    .select("id", { count: "exact", head: true })
    .eq("status", "pendente");
  return count ?? 0;
}

export interface ConvitePublico {
  valido: boolean;
  role: ConviteComGat["role"] | null;
  gatNome: string | null;
}

/**
 * Lê um convite por código para a página pública /convite/[codigo], antes
 * do login. Usa a service role porque não há sessão ainda; retorna só o
 * essencial para exibir o contexto do convite.
 */
export async function getConvitePublico(code: string): Promise<ConvitePublico> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("invites")
    .select("role, expires_at, revoked_at, gats(nome)")
    .eq("code", code)
    .maybeSingle();

  if (!data) return { valido: false, role: null, gatNome: null };

  const expirado = data.expires_at ? new Date(data.expires_at) < new Date() : false;
  const valido = !data.revoked_at && !expirado;

  return {
    valido,
    role: data.role,
    gatNome: (data.gats as unknown as { nome: string } | null)?.nome ?? null,
  };
}

export async function getConvitesAtivos(): Promise<ConviteComGat[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("invites")
    .select("*, gats(nome)")
    .is("revoked_at", null)
    .order("created_at", { ascending: false });
  return (data as unknown as ConviteComGat[]) ?? [];
}
