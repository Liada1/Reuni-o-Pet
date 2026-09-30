// O Supabase devolve erro de login em inglês ("email rate limit exceeded");
// quem lê é gente do grupo, que precisa saber o que fazer a seguir.
export function mensagemErroLogin(erro: { code?: string } | null | undefined): string {
  switch (erro?.code) {
    case "over_email_send_rate_limit":
    case "over_request_rate_limit":
      return "Muitos pedidos de acesso em pouco tempo. Tente de novo em alguns minutos ou entre com o Google.";
    case "email_address_invalid":
      return "Esse e-mail não parece válido. Confira se foi digitado certo.";
    case "email_address_not_authorized":
      return "Não conseguimos enviar e-mail para esse endereço agora. Entre com o Google ou avise a coordenação.";
    default:
      return "Não foi possível enviar o link de acesso. Tente de novo em alguns minutos.";
  }
}
