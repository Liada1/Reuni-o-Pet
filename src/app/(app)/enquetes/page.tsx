import Link from "next/link";
import { ListChecks, Plus } from "lucide-react";
import { getCurrentProfile } from "@/features/auth";
import { getEnquetes } from "@/features/enquetes";
import { getProgramaSettings } from "@/features/configuracoes";
import { Surface } from "@/components/ui/surface";
import { Button } from "@/components/ui/button";
import { Carimbo } from "@/components/ui/carimbo";
import { EstadoVazio } from "@/components/ui/estado-vazio";
import { formatarDataHoraCompleta } from "@/lib/dates";
import { isCoordenacao } from "@/lib/permissions";

export const metadata = { title: "Enquetes" };

const STATUS_TEXTO: Record<string, string> = {
  aberta: "Aberta",
  confirmada: "Confirmada",
  fechada: "Fechada",
};

export default async function EnquetesPage() {
  const [perfil, enquetes, programa] = await Promise.all([
    getCurrentProfile(),
    getEnquetes(),
    getProgramaSettings(),
  ]);
  const coordenacao = isCoordenacao(perfil);

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4 py-8">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold text-ink">Enquetes</h1>
          <p className="text-sm text-ink-muted">Propostas de data para os encontros do grupo.</p>
        </div>
        {coordenacao && (
          <Link href="/enquetes/nova">
            <Button type="button">
              <Plus className="h-4 w-4" strokeWidth={1.75} />
              Nova enquete
            </Button>
          </Link>
        )}
      </div>

      {enquetes.length === 0 ? (
        <EstadoVazio
          icone={ListChecks}
          titulo="Nenhuma enquete ainda."
          descricao={
            coordenacao
              ? "Crie uma para propor datas ao grupo."
              : "Quando a coordenação criar uma, ela aparece aqui."
          }
          acao={
            coordenacao ? (
              <Link href="/enquetes/nova">
                <Button type="button" variant="secundario">
                  Criar enquete
                </Button>
              </Link>
            ) : undefined
          }
        />
      ) : (
        <ul className="space-y-2">
          {enquetes.map((poll) => (
            <li key={poll.id}>
              <Link href={coordenacao ? `/enquetes/${poll.id}` : `/e/${poll.code}`}>
                <Surface className="flex items-center justify-between gap-3 p-4 transition-colors hover:bg-paper">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span
                        className="h-2 w-2 shrink-0 rounded-full"
                        style={{ backgroundColor: poll.meeting_types?.cor }}
                      />
                      <p className="truncate font-medium text-ink">{poll.titulo}</p>
                    </div>
                    <p className="mt-0.5 text-xs text-ink-muted">
                      {poll.meeting_types?.nome}
                      {poll.prazo_votacao &&
                        poll.status === "aberta" &&
                        ` · até ${formatarDataHoraCompleta(poll.prazo_votacao, programa.fuso_horario)}`}
                    </p>
                  </div>
                  <Carimbo texto={STATUS_TEXTO[poll.status]} />
                </Surface>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
