"use client";

import { useState, useTransition } from "react";
import { atualizarAtaPdfSettings } from "../actions";
import type { AtaPdfSettings } from "../types";

export function AtaPdfForm({ inicial }: { inicial: AtaPdfSettings }) {
  const [dados, setDados] = useState(inicial);
  const [, startTransition] = useTransition();

  return (
    <label className="flex items-center gap-2 text-sm text-ink">
      <input
        type="checkbox"
        checked={dados.coluna_assinatura}
        onChange={(e) => {
          const novo = { ...dados, coluna_assinatura: e.target.checked };
          setDados(novo);
          startTransition(() => atualizarAtaPdfSettings(novo));
        }}
      />
      Incluir coluna de assinatura na lista de presença do PDF
    </label>
  );
}
