import { describe, it, expect } from "vitest";
import { temaValido, TEMA_PADRAO, CHAVE_TEMA, SCRIPT_TEMA } from "./tema";

describe("temaValido", () => {
  it("aceita os três temas", () => {
    expect(temaValido("claro")).toBe("claro");
    expect(temaValido("escuro")).toBe("escuro");
    expect(temaValido("sistema")).toBe("sistema");
  });

  it("cai no padrão para qualquer outra coisa", () => {
    // O valor vem de um cookie, que qualquer pessoa pode editar à mão.
    for (const ruim of [undefined, null, "", "dark", "CLARO", "<script>"]) {
      expect(temaValido(ruim)).toBe(TEMA_PADRAO);
    }
  });
});

describe("SCRIPT_TEMA", () => {
  it("procura o cookie pelo nome que o resto do código usa", () => {
    expect(SCRIPT_TEMA).toContain(CHAVE_TEMA);
  });

  it("é envolvido em try/catch — falhar aqui deixaria a página em branco", () => {
    expect(SCRIPT_TEMA).toContain("try{");
    expect(SCRIPT_TEMA).toContain("catch");
  });

  it("decide o mesmo que temaValido decidiria", () => {
    // Executa o script de verdade contra um DOM de mentira, para os dois
    // caminhos não divergirem com o tempo.
    const casos: [string, boolean, boolean][] = [
      // cookie,               sistema prefere escuro, esperado .dark
      ["pet-tema=escuro", false, true],
      ["pet-tema=claro", true, false],
      ["pet-tema=sistema", true, true],
      ["pet-tema=sistema", false, false],
      ["", true, true], // sem cookie: padrão é "sistema"
      ["pet-tema=xyz", true, true], // valor inválido: idem
      ["pet-tema=xyz", false, false],
    ];

    for (const [cookie, sistemaEscuro, esperado] of casos) {
      let temDark = false;
      const html = {
        classList: { toggle: (_: string, on: boolean) => { temDark = on; } },
        style: { colorScheme: "" },
      };
      const contexto = {
        document: { cookie, documentElement: html, querySelector: () => null },
        matchMedia: () => ({ matches: sistemaEscuro }),
        localStorage: undefined,
      };
      new Function("document", "matchMedia", "localStorage", SCRIPT_TEMA)(
        contexto.document,
        contexto.matchMedia,
        contexto.localStorage,
      );
      expect(temDark, `cookie=${cookie || "(nenhum)"} sistemaEscuro=${sistemaEscuro}`).toBe(
        esperado,
      );
      expect(html.style.colorScheme).toBe(esperado ? "dark" : "light");
    }
  });
});
