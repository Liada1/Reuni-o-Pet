import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/features/auth";
import { getMeetingTypes, getLocations } from "@/features/configuracoes";
import { NovaReuniaoForm } from "@/features/agenda/components/nova-reuniao-form";
import { isCoordenacao } from "@/lib/permissions";

export default async function NovaReuniaoPage() {
  const perfil = await getCurrentProfile();
  if (!isCoordenacao(perfil)) redirect("/");

  const [tiposEncontro, locais] = await Promise.all([getMeetingTypes(), getLocations()]);

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4 py-8">
      <div>
        <h1 className="font-display text-2xl font-semibold text-ink">Nova reunião</h1>
        <p className="text-sm text-ink-muted">
          Para reuniões com data já definida, sem precisar de enquete.
        </p>
      </div>
      <NovaReuniaoForm
        tiposEncontro={tiposEncontro.filter((t) => t.ativo)}
        locais={locais.filter((l) => l.ativo)}
      />
    </div>
  );
}
