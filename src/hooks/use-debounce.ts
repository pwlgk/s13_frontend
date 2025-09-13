// src/hooks/use-debounce.ts
import { useState, useEffect } from 'react';

// Хук, который принимает значение и задержку, и возвращает "отложенное" значение
export default function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    // Устанавливаем таймер, который обновит значение только по истечении задержки
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Очищаем таймер, если значение изменилось (например, пользователь продолжил печатать)
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]); // Эффект перезапускается только если value или delay изменились

  return debouncedValue;
}