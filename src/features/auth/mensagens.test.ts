import { describe, expect, it } from "vitest";
import { mensagemErroLogin } from "./mensagens";

describe("mensagemErroLogin", () => {
  it("limite de envio de e-mail vira aviso para esperar ou usar o Google", () => {
    const msg = mensagemErroLogin({ code: "over_email_send_rate_limit" });
    expect(msg).toContain("Tente de novo em alguns minutos");
    expect(msg).toContain("Google");
  });

  it("limite geral de pedidos tem o mesmo aviso", () => {
    expect(mensagemErroLogin({ code: "over_request_rate_limit" })).toBe(
      mensagemErroLogin({ code: "over_email_send_rate_limit" }),
    );
  });

  it("e-mail inválido pede para conferir a digitação", () => {
    expect(mensagemErroLogin({ code: "email_address_invalid" })).toContain("digitado");
  });

  it("erro desconhecido ou sem código nunca mostra o texto em inglês", () => {
    for (const erro of [{ code: "unexpected_failure" }, {}, null, undefined]) {
      expect(mensagemErroLogin(erro)).toBe(
        "Não foi possível enviar o link de acesso. Tente de novo em alguns minutos.",
      );
    }
  });
});
