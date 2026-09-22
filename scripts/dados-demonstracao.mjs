#!/usr/bin/env node
/**
 * Dados de demonstração — para apresentar o sistema com as telas cheias
 * antes de o grupo começar a usar de verdade.
 *
 *   node scripts/dados-demonstracao.mjs criar
 *   node scripts/dados-demonstracao.mjs limpar
 *
 * Nada aqui entra no aplicativo: é um script operacional, roda contra o
 * banco com a service role key do `.env.local` e pode ser desfeito inteiro.
 *
 * Como o `limpar` sabe o que apagar: toda pessoa de demonstração tem e-mail
 * em `@demonstracao.invalid` — `.invalid` é reservado por norma (RFC 2606),
 * então nunca vai colidir com o e-mail de alguém de verdade. Reuniões,
 * atas, enquetes e tudo que pendura nelas são apagados por terem sido
 * criados por essas pessoas ou por estarem ligados a elas. O perfil real da
 * coordenação, os tipos de encontro e as configurações ficam.
 *
 * O `criar` limpa antes de criar, então pode ser repetido à vontade.
 */

import { readFileSync } from "node:fs";
import { randomUUID } from "node:crypto";

const DOMINIO_DEMO = "demonstracao.invalid";
const FUSO_PADRAO = "America/Fortaleza";

// ---------------------------------------------------------------------------
// Acesso ao banco
// ---------------------------------------------------------------------------

function lerEnvLocal() {
  let bruto;
  try {
    bruto = readFileSync(new URL("../.env.local", import.meta.url), "utf8");
  } catch {
    encerrar("Não achei o .env.local na raiz do projeto.");
  }
  const env = {};
  for (const linha of bruto.split(/\r?\n/)) {
    if (!linha.trim() || linha.trim().startsWith("#")) continue;
    const i = linha.indexOf("=");
    if (i === -1) continue;
    env[linha.slice(0, i).trim()] = linha.slice(i + 1).trim();
  }
  for (const chave of ["NEXT_PUBLIC_SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"]) {
    if (!env[chave]) encerrar(`Falta ${chave} no .env.local.`);
  }
  return env;
}

const env = lerEnvLocal();
const BASE = `${env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1`;
const CABECALHO = {
  apikey: env.SUPABASE_SERVICE_ROLE_KEY,
  Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
  "Content-Type": "application/json",
};

function encerrar(mensagem) {
  console.error(`\n✗ ${mensagem}\n`);
  process.exit(1);
}

async function pedir(caminho, opcoes = {}) {
  const resposta = await fetch(`${BASE}/${caminho}`, {
    ...opcoes,
    headers: { ...CABECALHO, ...opcoes.headers },
  });
  if (!resposta.ok) {
    encerrar(`${opcoes.method ?? "GET"} ${caminho}\n  ${resposta.status} ${await resposta.text()}`);
  }
  const texto = await resposta.text();
  return texto ? JSON.parse(texto) : null;
}

const selecionar = (tabela, consulta) => pedir(`${tabela}?${consulta}`);

/**
 * Insert em lote. O PostgREST recusa o lote se as linhas não tiverem
 * exatamente as mesmas chaves ("All object keys must match"), então aqui as
 * chaves são uniformizadas — quem não tem a chave recebe `null`, que é o
 * que a coluna teria de qualquer jeito.
 */
function inserir(tabela, linhas) {
  const chaves = [...new Set(linhas.flatMap(Object.keys))];
  const uniformes = linhas.map((linha) =>
    Object.fromEntries(chaves.map((c) => [c, linha[c] ?? null])),
  );
  return pedir(tabela, {
    method: "POST",
    headers: { Prefer: "return=representation" },
    body: JSON.stringify(uniformes),
  });
}

const apagar = (tabela, filtro) => pedir(`${tabela}?${filtro}`, { method: "DELETE" });

const atualizar = (tabela, filtro, dados) =>
  pedir(`${tabela}?${filtro}`, { method: "PATCH", body: JSON.stringify(dados) });

// ---------------------------------------------------------------------------
// Datas — sempre no fuso do grupo, como o resto do sistema
// ---------------------------------------------------------------------------

