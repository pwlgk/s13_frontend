// src/components/admin/chat-details-dialog.tsx
"use client";

import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { api } from "@/lib/api";
import { toast } from "sonner";

// UI Imports
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Loader2 } from "lucide-react";

// Тип чата из API
interface Group { id: number; name: string; }
interface Chat {
  chat_id: number;
  title: string;
  is_active: boolean;
  linked_group: Group | null;
}

interface ChatDetailsDialogProps {
  chat: Chat | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

// Схема для формы отправки сообщения
const messageSchema = z.object({
  message: z.string().min(1, "Сообщение не может быть пустым."),
});

// Функция API
const sendMessage = ({ chatId, message }: { chatId: number; message: string }) => 
  api.post(`/api/v1/admin/chats/${chatId}/send-message`, { message });

export function ChatDetailsDialog({ chat, isOpen, onOpenChange }: ChatDetailsDialogProps) {
  const form = useForm<z.infer<typeof messageSchema>>({
    resolver: zodResolver(messageSchema),
  });

  const sendMessageMutation = useMutation({
    mutationFn: sendMessage,
    onSuccess: () => {
      toast.success("Сообщение успешно отправлено.");
      onOpenChange(false); // Закрываем диалог после отправки
      form.reset({ message: "" });
    },
    onError: (err: Error) => toast.error(`Ошибка отправки: ${err.message}`),
  });

  function onSubmit(data: z.infer<typeof messageSchema>) {
    if (!chat) return;
    sendMessageMutation.mutate({ chatId: chat.chat_id, message: data.message });
  }
  
  // Сбрасываем форму при каждом открытии диалога
  if (!isOpen && form.formState.isDirty) {
    form.reset({ message: "" });
  }

  if (!chat) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{chat.title}</DialogTitle>
          <DialogDescription>ID чата: {chat.chat_id}</DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-4 text-sm">
            <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Привязанная группа:</span>
                <span className="font-medium">{chat.linked_group?.name || "Нет"}</span>
            </div>
            <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Статус:</span>
                <Badge variant={chat.is_active ? "secondary" : "outline"}>
                  {chat.is_active ? "Активен" : "Неактивен"}
                </Badge>
            </div>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4 border-t">
                <FormField
                  control={form.control}
                  name="message"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Отправить сообщение в этот чат</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Введите ваше сообщение..." {...field} className="min-h-[100px]" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" disabled={sendMessageMutation.isPending} className="w-full">
                  {sendMessageMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Отправить
                </Button>
              </form>
            </Form>
        </div>
        <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Закрыть</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}