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
  'Food',
  'Transport',
  'Entertainment',
  'Bills',
  'Shopping',
  'Other',
];

const INCOME_CATEGORIES = ['Salary', 'Freelance', 'Investment', 'Other'];

export default function KeuanganPage() {
  const { toasts, showToast, removeToast } = useToast();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [type, setType] = useState<TransactionType>('expense');
  const [category, setCategory] = useState('Food');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formError, setFormError] = useState('');
  const [showRangeExport, setShowRangeExport] = useState(false);
  const [rangeStart, setRangeStart] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [rangeEnd, setRangeEnd] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [rangeError, setRangeError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | TransactionType>('all');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [currency, setCurrency] = useState('IDR');
  const supabase = createClient();

  useEffect(() => {
    fetchTransactions();
    checkAutoExport();

    try {
      const saved = localStorage.getItem('settings');
      if (saved) setCurrency(JSON.parse(saved).currency || 'IDR');
    } catch (e) {
      console.error('Error loading settings:', e);
    }
  }, []);

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(amount);

  const checkAutoExport = async () => {
    let autoExportEnabled = true;
    let exportCurrency = 'IDR';
    try {
      const saved = localStorage.getItem('settings');
      if (saved) {
        const settings = JSON.parse(saved);
        autoExportEnabled = settings.autoExportEnabled !== false;
        exportCurrency = settings.currency || 'IDR';
      }
    } catch (e) {
      console.error('Error loading settings:', e);
    }
    if (!autoExportEnabled) return;

    const now = new Date();
    if (now.getDate() > 3) return; // only check within the first few days of the month

    const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthKey = format(lastMonthDate, 'yyyy-MM');

    if (localStorage.getItem('last-auto-export') === lastMonthKey) return;

    const { data } = await supabase
      .from('transactions')
      .select('*')
      .gte('date', `${lastMonthKey}-01`)
      .lte('date', `${lastMonthKey}-31`);

    if (data && data.length > 0) {
      await autoExportMonthly(data, lastMonthDate.getFullYear(), lastMonthDate.getMonth() + 1, exportCurrency);
      showToast(`Auto-exported ${lastMonthKey} report`, 'info');
    }
    localStorage.setItem('last-auto-export', lastMonthKey);
  };

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

    if (!amount || parseFloat(amount) <= 0) {
      setFormError('Amount must be greater than 0');
      return;
    }
    setFormError('');
    setSubmitting(true);

    try {
      const payload = {
        type,
        category,
        amount: parseFloat(amount),
        description,
        date,
      };

      const { error } = editingId
        ? await supabase.from('transactions').update(payload).eq('id', editingId)
        : await supabase.from('transactions').insert([payload]);

      if (error) {
        console.error(error);
        showToast(`Failed to ${editingId ? 'update' : 'add'} transaction`, 'error');
      } else {
        setType('expense');
        setCategory('Food');
        setAmount('');
        setDescription('');
        setDate(format(new Date(), 'yyyy-MM-dd'));
        setEditingId(null);
        setShowForm(false);
        fetchTransactions();
        showToast(`Transaction successfully ${editingId ? 'updated' : 'added'}!`, 'success');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditTransaction = (item: Transaction) => {
    setEditingId(item.id);
    setType(item.type);
    setCategory(item.category);
    setAmount(String(item.amount));
    setDescription(item.description);
    setDate(item.date);
    setFormError('');
    setShowForm(true);
  };

  const handleDeleteTransaction = async (id: string, description: string) => {
    setDeletingId(id);
    try {
      const { error } = await supabase
        .from('transactions')
        .delete()
        .eq('id', id);

      if (error) {
        console.error(error);
        showToast('Failed to delete transaction', 'error');
      } else {
        fetchTransactions();
        showToast(`"${description}" successfully deleted`, 'info');
      }
    } finally {
      setDeletingId(null);
    }
  };

  const toggleSelected = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    if (!confirm(`Delete ${selectedIds.size} selected transaction(s)?`)) return;

    setBulkDeleting(true);
    try {
      const { error } = await supabase
        .from('transactions')
        .delete()
        .in('id', Array.from(selectedIds));

      if (error) {
        console.error(error);
        showToast('Failed to delete selected transactions', 'error');
      } else {
        showToast(`${selectedIds.size} transaction(s) successfully deleted`, 'info');
        setSelectedIds(new Set());
        fetchTransactions();
      }
    } finally {
      setBulkDeleting(false);
    }
  };

  const handleExportRange = () => {
    if (!rangeStart || !rangeEnd) {
      setRangeError('Select both a start and end date');
      return;
    }
    if (rangeEnd < rangeStart) {
      setRangeError('End date must be after start date');
      return;
    }
    setRangeError('');

    const filtered = transactions.filter((t) => t.date >= rangeStart && t.date <= rangeEnd);
    if (filtered.length === 0) {
      showToast('No transactions in the selected date range', 'warning');
      return;
    }
    exportToCSV(filtered, `transactions-${rangeStart}-to-${rangeEnd}.csv`, currency);
    showToast(`${filtered.length} transactions successfully downloaded`, 'success');
    setShowRangeExport(false);
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

  const filteredTransactions = transactions.filter((t) => {
    if (filterType !== 'all' && t.type !== filterType) return false;
    const query = searchQuery.trim().toLowerCase();
    if (!query) return true;
    return (
      t.category.toLowerCase().includes(query) ||
      t.description.toLowerCase().includes(query)
    );
  });

  return (
    <div className="min-h-screen bg-brutal-bg text-brutal-fg">
      <Navbar />
      <ToastContainer toasts={toasts} onRemove={removeToast} />

      <main className="corner-marks animate-enter max-w-5xl mx-auto px-4 sm:px-8 py-8 sm:py-12 border-l-2 border-r-2 border-brutal-fg">
        <div className="relative mb-12">
          <span aria-hidden className="pointer-events-none select-none absolute -top-4 sm:-top-8 left-0 -z-10 font-black leading-none text-brutal-fg opacity-[0.06] text-[6rem] sm:text-[9rem] tracking-tighter">
            02
          </span>
          <h1 className="text-5xl font-black tracking-tighter">MONTHLY FINANCE</h1>
        </div>

        {/* Summary Cards */}
        <div className="shadow-block grid grid-cols-1 md:grid-cols-3 gap-0 mb-12 border-2 border-brutal-fg">
          <div className="border-r-2 border-b-2 border-brutal-fg p-6">
            <div className="font-mono text-xs tracking-wider font-bold mb-2">INCOME</div>
            <div className="text-3xl font-black tracking-tighter text-brutal-accent-deep">
              {formatCurrency(totalIncome)}
            </div>
          </div>

          <div className="border-r-2 border-b-2 border-brutal-fg p-6">
            <div className="font-mono text-xs tracking-wider font-bold mb-2">EXPENSE</div>
            <div className="text-3xl font-black tracking-tighter text-brutal-red">
              {formatCurrency(totalExpense)}
            </div>
          </div>

          <div className="border-b-2 border-brutal-fg p-6">
            <div className="font-mono text-xs tracking-wider font-bold mb-2">BALANCE</div>
            <div className={`text-3xl font-black tracking-tighter ${
              totalIncome - totalExpense >= 0 ? 'text-brutal-accent-deep' : 'text-brutal-red'
            }`}>
              {formatCurrency(totalIncome - totalExpense)}
            </div>
          </div>
        </div>

        {/* Category Breakdown */}
        {expenseByCategory.length > 0 && (
          <div className="mb-12 shadow-block border-2 border-brutal-fg p-6">
            <div className="font-mono text-xs tracking-wider font-bold mb-6">EXPENSE / CATEGORY</div>

            {expenseByCategory.map((cat) => (
              <div key={cat.name} className="mb-4">
                <div className="flex justify-between font-mono text-xs font-bold mb-1">
                  <span>{cat.name}</span>
                  <span>{formatCurrency(cat.total)}</span>
                </div>
                <div className="w-full bg-brutal-bg border border-brutal-fg h-6 relative">
                  <div
                    className="bg-brutal-accent h-full"
                    style={{
                      width: `${(cat.total / totalExpense) * 100}%`,
                    }}
                  />
                  <div className="absolute inset-0 font-mono text-xs text-brutal-fg flex items-center justify-center font-bold">
                    {totalExpense > 0 ? `${((cat.total / totalExpense) * 100).toFixed(0)}%` : '0%'}
                  </div>
                </div>
              </div>
            ))}

            {mostExpensiveCategory && totalExpense > 0 && (
              <div className="mt-8 border-l-4 border-brutal-red bg-brutal-bg border-2 border-brutal-fg p-4">
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
        <div className="mb-12 shadow-block border-2 border-brutal-fg p-6">
          <div className="font-mono text-xs tracking-wider font-bold mb-4">EXPORT / ACTIONS</div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={() => {
                const currentMonth = new Date().getMonth() + 1;
                const currentYear = new Date().getFullYear();
                exportToCSV(
                  transactions,
                  `financial-report-${currentYear}-${String(currentMonth).padStart(2, '0')}.csv`,
                  currency
                );
                showToast('CSV file successfully downloaded', 'success');
              }}
              className="bg-brutal-accent text-brutal-fg border-2 border-brutal-accent py-2 px-4 font-bold text-xs uppercase tracking-tight hover:bg-brutal-fg hover:text-brutal-bg hover:border-brutal-fg"
            >
              EXPORT CSV (THIS MONTH)
            </button>

            <button
              onClick={() => {
                const report = generateMonthlyReport(
                  transactions,
                  new Date().getFullYear(),
                  new Date().getMonth() + 1,
                  currency
                );
                const blob = new Blob([report], { type: 'text/plain' });
                const link = document.createElement('a');
                link.href = URL.createObjectURL(blob);
                link.download = `monthly-report-${new Date().toISOString().split('T')[0]}.txt`;
                link.click();
                showToast('Report file successfully downloaded', 'success');
              }}
              className="bg-brutal-accent text-brutal-fg border-2 border-brutal-accent py-2 px-4 font-bold text-xs uppercase tracking-tight hover:bg-brutal-fg hover:text-brutal-bg hover:border-brutal-fg"
            >
              EXPORT REPORT (TXT)
            </button>

            <button
              onClick={() => setShowRangeExport(!showRangeExport)}
              className="bg-brutal-fg text-brutal-bg border-2 border-brutal-fg py-2 px-4 font-bold text-xs uppercase tracking-tight hover:bg-brutal-accent hover:text-brutal-fg hover:border-brutal-accent"
            >
              {showRangeExport ? '[ CLOSE ]' : 'EXPORT CUSTOM RANGE'}
            </button>
          </div>

          {showRangeExport && (
            <div className="animate-enter mt-4 border-2 border-brutal-fg p-4">
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block font-mono text-xs font-bold tracking-wider mb-2">FROM</label>
                  <input
                    type="date"
                    value={rangeStart}
                    onChange={(e) => setRangeStart(e.target.value)}
                    className="w-full bg-brutal-bg text-brutal-fg border-2 border-brutal-fg p-3 font-mono text-sm"
                  />
                </div>
                <div>
                  <label className="block font-mono text-xs font-bold tracking-wider mb-2">TO</label>
                  <input
                    type="date"
                    value={rangeEnd}
                    onChange={(e) => setRangeEnd(e.target.value)}
                    className="w-full bg-brutal-bg text-brutal-fg border-2 border-brutal-fg p-3 font-mono text-sm"
                  />
                </div>
              </div>

              {rangeError && (
                <div className="border-2 border-brutal-red text-brutal-red font-mono text-xs font-bold p-3 mb-4">
                  × {rangeError}
                </div>
              )}

              <button
                onClick={handleExportRange}
                className="w-full bg-brutal-accent text-brutal-fg border-2 border-brutal-accent py-3 font-bold uppercase tracking-tight hover:bg-brutal-fg hover:text-brutal-bg hover:border-brutal-fg"
              >
                DOWNLOAD CSV
              </button>
            </div>
          )}
        </div>

        {/* Add Transaction Button */}
        <button
          onClick={() => {
            if (showForm) setEditingId(null);
            setShowForm(!showForm);
          }}
          className="w-full mb-12 bg-brutal-accent text-brutal-fg border-2 border-brutal-accent py-3 font-bold uppercase tracking-tight hover:bg-brutal-fg hover:text-brutal-bg hover:border-brutal-fg"
        >
          {showForm ? '[ CLOSE FORM ]' : '[ ADD TRANSACTION ]'}
        </button>

        {/* Form */}
        {showForm && (
          <div className="animate-enter mb-12 shadow-block border-2 border-brutal-fg p-6">
            <div className="font-mono text-xs tracking-wider font-bold mb-4">
              {editingId ? 'EDIT / TRANSACTION' : 'INPUT / NEW TRANSACTION'}
            </div>

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
                    className="w-full bg-brutal-bg text-brutal-fg border-2 border-brutal-fg p-3 font-mono text-sm"
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
                    className="w-full bg-brutal-bg text-brutal-fg border-2 border-brutal-fg p-3 font-mono text-sm"
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
                  <label className="block font-mono text-xs font-bold tracking-wider mb-2">AMOUNT ({currency})</label>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    required
                    min="1"
                    className="w-full bg-brutal-bg text-brutal-fg border-2 border-brutal-fg p-3 font-mono text-sm"
                    placeholder="0"
                  />
                </div>

                <div>
                  <label className="block font-mono text-xs font-bold tracking-wider mb-2">DATE</label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full bg-brutal-bg text-brutal-fg border-2 border-brutal-fg p-3 font-mono text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block font-mono text-xs font-bold tracking-wider mb-2">DESCRIPTION (OPT)</label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-brutal-bg text-brutal-fg border-2 border-brutal-fg p-3 font-mono text-sm"
                  placeholder="RESTAURANT NAME / SHOP / ETC"
                />
              </div>

              {formError && (
                <div className="border-2 border-brutal-red text-brutal-red font-mono text-xs font-bold p-3">
                  × {formError}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <button
                  type="submit"
                  disabled={submitting}
                  className="cta bg-brutal-fg text-brutal-bg border-2 border-brutal-fg py-3 font-bold uppercase tracking-tight hover:bg-brutal-accent hover:text-brutal-fg hover:border-brutal-accent disabled:opacity-50"
                >
                  {submitting ? 'SAVING...' : editingId ? 'UPDATE' : 'SAVE'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setEditingId(null);
                  }}
                  disabled={submitting}
                  className="bg-brutal-red text-brutal-bg border-2 border-brutal-red py-3 font-bold uppercase tracking-tight hover:bg-brutal-fg hover:text-brutal-bg disabled:opacity-50"
                >
                  CANCEL
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Transactions List */}
        <div className="shadow-block border-2 border-brutal-fg">
          <div className="border-b-2 border-brutal-fg p-6">
            <div className="font-mono text-xs tracking-wider font-bold mb-4">DATA / TRANSACTIONS</div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="SEARCH CATEGORY OR DESCRIPTION"
                className="md:col-span-2 w-full bg-brutal-bg text-brutal-fg border-2 border-brutal-fg p-3 font-mono text-sm"
              />
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value as 'all' | TransactionType)}
                className="w-full bg-brutal-bg text-brutal-fg border-2 border-brutal-fg p-3 font-mono text-sm"
              >
                <option value="all">ALL TYPES</option>
                <option value="income">INCOME ONLY</option>
                <option value="expense">EXPENSE ONLY</option>
              </select>
            </div>

            {selectedIds.size > 0 && (
              <div className="flex items-center justify-between mt-4 border-2 border-brutal-red p-3">
                <span className="font-mono text-xs font-bold text-brutal-red">
                  {selectedIds.size} SELECTED
                </span>
                <button
                  onClick={handleBulkDelete}
                  disabled={bulkDeleting}
                  className="bg-brutal-red text-brutal-bg border-2 border-brutal-red px-4 py-2 font-bold text-xs tracking-tight uppercase hover:bg-brutal-fg hover:text-brutal-bg disabled:opacity-50"
                >
                  {bulkDeleting ? 'DELETING...' : 'DELETE SELECTED'}
                </button>
              </div>
            )}
          </div>

          {loading ? (
            <div className="p-6 font-mono text-sm animate-blink">◆ LOADING...</div>
          ) : transactions.length === 0 ? (
            <div className="p-6 bg-brutal-accent text-brutal-fg font-mono text-xs leading-relaxed">
              <div className="font-bold mb-2">▲ NO TRANSACTIONS FOUND</div>
              <div>No transactions found for this month.</div>
              <div className="mt-2">Click [ ADD TRANSACTION ] to start tracking your income or expenses.</div>
            </div>
          ) : filteredTransactions.length === 0 ? (
            <div className="p-6 bg-brutal-accent text-brutal-fg font-mono text-xs leading-relaxed">
              <div className="font-bold mb-2">▲ NO MATCHES</div>
              <div>No transactions match your search or filter.</div>
            </div>
          ) : (
            <div>
              {filteredTransactions.map((item, idx) => (
                <div key={item.id} className={`border-b-2 border-brutal-fg p-4 ${idx % 2 === 0 ? 'bg-brutal-bg' : 'bg-[#e4f0d4]'}`}>
                  <div className="flex justify-between items-start gap-3">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(item.id)}
                      onChange={() => toggleSelected(item.id)}
                      className="w-5 h-5 border-2 border-brutal-fg cursor-pointer mt-1 shrink-0"
                    />
                    <div className="flex-1">
                      <div className="font-mono text-xs font-bold tracking-wider mb-1">
                        {format(new Date(item.date), 'yyyy-MM-dd')} | {item.category.toUpperCase()}
                      </div>
                      <div className="font-black text-lg tracking-tighter uppercase">
                        {item.description || item.category}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`font-black text-lg tracking-tighter ${
                        item.type === 'income' ? 'text-brutal-accent-deep' : 'text-brutal-red'
                      }`}>
                        {item.type === 'income' ? '+' : '-'} {formatCurrency(item.amount)}
                      </div>
                      <div className="flex gap-2 mt-2 justify-end">
                        <button
                          onClick={() => handleEditTransaction(item)}
                          className="bg-brutal-accent text-brutal-fg border-2 border-brutal-accent px-3 py-1 font-bold text-xs tracking-tight uppercase hover:bg-brutal-fg hover:text-brutal-bg"
                        >
                          EDIT
                        </button>
                        <button
                          onClick={() => handleDeleteTransaction(item.id, item.description || item.category)}
                          disabled={deletingId === item.id}
                          className="bg-brutal-red text-brutal-bg border-2 border-brutal-red px-3 py-1 font-bold text-xs tracking-tight uppercase hover:bg-brutal-fg hover:text-brutal-bg disabled:opacity-50"
                        >
                          {deletingId === item.id ? '...' : 'DEL'}
                        </button>
                      </div>
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
