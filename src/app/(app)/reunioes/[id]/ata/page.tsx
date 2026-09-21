import { notFound, redirect } from "next/navigation";
import { getCurrentProfile } from "@/features/auth";
import { getProgramaSettings, getAtaPdfSettings } from "@/features/configuracoes";
import { getMembros } from "@/features/membros";
import { getReunioes } from "@/features/agenda";
import { getAtaCompleta, getPdfsDaAta, podeEditarAta } from "@/features/atas";
import { RevisaoAta } from "@/features/atas/components/revisao-ata";
import { isCoordenacao } from "@/lib/permissions";
import { agora, agoraMaisMs } from "@/lib/dates";

export default async function AtaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [perfil, ata, programa, ataPdf, edita] = await Promise.all([
    getCurrentProfile(),
    getAtaCompleta(id),
    getProgramaSettings(),
    getAtaPdfSettings(),
    podeEditarAta(id),
  ]);
  if (!ata) notFound();
  if (ata.minute.status === "rascunho" && !edita) redirect(`/reunioes/${id}`);

  const [membros, reunioesFuturas, pdfs] = await Promise.all([
    getMembros(),
    getReunioes({ inicio: agora(), fim: agoraMaisMs(365 * 86_400_000) }),
    getPdfsDaAta(ata.minute.id),
  ]);

  return (
    <RevisaoAta
      ata={ata}
      programaPdf={{
        nomePrograma: programa.nome_programa,
        nomeGrupo: programa.nome_grupo,
        logoPetUrl: programa.logo_pet_url,
        logoInstituicaoUrl: programa.logo_instituicao_url,
        colunaAssinatura: ataPdf.coluna_assinatura,
      }}
      fusoHorario={programa.fuso_horario}
      membros={membros
        .filter((m) => m.status === "ativo")
        .map((m) => ({ id: m.id, nome_exibicao: m.nome_exibicao }))}
      reunioesFuturas={reunioesFuturas.filter((r) => r.id !== id)}
      pdfs={pdfs}
      meuId={perfil!.id}
      podeEditar={edita}
      isCoordenacao={isCoordenacao(perfil)}
    />
  );
}
