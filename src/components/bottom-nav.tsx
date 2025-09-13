// src/components/bottom-nav.tsx
"use client";

import { Home, Search, BookMarked, User, Shield } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useUserStore } from "@/store/user-store";

export function BottomNav() {
  // Хук usePathname возвращает текущий путь URL, например "/search" или "/profile"
  const pathname = usePathname();
  const { user } = useUserStore();

  // Определяем массив навигационных элементов. Все тексты на русском.
  const navItems = [
    { href: "/", label: "Расписание", icon: Home, exact: true },
    { href: "/search", label: "Поиск", icon: Search },
    { href: "/homework", label: "ДЗ", icon: BookMarked },
    { href: "/profile", label: "Профиль", icon: User },
    // Условно добавляем вкладку "Админ", если пользователь является админом
    ...(user?.is_admin ? [{ href: "/admin", label: "Админ", icon: Shield }] : []),
  ];

  // Динамически определяем класс для сетки в зависимости от количества элементов
  const gridColsClass = `grid-cols-${navItems.length}`;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-10 border-t bg-background">
      {/* 
        Tailwind CSS может не сгенерировать динамический класс `grid-cols-5` по умолчанию.
        Если сетка ломается, откройте `tailwind.config.ts` и добавьте в `safelist`:
        safelist: ['grid-cols-3', 'grid-cols-4', 'grid-cols-5'],
      */}
      <div className={`grid h-16 ${gridColsClass}`}>
        {navItems.map((item) => {
          // Логика определения активной вкладки:
          // - Для главной страницы (exact: true) требуется точное совпадение пути.
          // - для остальных - проверяем, начинается ли путь с href элемента.
          const isActive = item.exact
            ? pathname === item.href
            : pathname.startsWith(item.href);
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center text-sm gap-1 transition-colors ${
                isActive
                  ? "text-primary" // Стиль для активной вкладки
                  : "text-muted-foreground hover:text-primary" // Стиль для неактивной вкладки
              }`}
            >
              <item.icon className="h-6 w-6" />
              {/* <span>{item.label}</span> */}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}