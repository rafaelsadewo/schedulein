import { format } from 'date-fns';

export interface Transaction {
  id: string;
  type: 'income' | 'expense';
  category: string;
  amount: number;
  description: string;
  date: string;
}

/**
 * Export transactions to CSV
 */
export function exportToCSV(transactions: Transaction[], filename: string = 'transactions.csv') {
  const headers = ['Tanggal', 'Tipe', 'Kategori', 'Deskripsi', 'Nominal'];

  const rows = transactions.map((t) => [
    t.date,
    t.type === 'income' ? 'PEMASUKAN' : 'PENGELUARAN',
    t.category,
    t.description || '-',
    `Rp ${t.amount.toLocaleString('id-ID')}`,
  ]);

  const csv = [
    headers.join(','),
    ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
  ].join('\n');

  downloadFile(csv, filename, 'text/csv;charset=utf-8;');
}

/**
 * Export transactions to JSON
 */
export function exportToJSON(transactions: Transaction[], filename: string = 'transactions.json') {
  const json = JSON.stringify(transactions, null, 2);
  downloadFile(json, filename, 'application/json;charset=utf-8;');
}

/**
 * Helper function to trigger download
 */
function downloadFile(content: string, filename: string, type: string) {
  const blob = new Blob([content], { type });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(link.href);
}

/**
 * Generate monthly report
 */
export function generateMonthlyReport(
  transactions: Transaction[],
  year: number,
  month: number
): string {
  const monthName = format(new Date(year, month - 1), 'MMMM yyyy');
  const monthStart = new Date(year, month - 1, 1);
  const monthEnd = new Date(year, month, 0);

  const filtered = transactions.filter((t) => {
    const tDate = new Date(t.date);
    return tDate >= monthStart && tDate <= monthEnd;
  });

  const income = filtered
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const expense = filtered
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const expenseByCategory = Array.from(
    filtered
      .filter((t) => t.type === 'expense')
      .reduce((acc, t) => {
        const current = acc.get(t.category) || 0;
        acc.set(t.category, current + t.amount);
        return acc;
      }, new Map<string, number>())
  ).map(([category, total]) => ({
    category,
    total,
    percentage: ((total / expense) * 100).toFixed(1),
  }));

  let report = `LAPORAN KEUANGAN - ${monthName.toUpperCase()}\n`;
  report += `${'='.repeat(50)}\n\n`;
  report += `RINGKASAN:\n`;
  report += `Total Pemasukan  : Rp ${income.toLocaleString('id-ID')}\n`;
  report += `Total Pengeluaran: Rp ${expense.toLocaleString('id-ID')}\n`;
  report += `Sisa             : Rp ${(income - expense).toLocaleString('id-ID')}\n\n`;

  report += `PENGELUARAN PER KATEGORI:\n`;
  expenseByCategory.forEach((cat) => {
    report += `  ${cat.category}: Rp ${cat.total.toLocaleString('id-ID')} (${cat.percentage}%)\n`;
  });

  report += `\nDETAIL TRANSAKSI:\n`;
  report += `${'-'.repeat(50)}\n`;
  filtered.forEach((t) => {
    report += `${t.date} | ${t.type === 'income' ? '+' : '-'} Rp ${t.amount.toLocaleString('id-ID')} | ${t.category} | ${t.description || '-'}\n`;
  });

  return report;
}

/**
 * Auto-export monthly report
 * This should be called on first day of month or manually triggered
 */
export async function autoExportMonthly(
  transactions: Transaction[],
  year: number,
  month: number
) {
  const monthName = format(new Date(year, month - 1), 'yyyy-MM');
  const report = generateMonthlyReport(transactions, year, month);
  downloadFile(report, `laporan-keuangan-${monthName}.txt`, 'text/plain;charset=utf-8;');
}

/**
 * Save export preference to localStorage
 */
export function saveExportPreference(preferences: {
  autoExportEnabled: boolean;
  exportFormat: 'csv' | 'json' | 'txt';
}) {
  localStorage.setItem('export-preferences', JSON.stringify(preferences));
}

/**
 * Get export preference from localStorage
 */
export function getExportPreference() {
  const pref = localStorage.getItem('export-preferences');
  return pref
    ? JSON.parse(pref)
    : { autoExportEnabled: true, exportFormat: 'csv' };
}
