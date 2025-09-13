// src/components/onboarding-screen.tsx
"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useUserStore } from "@/store/user-store";
import { GroupSearch } from "./group-search";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, AlertTriangle } from "lucide-react"; // Importamos el icono de alerta
import { Alert, AlertDescription } from "@/components/ui/alert"; // Importamos el componente de alerta

interface Group {
  id: number;
  name: string;
}

// Función API para actualizar el perfil
const updateUserProfile = (data: { group_id: number }) => {
  return api.put('/api/v1/profile/me', data);
};

export function OnboardingScreen() {
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null); // 1. Estado para el mensaje de error
  const { fetchUser } = useUserStore();

  const mutation = useMutation({
    mutationFn: updateUserProfile,
    onSuccess: async () => {
      setErrorMessage(null); // Limpiamos el error en caso de éxito
      await fetchUser();
    },
    // 2. Capturamos el error de la mutación
    onError: (error) => {
      console.error("Failed to save group", error);
      // @ts-ignore
      if (error.response?.status === 403) {
        setErrorMessage("У вас нет прав для выполнения этого действия. Возможно, вы заблокированы.");
      } else {
        setErrorMessage("Произошла неизвестная ошибка. Пожалуйста, попробуйте снова.");
      }
    }
  });

  const handleSave = () => {
    setErrorMessage(null); // Limpiamos el error antes de un nuevo intento
    if (selectedGroup) {
      mutation.mutate({ group_id: selectedGroup.id });
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-2xl">Добро пожаловать!</CardTitle>
          <CardDescription>
            Чтобы начать, пожалуйста, выберите свою учебную группу. Это необходимо для отображения вашего личного расписания.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4"> {/* Añadimos space-y-4 para el espacio */}
          <div>
            <p className="mb-2 text-sm font-medium">Ваша группа</p>
            <GroupSearch onGroupSelect={setSelectedGroup} />
          </div>
          
          {/* 3. Mostramos el mensaje de error si existe */}
          {errorMessage && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                {errorMessage}
              </AlertDescription>
            </Alert>
          )}

        </CardContent>
        <CardFooter>
          <Button 
            className="w-full" 
            onClick={handleSave} 
            disabled={!selectedGroup || mutation.isPending}
          >
            {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Продолжить
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}