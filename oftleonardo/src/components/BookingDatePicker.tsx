import { useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarIcon, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

const DATE_EVENT_NAME = "online-booking-manual-date-change";

function toIsoDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export default function BookingDatePicker() {
  const [date, setDate] = useState<Date>();
  const [open, setOpen] = useState(false);
  const today = new Date();
  const startMonth = new Date(today.getFullYear() - 1, 0, 1);
  const endMonth = new Date(today.getFullYear() + 2, 11, 31);

  function dispatchDate(value: string) {
    window.dispatchEvent(
      new CustomEvent(DATE_EVENT_NAME, {
        detail: { value },
      })
    );
  }

  function handleSelect(nextDate: Date | undefined) {
    setDate(nextDate);

    if (!nextDate) {
      dispatchDate("");
      return;
    }

    dispatchDate(toIsoDate(nextDate));
    setOpen(false);
  }

  return (
    <div className="flex flex-col gap-2">
      <span className="text-xs font-medium text-muted-foreground">Data específica (opcional)</span>
      <div className="flex gap-2">
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="outline"
              className="h-10 flex-1 justify-start text-left font-normal"
            >
              <CalendarIcon className="size-4" />
              {date ? (
                format(date, "PPP", { locale: ptBR })
              ) : (
                <span className="text-muted-foreground">Selecione uma data</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={date}
              onSelect={handleSelect}
              initialFocus
              locale={ptBR}
              captionLayout="dropdown"
              startMonth={startMonth}
              endMonth={endMonth}
            />
          </PopoverContent>
        </Popover>
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={() => handleSelect(undefined)}
          disabled={!date}
          aria-label="Limpar data selecionada"
          title="Limpar data"
        >
          <X className="size-4" />
        </Button>
      </div>
    </div>
  );
}
