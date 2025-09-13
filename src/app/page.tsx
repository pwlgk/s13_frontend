// src/app/page.tsx
"use client";

import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { api } from "@/lib/api";

// Импорты для UI и компонентов
import { BottomNav } from "@/components/bottom-nav";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar as CalendarIcon, AlertTriangle, Users } from "lucide-react";
import { LessonOptionsDialog } from "@/components/lesson-options-dialog";
import { HomeworkDialog } from "@/components/homework-dialog"; // <-- Импортируем компонент ДЗ

// Определяем типы на основе вашей OpenAPI спецификации
interface Tutor { name: string; }
interface Auditory { name: string; }
interface Lesson {
  id: number;
  subject_name: string;
  lesson_type: string;
  tutor: Tutor;
  auditory: Auditory;
  time_slot: number;
}
interface DaySchedule {
  date: string;
  lessons: Lesson[];
}

// Асинхронная функция для загрузки данных
const fetchSchedule = async (date: Date): Promise<DaySchedule> => {
  const formattedDate = format(date, "yyyy-MM-dd");
  const { data } = await api.get(`/api/v1/schedule/my/day`, {
    params: { target_date: formattedDate },
  });
  return data;
};

// Соответствие номера пары времени
const timeSlots: { [key: number]: string } = {
  1: "08:45 - 10:20",
  2: "10:30 - 12:05",
  3: "12:45 - 14:20",
  4: "14:30 - 16:05",
  5: "16:15 - 17:50",
  6: "18:00 - 19:35",
  7: "19:45 - 21:20",
  8: "21:30 - 23:05",
};

// Вспомогательная функция для группировки занятий по номеру пары
const groupLessonsByTimeSlot = (lessons: Lesson[]): Record<number, Lesson[]> => {
  if (!lessons) return {};
  return lessons.reduce((acc, lesson) => {
    const slot = lesson.time_slot;
    if (!acc[slot]) {
      acc[slot] = [];
    }
    acc[slot].push(lesson);
    return acc;
  }, {} as Record<number, Lesson[]>);
};

export default function SchedulePage() {
  const [date, setDate] = useState<Date>(new Date());
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);

  const { data, isLoading, isError, error } = useQuery<DaySchedule, Error>({
    queryKey: ["schedule", format(date, "yyyy-MM-dd")],
    queryFn: () => fetchSchedule(date),
  });

  // Группируем полученные данные с помощью useMemo для оптимизации
  const groupedLessons = useMemo(() => {
    return data ? groupLessonsByTimeSlot(data.lessons) : {};
  }, [data]);

  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-1 overflow-y-auto pb-20">
        <div className="container mx-auto max-w-2xl p-4 space-y-4">
          
          {/* Адаптивный блок с заголовком и календарем */}
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
            <h1 className="text-2xl font-bold tracking-tight">Расписание</h1>
            <Dialog open={isDatePickerOpen} onOpenChange={setIsDatePickerOpen}>
              <DialogTrigger asChild>
                <Button variant={"outline"} className="w-full sm:w-[280px] justify-start text-left font-normal">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {format(date, "PPP", { locale: ru })}
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px] p-0">
                <DialogHeader>
                  <DialogTitle className="sr-only">Выберите дату</DialogTitle>
                </DialogHeader>
                <div className="flex justify-center pt-4">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={(newDate) => {
                      if (newDate) {
                        setDate(newDate);
                        setIsDatePickerOpen(false);
                      }
                    }}
                    initialFocus
                    locale={ru}
                  />
                </div>
                <DialogFooter className="p-4 pt-0">
                  <Button className="w-full" variant="ghost" onClick={() => setIsDatePickerOpen(false)}>Закрыть</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {/* Обработка состояний загрузки и ошибки */}
          {isLoading && (
            <div className="space-y-4">
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-32 w-full" />
            </div>
          )}

          {isError && (
            <Card className="bg-destructive/10 border-destructive">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-destructive"><AlertTriangle className="h-5 w-5"/>Ошибка</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-destructive">Не удалось загрузить расписание.</p>
                <p className="text-sm text-muted-foreground mt-2">{error.message}</p>
              </CardContent>
            </Card>
          )}
          
          {/* Новая логика рендеринга сгруппированных занятий */}
          {data && Object.keys(groupedLessons).length > 0 && (
            <div className="space-y-4">
              {Object.keys(groupedLessons).sort((a,b) => +a - +b).map(timeSlot => {
                const lessonsInSlot = groupedLessons[Number(timeSlot)];
                const firstLesson = lessonsInSlot[0];

                // Случай 1: Только одно занятие в это время
                if (lessonsInSlot.length === 1) {
                  return (
                    // Оборачиваем обычную карточку в HomeworkDialog
                    <HomeworkDialog
                      key={firstLesson.id}
                      lessonId={firstLesson.id}
                      subjectName={firstLesson.subject_name}
                      trigger={
                        <Card className="cursor-pointer hover:bg-muted/50 transition-colors">
                          <CardHeader>
                            <CardTitle>{firstLesson.subject_name}</CardTitle>
                            <CardDescription>{timeSlots[firstLesson.time_slot] || `Пара №${firstLesson.time_slot}`}</CardDescription>
                          </CardHeader>
                          <CardContent>
                            <div className="text-sm text-muted-foreground space-y-1">
                              <p><strong>Тип:</strong> {firstLesson.lesson_type}</p>
                              <p><strong>Преподаватель:</strong> {firstLesson.tutor.name}</p>
                              <p><strong>Аудитория:</strong> {firstLesson.auditory.name}</p>
                            </div>
                          </CardContent>
                        </Card>
                      }
                    />
                  );
                }

                // Случай 2: Несколько занятий (электив)
                return (
                  <LessonOptionsDialog
                    key={timeSlot}
                    lessons={lessonsInSlot}
                    trigger={
                      <Card className="cursor-pointer hover:bg-muted/50 transition-colors">
                        <CardHeader>
                          <CardTitle>{firstLesson.subject_name}</CardTitle>
                          <CardDescription>{timeSlots[firstLesson.time_slot] || `Пара №${firstLesson.time_slot}`}</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="flex items-center text-sm text-primary">
                            <Users className="h-4 w-4 mr-2" />
                            <span>Доступно {lessonsInSlot.length} варианта — нажмите для выбора</span>
                          </div>
                        </CardContent>
                      </Card>
                    }
                  />
                );
              })}
            </div>
          )}

          {/* Состояние, когда на день нет занятий */}
          {data && Object.keys(groupedLessons).length === 0 && (
            <div className="text-center py-10">
              <p className="text-muted-foreground">На выбранный день занятий нет.</p>
            </div>
          )}
        </div>
      </main>
      
      {/* Нижняя навигация */}
      <BottomNav />
    </div>
  );
}