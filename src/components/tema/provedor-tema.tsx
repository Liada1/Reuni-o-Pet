"use client";

import { createContext, useCallback, useContext, useEffect, useLayoutEffect, useState } from "react";
import { aplicarTema, salvarTema, TEMA_PADRAO, type Tema } from "@/lib/tema";

interface ContextoTema {
  tema: Tema;
  definirTema: (tema: Tema) => void;
}

const Contexto = createContext<ContextoTema | null>(null);

/** `temaInicial` vem do cookie lido no layout raiz — é o que faz o servidor
 * e o cliente renderizarem o seletor no mesmo estado. */
export function ProvedorTema({
  temaInicial,
  children,
}: {
  temaInicial: Tema;
  children: React.ReactNode;
}) {
  const [tema, setTema] = useState<Tema>(temaInicial);

  // Em desenvolvimento o Strict Mode remonta e limpa os atributos que o
  // script inline pôs no `<html>`; reaplicar antes da pintura corrige isso
  // e é inofensivo em produção.
  useLayoutEffect(() => {
    aplicarTema(tema);
  }, [tema]);

  // Em "sistema", mudar o tema do aparelho com a página aberta vale na hora.
  useEffect(() => {
    if (tema !== "sistema" || typeof window.matchMedia !== "function") return;
    const consulta = window.matchMedia("(prefers-color-scheme: dark)");
    const aoMudar = () => aplicarTema("sistema");
    consulta.addEventListener("change", aoMudar);
    return () => consulta.removeEventListener("change", aoMudar);
  }, [tema]);

  const definirTema = useCallback((novo: Tema) => {
    setTema(novo);
    salvarTema(novo);
    aplicarTema(novo);
  }, []);

  return <Contexto.Provider value={{ tema, definirTema }}>{children}</Contexto.Provider>;
}

export function useTema(): ContextoTema {
  return useContext(Contexto) ?? { tema: TEMA_PADRAO, definirTema: () => {} };
}
