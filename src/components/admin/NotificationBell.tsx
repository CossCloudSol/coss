'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { createPortal } from 'react-dom';
import {
  Bell,
  UserPlus,
  MessageCircle,
  Building2,
  RefreshCw,
  CalendarClock,
  FileText,
  type LucideIcon,
} from 'lucide-react';

interface NotificationItem {
  id: string;
  type: string;
  title: string;
  body: string;
  link: string | null;
  isRead: boolean;
  createdAt: string;
}

type IconMeta = {
  icon: LucideIcon;
  bg: string;
  color: string;
};

const TYPE_ICON: Record<string, IconMeta> = {
  new_lead: { icon: UserPlus, bg: '#dcfce7', color: '#166534' },
  whatsapp_lead: { icon: MessageCircle, bg: '#dcfce7', color: '#166534' },
  corporate_proposal: { icon: Building2, bg: '#ddf4ff', color: '#0369a1' },
  status_change: { icon: RefreshCw, bg: '#fef3c7', color: '#92400e' },
  batch_reminder: { icon: CalendarClock, bg: '#ede9fe', color: '#5b21b6' },
  content_published: { icon: FileText, bg: '#fce7f3', color: '#9d174d' },
  test: { icon: Bell, bg: '#f1f5f9', color: '#475569' },
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins} minute${mins === 1 ? '' : 's'} ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hour${hrs === 1 ? '' : 's'} ago`;
  const days = Math.floor(hrs / 24);
  if (days === 1) return 'yesterday';
  return `${days} days ago`;
}

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [mounted, setMounted] = useState(false);
  const [clearConfirming, setClearConfirming] = useState(false);
  const clearConfirmTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [dropdownStyle, setDropdownStyle] = useState<{
    top: number;
    left: number;
    right?: number;
    width: number | string;
  }>({ top: 60, left: 16, width: 360 });

  const wrapRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => setMounted(true), []);

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/notifications');
      if (!res.ok) return;
      const data = await res.json();
      setNotifications(data.notifications ?? []);
      setUnreadCount(data.unreadCount ?? 0);
    } catch {
      // non-critical
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 10000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      const target = e.target as Node;
      const outsideWrap = !wrapRef.current?.contains(target);
      const outsideDropdown = !dropdownRef.current?.contains(target);
      if (outsideWrap && outsideDropdown) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  function calculatePosition(bellRect: DOMRect): {
    top: number;
    left: number;
    right?: number;
    width: number | string;
  } {
    const isMobile = window.innerWidth < 480;
    if (isMobile) {
      return { top: bellRect.bottom + 8, left: 12, right: 12, width: 'auto' };
    }
    const dropdownWidth = 360;
    let left = bellRect.right - dropdownWidth;
    if (left < 12) left = 12;
    return { top: bellRect.bottom + 4, left, width: dropdownWidth };
  }

  useEffect(() => {
    if (!open) return;
    function handleResize() {
      if (wrapRef.current) {
        setDropdownStyle(calculatePosition(wrapRef.current.getBoundingClientRect()));
      }
    }
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Reset the "Confirm clear?" state whenever the dropdown closes.
  useEffect(() => {
    if (!open) {
      setClearConfirming(false);
      if (clearConfirmTimeout.current) clearTimeout(clearConfirmTimeout.current);
    }
  }, [open]);

  useEffect(() => {
    return () => {
      if (clearConfirmTimeout.current) clearTimeout(clearConfirmTimeout.current);
    };
  }, []);

  function handleToggle() {
    if (!open && wrapRef.current) {
      setDropdownStyle(calculatePosition(wrapRef.current.getBoundingClientRect()));
    }
    setOpen((p) => !p);
  }

  async function handleMarkAllRead() {
    await fetch('/api/admin/notifications/mark-all-read', { method: 'POST' });
    fetchNotifications();
  }

  async function handleClearAll() {
    const prevNotifications = notifications;
    const prevUnreadCount = unreadCount;
    // Optimistic clear.
    setNotifications([]);
    setUnreadCount(0);
    try {
      const res = await fetch('/api/admin/notifications/clear-all', { method: 'DELETE' });
      if (!res.ok) throw new Error(`Clear failed (${res.status})`);
    } catch {
      // Rollback on failure.
      setNotifications(prevNotifications);
      setUnreadCount(prevUnreadCount);
    }
  }

  function handleClearAllClick() {
    if (!clearConfirming) {
      setClearConfirming(true);
      clearConfirmTimeout.current = setTimeout(() => setClearConfirming(false), 3000);
      return;
    }
    if (clearConfirmTimeout.current) clearTimeout(clearConfirmTimeout.current);
    setClearConfirming(false);
    void handleClearAll();
  }

  async function handleItemClick(item: NotificationItem) {
    if (!item.isRead) {
      await fetch(`/api/admin/notifications/${item.id}/read`, { method: 'POST' });
      fetchNotifications();
    }
    setOpen(false);
  }

  const dropdown = (
    <div
      ref={dropdownRef}
      style={{
        position: 'fixed',
        top: dropdownStyle.top,
        left: dropdownStyle.left,
        right: dropdownStyle.right,
        width: dropdownStyle.width,
        zIndex: 9999,
      }}
      className="max-h-[480px] bg-white dark:bg-[#161b22]
                 border border-[#e2e8f0] dark:border-[#21262d]
                 rounded-2xl shadow-xl overflow-hidden flex flex-col"
    >
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#e2e8f0] dark:border-[#21262d]">
        <span className="text-sm font-medium text-[#0f172a] dark:text-[#e6edf3]">
          Notifications
        </span>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              className="text-xs text-[#024c57] dark:text-[#1b8a6b] font-medium"
            >
              Mark all read
            </button>
          )}
          {unreadCount > 0 && notifications.length > 0 && (
            <span
              className="h-3 w-px bg-[#e2e8f0] dark:bg-[#30363d]"
              aria-hidden="true"
            />
          )}
          {notifications.length > 0 && (
            <button
              onClick={handleClearAllClick}
              className={
                clearConfirming
                  ? 'text-xs font-medium text-red-600 dark:text-red-400'
                  : 'text-xs text-[#024c57] dark:text-[#1b8a6b] font-medium'
              }
            >
              {clearConfirming ? 'Confirm clear?' : 'Clear all'}
            </button>
          )}
        </div>
      </div>

      <div className="overflow-y-auto flex-1">
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
            <Bell className="w-8 h-8 text-[#cbd5e1] dark:text-[#30363d] mb-2" />
            <p className="text-sm text-[#475569] dark:text-[#8b949e]">
              No notifications yet
            </p>
          </div>
        ) : (
          notifications.map((item) => {
            const meta = TYPE_ICON[item.type] ?? TYPE_ICON.test;
            const Icon = meta.icon;

            const content = (
              <div
                onClick={() => handleItemClick(item)}
                className={[
                  'flex gap-3 px-4 py-3 border-b border-[#f1f5f9] dark:border-[#21262d]',
                  'cursor-pointer hover:bg-[#f8fafc] dark:hover:bg-[#1c2128]',
                  !item.isRead ? 'bg-[#eff6ff] dark:bg-[#0d2a1e]' : '',
                ].join(' ')}
              >
                <div
                  className="w-9 h-9 rounded-[10px] flex items-center justify-center flex-shrink-0"
                  style={{ background: meta.bg }}
                >
                  <Icon className="w-4 h-4" style={{ color: meta.color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-[#0f172a] dark:text-[#e6edf3] leading-snug">
                    {item.title}
                  </p>
                  <p className="text-[11px] text-[#475569] dark:text-[#8b949e] leading-snug mt-0.5">
                    {item.body}
                  </p>
                  <p className="text-[10px] text-[#94a3b8] dark:text-[#6e7681] mt-1">
                    {timeAgo(item.createdAt)}
                  </p>
                </div>
                {!item.isRead && (
                  <div className="w-1.5 h-1.5 rounded-full bg-[#024c57] dark:bg-[#1b8a6b] flex-shrink-0 mt-1.5" />
                )}
              </div>
            );

            return item.link ? (
              <Link key={item.id} href={item.link}>
                {content}
              </Link>
            ) : (
              <div key={item.id}>{content}</div>
            );
          })
        )}
      </div>
    </div>
  );

  return (
    <div ref={wrapRef} className="relative">
      <button
        onClick={handleToggle}
        aria-label="Notifications"
        className="relative flex items-center justify-center w-9 h-9 rounded-full
                   bg-white/15 dark:bg-[#21262d] border border-white/35 dark:border-[#30363d]"
      >
        <Bell className="w-4 h-4 text-white dark:text-[#8b949e]" />
        {unreadCount > 0 && (
          <span
            className="absolute -top-1 -right-1 bg-red-600 text-white text-[9px]
                       font-semibold min-w-[16px] h-4 rounded-full flex items-center
                       justify-center px-1 border-2 border-[#024c57] dark:border-[#0d1117]"
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {mounted && open && createPortal(dropdown, document.body)}
    </div>
  );
}
