import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

function escapeCsvCell(value: string | number): string {
  const str = String(value);
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function exportCsv(filename: string, headers: string[], rows: (string | number)[][]) {
  const lines = [headers, ...rows].map((row) => row.map(escapeCsvCell).join(","));
  const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
  downloadBlob(blob, filename);
}

export function exportPdf(
  title: string,
  filename: string,
  headers: string[],
  rows: (string | number)[][]
) {
  const doc = new jsPDF();
  doc.setFontSize(14);
  doc.text(title, 14, 16);
  doc.setFontSize(9);
  doc.text(new Date().toLocaleString(), 14, 22);
  autoTable(doc, {
    head: [headers],
    body: rows.map((row) => row.map(String)),
    startY: 28,
    styles: { fontSize: 8 },
    headStyles: { fillColor: [5, 150, 105] },
  });
  doc.save(filename);
}
