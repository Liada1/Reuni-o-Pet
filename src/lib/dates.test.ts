import { describe, it, expect } from "vitest";
import {
  paraUtc,
  formatarDiaSemana,
  formatarData,
  formatarDataSimples,
  formatarDataCurta,
  formatarMesAno,
  formatarHora,
  formatarDataHoraCompleta,
  paraInputData,
  paraInputHora,
} from "./dates";

const FORTALEZA = "America/Fortaleza"; // UTC-3
const LISBOA = "Europe/Lisbon";

describe("paraUtc", () => {
  it("lê data e hora como sendo do fuso do grupo", () => {
    expect(paraUtc("2026-09-21", "16:00", FORTALEZA).toISOString()).toBe(
      "2026-09-21T19:00:00.000Z",
    );
  });

  it("atravessa a meia-noite para o dia seguinte em UTC", () => {
    expect(paraUtc("2026-09-21", "22:00", FORTALEZA).toISOString()).toBe(
      "2026-09-22T01:00:00.000Z",
    );
  });

  it("é o inverso de paraInputData/paraInputHora", () => {
    const utc = paraUtc("2026-09-21", "19:30", FORTALEZA).toISOString();
    expect(paraInputData(utc, FORTALEZA)).toBe("2026-09-21");
    expect(paraInputHora(utc, FORTALEZA)).toBe("19:30");
  });
});

describe("formatarHora", () => {
  it("escreve como o grupo escreve na enquete", () => {
    expect(formatarHora("2026-09-21T19:00:00Z", FORTALEZA)).toBe("16h");
    expect(formatarHora("2026-09-25T22:30:00Z", FORTALEZA)).toBe("19h30");
  });

  it("zera à esquerda os minutos", () => {
    expect(formatarHora("2026-09-21T19:05:00Z", FORTALEZA)).toBe("16h05");
  });
});

describe("formatarData e amigos", () => {
  it("mostra o dia do grupo, não o do UTC", () => {
    // 01h UTC do dia 22 ainda é dia 21 às 22h em Fortaleza.
    const instante = "2026-09-22T01:00:00Z";
    expect(formatarData(instante, FORTALEZA)).toBe("21/09/2026");
    expect(formatarData(instante, "UTC")).toBe("22/09/2026");
  });

  it("formatarDiaSemana acompanha o fuso", () => {
    const instante = "2026-09-22T01:00:00Z"; // terça em UTC, segunda no grupo
    expect(formatarDiaSemana(instante, FORTALEZA)).toBe("SEG");
    expect(formatarDiaSemana(instante, "UTC")).toBe("TER");
  });

  it("formatarDataCurta dá dd/MM com zero à esquerda", () => {
    expect(formatarDataCurta("2026-03-05T15:00:00Z", FORTALEZA)).toBe("05/03");
  });

  it("formatarMesAno escreve o mês abreviado", () => {
    expect(formatarMesAno("2026-09-21T19:00:00Z", FORTALEZA)).toBe("set de 2026");
  });

  it("formatarDataHoraCompleta junta dia, data e hora", () => {
    expect(formatarDataHoraCompleta("2026-09-21T19:00:00Z", FORTALEZA)).toBe(
      "SEG 21/09/2026 · 16h",
    );
  });

  it("respeita o horário de verão de quem tem", () => {
    // Em julho Lisboa está em UTC+1: 23h30 UTC é 00h30 do dia seguinte.
    expect(formatarData("2026-07-21T23:30:00Z", LISBOA)).toBe("22/07/2026");
    // Em janeiro, UTC+0: continua no mesmo dia.
    expect(formatarData("2026-01-21T23:30:00Z", LISBOA)).toBe("21/01/2026");
  });
});

describe("formatarDataSimples", () => {
  /**
   * `action_items.prazo` é coluna `date`, sem fuso. Converter por timezone
   * mostrava o dia anterior (meia-noite UTC é 21h do dia anterior aqui), e
   * isso já aconteceu em produção — por isso esta função só reformata a
   * string, sem passar por Date.
   */
  it("não desloca o dia", () => {
    expect(formatarDataSimples("2026-09-25")).toBe("25/09/2026");
    expect(formatarDataSimples("2026-01-01")).toBe("01/01/2026");
  });

  it("aceita um timestamp inteiro, usando só a parte da data", () => {
    expect(formatarDataSimples("2026-09-25T00:00:00Z")).toBe("25/09/2026");
  });

  it("difere de formatarData justamente no caso que causou o bug", () => {
    expect(formatarDataSimples("2026-09-25")).toBe("25/09/2026");
    expect(formatarData("2026-09-25T00:00:00Z", FORTALEZA)).toBe("24/09/2026");
  });
});
