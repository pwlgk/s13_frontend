// src/app/layout.tsx
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Providers } from '@/components/providers'; // Мы создадим его на следующем шаге
import '@/app/globals.css'; // Путь теперь всегда будет таким

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: "Расписание ОмГУ",
  description: "Веб-приложение для просмотра расписания ОмГУ",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // Мы НЕ делаем этот компонент async
    <html lang="ru" suppressHydrationWarning>
      <body className={inter.className}>
        {/* Вся магия будет происходить в Providers */}
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}