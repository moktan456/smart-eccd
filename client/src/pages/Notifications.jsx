import { useEffect } from 'react';
import useNotificationStore from '../store/notificationStore';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import { formatRelative } from '../utils/helpers';

const typeColor = {
  ACTIVITY_ASSIGNED: 'bg-blue-100 text-blue-800',
  PERFORMANCE_RECORDED: 'bg-green-100 text-green-800',
  ATTENDANCE_MARKED: 'bg-yellow-100 text-yellow-800',
  MESSAGE_RECEIVED: 'bg-purple-100 text-purple-800',
  FLAG_RAISED: 'bg-red-100 text-red-800',
  REPORT_READY: 'bg-gray-100 text-gray-700',
  ANNOUNCEMENT: 'bg-orange-100 text-orange-800',
};

const Notifications = () => {
  const { notifications, unreadCount, fetch, markAllRead, markRead } = useNotificationStore();
  useEffect(() => { fetch(); }, []);

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Notifications {unreadCount > 0 && <span className="ml-2 text-sm bg-red-100 text-red-700 px-2 py-0.5 rounded-full">{unreadCount}</span>}</h1>
        {unreadCount > 0 && <Button variant="secondary" size="sm" onClick={markAllRead}>Mark all read</Button>}
      </div>
      <Card>
        {notifications.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No notifications.</p>
        ) : notifications.map(n => (
          <div key={n.id} onClick={() => !n.isRead && markRead(n.id)}
            className={`p-4 border-b border-gray-100 last:border-0 cursor-pointer hover:bg-gray-50 transition-colors ${!n.isRead ? 'bg-blue-50/50' : ''}`}>
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${typeColor[n.type] || 'bg-gray-100 text-gray-700'}`}>{n.type?.replace(/_/g, ' ')}</span>
                  {!n.isRead && <span className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0" />}
                </div>
                <p className="text-sm font-medium text-gray-900">{n.title}</p>
                <p className="text-sm text-gray-600">{n.message}</p>
              </div>
              <span className="text-xs text-gray-400 flex-shrink-0">{formatRelative(n.createdAt)}</span>
            </div>
          </div>
        ))}
      </Card>
    </div>
  );
};
export default Notifications;
