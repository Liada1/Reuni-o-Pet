import { describe, it, expect } from "vitest";
import { textoSobre } from "./cor";

const BRANCO = "#ffffff";
const ESCURO = "#000000";

describe("textoSobre", () => {
  it("escolhe branco sobre as cores escuras dos tipos de encontro", () => {
    expect(textoSobre("#2F6B4F")).toBe(BRANCO); // Área
    expect(textoSobre("#3D6E8F")).toBe(BRANCO); // GAT
    expect(textoSobre("#7A5C99")).toBe(BRANCO); // Estudos
  });

  it("escolhe tinta escura sobre cores claras", () => {
    // O ocre da identidade e o amarelo que alguém pode escolher.
    expect(textoSobre("#D9A441")).toBe(ESCURO);
    expect(textoSobre("#ffff00")).toBe(ESCURO);
    expect(textoSobre("#ffffff")).toBe(ESCURO);
  });

  it("resolve o caso que motivou a função", () => {
    // "Formação bimestral" (#8A7A2E) com branco dava 4,28:1 — reprovava.
    expect(textoSobre("#8A7A2E")).toBe(ESCURO);
  });

  it("garante AA em qualquer cor de fundo", () => {
    // É esta propriedade que justifica o par branco/preto em vez da tinta
    // do tema: varrendo o espectro, a pior cor ainda passa de 4,5:1.
    const luminancia = (hex: string) => {
      const n = parseInt(hex.slice(1), 16);
      const canal = (v: number) => {
        const c = v / 255;
        return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
      };
      return (
        0.2126 * canal((n >> 16) & 255) +
        0.7152 * canal((n >> 8) & 255) +
        0.0722 * canal(n & 255)
      );
    };
    const contraste = (a: number, b: number) =>
      (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);

    let pior = Infinity;
    for (let r = 0; r < 256; r += 17) {
      for (let g = 0; g < 256; g += 17) {
        for (let b = 0; b < 256; b += 17) {
          const fundo = `#${[r, g, b].map((v) => v.toString(16).padStart(2, "0")).join("")}`;
          const razao = contraste(luminancia(fundo), luminancia(textoSobre(fundo)));
          pior = Math.min(pior, razao);
        }
      }
    }
    expect(pior).toBeGreaterThanOrEqual(4.5);
  });

  it("aceita hex com e sem #, em qualquer caixa", () => {
    expect(textoSobre("2f6b4f")).toBe(BRANCO);
    expect(textoSobre("#2F6B4F")).toBe(BRANCO);
    expect(textoSobre(" #2f6b4f ")).toBe(BRANCO);
  });

  it("cai no branco quando a cor não veio ou não dá para ler", () => {
    // O fundo padrão nesse caso é o verde escuro do tema.
    expect(textoSobre(null)).toBe(BRANCO);
    expect(textoSobre(undefined)).toBe(BRANCO);
    expect(textoSobre("")).toBe(BRANCO);
    expect(textoSobre("azul")).toBe(BRANCO);
    expect(textoSobre("#abc")).toBe(BRANCO);
  });
});