/** Deslocamento do fuso do grupo, em minutos, naquele instante. */
function deslocamentoMinutos(data, fuso) {
  const f = new Intl.DateTimeFormat("en-US", {
    timeZone: fuso,
    hour12: false,
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", second: "2-digit",
  });
  const p = Object.fromEntries(f.formatToParts(data).map((x) => [x.type, x.value]));
  const comoUtc = Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour % 24, +p.minute, +p.second);
  return (comoUtc - Math.floor(data.getTime() / 1000) * 1000) / 60_000;
}

/** "2026-09-28" + "16:00" no fuso do grupo → instante ISO em UTC. */
function instante(dataISO, horaMinuto, fuso) {
  const [ano, mes, dia] = dataISO.split("-").map(Number);
  const [hora, minuto] = horaMinuto.split(":").map(Number);
  const palpite = Date.UTC(ano, mes - 1, dia, hora, minuto);
  const desloc = deslocamentoMinutos(new Date(palpite), fuso);
  return new Date(palpite - desloc * 60_000).toISOString();
}

const maisMinutos = (iso, minutos) =>
  new Date(new Date(iso).getTime() + minutos * 60_000).toISOString();

/** Data de calendário a N dias de hoje, no fuso do grupo (yyyy-MM-dd). */
function diaRelativo(dias, fuso) {
  const d = new Date(Date.now() + dias * 86_400_000);
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: fuso, year: "numeric", month: "2-digit", day: "2-digit",
  }).format(d);
}

const diaDaSemanaDe = (iso) => {
  const [a, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(a, m - 1, d)).getUTCDay();
};

/** Dia da semana pedido (1 = segunda), avançando a partir de `diasBase`. */
function diaFuturoDaSemana(diasBase, diaSemana, fuso) {
  for (let i = 0; i < 14; i++) {
    const iso = diaRelativo(diasBase + i, fuso);
    if (diaDaSemanaDe(iso) === diaSemana) return iso;
  }
  return diaRelativo(diasBase, fuso);
}

/**
 * Dia da semana pedido, no passado e **dentro do mês corrente** — senão a
 * reunião cai fora do recorte mensal e as telas de frequência e formação
 * ficam contando menos encontros do que a agenda mostra. Perto do começo do
 * mês pode não haver dia que sirva; aí vale o passado mesmo, fora do mês.
 */
function diaPassadoDaSemana(diasIdeal, diaSemana, fuso) {
  const mesCorrente = diaRelativo(0, fuso).slice(0, 7);
  let melhor = null;
  for (let atras = 2; atras <= 27; atras++) {
    const iso = diaRelativo(-atras, fuso);
    if (diaDaSemanaDe(iso) !== diaSemana) continue;
    const noMes = iso.startsWith(mesCorrente);
    const distancia = Math.abs(atras - Math.abs(diasIdeal));
    if (!melhor || (noMes && !melhor.noMes) || (noMes === melhor.noMes && distancia < melhor.distancia)) {
      melhor = { iso, noMes, distancia };
    }
  }
  return melhor?.iso ?? diaRelativo(diasIdeal, fuso);
}

// ---------------------------------------------------------------------------
// Limpar
// ---------------------------------------------------------------------------

