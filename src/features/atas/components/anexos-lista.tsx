"use client";

import { useTransition } from "react";
import { Paperclip, Trash2, ExternalLink } from "lucide-react";
import { urlAssinadaAnexo, removerAnexo } from "../actions";
import type { Attachment } from "../types";

export function AnexosLista({
  anexos,
  meetingId,
  podeRemover,
}: {
  anexos: Attachment[];
  meetingId: string;
  podeRemover: boolean;
}) {
  const [, startTransition] = useTransition();

  if (anexos.length === 0) {
    return <p className="text-sm text-ink-muted">Nenhum anexo nesta ata.</p>;
  }

  async function abrir(storagePath: string) {
    const url = await urlAssinadaAnexo(storagePath);
    window.open(url, "_blank", "noopener,noreferrer");
  }

  return (
    <ul className="space-y-1.5">
      {anexos.map((a) => (
        <li
          key={a.id}
          className="flex items-center gap-2 rounded-[var(--radius-control)] border border-border bg-surface p-2 text-sm"
        >
          <Paperclip className="h-4 w-4 shrink-0 text-ink-muted" strokeWidth={1.75} />
          <button
            type="button"
            onClick={() => abrir(a.storage_path)}
            className="flex flex-1 items-center gap-1 truncate text-left text-ink hover:underline"
          >
            {a.nome ?? "Anexo"}
            <ExternalLink className="h-3 w-3 shrink-0" strokeWidth={1.75} />
          </button>
          {podeRemover && (
            <button
              type="button"
              onClick={() => startTransition(() => removerAnexo(a.id, meetingId, a.storage_path))}
              className="shrink-0 p-1 text-ink-muted hover:text-alert"
              aria-label="Remover anexo"
            >
              <Trash2 className="h-4 w-4" strokeWidth={1.75} />
            </button>
          )}
        </li>
      ))}
    </ul>
  );
}
