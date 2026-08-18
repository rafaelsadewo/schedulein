'use client';

import { useEffect, useState } from 'react';
import { format, addDays, startOfWeek, endOfWeek, eachDayOfInterval } from 'date-fns';
import Navbar from '@/components/Navbar';
import { ToastContainer, useToast } from '@/components/Toast';
import { createClient } from '@/lib/supabase';
import { getHoliday, isWorkingDay, DEFAULT_WEEKEND_DAYS, type Country } from '@/lib/indonesian-holidays';
import {
  expandRecurringSchedule,
  formatRecurrence,
  getDayNameId,
  getDayAbbr,
  type RecurringSchedule,
  type RecurrenceType,
  type DayOfWeek,
} from '@/lib/recurring-schedule';
import { requestNotificationPermission, setupScheduleNotification } from '@/lib/notifications';

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
  const [submitting, setSubmitting] = useState(false);
  const [recurringSubmitting, setRecurringSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [formError, setFormError] = useState('');
  const [recurringFormError, setRecurringFormError] = useState('');
  const [expandedRecurring, setExpandedRecurring] = useState<ScheduleItem[]>([]);
  const [country, setCountry] = useState<Country>('ID');
  const [weekendDays, setWeekendDays] = useState<number[]>(DEFAULT_WEEKEND_DAYS);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [viewMode, setViewMode] = useState<'day' | 'week'>('day');
  const [weekSchedules, setWeekSchedules] = useState<ScheduleItem[]>([]);
  const [weekLoading, setWeekLoading] = useState(false);
  const [recurringLoaded, setRecurringLoaded] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [notificationMinuteBefore, setNotificationMinuteBefore] = useState(30);
  const supabase = createClient();

  const dateStr = format(selectedDate, 'yyyy-MM-dd');
  const holiday = getHoliday(selectedDate, country);
  const isWorking = isWorkingDay(selectedDate, country, weekendDays);
  const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(selectedDate, { weekStartsOn: 1 });
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

  useEffect(() => {
    const saved = localStorage.getItem('settings');
    if (saved) {
      try {
        const settings = JSON.parse(saved);
        setCountry(settings.country || 'ID');
        setWeekendDays(settings.weekendDays || DEFAULT_WEEKEND_DAYS);
        setNotificationsEnabled(settings.notificationsEnabled !== false);
        setNotificationMinuteBefore(settings.notificationMinuteBefore || 30);
      } catch (e) {
        console.error('Error loading settings:', e);
      }
    }
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem('recurring-schedules');
    if (saved) {
      try {
        setRecurringSchedules(JSON.parse(saved));
      } catch (e) {
        console.error('Error loading recurring schedules:', e);
      }
    }
    setRecurringLoaded(true);
  }, []);

  useEffect(() => {
    if (!recurringLoaded) return;
    localStorage.setItem('recurring-schedules', JSON.stringify(recurringSchedules));
  }, [recurringSchedules, recurringLoaded]);

  useEffect(() => {
    requestNotificationPermission();
    fetchSchedules();
    generateRecurringInstances();
  }, [selectedDate, recurringSchedules]);

  useEffect(() => {
    if (!notificationsEnabled || !recurringLoaded) return;

    let cancelled = false;
    const cleanups: Array<() => void> = [];

    const setupTodaysNotifications = async () => {
      const today = new Date();
      const todayStr = format(today, 'yyyy-MM-dd');
      const nowTime = format(today, 'HH:mm');

      const { data } = await supabase
        .from('schedule_items')
        .select('*')
        .eq('date', todayStr)
        .order('start_time', { ascending: true });

      if (cancelled) return;

      const todaysRecurring = recurringSchedules.flatMap((r) =>
        expandRecurringSchedule(r, today, today)
      );
      const todaysAll = [...(data || []), ...todaysRecurring];

      todaysAll
        .filter((item) => item.start_time > nowTime)
        .forEach((item) => {
          cleanups.push(
            setupScheduleNotification(item.title, item.start_time, notificationMinuteBefore)
          );
        });
    };

    setupTodaysNotifications();

    return () => {
      cancelled = true;
      cleanups.forEach((fn) => fn());
    };
  }, [schedules, recurringSchedules, recurringLoaded, notificationsEnabled, notificationMinuteBefore]);

  useEffect(() => {
    if (viewMode === 'week') fetchWeekSchedules();
  }, [viewMode, selectedDate]);

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

  const fetchWeekSchedules = async () => {
    setWeekLoading(true);
    try {
      const { data, error } = await supabase
        .from('schedule_items')
        .select('*')
        .gte('date', format(weekStart, 'yyyy-MM-dd'))
        .lte('date', format(weekEnd, 'yyyy-MM-dd'))
        .order('start_time', { ascending: true });

      if (error) console.error(error);
      else setWeekSchedules(data || []);
    } finally {
      setWeekLoading(false);
    }
  };

  const weekRecurringInstances: ScheduleItem[] = recurringSchedules.flatMap((recurring) =>
    expandRecurringSchedule(recurring, weekStart, weekEnd).map((item) => ({
      id: item.id,
      title: item.title,
      date: item.date,
      start_time: item.start_time,
      end_time: item.end_time,
      notes: item.notes || null,
      created_at: new Date().toISOString(),
    }))
  );

  const weekItemsByDate = (day: Date) => {
    const key = format(day, 'yyyy-MM-dd');
    return [...weekSchedules, ...weekRecurringInstances]
      .filter((item) => item.date === key)
      .sort((a, b) => a.start_time.localeCompare(b.start_time));
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

    if (endTime <= startTime) {
      setFormError('End time must be after start time');
      return;
    }
    setFormError('');
    setSubmitting(true);

    try {
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
        showToast('Failed to add schedule', 'error');
      } else {
        setTitle('');
        setStartTime('09:00');
        setEndTime('10:00');
        setNotes('');
        setShowForm(false);
        fetchSchedules();
        showToast(`Schedule "${title}" successfully added!`, 'success');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddRecurringSchedule = async (e: React.FormEvent) => {
    e.preventDefault();

    if (selectedDaysOfWeek.length === 0) {
      setRecurringFormError('Select at least one day');
      return;
    }
    if (recurringEndTime <= recurringStartTime) {
      setRecurringFormError('End time must be after start time');
      return;
    }
    setRecurringFormError('');
    setRecurringSubmitting(true);

    try {
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
      showToast(`Recurring "${recurringTitle}" successfully added!`, 'success');
    } finally {
      setRecurringSubmitting(false);
    }
  };

  const handleDeleteSchedule = async (id: string, title: string) => {
    setDeletingId(id);
    try {
      const { error } = await supabase
        .from('schedule_items')
        .delete()
        .eq('id', id);

      if (error) {
        console.error(error);
        showToast('Failed to delete schedule', 'error');
      } else {
        fetchSchedules();
        showToast(`Schedule "${title}" successfully deleted`, 'info');
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
    if (!confirm(`Delete ${selectedIds.size} selected schedule item(s)?`)) return;

    setBulkDeleting(true);
    try {
      const { error } = await supabase
        .from('schedule_items')
        .delete()
        .in('id', Array.from(selectedIds));

      if (error) {
        console.error(error);
        showToast('Failed to delete selected schedule items', 'error');
      } else {
        showToast(`${selectedIds.size} schedule item(s) successfully deleted`, 'info');
        setSelectedIds(new Set());
        fetchSchedules();
      }
    } finally {
      setBulkDeleting(false);
    }
  };

  const handleDeleteRecurring = (id: string, title: string) => {
    setRecurringSchedules(recurringSchedules.filter((r) => r.id !== id));
    showToast(`Recurring "${title}" successfully deleted`, 'info');
  };

  const handleDailyTabClick = () => {
    if (tab === 'daily' && showForm) {
      setShowForm(false);
    } else {
      setTab('daily');
      setShowForm(true);
      setShowRecurringForm(false);
    }
  };

  const handleRecurringTabClick = () => {
    if (tab === 'recurring' && showRecurringForm) {
      setShowRecurringForm(false);
    } else {
      setTab('recurring');
      setShowRecurringForm(true);
      setShowForm(false);
    }
  };

  const toggleDayOfWeek = (day: DayOfWeek) => {
    setSelectedDaysOfWeek((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const allSchedules = [...schedules, ...expandedRecurring].sort(
    (a, b) => a.start_time.localeCompare(b.start_time)
  );

  const filteredSchedules = allSchedules.filter((item) => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return true;
    return (
      item.title.toLowerCase().includes(query) ||
      (item.notes || '').toLowerCase().includes(query)
    );
  });

  return (
    <div className="min-h-screen bg-brutal-bg text-brutal-fg">
      <Navbar />
      <ToastContainer toasts={toasts} onRemove={removeToast} />

      <main className="max-w-5xl mx-auto px-4 sm:px-8 py-8 sm:py-12 border-l-2 border-r-2 border-brutal-fg">
        <h1 className="text-5xl font-black mb-12 tracking-tighter">SCHEDULE</h1>

        {/* Date Navigation */}
        <div className="mb-12 border-2 border-brutal-fg p-6">
          <div className="font-mono text-xs tracking-wider text-brutal-fg uppercase mb-4 font-bold">
            DATE / NAVIGATION
          </div>

          <div className="flex gap-4 items-center justify-between mb-6">
            <button
              onClick={() => setSelectedDate(addDays(selectedDate, viewMode === 'week' ? -7 : -1))}
              className="bg-brutal-fg text-brutal-bg border-2 border-brutal-fg px-4 py-2 font-bold uppercase text-sm tracking-tight hover:bg-brutal-accent hover:text-brutal-fg hover:border-brutal-accent"
            >
              &lt; PREV
            </button>

            <div className="flex-1 text-center">
              {viewMode === 'day' ? (
                <>
                  <div className="font-mono font-bold text-lg tracking-tight">
                    {format(selectedDate, 'EEEE, dd MMM yyyy').toUpperCase()}
                  </div>
                  {holiday && (
                    <div className="font-mono text-xs text-brutal-red mt-2 font-bold">
                      ▲ {holiday.name.toUpperCase()}
                    </div>
                  )}
                  {!isWorking && !holiday && (
                    <div className="font-mono text-xs text-brutal-accent-deep mt-2 font-bold">
                      (WEEKEND)
                    </div>
                  )}
                </>
              ) : (
                <div className="font-mono font-bold text-lg tracking-tight">
                  {format(weekStart, 'dd MMM').toUpperCase()} — {format(weekEnd, 'dd MMM yyyy').toUpperCase()}
                </div>
              )}
            </div>

            <button
              onClick={() => setSelectedDate(addDays(selectedDate, viewMode === 'week' ? 7 : 1))}
              className="bg-brutal-fg text-brutal-bg border-2 border-brutal-fg px-4 py-2 font-bold uppercase text-sm tracking-tight hover:bg-brutal-accent hover:text-brutal-fg hover:border-brutal-accent"
            >
              NEXT &gt;
            </button>
          </div>

          {/* Day / Week View Toggle */}
          <div className="flex gap-2 mb-6 border-2 border-brutal-fg">
            <button
              onClick={() => setViewMode('day')}
              className={`flex-1 py-2 font-bold uppercase tracking-tight text-sm border-r-2 border-brutal-fg ${
                viewMode === 'day'
                  ? 'bg-brutal-accent text-brutal-fg'
                  : 'bg-brutal-bg text-brutal-fg hover:bg-brutal-accent'
              }`}
            >
              Day View
            </button>
            <button
              onClick={() => setViewMode('week')}
              className={`flex-1 py-2 font-bold uppercase tracking-tight text-sm ${
                viewMode === 'week'
                  ? 'bg-brutal-accent text-brutal-fg'
                  : 'bg-brutal-bg text-brutal-fg hover:bg-brutal-accent'
              }`}
            >
              Week View
            </button>
          </div>

          {viewMode === 'day' && (
            <>
              {/* Tab Navigation — click directly opens that tab's form */}
              <div className="flex gap-2 border-2 border-brutal-fg">
                <button
                  onClick={handleDailyTabClick}
                  className={`flex-1 py-3 font-bold uppercase tracking-tight text-sm border-r-2 border-brutal-fg ${
                    tab === 'daily' && showForm
                      ? 'bg-brutal-fg text-brutal-bg'
                      : 'bg-brutal-bg text-brutal-fg hover:bg-brutal-accent'
                  }`}
                >
                  {tab === 'daily' && showForm ? '[ CLOSE ] Daily Schedule' : 'Daily Schedule'}
                </button>
                <button
                  onClick={handleRecurringTabClick}
                  className={`flex-1 py-3 font-bold uppercase tracking-tight text-sm ${
                    tab === 'recurring' && showRecurringForm
                      ? 'bg-brutal-fg text-brutal-bg'
                      : 'bg-brutal-bg text-brutal-fg hover:bg-brutal-accent'
                  }`}
                >
                  {tab === 'recurring' && showRecurringForm ? '[ CLOSE ] Recurring' : 'Recurring'}
                </button>
              </div>
            </>
          )}
        </div>

        {/* Daily Form */}
        {tab === 'daily' && showForm && (
          <div className="mb-12 border-2 border-brutal-fg p-6">
            <div className="font-mono text-xs tracking-wider text-brutal-fg uppercase mb-4 font-bold">
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
                  className="w-full bg-brutal-bg text-brutal-fg border-2 border-brutal-fg p-3 font-mono text-sm"
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
                    className="w-full bg-brutal-bg text-brutal-fg border-2 border-brutal-fg p-3 font-mono text-sm"
                  />
                </div>
                <div>
                  <label className="block font-mono text-xs font-bold tracking-wider mb-2">END</label>
                  <input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full bg-brutal-bg text-brutal-fg border-2 border-brutal-fg p-3 font-mono text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block font-mono text-xs font-bold tracking-wider mb-2">NOTES (OPT)</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-brutal-bg text-brutal-fg border-2 border-brutal-fg p-3 font-mono text-sm"
                  rows={2}
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
                  className="bg-brutal-fg text-brutal-bg border-2 border-brutal-fg py-3 font-bold uppercase tracking-tight hover:bg-brutal-accent hover:text-brutal-fg hover:border-brutal-accent disabled:opacity-50"
                >
                  {submitting ? 'SAVING...' : 'SAVE'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  disabled={submitting}
                  className="bg-brutal-red text-brutal-bg border-2 border-brutal-red py-3 font-bold uppercase tracking-tight hover:bg-brutal-fg hover:text-brutal-bg disabled:opacity-50"
                >
                  CANCEL
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Recurring Form */}
        {tab === 'recurring' && showRecurringForm && (
          <div className="mb-12 border-2 border-brutal-fg p-6">
            <div className="font-mono text-xs tracking-wider text-brutal-fg uppercase mb-4 font-bold">
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
                  className="w-full bg-brutal-bg text-brutal-fg border-2 border-brutal-fg p-3 font-mono text-sm"
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
                    className="w-full bg-brutal-bg text-brutal-fg border-2 border-brutal-fg p-3 font-mono text-sm"
                  />
                </div>
                <div>
                  <label className="block font-mono text-xs font-bold tracking-wider mb-2">END</label>
                  <input
                    type="time"
                    value={recurringEndTime}
                    onChange={(e) => setRecurringEndTime(e.target.value)}
                    className="w-full bg-brutal-bg text-brutal-fg border-2 border-brutal-fg p-3 font-mono text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block font-mono text-xs font-bold tracking-wider mb-2">SELECT DAYS (MULTIPLE ALLOWED)</label>
                <div className="grid grid-cols-7 gap-2 border-2 border-brutal-fg p-3 mb-3">
                  {[0, 1, 2, 3, 4, 5, 6].map((day) => (
                    <button
                      key={day}
                      type="button"
                      onClick={() => toggleDayOfWeek(day as DayOfWeek)}
                      className={`p-1.5 sm:p-3 font-bold text-[10px] sm:text-xs border-2 transition-all ${
                        selectedDaysOfWeek.includes(day as DayOfWeek)
                          ? 'bg-brutal-accent text-brutal-fg border-brutal-accent ring-2 ring-brutal-accent-deep ring-offset-2'
                          : 'bg-brutal-bg text-brutal-fg border-brutal-fg hover:border-brutal-accent'
                      }`}
                    >
                      {getDayAbbr(day)}
                    </button>
                  ))}
                </div>

                {/* Selected Days Display */}
                <div className="border-2 border-brutal-accent p-3 bg-brutal-accent text-brutal-fg">
                  <div className="font-mono text-xs font-bold tracking-wider mb-2">SELECTED DAYS:</div>
                  {selectedDaysOfWeek.length === 0 ? (
                    <div className="font-mono text-xs italic">No days selected yet</div>
                  ) : (
                    <div className="font-mono text-sm font-bold">
                      {selectedDaysOfWeek.map((day) => getDayNameId(day)).join(' • ')}
                    </div>
                  )}
                  <div className="font-mono text-xs mt-2 opacity-80">
                    Total: {selectedDaysOfWeek.length} day(s) per week
                  </div>
                </div>
              </div>

              <div>
                <label className="block font-mono text-xs font-bold tracking-wider mb-2">NOTES (OPT)</label>
                <textarea
                  value={recurringNotes}
                  onChange={(e) => setRecurringNotes(e.target.value)}
                  className="w-full bg-brutal-bg text-brutal-fg border-2 border-brutal-fg p-3 font-mono text-sm"
                  rows={2}
                />
              </div>

              {recurringFormError && (
                <div className="border-2 border-brutal-red text-brutal-red font-mono text-xs font-bold p-3">
                  × {recurringFormError}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <button
                  type="submit"
                  disabled={recurringSubmitting}
                  className="bg-brutal-fg text-brutal-bg border-2 border-brutal-fg py-3 font-bold uppercase tracking-tight hover:bg-brutal-accent hover:text-brutal-fg hover:border-brutal-accent disabled:opacity-50"
                >
                  {recurringSubmitting ? 'SAVING...' : 'SAVE'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowRecurringForm(false)}
                  disabled={recurringSubmitting}
                  className="bg-brutal-red text-brutal-bg border-2 border-brutal-red py-3 font-bold uppercase tracking-tight hover:bg-brutal-fg hover:text-brutal-bg disabled:opacity-50"
                >
                  CANCEL
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Recurring List */}
        {tab === 'recurring' && recurringSchedules.length > 0 && (
          <div className="mb-12 border-2 border-brutal-fg p-6">
            <div className="font-mono text-xs tracking-wider text-brutal-fg uppercase mb-2 font-bold">
              DATA / RECURRING SCHEDULES ({recurringSchedules.length})
            </div>
            <div className="font-mono text-xs text-brutal-fg mb-6">
              Click DELETE to remove a recurring schedule
            </div>

            <div className="space-y-3">
              {recurringSchedules.map((recurring) => (
                <div key={recurring.id} className="border-2 border-brutal-fg p-4 hover:border-brutal-accent-deep">
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex-1">
                      <h3 className="font-black text-lg mb-2 tracking-tighter uppercase">
                        {recurring.title}
                      </h3>
                      <div className="font-mono text-xs tracking-wider mb-2">
                        ◆ {recurring.start_time} → {recurring.end_time}
                      </div>
                      <div className="font-mono text-xs text-brutal-accent-deep font-bold">
                        ▪ {formatRecurrence(recurring).toUpperCase()}
                      </div>
                      {recurring.notes && (
                        <div className="font-mono text-xs text-brutal-fg opacity-70 mt-2 italic">{recurring.notes}</div>
                      )}
                    </div>
                    <button
                      onClick={() => {
                        if (confirm(`Delete recurring schedule "${recurring.title}"?`)) {
                          handleDeleteRecurring(recurring.id, recurring.title);
                        }
                      }}
                      className="bg-brutal-red text-brutal-bg border-2 border-brutal-red px-4 py-2 font-bold text-xs tracking-tight uppercase hover:bg-brutal-fg hover:text-brutal-bg whitespace-nowrap"
                    >
                      DELETE
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Schedule List */}
        {viewMode === 'day' && (
        <div className="border-2 border-brutal-fg p-6">
          <div className="font-mono text-xs tracking-wider text-brutal-fg uppercase mb-4 font-bold">
            DATA / SCHEDULE ({filteredSchedules.length}{searchQuery ? ` OF ${allSchedules.length}` : ''})
          </div>

          {allSchedules.length > 0 && (
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="SEARCH ACTIVITY OR NOTES"
              className="w-full bg-brutal-bg text-brutal-fg border-2 border-brutal-fg p-3 font-mono text-sm mb-4"
            />
          )}

          {selectedIds.size > 0 && (
            <div className="flex items-center justify-between mb-6 border-2 border-brutal-red p-3">
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

          {loading ? (
            <div className="font-mono text-sm text-brutal-fg">◆ LOADING...</div>
          ) : allSchedules.length === 0 ? (
            <div className="bg-brutal-accent text-brutal-fg p-4 font-mono text-xs leading-relaxed">
              <div className="font-bold mb-2">▲ NO SCHEDULE FOUND</div>
              <div>No schedule found for {format(selectedDate, 'dd MMMM yyyy')}.</div>
              <div className="mt-2">Click [ ADD SCHEDULE ] or [ ADD RECURRING ] to get started.</div>
            </div>
          ) : filteredSchedules.length === 0 ? (
            <div className="bg-brutal-accent text-brutal-fg p-4 font-mono text-xs leading-relaxed">
              <div className="font-bold mb-2">▲ NO MATCHES</div>
              <div>No schedule items match your search.</div>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredSchedules.map((item) => (
                <div key={item.id} className="border-2 border-brutal-fg p-4 hover:border-brutal-accent-deep transition-colors">
                  <div className="flex justify-between items-start gap-3">
                    {!item.id.includes('recurring') && (
                      <input
                        type="checkbox"
                        checked={selectedIds.has(item.id)}
                        onChange={() => toggleSelected(item.id)}
                        className="w-5 h-5 border-2 border-brutal-fg cursor-pointer mt-1 shrink-0"
                      />
                    )}
                    <div className="flex-1">
                      <h3 className="font-black text-lg mb-1 tracking-tighter uppercase">{item.title}</h3>
                      <div className="font-mono text-xs tracking-wider mb-2">
                        {item.start_time} → {item.end_time}
                      </div>
                      {item.notes && (
                        <div className="font-mono text-xs text-brutal-fg opacity-70 mt-2">{item.notes}</div>
                      )}
                    </div>
                    {!item.id.includes('recurring') && (
                      <button
                        onClick={() => handleDeleteSchedule(item.id, item.title)}
                        disabled={deletingId === item.id}
                        className="bg-brutal-red text-brutal-bg border-2 border-brutal-red px-3 py-1 font-bold text-xs tracking-tight uppercase hover:bg-brutal-fg hover:text-brutal-bg ml-4 disabled:opacity-50"
                      >
                        {deletingId === item.id ? '...' : 'DEL'}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        )}

        {/* Week Grid */}
        {viewMode === 'week' && (
          <div className="border-2 border-brutal-fg p-6">
            <div className="font-mono text-xs tracking-wider text-brutal-fg uppercase mb-6 font-bold">
              DATA / WEEK
            </div>

            {weekLoading ? (
              <div className="font-mono text-sm text-brutal-fg">◆ LOADING...</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-7 gap-0 border-2 border-brutal-fg">
                {weekDays.map((day, idx) => {
                  const dayHoliday = getHoliday(day, country);
                  const dayWorking = isWorkingDay(day, country, weekendDays);
                  const dayItems = weekItemsByDate(day);
                  const isToday = format(day, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');

                  return (
                    <div
                      key={idx}
                      className={`border-brutal-fg p-3 md:border-r-2 border-b-2 md:border-b-0 last:border-r-0 ${
                        isToday ? 'bg-brutal-accent/20' : ''
                      }`}
                    >
                      <button
                        onClick={() => {
                          setSelectedDate(day);
                          setViewMode('day');
                        }}
                        className="w-full text-left mb-3 border-b-2 border-brutal-fg pb-2 hover:text-brutal-accent-deep"
                      >
                        <div className="font-mono text-xs font-bold tracking-wider">
                          {format(day, 'EEE').toUpperCase()}
                        </div>
                        <div className="font-black text-lg tracking-tighter">
                          {format(day, 'dd')}
                        </div>
                        {dayHoliday && (
                          <div className="font-mono text-[10px] text-brutal-red font-bold mt-1">▲ HOLIDAY</div>
                        )}
                        {!dayWorking && !dayHoliday && (
                          <div className="font-mono text-[10px] text-brutal-accent-deep font-bold mt-1">WEEKEND</div>
                        )}
                      </button>

                      <div className="space-y-2">
                        {dayItems.length === 0 ? (
                          <div className="font-mono text-[10px] text-brutal-fg opacity-50">—</div>
                        ) : (
                          dayItems.map((item) => (
                            <div key={item.id} className="font-mono text-[10px] border-2 border-brutal-fg p-1.5">
                              <div className="font-bold truncate">{item.title}</div>
                              <div className="opacity-70">{item.start_time}</div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
