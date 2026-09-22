"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { atualizarRelato } from "../actions";

export function RelatoEditor({
  minutesId,
  meetingId,
  chave,
  titulo,
  valorInicial,
  jaSalvoNoServidor,
  editavel,
}: {
  minutesId: string;
  meetingId: string;
  chave: string;
  titulo: string;
  valorInicial: string;
  /** false quando `valorInicial` é só o rascunho calculado a partir das
   * anotações rápidas (ainda não gravado em minutes.relato) — nesse caso
   * precisa persistir assim que a tela abre, senão o PDF sai vazio mesmo
   * com texto visível aqui. */
  jaSalvoNoServidor: boolean;
  editavel: boolean;
}) {
  const [texto, setTexto] = useState(valorInicial);
  const [salvo, setSalvo] = useState(true);
  const [, startTransition] = useTransition();
  const ultimoSalvo = useRef(jaSalvoNoServidor ? valorInicial : null);

  function salvar(valor: string) {
    if (valor === ultimoSalvo.current) return;
    ultimoSalvo.current = valor;
    setSalvo(false);
    startTransition(async () => {
      await atualizarRelato(minutesId, meetingId, chave, valor);
      setSalvo(true);
    });
  }

  useEffect(() => {
    if (editavel && !jaSalvoNoServidor && valorInicial) {
      salvar(valorInicial);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="space-y-1">
      <p className="text-sm font-medium text-ink">{titulo}</p>
      {editavel ? (
        <textarea
          aria-label={`Relato do tópico "${titulo}"`}
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          onBlur={() => salvar(texto)}
          rows={4}
          className="w-full rounded-[var(--radius-control)] border border-border bg-surface px-3 py-2 text-sm text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        />
      ) : (
        <p className="whitespace-pre-line text-sm text-ink-muted">{texto || "—"}</p>
      )}
      {editavel && !salvo && <p className="text-xs text-ink-muted">Salvando…</p>}
    </div>
  );
}
