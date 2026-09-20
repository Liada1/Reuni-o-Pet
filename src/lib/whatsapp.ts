export function linkWhatsApp(texto: string) {
  return `https://wa.me/?text=${encodeURIComponent(texto)}`;
}

export function mensagemConvite(params: {
  nomePrograma: string;
  nomeGrupo: string;
  link: string;
}) {
  return `Olá! Você está convidado(a) para o ${params.nomePrograma} — ${params.nomeGrupo}.\nEntre pelo link para completar seu cadastro:\n${params.link}`;
}
