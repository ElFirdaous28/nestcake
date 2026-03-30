'use client';

import { useSocket } from '@/src/contexts/SocketContext';
import { Notification } from '@shared-types';
import { useEffect, useState } from 'react';
import { Bell, X } from 'lucide-react';

interface ToastNotification extends Notification {
  id: string;
}

export function NotificationToast() {
  const { notifications } = useSocket();
  const [displayedToasts, setDisplayedToasts] = useState<ToastNotification[]>([]);

  useEffect(() => {
    if (notifications.length > 0) {
      const latestNotification = notifications[0];
      const toastId = `${latestNotification._id}-${Date.now()}`;

      // eslint-disable-next-line react-hooks/set-state-in-effect
      setDisplayedToasts((prev) => [
        {
          ...latestNotification,
          id: toastId,
        },
        ...prev,
      ]);

      const timeout = setTimeout(() => {
        setDisplayedToasts((prev) => prev.filter((t) => t.id !== toastId));
      }, 5000);

      return () => clearTimeout(timeout);
    }
  }, [notifications]);

  const removeToast = (id: string) => {
    setDisplayedToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-md">
      {displayedToasts.map((toast) => (
        <div
          key={toast.id}
          className="rounded-lg border border-brand-line border-l-2 border-l-brand-rose bg-brand-cream p-4 shadow"
        >
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3 flex-1">
              <Bell className="mt-0.5 h-5 w-5 shrink-0 text-brand-ink-soft" />
              <div className="flex-1">
                <h3 className="font-semibold text-brand-ink">{toast.title}</h3>
                <p className="mt-1 text-sm text-brand-ink-soft">{toast.message}</p>
              </div>
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="shrink-0 text-brand-ink-soft hover:text-brand-ink"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
