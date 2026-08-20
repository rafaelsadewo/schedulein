import { format } from 'date-fns';

export interface Transaction {
  id: string;
  type: 'income' | 'expense';
  category: string;
  amount: number;
  description: string;
  date: string;
}

function formatMoney(amount: number, currency: string): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

// Escape embedded quotes (RFC 4180) and prefix =, +, -, @ so spreadsheet apps don't run them as formulas.
function csvSafe(cell: string): string {
  const escaped = cell.replace(/"/g, '""');
  return /^[=+\-@]/.test(escaped) ? `'${escaped}` : escaped;
}

/**
 * Export transactions to CSV
 */
export function exportToCSV(
  transactions: Transaction[],
  filename: string = 'transactions.csv',
  currency: string = 'IDR'
) {
  const headers = ['Date', 'Type', 'Category', 'Description', 'Amount'];

  const rows = transactions.map((t) => [
    t.date,
    t.type === 'income' ? 'INCOME' : 'EXPENSE',
    t.category,
    t.description || '-',
    formatMoney(t.amount, currency),
  ]);

  const csv = [
    headers.join(','),
    ...rows.map((row) => row.map((cell) => `"${csvSafe(String(cell))}"`).join(',')),
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
  month: number,
  currency: string = 'IDR'
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

  let report = `FINANCIAL REPORT - ${monthName.toUpperCase()}\n`;
  report += `${'='.repeat(50)}\n\n`;
  report += `SUMMARY:\n`;
  report += `Total Income    : ${formatMoney(income, currency)}\n`;
  report += `Total Expense   : ${formatMoney(expense, currency)}\n`;
  report += `Balance          : ${formatMoney(income - expense, currency)}\n\n`;

  report += `EXPENSE BY CATEGORY:\n`;
  expenseByCategory.forEach((cat) => {
    report += `  ${cat.category}: ${formatMoney(cat.total, currency)} (${cat.percentage}%)\n`;
  });

  report += `\nTRANSACTION DETAILS:\n`;
  report += `${'-'.repeat(50)}\n`;
  filtered.forEach((t) => {
    report += `${t.date} | ${t.type === 'income' ? '+' : '-'} ${formatMoney(t.amount, currency)} | ${t.category} | ${t.description || '-'}\n`;
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
  month: number,
  currency: string = 'IDR'
) {
  const monthName = format(new Date(year, month - 1), 'yyyy-MM');
  const report = generateMonthlyReport(transactions, year, month, currency);
  downloadFile(report, `financial-report-${monthName}.txt`, 'text/plain;charset=utf-8;');
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
