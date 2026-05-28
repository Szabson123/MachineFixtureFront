import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { myFontBase64 } from './myFont';

export const generateGoldenSamplePDF = (data: any[], user: any, procesTitle: string, produktTitle: string) => {
  const doc = new jsPDF('l', 'mm', 'a4');

  doc.addFileToVFS('Roboto-Regular.ttf', myFontBase64);
  doc.addFont('Roboto-Regular.ttf', 'Roboto', 'normal');
  doc.setFont('Roboto'); 

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  const drawHeader = (d: jsPDF) => {
    d.setDrawColor(200);
    d.line(14, 22, pageWidth - 14, 22); 
    d.setFont('Roboto', 'normal');
    d.setFontSize(10);
    d.setTextColor(0);
    d.text("WYKAZ WZORCÓW", 14, 15);
    d.setFontSize(14);
    d.text(`${procesTitle} / ${produktTitle}`, pageWidth / 2, 15, { align: 'center' });
    d.setFontSize(9);
    d.text(`Data wydruku: ${new Date().toLocaleDateString('pl-PL')}`, pageWidth - 14, 15, { align: 'right' });
  };

  autoTable(doc, {
    startY: 25,
    margin: { top: 25, bottom: 35},
    rowPageBreak: 'avoid',
    head: [[
      'KODY (End/SMD)', 
      'PROCES', 
      'NR WZORCA (SN)', 
      'TYP WZORCA', 
      'TYP NIEZGODNOSCI*', 
      'DATA WZORCA', 
      'TERMIN WAZNOSCI', 
      'LOKALIZACJA'
    ]],
    body: data.map(item => {
      const allCodes = [
        ...(item.endcodes?.map((c: any) => c.code) || []),
        ...(item.code_smd?.map((c: any) => c.code) || [])
      ].join('\n');

      let description = "";
      if (item.subobjects && item.subobjects.length > 0) {
        description = item.subobjects
          .map((obj: any) => `${obj.msn}: ${obj.desc}`)
          .join('\n');
      } else if (item.details) {
        description = item.details;
      }

      return [
        allCodes,
        item.process_name?.name || '',
        item.sn || '',
        item.master_type?.name || '',
        description,
        item.date_created ? new Date(item.date_created).toLocaleDateString("pl-PL") : '',
        item.expire_date ? new Date(item.expire_date).toLocaleDateString("pl-PL") : '',
        item.location || ''
      ];
    }),
    
    styles: { 
      fontSize: 8, 
      cellPadding: 3, 
      font: 'Roboto',
      overflow: 'linebreak',
      valign: 'middle' 
    },
    headStyles: { 
      font: 'Roboto',
      fillColor: [41, 128, 185] 
    },
    columnStyles: {
          0: { cellWidth: 25 },
          1: { cellWidth: 20 },
          2: { cellWidth: 50 },
          3: { cellWidth: 25 },
          4: { cellWidth: 70 },
          5: { cellWidth: 25 },
          6: { cellWidth: 25 }, 
          7: { cellWidth: 'auto' },
        },
    didDrawPage: (_dataArg) => {
      drawHeader(doc);
      
      const footerY = pageHeight - 30;
      doc.setDrawColor(220);
      doc.line(14, footerY - 5, pageWidth - 14, footerY - 5);
      
      doc.setFontSize(7);
      doc.setFont('Roboto');
      doc.setTextColor(100);
      const disclaimer = "* wzorce poddawane są kontroli zgodnie z wytycznymi klienta lub PZJ 7.4 (** samples are checked in accordance with the customer's guidelines or PZJ 7.4)";
      doc.text(disclaimer, 14, pageHeight - 10);
    },
    alternateRowStyles: { fillColor: [245, 245, 245] },
  });

const totalPages = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(9);
    doc.setTextColor(0);
    doc.setFont('Roboto');
    const footerY = pageHeight - 30;

    const imie = user?.first_name || "";
    const nazwisko = user?.last_name || "";
    
    doc.text(`Opracował: ${imie} ${nazwisko}`, 14, footerY);
    doc.text(`Zatwierdził: Jakub Bałut`, pageWidth / 2, footerY, { align: 'center' });
    doc.text(`Strona ${i} z ${totalPages}`, pageWidth - 14, footerY, { align: 'right' });
    
    doc.text(`Formularz: F139`, pageWidth - 14, pageHeight - 10, { align: 'right' });
  }

  window.open(doc.output('bloburl'), '_blank');
};