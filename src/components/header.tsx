"use client";

import Image from "next/image";
import Link from "next/link";

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 max-w-screen-2xl items-center justify-center">
        <Link href="/" className="flex items-center justify-center">
          <Image
            src="/logo.jpg" // Путь к вашему логотипу в папке /public
            alt="Логотип приложения"
            width={40}
            height={40}
            className="rounded-full"
          />
        </Link>
      </div>
    </header>
  );
}
