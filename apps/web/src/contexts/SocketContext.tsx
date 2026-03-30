'use client';

import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { Notification } from '@shared-types';
import { useAuth } from '@/src/hooks/useAuth';

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  notifications: Notification[];
  unreadCount: number;
  addNotification: (notification: Notification) => void;
  markAsRead: (notificationId: string) => void;
  clearNotifications: () => void;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export function SocketProvider({ children }: { children: ReactNode }) {
  const { user, isAuthenticated, isLoading } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (isLoading) {
      return;
    }

    if (!isAuthenticated || !user?.sub) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSocket(null);
       
      setIsConnected(false);
       
      setNotifications([]);
       
      setUnreadCount(0);
      return;
    }

    const userId = user.sub;

    const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
    const socketUrl = apiBaseUrl.replace(/\/api\/?$/, '');
    
    const newSocket = io(socketUrl, {
      query: { userId },
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
      transports: ['websocket', 'polling'],
    });

    newSocket.on('connect', () => {
      console.log('✅ Connected to WebSocket');
      setIsConnected(true);
    });

    newSocket.on('disconnect', () => {
      console.log('❌ Disconnected from WebSocket');
      setIsConnected(false);
    });

    newSocket.on('notification', (notification: Notification) => {
      console.log('📨 New notification:', notification);
      setNotifications((prev) => [notification, ...prev]);
      setUnreadCount((prev) => prev + 1);
    });

    newSocket.on('notification:unread-count', (data: { count: number }) => {
      console.log('📊 Unread count updated:', data.count);
      setUnreadCount(data.count);
    });

    newSocket.on('notification:read', (data: { notificationId: string }) => {
      console.log('✅ Notification marked as read:', data.notificationId);
      setNotifications((prev) =>
        prev.map((notif) =>
          notif._id === data.notificationId ? { ...notif, read: true } : notif,
        ),
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    });

    newSocket.on('error', (error) => {
      console.error('❌ Socket error:', error);
    });

     
    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, [isAuthenticated, isLoading, user?.sub]);

  const addNotification = useCallback((notification: Notification) => {
    setNotifications((prev) => [notification, ...prev]);
    if (!notification.read) {
      setUnreadCount((prev) => prev + 1);
    }
  }, []);

  const markAsRead = useCallback((notificationId: string) => {
    setNotifications((prev) =>
      prev.map((notif) =>
        notif._id === notificationId ? { ...notif, read: true } : notif,
      ),
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));
  }, []);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
    setUnreadCount(0);
  }, []);

  return (
    <SocketContext.Provider
      value={{
        socket,
        isConnected,
        notifications,
        unreadCount,
        addNotification,
        markAsRead,
        clearNotifications,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within SocketProvider');
  }
  return context;
}
