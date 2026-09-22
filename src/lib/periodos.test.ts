import { describe, it, expect, vi, afterEach } from "vitest";
import {
  mesCorrente,
  anoCorrente,
  mesValido,
  mesVizinho,
  periodoDoMes,
  semanasDoMes,
  bimestresDoAno,
  hojeIngenuo,
  ingenua,
  periodoEntre,
  rotuloMes,
  rotuloPeriodoCurto,
} from "./periodos";

/**
 * Estes testes rodam com TZ=UTC (ver vitest.config.ts) justamente para pegar
 * o erro que a máquina do Adail esconde: lá o fuso do sistema é o mesmo do
 * grupo, então trocar um pelo outro não muda nada.
 */
const FORTALEZA = "America/Fortaleza"; // UTC-3, sem horário de verão
const LISBOA = "Europe/Lisbon"; // muda de UTC+0 para UTC+1 no verão

afterEach(() => {
  vi.useRealTimers();
});

describe("mesCorrente / anoCorrente", () => {
  it("usa o dia do grupo, não o do servidor, perto da virada", () => {
    // 01/10 às 00h30 UTC ainda é 30/09 às 21h30 em Fortaleza.
    vi.setSystemTime(new Date("2026-10-01T00:30:00Z"));
    expect(mesCorrente(FORTALEZA)).toBe("2026-09");
    expect(mesCorrente("UTC")).toBe("2026-10");
  });

  it("vira o ano pelo fuso do grupo", () => {
    vi.setSystemTime(new Date("2027-01-01T01:00:00Z"));
    expect(anoCorrente(FORTALEZA)).toBe(2026);
    expect(anoCorrente("UTC")).toBe(2027);
  });
});

describe("mesValido", () => {
  it("aceita yyyy-MM", () => {
    expect(mesValido("2026-03", FORTALEZA)).toBe("2026-03");
  });

  it("cai no mês corrente quando o parâmetro não serve", () => {
    vi.setSystemTime(new Date("2026-05-15T12:00:00Z"));
    for (const ruim of [undefined, "", "2026", "marco/2026", "2026-3"]) {
      expect(mesValido(ruim, FORTALEZA)).toBe("2026-05");
    }
  });
});

describe("mesVizinho", () => {
  it("anda para frente e para trás", () => {
    expect(mesVizinho("2026-09", 1)).toBe("2026-10");
    expect(mesVizinho("2026-09", -1)).toBe("2026-08");
  });

  it("atravessa a virada do ano", () => {
    expect(mesVizinho("2026-12", 1)).toBe("2027-01");
    expect(mesVizinho("2026-01", -1)).toBe("2025-12");
  });
});

describe("periodoDoMes", () => {
  it("cobre do dia 1 ao último dia", () => {
    const p = periodoDoMes("2026-09", FORTALEZA);
    expect(p.inicioISO).toBe("2026-09-01");
    expect(p.fimISO).toBe("2026-09-30");
  });

  it("acha o último dia de fevereiro em ano bissexto", () => {
    expect(periodoDoMes("2024-02", FORTALEZA).fimISO).toBe("2024-02-29");
    expect(periodoDoMes("2026-02", FORTALEZA).fimISO).toBe("2026-02-28");
  });

  it("converte as bordas para instantes no fuso do grupo", () => {
    const p = periodoDoMes("2026-09", FORTALEZA);
    // Meia-noite em Fortaleza (UTC-3) é 03h UTC.
    expect(p.inicioUtc.toISOString()).toBe("2026-09-01T03:00:00.000Z");
    // `fimUtc` é o começo do dia seguinte ao último — usar com `<`.
    expect(p.fimUtc.toISOString()).toBe("2026-10-01T03:00:00.000Z");
  });

  it("respeita o horário de verão de fusos que o têm", () => {
    // Lisboa está em UTC+1 no verão: meia-noite local é 23h do dia anterior.
    const p = periodoDoMes("2026-07", LISBOA);
    expect(p.inicioUtc.toISOString()).toBe("2026-06-30T23:00:00.000Z");
    // Em janeiro, UTC+0: a meia-noite local coincide com a UTC.
    expect(periodoDoMes("2026-01", LISBOA).inicioUtc.toISOString()).toBe(
      "2026-01-01T00:00:00.000Z",
    );
  });
});

