'use client';

import { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import { ToastContainer, useToast } from '@/components/Toast';

const TIMEZONES = [
  'Asia/Jakarta',
  'Asia/Bangkok',
  'Asia/Singapore',
  'Asia/Hong_Kong',
  'Asia/Manila',
  'UTC',
  'Europe/London',
  'Europe/Paris',
  'America/New_York',
  'America/Los_Angeles',
];

const CURRENCIES = ['IDR', 'USD', 'SGD', 'MYR', 'THB', 'PHP'];

export default function SettingsPage() {
  const { toasts, showToast, removeToast } = useToast();
  const [timezone, setTimezone] = useState('Asia/Jakarta');
  const [currency, setCurrency] = useState('IDR');
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [notificationMinuteBefore, setNotificationMinuteBefore] = useState(30);
  const [autoExportEnabled, setAutoExportEnabled] = useState(true);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Load from localStorage
    const saved = localStorage.getItem('settings');
    if (saved) {
      try {
        const settings = JSON.parse(saved);
        setTimezone(settings.timezone || 'Asia/Jakarta');
        setCurrency(settings.currency || 'IDR');
        setNotificationsEnabled(settings.notificationsEnabled !== false);
        setNotificationMinuteBefore(settings.notificationMinuteBefore || 30);
        setAutoExportEnabled(settings.autoExportEnabled !== false);
      } catch (e) {
        console.error('Error loading settings:', e);
      }
    }
  }, []);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const settings = {
        timezone,
        currency,
        notificationsEnabled,
        notificationMinuteBefore,
        autoExportEnabled,
      };

      localStorage.setItem('settings', JSON.stringify(settings));
      showToast('Settings successfully saved', 'success');
    } catch (error) {
      showToast('Failed to save settings', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-brutal-bg-light text-brutal-fg-light">
      <Navbar />
      <ToastContainer toasts={toasts} onRemove={removeToast} />

      <main className="max-w-4xl mx-auto px-8 py-12 border-l-2 border-r-2 border-brutal-fg-light">
        <h1 className="text-5xl font-black mb-12 tracking-tighter">SETTINGS</h1>

        <form onSubmit={handleSaveSettings} className="space-y-8">
          {/* Timezone Section */}
          <div className="border-2 border-brutal-fg-light p-6">
            <div className="font-mono text-xs tracking-wider font-bold mb-4">TIME / TIMEZONE</div>

            <div>
              <label className="block font-mono text-xs font-bold tracking-wider mb-2">
                YOUR TIMEZONE
              </label>
              <select
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                className="w-full bg-brutal-bg-light text-brutal-fg-light border-2 border-brutal-fg-light p-3 font-mono text-sm"
              >
                {TIMEZONES.map((tz) => (
                  <option key={tz} value={tz}>
                    {tz}
                  </option>
                ))}
              </select>
              <p className="font-mono text-xs text-brutal-fg-light mt-2 opacity-70">
                Used for notifications & timestamps in reports
              </p>
            </div>
          </div>

          {/* Currency Section */}
          <div className="border-2 border-brutal-fg-light p-6">
            <div className="font-mono text-xs tracking-wider font-bold mb-4">MONEY / CURRENCY</div>

            <div>
              <label className="block font-mono text-xs font-bold tracking-wider mb-2">
                CURRENCY
              </label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full bg-brutal-bg-light text-brutal-fg-light border-2 border-brutal-fg-light p-3 font-mono text-sm"
              >
                {CURRENCIES.map((cur) => (
                  <option key={cur} value={cur}>
                    {cur}
                  </option>
                ))}
              </select>
              <p className="font-mono text-xs text-brutal-fg-light mt-2 opacity-70">
                Currency used in financial reports (default: IDR)
              </p>
            </div>
          </div>

          {/* Notifications Section */}
          <div className="border-2 border-brutal-fg-light p-6">
            <div className="font-mono text-xs tracking-wider font-bold mb-4">NOTIFICATIONS / REMINDERS</div>

            <div className="space-y-4">
              <div>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={notificationsEnabled}
                    onChange={(e) => setNotificationsEnabled(e.target.checked)}
                    className="w-5 h-5 border-2 border-brutal-fg-light cursor-pointer"
                  />
                  <span className="font-mono text-sm font-bold">
                    ENABLE SCHEDULE NOTIFICATIONS
                  </span>
                </label>
              </div>

              {notificationsEnabled && (
                <div>
                  <label className="block font-mono text-xs font-bold tracking-wider mb-2">
                    NOTIFY BEFORE SCHEDULE (MINUTES)
                  </label>
                  <input
                    type="number"
                    value={notificationMinuteBefore}
                    onChange={(e) => setNotificationMinuteBefore(parseInt(e.target.value))}
                    min="5"
                    max="120"
                    className="w-full bg-brutal-bg-light text-brutal-fg-light border-2 border-brutal-fg-light p-3 font-mono text-sm"
                  />
                  <p className="font-mono text-xs text-brutal-fg-light mt-2 opacity-70">
                    Example: 30 = notify 30 minutes before schedule starts
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Export Section */}
          <div className="border-2 border-brutal-fg-light p-6">
            <div className="font-mono text-xs tracking-wider font-bold mb-4">EXPORT / REPORTS</div>

            <div>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoExportEnabled}
                  onChange={(e) => setAutoExportEnabled(e.target.checked)}
                  className="w-5 h-5 border-2 border-brutal-fg-light cursor-pointer"
                />
                <span className="font-mono text-sm font-bold">
                  AUTO-EXPORT MONTHLY REPORT
                </span>
              </label>
              <p className="font-mono text-xs text-brutal-fg-light mt-2 opacity-70">
                Report automatically downloaded at the end of each month
              </p>
            </div>
          </div>

          {/* Save Button */}
          <div className="flex gap-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-brutal-fg-light text-brutal-bg-light border-2 border-brutal-fg-light py-3 font-bold uppercase tracking-tight hover:bg-brutal-accent hover:text-brutal-fg-light disabled:opacity-50"
            >
              {loading ? 'SAVING...' : 'SAVE SETTINGS'}
            </button>
          </div>
        </form>

        {/* Info Section */}
        <div className="mt-12 border-2 border-brutal-fg-light p-6 bg-brutal-accent text-brutal-fg-light">
          <div className="font-mono text-xs tracking-wider font-bold mb-2">INFO / ABOUT</div>
          <div className="font-mono text-xs leading-relaxed">
            <p>Schedulein v1.0 - Personal Schedule & Finance Tracker</p>
            <p className="mt-2">Made by Rafael</p>
            <p className="mt-4 opacity-70">
              Settings are saved locally in your browser. Not sent to any server.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
