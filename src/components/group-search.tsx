// src/components/group-search.tsx
"use client";

import { useState, useEffect, Fragment } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useInView } from "react-intersection-observer";
import { api } from "@/lib/api";
import { Command, CommandInput, CommandItem, CommandList, CommandEmpty } from "@/components/ui/command";
import { Check, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

// Определяем типы для лучшей автодополняемости и безопасности
interface Group {
  id: number;
  name: string;
}
interface PaginatedGroupsResponse {
  items: Group[];
  page: number;
  size: number;
  total: number;
}
interface GroupSearchProps {
  onGroupSelect: (group: Group | null) => void;
}

// 1. Асинхронная функция для загрузки данных, которая принимает номер страницы
const fetchGroups = async (search: string, pageParam = 1): Promise<PaginatedGroupsResponse> => {
  const { data } = await api.get('/api/v1/dicts/groups', {
    params: { search, page: pageParam, size: 20 }, // Загружаем по 20 групп за раз
  });
  return data;
};

// Простой компонент для отображения состояния первоначальной загрузки
function LoadingState() {
    return (
        <div className="p-4 flex items-center justify-center text-sm text-muted-foreground">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Загрузка...
        </div>
    );
}

export function GroupSearch({ onGroupSelect }: GroupSearchProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  
  // 3. Создаем "наблюдателя" для элемента-триггера в конце списка
  const { ref, inView } = useInView();

  // Debounce: ждем 500мс после того, как пользователь перестал печатать
  useEffect(() => {
    const handler = setTimeout(() => {
      // Сбрасываем выбранную группу при изменении поискового запроса
      if(searchQuery !== selectedGroup?.name) {
          setSelectedGroup(null);
          onGroupSelect(null);
      }
      setDebouncedQuery(searchQuery);
    }, 500);
    return () => clearTimeout(handler);
  }, [searchQuery, selectedGroup?.name, onGroupSelect]);

  // 2. Используем useInfiniteQuery для управления пагинацией
  const {
    data,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    status,
  } = useInfiniteQuery({
    queryKey: ['groups', debouncedQuery],
    queryFn: ({ pageParam = 1 }) => fetchGroups(debouncedQuery, pageParam),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      // Вычисляем, есть ли следующая страница
      const totalPages = Math.ceil(lastPage.total / lastPage.size);
      if (lastPage.page < totalPages) {
        return lastPage.page + 1;
      }
      return undefined; // Если больше страниц нет, возвращаем undefined
    },
    enabled: debouncedQuery.length > 1, // Выполняем запрос только если введено 2+ символа
  });

  // 4. Запускаем загрузку следующей страницы, когда триггер становится видимым
  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage]);

  // Обработчик выбора группы из списка
  const handleSelect = (group: Group) => {
    setSelectedGroup(group);
    setSearchQuery(group.name);
    onGroupSelect(group);
  };

  return (
    <Command className="rounded-lg border shadow-md">
      <CommandInput 
        placeholder="Начните вводить номер группы..." 
        value={searchQuery}
        onValueChange={setSearchQuery}
      />
      <CommandList>
        {status === 'pending' && <LoadingState />}
        {status === 'error' && <p className="p-4 text-sm text-destructive">Ошибка: {error.message}</p>}
        
        {status === 'success' && !data.pages[0].items.length && (
            <CommandEmpty>
                {debouncedQuery.length > 1 ? "Группы не найдены." : "Введите минимум 2 символа для поиска."}
            </CommandEmpty>
        )}

        {/* Рендерим группы из всех загруженных страниц */}
        {data?.pages.map((page, i) => (
          <Fragment key={i}>
            {page.items.map((group) => (
              <CommandItem
                key={group.id}
                onSelect={() => handleSelect(group)}
                value={group.name}
              >
                <Check
                  className={cn(
                    "mr-2 h-4 w-4",
                    selectedGroup?.id === group.id ? "opacity-100" : "opacity-0"
                  )}
                />
                {group.name}
              </CommandItem>
            ))}
          </Fragment>
        ))}
        
        {/* 5. Элемент-триггер для загрузки следующей страницы */}
        {hasNextPage && (
          <div ref={ref} className="p-4 flex items-center justify-center text-sm text-muted-foreground">
            {isFetchingNextPage ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Загрузка...
              </>
            ) : (
              // Невидимый элемент, который будет отслеживать IntersectionObserver
              <div className="h-1 w-1" />
            )}
          </div>
        )}
      </CommandList>
    </Command>
  );
}