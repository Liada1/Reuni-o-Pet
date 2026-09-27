import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  // só caminho interno: `@site.com`, `//site.com` ou `/\site.com` sairiam do domínio
  const nextParam = searchParams.get("next") ?? "/";
  const next = /^\/(?![/\\])/.test(nextParam) ? nextParam : "/";
  const inviteCode = searchParams.get("invite");
  const nomeCompletoParam = searchParams.get("nome_completo");
  const nomeExibicaoParam = searchParams.get("nome_exibicao");
  const telefoneParam = searchParams.get("telefone");

  if (!code) {
    return NextResponse.redirect(`${origin}/entrar?erro=link-invalido`);
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error || !data.user) {
    return NextResponse.redirect(`${origin}/entrar?erro=link-invalido`);
  }

  const user = data.user;
  const admin = createAdminClient();

  // erro do banco aqui não pode virar "entrou sem perfil": a pessoa cairia na
  // tela de sem cadastro sem saber que o problema foi nosso
  async function falhou() {
    await supabase.auth.signOut();
    return NextResponse.redirect(`${origin}/entrar?erro=falha-cadastro`);
  }

  const { data: perfilExistente, error: erroPerfil } = await admin
    .from("profiles")
    .select("id")
    .eq("auth_user_id", user.id)
    .maybeSingle();
  if (erroPerfil) return falhou();

  if (perfilExistente) {
    return NextResponse.redirect(`${origin}${next}`);
  }

  const email = user.email!;
  const { data: perfilPorEmail, error: erroEmail } = await admin
    .from("profiles")
    .select("id, auth_user_id")
    .eq("email", email)
    .is("auth_user_id", null)
    .maybeSingle();
  if (erroEmail) return falhou();

  if (perfilPorEmail) {
    const { error } = await admin
      .from("profiles")
      .update({ auth_user_id: user.id })
      .eq("id", perfilPorEmail.id);
    if (error) return falhou();
    return NextResponse.redirect(`${origin}${next}`);
  }

  if (inviteCode) {
    const { data: invite, error: erroConvite } = await admin
      .from("invites")
      .select("id, role, gat_id, expires_at, revoked_at")
      .eq("code", inviteCode)
      .maybeSingle();
    if (erroConvite) return falhou();

    const inviteValido =
      invite &&
      !invite.revoked_at &&
      (!invite.expires_at || new Date(invite.expires_at) > new Date());

    if (inviteValido) {
      const nomeGoogle =
        (user.user_metadata?.full_name as string | undefined) ??
        (user.user_metadata?.name as string | undefined);
      const nomeCompleto = nomeCompletoParam || nomeGoogle || email;
      const nomeExibicao =
        nomeExibicaoParam || nomeCompleto.split(" ")[0] || email;

      const { error } = await admin.from("profiles").insert({
        auth_user_id: user.id,
        nome_completo: nomeCompleto,
        nome_exibicao: nomeExibicao,
        email,
        telefone: telefoneParam || null,
        foto_url: (user.user_metadata?.avatar_url as string | undefined) ?? null,
        gat_id: invite.gat_id,
        role: invite.role,
        status: "pendente",
        invite_id: invite.id,
      });
      if (error) return falhou();

      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  await supabase.auth.signOut();
  return NextResponse.redirect(`${origin}/entrar?erro=sem-cadastro`);
}
