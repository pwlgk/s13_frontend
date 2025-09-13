// src/app/error.tsx
"use client"; // Компоненты ошибок ОБЯЗАТЕЛЬНО должны быть клиентскими

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ServerCrash } from 'lucide-react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Логируем ошибку в систему мониторинга (например, Sentry)
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4 text-center">
      <ServerCrash className="h-16 w-16 text-destructive mb-4" />
      <h1 className="text-2xl font-bold">Что-то пошло не так</h1>
      <p className="mt-2 text-muted-foreground max-w-sm">
        Произошла непредвиденная ошибка. Мы уже работаем над ее устранением.
      </p>
      <Button onClick={() => reset()} className="mt-6">
        Попробовать снова
      </Button>
    </div>
  );
}