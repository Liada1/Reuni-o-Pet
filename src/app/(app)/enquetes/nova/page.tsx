import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/features/auth";
import { getMembros } from "@/features/membros";
import {
  getMeetingTypes,
  getLocations,
  getGats,
  getProgramaSettings,
} from "@/features/configuracoes";
import { NovaEnqueteForm } from "@/features/enquetes/components/nova-enquete-form";
import { isCoordenacao } from "@/lib/permissions";

export const metadata = { title: "Nova enquete" };

export default async function NovaEnquetePage() {
  const perfil = await getCurrentProfile();
  if (!isCoordenacao(perfil)) redirect("/");

  const [tiposEncontro, locais, gats, membros, programa] = await Promise.all([
    getMeetingTypes(),
    getLocations(),
    getGats(),
    getMembros(),
    getProgramaSettings(),
  ]);

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-8">
      <div>
        <h1 className="font-display text-2xl font-semibold text-ink">Nova enquete de datas</h1>
        <p className="text-sm text-ink-muted">
          Proponha datas para o grupo votar — substitui a enquete do WhatsApp.
        </p>
      </div>
      <NovaEnqueteForm
        tiposEncontro={tiposEncontro.filter((t) => t.ativo)}
        locais={locais.filter((l) => l.ativo)}
        gats={gats.filter((g) => g.ativo)}
        membros={membros
          .filter((m) => m.status === "ativo")
          .map((m) => ({ id: m.id, nome_exibicao: m.nome_exibicao, role: m.role }))}
        fusoHorario={programa.fuso_horario}
      />
    </div>
  );
}
