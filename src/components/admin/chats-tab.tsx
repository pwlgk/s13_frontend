// src/components/admin/chats-tab.tsx
"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ChatDetailsDialog } from "./chat-details-dialog"; // <-- Импортируем наш новый компонент

// Типы
interface Group { id: number; name: string; }
interface Chat {
  chat_id: number;
  title: string;
  is_active: boolean;
  linked_group: Group | null;
}
interface PaginatedChatsResponse { items: Chat[]; total: number; page: number; size: number; }

// Функция API для получения чатов
// Примечание: Ваш API для чатов не имеет параметра `search`, поэтому поиск будет декоративным
// Если `search` будет добавлен на бэкенд, он заработает автоматически
const fetchChats = async (page = 1): Promise<PaginatedChatsResponse> => {
  const { data } = await api.get('/api/v1/admin/chats', { params: { page, size: 10 } });
  return data;
};

export function ChatsTab() {
  const [page, setPage] = useState(1);
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['adminChats', page],
    queryFn: () => fetchChats(page),
  });

  const totalPages = data ? Math.ceil(data.total / data.size) : 0;

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Управление чатами</CardTitle>
          {/* <div className="pt-2">
            <Input 
              placeholder="Поиск по названию или ID (декоративный)..."
              // Этот input пока не будет фильтровать, так как API не поддерживает
            />
          </div> */}
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Название чата</TableHead>
                  <TableHead>Привязанная группа</TableHead>
                  <TableHead className="text-right">Статус</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading && <TableRow><TableCell colSpan={3} className="text-center">Загрузка...</TableCell></TableRow>}
                {isError && <TableRow><TableCell colSpan={3} className="text-center text-destructive">{error.message}</TableCell></TableRow>}
                {data?.items.map((chat) => (
                  <TableRow 
                    key={chat.chat_id} 
                    onClick={() => setSelectedChat(chat)}
                    className="cursor-pointer"
                  >
                    <TableCell>
                      <div className="font-medium">{chat.title}</div>
                      <div className="text-sm text-muted-foreground">{chat.chat_id}</div>
                    </TableCell>
                    <TableCell>{chat.linked_group?.name || <span className="text-muted-foreground">Нет</span>}</TableCell>
                    <TableCell className="text-right">
                      <Badge variant={chat.is_active ? "secondary" : "outline"}>
                        {chat.is_active ? "Активен" : "Неактивен"}
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
      {/* Модальное окно */}
      <ChatDetailsDialog 
        chat={selectedChat}
        isOpen={!!selectedChat}
        onOpenChange={(open) => !open && setSelectedChat(null)}
      />
    </>
  );
}