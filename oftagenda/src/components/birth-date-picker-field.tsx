"use client";

import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { ptBR } from "date-fns/locale";
import { Calendar as CalendarIcon } from "lucide-react";

type BirthDatePickerFieldProps = {
  name?: string;
  defaultValue?: string;
};

function parseIsoDate(value?: string) {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return undefined;
  }
  const [yearPart, monthPart, dayPart] = value.split("-");
  const year = Number(yearPart);
  const month = Number(monthPart);
  const day = Number(dayPart);
  if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) {
    return undefined;
  }
  const parsedDate = new Date(year, month - 1, day, 12, 0, 0);
  return Number.isNaN(parsedDate.getTime()) ? undefined : parsedDate;
}

function toIsoDate(value: Date) {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatDateLabel(value: Date) {
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "long" }).format(value);
}

export function BirthDatePickerField({
  name = "birthDate",
  defaultValue,
}: BirthDatePickerFieldProps) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(() =>
    parseIsoDate(defaultValue),
  );
  const maxSelectableDate = useMemo(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12, 0, 0);
  }, []);
  const currentYear = maxSelectableDate.getFullYear();

  return (
    <div className="grid min-w-0 gap-2">
      <input
        type="hidden"
        name={name}
        value={selectedDate ? toIsoDate(selectedDate) : ""}
      />
      <Popover>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            data-empty={!selectedDate}
            className={cn(
              "w-full min-w-0 justify-start text-left font-normal",
              "data-[empty=true]:text-muted-foreground",
            )}
          >
            <CalendarIcon className="size-4 shrink-0" />
            <span className="truncate">
              {selectedDate ? formatDateLabel(selectedDate) : "Selecione a data"}
            </span>
          </Button>
        </PopoverTrigger>
        <PopoverContent
          align="start"
          className="w-auto max-w-[calc(100vw-2rem)] p-0"
        >
          <Calendar
            mode="single"
            locale={ptBR}
            selected={selectedDate}
            onSelect={setSelectedDate}
            captionLayout="dropdown"
            fromYear={1900}
            toYear={currentYear}
            disabled={(dateValue) => dateValue > maxSelectableDate}
            className="w-full [--cell-size:clamp(1.7rem,7vw,2.1rem)] sm:[--cell-size:clamp(1.9rem,4vw,2.5rem)]"
            classNames={{
              root: "w-full",
              month: "w-full",
              table: "w-full table-fixed",
            }}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}
