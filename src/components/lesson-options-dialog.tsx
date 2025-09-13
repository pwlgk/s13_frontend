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
const timeSlots: { [key: number]: string } = {
  1: "08:45 - 10:20",
  2: "10:30 - 12:05",
  3: "12:45 - 14:20",
  4: "14:30 - 16:05",
  5: "16:15 - 17:50",
  6: "18:00 - 19:35",
  7: "19:45 - 21:20",
  8: "21:30 - 23:05",
};
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