import { View, Text, StyleSheet, Image } from "@react-pdf/renderer";
import { formatarData } from "@/lib/dates";

/** Cabeçalho, rodapé e tabela compartilhados pelos relatórios em PDF. */

export interface CabecalhoPdf {
  nomePrograma: string;
  nomeGrupo: string;
  logoPetUrl: string | null;
  logoInstituicaoUrl: string | null;
}

export const estilos = StyleSheet.create({
  page: { padding: 40, fontFamily: "Helvetica", fontSize: 10, color: "#1B1F1D" },
  cabecalho: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    borderBottomWidth: 1,
    borderBottomColor: "#D8D2C6",
    paddingBottom: 8,
    marginBottom: 14,
  },
  programa: { fontFamily: "Helvetica-Bold", fontSize: 12 },
  grupo: { fontSize: 9, color: "#5B6468" },
  logo: { width: 34, height: 34, objectFit: "contain" },
  titulo: { fontFamily: "Helvetica-Bold", fontSize: 16, marginBottom: 2 },
  subtitulo: { fontSize: 10, color: "#5B6468", marginBottom: 14 },
  resumo: {
    flexDirection: "row",
    gap: 18,
    marginBottom: 14,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#E7E2D8",
  },
  resumoItem: { flexDirection: "row", gap: 4, alignItems: "baseline" },
  resumoRotulo: { fontSize: 9, color: "#5B6468" },
  resumoValor: { fontFamily: "Helvetica-Bold", fontSize: 11 },
  tabela: { borderWidth: 1, borderColor: "#E7E2D8" },
  linha: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: "#E7E2D8" },
  cabecalhoLinha: { backgroundColor: "#F3EFE7" },
  celula: { flex: 1, padding: 5, fontSize: 9 },
  celulaCab: { flex: 1, padding: 5, fontSize: 9, fontFamily: "Helvetica-Bold" },
  rodape: {
    position: "absolute",
    bottom: 24,
    left: 40,
    right: 40,
    flexDirection: "row",
    justifyContent: "space-between",
    fontSize: 8,
    color: "#5B6468",
  },
});

export function CabecalhoRelatorio({ programa }: { programa: CabecalhoPdf }) {
  return (
    <View style={estilos.cabecalho} fixed>
      <View>
        <Text style={estilos.programa}>{programa.nomePrograma}</Text>
        <Text style={estilos.grupo}>{programa.nomeGrupo}</Text>
      </View>
      <View style={{ flexDirection: "row", gap: 8 }}>
        {/* eslint-disable-next-line jsx-a11y/alt-text -- Image do @react-pdf/renderer, não <img> */}
        {programa.logoPetUrl && <Image src={programa.logoPetUrl} style={estilos.logo} />}
        {/* eslint-disable-next-line jsx-a11y/alt-text -- idem */}
        {programa.logoInstituicaoUrl && <Image src={programa.logoInstituicaoUrl} style={estilos.logo} />}
      </View>
    </View>
  );
}

export function RodapeRelatorio({
  geradoEmISO,
  fusoHorario,
}: {
  geradoEmISO: string;
  fusoHorario: string;
}) {
  return (
    <View style={estilos.rodape} fixed>
      <Text render={({ pageNumber, totalPages }) => `Página ${pageNumber} de ${totalPages}`} />
      <Text>{`Gerado em ${formatarData(geradoEmISO, fusoHorario)}`}</Text>
    </View>
  );
}

export function ItemResumo({ rotulo, valor }: { rotulo: string; valor: string | number }) {
  return (
    <View style={estilos.resumoItem}>
      <Text style={estilos.resumoRotulo}>{rotulo}:</Text>
      <Text style={estilos.resumoValor}>{String(valor)}</Text>
    </View>
  );
}
