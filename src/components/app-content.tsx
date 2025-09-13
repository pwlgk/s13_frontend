// src/components/app-content.tsx
"use client";

import { useState, useEffect, type ReactNode } from "react";
import { SDKProvider } from "@tma.js/sdk-react";
import { ThemeProvider } from "@/components/theme-provider";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useUserStore } from '@/store/user-store';
import { api } from '@/lib/api';
import { useTheme } from 'next-themes';
import { useLaunchParams } from '@tma.js/sdk-react';
import { OnboardingScreen } from './onboarding-screen';
import { BlockedScreen } from './blocked-screen';
import { InvalidEnvironmentScreen } from './invalid-environment-screen';
import { FullscreenLoader } from './fullscreen-loader';


// Этот компонент содержит всю логику, которая выполняется ПОСЛЕ
// того, как мы убедились, что находимся на клиенте.
function AppLogic({ children }: { children: ReactNode }) {
  const { user, isLoading, isAuth, setToken, fetchUser } = useUserStore();
  const launchParams = useLaunchParams();
  const { setTheme } = useTheme();
  
  // Состояние, чтобы отслеживать, если initData так и не появился
  const [isInvalidEnv, setIsInvalidEnv] = useState(false);

  useEffect(() => {
    if (launchParams) {
      if(launchParams.themeParams.colorScheme) {
        setTheme(launchParams.themeParams.colorScheme);
      }

      if (isAuth) {
        if (!user) fetchUser();
        return;
      }
      
      if (launchParams.initDataRaw) {
        const authorize = async () => {
          try {
            const response = await api.post('/api/v1/auth/login', { init_data: launchParams.initDataRaw });
            setToken(response.data.access_token);
            await fetchUser();
          } catch (error) {
            console.error('Authorization failed:', error);
            setIsInvalidEnv(true); // Если авторизация падает, возможно, initData невалидный
            useUserStore.setState({ isLoading: false });
          }
        };
        authorize();
      } else {
        // Если launchParams есть, но initDataRaw пустой, значит мы не в Telegram
        setIsInvalidEnv(true);
      }
    }
  }, [launchParams, isAuth, user, setToken, fetchUser, setTheme]);

  // Проверяем на Invalid Env. launchParams может быть null, если SDK еще инициализируется
  if (launchParams === null || isInvalidEnv) {
    return <InvalidEnvironmentScreen />;
  }
  
  if (isLoading || !isAuth) {
    // Используем наш новый лоадер с другим текстом
    return <FullscreenLoader text="Загрузка данных..." />;
  }
  
  if (user?.is_blocked) {
    return <BlockedScreen />;
  }

  if (!user?.group_id) {
    return <OnboardingScreen />;
  }

  return <>{children}</>;
}


// Это главный экспортируемый компонент из этого файла
export function AppContent({ children }: { children: ReactNode }) {
    const [queryClient] = useState(() => new QueryClient());

    return (
        <QueryClientProvider client={queryClient}>
          <SDKProvider>
            <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
              <AppLogic>
                {children}
              </AppLogic>
            </ThemeProvider>
          </SDKProvider>
        </QueryClientProvider>
    )
}