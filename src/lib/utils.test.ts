import { describe, it, expect } from "vitest";
import { cn, iniciais, gerarCodigoConvite } from "./utils";

describe("cn", () => {
  it("deixa a classe de quem chama vencer a do componente base", () => {
    // Este era o bug dos filtros de /atas e /encaminhamentos: com clsx puro
    // o `w-full` do Select ganhava do `w-auto` passado pela página.
    expect(cn("w-full", "w-auto")).toBe("w-auto");
  });

  it("junta classes que não conflitam", () => {
    expect(cn("flex", "gap-2")).toBe("flex gap-2");
  });

  it("ignora falsos e condicionais desligados", () => {
    expect(cn("flex", false && "hidden", undefined, null)).toBe("flex");
  });
});

describe("iniciais", () => {
  it("usa a primeira e a última palavra", () => {
    expect(iniciais("Maria de Fátima Souza")).toBe("MS");
  });

  it("repete nada quando só há um nome", () => {
    expect(iniciais("Adail")).toBe("A");
  });

  it("aguenta espaços sobrando", () => {
    expect(iniciais("  Ana   Lima  ")).toBe("AL");
  });

  it("devolve string vazia para nome vazio", () => {
    expect(iniciais("")).toBe("");
    expect(iniciais("   ")).toBe("");
  });
});

describe("gerarCodigoConvite", () => {
  it("tem 8 caracteres do alfabeto sem ambiguidade", () => {
    // Sem i, l, o, 0 e 1: o código é lido em voz alta e digitado à mão.
    for (let i = 0; i < 200; i++) {
      expect(gerarCodigoConvite()).toMatch(/^[abcdefghjkmnpqrstuvwxyz23456789]{8}$/);
    }
  });

  it("não repete na prática", () => {
    const codigos = new Set(Array.from({ length: 500 }, gerarCodigoConvite));
    expect(codigos.size).toBe(500);
  });
});
