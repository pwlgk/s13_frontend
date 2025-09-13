// src/app/not-found.tsx
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { SearchX } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4 text-center">
      <SearchX className="h-16 w-16 text-muted-foreground mb-4" />
      <h1 className="text-4xl font-bold tracking-tight">404</h1>
      <h2 className="text-2xl font-semibold mt-2">Страница не найдена</h2>
      <p className="mt-2 text-muted-foreground max-w-sm">
        К сожалению, страница, которую вы ищете, не существует или была перемещена.
      </p>
      <Button asChild className="mt-6">
        <Link href="/">Вернуться на главную</Link>
      </Button>
    </div>
  );
} 