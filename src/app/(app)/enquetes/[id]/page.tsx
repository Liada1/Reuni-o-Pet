import { notFound, redirect } from "next/navigation";
import { getCurrentProfile } from "@/features/auth";
import { getProgramaSettings } from "@/features/configuracoes";
import { getEnquetePorId, getMembrosElegiveis, AcompanharEnquete } from "@/features/enquetes";
import { Carimbo } from "@/components/ui/carimbo";
import { isCoordenacao } from "@/lib/permissions";
import { getOrigin } from "@/lib/origin";

export default async function EnquetePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const perfil = await getCurrentProfile();
  const poll = await getEnquetePorId(id);
  if (!poll) notFound();

  if (!isCoordenacao(perfil)) redirect(`/e/${poll.code}`);

  const [elegiveis, programa, origin] = await Promise.all([
    getMembrosElegiveis(poll),
    getProgramaSettings(),
    getOrigin(),
  ]);

  return (
    <div className="mx-auto max-w-2xl space-y-4 px-4 py-8">
      <div>
        <div className="flex items-center gap-2">
          <h1 className="font-display text-2xl font-semibold text-ink">{poll.titulo}</h1>
          <Carimbo
            texto={
              poll.status === "aberta"
                ? "Aberta"
                : poll.status === "confirmada"
                  ? "Confirmada"
                  : "Fechada"
            }
          />
        </div>
        {poll.descricao && <p className="mt-1 text-sm text-ink-muted">{poll.descricao}</p>}
        <p className="mt-1 text-xs text-ink-muted">{poll.meeting_types?.nome}</p>
      </div>

      <AcompanharEnquete
        poll={poll}
        elegiveis={elegiveis}
        fusoHorario={programa.fuso_horario}
        origin={origin}
      />
    </div>
  );
}
