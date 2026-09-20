"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/features/auth";
import { getProgramaSettings } from "@/features/configuracoes";
import { isCoordenacao } from "@/lib/permissions";
import { paraUtc } from "@/lib/dates";
import type { Modalidade } from "@/lib/supabase/types";

async function exigirCoordenacao() {
  const perfil = await getCurrentProfile();
  if (!isCoordenacao(perfil)) {
    throw new Error("Apenas a coordenação pode gerenciar a agenda.");
  }
  return perfil!;
}

export interface CriarReuniaoInput {
  titulo?: string;
  meetingTypeId: string;
  dataISO: string;
  horaMinuto: string;
  duracaoMinutos: number;
  modalidade: Modalidade;
  locationId?: string | null;
  linkOnline?: string | null;
}

export async function criarReuniaoDireta(input: CriarReuniaoInput) {
  const perfil = await exigirCoordenacao();
  const supabase = await createClient();
  const programa = await getProgramaSettings();

  const inicio = paraUtc(input.dataISO, input.horaMinuto, programa.fuso_horario);
  const fim = new Date(inicio.getTime() + input.duracaoMinutos * 60_000);

  const { data, error } = await supabase
    .from("meetings")
    .insert({
      meeting_type_id: input.meetingTypeId,
      titulo: input.titulo || null,
      inicio: inicio.toISOString(),
      fim_previsto: fim.toISOString(),
      modalidade: input.modalidade,
      location_id: input.modalidade === "presencial" ? input.locationId || null : null,
      link_online: input.modalidade === "online" ? input.linkOnline || null : null,
      status: "agendada",
      created_by: perfil.id,
    })
    .select("id")
    .single();

  if (error || !data) throw new Error(error?.message ?? "Erro ao criar reunião.");

  revalidatePath("/agenda");
  return { id: data.id as string };
}

export async function remarcarReuniao(
  id: string,
  novo: { dataISO: string; horaMinuto: string; motivo: string },
) {
  await exigirCoordenacao();
  const supabase = await createClient();
  const programa = await getProgramaSettings();

  const { data: reuniao } = await supabase
    .from("meetings")
    .select("fim_previsto, inicio")
    .eq("id", id)
    .single();
  if (!reuniao) throw new Error("Reunião não encontrada.");

  const duracaoMs = new Date(reuniao.fim_previsto).getTime() - new Date(reuniao.inicio).getTime();
  const novoInicio = paraUtc(novo.dataISO, novo.horaMinuto, programa.fuso_horario);
  const novoFim = new Date(novoInicio.getTime() + duracaoMs);

  const { error } = await supabase
    .from("meetings")
    .update({
      inicio: novoInicio.toISOString(),
      fim_previsto: novoFim.toISOString(),
      motivo_remarcacao_cancelamento: novo.motivo || null,
    })
    .eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath("/agenda");
  revalidatePath(`/reunioes/${id}`);
}

export async function cancelarReuniao(id: string, motivo: string) {
  await exigirCoordenacao();
  const supabase = await createClient();
  const { error } = await supabase
    .from("meetings")
    .update({ status: "cancelada", motivo_remarcacao_cancelamento: motivo || null })
    .eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath("/agenda");
  revalidatePath(`/reunioes/${id}`);
}
