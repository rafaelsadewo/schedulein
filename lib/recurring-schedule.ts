import { addDays, addWeeks, addMonths, format } from 'date-fns';

export type RecurrenceType = 'daily' | 'weekly' | 'monthly';
export type DayOfWeek = 0 | 1 | 2 | 3 | 4 | 5 | 6; // 0 = Sunday, 6 = Saturday

export interface RecurringSchedule {
  id: string;
  title: string;
  start_time: string;
  end_time: string;
  recurrence_type: RecurrenceType;
  days_of_week?: DayOfWeek[]; // for weekly
  end_date?: string; // optional end date
  notes?: string;
}

export interface ExpandedSchedule {
  id: string;
  title: string;
  date: string;
  start_time: string;
  end_time: string;
  notes?: string;
  is_recurring: boolean;
  recurring_id?: string;
}

/**
 * Expand recurring schedule into individual dates
 * @param recurring Recurring schedule configuration
 * @param startDate Start date for expansion
 * @param endDate End date for expansion
 */
export function expandRecurringSchedule(
  recurring: RecurringSchedule,
  startDate: Date,
  endDate: Date
): ExpandedSchedule[] {
  const expanded: ExpandedSchedule[] = [];
  const scheduleEndDate = recurring.end_date ? new Date(recurring.end_date) : endDate;
  let currentDate = new Date(startDate);

  while (currentDate <= endDate && currentDate <= scheduleEndDate) {
    let shouldInclude = false;

    if (recurring.recurrence_type === 'daily') {
      shouldInclude = true;
    } else if (recurring.recurrence_type === 'weekly' && recurring.days_of_week) {
      shouldInclude = recurring.days_of_week.includes(currentDate.getDay() as DayOfWeek);
    } else if (recurring.recurrence_type === 'monthly') {
      shouldInclude = currentDate.getDate() === new Date(startDate).getDate();
    }

    if (shouldInclude) {
      expanded.push({
        id: `${recurring.id}-${format(currentDate, 'yyyy-MM-dd')}`,
        title: recurring.title,
        date: format(currentDate, 'yyyy-MM-dd'),
        start_time: recurring.start_time,
        end_time: recurring.end_time,
        notes: recurring.notes,
        is_recurring: true,
        recurring_id: recurring.id,
      });
    }

    currentDate = addDays(currentDate, 1);
  }

  return expanded;
}

/**
 * Get day name in Indonesian
 */
export function getDayNameId(dayOfWeek: number): string {
  const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  return days[dayOfWeek];
}

/**
 * Format recurrence pattern for display
 */
export function formatRecurrence(recurring: RecurringSchedule): string {
  if (recurring.recurrence_type === 'daily') {
    return 'Setiap hari';
  }

  if (recurring.recurrence_type === 'weekly' && recurring.days_of_week) {
    const dayNames = recurring.days_of_week.map((d) => getDayNameId(d)).join(', ');
    return `Setiap ${dayNames}`;
  }

  if (recurring.recurrence_type === 'monthly') {
    return `Setiap tanggal (bulanan)`;
  }

  return 'Tidak terulang';
}
