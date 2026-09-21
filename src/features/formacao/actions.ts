"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/features/auth";
import { isCoordenacao } from "@/lib/permissions";

async function exigirCoordenacao() {
  const perfil = await getCurrentProfile();
  if (!isCoordenacao(perfil)) {
    throw new Error("Apenas a coordenação pode registrar formações.");
  }
  return perfil!;
}

function revalidar() {
  revalidatePath("/formacao");
  revalidatePath("/planejamento");
  revalidatePath("/frequencia");
}

export async function registrarFormacao(input: {
  meetingId: string;
  tema: string;
  cargaHorariaMinutos: number;
}) {
  const perfil = await exigirCoordenacao();
  if (!input.tema.trim()) throw new Error("Informe o tema da formação.");
  if (input.cargaHorariaMinutos <= 0) throw new Error("A carga horária precisa ser maior que zero.");

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("formacoes")
    .insert({
      meeting_id: input.meetingId,
      tema: input.tema.trim(),
      carga_horaria_minutos: input.cargaHorariaMinutos,
      created_by: perfil.id,
    })
    .select()
    .single();
  if (error || !data) throw new Error(error?.message ?? "Erro ao registrar a formação.");

  revalidar();
  return data;
}

export async function atualizarFormacao(
  id: string,
  dados: { tema?: string; cargaHorariaMinutos?: number },
) {
  await exigirCoordenacao();
  if (dados.tema !== undefined && !dados.tema.trim()) {
    throw new Error("Informe o tema da formação.");
  }
  if (dados.cargaHorariaMinutos !== undefined && dados.cargaHorariaMinutos <= 0) {
    throw new Error("A carga horária precisa ser maior que zero.");
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("formacoes")
    .update({
      ...(dados.tema !== undefined && { tema: dados.tema.trim() }),
      ...(dados.cargaHorariaMinutos !== undefined && {
        carga_horaria_minutos: dados.cargaHorariaMinutos,
      }),
    })
    .eq("id", id);
  if (error) throw new Error(error.message);

  revalidar();
}

export async function removerFormacao(id: string) {
  await exigirCoordenacao();
  const supabase = await createClient();
  const { error } = await supabase.from("formacoes").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidar();
}
