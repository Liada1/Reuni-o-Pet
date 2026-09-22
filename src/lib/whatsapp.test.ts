import { describe, it, expect } from "vitest";
import {
  linkWhatsApp,
  mensagemConvite,
  mensagemEnquete,
  mensagemLembrete,
  mensagemConfirmacao,
  mensagemResumoAta,
  mensagemRemarcacaoCancelamento,
} from "./whatsapp";

describe("linkWhatsApp", () => {
  it("codifica o texto inteiro na query", () => {
    expect(linkWhatsApp("Olá & tchau")).toBe("https://wa.me/?text=Ol%C3%A1%20%26%20tchau");
  });

  it("codifica quebras de linha, que o WhatsApp preserva", () => {
    expect(linkWhatsApp("linha 1\nlinha 2")).toContain("%0A");
  });

  it("não deixa o link da mensagem escapar da query", () => {
    const link = linkWhatsApp("Vote: https://pet.app/e/abc?x=1&y=2");
    expect(link.indexOf("?")).toBe(link.lastIndexOf("?"));
    expect(link).not.toContain("&y=");
  });
});

describe("mensagemEnquete", () => {
  it("inclui o prazo quando há prazo", () => {
    const m = mensagemEnquete({
      titulo: "Dia para nosso encontro",
      tipoEncontro: "Área",
      prazoFormatado: "23/09 às 18h",
      link: "https://pet.app/e/abc",
    });
    expect(m).toContain("Votem até 23/09 às 18h");
    expect(m).toContain("https://pet.app/e/abc");
  });

  it("omite a linha do prazo quando não há", () => {
    const m = mensagemEnquete({
      titulo: "Dia para nosso encontro",
      tipoEncontro: "Área",
      prazoFormatado: null,
      link: "https://pet.app/e/abc",
    });
    expect(m).not.toContain("Votem até");
    expect(m).toBe("📅 Dia para nosso encontro (Área)\nhttps://pet.app/e/abc");
  });
});

describe("mensagemLembrete", () => {
  it("lista quem falta votar, um por linha", () => {
    const m = mensagemLembrete({
      titulo: "Dia para nosso encontro",
      nomes: ["Ana", "Bruno"],
      link: "https://pet.app/e/abc",
    });
    expect(m).toContain("- Ana\n- Bruno");
  });
});

describe("mensagemResumoAta", () => {
  const base = { tituloReuniao: "Reunião de Área" };

  it("diz explicitamente quando não houve decisão nem encaminhamento", () => {
    // Melhor que uma seção vazia: quem lê no WhatsApp saberia se foi erro.
    const m = mensagemResumoAta({ ...base, decisoes: [], encaminhamentos: [] });
    expect(m).toContain("Nenhuma decisão registrada.");
    expect(m).toContain("Nenhum encaminhamento registrado.");
  });

  it("escreve responsável e prazo quando existem", () => {
    const m = mensagemResumoAta({
      ...base,
      decisoes: ["Manter o horário das 16h"],
      encaminhamentos: [
        { descricao: "Enviar relatório", responsavel: "Ana", prazo: "2026-09-25" },
      ],
    });
    expect(m).toContain("- Manter o horário das 16h");
    expect(m).toContain("- Enviar relatório (Ana) — prazo 25/09/2026");
  });

  it("não desloca o prazo em um dia", () => {
    // `prazo` é coluna `date`: já houve o bug de mostrar o dia anterior.
    const m = mensagemResumoAta({
      ...base,
      decisoes: [],
      encaminhamentos: [{ descricao: "Reservar auditório", responsavel: null, prazo: "2026-10-01" }],
    });
    expect(m).toContain("prazo 01/10/2026");
  });

  it("omite responsável e prazo quando não há", () => {
    const m = mensagemResumoAta({
      ...base,
      decisoes: [],
      encaminhamentos: [{ descricao: "Reservar auditório", responsavel: null, prazo: null }],
    });
    expect(m.trimEnd().endsWith("- Reservar auditório")).toBe(true);
    expect(m).not.toContain("prazo");
  });
});

describe("mensagemRemarcacaoCancelamento", () => {
  it("cancelamento não anuncia data nova", () => {
    const m = mensagemRemarcacaoCancelamento({
      tituloReuniao: "Reunião de Área",
      status: "cancelada",
      motivo: "Feriado",
    });
    expect(m).toContain("foi cancelada");
    expect(m).toContain("Motivo: Feriado");
    expect(m).not.toContain("Nova data");
  });

  it("remarcação anuncia a data nova", () => {
    const m = mensagemRemarcacaoCancelamento({
      tituloReuniao: "Reunião de Área",
      status: "remarcada",
      dataHoraFormatada: "QUA 30/09/2026 · 16h",
    });
    expect(m).toContain("foi remarcada");
    expect(m).toContain("Nova data: QUA 30/09/2026 · 16h");
  });

  it("omite o motivo quando não foi informado", () => {
    const m = mensagemRemarcacaoCancelamento({
      tituloReuniao: "Reunião de Área",
      status: "cancelada",
    });
    expect(m).not.toContain("Motivo:");
  });
});

describe("mensagemConvite e mensagemConfirmacao", () => {
  it("o convite traz programa, grupo e link", () => {
    const m = mensagemConvite({
      nomePrograma: "PET",
      nomeGrupo: "Saúde/Clima – Eixo III",
      link: "https://pet.app/convite/abc",
    });
    expect(m).toContain("PET — Saúde/Clima – Eixo III");
    expect(m).toContain("https://pet.app/convite/abc");
  });

  it("a confirmação traz data, local e link da agenda", () => {
    const m = mensagemConfirmacao({
      tituloReuniao: "Reunião de Área",
      dataHoraFormatada: "SEG 28/09/2026 · 16h",
      local: "Auditório",
      link: "https://pet.app/reunioes/1",
    });
    expect(m).toContain("SEG 28/09/2026 · 16h · Auditório");
  });
});
