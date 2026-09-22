import { describe, it, expect } from "vitest";
import { gerarIcs, icsParaDataUri, linkGoogleAgenda } from "./ics";

const evento = {
  uid: "reuniao-1@pet",
  titulo: "Reunião de Área",
  inicioUtc: "2026-09-28T19:00:00.000Z",
  fimUtc: "2026-09-28T21:00:00.000Z",
};

describe("gerarIcs", () => {
  const ics = gerarIcs(evento);

  it("usa CRLF, como manda o formato", () => {
    expect(ics.split("\r\n").length).toBeGreaterThan(5);
    expect(ics).not.toMatch(/[^\r]\n/);
  });

  it("abre e fecha o calendário e o evento", () => {
    expect(ics.startsWith("BEGIN:VCALENDAR")).toBe(true);
    expect(ics.endsWith("END:VCALENDAR")).toBe(true);
    expect(ics).toContain("BEGIN:VEVENT");
    expect(ics).toContain("END:VEVENT");
  });

  it("compacta as datas no formato UTC do iCalendar", () => {
    expect(ics).toContain("DTSTART:20260928T190000Z");
    expect(ics).toContain("DTEND:20260928T210000Z");
  });

  it("omite local e descrição quando não há", () => {
    expect(ics).not.toContain("LOCATION:");
    expect(ics).not.toContain("DESCRIPTION:");
  });

  it("escapa vírgula, ponto e vírgula e barra invertida", () => {
    // Sem escapar, a vírgula do endereço parte o campo em dois valores.
    const comLocal = gerarIcs({ ...evento, local: "Bloco A, sala 3; fundos" });
    expect(comLocal).toContain(String.raw`LOCATION:Bloco A\, sala 3\; fundos`);
  });

  it("escapa quebra de linha na descrição", () => {
    const comDescricao = gerarIcs({ ...evento, descricao: "linha 1\nlinha 2" });
    expect(comDescricao).toContain(String.raw`DESCRIPTION:linha 1\nlinha 2`);
  });
});

describe("icsParaDataUri", () => {
  it("devolve um data URI de calendário", () => {
    const uri = icsParaDataUri(evento);
    expect(uri.startsWith("data:text/calendar;charset=utf-8,")).toBe(true);
    expect(decodeURIComponent(uri.split(",")[1])).toContain("SUMMARY:Reunião de Área");
  });
});

describe("linkGoogleAgenda", () => {
  it("monta o intervalo no formato que o Google espera", () => {
    const url = new URL(linkGoogleAgenda(evento));
    expect(url.searchParams.get("action")).toBe("TEMPLATE");
    expect(url.searchParams.get("dates")).toBe("20260928T190000Z/20260928T210000Z");
    expect(url.searchParams.get("text")).toBe("Reunião de Área");
  });

  it("só inclui local e detalhes quando existem", () => {
    const semExtras = new URL(linkGoogleAgenda(evento));
    expect(semExtras.searchParams.has("location")).toBe(false);
    expect(semExtras.searchParams.has("details")).toBe(false);

    const comExtras = new URL(linkGoogleAgenda({ ...evento, local: "Auditório" }));
    expect(comExtras.searchParams.get("location")).toBe("Auditório");
  });
});
