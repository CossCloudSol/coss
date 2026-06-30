'use client';

export default function TestNotificationButton() {
  return (
    <button
      onClick={async () => {
        await fetch('/api/admin/notifications/test', { method: 'POST' });
      }}
      className="text-xs px-3 py-1.5 rounded-lg bg-[#fef3c7] text-[#92400e] border border-[#fde68a]"
    >
      Create test notification (dev only)
    </button>
  );
}
