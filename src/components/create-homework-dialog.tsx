// src/components/create-homework-dialog.tsx
"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { format, addDays } from "date-fns";
import { ru } from "date-fns/locale";

// UI Imports
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2, AlertTriangle, ArrowLeft } from "lucide-react";

// Типы
interface Lesson { id: number; subject_name: string; time_slot: number; }
interface DaySchedule { lessons: Lesson[]; }
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
// Функции API
const fetchLessonsForDate = async (date: Date): Promise<DaySchedule> => {
  const formattedDate = format(date, "yyyy-MM-dd");
  const { data } = await api.get(`/api/v1/schedule/my/day`, { params: { target_date: formattedDate } });
  return data;
};
const saveHomework = async ({ lessonId, content }: { lessonId: number; content: string }) => {
  return api.post(`/api/v1/lessons/${lessonId}/homework`, { content });
};

type WizardStep = 'date' | 'lesson' | 'text';

export function CreateHomeworkDialog({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  
  const [step, setStep] = useState<WizardStep>('date');
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [homeworkText, setHomeworkText] = useState("");

  const queryClient = useQueryClient();
  const futureDateLimit = addDays(new Date(), 14);

  const { data: schedule, isLoading: isLoadingLessons, isError } = useQuery({
    queryKey: ['lessonsForDate', selectedDate ? format(selectedDate, 'yyyy-MM-dd') : ''],
    queryFn: () => fetchLessonsForDate(selectedDate!),
    enabled: !!selectedDate && step === 'lesson',
  });

  const mutation = useMutation({
    mutationFn: saveHomework,
    onSuccess: () => {
      toast.success("Домашнее задание успешно создано!");
      queryClient.invalidateQueries({ queryKey: ['myHomework'] });
      setIsOpen(false);
    },
    onError: (error) => toast.error(`Ошибка сохранения: ${error.message}`),
  });

  const resetState = () => {
    setStep('date');
    setSelectedDate(undefined);
    setSelectedLesson(null);
    setHomeworkText("");
  };

  useEffect(() => {
    if (!isOpen) {
      setTimeout(resetState, 200);
    }
  }, [isOpen]);

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      setSelectedDate(date);
      setStep('lesson');
    }
  };

  const handleLessonSelect = (lesson: Lesson) => {
    setSelectedLesson(lesson);
    setStep('text');
  };

  const handleSave = () => {
    if (!selectedLesson || !homeworkText) return;
    mutation.mutate({ lessonId: selectedLesson.id, content: homeworkText });
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Добавить домашнее задание</DialogTitle>
          <DialogDescription>
            {step === 'date' && "Шаг 1: Выберите дату занятия."}
            {step === 'lesson' && `Шаг 2: Выберите занятие на ${format(selectedDate!, "d MMMM", { locale: ru })}.`}
            {step === 'text' && `Шаг 3: Введите текст задания для "${selectedLesson?.subject_name}".`}
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4 min-h-[350px]">
          {step === 'date' && (
            <div className="flex flex-col items-center">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={handleDateSelect}
                disabled={(date) => date > futureDateLimit || date < new Date("2020-01-01")}
                initialFocus
                locale={ru}
              />
            </div>
          )}

          {step === 'lesson' && (
            <div className="space-y-2">
              {isLoadingLessons && <div className="flex items-center justify-center h-40"><Loader2 className="h-8 w-8 animate-spin" /></div>}
              {isError && <div className="text-destructive text-center p-4">Не удалось загрузить занятия.</div>}
              {schedule?.lessons && (
                // --- ИЗМЕНЕННЫЙ БЛОК ---
                <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 scrollbar-hide">
                  {schedule.lessons.length > 0 ? (
                    schedule.lessons.map(lesson => (
                      <Card 
                        key={lesson.id} 
                        className="cursor-pointer hover:bg-muted/50 transition-colors"
                        onClick={() => handleLessonSelect(lesson)}
                      >
                        <CardHeader className="p-3">
                          <CardTitle className="text-base">{lesson.subject_name}</CardTitle>
                          <CardDescription>Начало в {timeSlots[lesson.time_slot] || `Пара №${lesson.time_slot}`}</CardDescription>
                        </CardHeader>
                      </Card>
                    ))
                  ) : (
                    <div className="text-center text-muted-foreground p-8">На эту дату занятий нет.</div>
                  )}
                </div>
                // --- КОНЕЦ ИЗМЕНЕННОГО БЛОКА ---
              )}
            </div>
          )}
          
          {step === 'text' && (
            <div className="space-y-2">
              <Textarea
                placeholder="Например: 'Подготовить доклад на тему...'"
                className="min-h-[250px] text-base"
                value={homeworkText}
                onChange={(e) => setHomeworkText(e.target.value)}
              />
            </div>
          )}
        </div>

        <DialogFooter className="flex flex-col-reverse sm:flex-row sm:justify-between w-full gap-2">
  {/* Кнопка "Назад" (второстепенное действие) */}
  <div>
    {step === 'lesson' && <Button type="button" variant="ghost" onClick={() => setStep('date')}><ArrowLeft className="mr-2 h-4 w-4" />Назад к календарю</Button>}
    {step === 'text' && <Button type="button" variant="ghost" onClick={() => setStep('lesson')}><ArrowLeft className="mr-2 h-4 w-4" />Назад к занятиям</Button>}
  </div>

  {/* Основная кнопка действия */}
  <div>
    {step === 'text' && (
      <Button
        className="w-full sm:w-auto" // <-- Растягиваем на всю ширину на мобильных
        onClick={handleSave}
        disabled={!homeworkText.trim() || mutation.isPending}
      >
        {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Сохранить
      </Button>
    )}
    
    {/* Кнопка "Закрыть" (когда нет других действий) */}
    {/* {step !== 'text' && (
        <DialogClose asChild>
            <Button type="button" variant="secondary" className="w-full sm:w-auto">Закрыть</Button>
        </DialogClose>
    )} */}
  </div>
</DialogFooter>
      </DialogContent>
    </Dialog>
  );
}