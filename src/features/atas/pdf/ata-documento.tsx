import { Document, Page, View, Text, StyleSheet, Image } from "@react-pdf/renderer";
import type { AtaCompleta } from "../types";
import { formatarData, formatarDataSimples, formatarHora } from "@/lib/dates";
import { tituloDaAta } from "../titulo";

const s = StyleSheet.create({
  page: { padding: "2.5cm", fontFamily: "Times-Roman", fontSize: 10.5, color: "#1E2A2F" },
  cabecalho: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottom: "1pt solid #E2DDD1",
    paddingBottom: 10,
    marginBottom: 14,
  },
  logo: { height: 32, maxWidth: 90, objectFit: "contain" },
  programa: { fontFamily: "Helvetica-Bold", fontSize: 11 },
  grupo: { fontFamily: "Helvetica", fontSize: 9, color: "#5B6468" },
  titulo: { fontFamily: "Helvetica-Bold", fontSize: 15, marginBottom: 10 },
  secao: { marginTop: 14 },
  secaoTitulo: {
    fontFamily: "Helvetica-Bold",
    fontSize: 10.5,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 6,
    color: "#2F6B4F",
  },
  paragrafo: { marginBottom: 6, lineHeight: 1.4 },
  linhaMeta: { flexDirection: "row", gap: 16, marginBottom: 4, fontFamily: "Helvetica", fontSize: 9.5 },
  tabela: { borderTop: "0.5pt solid #E2DDD1", borderLeft: "0.5pt solid #E2DDD1" },
  linhaTabela: { flexDirection: "row" },
  celulaCab: {
    flex: 1,
    padding: 5,
    fontFamily: "Helvetica-Bold",
    fontSize: 9,
    backgroundColor: "#F6F3EC",
    borderRight: "0.5pt solid #E2DDD1",
    borderBottom: "0.5pt solid #E2DDD1",
  },
  celula: {
    flex: 1,
    padding: 5,
    fontSize: 9.5,
    borderRight: "0.5pt solid #E2DDD1",
    borderBottom: "0.5pt solid #E2DDD1",
  },
  bullet: { flexDirection: "row", marginBottom: 3 },
  rodape: {
    position: "absolute",
    bottom: 20,
    left: "2.5cm",
    right: "2.5cm",
    flexDirection: "row",
    justifyContent: "space-between",
    fontSize: 8,
    color: "#5B6468",
    fontFamily: "Helvetica",
  },
});

export interface DadosProgramaPdf {
  nomePrograma: string;
  nomeGrupo: string;
  logoPetUrl?: string | null;
  logoInstituicaoUrl?: string | null;
  colunaAssinatura: boolean;
}

const STATUS_PRESENCA: Record<string, string> = {
  presente: "Presente",
  ausente: "Ausente",
  justificado: "Justificado",
};

const STATUS_ENCAMINHAMENTO: Record<string, string> = {
  pendente: "Pendente",
  em_andamento: "Em andamento",
  concluido: "Concluído",
};

