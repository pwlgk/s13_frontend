// src/app/admin/page.tsx
"use client";

import { useEffect } from "react";
import { useUserStore } from "@/store/user-store";
import { useRouter } from "next/navigation"; // Используем useRouter из next/navigation
import { BottomNav } from "@/components/bottom-nav";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UsersTab } from "@/components/admin/users-tab"; // Создадим далее
import { SystemTab } from "@/components/admin/system-tab"; // Создадим далее
import { Toaster } from "@/components/ui/sonner"; // Для уведомлений
import { Loader2 } from "lucide-react";
import { ChatsTab } from "@/components/admin/chats-tab";
export default function AdminPage() {
    const { user, isLoading } = useUserStore();
    const router = useRouter();

    // Этот useEffect - наш "сторож". Он выполняется на клиенте.
    useEffect(() => {
        // Если загрузка еще идет, ничего не делаем
        if (isLoading) return;

        // Если пользователь загружен и он не админ, перенаправляем на главную
        if (user && !user.is_admin) {
            router.replace('/');
        }
    }, [user, isLoading, router]);

    // Пока идет проверка или если пользователь не админ, показываем заглушку
    if (isLoading || !user?.is_admin) {
        return (
            <div className="flex h-screen items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }

    // Если все проверки пройдены, показываем админку
    return (
        <>
            <div className="flex flex-col min-h-screen">
                <main className="flex-1 overflow-y-auto pb-20">
                    <div className="container mx-auto max-w-4xl p-4 space-y-6">
                        <div>
                            <h2 className="text-3xl font-bold tracking-tight">Панель администратора</h2><br />
                            <p className="text-muted-foreground">Управление пользователями и системой.</p>
                        </div>

                        <Tabs defaultValue="users">
                            <TabsList className="grid w-full grid-cols-3">
                                <TabsTrigger value="users">Пользователи</TabsTrigger>
                                <TabsTrigger value="system">Система</TabsTrigger>
                                <TabsTrigger value="chats">Чаты</TabsTrigger>
                                              </TabsList>
                            <TabsContent value="users" className="mt-4">
                                <UsersTab />
                            </TabsContent>
                            <TabsContent value="system" className="mt-4">
                                <SystemTab />
                            </TabsContent>
                            <TabsContent value="chats" className="mt-4">
                <ChatsTab />
              </TabsContent>
                        </Tabs>
                    </div>
                </main>
                <BottomNav />
            </div>
            <Toaster /> {/* Место для рендеринга уведомлений */}
        </>
    );
}