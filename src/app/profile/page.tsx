// src/app/profile/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useForm, SubmitHandler } from "react-hook-form";
// import { zodResolver } from "@hookform/resolvers/zod"; // УДАЛЯЕМ
// import * as z from "zod"; // УДАЛЯЕМ
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useUserStore } from "@/store/user-store";
import { toast } from "sonner";

// UI Imports
import { BottomNav } from "@/components/bottom-nav";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Loader2, Pencil } from "lucide-react";
import { Label } from "@/components/ui/label";

// 1. ПРОСТОЙ ИНТЕРФЕЙС ВМЕСТО СХЕМЫ ZOD
interface SettingsFormValues {
  subgroup_number?: number | null;
  notifications_enabled?: boolean;
  reminders_enabled?: boolean;
  reminder_time?: number;
}

// Типы для API
interface Tutor { id: number; name: string; }
interface Elective { subject_name: string; tutors: Tutor[]; }
interface ElectivesResponse { items: Elective[]; }
const fetchElectives = async (): Promise<ElectivesResponse> => {
    const { data } = await api.get('/api/v1/schedule/my/electives');
    return data;
};

export default function ProfilePage() {
  const { user, fetchUser, logout } = useUserStore();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  
  // Отдельное состояние для выбора преподавателей
  const [tutorSelections, setTutorSelections] = useState<Record<string, number>>({});

  const { data: electivesData, isLoading: isLoadingElectives } = useQuery({
    queryKey: ['electives'],
    queryFn: fetchElectives,
    enabled: isEditing && !!user?.group_id,
  });

  // 2. ИНИЦИАЛИЗИРУЕМ ФОРМУ БЕЗ ZODRESOLVER
  const form = useForm<SettingsFormValues>({
    // resolver: zodResolver(settingsFormSchema), // УДАЛЯЕМ
  });

  useEffect(() => {
    if (isEditing && user) {
      form.reset({
        subgroup_number: user.subgroup_number ?? null,
        notifications_enabled: user.settings?.notifications_enabled ?? false,
        reminders_enabled: user.settings?.reminders_enabled ?? false,
        reminder_time: user.settings?.reminder_time ?? 15,
      });
      setTutorSelections(user.settings?.preferred_tutors ?? {});
    }
  }, [isEditing, user, form]);
  
  const mutation = useMutation({
    // Мутация теперь принимает любой объект, так как мы собираем его вручную
    mutationFn: (payload: { subgroup_number?: number|null, settings: any, preferred_tutors: Record<string, number> }) => {
        return api.put('/api/v1/profile/me', payload);
    },
    onSuccess: async () => {
      toast.success("Настройки успешно сохранены!");
      await fetchUser();
      queryClient.invalidateQueries({ queryKey: ['schedule'] });
      setIsEditing(false);
    },
    onError: (error) => { toast.error(`Ошибка сохранения: ${error.message}`); }
  });

  // onSubmit теперь объединяет данные
  const onSubmit: SubmitHandler<SettingsFormValues> = (data) => {
    const payload = {
        subgroup_number: data.subgroup_number,
        settings: {
            notifications_enabled: data.notifications_enabled,
            reminders_enabled: data.reminders_enabled,
            reminder_time: data.reminder_time,
        },
        preferred_tutors: tutorSelections,
    };
    mutation.mutate(payload);
  };
  
  if (!user) {
    return ( <div className="flex flex-col min-h-screen"><main className="flex-1 flex items-center justify-center pb-20"><Loader2 className="h-8 w-8 animate-spin" /></main><BottomNav /></div> );
  }

  const handleTutorChange = (subjectName: string, tutorId: string) => {
    setTutorSelections(prev => ({
        ...prev,
        [subjectName]: Number(tutorId),
    }));
  };

  return (
    <div className="flex flex-col">
      
      <main className="flex-1 overflow-y-auto pb-20">
        <div className="container mx-auto max-w-2xl p-4 space-y-8">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Настройки</h2><br />
            <p className="text-muted-foreground">{user.first_name || user.username}, здесь вы можете настроить приложение.</p>
          </div>

          {!isEditing ? (
            // РЕЖИМ ПРОСМОТРА
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div><CardTitle>Текущие настройки</CardTitle></div>
                <Button variant="outline" size="icon" onClick={() => setIsEditing(true)}><Pencil className="h-4 w-4" /></Button>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                <div className="flex justify-between items-center"><span className="text-muted-foreground">Уведомления об изменениях:</span><span className="font-medium">{user.settings?.notifications_enabled ? "Включены" : "Выключены"}</span></div>
                <div className="flex justify-between items-center"><span className="text-muted-foreground">Напоминания о парах:</span><span className="font-medium">{user.settings?.reminders_enabled ? `Включены, за ${user.settings?.reminder_time || 15} мин` : "Выключены"}</span></div>
                <div className="flex justify-between items-center"><span className="text-muted-foreground">Подгруппа:</span><span className="font-medium">{user.subgroup_number || 'Не выбрана'}</span></div>
                <div className="pt-2"><p className="font-medium">Выбранные преподаватели:</p>
                  {user.settings?.preferred_tutors && Object.keys(user.settings.preferred_tutors).length > 0 ? (
                    <ul className="list-disc list-inside text-muted-foreground mt-2">{Object.keys(user.settings.preferred_tutors).map(subj => <li key={subj}>{subj}</li>)}</ul>
                  ) : <p className="text-muted-foreground text-xs italic mt-2">Для вашей группы нет элективов или они не выбраны.</p>}
                </div>
              </CardContent>
            </Card>
          ) : (
            // РЕЖИМ РЕДАКТИРОВАНИЯ
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                <Card>
                  <CardHeader><CardTitle>Основные настройки</CardTitle></CardHeader>
                  <CardContent className="space-y-6">
                    <FormField control={form.control} name="subgroup_number" render={({ field }) => (
                      <FormItem>
                          <FormLabel>Подгруппа</FormLabel>
                          <FormControl>
                            <Select onValueChange={(value) => field.onChange(value ? Number(value) : null)} value={field.value ? String(field.value) : undefined}>
                              <SelectTrigger><SelectValue placeholder="Не выбрана" /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="1">1 подгруппа</SelectItem>
                                <SelectItem value="2">2 подгруппа</SelectItem>
                              </SelectContent>
                            </Select>
                          </FormControl>
                          <FormMessage />
                      </FormItem>
                    )}/>
                    <FormField control={form.control} name="notifications_enabled" render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5"><FormLabel>Уведомления</FormLabel><FormDescription>Об изменениях в расписании</FormDescription></div>
                        <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                      </FormItem>
                    )}/>
                    <FormField control={form.control} name="reminders_enabled" render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5"><FormLabel>Напоминания</FormLabel><FormDescription>О начале занятий</FormDescription></div>
                        <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                      </FormItem>
                    )}/>
                    <FormField control={form.control} name="reminder_time" render={({ field }) => (
                      <FormItem>
                          <FormLabel>Напоминать за</FormLabel>
                          <FormControl>
                            <Select onValueChange={(value) => field.onChange(Number(value))} value={String(field.value)}>
                              <SelectTrigger><SelectValue /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="5">5 минут</SelectItem>
                                <SelectItem value="10">10 минут</SelectItem>
                                <SelectItem value="15">15 минут</SelectItem>
                                <SelectItem value="30">30 минут</SelectItem>
                              </SelectContent>
                            </Select>
                          </FormControl>
                          <FormMessage />
                      </FormItem>
                    )}/>
                  </CardContent>
                </Card>
                
                {!!user?.group_id && (
                  <Card>
                    <CardHeader><CardTitle>Выбор преподавателей</CardTitle><CardDescription>Для элективных дисциплин</CardDescription></CardHeader>
                    <CardContent className="space-y-6">
                      {isLoadingElectives && <div className="space-y-4"><Skeleton className="h-10 w-full"/><Skeleton className="h-10 w-full"/></div>}
                      {electivesData?.items.map(elective => (
                        <div key={elective.subject_name} className="space-y-2">
                          <Label>{elective.subject_name}</Label>
                          <Select
                            onValueChange={(value) => handleTutorChange(elective.subject_name, value)}
                            value={String(tutorSelections[elective.subject_name] ?? '')}
                          >
                            <SelectTrigger><SelectValue placeholder="Выберите преподавателя" /></SelectTrigger>
                            <SelectContent>
                              {elective.tutors.map(tutor => <SelectItem key={tutor.id} value={String(tutor.id)}>{tutor.name}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </div>
                      ))}
                       {electivesData && electivesData.items.length === 0 && <p className="text-sm text-muted-foreground">Нет дисциплин, требующих выбора.</p>}
                    </CardContent>
                  </Card>
                )}

                <div className="flex gap-2">
                  <Button type="submit" disabled={mutation.isPending}>{mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Сохранить</Button>
                  <Button type="button" variant="ghost" onClick={() => setIsEditing(false)}>Отмена</Button>
                </div>
              </form>
            </Form>
          )}

        </div>
      </main>
      <BottomNav />
    </div>
  );
}