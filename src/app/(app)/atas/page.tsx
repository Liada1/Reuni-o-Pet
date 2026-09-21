import Link from "next/link";
import { Archive } from "lucide-react";
import { getAtas, buscarAtasPorTexto } from "@/features/atas";
import { getMeetingTypes, getProgramaSettings } from "@/features/configuracoes";
import { Surface } from "@/components/ui/surface";
import { Carimbo } from "@/components/ui/carimbo";
import { EstadoVazio } from "@/components/ui/estado-vazio";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { formatarData } from "@/lib/dates";
import type { MinuteStatus } from "@/lib/supabase/types";

const STATUS_TEXTO: Record<MinuteStatus, string> = {
  rascunho: "Rascunho",
  em_revisao: "Em revisão",
  aprovada: "Aprovada",
};

export default async function AtasPage({
  searchParams,
}: {
  searchParams: Promise<{ tipo?: string; status?: MinuteStatus; busca?: string }>;
}) {
  const { tipo, status, busca } = await searchParams;
  const [tipos, programa] = await Promise.all([getMeetingTypes(), getProgramaSettings()]);

  const linhas = busca
    ? await buscarAtasPorTexto(busca)
    : await getAtas({ meetingTypeId: tipo || undefined, status: status || undefined });

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4 py-8">
      <div>
        <h1 className="font-display text-2xl font-semibold text-ink">Atas</h1>
        <p className="text-sm text-ink-muted">Arquivo de todas as reuniões registradas.</p>
      </div>

      <form className="flex flex-wrap gap-2" action="/atas">
        <Input name="busca" placeholder="Buscar nas anotações…" defaultValue={busca} className="max-w-xs" />
        <Select name="tipo" defaultValue={tipo ?? ""} className="w-auto">
          <option value="">Todos os tipos</option>
          {tipos.map((t) => (
            <option key={t.id} value={t.id}>
              {t.nome}
            </option>
          ))}
        </Select>
        <Select name="status" defaultValue={status ?? ""} className="w-auto">
          <option value="">Todos os status</option>
          {(Object.keys(STATUS_TEXTO) as MinuteStatus[]).map((s) => (
            <option key={s} value={s}>
              {STATUS_TEXTO[s]}
            </option>
          ))}
        </Select>
        <button type="submit" className="rounded-[var(--radius-control)] border border-border px-3 text-sm text-ink-muted hover:bg-paper">
          Filtrar
        </button>
      </form>

      {linhas.length === 0 ? (
        <EstadoVazio icone={Archive} titulo="Nenhuma ata encontrada." />
      ) : (
        <ul className="space-y-2">
          {linhas.map((l) => (
            <li key={l.id}>
              <Link href={`/reunioes/${l.meeting_id}/ata`}>
                <Surface className="flex items-center justify-between gap-3 p-4 transition-colors hover:bg-paper">
                  <div className="flex items-center gap-2">
                    <span
                      className="h-2 w-2 shrink-0 rounded-full"
                      style={{ backgroundColor: l.meetings?.meeting_types?.cor }}
                    />
                    <div>
                      <p className="text-sm font-medium text-ink">
                        {l.meetings?.titulo || l.meetings?.meeting_types?.nome}
                      </p>
                      <p className="text-xs text-ink-muted">
                        {l.meetings && formatarData(l.meetings.inicio, programa.fuso_horario)}
                      </p>
                    </div>
                  </div>
                  <Carimbo texto={STATUS_TEXTO[l.status]} />
                </Surface>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
