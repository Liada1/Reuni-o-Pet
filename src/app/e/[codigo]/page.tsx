import { notFound } from "next/navigation";
import { getCurrentProfile } from "@/features/auth";
import { getProgramaSettings } from "@/features/configuracoes";
import { getEnquetePorCodigo, getMeusVotos } from "@/features/enquetes/queries";
import { VotarForm } from "@/features/enquetes/components/votar-form";
import { Carimbo } from "@/components/ui/carimbo";
import type { PollVoto } from "@/features/enquetes/types";

export default async function VotarPage({
  params,
}: {
  params: Promise<{ codigo: string }>;
}) {
  const { codigo } = await params;
  const [perfil, poll, programa] = await Promise.all([
    getCurrentProfile(),
    getEnquetePorCodigo(codigo),
    getProgramaSettings(),
  ]);

  if (!poll) notFound();
  if (!perfil) notFound();

  const meusVotosLista = await getMeusVotos(poll.id, perfil.id);
  const meusVotosIniciais = Object.fromEntries(
    meusVotosLista.map((v) => [v.optionId, v.valor]),
  ) as Record<string, PollVoto>;

  return (
    <div className="mx-auto max-w-xl space-y-4 px-4 py-8">
      <div>
        <div className="flex items-center gap-2">
          <h1 className="font-display text-2xl font-semibold text-ink">{poll.titulo}</h1>
          {poll.status !== "aberta" && (
            <Carimbo texto={poll.status === "confirmada" ? "Confirmada" : "Fechada"} />
          )}
        </div>
        {poll.descricao && <p className="mt-1 text-sm text-ink-muted">{poll.descricao}</p>}
        <p className="mt-1 text-xs text-ink-muted">{poll.meeting_types?.nome}</p>
      </div>

      {poll.status === "aberta" ? (
        <VotarForm
          poll={poll}
          fusoHorario={programa.fuso_horario}
          meusVotosIniciais={meusVotosIniciais}
          meuId={perfil.id}
        />
      ) : (
        <p className="text-sm text-ink-muted">
          Esta enquete já foi encerrada e não aceita mais votos.
        </p>
      )}
    </div>
  );
}
