import { describe, it, expect } from "vitest";
import { minutosDoEncontro, formatarMinutos, emHoras } from "./duracao";

const previsto = {
  inicio: "2026-09-28T19:00:00Z",
  fim_previsto: "2026-09-28T21:00:00Z",
  inicio_real: null,
  fim_real: null,
};

describe("minutosDoEncontro", () => {
  it("usa o previsto quando a reunião ainda não aconteceu", () => {
    expect(minutosDoEncontro(previsto)).toBe(120);
  });

  it("prefere o que de fato aconteceu", () => {
    expect(
      minutosDoEncontro({
        ...previsto,
        inicio_real: "2026-09-28T19:10:00Z",
        fim_real: "2026-09-28T20:40:00Z",
      }),
    ).toBe(90);
  });

  it("ignora o real pela metade e volta para o previsto", () => {
    // Reunião iniciada e ainda não encerrada: sem os dois lados não dá para
    // medir o que aconteceu.
    expect(minutosDoEncontro({ ...previsto, inicio_real: "2026-09-28T19:10:00Z" })).toBe(120);
    expect(minutosDoEncontro({ ...previsto, fim_real: "2026-09-28T20:40:00Z" })).toBe(120);
  });

  it("a carga horária da formação manda em tudo", () => {
    // Decisão da Fase 4: o que vale para certificação é a carga registrada,
    // mesmo que o encontro tenha durado outra coisa.
    expect(minutosDoEncontro(previsto, 240)).toBe(240);
    expect(
      minutosDoEncontro(
        { ...previsto, inicio_real: "2026-09-28T19:00:00Z", fim_real: "2026-09-28T19:30:00Z" },
        240,
      ),
    ).toBe(240);
  });

  it("carga horária zero é um valor, não 'não informado'", () => {
    expect(minutosDoEncontro(previsto, 0)).toBe(0);
    expect(minutosDoEncontro(previsto, null)).toBe(120);
    expect(minutosDoEncontro(previsto, undefined)).toBe(120);
  });

  it("nunca devolve duração negativa", () => {
    expect(
      minutosDoEncontro({
        ...previsto,
        inicio_real: "2026-09-28T21:00:00Z",
        fim_real: "2026-09-28T19:00:00Z",
      }),
    ).toBe(0);
  });

  it("arredonda para o minuto mais próximo", () => {
    expect(
      minutosDoEncontro({
        inicio: "2026-09-28T19:00:00Z",
        fim_previsto: "2026-09-28T19:01:40Z",
        inicio_real: null,
        fim_real: null,
      }),
    ).toBe(2);
  });
});

describe("formatarMinutos", () => {
  it("omite os minutos quando são zero", () => {
    expect(formatarMinutos(120)).toBe("2h");
    expect(formatarMinutos(0)).toBe("0h");
  });

  it("zera à esquerda os minutos", () => {
    expect(formatarMinutos(90)).toBe("1h30");
    expect(formatarMinutos(65)).toBe("1h05");
    expect(formatarMinutos(2)).toBe("0h02");
  });
});

describe("emHoras", () => {
  it("converte para horas decimais, para comparar com a meta", () => {
    expect(emHoras(120)).toBe(2);
    expect(emHoras(90)).toBe(1.5);
    expect(emHoras(0)).toBe(0);
  });
});
