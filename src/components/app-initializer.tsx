// src/components/app-initializer.tsx
"use client";

import dynamic from 'next/dynamic';
import { FullscreenLoader } from './fullscreen-loader'; // <-- Импортируем наш новый компонент

const AppContentWithNoSSR = dynamic(
  () => import('./app-content').then((mod) => mod.AppContent),
  { 
    ssr: false,
    // Используем наш новый стилизованный лоадер
    loading: () => <FullscreenLoader text="Загрузка приложения..." />,
  }
);

export function AppInitializer({ children }: { children: React.ReactNode }) {
    return <AppContentWithNoSSR>{children}</AppContentWithNoSSR>
}