import Link from "next/link";
import { ChevronLeft, ChevronRight, Clock } from "lucide-react";
import { getCurrentProfile } from "@/features/auth";
import { getProgramaSettings } from "@/features/configuracoes";
import {
  getRelatorioFrequencia,
  PessoaCard,
  ExportarFrequencia,
} from "@/features/frequencia";
import { Surface } from "@/components/ui/surface";
import { EstadoVazio } from "@/components/ui/estado-vazio";
import { mesValido, mesVizinho, rotuloMes } from "@/lib/periodos";
import { formatarMinutos } from "@/lib/duracao";
import { isCoordenacao } from "@/lib/permissions";

export default async function FrequenciaPage({
  searchParams,
}: {
  searchParams: Promise<{ mes?: string }>;
}) {
  const { mes: mesParam } = await searchParams;
  const [perfil, programa] = await Promise.all([getCurrentProfile(), getProgramaSettings()]);
  const mesISO = mesValido(mesParam, programa.fuso_horario);
  const relatorio = await getRelatorioFrequencia(mesISO, programa.fuso_horario);

  // Quem não coordena vê só a própria frequência; a do grupo é da coordenação.
  const coordenacao = isCoordenacao(perfil);
  const pessoas = coordenacao
    ? relatorio.pessoas
    : relatorio.pessoas.filter((p) => p.perfilId === perfil!.id);

  const minutosDoGrupo = relatorio.pessoas.reduce((soma, p) => soma + p.minutos, 0);

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-8">
      <div>
        <h1 className="font-display text-2xl font-semibold text-ink">Frequência</h1>
        <p className="text-sm text-ink-muted">
          {coordenacao
            ? "Presença e horas de cada integrante, a partir das listas de presença."
            : "Suas presenças e horas, a partir das listas de presença."}
        </p>
      </div>

      <div className="flex items-center justify-between gap-2">
        <Link
          href={`/frequencia?mes=${mesVizinho(mesISO, -1)}`}
          className="flex h-9 w-9 items-center justify-center rounded-[var(--radius-control)] border border-border text-ink-muted hover:bg-paper"
          aria-label="Mês anterior"
        >
          <ChevronLeft className="h-4 w-4" strokeWidth={1.75} />
        </Link>
        <p className="font-display text-lg font-medium text-ink">{rotuloMes(mesISO)}</p>
        <Link
          href={`/frequencia?mes=${mesVizinho(mesISO, 1)}`}
          className="flex h-9 w-9 items-center justify-center rounded-[var(--radius-control)] border border-border text-ink-muted hover:bg-paper"
          aria-label="Próximo mês"
        >
          <ChevronRight className="h-4 w-4" strokeWidth={1.75} />
        </Link>
      </div>

      {relatorio.totalEncontros === 0 ? (
        <EstadoVazio
          icone={Clock}
          titulo="Nenhum encontro realizado neste mês"
          descricao="A frequência é apurada nas listas de presença dos encontros já realizados."
        />
      ) : (
        <>
          <Surface className="grid grid-cols-2 gap-4 p-4 sm:grid-cols-3">
            <div>
              <p className="text-xs uppercase tracking-wide text-ink-muted">
                Encontros realizados
              </p>
              <p className="font-mono text-xl text-ink">{relatorio.totalEncontros}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-ink-muted">Meta semanal</p>
              <p className="font-mono text-xl text-ink">{relatorio.metaHoras}h</p>
            </div>
            {coordenacao && (
              <div>
                <p className="text-xs uppercase tracking-wide text-ink-muted">
                  Horas do grupo
                </p>
                <p className="font-mono text-xl text-ink">{formatarMinutos(minutosDoGrupo)}</p>
              </div>
            )}
          </Surface>

          <div className="space-y-2">
            {pessoas.map((pessoa) => (
              <PessoaCard
                key={pessoa.perfilId}
                pessoa={pessoa}
                totalEncontros={relatorio.totalEncontros}
                metaHoras={relatorio.metaHoras}
                destacada={pessoa.perfilId === perfil!.id}
              />
            ))}
          </div>

          <p className="text-xs text-ink-muted">
            Cada etiqueta é uma semana do mês, com as horas que a pessoa cumpriu nela.
            Falta justificada é contada à parte e não soma horas.
          </p>

          {coordenacao && (
            <ExportarFrequencia
              relatorio={relatorio}
              fusoHorario={programa.fuso_horario}
              programa={{
                nomePrograma: programa.nome_programa,
                nomeGrupo: programa.nome_grupo,
                logoPetUrl: programa.logo_pet_url,
                logoInstituicaoUrl: programa.logo_instituicao_url,
              }}
            />
          )}
        </>
      )}
    </div>
  );
}
