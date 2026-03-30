import { useSocket } from '@/src/contexts/SocketContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/src/lib/api';

export function useNotifications() {
  const { notifications: socketNotifications, unreadCount, markAsRead } = useSocket();
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      try {
        const response = await api.get('/notifications');
        return response.data;
      } catch (err) {
        console.error('Error fetching notifications:', err);
        return { notifications: [], total: 0, unread: 0 };
      }
    },
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      const response = await api.put(`/notifications/${notificationId}/read`);
      return response.data;
    },
    onSuccess: (_, notificationId) => {
      markAsRead(notificationId);
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      const response = await api.put('/notifications/read-all');
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const deleteNotificationMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      const response = await api.delete(`/notifications/${notificationId}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const deleteAllNotificationsMutation = useMutation({
    mutationFn: async () => {
      const response = await api.delete('/notifications');
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const apiNotifications = data?.notifications || [];
  const mergedNotifications = [...socketNotifications, ...apiNotifications].filter(
    (notification, index, notifications) =>
      notifications.findIndex((n) => n._id === notification._id) === index,
  );

  return {
    notifications: mergedNotifications,
    total: data?.total || 0,
    unread: Math.max(data?.unread ?? 0, unreadCount),
    isLoading,
    error,
    markAsRead: markAsReadMutation.mutate,
    markAllAsRead: markAllAsReadMutation.mutate,
    deleteNotification: deleteNotificationMutation.mutate,
    deleteAll: deleteAllNotificationsMutation.mutate,
    isMarkingAsRead: markAsReadMutation.isPending,
    isMarkingAllAsRead: markAllAsReadMutation.isPending,
    isDeleting: deleteNotificationMutation.isPending,
    isDeletingAll: deleteAllNotificationsMutation.isPending,
  };
}

export function useUnreadCount() {
  const { unreadCount } = useSocket();

  const { data: count } = useQuery({
    queryKey: ['unread-count'],
    queryFn: async () => {
      try {
        const response = await api.get('/notifications/unread-count');
        return response.data;
      } catch (err) {
        console.error('Error fetching unread count:', err);
        return unreadCount;
      }
    },
    refetchInterval: 60000, // Refetch every minute
  });

  return Math.max(unreadCount, count ?? 0);
}
