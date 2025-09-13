// src/components/invalid-environment-screen.tsx
"use client";

import { Globe } from "lucide-react";

export function InvalidEnvironmentScreen() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4 text-center">
      <Globe className="h-16 w-16 text-muted-foreground mb-4" />
      <h1 className="text-2xl font-bold">Ошибка</h1>
      <p className="mt-2 text-muted-foreground max-w-sm">
        Произошла непредвиденная ошибка. Мы уже работаем над ее устранением.
      </p>
    </div>
  );
}