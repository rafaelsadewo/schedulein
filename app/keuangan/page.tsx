'use client';

import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import Navbar from '@/components/Navbar';
import { ToastContainer, useToast } from '@/components/Toast';
import { createClient } from '@/lib/supabase';
import { exportToCSV, generateMonthlyReport, autoExportMonthly } from '@/lib/export';

type TransactionType = 'income' | 'expense';

interface Transaction {
  id: string;
  type: TransactionType;
  category: string;
  amount: number;
  description: string;
  date: string;
  created_at: string;
}

const EXPENSE_CATEGORIES = [
  'Makan',
  'Transport',
  'Hiburan',
  'Tagihan',
  'Belanja',
  'Lain-lain',
];

const INCOME_CATEGORIES = ['Gaji', 'Freelance', 'Investasi', 'Lain-lain'];

export default function KeuanganPage() {
  const { toasts, showToast, removeToast } = useToast();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [type, setType] = useState<TransactionType>('expense');
  const [category, setCategory] = useState('Makan');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const currentMonth = format(new Date(), 'yyyy-MM');
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .gte('date', `${currentMonth}-01`)
        .lte('date', `${currentMonth}-31`)
        .order('date', { ascending: false });

      if (error) console.error(error);
      else setTransactions(data || []);
    } finally {
      setLoading(false);
    }
  };

  const handleAddTransaction = async (e: React.FormEvent) => {
    e.preventDefault();

    const { error } = await supabase
      .from('transactions')
      .insert([
        {
          type,
          category,
          amount: parseFloat(amount),
          description,
          date,
        },
      ]);

    if (error) {
      console.error(error);
      showToast('Gagal menambah transaksi', 'error');
    } else {
      setType('expense');
      setCategory('Makan');
      setAmount('');
      setDescription('');
      setDate(format(new Date(), 'yyyy-MM-dd'));
      setShowForm(false);
      fetchTransactions();
      showToast(`Transaksi berhasil ditambahkan!`, 'success');
    }
  };

  const handleDeleteTransaction = async (id: string, description: string) => {
    const { error } = await supabase
      .from('transactions')
      .delete()
      .eq('id', id);

    if (error) {
      console.error(error);
      showToast('Gagal menghapus transaksi', 'error');
    } else {
      fetchTransactions();
      showToast(`"${description}" berhasil dihapus`, 'info');
    }
  };

  const totalIncome = transactions
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpense = transactions
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const expenseByCategory = EXPENSE_CATEGORIES.map((cat) => ({
    name: cat,
    total: transactions
      .filter((t) => t.type === 'expense' && t.category === cat)
      .reduce((sum, t) => sum + t.amount, 0),
  })).filter((c) => c.total > 0);

  const mostExpensiveCategory = expenseByCategory.length > 0
    ? expenseByCategory.reduce((max, c) => (c.total > max.total ? c : max))
    : null;

  const categories = type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

  return (
    <div className="min-h-screen bg-brutal-bg-light text-brutal-fg-light">
      <Navbar />
      <ToastContainer toasts={toasts} onRemove={removeToast} />

      <main className="max-w-5xl mx-auto px-8 py-12 border-l-2 border-r-2 border-brutal-fg-light">
        <h1 className="text-5xl font-black mb-12 tracking-tighter">KEUANGAN BULANAN</h1>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-0 mb-12 border-2 border-brutal-fg-light">
          <div className="border-r-2 border-b-2 border-brutal-fg-light p-6">
            <div className="font-mono text-xs tracking-wider font-bold mb-2">INCOME</div>
            <div className="text-3xl font-black tracking-tighter text-brutal-accent">
              Rp {totalIncome.toLocaleString('id-ID')}
            </div>
          </div>

          <div className="border-r-2 border-b-2 border-brutal-fg-light p-6">
            <div className="font-mono text-xs tracking-wider font-bold mb-2">EXPENSE</div>
            <div className="text-3xl font-black tracking-tighter text-brutal-red">
              Rp {totalExpense.toLocaleString('id-ID')}
            </div>
          </div>

          <div className="border-b-2 border-brutal-fg-light p-6">
            <div className="font-mono text-xs tracking-wider font-bold mb-2">BALANCE</div>
            <div className={`text-3xl font-black tracking-tighter ${
              totalIncome - totalExpense >= 0 ? 'text-brutal-accent' : 'text-brutal-red'
            }`}>
              Rp {(totalIncome - totalExpense).toLocaleString('id-ID')}
            </div>
          </div>
        </div>

        {/* Category Breakdown */}
        {expenseByCategory.length > 0 && (
          <div className="mb-12 border-2 border-brutal-fg-light p-6">
            <div className="font-mono text-xs tracking-wider font-bold mb-6">EXPENSE / CATEGORY</div>

            {expenseByCategory.map((cat) => (
              <div key={cat.name} className="mb-4">
                <div className="flex justify-between font-mono text-xs font-bold mb-1">
                  <span>{cat.name}</span>
                  <span>Rp {cat.total.toLocaleString('id-ID')}</span>
                </div>
                <div className="w-full bg-brutal-bg-light border border-brutal-fg-light h-6 relative">
                  <div
                    className="bg-brutal-accent h-full"
                    style={{
                      width: `${(cat.total / totalExpense) * 100}%`,
                    }}
                  />
                  <div className="absolute inset-0 font-mono text-xs text-brutal-fg-light flex items-center justify-center font-bold">
                    {totalExpense > 0 ? `${((cat.total / totalExpense) * 100).toFixed(0)}%` : '0%'}
                  </div>
                </div>
              </div>
            ))}

            {mostExpensiveCategory && totalExpense > 0 && (
              <div className="mt-8 border-l-4 border-brutal-red bg-brutal-bg-light border-2 border-brutal-fg-light p-4">
                <div className="font-mono text-xs tracking-wider font-bold mb-2 text-brutal-red">ALERT / SPENDING</div>
                <div className="font-mono text-xs leading-relaxed">
                  {mostExpensiveCategory.name.toUpperCase()} IS {((mostExpensiveCategory.total / totalExpense) * 100).toFixed(1)}% OF TOTAL SPENDING.
                  RECOMMEND REDUCTION.
                </div>
              </div>
            )}
          </div>
        )}

        {/* Export Controls */}
        <div className="mb-12 border-2 border-brutal-fg-light p-6">
          <div className="font-mono text-xs tracking-wider font-bold mb-4">EXPORT / ACTIONS</div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={() => {
                const currentMonth = new Date().getMonth() + 1;
                const currentYear = new Date().getFullYear();
                exportToCSV(
                  transactions,
                  `laporan-keuangan-${currentYear}-${String(currentMonth).padStart(2, '0')}.csv`
                );
                showToast('File CSV berhasil diunduh!', 'success');
              }}
              className="bg-brutal-accent text-brutal-fg-light border-2 border-brutal-fg-light py-2 px-4 font-bold text-xs uppercase tracking-tight hover:bg-brutal-fg-light hover:text-brutal-bg-light"
            >
              EXPORT CSV (BULAN INI)
            </button>

            <button
              onClick={() => {
                const report = generateMonthlyReport(
                  transactions,
                  new Date().getFullYear(),
                  new Date().getMonth() + 1
                );
                const blob = new Blob([report], { type: 'text/plain' });
                const link = document.createElement('a');
                link.href = URL.createObjectURL(blob);
                link.download = `laporan-bulanan-${new Date().toISOString().split('T')[0]}.txt`;
                link.click();
                showToast('File laporan berhasil diunduh!', 'success');
              }}
              className="bg-brutal-accent text-brutal-fg-light border-2 border-brutal-fg-light py-2 px-4 font-bold text-xs uppercase tracking-tight hover:bg-brutal-fg-light hover:text-brutal-bg-light"
            >
              EXPORT REPORT (TXT)
            </button>

            <button
              onClick={() => {
                const start = prompt('Tanggal mulai (YYYY-MM-DD):');
                const end = prompt('Tanggal akhir (YYYY-MM-DD):');
                if (start && end) {
                  const filtered = transactions.filter(
                    (t) => t.date >= start && t.date <= end
                  );
                  if (filtered.length === 0) {
                    showToast('Tidak ada transaksi dalam range tanggal tersebut', 'warning');
                  } else {
                    exportToCSV(filtered, `transaksi-${start}-to-${end}.csv`);
                    showToast(`${filtered.length} transaksi berhasil diunduh!`, 'success');
                  }
                }
              }}
              className="bg-brutal-fg-light text-brutal-bg-light border-2 border-brutal-fg-light py-2 px-4 font-bold text-xs uppercase tracking-tight hover:bg-brutal-accent hover:text-brutal-fg-light"
            >
              EXPORT CUSTOM RANGE
            </button>
          </div>
        </div>

        {/* Add Transaction Button */}
        <button
          onClick={() => setShowForm(!showForm)}
          className="w-full mb-12 bg-brutal-accent text-brutal-fg-light border-2 border-brutal-fg-light py-3 font-bold uppercase tracking-tight hover:bg-brutal-fg-light hover:text-brutal-bg-light"
        >
          {showForm ? '[ CLOSE FORM ]' : '[ ADD TRANSACTION ]'}
        </button>

        {/* Form */}
        {showForm && (
          <div className="mb-12 border-2 border-brutal-fg-light p-6">
            <div className="font-mono text-xs tracking-wider font-bold mb-4">INPUT / NEW TRANSACTION</div>

            <form onSubmit={handleAddTransaction} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-mono text-xs font-bold tracking-wider mb-2">TYPE</label>
                  <select
                    value={type}
                    onChange={(e) => {
                      setType(e.target.value as TransactionType);
                      setCategory(type === 'income' ? INCOME_CATEGORIES[0] : EXPENSE_CATEGORIES[0]);
                    }}
                    className="w-full bg-brutal-bg-light text-brutal-fg-light border-2 border-brutal-fg-light p-3 font-mono text-sm"
                  >
                    <option value="expense">EXPENSE</option>
                    <option value="income">INCOME</option>
                  </select>
                </div>

                <div>
                  <label className="block font-mono text-xs font-bold tracking-wider mb-2">CATEGORY</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-brutal-bg-light text-brutal-fg-light border-2 border-brutal-fg-light p-3 font-mono text-sm"
                  >
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-mono text-xs font-bold tracking-wider mb-2">AMOUNT (Rp)</label>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    required
                    min="1"
                    className="w-full bg-brutal-bg-light text-brutal-fg-light border-2 border-brutal-fg-light p-3 font-mono text-sm"
                    placeholder="0"
                  />
                </div>

                <div>
                  <label className="block font-mono text-xs font-bold tracking-wider mb-2">DATE</label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full bg-brutal-bg-light text-brutal-fg-light border-2 border-brutal-fg-light p-3 font-mono text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block font-mono text-xs font-bold tracking-wider mb-2">DESCRIPTION (OPT)</label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-brutal-bg-light text-brutal-fg-light border-2 border-brutal-fg-light p-3 font-mono text-sm"
                  placeholder="RESTAURANT NAME / SHOP / ETC"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <button
                  type="submit"
                  className="bg-brutal-fg-light text-brutal-bg-light border-2 border-brutal-fg-light py-3 font-bold uppercase tracking-tight hover:bg-brutal-accent hover:text-brutal-fg-light"
                >
                  SAVE
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="bg-brutal-red text-brutal-bg-light border-2 border-brutal-red py-3 font-bold uppercase tracking-tight hover:bg-brutal-fg-light hover:text-brutal-bg-light"
                >
                  CANCEL
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Transactions List */}
        <div className="border-2 border-brutal-fg-light">
          <div className="border-b-2 border-brutal-fg-light p-6">
            <div className="font-mono text-xs tracking-wider font-bold">DATA / TRANSACTIONS</div>
          </div>

          {loading ? (
            <div className="p-6 font-mono text-sm">[→] LOADING...</div>
          ) : transactions.length === 0 ? (
            <div className="p-6 bg-brutal-accent text-brutal-fg-light font-mono text-xs leading-relaxed">
              <div className="font-bold mb-2">[!] TIDAK ADA TRANSAKSI</div>
              <div>Belum ada transaksi di bulan ini.</div>
              <div className="mt-2">Klik tombol [ ADD TRANSACTION ] untuk mulai catat pengeluaran atau pemasukan.</div>
            </div>
          ) : (
            <div>
              {transactions.map((item, idx) => (
                <div key={item.id} className={`border-b-2 border-brutal-fg-light p-4 ${idx % 2 === 0 ? 'bg-brutal-bg-light' : 'bg-white'}`}>
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-mono text-xs font-bold tracking-wider mb-1">
                        {format(new Date(item.date), 'yyyy-MM-dd')} | {item.category.toUpperCase()}
                      </div>
                      <div className="font-black text-lg tracking-tighter uppercase">
                        {item.description || item.category}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`font-black text-lg tracking-tighter ${
                        item.type === 'income' ? 'text-brutal-accent' : 'text-brutal-red'
                      }`}>
                        {item.type === 'income' ? '+' : '-'} Rp {item.amount.toLocaleString('id-ID')}
                      </div>
                      <button
                        onClick={() => handleDeleteTransaction(item.id, item.description || item.category)}
                        className="bg-brutal-red text-brutal-bg-light border-2 border-brutal-red px-3 py-1 font-bold text-xs tracking-tight uppercase hover:bg-brutal-fg-light hover:text-brutal-bg-light mt-2"
                      >
                        DEL
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
