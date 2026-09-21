import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Junta classes resolvendo conflitos do Tailwind: a classe passada por
 * quem usa o componente vence a do componente base (ex: `w-auto` sobre o
 * `w-full` padrão do Select). */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function iniciais(nome: string) {
  const partes = nome.trim().split(/\s+/);
  const primeira = partes[0]?.[0] ?? "";
  const ultima = partes.length > 1 ? partes[partes.length - 1][0] : "";
  return (primeira + ultima).toUpperCase();
}

export function gerarCodigoConvite() {
  const alfabeto = "abcdefghjkmnpqrstuvwxyz23456789";
  let codigo = "";
  for (let i = 0; i < 8; i++) {
    codigo += alfabeto[Math.floor(Math.random() * alfabeto.length)];
  }
  return codigo;
}
