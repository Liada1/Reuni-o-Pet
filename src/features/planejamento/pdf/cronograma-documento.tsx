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
import type { LinhaCronograma } from "../types";

export function CronogramaDocumento({
  linhas,
  mesISO,
  programa,
  totalEncontros,
  totalMinutos,
  geradoEmISO,
  fusoHorario,
}: {
  linhas: LinhaCronograma[];
  mesISO: string;
  programa: CabecalhoPdf;
  totalEncontros: number;
  totalMinutos: number;
  geradoEmISO: string;
  fusoHorario: string;
}) {
  return (
    <Document>
      <Page size="A4" style={s.page}>
        <CabecalhoRelatorio programa={programa} />

        <Text style={s.titulo}>Cronograma — {rotuloMes(mesISO)}</Text>
        <Text style={s.subtitulo}>Encontros programados e realizados no mês.</Text>

        <View style={s.resumo}>
          <ItemResumo rotulo="Encontros" valor={totalEncontros} />
          <ItemResumo rotulo="Carga horária" valor={formatarMinutos(totalMinutos)} />
        </View>

        <View style={s.tabela}>
          <View style={[s.linha, s.cabecalhoLinha]} fixed>
            <Text style={[s.celulaCab, { flex: 0.8 }]}>Data</Text>
            <Text style={[s.celulaCab, { flex: 0.6 }]}>Hora</Text>
            <Text style={s.celulaCab}>Tipo</Text>
            <Text style={[s.celulaCab, { flex: 1.6 }]}>Título</Text>
            <Text style={[s.celulaCab, { flex: 1.2 }]}>Local</Text>
            <Text style={[s.celulaCab, { flex: 0.6 }]}>Duração</Text>
          </View>
          {linhas.map((l, i) => (
            <View style={s.linha} key={`${l.data}-${l.hora}-${i}`} wrap={false}>
              <Text style={[s.celula, { flex: 0.8 }]}>{l.data}</Text>
              <Text style={[s.celula, { flex: 0.6 }]}>{l.hora}</Text>
              <Text style={s.celula}>{l.tipo}</Text>
              <Text style={[s.celula, { flex: 1.6 }]}>{l.titulo || "—"}</Text>
              <Text style={[s.celula, { flex: 1.2 }]}>{l.local}</Text>
              <Text style={[s.celula, { flex: 0.6 }]}>{formatarMinutos(l.minutos)}</Text>
            </View>
          ))}
        </View>

        <RodapeRelatorio geradoEmISO={geradoEmISO} fusoHorario={fusoHorario} />
      </Page>
    </Document>
  );
}
