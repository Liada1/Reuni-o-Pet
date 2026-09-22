# PET — Reuniões

Sistema interno do grupo PET para substituir a enquete de datas no WhatsApp e
o caderno de atas por um fluxo único:

> propor datas → votar → confirmar a reunião → registrar a ata durante o
> encontro → gerar o PDF

Depois que a ata está aprovada, os encaminhamentos combinados viram uma lista
por pessoa, as presenças viram relatório de frequência e horas, e o
planejamento do mês mostra se a semana está dentro da meta.

## O que o sistema faz

| Módulo | Rota | O que resolve |
|---|---|---|
| **Painel** | `/` | O que exige atenção hoje: próxima reunião, seus encaminhamentos, última ata |
| **Enquetes** | `/enquetes` | Propor datas, votar *Posso* / *Se precisar*, ver quem não votou, confirmar → cria a reunião |
| **Agenda** | `/agenda` | Mês, semana e lista; reunião direta; remarcar e cancelar com mensagem pronta de WhatsApp; `.ics` e Google Agenda |
| **Modo reunião** | `/reunioes/[id]/ao-vivo` | Tela cheia para usar durante o encontro: presença, anotação por tópico, ditado por voz, foto vira anexo — **funciona offline** |
| **Atas** | `/atas` | Revisão, comentários, aprovação, PDF versionado e arquivo com busca dentro das anotações |
| **Encaminhamentos** | `/encaminhamentos` | Tarefas combinadas nas reuniões, por pessoa e por status |
| **Planejamento** | `/planejamento` | Semanas do mês com encontros e horas contra a meta, e tipos obrigatórios faltando |
| **Formação** | `/formacao` | Os 6 bimestres do ano, com tema e carga horária certificada |
| **Frequência** | `/frequencia` | Presenças, justificadas, faltas, horas e % por pessoa |
| **Membros** | `/membros` | Convite por link com aprovação, ou cadastro direto pela coordenação |
| **Configurações** | `/configuracoes` | Programa, GATs, locais, tipos de encontro, metas e nomes dos perfis |

Participante vê só os próprios dados de frequência; a coordenação vê o grupo.
O que cada perfil enxerga está em `src/config/modules.ts`.

## Rodando localmente

### 1. Pré-requisitos

