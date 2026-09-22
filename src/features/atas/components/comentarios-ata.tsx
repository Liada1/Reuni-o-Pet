"use client";

import { useState, useTransition } from "react";
import { X } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { comentarAta, removerComentario } from "../actions";
import type { CommentComPerfil } from "../types";

export function ComentariosAta({
  minutesId,
  meetingId,
  comentarios,
  meuId,
  podeRemoverTodos,
}: {
  minutesId: string;
  meetingId: string;
  comentarios: CommentComPerfil[];
  meuId: string;
  podeRemoverTodos: boolean;
}) {
  const [texto, setTexto] = useState("");
  const [pending, startTransition] = useTransition();

  function enviar() {
    if (!texto.trim()) return;
    startTransition(async () => {
      await comentarAta(minutesId, meetingId, texto.trim());
      setTexto("");
    });
  }

  return (
    <div className="space-y-3">
      {comentarios.length === 0 && <p className="text-sm text-ink-muted">Nenhum comentário ainda.</p>}
      <ul className="space-y-2">
        {comentarios.map((c) => (
          <li key={c.id} className="flex items-start gap-2">
            <Avatar nome={c.profiles?.nome_exibicao ?? "?"} fotoUrl={c.profiles?.foto_url} tamanho="sm" />
            <div className="flex-1 rounded-[var(--radius-control)] bg-paper px-3 py-2 text-sm text-ink">
              <p className="text-xs font-medium text-ink-muted">{c.profiles?.nome_exibicao}</p>
              {c.texto}
            </div>
            {(podeRemoverTodos || c.profile_id === meuId) && (
              <button
                type="button"
                onClick={() => startTransition(() => removerComentario(c.id, meetingId))}
                className="p-1 text-ink-muted hover:text-alert"
                aria-label="Remover comentário"
              >
                <X className="h-3.5 w-3.5" strokeWidth={1.75} />
              </button>
            )}
          </li>
        ))}
      </ul>
      <div className="flex items-center gap-2">
        <Input
          aria-label="Comentário sobre a ata"
          placeholder="Deixe um comentário"
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && enviar()}
        />
        <Button type="button" variant="secundario" onClick={enviar} disabled={pending}>
          Enviar
        </Button>
      </div>
    </div>
  );
}
