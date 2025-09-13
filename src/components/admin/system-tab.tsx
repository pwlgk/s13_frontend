// src/components/admin/system-tab.tsx
"use client";

import { useMutation } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { toast } from "sonner";
import { Loader2 } from "lucide-react"; // Импортируем иконку для состояния загрузки

// Функции API
const triggerScheduleSync = () => api.post('/api/v1/admin/system/trigger-schedule-sync');
const triggerDictSync = () => api.post('/api/v1/admin/system/trigger-dict-sync');
const sendBroadcast = (message: string) => api.post('/api/v1/admin/system/broadcast', { message });

// Схема для формы рассылки
const broadcastSchema = z.object({
  message: z.string().min(10, "Сообщение должно быть не менее 10 символов."),
});

export function SystemTab() {
  const form = useForm<z.infer<typeof broadcastSchema>>({
    resolver: zodResolver(broadcastSchema),
  });
  
  const useSystemActionMutation = (actionFn: () => Promise<any>, successMsg: string) => {
      return useMutation({
        mutationFn: actionFn,
        onSuccess: () => toast.success(successMsg),
        onError: (err: Error) => toast.error(`Ошибка: ${err.message}`), // Добавим обработку ошибок
      });
  };

  const scheduleSyncMutation = useSystemActionMutation(triggerScheduleSync, "Синхронизация расписания запущена.");
  const dictSyncMutation = useSystemActionMutation(triggerDictSync, "Синхронизация справочников запущена.");

  const broadcastMutation = useMutation({
    mutationFn: sendBroadcast,
    onSuccess: () => {
        toast.success("Рассылка успешно отправлена.");
        form.reset({ message: "" });
    },
    onError: (err: Error) => toast.error(`Ошибка рассылки: ${err.message}`)
  });

  function onSubmit(data: z.infer<typeof broadcastSchema>) {
    // Используем promise-синтаксис toast для лучшего UX
    toast.promise(broadcastMutation.mutateAsync(data.message), {
        loading: 'Отправляем сообщение...',
        // Сообщения об успехе/ошибке уже обрабатываются в onSuccess/onError
        // Поэтому здесь можно их не дублировать
    });
  }

  return (
    <div className="space-y-6">
        <Card>
            <CardHeader>
                <CardTitle>Синхронизация данных</CardTitle>
                <CardDescription>Принудительно запустить фоновые задачи по обновлению данных с сайта ОмГУ.</CardDescription>
            </CardHeader>
            {/* --- ИЗМЕНЕННЫЙ БЛОК --- */}
            <CardContent className="flex flex-col items-start gap-4">
                <Button onClick={() => scheduleSyncMutation.mutate()} disabled={scheduleSyncMutation.isPending} className="w-full sm:w-auto">
                    {scheduleSyncMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Синхронизировать расписание
                </Button>
                <Button onClick={() => dictSyncMutation.mutate()} disabled={dictSyncMutation.isPending} className="w-full sm:w-auto">
                    {dictSyncMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Синхронизировать справочники
                </Button>
            </CardContent>
            {/* --- КОНЕЦ ИЗМЕНЕННОГО БЛОКА --- */}
        </Card>

        <Card>
            <CardHeader>
                <CardTitle>Широковещательная рассылка</CardTitle>
                <CardDescription>Отправить сообщение всем активным пользователям бота.</CardDescription>
            </CardHeader>
            <CardContent>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="message"
                            render={({ field }) => (
                                <FormItem>
                                    <FormControl>
                                        <Textarea placeholder="Введите ваше сообщение здесь..." {...field} className="min-h-[120px]" />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <Button type="submit" disabled={broadcastMutation.isPending} className="w-full sm:w-auto">
                            {broadcastMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Отправить рассылку
                        </Button>
                    </form>
                </Form>
            </CardContent>
        </Card>
    </div>
  );
}