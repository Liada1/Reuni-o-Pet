import { createClient } from "@/lib/supabase/server";
import type {
  PollComMeta,
  EnqueteDetalhe,
  ComentarioComPerfil,
  MembroElegivel,
  Poll,
  PollVoto,
} from "./types";

export async function getEnquetes(): Promise<PollComMeta[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("polls")
    .select("*, meeting_types(nome, cor)")
    .order("created_at", { ascending: false });
  return (data as unknown as PollComMeta[]) ?? [];
}

export async function contarEnquetesAbertas(): Promise<number> {
  const supabase = await createClient();
  const { count } = await supabase
    .from("polls")
    .select("id", { count: "exact", head: true })
    .eq("status", "aberta");
  return count ?? 0;
}

export async function getEnquetesVencidasSemConfirmacao(): Promise<PollComMeta[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("polls")
    .select("*, meeting_types(nome, cor)")
    .eq("status", "aberta")
    .not("prazo_votacao", "is", null)
    .lt("prazo_votacao", new Date().toISOString());
  return (data as unknown as PollComMeta[]) ?? [];
}

// polls -> poll_options tem dois caminhos possíveis (poll_options.poll_id e
// polls.confirmed_option_id); o nome da FK precisa ser explícito para o
// PostgREST não recusar o embed por ambiguidade.
const SELECT_ENQUETE_DETALHE =
  "*, meeting_types(nome, cor), poll_options!poll_options_poll_id_fkey(*, locations(nome), poll_votes(*, profiles(nome_exibicao, foto_url)))";

export async function getEnquetePorCodigo(code: string): Promise<EnqueteDetalhe | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("polls")
    .select(SELECT_ENQUETE_DETALHE)
    .eq("code", code)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data as unknown as EnqueteDetalhe | null;
}

export async function getEnquetePorId(id: string): Promise<EnqueteDetalhe | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("polls")
    .select(SELECT_ENQUETE_DETALHE)
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data as unknown as EnqueteDetalhe | null;
}

export async function getComentarios(pollId: string): Promise<ComentarioComPerfil[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("poll_comments")
    .select("*, profiles(nome_exibicao, foto_url)")
    .eq("poll_id", pollId)
    .order("created_at");
  return (data as unknown as ComentarioComPerfil[]) ?? [];
}

/** Membros elegíveis a votar nesta enquete, conforme o público-alvo definido. */
export async function getMembrosElegiveis(poll: Poll): Promise<MembroElegivel[]> {
  const supabase = await createClient();

  if (poll.publico_alvo === "pessoas") {
    const { data } = await supabase
      .from("poll_voters")
      .select("profiles(id, nome_exibicao, foto_url)")
      .eq("poll_id", poll.id);
    return (
      (data as unknown as { profiles: MembroElegivel }[])?.map((d) => d.profiles) ?? []
    );
  }

  let query = supabase
    .from("profiles")
    .select("id, nome_exibicao, foto_url")
    .eq("status", "ativo");

  if (poll.publico_alvo === "gat" && poll.gat_id) {
    query = query.eq("gat_id", poll.gat_id);
  }

  const { data } = await query;
  return (data as MembroElegivel[]) ?? [];
}

/** Só a contagem de votantes distintos de uma enquete, sem o payload
 * pesado (opções com locais/perfis) que getEnquetePorId carrega. */
async function contarVotantesUnicos(pollId: string): Promise<number> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("poll_options")
    .select("poll_votes(profile_id)")
    .eq("poll_id", pollId);
  const linhas = (data ?? []) as unknown as { poll_votes: { profile_id: string }[] }[];
  const ids = new Set(linhas.flatMap((o) => o.poll_votes.map((v) => v.profile_id)));
  return ids.size;
}

export interface EnqueteComProgresso {
  poll: PollComMeta;
  votaram: number;
  esperados: number;
}

export async function getEnquetesAbertasComProgresso(): Promise<EnqueteComProgresso[]> {
  const abertas = (await getEnquetes()).filter((p) => p.status === "aberta");
  return Promise.all(
    abertas.map(async (poll) => {
      const [elegiveis, votaram] = await Promise.all([
        getMembrosElegiveis(poll),
        contarVotantesUnicos(poll.id),
      ]);
      return { poll, votaram, esperados: elegiveis.length };
    }),
  );
}

async function getIdsOpcoes(pollId: string): Promise<string[]> {
  const supabase = await createClient();
  const { data } = await supabase.from("poll_options").select("id").eq("poll_id", pollId);
  return (data ?? []).map((o) => o.id);
}

export async function jaVotou(pollId: string, profileId: string): Promise<boolean> {
  const idsOpcoes = await getIdsOpcoes(pollId);
  if (idsOpcoes.length === 0) return false;

  const supabase = await createClient();
  const { data } = await supabase
    .from("poll_votes")
    .select("id")
    .eq("profile_id", profileId)
    .in("option_id", idsOpcoes)
    .limit(1);
  return (data?.length ?? 0) > 0;
}

export interface MeuVoto {
  optionId: string;
  valor: PollVoto;
}

export async function getMeusVotos(pollId: string, profileId: string): Promise<MeuVoto[]> {
  const idsOpcoes = await getIdsOpcoes(pollId);
  if (idsOpcoes.length === 0) return [];

  const supabase = await createClient();
  const { data } = await supabase
    .from("poll_votes")
    .select("valor, option_id")
    .eq("profile_id", profileId)
    .in("option_id", idsOpcoes);
  return (data ?? []).map((v) => ({ optionId: v.option_id, valor: v.valor }));
}
