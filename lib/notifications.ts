/**
 * Browser notification system for schedule reminders
 */

export interface ScheduleNotification {
  id: string;
  title: string;
  time: string; // HH:MM format
  minutesBefore: number; // Notify X minutes before
}

/**
 * Request notification permission from browser
 */
export async function requestNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) {
    console.log('Browser does not support notifications');
    return false;
  }

  if (Notification.permission === 'granted') {
    return true;
  }

  if (Notification.permission !== 'denied') {
    try {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  }

  return false;
}

/**
 * Send browser notification
 */
export function sendNotification(title: string, options?: NotificationOptions) {
  if ('Notification' in window && Notification.permission === 'granted') {
    try {
      new Notification(title, {
        icon: '/favicon.ico',
        ...options,
      });
    } catch (error) {
      console.error('Error sending notification:', error);
    }
  }
}

/**
 * Check if it's time to notify for a schedule
 * @param scheduleTime Schedule start time (HH:MM format)
 * @param minutesBefore Minutes before the schedule
 */
export function shouldNotify(scheduleTime: string, minutesBefore: number): boolean {
  const now = new Date();
  const [hours, minutes] = scheduleTime.split(':').map(Number);

  const scheduleDate = new Date();
  scheduleDate.setHours(hours, minutes, 0, 0);

  const notifyTime = new Date(scheduleDate.getTime() - minutesBefore * 60 * 1000);

  // Check if current time is within a 1-minute window of notify time
  const timeDiff = Math.abs(now.getTime() - notifyTime.getTime());
  return timeDiff < 60 * 1000;
}

/**
 * Setup notification check for a schedule
 * Returns cleanup function
 */
export function setupScheduleNotification(
  scheduleTitle: string,
  scheduleTime: string,
  minutesBefore: number = 30,
  emailAddress?: string
): () => void {
  const interval = setInterval(() => {
    if (shouldNotify(scheduleTime, minutesBefore)) {
      sendNotification(`Reminder: ${scheduleTitle}`, {
        body: `Schedule "${scheduleTitle}" starts at ${scheduleTime}`,
        tag: `schedule-${scheduleTitle}-${scheduleTime}`,
      });
      if (emailAddress) {
        sendEmailNotification(
          emailAddress,
          `Reminder: ${scheduleTitle}`,
          `Your schedule "${scheduleTitle}" starts at ${scheduleTime}.`
        );
      }
      clearInterval(interval);
    }
  }, 60 * 1000); // Check every minute

  return () => clearInterval(interval);
}

/**
 * Save notification preference to localStorage
 */
export function saveNotificationPreference(enabled: boolean) {
  localStorage.setItem('notifications-enabled', JSON.stringify(enabled));
}

/**
 * Get notification preference from localStorage
 */
export function getNotificationPreference(): boolean {
  const pref = localStorage.getItem('notifications-enabled');
  return pref ? JSON.parse(pref) : false;
}

/**
 * Send email notification (via backend)
 * This would require a backend endpoint
 */
export async function sendEmailNotification(email: string, subject: string, message: string) {
  try {
    const response = await fetch('/api/send-notification', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, subject, message }),
    });
    return response.ok;
  } catch (error) {
    console.error('Error sending email notification:', error);
    return false;
  }
}
