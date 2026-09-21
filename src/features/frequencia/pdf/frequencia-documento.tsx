import { Document, Page, View, Text } from "@react-pdf/renderer";
import {
  estilos as s,
  CabecalhoRelatorio,
  RodapeRelatorio,
  ItemResumo,
  type CabecalhoPdf,
} from "@/components/pdf/relatorio";
import { formatarMinutos } from "@/lib/duracao";
import { rotuloMes } from "@/lib/periodos";
import type { RelatorioFrequencia } from "../types";

export function FrequenciaDocumento({
  relatorio,
  programa,
  geradoEmISO,
  fusoHorario,
}: {
  relatorio: RelatorioFrequencia;
  programa: CabecalhoPdf;
  geradoEmISO: string;
  fusoHorario: string;
}) {
  return (
    <Document>
      <Page size="A4" style={s.page}>
        <CabecalhoRelatorio programa={programa} />

        <Text style={s.titulo}>Frequência — {rotuloMes(relatorio.mesISO)}</Text>
        <Text style={s.subtitulo}>
          Presença e carga horária por integrante, apurada nas listas de presença dos
          encontros realizados.
        </Text>

        <View style={s.resumo}>
          <ItemResumo rotulo="Encontros realizados" valor={relatorio.totalEncontros} />
          <ItemResumo rotulo="Integrantes" valor={relatorio.pessoas.length} />
          <ItemResumo
            rotulo="Meta semanal"
            valor={`${relatorio.metaEncontros} encontros · ${relatorio.metaHoras}h`}
          />
        </View>

        <View style={s.tabela}>
          <View style={[s.linha, s.cabecalhoLinha]} fixed>
            <Text style={[s.celulaCab, { flex: 2 }]}>Integrante</Text>
            <Text style={[s.celulaCab, { flex: 0.8 }]}>Presenças</Text>
            <Text style={[s.celulaCab, { flex: 0.9 }]}>Justificadas</Text>
            <Text style={[s.celulaCab, { flex: 0.8 }]}>Faltas</Text>
            <Text style={[s.celulaCab, { flex: 0.8 }]}>Horas</Text>
            <Text style={[s.celulaCab, { flex: 0.6 }]}>%</Text>
          </View>
          {relatorio.pessoas.map((p) => (
            <View style={s.linha} key={p.perfilId} wrap={false}>
              <Text style={[s.celula, { flex: 2 }]}>{p.nomeCompleto}</Text>
              <Text style={[s.celula, { flex: 0.8 }]}>
                {p.presentes} de {relatorio.totalEncontros}
              </Text>
              <Text style={[s.celula, { flex: 0.9 }]}>{p.justificadas}</Text>
              <Text style={[s.celula, { flex: 0.8 }]}>{p.ausentes}</Text>
              <Text style={[s.celula, { flex: 0.8 }]}>{formatarMinutos(p.minutos)}</Text>
              <Text style={[s.celula, { flex: 0.6 }]}>{p.percentual}%</Text>
            </View>
          ))}
        </View>

        <Text style={{ fontSize: 8, color: "#5B6468", marginTop: 10 }}>
          Falta justificada é contabilizada à parte e não soma carga horária.
        </Text>

        <RodapeRelatorio geradoEmISO={geradoEmISO} fusoHorario={fusoHorario} />
      </Page>
    </Document>
  );
}
