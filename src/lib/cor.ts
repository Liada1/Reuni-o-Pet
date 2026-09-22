/**
 * Cor de texto legível sobre um fundo colorido.
 *
 * A cor de cada tipo de encontro é editável pela coordenação, então não dá
 * para fixar `text-white` na etiqueta: basta alguém escolher um amarelo e o
 * texto some. (O padrão "Formação bimestral", #8A7A2E, já dava só 4,28:1
 * com branco — abaixo do mínimo AA.) Aqui o texto é escolhido por
 * contraste, e qualquer cor futura continua legível.
 *
 * O par é branco e **preto puro**, não a tinta `--color-ink` do tema. Entre
 * branco e preto, a pior cor de fundo possível ainda rende 4,58:1 — ou
 * seja, passa em AA para qualquer cor que alguém escolha. Com a tinta do
 * tema (#1e2a2f) o pior caso cai para 3,84:1, e o próprio #8A7A2E já
 * reprovava nas duas opções (4,28 com branco, 3,44 com a tinta).
 */

const CLARO = "#ffffff";
const ESCURO = "#000000";

function canalLinear(v: number): number {
  const c = v / 255;
  return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

function luminancia(hex: string): number | null {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return null;
  const n = parseInt(m[1], 16);
  return (
    0.2126 * canalLinear((n >> 16) & 255) +
    0.7152 * canalLinear((n >> 8) & 255) +
    0.0722 * canalLinear(n & 255)
  );
}

function contraste(l1: number, l2: number): number {
  const [maior, menor] = l1 > l2 ? [l1, l2] : [l2, l1];
  return (maior + 0.05) / (menor + 0.05);
}

/** Branco ou tinta escura, o que tiver mais contraste com o fundo. */
export function textoSobre(fundo: string | null | undefined): string {
  const l = fundo ? luminancia(fundo) : null;
  if (l === null) return CLARO;
  const lClaro = luminancia(CLARO)!;
  const lEscuro = luminancia(ESCURO)!;
  return contraste(l, lClaro) >= contraste(l, lEscuro) ? CLARO : ESCURO;
}
