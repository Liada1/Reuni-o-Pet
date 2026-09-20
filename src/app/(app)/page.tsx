import Link from "next/link";
import { UserCheck, ListChecks, CalendarDays } from "lucide-react";
import { getCurrentProfile } from "@/features/auth";
import { contarPendentes } from "@/features/membros";
import { getEnquetes, getEnquetesAbertasComProgresso, jaVotou } from "@/features/enquetes";
import { getProximaReuniao } from "@/features/agenda";
import { getProgramaSettings } from "@/features/configuracoes";
import { isCoordenacao } from "@/lib/permissions";
import { Surface } from "@/components/ui/surface";
import { formatarDiaSemana, formatarData, formatarHora } from "@/lib/dates";

export default async function PainelPage() {
  const perfil = await getCurrentProfile();
  const coordenacao = isCoordenacao(perfil);
  const programa = await getProgramaSettings();
  const proximaReuniao = await getProximaReuniao();

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-8">
      <div>
        <h1 className="font-display text-2xl font-semibold text-ink">
          Olá, {perfil!.nome_exibicao.split(" ")[0]}
        </h1>
        <p className="text-sm text-ink-muted">
          {coordenacao ? "Painel da coordenação." : "Seu painel."}
        </p>
      </div>

      {proximaReuniao && (
        <Link href={`/reunioes/${proximaReuniao.id}`}>
          <Surface className="flex items-center gap-3 p-4 transition-colors hover:bg-paper">
            <CalendarDays className="h-5 w-5 text-primary" strokeWidth={1.75} />
            <div>
              <p className="text-sm font-medium text-ink">
                Próxima reunião: {proximaReuniao.titulo || proximaReuniao.meeting_types?.nome}
              </p>
              <p className="text-xs text-ink-muted">
                {formatarDiaSemana(proximaReuniao.inicio, programa.fuso_horario)}{" "}
                {formatarData(proximaReuniao.inicio, programa.fuso_horario)} ·{" "}
                {formatarHora(proximaReuniao.inicio, programa.fuso_horario)}
                {proximaReuniao.modalidade === "presencial" &&
                  proximaReuniao.locations?.nome &&
                  ` · ${proximaReuniao.locations.nome}`}
              </p>
            </div>
          </Surface>
        </Link>
      )}

      {coordenacao ? <PainelCoordenacao /> : <PainelParticipante perfilId={perfil!.id} />}
    </div>
  );
}

async function PainelCoordenacao() {
  const [pendentes, enquetes] = await Promise.all([
    contarPendentes(),
    getEnquetesAbertasComProgresso(),
  ]);

  return (
    <div className="space-y-3">
      {pendentes > 0 && (
        <Link href="/membros">
          <Surface className="flex items-center gap-3 p-4 transition-colors hover:bg-paper">
            <UserCheck className="h-5 w-5 text-accent" strokeWidth={1.75} />
            <div>
              <p className="text-sm font-medium text-ink">
                {pendentes} {pendentes === 1 ? "pedido" : "pedidos"} de entrada aguardando
                aprovação
              </p>
              <p className="text-xs text-ink-muted">Toque para revisar em Membros.</p>
            </div>
          </Surface>
        </Link>
      )}

      {enquetes.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-semibold uppercase tracking-wide text-ink-muted">
            Enquetes abertas
          </p>
          {enquetes.map(({ poll, votaram, esperados }) => (
            <Link key={poll.id} href={`/enquetes/${poll.id}`}>
              <Surface className="flex items-center justify-between gap-3 p-4 transition-colors hover:bg-paper">
                <div className="flex items-center gap-2">
                  <ListChecks className="h-4 w-4 text-ink-muted" strokeWidth={1.75} />
                  <p className="text-sm font-medium text-ink">{poll.titulo}</p>
                </div>
                <span className="font-mono text-xs text-ink-muted">
                  {votaram}/{esperados} votaram
                </span>
              </Surface>
            </Link>
          ))}
        </div>
      )}

      {pendentes === 0 && enquetes.length === 0 && (
        <p className="text-sm text-ink-muted">Nenhuma pendência no momento.</p>
      )}
    </div>
  );
}

async function PainelParticipante({ perfilId }: { perfilId: string }) {
  const abertas = (await getEnquetes()).filter((p) => p.status === "aberta");
  const pendentesDeVoto = (
    await Promise.all(
      abertas.map(async (poll) => ({ poll, votou: await jaVotou(poll.id, perfilId) })),
    )
  ).filter((e) => !e.votou);

  if (pendentesDeVoto.length === 0) {
    return <p className="text-sm text-ink-muted">Nenhuma enquete aguardando seu voto.</p>;
  }

  return (
    <div className="space-y-2">
      <p className="text-sm font-semibold uppercase tracking-wide text-ink-muted">
        Enquetes aguardando seu voto
      </p>
      {pendentesDeVoto.map(({ poll }) => (
        <Link key={poll.id} href={`/e/${poll.code}`}>
          <Surface className="flex items-center gap-2 border-accent/40 p-4 transition-colors hover:bg-paper">
            <ListChecks className="h-4 w-4 text-accent" strokeWidth={1.75} />
            <p className="text-sm font-medium text-ink">{poll.titulo}</p>
          </Surface>
        </Link>
      ))}
    </div>
  );
}
