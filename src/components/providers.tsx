// src/components/providers.tsx
"use client";

import { type ReactNode } from "react";
import { AppInitializer } from "@/components/app-initializer";

export function Providers({ children }: { children: ReactNode }) {
  // Никакой логики, просто рендерим AppInitializer
  return (
      <AppInitializer>
        {children}
      </AppInitializer>
  );
}