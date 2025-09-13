// src/components/homework-dialog.tsx
"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import Link from "next/link";
import { useUserStore } from "@/store/user-store";

// Импорты для UI
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, Terminal } from "lucide-react";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import type { ReactNode } from "react";

// Типы на основе вашей OpenAPI спеки
interface Author {
  first_name: string | null;
  last_name: string | null;
  username: string | null;
}
interface Homework {
  content: string;
  created_at: string;
  updated_at: string | null;
  author: Author;
}
interface SaveHomeworkPayload {
  lessonId: number;
  content: string;
}
interface HomeworkDialogProps {
  lessonId: number;
  subjectName: string;
  trigger: ReactNode;
}

// Асинхронная функция для загрузки ДЗ
const fetchHomework = async (lessonId: number): Promise<Homework | null> => {
  const { data } = await api.get(`/api/v1/lessons/${lessonId}/homework`);
  return data;
};

// Асинхронная функция для сохранения ДЗ
const saveHomework = async ({ lessonId, content }: SaveHomeworkPayload): Promise<Homework> => {
  const { data } = await api.post(`/api/v1/lessons/${lessonId}/homework`, { content });
  return data;
};

export function HomeworkDialog({ lessonId, subjectName, trigger }: HomeworkDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [homeworkText, setHomeworkText] = useState("");
  const [mutationError, setMutationError] = useState<string | null>(null);
  const queryClient = useQueryClient();

  // 1. Получаем данные текущего пользователя из стора
  const { user } = useUserStore();
  // 2. Определяем, есть ли у пользователя группа, чтобы разрешить редактирование
  const canEdit = !!user?.group_id;

  // Загружаем ДЗ, когда диалог открывается
  const { data: homework, isLoading, isError, error } = useQuery<Homework | null, Error>({
    queryKey: ['homework', lessonId],
    queryFn: () => fetchHomework(lessonId),
    enabled: isOpen,
  });

  // Обновляем текст в поле ввода, когда данные загружены
  useEffect(() => {
    if (homework) {
      setHomeworkText(homework.content);
    } else {
      setHomeworkText("");
    }
  }, [homework]);

  // Мутация для сохранения ДЗ
  const mutation = useMutation<Homework, Error, SaveHomeworkPayload>({
    mutationFn: saveHomework,
    onSuccess: (newData) => {
      queryClient.setQueryData(['homework', lessonId], newData);
      setMutationError(null); // Очищаем ошибку при успехе
      setIsOpen(false);
    },
    // Обрабатываем ошибку от сервера (включая 403 Forbidden)
    onError: (error) => {
      // Axios упаковывает ответ сервера в error.response
      // @ts-ignore
      const status = error.response?.status;
      if (status === 403) {
        setMutationError("У вас нет прав для изменения этого домашнего задания.");
      } else {
        setMutationError("Произошла ошибка при сохранении. Попробуйте снова.");
      }
    }
  });

  const handleSave = () => {
    setMutationError(null); // Очищаем предыдущую ошибку перед новой попыткой
    mutation.mutate({ lessonId, content: homeworkText });
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{subjectName}</DialogTitle>
          <DialogDescription>
            {canEdit ? "Добавьте или обновите домашнее задание." : "Вы можете только просматривать домашнее задание."}
          </DialogDescription>
        </DialogHeader>

        {isLoading && <Skeleton className="h-40 w-full" />}
        {isError && <p className="text-destructive">Ошибка загрузки: {error.message}</p>}
        
        {!isLoading && !isError && (
          <div className="py-4 space-y-4">
            {/* 3. Показываем предупреждение, если пользователь не может редактировать */}
            {!canEdit && (
              <Alert>
                <Terminal className="h-4 w-4" />
                <AlertTitle>Редактирование недоступно</AlertTitle>
                <AlertDescription>
                  Чтобы добавлять или изменять домашнее задание, вам необходимо <Link href="/profile" className="font-bold underline" onClick={() => setIsOpen(false)}>указать свою группу в профиле</Link>.
                </AlertDescription>
              </Alert>
            )}

            <Textarea
              placeholder={canEdit ? "Введите текст домашнего задания..." : "Укажите группу в профиле, чтобы добавить ДЗ."}
              value={homeworkText}
              onChange={(e) => setHomeworkText(e.target.value)}
              className="min-h-[150px]"
              disabled={!canEdit} // Блокируем поле ввода
            />
            {homework && (
              <div className="text-xs text-muted-foreground p-2 border rounded-md">
                <p>
                  <strong>Автор:</strong> {homework.author.first_name || homework.author.username}
                </p>
                <p>
                  <strong>Создано:</strong> {format(new Date(homework.created_at), "d MMMM yyyy 'в' HH:mm", { locale: ru })}
                </p>
                {homework.updated_at && (
                  <p>
                    <strong>Обновлено:</strong> {format(new Date(homework.updated_at), "d MMMM yyyy 'в' HH:mm", { locale: ru })}
                  </p>
                )}
              </div>
            )}
            {/* <div className="text-sm text-center text-muted-foreground italic">
              (История изменений будет здесь)
            </div> */}
            {/* Показываем ошибку сохранения, если она есть */}
            {mutationError && (
                 <p className="text-sm text-destructive text-center">{mutationError}</p>
            )}
          </div>
        )}

        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="secondary">Отмена</Button>
          </DialogClose>
          <Button onClick={handleSave} disabled={!canEdit || mutation.isPending}>
            {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Сохранить
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}