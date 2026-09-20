import Link from "next/link";
import { UserCheck } from "lucide-react";
import { getCurrentProfile } from "@/features/auth";
import { contarPendentes } from "@/features/membros";
import { isCoordenacao } from "@/lib/permissions";
import { Surface } from "@/components/ui/surface";

export default async function PainelPage() {
  const perfil = await getCurrentProfile();
  const coordenacao = isCoordenacao(perfil);
  const pendentes = coordenacao ? await contarPendentes() : 0;

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-8">
      <div>
        <h1 className="font-display text-2xl font-semibold text-ink">
          Olá, {perfil!.nome_exibicao.split(" ")[0]}
        </h1>
        <p className="text-sm text-ink-muted">
          {coordenacao
            ? "Painel da coordenação."
            : "Assim que a coordenação criar enquetes e reuniões, elas vão aparecer aqui."}
        </p>
      </div>

      {coordenacao && pendentes > 0 && (
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

      {coordenacao && pendentes === 0 && (
        <p className="text-sm text-ink-muted">Nenhum pedido de entrada pendente.</p>
      )}
    </div>
  );
}
