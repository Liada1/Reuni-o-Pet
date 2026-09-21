import { createClient } from "@/lib/supabase/server";
import type { ProgramaSettings, PerfisNomesSettings, AtaPdfSettings } from "./types";

const PROGRAMA_PADRAO: ProgramaSettings = {
  nome_programa: "PET",
  nome_grupo: "",
  fuso_horario: "America/Fortaleza",
  logo_pet_url: null,
  logo_instituicao_url: null,
};

const PERFIS_NOMES_PADRAO: PerfisNomesSettings = {
  coordenacao: "Coordenação",
  participante: "Participante",
  relator: "Relator(a)",
};

export async function getProgramaSettings(): Promise<ProgramaSettings> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("settings")
    .select("value")
    .eq("key", "programa")
    .maybeSingle();
  return { ...PROGRAMA_PADRAO, ...(data?.value as Partial<ProgramaSettings>) };
}

export async function getPerfisNomes(): Promise<PerfisNomesSettings> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("settings")
    .select("value")
    .eq("key", "perfis_nomes")
    .maybeSingle();
  return { ...PERFIS_NOMES_PADRAO, ...(data?.value as Partial<PerfisNomesSettings>) };
}

const ATA_PDF_PADRAO: AtaPdfSettings = { coluna_assinatura: false };

export async function getAtaPdfSettings(): Promise<AtaPdfSettings> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("settings")
    .select("value")
    .eq("key", "ata_pdf")
    .maybeSingle();
  return { ...ATA_PDF_PADRAO, ...(data?.value as Partial<AtaPdfSettings>) };
}

export async function getGats() {
  const supabase = await createClient();
  const { data } = await supabase.from("gats").select("*").order("nome");
  return data ?? [];
}

export async function getMeetingTypes() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("meeting_types")
    .select("*")
    .order("nome");
  return data ?? [];
}

export async function getLocations() {
  const supabase = await createClient();
  const { data } = await supabase.from("locations").select("*").order("nome");
  return data ?? [];
}
