// src/components/week-schedule-view.tsx
"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { startOfWeek, endOfWeek, addWeeks, subWeeks, format, isToday } from "date-fns";
import { ru } from "date-fns/locale";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, ArrowRight, AlertTriangle } from "lucide-react";
import { HomeworkDialog } from "./homework-dialog";
import { useUserStore } from "@/store/user-store";

// Типы
interface SearchEntity { id: number; name: string; type: 'group' | 'tutor'; }
interface Lesson { id: number; subject_name: string; lesson_type: string; tutor: { name: string }; auditory: { name: string }; time_slot: number; group: {id: number, name: string} }
interface DaySchedule { date: string; lessons: Lesson[]; }
const timeSlots: { [key: number]: string } = { /* ... */ }; // Скопируйте timeSlots из page.tsx

interface WeekScheduleViewProps {
  entity: SearchEntity;
}

// 1. НОВАЯ УНИВЕРСАЛЬНАЯ ФУНКЦИЯ ЗАГРУЗКИ
const fetchWeekSchedule = async (entity: SearchEntity, date: Date): Promise<DaySchedule[]> => {
  const params: { target_date: string, group_id?: number, tutor_id?: number } = {
    target_date: format(date, "yyyy-MM-dd"),
  };

  if (entity.type === 'group') {
    params.group_id = entity.id;
  } else if (entity.type === 'tutor') {
    params.tutor_id = entity.id;
  }

  const { data } = await api.get(`/api/v1/schedule/search`, { params });
  return data;
};

export function WeekScheduleView({ entity }: WeekScheduleViewProps) {
  const [currentDate, setCurrentDate] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }));
  const { user } = useUserStore();
  
  // 2. ОБНОВЛЕННЫЙ useQuery
  const { data, isLoading, isError, error }  = useQuery({
    queryKey: ["weekSchedule", entity.type, entity.id, format(currentDate, "yyyy-MM-dd")],
    queryFn: () => fetchWeekSchedule(entity, currentDate),
  });

  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 border rounded-lg bg-card">
        <div className="text-center sm:text-left">
          {/* 3. ОТОБРАЖАЕМ ИМЯ ИЗ УНИВЕРСАЛЬНОГО ОБЪЕКТА */}
          <h2 className="text-xl font-semibold">{entity.name}</h2>
          <p className="text-muted-foreground">{format(weekStart, "d MMMM", { locale: ru })} - {format(weekEnd, "d MMMM yyyy", { locale: ru })}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => setCurrentDate(subWeeks(currentDate, 1))}><ArrowLeft className="h-4 w-4" /></Button>
          <Button variant="outline" onClick={() => setCurrentDate(startOfWeek(new Date(), { weekStartsOn: 1 }))}>Текущая</Button>
          <Button variant="outline" size="icon" onClick={() => setCurrentDate(addWeeks(currentDate, 1))}><ArrowRight className="h-4 w-4" /></Button>
        </div>
      </div>

      {isLoading && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <Skeleton className="h-48 w-full" />
                    <Skeleton className="h-48 w-full" />
                    <Skeleton className="h-48 w-full" />
                </div>
            )}
            {isError && (
                <Card className="bg-destructive/10 border-destructive">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-destructive">
                            <AlertTriangle className="h-5 w-5" /> Ошибка
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-destructive">Не удалось загрузить расписание.</p>
                        <p className="text-sm text-muted-foreground mt-2">{error.message}</p>
                    </CardContent>
                </Card>
            )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {data?.map((day) => (
          <Card key={day.date}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>{format(new Date(day.date), "EEEE", { locale: ru })}</span>
                {isToday(new Date(day.date)) && <Badge>Сегодня</Badge>}
              </CardTitle>
              <CardDescription>{format(new Date(day.date), "d MMMM", { locale: ru })}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {day.lessons.length > 0 ? (
                day.lessons.map(lesson => {
                  const canInteract = user?.group_id === lesson.group.id;
                  const lessonCard = (
                     <div className="text-sm p-2 border-l-2 rounded-r-md">
                        <p className="font-medium">{lesson.subject_name}</p>
                        <p className="text-muted-foreground">{entity.type === 'group' ? lesson.tutor.name : lesson.group.name}</p>
                        <p className="text-muted-foreground">{lesson.auditory.name}</p>
                      </div>
                  );
                  return canInteract ? (
                     <HomeworkDialog key={lesson.id} lessonId={lesson.id} subjectName={lesson.subject_name} trigger={<div className="cursor-pointer hover:bg-muted/50 transition-colors">{lessonCard}</div>}/>
                  ) : ( <div key={lesson.id}>{lessonCard}</div> );
                })
              ) : (
                <p className="text-sm text-muted-foreground">Занятий нет</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}