import Link from "next/link";
import { UserCheck, ListChecks, CalendarDays, FileText, ClipboardList } from "lucide-react";
import { getCurrentProfile } from "@/features/auth";
import { contarPendentes } from "@/features/membros";
import { getEnquetes, getEnquetesAbertasComProgresso, jaVotou } from "@/features/enquetes";
import { getProximaReuniao } from "@/features/agenda";
import { getAtas, getEncaminhamentos } from "@/features/atas";
import { getProgramaSettings } from "@/features/configuracoes";
import { Carimbo } from "@/components/ui/carimbo";
import { isCoordenacao } from "@/lib/permissions";
import { Surface } from "@/components/ui/surface";
import { formatarDiaSemana, formatarData, formatarDataSimples, formatarHora } from "@/lib/dates";
import type { MinuteStatus } from "@/lib/supabase/types";

const STATUS_ATA_TEXTO: Record<MinuteStatus, string> = {
  rascunho: "Rascunho",
  em_revisao: "Em revisão",
  aprovada: "Aprovada",
};

export default async function PainelPage() {
  const [perfil, programa, proximaReuniao] = await Promise.all([
    getCurrentProfile(),
    getProgramaSettings(),
    getProximaReuniao(),
  ]);
  const coordenacao = isCoordenacao(perfil);

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

      {coordenacao ? (
        <PainelCoordenacao perfilId={perfil!.id} />
      ) : (
        <PainelParticipante perfilId={perfil!.id} />
      )}
    </div>
  );
}

/** Encaminhamentos abertos da pessoa + última ata aprovada: aparece nos
 * dois painéis, porque quem coordena também recebe encaminhamento. */
async function getDadosPessoais(perfilId: string) {
  const [encaminhamentos, aprovadas] = await Promise.all([
    getEncaminhamentos({ responsavelId: perfilId }),
    getAtas({ status: "aprovada" }),
  ]);
  return {
    encaminhamentosPendentes: encaminhamentos.filter((e) => e.status !== "concluido"),
    ultimaAta: aprovadas[0],
  };
}

type DadosPessoais = Awaited<ReturnType<typeof getDadosPessoais>>;

function BlocoPessoal({ encaminhamentosPendentes, ultimaAta }: DadosPessoais) {
  return (
    <>
      {encaminhamentosPendentes.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-semibold uppercase tracking-wide text-ink-muted">
            Seus encaminhamentos
          </p>
          {encaminhamentosPendentes.map((e) => (
            <Surface key={e.id} className="flex items-center gap-2 p-4">
              <ClipboardList className="h-4 w-4 text-ink-muted" strokeWidth={1.75} />
              <div>
                <p className="text-sm text-ink">{e.descricao}</p>
                {e.prazo && (
                  <p className="text-xs text-ink-muted">Prazo: {formatarDataSimples(e.prazo)}</p>
                )}
              </div>
            </Surface>
          ))}
        </div>
      )}

      {ultimaAta && (
        <div className="space-y-2">
          <p className="text-sm font-semibold uppercase tracking-wide text-ink-muted">
            Última ata aprovada
          </p>
          <Link href={`/reunioes/${ultimaAta.meeting_id}/ata`}>
            <Surface className="flex items-center gap-2 p-4 transition-colors hover:bg-paper">
              <FileText className="h-4 w-4 text-ink-muted" strokeWidth={1.75} />
              <p className="text-sm text-ink">
                {ultimaAta.meetings?.titulo || ultimaAta.meetings?.meeting_types?.nome}
              </p>
            </Surface>
          </Link>
        </div>
      )}
    </>
  );
}

async function PainelCoordenacao({ perfilId }: { perfilId: string }) {
  const [pendentes, enquetes, atasRascunho, atasEmRevisao, pessoais] = await Promise.all([
    contarPendentes(),
    getEnquetesAbertasComProgresso(),
    getAtas({ status: "rascunho" }),
    getAtas({ status: "em_revisao" }),
    getDadosPessoais(perfilId),
  ]);
  const atasPendentes = [...atasRascunho, ...atasEmRevisao];
  const semNada =
    pendentes === 0 &&
    enquetes.length === 0 &&
    atasPendentes.length === 0 &&
    pessoais.encaminhamentosPendentes.length === 0 &&
    !pessoais.ultimaAta;

  return (
    <div className="space-y-5">
      {atasPendentes.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-semibold uppercase tracking-wide text-ink-muted">
            Atas aguardando ação
          </p>
          {atasPendentes.map((ata) => (
            <Link key={ata.id} href={`/reunioes/${ata.meeting_id}/ata`}>
              <Surface className="flex items-center justify-between gap-3 p-4 transition-colors hover:bg-paper">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-ink-muted" strokeWidth={1.75} />
                  <p className="text-sm font-medium text-ink">
                    {ata.meetings?.titulo || ata.meetings?.meeting_types?.nome}
                  </p>
                </div>
                <Carimbo texto={STATUS_ATA_TEXTO[ata.status]} />
              </Surface>
            </Link>
          ))}
        </div>
      )}

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

      <BlocoPessoal {...pessoais} />

      {semNada && <p className="text-sm text-ink-muted">Nenhuma pendência no momento.</p>}
    </div>
  );
}

async function PainelParticipante({ perfilId }: { perfilId: string }) {
  const [abertas, pessoais] = await Promise.all([getEnquetes(), getDadosPessoais(perfilId)]);
  const pendentesDeVoto = (
    await Promise.all(
      abertas
        .filter((p) => p.status === "aberta")
        .map(async (poll) => ({ poll, votou: await jaVotou(poll.id, perfilId) })),
    )
  ).filter((e) => !e.votou);

  return (
    <div className="space-y-5">
      {pendentesDeVoto.length > 0 && (
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
      )}

      <BlocoPessoal {...pessoais} />

      {pendentesDeVoto.length === 0 &&
        pessoais.encaminhamentosPendentes.length === 0 &&
        !pessoais.ultimaAta && <p className="text-sm text-ink-muted">Nada por aqui ainda.</p>}
    </div>
  );
}
