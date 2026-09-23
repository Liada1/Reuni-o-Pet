import { describe, it, expect } from "vitest";
import { tituloDaAta } from "./titulo";

describe("tituloDaAta", () => {
  it("não concorda artigo com o nome do tipo", () => {
    // "Ata do Área" e "Ata do Formação bimestral" eram o bug: o nome do
    // tipo é editável, então artigo nenhum acerta todos os casos.
    expect(tituloDaAta("Área")).toBe("Ata — Área");
    expect(tituloDaAta("GAT")).toBe("Ata — GAT");
    expect(tituloDaAta("Formação bimestral")).toBe("Ata — Formação bimestral");
    expect(tituloDaAta("Atividade externa")).toBe("Ata — Atividade externa");
  });

  it("cai num rótulo genérico quando a reunião não tem tipo", () => {
    expect(tituloDaAta(null)).toBe("Ata — Encontro");
    expect(tituloDaAta(undefined)).toBe("Ata — Encontro");
    expect(tituloDaAta("")).toBe("Ata — Encontro");
    expect(tituloDaAta("   ")).toBe("Ata — Encontro");
  });

  it("apara espaço sobrando digitado nas configurações", () => {
    expect(tituloDaAta("  Estudos  ")).toBe("Ata — Estudos");
  });
});
