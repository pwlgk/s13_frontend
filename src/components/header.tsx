"use client";

import Link from "next/link";
import { LogoIcon } from "@/components/icons/logo-icon";

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 max-w-screen-2xl items-center justify-center">
        <Link href="/" className="flex items-center justify-center">
          <LogoIcon className="h-10 w-10 text-foreground rounded-full" />
        </Link>
      </div>
    </header>
  );
}
