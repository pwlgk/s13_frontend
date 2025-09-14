// src/app/homework/page.tsx
"use client";

import { useState, useEffect, Fragment } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useInView } from "react-intersection-observer";
import { api } from "@/lib/api";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import useDebounce from "@/hooks/use-debounce";

// Импорты для UI и компонентов
import { BottomNav } from "@/components/bottom-nav";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { HomeworkDialog } from "@/components/homework-dialog";
import { CreateHomeworkDialog } from "@/components/create-homework-dialog";
import { HomeworkFilters, HomeworkFiltersState } from "@/components/homework-filters";
import { Loader2, AlertTriangle, BookCheck, PlusCircle } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { SlidersHorizontal } from "lucide-react";
import { Header } from "@/components/header";
// Определяем типы на основе вашей OpenAPI спеки
interface LessonForHomework {
  subject_name: string;
  date: string;
}
interface Author {
  first_name: string | null;
  username: string | null;
}
interface HomeworkWithLesson {
  id: number;
  content: string;
  lesson_source_id: number;
  lesson: LessonForHomework;
  author: Author;
}
interface PaginatedHomeworkResponse {
  items: HomeworkWithLesson[];
  page: number;
  size: number;
  total: number;
}

// Асинхронная функция для загрузки данных с учетом фильтров
const fetchMyHomework = async (pageParam = 1, filters: HomeworkFiltersState): Promise<PaginatedHomeworkResponse> => {
  const { status, week, subject_search } = filters;
  
  const params = {
    page: pageParam,
    size: 4, // Отображаем по 4 карточки за раз
    status: status || undefined,
    week: week || undefined,
    // Отправляем поисковый запрос, только если он длиннее 2 символов
    subject_search: subject_search.length >= 3 ? subject_search : undefined,
  };
  
  const { data } = await api.get('/api/v1/homework/my', { params });
  return data;
};

export default function HomeworkPage() {
  const { ref, inView } = useInView();
  
  // Состояние для всех фильтров
  const [filters, setFilters] = useState<HomeworkFiltersState>({
    status: 'actual', // По умолчанию показываем актуальные задания
    week: null,
    subject_search: "",
  });
  
  // "Отложенное" значение для поисковой строки
  const debouncedSearch = useDebounce(filters.subject_search, 500);

  // Обработчик для изменения фильтров из дочернего компонента
  const handleFiltersChange = (newFilters: Partial<HomeworkFiltersState>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  const {
    data,
    error,
    status,
    fetchNextPage,
    isFetchingNextPage,
    hasNextPage,
  } = useInfiniteQuery({
    // Ключ запроса теперь включает все фильтры. При их изменении, React Query автоматически перезапросит данные.
    queryKey: ['myHomework', filters.status, filters.week, debouncedSearch],
    queryFn: ({ pageParam = 1 }) => fetchMyHomework(pageParam, { ...filters, subject_search: debouncedSearch }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      const totalPages = Math.ceil(lastPage.total / lastPage.size);
      if (lastPage.page < totalPages) {
        return lastPage.page + 1;
      }
      return undefined;
    },
  });

  // Запускаем загрузку следующей страницы, когда триггер становится видимым
  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage]);

  // Объединяем все загруженные элементы в один плоский массив для удобства рендеринга
  const allHomeworks = data?.pages.flatMap(page => page.items) ?? [];

  return (
    <div className="flex flex-col">
      <Header />
      <main className="flex-1 overflow-y-auto pb-20">
        <div className="container mx-auto max-w-2xl p-4 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold tracking-tight">Домашние задания</h2> 
              {/* <p className="text-muted-foreground">Поиск и фильтрация заданий для вашей группы.</p> */}
            </div>
            <CreateHomeworkDialog>
              <Button>
                <PlusCircle className="mr-2 h-4 w-4" />
                Добавить
              </Button>
            </CreateHomeworkDialog>
          </div>

<Accordion type="single" collapsible className="w-full">
            <AccordionItem value="filters">
              <AccordionTrigger>
                <div className="flex items-center gap-2">
                  <SlidersHorizontal className="h-4 w-4" />
                  <span>Фильтры и поиск</span>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                {/* Наш компонент с фильтрами теперь находится внутри аккордеона */}
                <HomeworkFilters filters={filters} onFiltersChange={handleFiltersChange} />
              </AccordionContent>
            </AccordionItem>
          </Accordion>
          {/* Обработка состояний */}
          {status === 'pending' && (
            <div className="space-y-4">
              <Skeleton className="h-28 w-full" />
              <Skeleton className="h-28 w-full" />
              <Skeleton className="h-28 w-full" />
            </div>
          )}

          {status === 'error' && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Ошибка</AlertTitle>
              <AlertDescription>{error.message}</AlertDescription>
            </Alert>
          )}

          {status === 'success' && allHomeworks.length === 0 && (
            <div className="text-center py-10 border rounded-lg">
                <BookCheck className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 text-lg font-semibold">Ничего не найдено</h3>
                <p className="mt-1 text-sm text-muted-foreground">Попробуйте изменить фильтры или поисковый запрос.</p>
            </div>
          )}

          {/* Рендеринг списка ДЗ */}
          {status === 'success' && allHomeworks.length > 0 && (
            <div className="space-y-4">
              {allHomeworks.map((homework) => (
                <HomeworkDialog
                  key={homework.id}
                  lessonId={homework.lesson_source_id}
                  subjectName={homework.lesson.subject_name}
                  trigger={
                    <Card className="cursor-pointer hover:bg-muted/50 transition-colors">
                      <CardHeader>
                        <CardTitle>{homework.lesson.subject_name}</CardTitle>
                        <CardDescription>
                          Занятие от {format(new Date(homework.lesson.date), "d MMMM yyyy", { locale: ru })}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <p className="line-clamp-2">{homework.content}</p>
                        <p className="text-xs text-muted-foreground mt-2">
                          Автор: {homework.author.first_name || homework.author.username}
                        </p>
                      </CardContent>
                    </Card>
                  }
                />
              ))}
            </div>
          )}

          {/* Элемент-триггер для загрузки следующей страницы */}
          <div ref={ref} className="flex justify-center py-4">
            {isFetchingNextPage && <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />}
            {!hasNextPage && allHomeworks.length > 0 && (
              <p className="text-sm text-muted-foreground">Вы загрузили все задания.</p>
            )}
          </div>
          
        </div>
      </main>
      <BottomNav />
    </div>
  );
}