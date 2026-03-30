'use client';
import { useNotifications } from '@/src/hooks/useNotifications';
import { Notification } from '@shared-types';
import { Bell, Trash2, Check } from 'lucide-react';
import { useState } from 'react';

export function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const { notifications, unread, markAsRead, markAllAsRead, deleteNotification, isMarkingAsRead } =
    useNotifications();

  const formatTime = (createdAt: string) => {
    const date = new Date(createdAt);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative rounded-lg border border-brand-line bg-brand-cream p-2 text-brand-ink hover:bg-brand-cream-soft transition"
      >
        <Bell className="w-6 h-6" />
        {unread > 0 && (
          <span className="absolute top-0 right-0 inline-flex -translate-y-1/2 translate-x-1/2 items-center justify-center rounded-full bg-brand-rose px-2 py-1 text-xs font-bold leading-none text-brand-ink">
            {unread > 99 ? '99+' : unread}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 max-h-96 w-80 overflow-y-auto rounded-lg border border-brand-line bg-brand-cream shadow-lg z-50">
          <div className="flex items-center justify-between border-b border-brand-line p-4">
            <h3 className="font-semibold text-brand-ink">Notifications</h3>
            {unread > 0 && (
              <button
                onClick={() => markAllAsRead()}
                className="rounded px-2 py-1 text-xs text-brand-ink-soft hover:bg-brand-cream-soft transition"
              >
                Mark all as read
              </button>
            )}
          </div>

          {notifications.length === 0 ? (
            <div className="p-8 text-center">
              <Bell className="mx-auto mb-2 h-12 w-12 text-brand-ink-soft" />
              <p className="text-brand-ink-soft">No notifications yet</p>
            </div>
          ) : (
            <div className="divide-y divide-brand-line">
              {notifications.map((notification: Notification) => (
                <div
                  key={notification._id}
                  className="cursor-pointer border-l-2 border-brand-line bg-brand-cream-soft/60 p-3 transition hover:bg-brand-cream-soft"
                >
                  <div className="flex items-start gap-2">
                    <div className="flex-1">
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="text-sm font-medium text-brand-ink">
                            {notification.title}
                          </h4>
                          <p className="mt-1 text-xs text-brand-ink-soft">{notification.message}</p>
                        </div>
                        {!notification.read && (
                          <div className="mt-1 h-2 w-2 shrink-0 rounded-full bg-brand-rose" />
                        )}
                      </div>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-xs text-brand-ink-soft">
                          {formatTime(notification.createdAt)}
                        </span>
                        <div className="flex gap-1">
                          {!notification.read && (
                            <button
                              onClick={() => markAsRead(notification._id)}
                              className="rounded p-1 text-brand-ink-soft hover:bg-brand-cream hover:text-brand-ink transition"
                              disabled={isMarkingAsRead}
                            >
                              <Check className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={() => deleteNotification(notification._id)}
                            className="rounded p-1 text-brand-ink-soft hover:bg-brand-cream hover:text-brand-danger transition"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
