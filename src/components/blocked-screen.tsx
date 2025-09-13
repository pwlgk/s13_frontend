// src/components/blocked-screen.tsx
"use client";

import { ShieldAlert } from "lucide-react";
import { useUserStore } from "@/store/user-store";

export function BlockedScreen() {
  const { logout } = useUserStore();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4 text-center">
      <ShieldAlert className="h-16 w-16 text-destructive mb-4" />
      <h1 className="text-2xl font-bold">Доступ заблокирован</h1>
      <p className="mt-2 text-muted-foreground max-w-sm">
        Ваш аккаунт был заблокирован администратором. Пожалуйста, свяжитесь с поддержкой для выяснения причин.
      </p>
      <button 
        onClick={logout}
        className="mt-6 text-sm text-muted-foreground underline"
      >
        Очистить данные
      </button>
    </div>
  );
}