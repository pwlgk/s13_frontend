// src/components/tutor-search.tsx
"use client";

import { useState, useEffect, Fragment } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useInView } from "react-intersection-observer";
import { api } from "@/lib/api";
import { Command, CommandInput, CommandItem, CommandList, CommandEmpty } from "@/components/ui/command";
import { Check, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

// Типы
interface Tutor { 
  id: number; 
  name: string; 
}
interface PaginatedTutorsResponse { 
  items: Tutor[]; 
  page: number; 
  size: number; 
  total: number; 
}
interface TutorSearchProps { 
  onTutorSelect: (tutor: Tutor | null) => void; 
}

// Функция для загрузки списка преподавателей
const fetchTutors = async (search: string, pageParam = 1): Promise<PaginatedTutorsResponse> => {
  const { data } = await api.get('/api/v1/dicts/tutors', { 
    params: { search, page: pageParam, size: 20 } 
  });
  return data;
};

// ПРАВИЛЬНАЯ РЕАЛИЗАЦИЯ LoadingState
// Это компонент React, который возвращает JSX
function LoadingState() {
    return (
        <div className="p-4 flex items-center justify-center text-sm text-muted-foreground">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Загрузка...
        </div>
    );
}

export function TutorSearch({ onTutorSelect }: TutorSearchProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [selectedTutor, setSelectedTutor] = useState<Tutor | null>(null);
  const { ref, inView } = useInView();

  // Debounce (задержка) для поискового запроса
  useEffect(() => {
    const handler = setTimeout(() => { 
      setDebouncedQuery(searchQuery); 
    }, 500);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  // Hook для бесконечной загрузки
  const { 
    data, 
    error,
    fetchNextPage, 
    hasNextPage, 
    isFetchingNextPage, 
    status 
  } = useInfiniteQuery({
    queryKey: ['tutors', debouncedQuery],
    queryFn: ({ pageParam = 1 }) => fetchTutors(debouncedQuery, pageParam),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      const totalPages = Math.ceil(lastPage.total / lastPage.size);
      return lastPage.page < totalPages ? lastPage.page + 1 : undefined;
    },
    enabled: debouncedQuery.length > 1,
  });

  // Hook для отслеживания скролла
  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) { 
      fetchNextPage(); 
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage]);

  // Обработчик выбора преподавателя
  const handleSelect = (tutor: Tutor) => {
    setSelectedTutor(tutor);
    setSearchQuery(tutor.name);
    onTutorSelect(tutor);
  };

  return (
    <Command className="rounded-lg border shadow-md">
      <CommandInput 
        placeholder="Начните вводить фамилию преподавателя..." 
        value={searchQuery}
        onValueChange={setSearchQuery}
      />
      <CommandList>
        {status === 'pending' && <LoadingState />}
        {status === 'error' && <p className="p-4 text-sm text-destructive">Ошибка: {error.message}</p>}
        {status === 'success' && !data.pages[0].items.length && (
            <CommandEmpty>
                {debouncedQuery.length > 1 ? "Преподаватель не найден." : "Введите минимум 2 символа для поиска."}
            </CommandEmpty>
        )}
        
        {data?.pages.map((page, i) => (
          <Fragment key={i}>
            {page.items.map((tutor) => (
              <CommandItem key={tutor.id} onSelect={() => handleSelect(tutor)} value={tutor.name}>
                <Check className={cn("mr-2 h-4 w-4", selectedTutor?.id === tutor.id ? "opacity-100" : "opacity-0")} />
                {tutor.name}
              </CommandItem>
            ))}
          </Fragment>
        ))}
        
        {hasNextPage && ( 
            <div ref={ref} className="p-4 flex items-center justify-center text-sm text-muted-foreground">
                {isFetchingNextPage ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Загрузка...</>
                ) : ( 
                    <div className="h-1 w-1" />
                )}
            </div> 
        )}
      </CommandList>
    </Command>
  );
}