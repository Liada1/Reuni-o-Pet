/**
 * Título da ata, usado na tela de revisão e no PDF.
 *
 * O nome do tipo de encontro é editável pela coordenação, então não dá para
 * concordar artigo com ele: "Ata do Área" e "Ata do Formação bimestral"
 * saem errados, e qualquer escolha de artigo erra metade dos casos. O
 * travessão evita a concordância e funciona para qualquer nome que alguém
 * cadastre.
 */
export function tituloDaAta(nomeDoTipo: string | null | undefined): string {
  return `Ata — ${nomeDoTipo?.trim() || "Encontro"}`;
}
