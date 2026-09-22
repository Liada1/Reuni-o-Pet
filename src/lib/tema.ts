/**
 * Tema claro/escuro. Os tokens já existem no `globals.css` sob `.dark`; o
 * que este módulo faz é decidir quando a classe entra no `<html>`.
 *
 * "sistema" é o padrão: segue `prefers-color-scheme` e continua seguindo se
 * a pessoa mudar a preferência do aparelho com a página aberta.
 *
 * A preferência mora num **cookie**, não em `localStorage`, porque o
 * servidor precisa conhecê-la para renderizar o seletor já no estado certo.
 * Com `localStorage` o servidor renderizava "Sistema" marcado e o cliente
 * remarcava outro botão — erro de hidratação de verdade, não só cosmético.
 * (O app inteiro já é renderizado sob demanda por causa da sessão, então
 * ler cookie aqui não custa prerender nenhum.)
 */

export type Tema = "claro" | "escuro" | "sistema";

export const TEMA_PADRAO: Tema = "sistema";
export const CHAVE_TEMA = "pet-tema";

const UM_ANO_EM_SEGUNDOS = 60 * 60 * 24 * 365;

export function temaValido(valor: string | null | undefined): Tema {
  return valor === "claro" || valor === "escuro" || valor === "sistema"
    ? valor
    : TEMA_PADRAO;
}

export function salvarTema(tema: Tema): void {
  document.cookie = `${CHAVE_TEMA}=${tema}; path=/; max-age=${UM_ANO_EM_SEGUNDOS}; SameSite=Lax`;
}

export function prefereEscuroNoSistema(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-color-scheme: dark)").matches
  );
}

export function resolverTema(tema: Tema): "claro" | "escuro" {
  if (tema !== "sistema") return tema;
  return prefereEscuroNoSistema() ? "escuro" : "claro";
}

/** Cor da barra do navegador/app instalado, por tema. */
const COR_BARRA = { claro: "#2f6b4f", escuro: "#161c1f" } as const;

export function aplicarTema(tema: Tema): void {
  const efetivo = resolverTema(tema);
  const html = document.documentElement;
  html.classList.toggle("dark", efetivo === "escuro");
  html.style.colorScheme = efetivo === "escuro" ? "dark" : "light";
  document
    .querySelector('meta[name="theme-color"]')
    ?.setAttribute("content", COR_BARRA[efetivo]);
}

/**
 * Roda no `<head>`, durante a leitura do HTML, antes da primeira pintura —
 * é o que evita o flash branco em quem escolheu escuro. Só a classe `.dark`
 * depende disto: em "claro" e "escuro" o servidor já poderia ter decidido,
 * mas em "sistema" só o navegador sabe a preferência do aparelho.
 *
 * Precisa ser ES5 simples e sem dependências, porque vai inline na página.
 */
export const SCRIPT_TEMA = `(function(){try{
var m=document.cookie.match(/(?:^|; )${CHAVE_TEMA}=([^;]*)/);
var t=m?decodeURIComponent(m[1]):${JSON.stringify(TEMA_PADRAO)};
var e=t==="escuro"||(t!=="claro"&&matchMedia("(prefers-color-scheme: dark)").matches);
var h=document.documentElement;
h.classList.toggle("dark",e);
h.style.colorScheme=e?"dark":"light";
var c=document.querySelector('meta[name="theme-color"]');
if(c)c.setAttribute("content",e?${JSON.stringify(COR_BARRA.escuro)}:${JSON.stringify(COR_BARRA.claro)});
}catch(_){}})()`;
