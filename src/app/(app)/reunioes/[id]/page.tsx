import Link from "next/link";
import { notFound } from "next/navigation";
import { MapPin, Video, PlayCircle, FileText } from "lucide-react";
import { getCurrentProfile } from "@/features/auth";
import { getProgramaSettings } from "@/features/configuracoes";
import { getReuniao } from "@/features/agenda";
import { getMembros } from "@/features/membros";
import { ReuniaoAcoes } from "@/features/agenda/components/reuniao-acoes";
import {
  getPauta,
  getMinutePorMeeting,
  getEncaminhamentosAbertosPorTipo,
  podeEditarAta,
} from "@/features/atas";
import { Pauta } from "@/features/atas/components/pauta";
import { RelatorPicker } from "@/features/atas/components/relator-picker";
import { Carimbo } from "@/components/ui/carimbo";
import { Button } from "@/components/ui/button";
import { Surface } from "@/components/ui/surface";
import { formatarDiaSemana, formatarData, formatarHora } from "@/lib/dates";
import { icsParaDataUri, linkGoogleAgenda } from "@/lib/ics";
import { isCoordenacao } from "@/lib/permissions";

const STATUS_TEXTO: Record<string, string> = {
  agendada: "Agendada",
  em_andamento: "Em andamento",
  realizada: "Realizada",
  cancelada: "Cancelada",
  remarcada: "Remarcada",
};

const STATUS_ATA_TEXTO: Record<string, string> = {
  rascunho: "Rascunho",
  em_revisao: "Em revisão",
  aprovada: "Aprovada",
};

export default async function ReuniaoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [perfil, reuniao, programa, edita] = await Promise.all([
    getCurrentProfile(),
    getReuniao(id),
    getProgramaSettings(),
    podeEditarAta(id),
  ]);
  if (!reuniao) notFound();

  const [pauta, minute, encaminhamentosParaRetomar, membros] = await Promise.all([
    getPauta(id),
    getMinutePorMeeting(id),
    getEncaminhamentosAbertosPorTipo(reuniao.meeting_type_id),
    getMembros(),
  ]);

  const fuso = programa.fuso_horario;
  const local = reuniao.modalidade === "presencial" ? reuniao.locations?.nome ?? "Local a definir" : "Online";
  const evento = {
    uid: `${reuniao.id}@pet-reunioes`,
    titulo: reuniao.titulo || reuniao.meeting_types?.nome || "Reunião",
    inicioUtc: reuniao.inicio,
    fimUtc: reuniao.fim_previsto,
    local,
  };
  const membrosAtivos = membros
    .filter((m) => m.status === "ativo")
    .map((m) => ({ id: m.id, nome_exibicao: m.nome_exibicao }));

  const mostrarAta = minute && (minute.status !== "rascunho" || edita);

  return (
    <div className="mx-auto max-w-xl space-y-6 px-4 py-8">
      <div>
        <div className="flex items-center gap-2">
          <span
            className="h-2.5 w-2.5 rounded-full"
            style={{ backgroundColor: reuniao.meeting_types?.cor }}
          />
          <h1 className="font-display text-2xl font-semibold text-ink">
            {reuniao.titulo || reuniao.meeting_types?.nome}
          </h1>
          <Carimbo texto={STATUS_TEXTO[reuniao.status]} />
        </div>
        <p className="mt-1 font-mono text-sm text-ink">
          {formatarDiaSemana(reuniao.inicio, fuso)} {formatarData(reuniao.inicio, fuso)} ·{" "}
          {formatarHora(reuniao.inicio, fuso)}
        </p>
        <p className="mt-1 flex items-center gap-1.5 text-sm text-ink-muted">
          {reuniao.modalidade === "presencial" ? (
            <MapPin className="h-4 w-4" strokeWidth={1.75} />
          ) : (
            <Video className="h-4 w-4" strokeWidth={1.75} />
          )}
          {local}
          {reuniao.link_online && ` · ${reuniao.link_online}`}
        </p>
        {reuniao.motivo_remarcacao_cancelamento && (
          <p className="mt-2 text-sm text-ink-muted">
            Motivo: {reuniao.motivo_remarcacao_cancelamento}
          </p>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        <a href={icsParaDataUri(evento)} download={`reuniao-${reuniao.id}.ics`}>
          <Button type="button" variant="secundario">
            Baixar .ics
          </Button>
        </a>
        <a href={linkGoogleAgenda(evento)} target="_blank" rel="noopener noreferrer">
          <Button type="button" variant="secundario">
            Google Agenda
          </Button>
        </a>
      </div>

      {isCoordenacao(perfil) && <ReuniaoAcoes reuniao={reuniao} fusoHorario={fuso} />}

      {reuniao.status !== "cancelada" && (
        <Surface className="space-y-3 p-4">
          {isCoordenacao(perfil) && (
            <RelatorPicker meetingId={id} relatorId={reuniao.relator_id} membros={membrosAtivos} />
          )}
          <div className="flex flex-wrap gap-2">
            {edita && !minute && (
              <Link href={`/reunioes/${id}/ao-vivo`}>
                <Button type="button">
                  <PlayCircle className="h-4 w-4" strokeWidth={1.75} />
                  Iniciar reunião
                </Button>
              </Link>
            )}
            {edita && minute && !reuniao.fim_real && (
              <Link href={`/reunioes/${id}/ao-vivo`}>
                <Button type="button">
                  <PlayCircle className="h-4 w-4" strokeWidth={1.75} />
                  Continuar reunião
                </Button>
              </Link>
            )}
            {mostrarAta && (
              <Link href={`/reunioes/${id}/ata`}>
                <Button type="button" variant="secundario">
                  <FileText className="h-4 w-4" strokeWidth={1.75} />
                  Ver ata
                  <Carimbo texto={STATUS_ATA_TEXTO[minute!.status]} className="ml-1" />
                </Button>
              </Link>
            )}
          </div>
        </Surface>
      )}

      <section className="space-y-2">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-muted">Pauta</h2>
        <Pauta
          meetingId={id}
          itens={pauta}
          podeEditar={edita}
          meuId={perfil!.id}
          encaminhamentosParaRetomar={encaminhamentosParaRetomar}
        />
      </section>
    </div>
  );
}
