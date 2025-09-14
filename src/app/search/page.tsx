// src/app/search/page.tsx
"use client";

import { useState } from "react";
import { BottomNav } from "@/components/bottom-nav";
import { GroupSearch } from "@/components/group-search";
import { TutorSearch } from "@/components/tutor-search"; // Создадим далее
import { WeekScheduleView } from "@/components/week-schedule-view";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Универсальный тип для выбранной сущности
interface SearchEntity {
  id: number;
  name: string;
  type: 'group' | 'tutor';
}

export default function SearchPage() {
  const [selectedEntity, setSelectedEntity] = useState<SearchEntity | null>(null);

  return (
    <div className="flex flex-col">
      
      <main className="flex-1 overflow-y-auto pb-20">
        <div className="container mx-auto max-w-4xl p-4 space-y-6">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Поиск расписания</h2> 
            {/* <p className="text-muted-foreground">
              Выберите тип поиска и найдите расписание по группе или преподавателю.
            </p> */}
          </div>

          <Tabs defaultValue="group" className="w-full" onValueChange={() => setSelectedEntity(null)}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="group">По группе</TabsTrigger>
              <TabsTrigger value="tutor">По преподавателю</TabsTrigger>
            </TabsList>
            <TabsContent value="group" className="mt-4">
              <GroupSearch onGroupSelect={(group) => 
                group ? setSelectedEntity({ ...group, type: 'group' }) : setSelectedEntity(null)
              } />
            </TabsContent>
            <TabsContent value="tutor" className="mt-4">
               <TutorSearch onTutorSelect={(tutor) => 
                tutor ? setSelectedEntity({ ...tutor, type: 'tutor' }) : setSelectedEntity(null)
              } />
            </TabsContent>
          </Tabs>
          
          {/* Показываем расписание только после того, как что-то выбрано */}
          {selectedEntity && (
            <WeekScheduleView
              key={`${selectedEntity.type}-${selectedEntity.id}`} // Ключ для сброса состояния
              entity={selectedEntity}
            />
          )}
        </div>
      </main>
      <BottomNav />
    </div>
  );
}