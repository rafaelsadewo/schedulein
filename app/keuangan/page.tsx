'use client';

import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import Navbar from '@/components/Navbar';
import { createClient } from '@/lib/supabase';

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
    } else {
      setType('expense');
      setCategory('Makan');
      setAmount('');
      setDescription('');
      setDate(format(new Date(), 'yyyy-MM-dd'));
      setShowForm(false);
      fetchTransactions();
    }
  };

  const handleDeleteTransaction = async (id: string) => {
    const { error } = await supabase
      .from('transactions')
      .delete()
      .eq('id', id);

    if (error) {
      console.error(error);
    } else {
      fetchTransactions();
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
    <div>
      <Navbar />

      <main className="max-w-6xl mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold mb-8 text-pastel-green-dark">Keuangan Bulanan</h1>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-green-100 p-6 rounded-lg shadow-md">
            <p className="text-sm text-gray-700 mb-2">Total Pemasukan</p>
            <p className="text-2xl font-bold text-green-700">
              Rp {totalIncome.toLocaleString('id-ID')}
            </p>
          </div>

          <div className="bg-red-100 p-6 rounded-lg shadow-md">
            <p className="text-sm text-gray-700 mb-2">Total Pengeluaran</p>
            <p className="text-2xl font-bold text-red-700">
              Rp {totalExpense.toLocaleString('id-ID')}
            </p>
          </div>

          <div className="bg-blue-100 p-6 rounded-lg shadow-md">
            <p className="text-sm text-gray-700 mb-2">Sisa</p>
            <p className={`text-2xl font-bold ${totalIncome - totalExpense >= 0 ? 'text-blue-700' : 'text-red-700'}`}>
              Rp {(totalIncome - totalExpense).toLocaleString('id-ID')}
            </p>
          </div>
        </div>

        {/* Category Breakdown */}
        {expenseByCategory.length > 0 && (
          <div className="bg-white p-6 rounded-lg shadow-md mb-8">
            <h2 className="text-xl font-bold mb-4 text-pastel-green-dark">Pengeluaran Per Kategori</h2>
            <div className="space-y-3">
              {expenseByCategory.map((cat) => (
                <div key={cat.name}>
                  <div className="flex justify-between mb-1">
                    <span className="font-medium">{cat.name}</span>
                    <span>Rp {cat.total.toLocaleString('id-ID')}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-pastel-green h-2 rounded-full"
                      style={{
                        width: `${(cat.total / totalExpense) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>

            {mostExpensiveCategory && totalExpense > 0 && (
              <div className="mt-6 p-4 bg-yellow-50 border-l-4 border-yellow-400 rounded">
                <p className="font-semibold text-gray-800">💡 Saran Hemat</p>
                <p className="text-gray-700 mt-2">
                  Pengeluaran <strong>{mostExpensiveCategory.name}</strong> mencapai{' '}
                  <strong>{((mostExpensiveCategory.total / totalExpense) * 100).toFixed(1)}%</strong> dari
                  total pengeluaran bulan ini. Pertimbangkan untuk mengurangi pengeluaran di kategori ini.
                </p>
              </div>
            )}
          </div>
        )}

        <button
          onClick={() => setShowForm(!showForm)}
          className="mb-8 px-6 py-2 bg-green-500 hover:bg-green-600 text-white font-semibold rounded-lg transition"
        >
          + Tambah Transaksi
        </button>

        {showForm && (
          <div className="bg-white p-6 rounded-lg shadow-md mb-8">
            <form onSubmit={handleAddTransaction} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Tipe</label>
                  <select
                    value={type}
                    onChange={(e) => {
                      setType(e.target.value as TransactionType);
                      setCategory(type === 'income' ? INCOME_CATEGORIES[0] : EXPENSE_CATEGORIES[0]);
                    }}
                    className="w-full px-4 py-2 border border-pastel-green rounded-lg focus:ring-2 focus:ring-pastel-green-dark focus:outline-none"
                  >
                    <option value="expense">Pengeluaran</option>
                    <option value="income">Pemasukan</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Kategori</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-4 py-2 border border-pastel-green rounded-lg focus:ring-2 focus:ring-pastel-green-dark focus:outline-none"
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
                  <label className="block text-sm font-medium mb-2">Nominal (Rp)</label>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    required
                    min="1"
                    className="w-full px-4 py-2 border border-pastel-green rounded-lg focus:ring-2 focus:ring-pastel-green-dark focus:outline-none"
                    placeholder="0"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Tanggal</label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-4 py-2 border border-pastel-green rounded-lg focus:ring-2 focus:ring-pastel-green-dark focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Deskripsi (Opsional)</label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-4 py-2 border border-pastel-green rounded-lg focus:ring-2 focus:ring-pastel-green-dark focus:outline-none"
                  placeholder="Misal: Makan di resto XYZ"
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="submit"
                  className="flex-1 bg-pastel-green hover:bg-pastel-green-dark text-white font-semibold py-2 rounded-lg transition"
                >
                  Simpan
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="flex-1 bg-gray-400 hover:bg-gray-500 text-white font-semibold py-2 rounded-lg transition"
                >
                  Batal
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-bold text-pastel-green-dark">Riwayat Transaksi</h2>
          </div>

          {loading ? (
            <p className="text-center text-gray-600 py-8">Loading...</p>
          ) : transactions.length === 0 ? (
            <p className="text-center text-gray-600 py-8">Belum ada transaksi bulan ini</p>
          ) : (
            <div className="divide-y divide-gray-200">
              {transactions.map((item) => (
                <div key={item.id} className="px-6 py-4 flex justify-between items-center">
                  <div>
                    <p className="font-medium text-gray-800">{item.description || item.category}</p>
                    <p className="text-sm text-gray-600">
                      {item.category} • {format(new Date(item.date), 'dd MMM yyyy')}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span
                      className={`font-semibold ${
                        item.type === 'income' ? 'text-green-600' : 'text-red-600'
                      }`}
                    >
                      {item.type === 'income' ? '+' : '-'} Rp {item.amount.toLocaleString('id-ID')}
                    </span>
                    <button
                      onClick={() => handleDeleteTransaction(item.id)}
                      className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded transition text-sm"
                    >
                      Hapus
                    </button>
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
