import { EntrarForm } from "@/features/auth";
import { getProgramaSettings } from "@/features/configuracoes";

export const metadata = { title: "Entrar" };

export default async function EntrarPage({
  searchParams,
}: {
  searchParams: Promise<{ erro?: string; redirect?: string }>;
}) {
  const { erro, redirect } = await searchParams;
  const programa = await getProgramaSettings();

  return (
    <div className="flex min-h-svh flex-col items-center justify-center bg-paper px-4 py-10">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <h1 className="font-display text-2xl font-semibold text-ink">
            {programa.nome_programa}
          </h1>
          {programa.nome_grupo && (
            <p className="text-sm text-ink-muted">{programa.nome_grupo}</p>
          )}
        </div>
        <div className="rounded-[var(--radius-panel)] border border-border bg-surface p-6">
          <EntrarForm erroInicial={erro} next={redirect} />
        </div>
      </div>
    </div>
  );
}
