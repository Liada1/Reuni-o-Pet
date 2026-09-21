import { notFound, redirect } from "next/navigation";
import { getReuniao } from "@/features/agenda";
import { getPauta, getAtaCompleta, podeEditarAta } from "@/features/atas";
import { getMembros } from "@/features/membros";
import { getProgramaSettings } from "@/features/configuracoes";
import { ModoReuniao } from "@/features/atas/components/modo-reuniao";

export default async function AoVivoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  if (!(await podeEditarAta(id))) redirect(`/reunioes/${id}`);

  const [reuniao, pauta, ataExistente, membros, programa] = await Promise.all([
    getReuniao(id),
    getPauta(id),
    getAtaCompleta(id),
    getMembros(),
    getProgramaSettings(),
  ]);
  if (!reuniao) notFound();

  return (
    <ModoReuniao
      meetingId={id}
      meetingTitulo={reuniao.titulo || reuniao.meeting_types?.nome || "Reunião"}
      membros={membros
        .filter((m) => m.status === "ativo")
        .map((m) => ({ id: m.id, nome_exibicao: m.nome_exibicao, foto_url: m.foto_url }))}
      pautaAceita={pauta.filter((p) => p.aceito).map((p) => ({ id: p.id, titulo: p.titulo, ordem: p.ordem }))}
      ataExistente={ataExistente}
      fusoHorario={programa.fuso_horario}
    />
  );
}
