'use client';

import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';

type Channel = 'email' | 'push';

interface EventPreferences {
  email: boolean;
  push: boolean;
}

interface PreferencesData {
  eventTypes: string[];
  preferences: Record<string, EventPreferences>;
}

const EVENT_LABELS: Record<string, string> = {
  new_lead: 'New Lead',
  whatsapp_lead: 'WhatsApp Lead',
  corporate_proposal: 'Corporate Proposal',
  status_change: 'Status Change',
  batch_reminder: 'Batch Reminder',
  content_published: 'Content Published',
};

const CHANNEL_LABELS: Record<Channel, string> = {
  email: 'Email',
  push: 'Push',
};

function Toggle({
  checked,
  disabled,
  onChange,
}: {
  checked: boolean;
  disabled: boolean;
  onChange: () => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={onChange}
      className={[
        'relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors',
        'focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-1',
        'disabled:cursor-not-allowed disabled:opacity-60',
        checked ? 'bg-teal-500' : 'bg-gray-300 dark:bg-gray-600',
      ].join(' ')}
    >
      <span
        className={[
          'inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition-transform',
          checked ? 'translate-x-4' : 'translate-x-0',
        ].join(' ')}
      />
    </button>
  );
}

export default function NotificationPreferencesPanel() {
  const [data, setData] = useState<PreferencesData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<Record<string, boolean>>({});
  const [cellMsg, setCellMsg] = useState<Record<string, 'ok' | 'err'>>({});

  useEffect(() => {
    fetch('/api/admin/notification-preferences')
      .then((r) => r.json())
      .then((d: PreferencesData) => setData(d))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function toggle(eventType: string, channel: Channel) {
    if (!data) return;
    const key = `${eventType}:${channel}`;
    const currentValue = data.preferences[eventType]?.[channel] ?? true;
    const newValue = !currentValue;

    // Optimistic update
    setSaving((p) => ({ ...p, [key]: true }));
    setCellMsg((p) => ({ ...p, [key]: 'ok' }));
    setData((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        preferences: {
          ...prev.preferences,
          [eventType]: { ...(prev.preferences[eventType] ?? { email: true, push: true }), [channel]: newValue },
        },
      };
    });

    try {
      const res = await fetch('/api/admin/notification-preferences', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventType, channel, value: newValue }),
      });
      if (!res.ok) throw new Error('save failed');
      setTimeout(() => setCellMsg((p) => ({ ...p, [key]: 'ok' })), 1200);
    } catch {
      // Revert on failure
      setData((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          preferences: {
            ...prev.preferences,
            [eventType]: { ...(prev.preferences[eventType] ?? { email: true, push: true }), [channel]: currentValue },
          },
        };
      });
      setCellMsg((p) => ({ ...p, [key]: 'err' }));
    } finally {
      setSaving((p) => ({ ...p, [key]: false }));
      setTimeout(() => setCellMsg((p) => { const next = { ...p }; delete next[key]; return next; }), 2000);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-gray-400 dark:text-gray-500 py-2">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading preferences…
      </div>
    );
  }

  if (!data || data.eventTypes.length === 0) {
    return (
      <p className="text-sm text-gray-400 dark:text-gray-500 py-2">
        No notification types available for your role.
      </p>
    );
  }

  const channels: Channel[] = ['email', 'push'];

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="border-b border-gray-200 dark:border-gray-700">
            <th className="pb-2.5 pr-6 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
              Event
            </th>
            <th className="pb-2.5 px-4 text-center text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
              In-App
            </th>
            {channels.map((ch) => (
              <th
                key={ch}
                className="pb-2.5 px-4 text-center text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400"
              >
                {CHANNEL_LABELS[ch]}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 dark:divide-gray-700/50">
          {data.eventTypes.map((eventType) => {
            const prefs = data.preferences[eventType] ?? { email: true, push: true };
            return (
              <tr key={eventType} className="hover:bg-gray-50 dark:hover:bg-gray-700/20">
                <td className="py-3 pr-6 font-medium text-gray-800 dark:text-gray-200">
                  {EVENT_LABELS[eventType] ?? eventType}
                </td>
                {/* In-App — always on, not toggleable */}
                <td className="py-3 px-4 text-center">
                  <span
                    title="In-app notifications are always on"
                    className="inline-flex h-5 w-9 items-center justify-center rounded-full bg-teal-100 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400 text-[10px] font-semibold"
                  >
                    ON
                  </span>
                </td>
                {channels.map((channel) => {
                  const key = `${eventType}:${channel}`;
                  const val = prefs[channel];
                  const isSaving = saving[key] ?? false;
                  const msg = cellMsg[key];
                  return (
                    <td key={channel} className="py-3 px-4 text-center">
                      <div className="inline-flex items-center gap-1.5">
                        <Toggle
                          checked={val}
                          disabled={isSaving}
                          onChange={() => toggle(eventType, channel)}
                        />
                        {isSaving && <Loader2 className="h-3 w-3 animate-spin text-gray-400 dark:text-gray-500" />}
                        {!isSaving && msg === 'ok' && (
                          <span className="text-[10px] font-medium text-teal-600 dark:text-teal-400">✓</span>
                        )}
                        {!isSaving && msg === 'err' && (
                          <span className="text-[10px] font-medium text-red-500">✗</span>
                        )}
                      </div>
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
      <p className="mt-3 text-xs text-gray-400 dark:text-gray-500">
        In-App notifications are always on and cannot be disabled. Changes to Email and Push take effect immediately.
      </p>
    </div>
  );
}
