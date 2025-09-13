// src/components/fullscreen-loader.tsx
"use client";

import { Loader2 } from "lucide-react";

interface FullscreenLoaderProps {
  text?: string;
}

export function FullscreenLoader({ text = "Загрузка..." }: FullscreenLoaderProps) {
  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center bg-black text-white">
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      <p className="mt-4 text-muted-foreground">{text}</p>
    </div>
  );
}