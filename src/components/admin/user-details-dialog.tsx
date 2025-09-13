// src/components/admin/user-details-dialog.tsx
"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Loader2 } from "lucide-react";

// Тип пользователя из API
interface AdminUser {
  telegram_id: number;
  first_name: string | null;
  last_name: string | null;
  username: string | null;
  group_id: number | null;
  subgroup_number: number | null;
  is_blocked: boolean;
  is_admin: boolean;
}

interface UserDetailsDialogProps {
  user: AdminUser | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

// Функции API
const blockUser = (userId: number) => api.post(`/api/v1/admin/users/${userId}/block`);
const unblockUser = (userId: number) => api.post(`/api/v1/admin/users/${userId}/unblock`);

export function UserDetailsDialog({ user, isOpen, onOpenChange }: UserDetailsDialogProps) {
  const queryClient = useQueryClient();

  const useUserActionMutation = (actionFn: (userId: number) => Promise<any>, successMessage: string) => {
    return useMutation({
        mutationFn: actionFn,
        onSuccess: () => {
            toast.success(successMessage);
            queryClient.invalidateQueries({ queryKey: ['adminUsers'] });
            onOpenChange(false); // Закрываем диалог после действия
        },
        onError: (err: Error) => toast.error(`Ошибка: ${err.message}`),
    });
  };

  const blockMutation = useUserActionMutation(blockUser, "Пользователь заблокирован");
  const unblockMutation = useUserActionMutation(unblockUser, "Пользователь разблокирован");

  if (!user) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{user.first_name || user.username || "Пользователь"}</DialogTitle>
          <DialogDescription>@{user.username || user.telegram_id}</DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-4 text-sm">
            <div className="flex justify-between items-center">
                <span className="text-muted-foreground">ID:</span>
                <span className="font-mono">{user.telegram_id}</span>
            </div>
            <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Группа:</span>
                <span className="font-medium">{user.group_id || "Не указана"}</span>
            </div>
            <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Подгруппа:</span>
                <span className="font-medium">{user.subgroup_number || "Не указана"}</span>
            </div>
            <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Статус:</span>
                <Badge variant={user.is_blocked ? "destructive" : "secondary"}>
                  {user.is_blocked ? "Заблокирован" : "Активен"}
                </Badge>
            </div>
             <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Админ:</span>
                <Badge variant={user.is_admin ? "default" : "outline"}>
                  {user.is_admin ? "Да" : "Нет"}
                </Badge>
            </div>
        </div>
        <DialogFooter className="sm:justify-between">
            {/* Обертка для подтверждения действия */}
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant={user.is_blocked ? "secondary" : "destructive"}>
                  {user.is_blocked ? "Разблокировать" : "Заблокировать"}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Вы уверены?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Вы собираетесь {user.is_blocked ? "разблокировать" : "заблокировать"} пользователя @{user.username || user.telegram_id}.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Отмена</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => user.is_blocked ? unblockMutation.mutate(user.telegram_id) : blockMutation.mutate(user.telegram_id)}
                    className={user.is_blocked ? "" : "bg-destructive text-destructive-foreground hover:bg-destructive/90"}
                    disabled={blockMutation.isPending || unblockMutation.isPending}
                  >
                    {(blockMutation.isPending || unblockMutation.isPending) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Продолжить
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Закрыть</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}