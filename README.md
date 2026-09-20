# PET — Agendamento e registro de reuniões

Sistema interno para substituir a enquete de datas no WhatsApp e o caderno de
atas do grupo por um fluxo único: propor datas → votar → confirmar reunião →
registrar a ata durante o encontro → gerar o PDF.

Stack: Next.js (App Router) + TypeScript, Supabase (Postgres, Auth, Storage),
Tailwind CSS, `@react-pdf/renderer` (a partir da Fase 3).

Este README cobre o que já existe na **Fase 1** (base: autenticação, perfis,
convites, membros, configurações). Funcionalidades de fases seguintes
(enquetes, agenda, atas, encaminhamentos, formação, frequência) ainda não
existem no código.

## Rodando localmente

### 1. Pré-requisitos

- Node.js 20+
- Uma conta e um projeto no [Supabase](https://supabase.com) (gratuito)

### 2. Instalar dependências

```bash
npm install
```

### 3. Configurar variáveis de ambiente

Copie `.env.local.example` para `.env.local` e preencha com os dados do seu
projeto Supabase (**Project Settings → API**):

```bash
cp .env.local.example .env.local
```

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` — fica só no servidor, nunca é enviada ao
  navegador. Usada para resolver códigos de convite antes do login e para
  vincular um cadastro feito diretamente pela coordenação ao primeiro login
  da pessoa.
- `NEXT_PUBLIC_SITE_URL` — usada como referência local (`http://localhost:3000`).

### 4. Aplicar as migrações no banco

Com a [CLI do Supabase](https://supabase.com/docs/guides/cli) instalada e
logada, ligando ao seu projeto:

```bash
npx supabase link --project-ref <seu-project-ref>
npx supabase db push
```

Isso cria as tabelas (`profiles`, `gats`, `meeting_types`, `locations`,
`invites`, `settings`), as políticas de RLS e os dados padrão (5 tipos de
encontro e as configurações iniciais).

### 5. Login com Google (opcional nesta fase)

Em **Authentication → Providers → Google** no painel do Supabase, ative o
provedor e informe o Client ID/Secret gerados no Google Cloud Console
(**APIs & Services → Credentials**), com o redirect URI:

```
https://<seu-projeto>.supabase.co/auth/v1/callback
```

Sem isso configurado, o botão "Entrar com Google" fica visível mas retorna
erro — o login por link mágico funciona independentemente.

### 6. Rodar o servidor de desenvolvimento

```bash
npm run dev
```

Abra http://localhost:3000. Como ainda não há nenhum membro cadastrado, o
primeiro acesso precisa ser feito manualmente: insira uma linha na tabela
`profiles` pelo painel do Supabase com `role = 'coordenacao'` e
`status = 'ativo'` usando o e-mail que você vai usar para entrar (deixe
`auth_user_id` em branco — ele é vinculado automaticamente no primeiro
login). A partir daí essa pessoa já pode convidar o restante do grupo pela
tela **Membros**.

### 7. Testes de tipo e lint

```bash
npx tsc --noEmit
npm run lint
npm run build
```

## Publicar (deploy)

1. Suba o repositório para o GitHub.
2. Importe o projeto na [Vercel](https://vercel.com).
3. Configure as mesmas variáveis de ambiente do `.env.local` no painel da
   Vercel (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
   `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_SITE_URL` = URL de produção).
4. No Supabase, adicione a URL de produção em **Authentication → URL
   Configuration → Redirect URLs** (ex: `https://seu-dominio.vercel.app/auth/callback`).
5. Rode as migrações no projeto de produção (`npx supabase db push`, ou
   aplique os arquivos de `supabase/migrations` manualmente pelo SQL
   Editor).

## Como o projeto está organizado

```
src/
  app/                    rotas (App Router)
    (app)/                páginas autenticadas, dentro do NavShell
    entrar/, convite/, auth/callback/   páginas públicas de login/convite
  components/ui/          design system próprio (botão, input, avatar…)
  config/modules.ts        registro central de rotas/navegação
  features/<modulo>/       um módulo por funcionalidade:
    actions.ts              server actions (mutações)
    queries.ts               leituras (server components)
    components/              componentes do módulo
    types.ts                  tipos específicos do módulo
    index.ts                   único ponto de entrada — outros módulos e
                                páginas só importam daqui
  lib/                     infraestrutura compartilhada
    supabase/                clientes (browser, server, admin, middleware)
    whatsapp.ts               geração de mensagens/links do WhatsApp
    permissions.ts             checagens de papel (coordenação etc.)
supabase/migrations/       schema versionado (SQL)
```

**Regra importante:** um módulo em `src/features/` só é acessado por fora
através do seu `index.ts` — nunca importe um arquivo interno de outro módulo
diretamente (exceção: componentes client-only devem importar server actions
direto do arquivo `actions.ts`, e não do `index.ts` do módulo, para não
puxar código server-only para o bundle do navegador — veja
`src/components/ui/nav-shell.tsx` como exemplo).

## Como adicionar um novo módulo/funcionalidade

1. Crie a pasta `src/features/<nome>/` com `types.ts`, `queries.ts`,
   `actions.ts`, `components/` e `index.ts` (reexportando o que os outros
   módulos/páginas vão usar).
2. Se o módulo precisar de tabelas novas, adicione uma migração em
   `supabase/migrations/000N_<descricao>.sql` — nunca edite uma migração já
   aplicada em produção, crie uma nova.
3. Crie as páginas em `src/app/(app)/<rota>/` (ou fora do grupo `(app)` se a
   página precisar ser pública, como `/convite/[codigo]`).
4. Registre a rota em `src/config/modules.ts` com `ativo: true` e os perfis
   que podem vê-la — é isso que faz o item aparecer na navegação lateral
   (desktop) e inferior (celular).
5. Se o módulo tiver alguma configuração própria, adicione uma seção em
   `src/features/configuracoes/`.

## Fases

- [x] **Fase 1 — Base**: autenticação (link mágico + Google), perfis,
      convites, gestão de membros, configurações básicas, design system,
      navegação.
- [ ] **Fase 2 — Enquetes e agenda**
- [ ] **Fase 3 — Atas e PDF**
- [ ] **Fase 4 — Planejamento e acompanhamento**
- [ ] **Fase 5 — Acabamento** (PWA, tema escuro, acessibilidade, testes)
