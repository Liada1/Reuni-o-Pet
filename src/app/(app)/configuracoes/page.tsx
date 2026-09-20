import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/features/auth";
import {
  getProgramaSettings,
  getPerfisNomes,
  getGats,
  getMeetingTypes,
  getLocations,
  ProgramaForm,
  PerfisNomesForm,
  GatsManager,
  TiposEncontroManager,
  LocationsManager,
} from "@/features/configuracoes";
import { isCoordenacao } from "@/lib/permissions";

export default async function ConfiguracoesPage() {
  const perfil = await getCurrentProfile();
  if (!isCoordenacao(perfil)) redirect("/");

  const [programa, perfisNomes, gats, tiposEncontro, locais] = await Promise.all([
    getProgramaSettings(),
    getPerfisNomes(),
    getGats(),
    getMeetingTypes(),
    getLocations(),
  ]);

  return (
    <div className="mx-auto max-w-3xl space-y-10 px-4 py-8">
      <div>
        <h1 className="font-display text-2xl font-semibold text-ink">Configurações</h1>
        <p className="text-sm text-ink-muted">
          Ajustes gerais do programa, GATs, tipos de encontro e nomes de perfis.
        </p>
      </div>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-muted">
          Programa e grupo
        </h2>
        <ProgramaForm inicial={programa} />
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-muted">
          GATs
        </h2>
        <GatsManager inicial={gats} />
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-muted">
          Tipos de encontro
        </h2>
        <TiposEncontroManager inicial={tiposEncontro} />
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-muted">
          Locais frequentes
        </h2>
        <LocationsManager inicial={locais} />
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-muted">
          Nomes dos perfis
        </h2>
        <PerfisNomesForm inicial={perfisNomes} />
      </section>
    </div>
  );
}
