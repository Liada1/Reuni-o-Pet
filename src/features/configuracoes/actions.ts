"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/features/auth";
import { isCoordenacao } from "@/lib/permissions";
import type { ProgramaSettings, PerfisNomesSettings } from "./types";

async function exigirCoordenacao() {
  const perfil = await getCurrentProfile();
  if (!isCoordenacao(perfil)) {
    throw new Error("Apenas a coordenação pode alterar configurações.");
  }
  return perfil!;
}

async function salvarSetting(key: string, value: Record<string, unknown>) {
  const perfil = await exigirCoordenacao();
  const supabase = await createClient();
  const { error } = await supabase
    .from("settings")
    .update({ value, updated_by: perfil.id })
    .eq("key", key);
  if (error) throw new Error(error.message);
  revalidatePath("/configuracoes");
}

export async function atualizarPrograma(dados: ProgramaSettings) {
  await salvarSetting("programa", dados as unknown as Record<string, unknown>);
}

export async function atualizarPerfisNomes(dados: PerfisNomesSettings) {
  await salvarSetting("perfis_nomes", dados as unknown as Record<string, unknown>);
}

export async function criarGat(nome: string) {
  await exigirCoordenacao();
  const supabase = await createClient();
  const { data, error } = await supabase.from("gats").insert({ nome }).select().single();
  if (error || !data) throw new Error(error?.message ?? "Erro ao criar GAT.");
  revalidatePath("/configuracoes");
  return data;
}

export async function renomearGat(id: string, nome: string) {
  await exigirCoordenacao();
  const supabase = await createClient();
  const { error } = await supabase.from("gats").update({ nome }).eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/configuracoes");
}

export async function alternarAtivoGat(id: string, ativo: boolean) {
  await exigirCoordenacao();
  const supabase = await createClient();
  const { error } = await supabase.from("gats").update({ ativo }).eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/configuracoes");
}

export async function criarTipoEncontro(dados: {
  nome: string;
  cor: string;
  duracao_padrao_minutos: number;
}) {
  await exigirCoordenacao();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("meeting_types")
    .insert(dados)
    .select()
    .single();
  if (error || !data) throw new Error(error?.message ?? "Erro ao criar tipo de encontro.");
  revalidatePath("/configuracoes");
  return data;
}

export async function atualizarTipoEncontro(
  id: string,
  dados: Partial<{ nome: string; cor: string; duracao_padrao_minutos: number }>,
) {
  await exigirCoordenacao();
  const supabase = await createClient();
  const { error } = await supabase.from("meeting_types").update(dados).eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/configuracoes");
}

export async function alternarAtivoTipoEncontro(id: string, ativo: boolean) {
  await exigirCoordenacao();
  const supabase = await createClient();
  const { error } = await supabase
    .from("meeting_types")
    .update({ ativo })
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/configuracoes");
}

export async function criarLocal(dados: { nome: string; endereco?: string }) {
  await exigirCoordenacao();
  const supabase = await createClient();
  const { data, error } = await supabase.from("locations").insert(dados).select().single();
  if (error || !data) throw new Error(error?.message ?? "Erro ao criar local.");
  revalidatePath("/configuracoes");
  return data;
}

export async function atualizarLocal(
  id: string,
  dados: Partial<{ nome: string; endereco: string | null }>,
) {
  await exigirCoordenacao();
  const supabase = await createClient();
  const { error } = await supabase.from("locations").update(dados).eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/configuracoes");
}

export async function alternarAtivoLocal(id: string, ativo: boolean) {
  await exigirCoordenacao();
  const supabase = await createClient();
  const { error } = await supabase.from("locations").update({ ativo }).eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/configuracoes");
}
