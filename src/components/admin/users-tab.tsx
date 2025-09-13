// src/components/admin/users-tab.tsx
"use client";

import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input"; // Импортируем Input
import { UserDetailsDialog } from "./user-details-dialog"; // Импортируем наш новый компонент

// Тип пользователя, который мы ожидаем от API
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
interface PaginatedUsersResponse { items: AdminUser[]; total: number; page: number; size: number; }

// Обновляем fetch-функцию для поддержки поиска
const fetchUsers = async (page = 1, search = ""): Promise<PaginatedUsersResponse> => {
  const params = {
    page,
    size: 10,
    // Отправляем search только если он соответствует требованиям API
    search: search && search.length >= 2 ? search : undefined,
  };

  const { data } = await api.get('/api/v1/admin/users', { params });
  return data;
};

export function UsersTab() {
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);

  // Debounce для поиска
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setPage(1); // Сбрасываем на первую страницу при новом поиске
    }, 500);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['adminUsers', page, debouncedSearch], // Добавляем debouncedSearch в ключ
    queryFn: () => fetchUsers(page, debouncedSearch),
  });

  const totalPages = data ? Math.ceil(data.total / data.size) : 0;

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Управление пользователями</CardTitle>
          <div className="pt-2">
            <Input 
              placeholder="Поиск по имени, нику или ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Пользователь</TableHead>
                  <TableHead className="text-right">Статус</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading && <TableRow><TableCell colSpan={2} className="text-center">Загрузка...</TableCell></TableRow>}
                {isError && <TableRow><TableCell colSpan={2} className="text-center text-destructive">{error.message}</TableCell></TableRow>}
                {data?.items.map((user) => (
                  <TableRow 
                    key={user.telegram_id} 
                    onClick={() => setSelectedUser(user)}
                    className="cursor-pointer"
                  >
                    <TableCell>
                      <div className="font-medium">{user.first_name || "Без имени"}</div>
                      <div className="text-sm text-muted-foreground">@{user.username || user.telegram_id}</div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge variant={user.is_blocked ? "destructive" : "secondary"}>
                        {user.is_blocked ? "Заблокирован" : "Активен"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          {/* Пагинация */}
          <div className="flex items-center justify-end space-x-2 py-4">
            <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(p - 1, 1))} disabled={page === 1}>
              Назад
            </Button>
            <span className="text-sm">Стр. {data?.page || 1} из {totalPages || 1}</span>
            <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(p + 1, totalPages))} disabled={page === totalPages || totalPages === 0}>
              Вперед
            </Button>
          </div>
        </CardContent>
      </Card>
      {/* Модальное окно, которое рендерится здесь, но управляется состоянием */}
      <UserDetailsDialog 
        user={selectedUser}
        isOpen={!!selectedUser}
        onOpenChange={(open) => !open && setSelectedUser(null)}
      />
    </>
  );
}