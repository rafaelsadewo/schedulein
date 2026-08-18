'use client';

import { useEffect, useState } from 'react';
import { format, addDays, eachDayOfInterval } from 'date-fns';
import { id } from 'date-fns/locale';
import Navbar from '@/components/Navbar';
import { ToastContainer, useToast } from '@/components/Toast';
import { createClient } from '@/lib/supabase';
import { getHoliday, isWorkingDay } from '@/lib/indonesian-holidays';
import {
  expandRecurringSchedule,
  formatRecurrence,
  getDayNameId,
  type RecurringSchedule,
  type RecurrenceType,
  type DayOfWeek,
} from '@/lib/recurring-schedule';
import { requestNotificationPermission } from '@/lib/notifications';

interface ScheduleItem {
  id: string;
  title: string;
  date: string;
  start_time: string;
  end_time: string;
  notes: string | null;
  created_at: string;
}

type Tab = 'daily' | 'recurring';

export default function JadwalPage() {
  const { toasts, showToast, removeToast } = useToast();
  const [schedules, setSchedules] = useState<ScheduleItem[]>([]);
  const [recurringSchedules, setRecurringSchedules] = useState<RecurringSchedule[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [tab, setTab] = useState<Tab>('daily');
  const [showForm, setShowForm] = useState(false);
  const [showRecurringForm, setShowRecurringForm] = useState(false);

  // Daily form
  const [title, setTitle] = useState('');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:00');
  const [notes, setNotes] = useState('');

  // Recurring form
  const [recurringTitle, setRecurringTitle] = useState('');
  const [recurringStartTime, setRecurringStartTime] = useState('09:00');
  const [recurringEndTime, setRecurringEndTime] = useState('17:00');
  const [selectedDaysOfWeek, setSelectedDaysOfWeek] = useState<DayOfWeek[]>([1, 2, 3, 4, 5]); // Mon-Fri by default
  const [recurringNotes, setRecurringNotes] = useState('');

  const [loading, setLoading] = useState(true);
  const [expandedRecurring, setExpandedRecurring] = useState<ScheduleItem[]>([]);
  const supabase = createClient();

  const dateStr = format(selectedDate, 'yyyy-MM-dd');
  const holiday = getHoliday(selectedDate);
  const isWorking = isWorkingDay(selectedDate);

  useEffect(() => {
    requestNotificationPermission();
    fetchSchedules();
    generateRecurringInstances();
  }, [selectedDate, recurringSchedules]);

  const fetchSchedules = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('schedule_items')
        .select('*')
        .eq('date', dateStr)
        .order('start_time', { ascending: true });

      if (error) console.error(error);
      else setSchedules(data || []);
    } finally {
      setLoading(false);
    }
  };

  const generateRecurringInstances = () => {
    if (recurringSchedules.length === 0) {
      setExpandedRecurring([]);
      return;
    }

    const instances: ScheduleItem[] = [];

    recurringSchedules.forEach((recurring) => {
      const expanded = expandRecurringSchedule(recurring, selectedDate, selectedDate);
      expanded.forEach((item) => {
        instances.push({
          id: item.id,
          title: item.title,
          date: item.date,
          start_time: item.start_time,
          end_time: item.end_time,
          notes: item.notes || null,
          created_at: new Date().toISOString(),
        });
      });
    });

    setExpandedRecurring(instances);
  };

  const handleAddSchedule = async (e: React.FormEvent) => {
    e.preventDefault();

    const { error } = await supabase
      .from('schedule_items')
      .insert([
        {
          title,
          date: dateStr,
          start_time: startTime,
          end_time: endTime,
          notes: notes || null,
        },
      ]);

    if (error) {
      console.error(error);
      showToast('Gagal menambah jadwal', 'error');
    } else {
      setTitle('');
      setStartTime('09:00');
      setEndTime('10:00');
      setNotes('');
      setShowForm(false);
      fetchSchedules();
      showToast(`Jadwal "${title}" berhasil ditambahkan!`, 'success');
    }
  };

  const handleAddRecurringSchedule = async (e: React.FormEvent) => {
    e.preventDefault();

    if (selectedDaysOfWeek.length === 0) {
      showToast('Pilih minimal satu hari!', 'warning');
      return;
    }

    const newRecurring: RecurringSchedule = {
      id: `recurring-${Date.now()}`,
      title: recurringTitle,
      start_time: recurringStartTime,
      end_time: recurringEndTime,
      recurrence_type: 'weekly',
      days_of_week: selectedDaysOfWeek,
      notes: recurringNotes,
    };

    setRecurringSchedules([...recurringSchedules, newRecurring]);

    setRecurringTitle('');
    setRecurringStartTime('09:00');
    setRecurringEndTime('17:00');
    setSelectedDaysOfWeek([1, 2, 3, 4, 5]);
    setRecurringNotes('');
    setShowRecurringForm(false);
    showToast(`Recurring "${recurringTitle}" berhasil ditambahkan!`, 'success');
  };

  const handleDeleteSchedule = async (id: string, title: string) => {
    const { error } = await supabase
      .from('schedule_items')
      .delete()
      .eq('id', id);

    if (error) {
      console.error(error);
      showToast('Gagal menghapus jadwal', 'error');
    } else {
      fetchSchedules();
      showToast(`Jadwal "${title}" berhasil dihapus`, 'info');
    }
  };

  const handleDeleteRecurring = (id: string, title: string) => {
    setRecurringSchedules(recurringSchedules.filter((r) => r.id !== id));
    showToast(`Recurring "${title}" berhasil dihapus`, 'info');
  };

  const toggleDayOfWeek = (day: DayOfWeek) => {
    setSelectedDaysOfWeek((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const allSchedules = [...schedules, ...expandedRecurring].sort(
    (a, b) => a.start_time.localeCompare(b.start_time)
  );

  return (
    <div className="min-h-screen bg-brutal-bg-light text-brutal-fg-light">
      <Navbar />
      <ToastContainer toasts={toasts} onRemove={removeToast} />

      <main className="max-w-5xl mx-auto px-8 py-12 border-l-2 border-r-2 border-brutal-fg-light">
        <h1 className="text-5xl font-black mb-12 tracking-tighter">JADWAL</h1>

        {/* Date Navigation */}
        <div className="mb-12 border-2 border-brutal-fg-light p-6">
          <div className="font-mono text-xs tracking-wider text-brutal-fg-light uppercase mb-4 font-bold">
            DATE / NAVIGATION
          </div>

          <div className="flex gap-4 items-center justify-between mb-6">
            <button
              onClick={() => setSelectedDate(addDays(selectedDate, -1))}
              className="bg-brutal-fg-light text-brutal-bg-light border-2 border-brutal-fg-light px-4 py-2 font-bold uppercase text-sm tracking-tight hover:bg-brutal-accent hover:text-brutal-fg-light"
            >
              &lt; PREV
            </button>

            <div className="flex-1 text-center">
              <div className="font-mono font-bold text-lg tracking-tight">
                {format(selectedDate, 'EEEE, dd MMM yyyy', { locale: id }).toUpperCase()}
              </div>
              {holiday && (
                <div className="font-mono text-xs text-brutal-red mt-2 font-bold">
                  🎌 {holiday.name.toUpperCase()}
                </div>
              )}
              {!isWorking && !holiday && (
                <div className="font-mono text-xs text-brutal-accent mt-2 font-bold">
                  (HARI LIBUR AKHIR PEKAN)
                </div>
              )}
            </div>

            <button
              onClick={() => setSelectedDate(addDays(selectedDate, 1))}
              className="bg-brutal-fg-light text-brutal-bg-light border-2 border-brutal-fg-light px-4 py-2 font-bold uppercase text-sm tracking-tight hover:bg-brutal-accent hover:text-brutal-fg-light"
            >
              NEXT &gt;
            </button>
          </div>

          {/* Tab Navigation */}
          <div className="flex gap-2 mb-6 border-2 border-brutal-fg-light">
            <button
              onClick={() => setTab('daily')}
              className={`flex-1 py-2 font-bold uppercase tracking-tight text-sm border-r-2 border-brutal-fg-light ${
                tab === 'daily'
                  ? 'bg-brutal-fg-light text-brutal-bg-light'
                  : 'bg-brutal-bg-light text-brutal-fg-light hover:bg-brutal-accent'
              }`}
            >
              Daily Schedule
            </button>
            <button
              onClick={() => setTab('recurring')}
              className={`flex-1 py-2 font-bold uppercase tracking-tight text-sm ${
                tab === 'recurring'
                  ? 'bg-brutal-fg-light text-brutal-bg-light'
                  : 'bg-brutal-bg-light text-brutal-fg-light hover:bg-brutal-accent'
              }`}
            >
              Recurring
            </button>
          </div>

          {tab === 'daily' && (
            <button
              onClick={() => setShowForm(!showForm)}
              className="w-full bg-brutal-accent text-brutal-fg-light border-2 border-brutal-fg-light py-3 font-bold uppercase tracking-tight hover:bg-brutal-fg-light hover:text-brutal-bg-light"
            >
              {showForm ? '[ CLOSE FORM ]' : '[ ADD SCHEDULE ]'}
            </button>
          )}

          {tab === 'recurring' && (
            <button
              onClick={() => setShowRecurringForm(!showRecurringForm)}
              className="w-full bg-brutal-accent text-brutal-fg-light border-2 border-brutal-fg-light py-3 font-bold uppercase tracking-tight hover:bg-brutal-fg-light hover:text-brutal-bg-light"
            >
              {showRecurringForm ? '[ CLOSE FORM ]' : '[ ADD RECURRING ]'}
            </button>
          )}
        </div>

        {/* Daily Form */}
        {tab === 'daily' && showForm && (
          <div className="mb-12 border-2 border-brutal-fg-light p-6">
            <div className="font-mono text-xs tracking-wider text-brutal-fg-light uppercase mb-4 font-bold">
              INPUT / NEW SCHEDULE
            </div>

            <form onSubmit={handleAddSchedule} className="space-y-4">
              <div>
                <label className="block font-mono text-xs font-bold tracking-wider mb-2">ACTIVITY</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  className="w-full bg-brutal-bg-light text-brutal-fg-light border-2 border-brutal-fg-light p-3 font-mono text-sm"
                  placeholder="MEETING / EXERCISE"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-mono text-xs font-bold tracking-wider mb-2">START</label>
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full bg-brutal-bg-light text-brutal-fg-light border-2 border-brutal-fg-light p-3 font-mono text-sm"
                  />
                </div>
                <div>
                  <label className="block font-mono text-xs font-bold tracking-wider mb-2">END</label>
                  <input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full bg-brutal-bg-light text-brutal-fg-light border-2 border-brutal-fg-light p-3 font-mono text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block font-mono text-xs font-bold tracking-wider mb-2">NOTES (OPT)</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-brutal-bg-light text-brutal-fg-light border-2 border-brutal-fg-light p-3 font-mono text-sm"
                  rows={2}
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

        {/* Recurring Form */}
        {tab === 'recurring' && showRecurringForm && (
          <div className="mb-12 border-2 border-brutal-fg-light p-6">
            <div className="font-mono text-xs tracking-wider text-brutal-fg-light uppercase mb-4 font-bold">
              INPUT / NEW RECURRING
            </div>

            <form onSubmit={handleAddRecurringSchedule} className="space-y-4">
              <div>
                <label className="block font-mono text-xs font-bold tracking-wider mb-2">TITLE</label>
                <input
                  type="text"
                  value={recurringTitle}
                  onChange={(e) => setRecurringTitle(e.target.value)}
                  required
                  className="w-full bg-brutal-bg-light text-brutal-fg-light border-2 border-brutal-fg-light p-3 font-mono text-sm"
                  placeholder="KERJA / KULIAH"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-mono text-xs font-bold tracking-wider mb-2">START</label>
                  <input
                    type="time"
                    value={recurringStartTime}
                    onChange={(e) => setRecurringStartTime(e.target.value)}
                    className="w-full bg-brutal-bg-light text-brutal-fg-light border-2 border-brutal-fg-light p-3 font-mono text-sm"
                  />
                </div>
                <div>
                  <label className="block font-mono text-xs font-bold tracking-wider mb-2">END</label>
                  <input
                    type="time"
                    value={recurringEndTime}
                    onChange={(e) => setRecurringEndTime(e.target.value)}
                    className="w-full bg-brutal-bg-light text-brutal-fg-light border-2 border-brutal-fg-light p-3 font-mono text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block font-mono text-xs font-bold tracking-wider mb-2">PILIH HARI (BISA MULTIPLE)</label>
                <div className="grid grid-cols-7 gap-2 border-2 border-brutal-fg-light p-3 mb-3">
                  {[0, 1, 2, 3, 4, 5, 6].map((day) => (
                    <button
                      key={day}
                      type="button"
                      onClick={() => toggleDayOfWeek(day as DayOfWeek)}
                      className={`p-3 font-bold text-xs border-2 transition-all ${
                        selectedDaysOfWeek.includes(day as DayOfWeek)
                          ? 'bg-brutal-accent text-brutal-fg-light border-brutal-accent ring-2 ring-brutal-accent ring-offset-2'
                          : 'bg-brutal-bg-light text-brutal-fg-light border-brutal-fg-light hover:border-brutal-accent'
                      }`}
                    >
                      {getDayNameId(day)}
                    </button>
                  ))}
                </div>

                {/* Selected Days Display */}
                <div className="border-2 border-brutal-fg-light p-3 bg-brutal-accent text-brutal-fg-light">
                  <div className="font-mono text-xs font-bold tracking-wider mb-2">HARI TERPILIH:</div>
                  {selectedDaysOfWeek.length === 0 ? (
                    <div className="font-mono text-xs italic">Belum ada hari yang dipilih</div>
                  ) : (
                    <div className="font-mono text-sm font-bold">
                      {selectedDaysOfWeek.map((day) => getDayNameId(day)).join(' • ')}
                    </div>
                  )}
                  <div className="font-mono text-xs mt-2 opacity-80">
                    Total: {selectedDaysOfWeek.length} hari per minggu
                  </div>
                </div>
              </div>

              <div>
                <label className="block font-mono text-xs font-bold tracking-wider mb-2">NOTES (OPT)</label>
                <textarea
                  value={recurringNotes}
                  onChange={(e) => setRecurringNotes(e.target.value)}
                  className="w-full bg-brutal-bg-light text-brutal-fg-light border-2 border-brutal-fg-light p-3 font-mono text-sm"
                  rows={2}
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
                  onClick={() => setShowRecurringForm(false)}
                  className="bg-brutal-red text-brutal-bg-light border-2 border-brutal-red py-3 font-bold uppercase tracking-tight hover:bg-brutal-fg-light hover:text-brutal-bg-light"
                >
                  CANCEL
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Recurring List */}
        {tab === 'recurring' && recurringSchedules.length > 0 && (
          <div className="mb-12 border-2 border-brutal-fg-light p-6">
            <div className="font-mono text-xs tracking-wider text-brutal-fg-light uppercase mb-2 font-bold">
              DATA / RECURRING SCHEDULES ({recurringSchedules.length})
            </div>
            <div className="font-mono text-xs text-brutal-fg-light mb-6">
              Klik HAPUS untuk menghapus recurring schedule
            </div>

            <div className="space-y-3">
              {recurringSchedules.map((recurring) => (
                <div key={recurring.id} className="border-2 border-brutal-fg-light p-4 bg-white hover:bg-gray-50">
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex-1">
                      <h3 className="font-black text-lg mb-2 tracking-tighter uppercase">
                        {recurring.title}
                      </h3>
                      <div className="font-mono text-xs tracking-wider mb-2">
                        ⏰ {recurring.start_time} → {recurring.end_time}
                      </div>
                      <div className="font-mono text-xs text-brutal-accent font-bold">
                        📅 {formatRecurrence(recurring).toUpperCase()}
                      </div>
                      {recurring.notes && (
                        <div className="font-mono text-xs text-gray-700 mt-2 italic">{recurring.notes}</div>
                      )}
                    </div>
                    <button
                      onClick={() => {
                        if (confirm(`Hapus recurring schedule "${recurring.title}"?`)) {
                          handleDeleteRecurring(recurring.id, recurring.title);
                        }
                      }}
                      className="bg-brutal-red text-brutal-bg-light border-2 border-brutal-red px-4 py-2 font-bold text-xs tracking-tight uppercase hover:bg-brutal-fg-light hover:text-brutal-bg-light whitespace-nowrap"
                    >
                      HAPUS
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Schedule List */}
        <div className="border-2 border-brutal-fg-light p-6">
          <div className="font-mono text-xs tracking-wider text-brutal-fg-light uppercase mb-6 font-bold">
            DATA / SCHEDULE ({allSchedules.length})
          </div>

          {loading ? (
            <div className="font-mono text-sm text-brutal-fg-light">[>>] LOADING...</div>
          ) : allSchedules.length === 0 ? (
            <div className="bg-brutal-accent text-brutal-fg-light p-4 font-mono text-xs leading-relaxed">
              <div className="font-bold mb-2">[!] TIDAK ADA JADWAL</div>
              <div>Belum ada jadwal untuk {format(selectedDate, 'dd MMMM yyyy', { locale: id })}.</div>
              <div className="mt-2">Klik tombol [ ADD SCHEDULE ] atau [ ADD RECURRING ] untuk mulai.</div>
            </div>
          ) : (
            <div className="space-y-3">
              {allSchedules.map((item) => (
                <div key={item.id} className="border-2 border-brutal-fg-light p-4 hover:bg-brutal-accent hover:text-brutal-fg-light transition-colors">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-black text-lg mb-1 tracking-tighter uppercase">{item.title}</h3>
                      <div className="font-mono text-xs tracking-wider mb-2">
                        {item.start_time} → {item.end_time}
                      </div>
                      {item.notes && (
                        <div className="font-mono text-xs text-gray-700 mt-2">{item.notes}</div>
                      )}
                    </div>
                    {!item.id.includes('recurring') && (
                      <button
                        onClick={() => handleDeleteSchedule(item.id, item.title)}
                        className="bg-brutal-red text-brutal-bg-light border-2 border-brutal-red px-3 py-1 font-bold text-xs tracking-tight uppercase hover:bg-brutal-fg-light hover:text-brutal-bg-light ml-4"
                      >
                        DEL
                      </button>
                    )}
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
