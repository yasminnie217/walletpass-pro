import { Bell } from 'lucide-react';
import type { Notification } from '../types';
import { formatDate } from '../lib/utils';

interface NotificationItemProps {
  notification: Notification;
}

export function NotificationItem({ notification }: NotificationItemProps) {
  return (
    <div className="flex items-start gap-4 p-4 border-b border-gray-100 last:border-0">
      <div
        className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
        style={{ background: '#00704A15' }}
      >
        <Bell size={16} style={{ color: '#00704A' }} />
      </div>
      <div className="flex-1 min-w-0">
        {notification.title && (
          <p className="text-ink font-semibold text-sm truncate">{notification.title}</p>
        )}
        <p className="text-mist text-sm mt-0.5 line-clamp-2">{notification.message}</p>
        <div className="flex items-center gap-3 mt-1.5">
          <span className="text-xs text-mist/70">
            Envoyée à {notification.recipients_count} membre(s)
          </span>
          <span className="text-xs text-mist/50">·</span>
          <span className="text-xs text-mist/70">{formatDate(notification.sent_at)}</span>
        </div>
      </div>
    </div>
  );
}