describe("semanasDoMes", () => {
  it("começa toda semana na segunda", () => {
    for (const s of semanasDoMes("2026-09", FORTALEZA)) {
      expect(ingenua(s.inicioISO).getDay()).toBe(1); // segunda
      expect(ingenua(s.fimISO).getDay()).toBe(0); // domingo
    }
  });

  it("deixa a primeira e a última semana invadirem o mês vizinho", () => {
    // 01/09/2026 é uma terça: a semana começa na segunda, 31/08.
    const semanas = semanasDoMes("2026-09", FORTALEZA);
    expect(semanas[0].inicioISO).toBe("2026-08-31");
    expect(semanas[semanas.length - 1].fimISO).toBe("2026-10-04");
  });

  it("cobre o mês inteiro sem buraco nem sobreposição", () => {
    const semanas = semanasDoMes("2026-09", FORTALEZA);
    for (let i = 1; i < semanas.length; i++) {
      const fimAnterior = ingenua(semanas[i - 1].fimISO);
      const inicio = ingenua(semanas[i].inicioISO);
      expect(inicio.getTime() - fimAnterior.getTime()).toBe(86_400_000);
    }
  });

  it("dá 5 semanas num mês que começa na segunda", () => {
    // 01/06/2026 é uma segunda-feira.
    const semanas = semanasDoMes("2026-06", FORTALEZA);
    expect(semanas[0].inicioISO).toBe("2026-06-01");
    expect(semanas).toHaveLength(5);
  });
});

describe("bimestresDoAno", () => {
  const bimestres = bimestresDoAno(2026, FORTALEZA);

  it("são seis, de jan–fev a nov–dez", () => {
    expect(bimestres).toHaveLength(6);
    expect(bimestres[0].inicioISO).toBe("2026-01-01");
    expect(bimestres[0].fimISO).toBe("2026-02-28");
    expect(bimestres[5].inicioISO).toBe("2026-11-01");
    expect(bimestres[5].fimISO).toBe("2026-12-31");
  });

  it("encaixam um no outro sem buraco", () => {
    for (let i = 1; i < bimestres.length; i++) {
      expect(bimestres[i].inicioUtc.getTime()).toBe(bimestres[i - 1].fimUtc.getTime());
    }
  });

  it("não vaza para o ano seguinte", () => {
    expect(bimestres[5].fimUtc.toISOString()).toBe("2027-01-01T03:00:00.000Z");
  });
});

describe("hojeIngenuo", () => {
  it("devolve o dia do grupo, com os campos de calendário corretos", () => {
    vi.setSystemTime(new Date("2026-10-01T00:30:00Z"));
    const hoje = hojeIngenuo(FORTALEZA);
    expect(hoje.getFullYear()).toBe(2026);
    expect(hoje.getMonth()).toBe(8); // setembro
    expect(hoje.getDate()).toBe(30);
  });
});

describe("periodoEntre", () => {
  it("inclui os dois extremos e converte no fuso do grupo", () => {
    const p = periodoEntre(ingenua("2026-09-21"), ingenua("2026-09-27"), FORTALEZA);
    expect(p.inicioISO).toBe("2026-09-21");
    expect(p.fimISO).toBe("2026-09-27");
    expect(p.inicioUtc.toISOString()).toBe("2026-09-21T03:00:00.000Z");
    expect(p.fimUtc.toISOString()).toBe("2026-09-28T03:00:00.000Z");
  });

  it("aceita um único dia", () => {
    const p = periodoEntre(ingenua("2026-09-21"), ingenua("2026-09-21"), FORTALEZA);
    expect(p.fimUtc.getTime() - p.inicioUtc.getTime()).toBe(86_400_000);
  });
});

describe("rótulos", () => {
  it("rotuloMes escreve o mês abreviado", () => {
    expect(rotuloMes("2026-09")).toBe("set de 2026");
    expect(rotuloMes("2026-01")).toBe("jan de 2026");
    expect(rotuloMes("2026-12")).toBe("dez de 2026");
  });

  it("rotuloPeriodoCurto escreve dd/MM – dd/MM", () => {
    const p = periodoEntre(ingenua("2026-09-28"), ingenua("2026-10-04"), FORTALEZA);
    expect(rotuloPeriodoCurto(p)).toBe("28/09 – 04/10");
  });
});
