// src/components/theme-provider.tsx
"use client"

import * as React from "react"
import { ThemeProvider as NextThemesProvider } from "next-themes"
// Было: import type { ThemeProviderProps } from "next-themes/dist/types"
import type { ThemeProviderProps } from "next-themes" // <-- Стало

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>
}