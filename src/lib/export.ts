import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export function exportToCSV(filename: string, headers: string[], rows: any[][]) {
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function exportMarksToPDF(marks: any[], studentName: string) {
  const doc = new jsPDF();
  
  doc.setFontSize(18);
  doc.text(`Report Card: ${studentName}`, 14, 22);
  
  const tableData = marks.map(mark => [
    mark.subject_name || 'Unknown',
    mark.term1 || '-',
    mark.term2 || '-',
    mark.term3 || '-',
    mark.percentage ? `${parseFloat(mark.percentage).toFixed(1)}%` : '-'
  ]);

  autoTable(doc, {
    startY: 30,
    head: [['Subject', 'Term 1', 'Term 2', 'Term 3', 'Percentage']],
    body: tableData,
    theme: 'grid',
    headStyles: { fillColor: [79, 70, 229] } // primary indigo color
  });

  doc.save(`${studentName.replace(/\s+/g, '_')}_marks.pdf`);
}