async function limpar({ silencioso = false } = {}) {
  const fala = (m) => !silencioso && console.log(m);

  const pessoas = await selecionar(
    "profiles",
    `select=id,nome_exibicao&email=like.*@${DOMINIO_DEMO}`,
  );
  const idsPessoas = pessoas.map((p) => p.id);

  // Reuniões a apagar: as criadas por pessoas de demonstração, mais as que
  // sobraram dos testes das fases anteriores (a coordenação ainda não usou o
  // sistema de verdade, então tudo que existe é material de teste).
  const reunioes = await selecionar("meetings", "select=id,titulo");
  const idsReunioes = reunioes.map((r) => r.id);

  if (idsReunioes.length > 0) {
    const lista = `(${idsReunioes.join(",")})`;
    // As tabelas filhas têm `on delete cascade` a partir de meetings e
    // minutes; o que não cascateia é o que aponta para meetings por fora.
    await atualizar("minutes", `meeting_id=in.${lista}`, { proxima_reuniao_id: null });
    await atualizar("polls", `meeting_id=in.${lista}`, { meeting_id: null, confirmed_option_id: null });
    await apagar("meetings", `id=in.${lista}`);
    fala(`  ${idsReunioes.length} reunião(ões) e tudo que pendurava nelas`);
  }

  const enquetes = await selecionar("polls", "select=id");
  if (enquetes.length > 0) {
    await apagar("polls", `id=in.(${enquetes.map((e) => e.id).join(",")})`);
    fala(`  ${enquetes.length} enquete(s)`);
  }

  if (idsPessoas.length > 0) {
    await apagar("profiles", `id=in.(${idsPessoas.join(",")})`);
    fala(`  ${idsPessoas.length} pessoa(s) de demonstração`);
  }

  for (const [tabela, rotulo] of [["gats", "GAT(s)"], ["locations", "local(is)"]]) {
    const linhas = await selecionar(tabela, "select=id");
    if (linhas.length > 0) {
      await apagar(tabela, `id=in.(${linhas.map((l) => l.id).join(",")})`);
      fala(`  ${linhas.length} ${rotulo}`);
    }
  }

  // O logo de teste subiu para um bucket público durante a Fase 3.
  const programa = await selecionar("settings", "select=value&key=eq.programa");
  const valor = programa[0]?.value ?? {};
  if (typeof valor.logo_pet_url === "string" && valor.logo_pet_url.includes("logo-teste")) {
    await atualizar("settings", "key=eq.programa", {
      value: { ...valor, logo_pet_url: null },
    });
    fala("  logo de teste removido das configurações");
  }
}

// ---------------------------------------------------------------------------
// Criar
// ---------------------------------------------------------------------------

/**
 * As pessoas são fictícias de propósito: o domínio `.invalid` não existe, e
 * é ele que marca a linha como descartável. Entram com `status: "ativo"` e
 * sem `auth_user_id` — o mesmo estado de quem a coordenação cadastra
 * diretamente e ainda não fez o primeiro login.
 */
const PESSOAS = [
  { nome: "Helena Vasconcelos", exibicao: "Helena", papel: "relator", gat: 0 },
  { nome: "Rafael Nogueira", exibicao: "Rafael", papel: "participante", gat: 0 },
  { nome: "Bianca Teixeira", exibicao: "Bianca", papel: "participante", gat: 0 },
  { nome: "Caio Menezes", exibicao: "Caio", papel: "participante", gat: 1 },
  { nome: "Larissa Andrade", exibicao: "Larissa", papel: "participante", gat: 1 },
];

