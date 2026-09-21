import { getCurrentProfile } from "@/features/auth";
import { getEncaminhamentos } from "@/features/atas";
import { getMembros } from "@/features/membros";
import { EncaminhamentosLista } from "@/features/encaminhamentos/components/encaminhamentos-lista";
import { Select } from "@/components/ui/select";
import { isCoordenacao } from "@/lib/permissions";
import type { ActionItemStatus } from "@/lib/supabase/types";

export default async function EncaminhamentosPage({
  searchParams,
}: {
  searchParams: Promise<{ pessoa?: string; status?: ActionItemStatus }>;
}) {
  const { pessoa, status } = await searchParams;
  const [perfil, membros] = await Promise.all([getCurrentProfile(), getMembros()]);

  const itens = await getEncaminhamentos({
    responsavelId: pessoa || undefined,
    status: status || undefined,
  });

  const membrosAtivos = membros.filter((m) => m.status === "ativo");

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4 py-8">
      <div>
        <h1 className="font-display text-2xl font-semibold text-ink">Encaminhamentos</h1>
        <p className="text-sm text-ink-muted">Tarefas combinadas nas reuniões.</p>
      </div>

      <form className="flex flex-wrap gap-2" action="/encaminhamentos">
        <Select name="pessoa" defaultValue={pessoa ?? ""} className="w-auto">
          <option value="">Todas as pessoas</option>
          {membrosAtivos.map((m) => (
            <option key={m.id} value={m.id}>
              {m.nome_exibicao}
            </option>
          ))}
        </Select>
        <Select name="status" defaultValue={status ?? ""} className="w-auto">
          <option value="">Todos os status</option>
          <option value="pendente">Pendente</option>
          <option value="em_andamento">Em andamento</option>
          <option value="concluido">Concluído</option>
        </Select>
        <button
          type="submit"
          className="rounded-[var(--radius-control)] border border-border px-3 text-sm text-ink-muted hover:bg-paper"
        >
          Filtrar
        </button>
      </form>

      <EncaminhamentosLista
        itens={itens}
        meuId={perfil!.id}
        podeEditarTudo={isCoordenacao(perfil)}
      />
    </div>
  );
}
