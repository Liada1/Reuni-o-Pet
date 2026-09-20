import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/features/auth";
import { getProgramaSettings, getGats } from "@/features/configuracoes";
import {
  getMembros,
  getConvitesAtivos,
  MembrosLista,
  CadastrarMembroForm,
  ConviteGerador,
  ConvitesAtivosLista,
} from "@/features/membros";
import { isCoordenacao } from "@/lib/permissions";

export default async function MembrosPage() {
  const perfil = await getCurrentProfile();
  if (!isCoordenacao(perfil)) redirect("/");

  const [membros, gats, convites, programa] = await Promise.all([
    getMembros(),
    getGats(),
    getConvitesAtivos(),
    getProgramaSettings(),
  ]);
  const gatsAtivos = gats.filter((g) => g.ativo);

  return (
    <div className="mx-auto max-w-3xl space-y-8 px-4 py-8">
      <div>
        <h1 className="font-display text-2xl font-semibold text-ink">Membros</h1>
        <p className="text-sm text-ink-muted">
          Aprove pedidos de entrada, cadastre membros diretamente e gerencie
          convites.
        </p>
      </div>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-muted">
          Convite pelo link
        </h2>
        <ConviteGerador
          gats={gatsAtivos}
          nomePrograma={programa.nome_programa}
          nomeGrupo={programa.nome_grupo}
        />
        <ConvitesAtivosLista convites={convites} />
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-muted">
          Cadastro direto
        </h2>
        <CadastrarMembroForm gats={gatsAtivos} />
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-muted">
          Todos os membros
        </h2>
        <MembrosLista membros={membros} gats={gatsAtivos} />
      </section>
    </div>
  );
}
