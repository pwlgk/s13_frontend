// src/hooks/use-telegram-back-button.ts
"use client";

import { useEffect } from "react";
import { useBackButton } from "@tma.js/sdk-react";
import { useRouter, usePathname } from "next/navigation";

// Флаг, чтобы избежать двойной инициализации (особенность React 18 Strict Mode)
let isBackButtonInitialized = false;

export function useTelegramBackButton(isVisible: boolean) {
  const backButton = useBackButton();
  const router = useRouter();

  useEffect(() => {
    const handleBack = () => {
      router.back();
    };

    if (isVisible) {
      // Показываем кнопку и вешаем обработчик, только если это не было сделано ранее
      if (!isBackButtonInitialized) {
        backButton.show();
        backButton.on('click', handleBack);
        isBackButtonInitialized = true;
      }
    } else {
      // Скрываем кнопку и убираем обработчик
      backButton.hide();
      backButton.off('click', handleBack);
      isBackButtonInitialized = false;
    }

    // Финальная очистка при размонтировании компонента
    return () => {
      backButton.off('click', handleBack);
      // Не скрываем кнопку здесь, чтобы она не "моргала" при переходах
    };
  }, [isVisible, router, backButton]);
}

// Новый хук-обертка, который содержит всю логику
export function useManageTelegramBackButton() {
    const pathname = usePathname();
    // Кнопка должна быть видна на всех страницах, кроме главной
    const shouldBeVisible = pathname !== '/';

    // Вызываем наш основной хук с вычисленным состоянием
    useTelegramBackButton(shouldBeVisible);
}