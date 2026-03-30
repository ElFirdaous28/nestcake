'use client';

import { Geist, Geist_Mono } from 'next/font/google';
import { AuthProvider } from '@/src/contexts/AuthContext';
import { SocketProvider } from '@/src/contexts/SocketContext';
import { NotificationBell, NotificationToast } from '@/src/components/notifications';
import { useAuth } from '@/src/hooks/useAuth';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/src/lib/queryClient';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

function AuthenticatedNotifications() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading || !isAuthenticated) {
    return null;
  }

  return (
    <>
      <NotificationToast />
      <div className="fixed top-4 right-4 z-40">
        <NotificationBell />
      </div>
    </>
  );
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <SocketProvider>
              <AuthenticatedNotifications />
              {children}
            </SocketProvider>
          </AuthProvider>
        </QueryClientProvider>
      </body>
    </html>
  );
}
