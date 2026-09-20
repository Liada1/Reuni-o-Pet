"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/features/auth";
import { isCoordenacao } from "@/lib/permissions";
import { gerarCodigoConvite } from "@/lib/utils";
import type { ProfileRole } from "@/lib/supabase/types";

async function exigirCoordenacao() {
  const perfil = await getCurrentProfile();
  if (!isCoordenacao(perfil)) {
    throw new Error("Apenas a coordenação pode gerenciar membros.");
  }
  return perfil!;
}

export async function aprovarMembro(id: string) {
  await exigirCoordenacao();
  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({ status: "ativo" })
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/membros");
}

export async function desativarMembro(id: string) {
  await exigirCoordenacao();
  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({ status: "inativo" })
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/membros");
}

export async function reativarMembro(id: string) {
  await exigirCoordenacao();
  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({ status: "ativo" })
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/membros");
}

export async function atualizarPapelEGat(
  id: string,
  dados: { role?: ProfileRole; gat_id?: string | null },
) {
  await exigirCoordenacao();
  const supabase = await createClient();
  const { error } = await supabase.from("profiles").update(dados).eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/membros");
}

export async function cadastrarMembroDireto(dados: {
  nome_completo: string;
  nome_exibicao: string;
  email: string;
  telefone?: string;
  gat_id: string | null;
  role: ProfileRole;
}) {
  await exigirCoordenacao();
  const supabase = await createClient();
  const { error } = await supabase.from("profiles").insert({
    ...dados,
    telefone: dados.telefone || null,
    status: "ativo",
  });
  if (error) throw new Error(error.message);
  revalidatePath("/membros");
}

export async function gerarConvite(dados: {
  role: ProfileRole;
  gat_id: string | null;
  expira_em_dias: number | null;
}) {
  const perfil = await exigirCoordenacao();
  const supabase = await createClient();

  for (let tentativa = 0; tentativa < 5; tentativa++) {
    const code = gerarCodigoConvite();
    const expires_at = dados.expira_em_dias
      ? new Date(Date.now() + dados.expira_em_dias * 86_400_000).toISOString()
      : null;

    const { error } = await supabase.from("invites").insert({
      code,
      role: dados.role,
      gat_id: dados.gat_id,
      created_by: perfil.id,
      expires_at,
    });

    if (!error) {
      revalidatePath("/membros");
      return { code };
    }
    if (error.code !== "23505") {
      throw new Error(error.message);
    }
  }
  throw new Error("Não foi possível gerar um código de convite único.");
}

export async function revogarConvite(id: string) {
  await exigirCoordenacao();
  const supabase = await createClient();
  const { error } = await supabase
    .from("invites")
    .update({ revoked_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/membros");
}