- Node.js 20 ou mais novo
- Um projeto no [Supabase](https://supabase.com) (o plano gratuito basta)

### 2. Instalar e configurar

```bash
npm install
cp .env.local.example .env.local
```

Preencha `.env.local` com os dados do seu projeto Supabase
(**Project Settings → API**):

| Variável | Para quê |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Endereço do projeto |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Chave pública, usada no navegador |
| `SUPABASE_SERVICE_ROLE_KEY` | **Só no servidor.** Resolve o código do convite antes do login e liga um cadastro feito pela coordenação ao primeiro login da pessoa |
| `NEXT_PUBLIC_SITE_URL` | Origem do site — é ela que monta o link do convite e o redirect do login por link mágico |

### 3. Criar o banco

```bash
npx supabase db push --project-ref <ref-do-projeto> -p <senha-do-postgres>
```

`--project-ref` + `-p` evita ter que percent-encodar a senha dentro de uma
URL, e não exige `supabase link`. Isso cria as tabelas, as políticas de RLS,
os 5 tipos de encontro padrão e as configurações iniciais.

### 4. Entrar pela primeira vez

Ainda não há ninguém cadastrado, então o primeiro acesso é manual: insira uma
linha em `profiles` pelo painel do Supabase com o seu e-mail,
`role = 'coordenacao'` e `status = 'ativo'`, deixando `auth_user_id` em branco
— ele é preenchido sozinho no primeiro login. A partir daí essa pessoa
convida o resto do grupo pela tela **Membros**.

### 5. Login com Google (opcional)

Em **Authentication → Providers → Google** no Supabase, ative o provedor e
informe o Client ID/Secret do Google Cloud Console, com o redirect URI:

```
https://<seu-projeto>.supabase.co/auth/v1/callback
```

Sem isso o botão "Entrar com Google" retorna erro; o login por link mágico
funciona de forma independente.

### 6. Rodar

```bash
npm run dev          # http://localhost:3000
```

## Comandos

```bash
npm run dev          # servidor de desenvolvimento
npm run build        # build de produção
npm run test         # testes (Vitest)
npm run test:watch   # testes em modo observador
npm run typecheck    # tsc --noEmit
npm run lint         # eslint, sem tolerar warning
npm run verificar    # tipos + lint + testes + build, nessa ordem
```

Rode `npm run verificar` antes de commitar.

## Publicar na Vercel

1. Suba o repositório para o GitHub e importe o projeto na
   [Vercel](https://vercel.com).
2. Cadastre no painel da Vercel as mesmas variáveis do `.env.local`, com
   `NEXT_PUBLIC_SITE_URL` apontando para o domínio de produção.
3. No Supabase, em **Authentication → URL Configuration**, ponha a URL de
   produção em *Site URL* e adicione `https://<dominio>/auth/callback` em
   *Redirect URLs* — sem isso o link mágico volta para `localhost`.
4. Se o projeto de produção for outro, aplique as migrações nele
   (`npx supabase db push --project-ref … -p …`).

> O servidor da Vercel roda em UTC e o grupo não. Todo cálculo de data no
> servidor passa pelo fuso configurado em **Configurações → Fuso horário**;
> veja "Datas" abaixo.

## Como o projeto está organizado

```
src/
  app/                       rotas (App Router)
    (app)/                     páginas autenticadas, dentro do NavShell
    reunioes/[id]/ao-vivo/     modo reunião — fora do grupo (app) de
                               propósito, para não herdar a navegação
    entrar/, convite/, e/, auth/callback/   páginas públicas
    manifest.ts                manifesto do PWA, com o nome vindo do banco
  components/
    ui/                        design system próprio (botão, input, avatar…)
    tema/                      provedor e seletor de tema claro/escuro
  config/modules.ts          registro central de rotas e navegação
  features/<modulo>/         um módulo por funcionalidade:
    queries.ts                 leituras (server components)
    actions.ts                 server actions (mutações)
    components/                componentes do módulo
    types.ts                   tipos do módulo
    index.ts                   única fronteira pública do módulo
  lib/                       infraestrutura compartilhada
    supabase/                  clientes (browser, server, admin, middleware)
    offline/                   IndexedDB + fila de mutações do modo reunião
    periodos.ts                mês, semana e bimestre no fuso do grupo
    dates.ts                   formatação de data e hora
    duracao.ts                 minutos de um encontro
    cor.ts, csv.ts, ics.ts, whatsapp.ts, tema.ts
supabase/migrations/         schema versionado (SQL)
scripts/                     scripts operacionais (dados de demonstração)
```

**Regra de fronteira:** um módulo em `src/features/` só é acessado de fora
pelo seu `index.ts`. A exceção é componente client-only, que importa a server
action direto de `actions.ts` para não puxar código server-only para o bundle
do navegador (veja `src/components/ui/nav-shell.tsx`).

### Adicionar um módulo

1. Crie `src/features/<nome>/` com `types.ts`, `queries.ts`, `actions.ts`,
   `components/` e `index.ts`.
2. Precisando de tabela nova, crie `supabase/migrations/000N_<descricao>.sql`
   — **nunca** edite uma migração já aplicada.
3. Crie as páginas em `src/app/(app)/<rota>/`.
4. Registre a rota em `src/config/modules.ts` com `ativo: true` e os perfis
   que podem vê-la. É isso que faz o item aparecer na navegação.

Módulo com `ativo: false` existe no código mas não renderiza em lugar nenhum
— é assim que se evita tela "em construção".

## Coisas que já deram errado aqui

São padrões, não curiosidades: cada um corresponde a um bug que aconteceu
neste projeto.

### Datas

- **Fuso do grupo, sempre.** Qualquer "hoje", mês ou semana calculado no
  servidor passa por `src/lib/periodos.ts` ou `date-fns-tz`, nunca por
  `new Date()` cru. A Vercel roda em UTC; o grupo, não.
- **Conta de calendário e instante são coisas diferentes.** As contas de
  mês/semana usam datas ingênuas (só ano/mês/dia importam) e só as bordas da
  consulta viram instante UTC, via `periodoEntre`. Chamar `toISOString()` numa
  data ingênua é o erro clássico.
- **Coluna `date` não tem fuso.** `action_items.prazo` é `date`; passá-lo por
  `formatarData` mostra o dia anterior. Use `formatarDataSimples`.
- Os testes rodam com `TZ=UTC` justamente para esses erros aparecerem aqui, e
  não só em produção.

### Supabase

- **Embed ambíguo:** quando duas colunas apontam para a mesma tabela, o embed
  precisa nomear a FK (`poll_options!poll_options_poll_id_fkey(...)`). Sem
  isso o erro é silencioso.
- **Sempre cheque `error`** e lance. Query que ignora o erro devolve lista
  vazia e parece "sem dados".
- **Estado compartilhado precisa de trava otimista.** Confirmar enquete ou
  aprovar ata usa update condicional (`.eq("status", "aberta")`) e confere se
  voltou linha; a checagem no cliente não basta.
- **Toda server action devolve erro** para o componente tratar.
- **`criar*` devolve o registro real** (`.select().single()`); nunca invente
  um id com `crypto.randomUUID()` para UI otimista.
- **As mutações do modo reunião são idempotentes** — id gerado no cliente e
  `upsert` com `onConflict`. É isso que permite a fila offline repetir uma
  mutação sem duplicar nada.

### Interface

- **`cn()` usa `tailwind-merge`.** Com clsx puro, a classe de quem chama
  perde para a do componente base (`w-auto` perdia para o `w-full` do
  `Select`).
- **Nada de `window.location.origin` no corpo de um componente** que já
  renderiza com dados do servidor — dá mismatch de hidratação. Para link
  absoluto, calcule a origem no servidor (`src/lib/origin.ts`).
- **Nada de `text-white` sobre cor vinda do banco.** A cor do tipo de encontro
  é editável; use `textoSobre()` (`src/lib/cor.ts`), que escolhe o texto por
  contraste.
- **Documento com seção que some não pode ter número fixo no título** — o PDF
  da ata omite "Decisões" quando não há nenhuma, e a numeração pulava.
- **Plural:** `1 presente` / `2 presentes`.

## Acessibilidade

- Todo controle tem nome acessível; botão só com ícone traz `aria-label`.
- Contraste conferido nos dois temas: texto e ícones ≥ 4,5:1, bordas de campo
  ≥ 3:1. A etiqueta colorida do calendário calcula o texto por contraste, o
  que garante 4,5:1 para qualquer cor que a coordenação escolher.
- Foco visível global, skip-link, `aria-current` na navegação, foco preso e
  Esc no painel "Mais", `aria-live` no status de sincronização, e
  `prefers-reduced-motion` respeitado.

## PWA e offline

- Instalável pela tela de início (manifesto em `src/app/manifest.ts`).
- O modo reunião grava tudo em IndexedDB e enfileira as mutações
  (`src/lib/offline/`), então dá para registrar uma reunião inteira em modo
  avião — desde que a tela já esteja aberta. Cada mutação tem limite de
  tempo e é repetida depois; repetir não duplica nada porque todas são
  idempotentes.
- Um aviso no topo da tela mostra quando o navegador reporta falta de
  conexão.
- **Recarregar a página sem internet ainda falha**, porque não há service
  worker cacheando a casca do app.
- `experimental.useOffline` (Next 16) está **desligado de propósito**. Ele
  faz uma server action que falha por rede ficar pendente em vez de
  rejeitar; como cada formulário daqui trata a rejeição mostrando "não foi
  possível salvar", ligá-lo faria esses formulários girarem sem dizer nada.
  Se for reavaliado, os formulários precisam ganhar estado de espera antes.

## Fases

- [x] **Fase 1 — Base**: autenticação (link mágico + Google), perfis,
      convites, membros, configurações, design system, navegação.
- [x] **Fase 2 — Enquetes e agenda**
- [x] **Fase 3 — Atas e PDF**
- [x] **Fase 4 — Planejamento e acompanhamento**
- [x] **Fase 5 — Acabamento**: PWA, tema escuro, acessibilidade, testes,
      README, deploy.
