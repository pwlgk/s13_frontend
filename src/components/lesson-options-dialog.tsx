// src/components/lesson-options-dialog.tsx
"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

// Типы, скопированные из page.tsx
interface Tutor { name: string; }
interface Auditory { name: string; }
interface Lesson { id: number; subject_name: string; lesson_type: string; tutor: Tutor; auditory: Auditory; time_slot: number; }
const timeSlots: { [key: number]: string } = { 1: "08:30 - 10:00", 2: "10:10 - 11:40", 3: "12:10 - 13:40", 4: "13:50 - 15:20", 5: "15:50 - 17:20", 6: "17:30 - 19:00", };

interface LessonOptionsDialogProps {
  lessons: Lesson[];
  trigger: React.ReactNode; // Компонент, который будет открывать модальное окно (наша карточка)
}

export function LessonOptionsDialog({ lessons, trigger }: LessonOptionsDialogProps) {
  if (!lessons || lessons.length === 0) {
    return null;
  }
  const firstLesson = lessons[0];

  return (
    <Dialog>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{firstLesson.subject_name}</DialogTitle>
          <CardDescription>
            {timeSlots[firstLesson.time_slot] || `Пара №${firstLesson.time_slot}`}
          </CardDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4 max-h-[70vh] overflow-y-auto">
          {lessons.map((lesson) => (
            <div key={lesson.id} className="p-4 border rounded-lg">
              <p className="font-semibold">{lesson.tutor.name}</p>
              <p className="text-sm text-muted-foreground">{lesson.auditory.name}</p>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}