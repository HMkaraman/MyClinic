import type { Metadata } from 'next';

import '@/styles/globals.css';

export const metadata: Metadata = {
  title: {
    default: 'MyClinic - نظام إدارة العيادات',
    template: '%s | MyClinic',
  },
  description: 'نظام متكامل لإدارة العيادات الطبية مع الذكاء الاصطناعي',
  icons: {
    icon: '/favicon.ico',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
