import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { getCurrentProfile } from "@/features/auth";
import { getProgramaSettings } from "@/features/configuracoes";
import {
  getFormacoesDoAno,
  getReunioesSemFormacao,
  FormacaoItem,
  RegistrarFormacao,
} from "@/features/formacao";
import { Surface } from "@/components/ui/surface";
import { anoCorrente, bimestresDoAno } from "@/lib/periodos";
import { formatarMinutos } from "@/lib/duracao";
import { isCoordenacao } from "@/lib/permissions";
import { cn } from "@/lib/utils";

const NOMES_BIMESTRE = [
  "1º bimestre",
  "2º bimestre",
  "3º bimestre",
  "4º bimestre",
  "5º bimestre",
  "6º bimestre",
];

function curto(iso: string) {
  return `${iso.slice(8, 10)}/${iso.slice(5, 7)}`;
}

export default async function FormacaoPage({
  searchParams,
}: {
  searchParams: Promise<{ ano?: string }>;
}) {
  const { ano: anoParam } = await searchParams;
  const [perfil, programa] = await Promise.all([getCurrentProfile(), getProgramaSettings()]);

  const ano = /^\d{4}$/.test(anoParam ?? "")
    ? Number(anoParam)
    : anoCorrente(programa.fuso_horario);
  const coordenacao = isCoordenacao(perfil);

  const bimestres = bimestresDoAno(ano, programa.fuso_horario);
  const [comFormacao, disponiveis] = await Promise.all([
    getFormacoesDoAno(ano, programa.fuso_horario),
    coordenacao
      ? getReunioesSemFormacao(bimestres[0].inicioUtc, bimestres[5].fimUtc)
      : Promise.resolve([]),
  ]);

  const totalMinutos = comFormacao
    .flatMap((b) => b.encontros)
    .reduce((soma, e) => soma + (e.formacao?.carga_horaria_minutos ?? 0), 0);
  const bimestresVazios = comFormacao.filter((b) => b.encontros.length === 0).length;

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-8">
      <div>
        <h1 className="font-display text-2xl font-semibold text-ink">Formação</h1>
        <p className="text-sm text-ink-muted">
          As formações bimestrais do grupo, com tema e carga horária certificada.
        </p>
      </div>

      <div className="flex items-center justify-between gap-2">
        <Link
          href={`/formacao?ano=${ano - 1}`}
          className="flex h-9 w-9 items-center justify-center rounded-[var(--radius-control)] border border-border text-ink-muted hover:bg-paper"
          aria-label="Ano anterior"
        >
          <ChevronLeft className="h-4 w-4" strokeWidth={1.75} />
        </Link>
        <p className="font-display text-lg font-medium text-ink">{ano}</p>
        <Link
          href={`/formacao?ano=${ano + 1}`}
          className="flex h-9 w-9 items-center justify-center rounded-[var(--radius-control)] border border-border text-ink-muted hover:bg-paper"
          aria-label="Próximo ano"
        >
          <ChevronRight className="h-4 w-4" strokeWidth={1.75} />
        </Link>
      </div>

      <Surface className="grid grid-cols-2 gap-4 p-4">
        <div>
          <p className="text-xs uppercase tracking-wide text-ink-muted">
            Carga horária no ano
          </p>
          <p className="font-mono text-xl text-ink">{formatarMinutos(totalMinutos)}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-ink-muted">Bimestres sem formação</p>
          <p
            className={cn(
              "font-mono text-xl",
              bimestresVazios === 0 ? "text-primary" : "text-alert",
            )}
          >
            {bimestresVazios} de 6
          </p>
        </div>
      </Surface>

      <div className="space-y-3">
        {comFormacao.map((bimestre, i) => {
          const periodo = bimestres[i];
          const doBimestre = disponiveis.filter((r) => {
            const inicio = new Date(r.inicio);
            return inicio >= periodo.inicioUtc && inicio < periodo.fimUtc;
          });

          return (
            <Surface
              key={bimestre.numero}
              className={cn(
                "space-y-3 p-4",
                bimestre.encontros.length === 0 && "border-alert/30",
              )}
            >
              <div className="flex items-baseline justify-between gap-3">
                <p className="text-sm font-medium text-ink">
                  {NOMES_BIMESTRE[bimestre.numero - 1]}
                </p>
                <p className="font-mono text-xs text-ink-muted">
                  {curto(bimestre.inicioISO)} – {curto(bimestre.fimISO)}
                </p>
              </div>

              {bimestre.encontros.length === 0 ? (
                <p className="text-sm text-alert">Nenhuma formação registrada neste bimestre.</p>
              ) : (
                <div className="space-y-2">
                  {bimestre.encontros.map(
                    ({ reuniao, formacao }) =>
                      formacao && (
                        <FormacaoItem
                          key={formacao.id}
                          formacao={formacao}
                          reuniao={reuniao}
                          podeEditar={coordenacao}
                          fusoHorario={programa.fuso_horario}
                        />
                      ),
                  )}
                </div>
              )}

              {coordenacao && (
                <RegistrarFormacao
                  reunioesDisponiveis={doBimestre}
                  fusoHorario={programa.fuso_horario}
                />
              )}
            </Surface>
          );
        })}
      </div>
    </div>
  );
}
