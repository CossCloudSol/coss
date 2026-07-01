'use client';

import { useEffect, useRef, useState } from 'react';
import { Bell, BellOff, Loader2 } from 'lucide-react';

type PushState = 'unsupported' | 'loading' | 'granted' | 'denied' | 'default';

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const output = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) {
    output[i] = rawData.charCodeAt(i);
  }
  return output;
}

export default function PushNotificationPanel() {
  const [state, setState] = useState<PushState>('loading');
  const [subscribed, setSubscribed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  // Remember denial so we don't nag again this session
  const deniedThisSession = useRef(false);

  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator) || !('PushManager' in window)) {
      setState('unsupported');
      return;
    }

    // Check current permission state
    const perm = Notification.permission as NotificationPermission;
    if (perm === 'denied') {
      deniedThisSession.current = true;
      setState('denied');
      return;
    }

    // Check if already subscribed
    navigator.serviceWorker.ready
      .then((reg) => reg.pushManager.getSubscription())
      .then((sub) => {
        setSubscribed(sub !== null);
        setState(perm === 'granted' ? 'granted' : 'default');
      })
      .catch(() => setState('default'));
  }, []);

  async function handleEnable() {
    if (deniedThisSession.current) return;
    setBusy(true);
    setMsg('');
    try {
      const permission = await Notification.requestPermission();
      if (permission === 'denied') {
        deniedThisSession.current = true;
        setState('denied');
        setMsg('Permission denied. Enable notifications in your browser settings.');
        return;
      }
      if (permission !== 'granted') {
        setState('default');
        return;
      }
      setState('granted');

      const reg = await navigator.serviceWorker.ready;
      const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!vapidKey) throw new Error('VAPID public key not configured');

      const subscription = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey).buffer as ArrayBuffer,
      });

      const json = subscription.toJSON();
      await fetch('/api/admin/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          endpoint: subscription.endpoint,
          p256dh: json.keys?.p256dh ?? '',
          auth: json.keys?.auth ?? '',
          userAgent: navigator.userAgent,
        }),
      });

      setSubscribed(true);
      setMsg('Push notifications enabled for this browser.');
    } catch (err) {
      setMsg(err instanceof Error ? err.message : 'Failed to enable push notifications.');
    } finally {
      setBusy(false);
    }
  }

  async function handleDisable() {
    setBusy(true);
    setMsg('');
    try {
      const reg = await navigator.serviceWorker.ready;
      const subscription = await reg.pushManager.getSubscription();
      if (subscription) {
        await fetch('/api/admin/push/unsubscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ endpoint: subscription.endpoint }),
        });
        await subscription.unsubscribe();
      }
      setSubscribed(false);
      setMsg('Push notifications disabled for this browser.');
    } catch (err) {
      setMsg(err instanceof Error ? err.message : 'Failed to disable push notifications.');
    } finally {
      setBusy(false);
    }
  }

  if (state === 'loading') {
    return (
      <div className="flex items-center gap-2 text-sm text-gray-400 dark:text-gray-500 py-2">
        <Loader2 className="h-4 w-4 animate-spin" />
        Checking push status…
      </div>
    );
  }

  if (state === 'unsupported') {
    return (
      <p className="text-sm text-gray-400 dark:text-gray-500 py-2">
        Push notifications are not supported in this browser.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-4">
        {subscribed ? (
          <>
            <span className="flex items-center gap-1.5 text-sm font-medium text-teal-600 dark:text-teal-400">
              <Bell className="h-4 w-4" />
              Push enabled on this browser
            </span>
            <button
              type="button"
              onClick={handleDisable}
              disabled={busy}
              className="flex items-center gap-1.5 rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-1.5 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
            >
              {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <BellOff className="h-3.5 w-3.5" />}
              Disable
            </button>
          </>
        ) : state === 'denied' ? (
          <div className="flex items-center gap-2 text-sm text-amber-600 dark:text-amber-400">
            <BellOff className="h-4 w-4 shrink-0" />
            <span>
              Notifications blocked. To enable, click the lock icon in your browser&rsquo;s address bar and allow notifications, then reload.
            </span>
          </div>
        ) : (
          <button
            type="button"
            onClick={handleEnable}
            disabled={busy}
            className="flex items-center gap-2 rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-700 disabled:opacity-60"
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Bell className="h-4 w-4" />}
            Enable push notifications
          </button>
        )}
      </div>

      {msg && (
        <p className={`text-xs ${msg.startsWith('Push notifications enabled') ? 'text-teal-600 dark:text-teal-400' : 'text-amber-600 dark:text-amber-400'}`}>
          {msg}
        </p>
      )}

      <p className="text-xs text-gray-400 dark:text-gray-500">
        Instant browser alerts for new leads and corporate proposals — even when the admin tab is in the background.
        Per-browser: enable separately on each device you use.
      </p>
    </div>
  );
}
