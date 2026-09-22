import { describe, it, expect } from "vitest";
import { gerarCsv } from "./csv";

describe("gerarCsv", () => {
  it("separa por ponto e vírgula e quebra linha com CRLF", () => {
    expect(gerarCsv(["Nome", "Horas"], [["Adail", 2]])).toBe("Nome;Horas\r\nAdail;2");
  });

  it("protege com aspas o que tem ponto e vírgula", () => {
    // Sem isso, "Saúde/Clima; Eixo III" viraria duas colunas.
    expect(gerarCsv(["Grupo"], [["Saúde/Clima; Eixo III"]])).toBe(
      'Grupo\r\n"Saúde/Clima; Eixo III"',
    );
  });

  it("dobra as aspas de dentro do texto", () => {
    expect(gerarCsv(["Tema"], [['Ata da "reunião"']])).toBe('Tema\r\n"Ata da ""reunião"""');
  });

  it("protege texto com quebra de linha", () => {
    expect(gerarCsv(["Nota"], [["linha 1\nlinha 2"]])).toBe('Nota\r\n"linha 1\nlinha 2"');
  });

  it("não coloca aspas onde não precisa", () => {
    expect(gerarCsv(["Nome"], [["Maria de Fátima"]])).toBe("Nome\r\nMaria de Fátima");
  });

  it("aceita tabela vazia, devolvendo só o cabeçalho", () => {
    expect(gerarCsv(["Nome", "Horas"], [])).toBe("Nome;Horas");
  });
});
