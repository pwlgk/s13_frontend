// src/components/homework-filters.tsx
"use client";

import { Input } from "@/components/ui/input";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

// Типы (без изменений)
export interface HomeworkFiltersState {
  status: 'actual' | 'expired' | null;
  week: 'current' | 'next' | null;
  subject_search: string;
}

interface HomeworkFiltersProps {
  filters: HomeworkFiltersState;
  onFiltersChange: (newFilters: Partial<HomeworkFiltersState>) => void;
}
export function HomeworkFilters({ filters, onFiltersChange }: HomeworkFiltersProps) {
  return (
    // Убрали внешнюю обертку Card/div. Теперь компонент начинается сразу с контента.
    // pt-1 - небольшой отступ сверху для красоты.
    <div className="space-y-4 pt-1">
      {/* Поиск по предмету */}
      <div>
        <label className="text-sm font-medium">Поиск по предмету</label>
        <Input
          placeholder="Например, 'программирование'..."
          value={filters.subject_search}
          onChange={(e) => onFiltersChange({ subject_search: e.target.value })}
          className="mt-1"
        />
      </div>

      {/* Фильтры по статусу и неделе */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <label className="text-sm font-medium">Статус</label>
          <ToggleGroup
            type="single"
            variant="outline"
            value={filters.status || ""}
            onValueChange={(value: 'actual' | 'expired') => onFiltersChange({ status: value || null })}
            className="w-full mt-1"
          >
            <ToggleGroupItem value="actual" className="flex-1">Актуальные</ToggleGroupItem>
            <ToggleGroupItem value="expired" className="flex-1">Просроченные</ToggleGroupItem>
          </ToggleGroup>
        </div>
        <div className="flex-1">
          <label className="text-sm font-medium">Неделя</label>
          <ToggleGroup
            type="single"
            variant="outline"
            value={filters.week || ""}
            onValueChange={(value: 'current' | 'next') => onFiltersChange({ week: value || null })}
            className="w-full mt-1"
          >
            <ToggleGroupItem value="current" className="flex-1">Эта</ToggleGroupItem>
            <ToggleGroupItem value="next" className="flex-1">Следующая</ToggleGroupItem>
          </ToggleGroup>
        </div>
      </div>
    </div>
  );
}