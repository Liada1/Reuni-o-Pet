"use server";

import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";

export interface DadosConvite {
  invite?: string;
  nomeCompleto?: string;
  nomeExibicao?: string;
  telefone?: string;
  next?: string;
}

function montarCallbackUrl(origin: string, dados: DadosConvite) {
  const url = new URL("/auth/callback", origin);
  url.searchParams.set("next", dados.next || "/");
  if (dados.invite) url.searchParams.set("invite", dados.invite);
  if (dados.nomeCompleto) url.searchParams.set("nome_completo", dados.nomeCompleto);
  if (dados.nomeExibicao) url.searchParams.set("nome_exibicao", dados.nomeExibicao);
  if (dados.telefone) url.searchParams.set("telefone", dados.telefone);
  return url.toString();
}

export async function enviarLinkMagico(email: string, dados: DadosConvite) {
  const supabase = await createClient();
  const origin = (await headers()).get("origin") ?? process.env.NEXT_PUBLIC_SITE_URL!;

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: montarCallbackUrl(origin, dados),
    },
  });

  if (error) {
    return { erro: error.message };
  }
  return { erro: null };
}

export async function entrarComGoogle(dados: DadosConvite) {
  const supabase = await createClient();
  const origin = (await headers()).get("origin") ?? process.env.NEXT_PUBLIC_SITE_URL!;

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: montarCallbackUrl(origin, dados),
    },
  });

  if (error || !data.url) {
    return { erro: error?.message ?? "Não foi possível iniciar o login com Google.", url: null };
  }
  return { erro: null, url: data.url };
}

export async function sair() {
  const supabase = await createClient();
  await supabase.auth.signOut();
}