async function criar() {
  const [programa] = await selecionar("settings", "select=value&key=eq.programa");
  const fuso = programa?.value?.fuso_horario ?? FUSO_PADRAO;

  const tipos = Object.fromEntries(
    (await selecionar("meeting_types", "select=id,nome")).map((t) => [t.nome, t.id]),
  );
  for (const nome of ["Área", "GAT", "Estudos", "Atividade externa", "Formação bimestral"]) {
    if (!tipos[nome]) encerrar(`Falta o tipo de encontro "${nome}". Aplique as migrações.`);
  }

  const coordenacao = (
    await selecionar("profiles", "select=id,nome_exibicao&role=eq.coordenacao&order=created_at")
  ).find((p) => !p.email?.endsWith(DOMINIO_DEMO));
  if (!coordenacao) {
    encerrar("Não achei um perfil de coordenação. Cadastre o seu antes de rodar isto.");
  }

  console.log("\nLimpando o que já havia:");
  await limpar();

  // --- GATs e locais ------------------------------------------------------
  const gats = await inserir("gats", [
    { nome: "GAT 1 — Vigilância em saúde ambiental" },
    { nome: "GAT 2 — Educação e comunicação em saúde" },
  ]);
  const locais = await inserir("locations", [
    { nome: "Sala 12 — Saúde Coletiva", endereco: "Bloco de Saúde Coletiva, 1º andar" },
    { nome: "Auditório", endereco: "Prédio central" },
  ]);
  console.log(`\n✓ ${gats.length} GATs e ${locais.length} locais`);

  // --- Pessoas ------------------------------------------------------------
  const pessoas = await inserir(
    "profiles",
    PESSOAS.map((p) => ({
      nome_completo: p.nome,
      nome_exibicao: p.exibicao,
      email: `${p.exibicao.toLowerCase()}@${DOMINIO_DEMO}`,
      role: p.papel,
      status: "ativo",
      gat_id: gats[p.gat].id,
    })),
  );
  const [helena, rafael, bianca, caio, larissa] = pessoas;
  const todos = [coordenacao, ...pessoas];
  console.log(`✓ ${pessoas.length} pessoas de demonstração (@${DOMINIO_DEMO})`);

  // --- Reuniões -----------------------------------------------------------
  // Duas já realizadas (dão frequência, ata e encaminhamentos) e três à
  // frente (dão agenda e planejamento com o que comparar à meta).
  const diaPlanejamento = diaPassadoDaSemana(16, 1, fuso); // segunda passada
  const diaGat = diaPassadoDaSemana(9, 3, fuso); // quarta passada
  const diaFormacao = diaPassadoDaSemana(4, 5, fuso); // sexta passada
  const diaEstudos = diaFuturoDaSemana(3, 1, fuso); // próxima segunda
  const diaVisita = diaFuturoDaSemana(8, 3, fuso); // quarta seguinte

  async function novaReuniao({ tipo, titulo, dia, hora, minutos, modalidade, local, realizada }) {
    const inicio = instante(dia, hora, fuso);
    const [reuniao] = await inserir("meetings", [
      {
        meeting_type_id: tipos[tipo],
        titulo,
        inicio,
        fim_previsto: maisMinutos(inicio, minutos),
        inicio_real: realizada ? inicio : null,
        fim_real: realizada ? maisMinutos(inicio, minutos) : null,
        modalidade,
        location_id: modalidade === "presencial" ? (local ?? locais[0].id) : null,
        link_online: modalidade === "online" ? "https://meet.google.com/exemplo-demo" : null,
        status: realizada ? "realizada" : "agendada",
        created_by: coordenacao.id,
      },
    ]);
    return reuniao;
  }

  const rPlanejamento = await novaReuniao({
    tipo: "Área", titulo: "Planejamento das ações do semestre",
    dia: diaPlanejamento, hora: "16:00", minutos: 120,
    modalidade: "presencial", local: locais[0].id, realizada: true,
  });
  const rGat = await novaReuniao({
    tipo: "GAT", titulo: "GAT 1 — Mapeamento de vulnerabilidade climática",
    dia: diaGat, hora: "16:00", minutos: 120,
    modalidade: "online", realizada: true,
  });
  const rFormacao = await novaReuniao({
    tipo: "Formação bimestral", titulo: "Formação: clima e determinantes sociais da saúde",
    dia: diaFormacao, hora: "14:00", minutos: 180,
    modalidade: "presencial", local: locais[1].id, realizada: true,
  });
  const rEstudos = await novaReuniao({
    tipo: "Estudos", titulo: "Roda de estudos: emergências climáticas na atenção primária",
    dia: diaEstudos, hora: "16:00", minutos: 120,
    modalidade: "online", realizada: false,
  });
  const rVisita = await novaReuniao({
    tipo: "Atividade externa", titulo: "Visita técnica à Unidade Básica de Saúde",
    dia: diaVisita, hora: "09:00", minutos: 180,
    modalidade: "presencial", local: locais[1].id, realizada: false,
  });
  console.log("✓ 5 reuniões (3 realizadas, 2 à frente)");

  // --- Formação bimestral -------------------------------------------------
  await inserir("formacoes", [
    {
      meeting_id: rFormacao.id,
      tema: "Clima e determinantes sociais da saúde",
      carga_horaria_minutos: 240,
      created_by: coordenacao.id,
    },
  ]);
  console.log("✓ formação bimestral com 4h certificadas");

  // --- Presenças ----------------------------------------------------------
  // Variadas de propósito: a frequência só é convincente se mostrar
  // presença, falta e falta justificada lado a lado.
  const presencas = {
    [rPlanejamento.id]: { [coordenacao.id]: "presente", [helena.id]: "presente", [rafael.id]: "presente", [bianca.id]: "presente", [caio.id]: "justificado", [larissa.id]: "presente" },
    [rGat.id]: { [coordenacao.id]: "presente", [helena.id]: "presente", [rafael.id]: "presente", [bianca.id]: "ausente", [caio.id]: "presente", [larissa.id]: "presente" },
    [rFormacao.id]: { [coordenacao.id]: "presente", [helena.id]: "presente", [rafael.id]: "justificado", [bianca.id]: "presente", [caio.id]: "presente", [larissa.id]: "presente" },
  };
  await inserir(
    "attendance",
    Object.entries(presencas).flatMap(([meetingId, porPessoa]) =>
      Object.entries(porPessoa).map(([profileId, status]) => ({
        meeting_id: meetingId, profile_id: profileId, status,
      })),
    ),
  );
  console.log("✓ presenças das 3 reuniões realizadas");

  // --- Ata aprovada: reunião de planejamento ------------------------------
  const topicosPlanejamento = await inserir("agenda_items", [
    { meeting_id: rPlanejamento.id, titulo: "Calendário do semestre", ordem: 0, aceito: true },
    { meeting_id: rPlanejamento.id, titulo: "Divisão dos GATs por território", ordem: 1, aceito: true, sugerido_por: helena.id },
    { meeting_id: rPlanejamento.id, titulo: "Formação bimestral: tema e convidada", ordem: 2, aceito: true },
  ]);

  const [ataPlanejamento] = await inserir("minutes", [
    {
      meeting_id: rPlanejamento.id,
      status: "aprovada",
      reporter_id: helena.id,
      aprovada_por: coordenacao.id,
      aprovada_em: instante(diaPlanejamento, "19:00", fuso),
      proxima_reuniao_id: rEstudos.id,
      relato: {
        [topicosPlanejamento[0].id]:
          "O grupo revisou o calendário até dezembro e manteve a segunda-feira às 16h como encontro fixo de área, deixando a quarta para os GATs. Ficou acertado que a semana com formação bimestral não tem encontro de área, para não sobrecarregar.",
        [topicosPlanejamento[1].id]:
          "Os dois GATs foram redistribuídos por território: o GAT 1 assume a vigilância em saúde ambiental nos bairros ribeirinhos e o GAT 2 fica com educação e comunicação nas unidades básicas. Cada GAT leva um panorama do território no próximo encontro de área.",
        [topicosPlanejamento[2].id]:
          "A formação do bimestre será sobre clima e determinantes sociais da saúde, com 4 horas certificadas. Helena ficou de convidar a professora responsável.",
        geral:
          "Encontro tranquilo, com boa participação. Caio justificou a ausência por conflito com o estágio.",
      },
    },
  ]);

  const encaminhamentos = await inserir("action_items", [
    { minutes_id: ataPlanejamento.id, descricao: "Convidar a professora para a formação bimestral", responsavel_id: helena.id, prazo: diaRelativo(-10, fuso), status: "concluido" },
    { minutes_id: ataPlanejamento.id, descricao: "Levantar o panorama do território do GAT 1", responsavel_id: rafael.id, prazo: diaRelativo(5, fuso), status: "em_andamento" },
    { minutes_id: ataPlanejamento.id, descricao: "Publicar o calendário do semestre no grupo", responsavel_id: coordenacao.id, prazo: diaRelativo(2, fuso), status: "pendente" },
  ]);

  await inserir("minute_notes", [
    { minutes_id: ataPlanejamento.id, agenda_item_id: topicosPlanejamento[0].id, autor_id: helena.id, tipo: "decisao", texto: "Segunda 16h fica como encontro fixo de área; quarta 16h fica para os GATs.", hora: instante(diaPlanejamento, "16:12", fuso) },
    { minutes_id: ataPlanejamento.id, agenda_item_id: topicosPlanejamento[0].id, autor_id: helena.id, tipo: "nota", texto: "Semana com formação bimestral não terá encontro de área.", hora: instante(diaPlanejamento, "16:20", fuso) },
    { minutes_id: ataPlanejamento.id, agenda_item_id: topicosPlanejamento[1].id, autor_id: helena.id, tipo: "decisao", texto: "GAT 1 assume os bairros ribeirinhos; GAT 2 fica com as unidades básicas.", hora: instante(diaPlanejamento, "16:48", fuso) },
    { minutes_id: ataPlanejamento.id, agenda_item_id: topicosPlanejamento[1].id, autor_id: helena.id, tipo: "encaminhamento", texto: "Levantar o panorama do território do GAT 1", action_item_id: encaminhamentos[1].id, hora: instante(diaPlanejamento, "16:55", fuso) },
    { minutes_id: ataPlanejamento.id, agenda_item_id: topicosPlanejamento[2].id, autor_id: helena.id, tipo: "encaminhamento", texto: "Convidar a professora para a formação bimestral", action_item_id: encaminhamentos[0].id, hora: instante(diaPlanejamento, "17:30", fuso) },
    { minutes_id: ataPlanejamento.id, agenda_item_id: topicosPlanejamento[2].id, autor_id: rafael.id, tipo: "duvida", texto: "A carga da formação conta como hora do PET?", hora: instante(diaPlanejamento, "17:35", fuso) },
    { minutes_id: ataPlanejamento.id, agenda_item_id: null, autor_id: coordenacao.id, tipo: "encaminhamento", texto: "Publicar o calendário do semestre no grupo", action_item_id: encaminhamentos[2].id, hora: instante(diaPlanejamento, "17:50", fuso) },
  ]);
  console.log("✓ ata aprovada com relato, 3 decisões/dúvidas e 3 encaminhamentos");

  // --- Ata em revisão: GAT ------------------------------------------------
  // Deixa a tela de revisão com algo real para mostrar: é o único status em
  // que os comentários aparecem.
  const topicosGat = await inserir("agenda_items", [
    { meeting_id: rGat.id, titulo: "Retomada dos encaminhamentos", ordem: 0, aceito: true },
    { meeting_id: rGat.id, titulo: "Critérios do mapeamento de vulnerabilidade", ordem: 1, aceito: true },
    { meeting_id: rGat.id, titulo: "Próximos passos em campo", ordem: 2, aceito: true, sugerido_por: caio.id },
  ]);

  const [ataGat] = await inserir("minutes", [
    {
      meeting_id: rGat.id,
      status: "em_revisao",
      reporter_id: helena.id,
      relato: {
        [topicosGat[1].id]:
          "O grupo definiu três critérios para o mapeamento: proximidade de áreas alagáveis, cobertura de saneamento e presença de população idosa. A base será o cadastro das unidades básicas, cruzado com o mapa de alagamento da defesa civil.",
      },
    },
  ]);

  await inserir("minute_notes", [
    { minutes_id: ataGat.id, agenda_item_id: topicosGat[0].id, autor_id: helena.id, tipo: "nota", texto: "O convite para a formação já foi feito e aceito.", hora: instante(diaGat, "16:08", fuso) },
    { minutes_id: ataGat.id, agenda_item_id: topicosGat[1].id, autor_id: helena.id, tipo: "decisao", texto: "Critérios: áreas alagáveis, cobertura de saneamento e população idosa.", hora: instante(diaGat, "16:40", fuso) },
    { minutes_id: ataGat.id, agenda_item_id: topicosGat[2].id, autor_id: caio.id, tipo: "nota", texto: "A ida a campo depende da autorização da coordenação da unidade.", hora: instante(diaGat, "17:25", fuso) },
  ]);

  await inserir("minute_comments", [
    { minutes_id: ataGat.id, profile_id: coordenacao.id, texto: "Vale registrar quem ficou de pedir a autorização na unidade." },
    { minutes_id: ataGat.id, profile_id: bianca.id, texto: "Não participei, mas topo ajudar no levantamento de campo." },
  ]);
  console.log("✓ ata em revisão, com comentários");

  // --- Pauta da próxima reunião -------------------------------------------
  await inserir("agenda_items", [
    { meeting_id: rEstudos.id, titulo: "Escolha do texto do mês", ordem: 0, aceito: true },
    { meeting_id: rEstudos.id, titulo: "Relato do campo do GAT 1", ordem: 1, aceito: true, sugerido_por: rafael.id },
    { meeting_id: rEstudos.id, titulo: "Convidar o pessoal da enfermagem", ordem: 2, aceito: false, sugerido_por: larissa.id },
  ]);
  console.log("✓ pauta da próxima reunião (com 1 tópico ainda sugerido)");

  // --- Enquete aberta -----------------------------------------------------
  // A tela de enquetes é a porta de entrada do fluxo; vazia, não mostra nada.
  const diaOpcaoA = diaFuturoDaSemana(15, 1, fuso);
  const diaOpcaoB = diaFuturoDaSemana(15, 3, fuso);
  const diaOpcaoC = diaFuturoDaSemana(15, 5, fuso);

  const [enquete] = await inserir("polls", [
    {
      code: randomUUID().slice(0, 8),
      titulo: "Dia do próximo encontro de área",
      descricao: "Precisamos fechar o encontro de outubro. Marquem tudo que der.",
      meeting_type_id: tipos["Área"],
      duracao_minutos: 120,
      prazo_votacao: instante(diaRelativo(4, fuso), "18:00", fuso),
      publico_alvo: "todos",
      votos_visiveis: true,
      status: "aberta",
      created_by: coordenacao.id,
    },
  ]);

  const opcoes = await inserir("poll_options", [
    { poll_id: enquete.id, inicio: instante(diaOpcaoA, "16:00", fuso), modalidade: "online", link_online: "https://meet.google.com/exemplo-demo" },
    { poll_id: enquete.id, inicio: instante(diaOpcaoB, "16:00", fuso), modalidade: "presencial", location_id: locais[0].id },
    { poll_id: enquete.id, inicio: instante(diaOpcaoC, "10:00", fuso), modalidade: "presencial", location_id: locais[1].id },
  ]);

  // Larissa fica sem votar de propósito: é o que faz a lista de "quem ainda
  // não votou" e a mensagem de lembrete terem o que mostrar.
  await inserir("poll_votes", [
    { option_id: opcoes[0].id, profile_id: coordenacao.id, valor: "pode" },
    { option_id: opcoes[1].id, profile_id: coordenacao.id, valor: "pode" },
    { option_id: opcoes[0].id, profile_id: helena.id, valor: "pode" },
    { option_id: opcoes[2].id, profile_id: helena.id, valor: "se_precisar" },
    { option_id: opcoes[0].id, profile_id: rafael.id, valor: "pode" },
    { option_id: opcoes[1].id, profile_id: rafael.id, valor: "se_precisar" },
    { option_id: opcoes[1].id, profile_id: bianca.id, valor: "pode" },
    { option_id: opcoes[0].id, profile_id: caio.id, valor: "se_precisar" },
    { option_id: opcoes[1].id, profile_id: caio.id, valor: "pode" },
  ]);

  await inserir("poll_comments", [
    { poll_id: enquete.id, profile_id: bianca.id, texto: "Sexta de manhã fica difícil por causa do estágio." },
  ]);
  console.log("✓ enquete aberta com 3 opções, 9 votos e 1 pessoa sem votar");

  console.log(`
Pronto. ${todos.length} pessoas no grupo, 5 reuniões, 2 atas, 3 encaminhamentos
e 1 enquete aberta.

As pessoas de demonstração têm e-mail em @${DOMINIO_DEMO} e aparecem
assim na tela de Membros. Para apagar tudo isto:

  node scripts/dados-demonstracao.mjs limpar
`);
}

// ---------------------------------------------------------------------------

const comando = process.argv[2];
if (comando === "criar") {
  await criar();
} else if (comando === "limpar") {
  console.log("\nApagando:");
  await limpar();
  console.log("\nPronto. Só o perfil da coordenação, os tipos de encontro e as configurações ficaram.\n");
} else {
  console.log(`
Uso:
  node scripts/dados-demonstracao.mjs criar    cria os dados de demonstração
  node scripts/dados-demonstracao.mjs limpar   apaga tudo que o criar criou
`);
  process.exit(1);
}
