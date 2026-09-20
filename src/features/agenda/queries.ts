import { createClient } from "@/lib/supabase/server";
import type { ReuniaoComDetalhes } from "./types";

export async function getReunioes(intervalo?: {
  inicio: Date;
  fim: Date;
}): Promise<ReuniaoComDetalhes[]> {
  const supabase = await createClient();
  let query = supabase
    .from("meetings")
    .select("*, meeting_types(nome, cor), locations(nome, endereco)")
    .order("inicio");

  if (intervalo) {
    query = query
      .gte("inicio", intervalo.inicio.toISOString())
      .lt("inicio", intervalo.fim.toISOString());
  }

  const { data } = await query;
  return (data as unknown as ReuniaoComDetalhes[]) ?? [];
}

export async function getProximaReuniao(): Promise<ReuniaoComDetalhes | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("meetings")
    .select("*, meeting_types(nome, cor), locations(nome, endereco)")
    .in("status", ["agendada", "em_andamento"])
    .gte("inicio", new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString())
    .order("inicio")
    .limit(1)
    .maybeSingle();
  return data as unknown as ReuniaoComDetalhes | null;
}

export async function getReuniao(id: string): Promise<ReuniaoComDetalhes | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("meetings")
    .select("*, meeting_types(nome, cor), locations(nome, endereco)")
    .eq("id", id)
    .maybeSingle();
  return data as unknown as ReuniaoComDetalhes | null;
}
