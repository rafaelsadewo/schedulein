import { isEqual } from 'date-fns';

export interface Holiday {
  date: Date;
  name: string;
  type: 'national' | 'optional';
}

// Indonesian National Holidays 2024-2026
const HOLIDAYS_2024_2026: Array<{ month: number; day: number; name: string; type: 'national' | 'optional' }> = [
  // 2024
  { month: 1, day: 1, name: 'Tahun Baru', type: 'national' },
  { month: 2, day: 8, name: 'Isra Mi\'raj', type: 'national' },
  { month: 2, day: 14, name: 'Hari Valentine', type: 'optional' },
  { month: 3, day: 11, name: 'Nyepi', type: 'national' },
  { month: 3, day: 29, name: 'Jumat Agung', type: 'national' },
  { month: 3, day: 30, name: 'Sabtu Paskah', type: 'optional' },
  { month: 3, day: 31, name: 'Paskah', type: 'national' },
  { month: 4, day: 10, name: 'Idul Fitri (Hari Pertama)', type: 'national' },
  { month: 4, day: 11, name: 'Idul Fitri (Hari Kedua)', type: 'national' },
  { month: 4, day: 12, name: 'Cuti Bersama Idul Fitri', type: 'national' },
  { month: 4, day: 13, name: 'Cuti Bersama Idul Fitri', type: 'national' },
  { month: 5, day: 1, name: 'Hari Buruh', type: 'national' },
  { month: 5, day: 23, name: 'Idul Adha', type: 'national' },
  { month: 6, day: 1, name: 'Tahun Baru Hijriah', type: 'optional' },
  { month: 6, day: 3, name: 'Mawlid Nabi Muhammad', type: 'optional' },
  { month: 8, day: 17, name: 'Hari Kemerdekaan Indonesia', type: 'national' },
  { month: 8, day: 20, name: 'Cuti Bersama', type: 'optional' },
  { month: 9, day: 16, name: 'Hari Raya Idul Adha (Hari Libur)', type: 'optional' },
  { month: 11, day: 1, name: 'Hari Sumpah Pemuda', type: 'optional' },
  { month: 12, day: 25, name: 'Hari Raya Natal', type: 'national' },
  { month: 12, day: 26, name: 'Cuti Bersama', type: 'optional' },

  // 2025
  { month: 1, day: 1, name: 'Tahun Baru', type: 'national' },
  { month: 1, day: 29, name: 'Isra Mi\'raj', type: 'national' },
  { month: 2, day: 14, name: 'Hari Valentine', type: 'optional' },
  { month: 3, day: 31, name: 'Nyepi', type: 'national' },
  { month: 4, day: 18, name: 'Jumat Agung', type: 'national' },
  { month: 4, day: 20, name: 'Paskah', type: 'national' },
  { month: 4, day: 30, name: 'Idul Fitri (Hari Pertama)', type: 'national' },
  { month: 5, day: 1, name: 'Idul Fitri (Hari Kedua)', type: 'national' },
  { month: 5, day: 2, name: 'Cuti Bersama Idul Fitri', type: 'national' },
  { month: 5, day: 3, name: 'Cuti Bersama Idul Fitri', type: 'national' },
  { month: 5, day: 1, name: 'Hari Buruh', type: 'national' },
  { month: 5, day: 13, name: 'Idul Adha', type: 'national' },
  { month: 6, day: 1, name: 'Tahun Baru Hijriah', type: 'optional' },
  { month: 6, day: 3, name: 'Mawlid Nabi Muhammad', type: 'optional' },
  { month: 8, day: 17, name: 'Hari Kemerdekaan Indonesia', type: 'national' },
  { month: 11, day: 1, name: 'Hari Sumpah Pemuda', type: 'optional' },
  { month: 12, day: 25, name: 'Hari Raya Natal', type: 'national' },
  { month: 12, day: 26, name: 'Cuti Bersama', type: 'optional' },

  // 2026
  { month: 1, day: 1, name: 'Tahun Baru', type: 'national' },
  { month: 1, day: 19, name: 'Isra Mi\'raj', type: 'national' },
  { month: 2, day: 14, name: 'Hari Valentine', type: 'optional' },
  { month: 3, day: 21, name: 'Nyepi', type: 'national' },
  { month: 4, day: 10, name: 'Jumat Agung', type: 'national' },
  { month: 4, day: 12, name: 'Paskah', type: 'national' },
  { month: 4, day: 20, name: 'Idul Fitri (Hari Pertama)', type: 'national' },
  { month: 4, day: 21, name: 'Idul Fitri (Hari Kedua)', type: 'national' },
  { month: 4, day: 22, name: 'Cuti Bersama Idul Fitri', type: 'national' },
  { month: 4, day: 23, name: 'Cuti Bersama Idul Fitri', type: 'national' },
  { month: 5, day: 1, name: 'Hari Buruh', type: 'national' },
  { month: 5, day: 3, name: 'Idul Adha', type: 'national' },
  { month: 6, day: 1, name: 'Tahun Baru Hijriah', type: 'optional' },
  { month: 6, day: 3, name: 'Mawlid Nabi Muhammad', type: 'optional' },
  { month: 8, day: 17, name: 'Hari Kemerdekaan Indonesia', type: 'national' },
  { month: 11, day: 1, name: 'Hari Sumpah Pemuda', type: 'optional' },
  { month: 12, day: 25, name: 'Hari Raya Natal', type: 'national' },
  { month: 12, day: 26, name: 'Cuti Bersama', type: 'optional' },
];

export function getHoliday(date: Date): Holiday | null {
  const month = date.getMonth() + 1;
  const day = date.getDate();

  const holiday = HOLIDAYS_2024_2026.find((h) => h.month === month && h.day === day);
  if (!holiday) return null;

  return {
    date,
    name: holiday.name,
    type: holiday.type,
  };
}

export function isHoliday(date: Date): boolean {
  return getHoliday(date) !== null;
}

export function isWorkingDay(date: Date): boolean {
  const dayOfWeek = date.getDay();
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
  const isHolidayDay = isHoliday(date);

  return !isWeekend && !isHolidayDay;
}

export function getHolidaysInMonth(year: number, month: number): Holiday[] {
  return HOLIDAYS_2024_2026.filter((h) => {
    const date = new Date(year, h.month - 1, h.day);
    return h.month === month;
  }).map((h) => ({
    date: new Date(year, h.month - 1, h.day),
    name: h.name,
    type: h.type,
  }));
}