export function AtaDocumento({
  ata,
  programa,
  fusoHorario,
  geradoEmISO,
}: {
  ata: AtaCompleta;
  programa: DadosProgramaPdf;
  fusoHorario: string;
  geradoEmISO: string;
}) {
  const tituloReuniao = ata.meeting.titulo || ata.meeting.meeting_types?.nome || "Reunião";
  const decisoes = ata.notes.filter((n) => n.tipo === "decisao");
  const local =
    ata.meeting.modalidade === "presencial"
      ? ata.meeting.locations?.nome ?? "Local a definir"
      : "Online";

  // Seções opcionais (decisões, encaminhamentos) só entram quando têm
  // conteúdo — a numeração é calculada pra não pular número.
  const temDecisoes = decisoes.length > 0;
  const temEncaminhamentos = ata.actionItems.length > 0;
  const nDecisoes = 4;
  const nEncaminhamentos = temDecisoes ? 5 : 4;

  return (
    <Document>
      <Page size="A4" style={s.page}>
        <View style={s.cabecalho} fixed>
          <View>
            <Text style={s.programa}>{programa.nomePrograma}</Text>
            <Text style={s.grupo}>{programa.nomeGrupo}</Text>
          </View>
          <View style={{ flexDirection: "row", gap: 8 }}>
            {/* eslint-disable-next-line jsx-a11y/alt-text -- Image aqui é o componente do @react-pdf/renderer, não <img> */}
            {programa.logoPetUrl && <Image src={programa.logoPetUrl} style={s.logo} />}
            {/* eslint-disable-next-line jsx-a11y/alt-text -- idem */}
            {programa.logoInstituicaoUrl && <Image src={programa.logoInstituicaoUrl} style={s.logo} />}
          </View>
        </View>

        <Text style={s.titulo}>
          {tituloDaAta(ata.meeting.meeting_types?.nome)} · {formatarData(ata.meeting.inicio, fusoHorario)}
        </Text>
        <Text style={{ fontFamily: "Helvetica", fontSize: 10, color: "#5B6468", marginTop: -6, marginBottom: 10 }}>
          {tituloReuniao}
        </Text>

        <View style={s.linhaMeta}>
          <Text>Data: {formatarData(ata.meeting.inicio, fusoHorario)}</Text>
          <Text>
            Horário:{" "}
            {ata.meeting.inicio_real ? formatarHora(ata.meeting.inicio_real, fusoHorario) : "—"} às{" "}
            {ata.meeting.fim_real ? formatarHora(ata.meeting.fim_real, fusoHorario) : "—"}
          </Text>
          <Text>Local: {local}</Text>
        </View>

        <View style={s.secao}>
          <Text style={s.secaoTitulo}>1. Presença</Text>
          <View style={s.tabela}>
            <View style={s.linhaTabela}>
              <Text style={s.celulaCab}>Nome</Text>
              <Text style={s.celulaCab}>Presença</Text>
              {programa.colunaAssinatura && <Text style={s.celulaCab}>Assinatura</Text>}
            </View>
            {ata.attendance.map((a) => (
              <View style={s.linhaTabela} key={a.id}>
                <Text style={s.celula}>
                  {a.profiles?.nome_completo ?? `${a.visitante_nome} (visitante${a.visitante_instituicao ? ` — ${a.visitante_instituicao}` : ""})`}
                </Text>
                <Text style={s.celula}>{STATUS_PRESENCA[a.status]}</Text>
                {programa.colunaAssinatura && <Text style={s.celula}> </Text>}
              </View>
            ))}
          </View>
        </View>

        <View style={s.secao}>
          <Text style={s.secaoTitulo}>2. Pauta</Text>
          {ata.agendaItems
            .filter((i) => i.aceito)
            .map((i) => (
              <View style={s.bullet} key={i.id}>
                <Text>• {i.titulo}</Text>
              </View>
            ))}
        </View>

        <View style={s.secao}>
          <Text style={s.secaoTitulo}>3. Relato</Text>
          {ata.agendaItems
            .filter((i) => i.aceito)
            .map((i) => (
              <View key={i.id} style={{ marginBottom: 8 }}>
                <Text style={{ fontFamily: "Helvetica-Bold", fontSize: 10, marginBottom: 2 }}>
                  {i.titulo}
                </Text>
                <Text style={s.paragrafo}>{ata.minute.relato[i.id] || "—"}</Text>
              </View>
            ))}
          {ata.minute.relato["geral"] && (
            <View>
              <Text style={{ fontFamily: "Helvetica-Bold", fontSize: 10, marginBottom: 2 }}>Geral</Text>
              <Text style={s.paragrafo}>{ata.minute.relato["geral"]}</Text>
            </View>
          )}
        </View>

        {temDecisoes && (
          <View style={s.secao}>
            <Text style={s.secaoTitulo}>{nDecisoes}. Decisões</Text>
            {decisoes.map((d) => (
              <View style={s.bullet} key={d.id}>
                <Text>• {d.texto}</Text>
              </View>
            ))}
          </View>
        )}

        {temEncaminhamentos && (
          <View style={s.secao}>
            <Text style={s.secaoTitulo}>{nEncaminhamentos}. Encaminhamentos</Text>
            <View style={s.tabela}>
              <View style={s.linhaTabela}>
                <Text style={[s.celulaCab, { flex: 2 }]}>O quê</Text>
                <Text style={s.celulaCab}>Responsável</Text>
                <Text style={s.celulaCab}>Prazo</Text>
                <Text style={s.celulaCab}>Status</Text>
              </View>
              {ata.actionItems.map((e) => (
                <View style={s.linhaTabela} key={e.id}>
                  <Text style={[s.celula, { flex: 2 }]}>{e.descricao}</Text>
                  <Text style={s.celula}>{e.profiles?.nome_exibicao ?? "—"}</Text>
                  <Text style={s.celula}>{e.prazo ? formatarDataSimples(e.prazo) : "—"}</Text>
                  <Text style={s.celula}>{STATUS_ENCAMINHAMENTO[e.status]}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        <View style={s.rodape} fixed>
          <Text render={({ pageNumber, totalPages }) => `Página ${pageNumber} de ${totalPages}`} />
          <Text>{`Gerado em ${formatarData(geradoEmISO, fusoHorario)}`}</Text>
        </View>
      </Page>
    </Document>
  );
}
