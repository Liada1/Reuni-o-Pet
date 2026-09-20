import { ConviteForm } from "@/features/auth";
import { getConvitePublico } from "@/features/membros";
import { getProgramaSettings, getPerfisNomes } from "@/features/configuracoes";
import { Ban } from "lucide-react";

export default async function ConvitePage({
  params,
}: {
  params: Promise<{ codigo: string }>;
}) {
  const { codigo } = await params;
  const [convite, programa, perfisNomes] = await Promise.all([
    getConvitePublico(codigo),
    getProgramaSettings(),
    getPerfisNomes(),
  ]);

  return (
    <div className="flex min-h-svh flex-col items-center justify-center bg-paper px-4 py-10">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <p className="font-display text-2xl font-semibold text-ink">
            {programa.nome_programa}
          </p>
          {programa.nome_grupo && (
            <p className="text-sm text-ink-muted">{programa.nome_grupo}</p>
          )}
        </div>

        {!convite.valido ? (
          <div className="flex flex-col items-center gap-3 rounded-[var(--radius-panel)] border border-border bg-surface p-6 text-center">
            <Ban className="h-8 w-8 text-alert" strokeWidth={1.5} />
            <p className="font-medium text-ink">Convite inválido ou expirado</p>
            <p className="text-sm text-ink-muted">
              Peça um novo link à coordenação do grupo.
            </p>
          </div>
        ) : (
          <div className="space-y-4 rounded-[var(--radius-panel)] border border-border bg-surface p-6">
            <p className="text-sm text-ink-muted">
              Você foi convidado(a) como{" "}
              <strong className="text-ink">
                {perfisNomes[convite.role!]}
              </strong>
              {convite.gatNome && (
                <>
                  {" "}
                  no GAT <strong className="text-ink">{convite.gatNome}</strong>
                </>
              )}
              . Preencha seus dados para continuar.
            </p>
            <ConviteForm codigo={codigo} />
          </div>
        )}
      </div>
    </div>
  );
}
