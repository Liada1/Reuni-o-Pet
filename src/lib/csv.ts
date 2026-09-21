/**
 * CSV para abrir no Excel/LibreOffice em português.
 *
 * Duas decisões que evitam planilha quebrada: separador `;` (o Excel em
 * pt-BR espera ponto e vírgula) e BOM no começo do arquivo (sem ele o
 * Excel lê UTF-8 como Latin-1 e "Formação" vira "FormaÃ§Ã£o").
 */

function celula(valor: string | number): string {
  const texto = String(valor ?? "");
  return /[";\n\r]/.test(texto) ? `"${texto.replace(/"/g, '""')}"` : texto;
}

export function gerarCsv(cabecalho: string[], linhas: (string | number)[][]): string {
  return [cabecalho, ...linhas].map((linha) => linha.map(celula).join(";")).join("\r\n");
}

/** Dispara o download no navegador. Só funciona no cliente. */
export function baixarCsv(nomeArquivo: string, conteudo: string) {
  const blob = new Blob([`﻿${conteudo}`], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = nomeArquivo.endsWith(".csv") ? nomeArquivo : `${nomeArquivo}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}
