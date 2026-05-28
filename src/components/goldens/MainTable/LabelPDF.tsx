import React from 'react';
import { Document, Page, View, Text, StyleSheet } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: { padding: 30 },
  myCustomBox: {
    margin: '30px',
    width: '65mm',
    height: '24mm',
    border: '1pt solid black',
  },
  topRow: {
    flexDirection: 'row',
    height: '4mm',
    borderBottom: '1pt solid black',
  },
  baseCell: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  mythickreckt: { width: '60%', borderRight: '1pt solid black' },
  mythickreckt2: { width: '40%' },

  line2mythickreckt1: { width: '15%', borderRight: '1pt solid black' },
  line2mythickreckt2: { width: '85%' },

  line3mythickreckt1: { width: '15%', borderRight: '1pt solid black' },
  line3mythickreckt2: { width: '85%'},


  line4mythickreckt1: { width: '15%', borderRight: '1pt solid black' },
  line4mythickreckt2: { width: '45%', borderRight: '1pt solid black' },
  line4mythickreckt3: { width: '15%', borderRight: '1pt solid black' },
  line4mythickreckt4: { width: '25%' },

  line5mythickreckt1: { width: '25%', borderRight: '1pt solid black' },
  line5mythickreckt2: { width: '25%', borderRight: '1pt solid black' },
  line5mythickreckt3: { width: '25%', borderRight: '1pt solid black' },
  line5mythickreckt4: { width: '25%' },

  textCenter: { fontSize: 7, textAlign: 'center' },
  textCentersmall: { fontSize: 6, textAlign: 'center' }
});

export type LabelData = {
  masterTypeName: string;
  processName: string;
  projectName: string;
  endcodes: string;
  codeSmd: string;
  sn: string;
  pcbRevCode: string;
  preparedBy: string;
  dateCreated: string;
  expireDate: string;
};

interface LabelPDFProps {
  data: LabelData;
}

const getLabelColor = (typeName: string) => {
  if (!typeName) return '#ffffff';

  const lowerName = typeName.toLowerCase();

  if (lowerName.includes('dobry')) return '#196900';
  if (lowerName.includes('zły') || lowerName.includes('zly')) return '#b10000';
  if (lowerName.includes('kalibracyjny')) return '#006080';
  if (lowerName.includes('wizyjny')) return '#3f0063';

  return '#ffffff';
};

const getTextColor = (bgColor: string) => {
  if (bgColor === '#ffffff') {
    return 'black';
  }
  return 'white';
};

const formatTypeName = (typeName: string) => {
  if (!typeName) return '';
  let formatted = typeName.replace(/zły|zly/gi, 'niezgodny');
  formatted = formatted.replace(/dobry/gi, 'zgodny');
  return formatted;
};

const LabelPDF: React.FC<LabelPDFProps> = ({ data }) => {
  const bgColor = getLabelColor(data.masterTypeName);
  const textColor = getTextColor(bgColor);
  
  const displayTypeName = formatTypeName(data.masterTypeName);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={[styles.myCustomBox, { backgroundColor: bgColor }]}>
          
          <View style={styles.topRow}>
            <View style={[styles.baseCell, styles.mythickreckt]}>
              <Text style={[styles.textCenter, { color: textColor }]}>Wzorzec {displayTypeName}</Text>
            </View>
            <View style={[styles.baseCell, styles.mythickreckt2]}>
              <Text style={[styles.textCenter, { color: textColor }]}>{data.processName || "ICT"}</Text>
            </View>
          </View>

          <View style={styles.topRow}>
            <View style={[styles.baseCell, styles.line2mythickreckt1]}>
              <Text style={[styles.textCenter, { color: textColor }]}>Nazwa</Text>
            </View>
            <View style={[styles.baseCell, styles.line2mythickreckt2]}>
              <Text style={[styles.textCenter, { color: textColor }]}>{data.projectName}</Text>
            </View>
          </View>

          <View style={styles.topRow}>
            <View style={[styles.baseCell, styles.line3mythickreckt1]}>
              <Text style={[styles.textCenter, { color: textColor }]}>{"Kod"}</Text>
            </View>
            <View style={[styles.baseCell, styles.line3mythickreckt2]}>
              <Text style={[styles.textCenter, { color: textColor }]}>{data.endcodes}</Text>
            </View>
          </View>

          <View style={styles.topRow}>
            <View style={[styles.baseCell, styles.line4mythickreckt1]}>
              <Text style={[styles.textCenter, { color: textColor }]}>SMD</Text>
            </View>
            <View style={[styles.baseCell, styles.line4mythickreckt2]}>
              <Text style={[styles.textCenter, { color: textColor }]}>{data.codeSmd}</Text>
            </View>
            <View style={[styles.baseCell, styles.line4mythickreckt3]}>
              <Text style={[styles.textCentersmall, { color: textColor }]}>Kod PCB</Text>
            </View>
            <View style={[styles.baseCell, styles.line4mythickreckt4]}>
              <Text style={[styles.textCenter, { color: textColor }]}>{data.pcbRevCode}</Text>
            </View>
          </View>

          <View style={styles.topRow}>
            <View style={[styles.baseCell, styles.line5mythickreckt1]}>
              <Text style={[styles.textCenter, { color: textColor }]}>Przygotowal</Text>
            </View>
            <View style={[styles.baseCell, styles.line5mythickreckt2]}>
              <Text style={[styles.textCenter, { color: textColor }]}>Zatwierdzil</Text>
            </View>
            <View style={[styles.baseCell, styles.line5mythickreckt3]}>
              <Text style={[styles.textCentersmall, { color: textColor }]}>Data wykonania</Text>
            </View>
            <View style={[styles.baseCell, styles.line5mythickreckt4]}>
              <Text style={[styles.textCenter, { color: textColor }]}>Data waznosci</Text>
            </View>
          </View>

          <View style={styles.topRow}>
            <View style={[styles.baseCell, styles.line5mythickreckt1]}>
              <Text style={[styles.textCentersmall, { color: textColor }]}>{data.preparedBy}</Text>
            </View>
            <View style={[styles.baseCell, styles.line5mythickreckt2]}>
              <Text style={[styles.textCentersmall, { color: textColor }]}>Jakub Balut</Text>
            </View>
            <View style={[styles.baseCell, styles.line5mythickreckt3]}>
              <Text style={[styles.textCenter, { color: textColor }]}>{data.dateCreated}</Text>
            </View>
            <View style={[styles.baseCell, styles.line5mythickreckt4]}>
              <Text style={[styles.textCenter, { color: textColor }]}>{data.expireDate}</Text>
            </View>
          </View>

        </View>
      </Page>
    </Document>
  );
};

export default LabelPDF;