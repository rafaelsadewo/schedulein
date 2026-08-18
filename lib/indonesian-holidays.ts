export type Country = 'ID' | 'NONE';

export interface Holiday {
  date: Date;
  name: string;
  type: 'national' | 'optional';
}

interface HolidayDef {
  year: number;
  month: number;
  day: number;
  name: string;
  type: 'national' | 'optional';
}

// Indonesian national holidays, 2024-2026.
// Fixed-date holidays (New Year, Labour Day, Pancasila Day, Independence Day,
// Christmas) are exact. Movable religious holidays (Isra Mi'raj, Nyepi, Eid
// al-Fitr, Eid al-Adha, Waisak, etc.) are best-effort dates, not pulled from
// an official government API. "Cuti bersama" (joint leave) days are excluded
// entirely since they are decided year-to-year by government circular and
// cannot be reliably hardcoded.
// ponytail: static best-effort table; swap for an official holiday API if exact dates matter.
const HOLIDAYS_ID: HolidayDef[] = [
  // 2024
  { year: 2024, month: 1, day: 1, name: "New Year's Day", type: 'national' },
  { year: 2024, month: 2, day: 8, name: "Isra Mi'raj", type: 'national' },
  { year: 2024, month: 2, day: 10, name: 'Chinese New Year', type: 'national' },
  { year: 2024, month: 3, day: 11, name: 'Day of Silence (Nyepi)', type: 'national' },
  { year: 2024, month: 3, day: 29, name: 'Good Friday', type: 'national' },
  { year: 2024, month: 4, day: 10, name: 'Eid al-Fitr (Day 1)', type: 'national' },
  { year: 2024, month: 4, day: 11, name: 'Eid al-Fitr (Day 2)', type: 'national' },
  { year: 2024, month: 5, day: 1, name: 'Labour Day', type: 'national' },
  { year: 2024, month: 5, day: 9, name: 'Ascension of Jesus Christ', type: 'national' },
  { year: 2024, month: 5, day: 23, name: 'Waisak Day', type: 'national' },
  { year: 2024, month: 6, day: 1, name: 'Pancasila Day', type: 'national' },
  { year: 2024, month: 6, day: 17, name: 'Eid al-Adha', type: 'national' },
  { year: 2024, month: 7, day: 7, name: 'Islamic New Year', type: 'national' },
  { year: 2024, month: 8, day: 17, name: 'Independence Day', type: 'national' },
  { year: 2024, month: 9, day: 16, name: "Prophet Muhammad's Birthday", type: 'national' },
  { year: 2024, month: 12, day: 25, name: 'Christmas Day', type: 'national' },

  // 2025
  { year: 2025, month: 1, day: 1, name: "New Year's Day", type: 'national' },
  { year: 2025, month: 1, day: 27, name: "Isra Mi'raj", type: 'national' },
  { year: 2025, month: 1, day: 29, name: 'Chinese New Year', type: 'national' },
  { year: 2025, month: 3, day: 29, name: 'Day of Silence (Nyepi)', type: 'national' },
  { year: 2025, month: 3, day: 31, name: 'Eid al-Fitr (Day 1)', type: 'national' },
  { year: 2025, month: 4, day: 1, name: 'Eid al-Fitr (Day 2)', type: 'national' },
  { year: 2025, month: 4, day: 18, name: 'Good Friday', type: 'national' },
  { year: 2025, month: 5, day: 1, name: 'Labour Day', type: 'national' },
  { year: 2025, month: 5, day: 12, name: 'Waisak Day', type: 'national' },
  { year: 2025, month: 5, day: 29, name: 'Ascension of Jesus Christ', type: 'national' },
  { year: 2025, month: 6, day: 1, name: 'Pancasila Day', type: 'national' },
  { year: 2025, month: 6, day: 6, name: 'Eid al-Adha', type: 'national' },
  { year: 2025, month: 6, day: 26, name: 'Islamic New Year', type: 'national' },
  { year: 2025, month: 8, day: 17, name: 'Independence Day', type: 'national' },
  { year: 2025, month: 9, day: 5, name: "Prophet Muhammad's Birthday", type: 'national' },
  { year: 2025, month: 12, day: 25, name: 'Christmas Day', type: 'national' },

  // 2026 (movable dates for the second half of the year are estimates)
  { year: 2026, month: 1, day: 1, name: "New Year's Day", type: 'national' },
  { year: 2026, month: 1, day: 16, name: "Isra Mi'raj", type: 'national' },
  { year: 2026, month: 2, day: 17, name: 'Chinese New Year', type: 'national' },
  { year: 2026, month: 3, day: 19, name: 'Day of Silence (Nyepi)', type: 'national' },
  { year: 2026, month: 4, day: 3, name: 'Good Friday', type: 'national' },
  { year: 2026, month: 4, day: 20, name: 'Eid al-Fitr (Day 1)', type: 'national' },
  { year: 2026, month: 4, day: 21, name: 'Eid al-Fitr (Day 2)', type: 'national' },
  { year: 2026, month: 5, day: 1, name: 'Labour Day', type: 'national' },
  { year: 2026, month: 5, day: 14, name: 'Ascension of Jesus Christ', type: 'national' },
  { year: 2026, month: 5, day: 27, name: 'Eid al-Adha', type: 'national' },
  { year: 2026, month: 5, day: 31, name: 'Waisak Day', type: 'national' },
  { year: 2026, month: 6, day: 1, name: 'Pancasila Day', type: 'national' },
  { year: 2026, month: 6, day: 16, name: 'Islamic New Year', type: 'national' },
  { year: 2026, month: 8, day: 17, name: 'Independence Day', type: 'national' },
  { year: 2026, month: 8, day: 26, name: "Prophet Muhammad's Birthday", type: 'national' },
  { year: 2026, month: 12, day: 25, name: 'Christmas Day', type: 'national' },
];

const HOLIDAYS: Record<Country, HolidayDef[]> = {
  ID: HOLIDAYS_ID,
  NONE: [],
};

export const DEFAULT_WEEKEND_DAYS = [0, 6]; // Sunday, Saturday

export function getHoliday(date: Date, country: Country = 'ID'): Holiday | null {
  const list = HOLIDAYS[country] ?? [];
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();

  const holiday = list.find((h) => h.year === year && h.month === month && h.day === day);
  if (!holiday) return null;

  return { date, name: holiday.name, type: holiday.type };
}

export function isHoliday(date: Date, country: Country = 'ID'): boolean {
  return getHoliday(date, country) !== null;
}

export function isWorkingDay(
  date: Date,
  country: Country = 'ID',
  weekendDays: number[] = DEFAULT_WEEKEND_DAYS
): boolean {
  const isWeekend = weekendDays.includes(date.getDay());
  return !isWeekend && !isHoliday(date, country);
}

export function getHolidaysInMonth(year: number, month: number, country: Country = 'ID'): Holiday[] {
  const list = HOLIDAYS[country] ?? [];
  return list
    .filter((h) => h.year === year && h.month === month)
    .map((h) => ({ date: new Date(year, h.month - 1, h.day), name: h.name, type: h.type }));
}
