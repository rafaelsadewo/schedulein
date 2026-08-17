'use client';

import { useEffect, useState } from 'react';
import { format, addDays, parseISO } from 'date-fns';
import { id } from 'date-fns/locale';
import Navbar from '@/components/Navbar';
import { createClient } from '@/lib/supabase';

interface ScheduleItem {
  id: string;
  title: string;
  date: string;
  start_time: string;
  end_time: string;
  notes: string | null;
  created_at: string;
}

export default function JadwalPage() {
  const [schedules, setSchedules] = useState<ScheduleItem[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:00');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const dateStr = format(selectedDate, 'yyyy-MM-dd');

  useEffect(() => {
    fetchSchedules();
  }, [selectedDate]);

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
    } else {
      setTitle('');
      setStartTime('09:00');
      setEndTime('10:00');
      setNotes('');
      setShowForm(false);
      fetchSchedules();
    }
  };

  const handleDeleteSchedule = async (id: string) => {
    const { error } = await supabase
      .from('schedule_items')
      .delete()
      .eq('id', id);

    if (error) {
      console.error(error);
    } else {
      fetchSchedules();
    }
  };

  return (
    <div>
      <Navbar />

      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-6 text-pastel-green-dark">Jadwal Harian</h1>

          <div className="flex gap-4 mb-6">
            <button
              onClick={() => setSelectedDate(addDays(selectedDate, -1))}
              className="px-4 py-2 bg-pastel-green hover:bg-pastel-green-dark text-white rounded-lg transition"
            >
              ← Kemarin
            </button>

            <div className="flex-1 text-center">
              <p className="text-xl font-semibold text-pastel-green-dark">
                {format(selectedDate, 'EEEE, dd MMMM yyyy', { locale: id })}
              </p>
            </div>

            <button
              onClick={() => setSelectedDate(addDays(selectedDate, 1))}
              className="px-4 py-2 bg-pastel-green hover:bg-pastel-green-dark text-white rounded-lg transition"
            >
              Besok →
            </button>
          </div>

          <button
            onClick={() => setShowForm(!showForm)}
            className="px-6 py-2 bg-green-500 hover:bg-green-600 text-white font-semibold rounded-lg transition"
          >
            + Tambah Jadwal
          </button>
        </div>

        {showForm && (
          <div className="bg-white p-6 rounded-lg shadow-md mb-8">
            <form onSubmit={handleAddSchedule} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Aktivitas</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  className="w-full px-4 py-2 border border-pastel-green rounded-lg focus:ring-2 focus:ring-pastel-green-dark focus:outline-none"
                  placeholder="Misal: Meeting, Olahraga, Makan"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Jam Mulai</label>
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full px-4 py-2 border border-pastel-green rounded-lg focus:ring-2 focus:ring-pastel-green-dark focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Jam Selesai</label>
                  <input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full px-4 py-2 border border-pastel-green rounded-lg focus:ring-2 focus:ring-pastel-green-dark focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Catatan (Opsional)</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-4 py-2 border border-pastel-green rounded-lg focus:ring-2 focus:ring-pastel-green-dark focus:outline-none"
                  placeholder="Tambahkan catatan..."
                  rows={3}
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

        <div className="space-y-4">
          {loading ? (
            <p className="text-center text-gray-600">Loading...</p>
          ) : schedules.length === 0 ? (
            <p className="text-center text-gray-600 py-8">Belum ada jadwal untuk hari ini</p>
          ) : (
            schedules.map((item) => (
              <div key={item.id} className="bg-white p-4 rounded-lg shadow-md">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-semibold text-pastel-green-dark">{item.title}</h3>
                    <p className="text-sm text-gray-600">
                      {item.start_time} - {item.end_time}
                    </p>
                    {item.notes && <p className="text-sm text-gray-700 mt-2">{item.notes}</p>}
                  </div>
                  <button
                    onClick={() => handleDeleteSchedule(item.id)}
                    className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded transition"
                  >
                    Hapus
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  );
}
