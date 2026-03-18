"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";

import {
  upsertAvailabilityDateOverridesAction,
  upsertAvailabilityDaySlotsAction,
} from "@/app/dashboard/admin/actions";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { ALL_TIMEZONES } from "@/lib/timezones";

const weekdayLongLabels = [
  "Domingo",
  "Segunda-feira",
  "Terça-feira",
  "Quarta-feira",
  "Quinta-feira",
  "Sexta-feira",
  "Sábado",
];

type SlotInputState = {
  startTime: string;
  endTime: string;
  status: "active" | "inactive";
};

type NewDayState = {
  enabled: boolean;
  allowMultiple: boolean;
  slots: SlotInputState[];
};

function createDefaultSlot(): SlotInputState {
  return {
    startTime: "09:00",
    endTime: "17:00",
    status: "active",
  };
}

function createWeeklyTemplate(): NewDayState[] {
  return Array.from({ length: 7 }, () => ({
    enabled: true,
    allowMultiple: false,
    slots: [createDefaultSlot()],
  }));
}

const defaultTimezone = "America/Fortaleza";

export function AdminAvailabilityCreateDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [groupName, setGroupName] = useState("");
  const [groupTimezone, setGroupTimezone] = useState(defaultTimezone);
  const [days, setDays] = useState<NewDayState[]>(createWeeklyTemplate);
  const [hasOverrides, setHasOverrides] = useState(false);
  const [overrideDates, setOverrideDates] = useState<Date[]>([]);
  const [overrideSlots, setOverrideSlots] = useState<SlotInputState[]>([{ ...createDefaultSlot() }]);
  const [overrideAllDayUnavailable, setOverrideAllDayUnavailable] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const localTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone || "";
  const timezoneWithOffsets = ALL_TIMEZONES.map((timezone) => ({
    timezone,
    label: `${timezone} (${formatTimezoneOffset(timezone)})`,
  }));

  const selectClassName = "h-9 rounded-md border border-input bg-input/20 px-2 text-xs";

  function resetForm() {
    setGroupName("");
    setGroupTimezone(defaultTimezone);
    setDays(createWeeklyTemplate());
    setHasOverrides(false);
    setOverrideDates([]);
    setOverrideSlots([{ ...createDefaultSlot() }]);
    setOverrideAllDayUnavailable(false);
    setFeedback(null);
  }

  function updateDay(weekday: number, updater: (day: NewDayState) => NewDayState) {
    setDays((previous) => previous.map((day, index) => (index === weekday ? updater(day) : day)));
  }

  function setDayEnabled(weekday: number, enabled: boolean) {
    updateDay(weekday, (day) => {
      const currentSlots = day.slots.length > 0 ? day.slots : [createDefaultSlot()];
      if (!enabled) {
        return {
          ...day,
          enabled: false,
          slots: currentSlots.map((slot) => ({ ...slot, status: "inactive" as const })),
        };
      }
      return {
        ...day,
        enabled: true,
        slots: currentSlots.map((slot) => ({ ...slot, status: "active" as const })),
      };
    });
  }

  function setAllowMultiple(weekday: number, allowMultiple: boolean) {
    updateDay(weekday, (day) => ({
      ...day,
      allowMultiple,
      slots: allowMultiple ? day.slots : day.slots.slice(0, 1),
    }));
  }

  function addSlot(weekday: number) {
    updateDay(weekday, (day) => ({
      ...day,
      enabled: true,
      slots: [...day.slots, createDefaultSlot()],
    }));
  }

  function removeSlot(weekday: number, slotIndex: number) {
    updateDay(weekday, (day) => ({
      ...day,
      slots: day.slots.filter((_, index) => index !== slotIndex),
    }));
  }

  function updateSlot(weekday: number, slotIndex: number, patch: Partial<SlotInputState>) {
    updateDay(weekday, (day) => ({
      ...day,
      slots: day.slots.map((slot, index) => (index === slotIndex ? { ...slot, ...patch } : slot)),
    }));
  }

  function handleOverrideDatesChange(nextDates: Date[] | undefined) {
    const normalized =
      nextDates?.map((date) => new Date(date.getFullYear(), date.getMonth(), date.getDate(), 12, 0, 0)) ?? [];
    const uniqueByIso = new Map(normalized.map((date) => [toIsoDate(date), date]));
    setOverrideDates([...uniqueByIso.values()].sort((a, b) => a.getTime() - b.getTime()));
  }

  function updateOverrideSlot(slotIndex: number, patch: Partial<SlotInputState>) {
    setOverrideSlots((previous) =>
      previous.map((slot, index) => (index === slotIndex ? { ...slot, ...patch } : slot)),
    );
  }

  function addOverrideSlot() {
    setOverrideSlots((previous) => [...previous, { ...createDefaultSlot() }]);
  }

  function removeOverrideSlot(slotIndex: number) {
    setOverrideSlots((previous) => previous.filter((_, index) => index !== slotIndex));
  }

  function applyLocalTimezone() {
    const localTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (localTimezone) {
      setGroupTimezone(localTimezone);
    }
  }

  function isValidTimezone(timezone: string) {
    const normalizedTimezone = timezone.trim();
    if (!normalizedTimezone) {
      return false;
    }
    try {
      new Intl.DateTimeFormat("pt-BR", { timeZone: normalizedTimezone }).format(new Date());
      return true;
    } catch {
      return false;
    }
  }

  function handleClose() {
    onOpenChange(false);
  }

  function handleSave() {
    const normalizedName = groupName.trim();
    if (!normalizedName) {
      setFeedback("Informe o nome da disponibilidade.");
      return;
    }
    const normalizedTimezone = groupTimezone.trim() || defaultTimezone;
    if (!isValidTimezone(normalizedTimezone)) {
      setFeedback("Informe um timezone válido (ex.: America/Fortaleza).");
      return;
    }
    if (hasOverrides && overrideDates.length === 0) {
      setFeedback("Selecione ao menos uma data para criar overrides.");
      return;
    }
    if (hasOverrides && !overrideAllDayUnavailable && overrideSlots.length === 0) {
      setFeedback("Adicione ao menos um horário para os overrides.");
      return;
    }

    setFeedback(null);
    startTransition(async () => {
      try {
        for (let weekday = 0; weekday < days.length; weekday += 1) {
          const day = days[weekday];
          if (!day) {
            continue;
          }
          const formData = new FormData();
          formData.set("groupName", normalizedName);
          formData.set("weekday", String(weekday));
          formData.set("timezone", normalizedTimezone);
          formData.set(
            "slots",
            JSON.stringify(
              (day.slots.length > 0 ? day.slots : [{ ...createDefaultSlot(), status: "inactive" as const }]).map(
                (slot) => ({
                  startTime: slot.startTime,
                  endTime: slot.endTime,
                  status: day.enabled ? slot.status : "inactive",
                }),
              ),
            ),
          );
          await upsertAvailabilityDaySlotsAction(formData);
        }
        if (hasOverrides) {
          const overrideFormData = new FormData();
          overrideFormData.set("groupName", normalizedName);
          overrideFormData.set("timezone", normalizedTimezone);
          overrideFormData.set("allDayUnavailable", String(overrideAllDayUnavailable));
          overrideFormData.set("dates", JSON.stringify(overrideDates.map((date) => toIsoDate(date))));
          overrideFormData.set(
            "slots",
            JSON.stringify(
              overrideSlots.map((slot) => ({
                startTime: slot.startTime,
                endTime: slot.endTime,
                status: slot.status,
              })),
            ),
          );
          await upsertAvailabilityDateOverridesAction(overrideFormData);
        }
        resetForm();
        onOpenChange(false);
        toast.success(
          hasOverrides
            ? "Disponibilidade e overrides criados com sucesso."
            : "Disponibilidade criada com sucesso.",
        );
        router.refresh();
      } catch (error) {
        const message = error instanceof Error ? error.message : "Falha ao criar disponibilidade.";
        setFeedback(message);
        toast.error("Não foi possível criar a disponibilidade.", {
          description: message,
        });
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[92vh] max-w-[96vw] flex-col overflow-hidden sm:max-w-5xl">
        <DialogHeader>
          <DialogTitle>Cadastrar disponibilidade</DialogTitle>
          <DialogDescription>
            Defina o nome e ative os dias da semana com o Switch. Em cada dia ativo, configure um ou vários horários.
          </DialogDescription>
        </DialogHeader>
        <div className="min-h-0 space-y-4 overflow-y-auto pr-1">
          <Input
            value={groupName}
            onChange={(event) => setGroupName(event.target.value)}
            placeholder="Ex.: Manhã clínica / Semana A"
          />
          <Select value={groupTimezone} onValueChange={setGroupTimezone}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Selecione o fuso horário" />
            </SelectTrigger>
            <SelectContent className="max-h-80">
              {localTimezone && !ALL_TIMEZONES.includes(localTimezone) ? (
                <SelectItem value={localTimezone}>{localTimezone}</SelectItem>
              ) : null}
              {timezoneWithOffsets.map((item) => (
                <SelectItem key={item.timezone} value={item.timezone}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex flex-wrap items-center gap-2">
            <Button type="button" variant="outline" size="sm" onClick={applyLocalTimezone}>
              Usar fuso local ({localTimezone || "não detectado"})
            </Button>
            <p className="text-xs text-muted-foreground">
              Lista completa de fusos IANA carregada de arquivo local do projeto.
            </p>
          </div>
          <div className="space-y-3">
            {days.map((day, weekday) => (
              <div key={`new-day-${weekday}`} className="space-y-3 rounded-lg border border-border/70 bg-muted/10 p-3">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-2">
                    <Switch checked={day.enabled} onCheckedChange={(checked) => setDayEnabled(weekday, Boolean(checked))} />
                    <p className="text-sm font-medium">{weekdayLongLabels[weekday]}</p>
                  </div>
                  {day.enabled ? (
                    <div className="flex w-full items-center gap-2 sm:w-auto">
                      <Switch
                        checked={day.allowMultiple}
                        onCheckedChange={(checked) => setAllowMultiple(weekday, Boolean(checked))}
                      />
                      <p className="text-xs text-muted-foreground">Múltiplos horários</p>
                    </div>
                  ) : null}
                </div>
                {day.enabled
                  ? day.slots.map((slot, slotIndex) => (
                      <div
                        key={`new-day-${weekday}-slot-${slotIndex}`}
                        className="grid grid-cols-1 items-center gap-2 sm:grid-cols-2 xl:grid-cols-[minmax(140px,170px)_20px_minmax(140px,170px)_140px_110px]"
                      >
                        <Input
                          type="time"
                          step={300}
                          value={slot.startTime}
                          className="h-9 w-full text-sm"
                          onChange={(event) => updateSlot(weekday, slotIndex, { startTime: event.target.value })}
                          title="Use formato 24h (HH:mm)"
                        />
                        <span className="hidden text-center text-sm text-muted-foreground xl:block">-</span>
                        <Input
                          type="time"
                          step={300}
                          value={slot.endTime}
                          className="h-9 w-full text-sm"
                          onChange={(event) => updateSlot(weekday, slotIndex, { endTime: event.target.value })}
                          title="Use formato 24h (HH:mm)"
                        />
                        <select
                          className={`${selectClassName} w-full`}
                          value={slot.status}
                          onChange={(event) =>
                            updateSlot(weekday, slotIndex, { status: event.target.value as "active" | "inactive" })
                          }
                        >
                          <option value="active">active</option>
                          <option value="inactive">inactive</option>
                        </select>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="w-full border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive"
                          onClick={() => removeSlot(weekday, slotIndex)}
                          disabled={day.slots.length === 1}
                        >
                          Remover
                        </Button>
                      </div>
                    ))
                  : null}
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="w-full sm:w-auto"
                  onClick={() => addSlot(weekday)}
                  disabled={!day.enabled || !day.allowMultiple}
                >
                  + Horário
                </Button>
              </div>
            ))}
          </div>
          <div className="space-y-3 rounded-lg border border-border/70 bg-muted/10 p-3">
            <div className="flex items-center gap-2">
              <Switch checked={hasOverrides} onCheckedChange={(checked) => setHasOverrides(Boolean(checked))} />
              <p className="text-sm font-medium">Adicionar overrides na criação</p>
            </div>
            {hasOverrides ? (
              <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
                <div className="space-y-3 rounded-lg border border-border/70 bg-background/40 p-3">
                  <p className="text-sm font-medium">Datas do override</p>
                  <Calendar
                    mode="multiple"
                    locale={ptBR}
                    selected={overrideDates}
                    onSelect={handleOverrideDatesChange}
                    className="w-full [--cell-size:clamp(1.9rem,5.5vw,2.35rem)]"
                  />
                  <p className="text-xs text-muted-foreground">
                    {overrideDates.length > 0
                      ? `${overrideDates.length} data(s): ${overrideDates.map((date) => formatIsoDate(toIsoDate(date))).join(", ")}`
                      : "Nenhuma data selecionada."}
                  </p>
                </div>
                <div className="space-y-3 rounded-lg border border-border/70 bg-background/40 p-3">
                  <p className="text-sm font-medium">Horários para override</p>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={overrideAllDayUnavailable}
                      onCheckedChange={(checked) => setOverrideAllDayUnavailable(Boolean(checked))}
                    />
                    <p className="text-sm">Marcar indisponível (dia todo)</p>
                  </div>
                  {!overrideAllDayUnavailable
                    ? overrideSlots.map((slot, slotIndex) => (
                        <div
                          key={`create-override-slot-${slotIndex}`}
                          className="grid grid-cols-1 items-center gap-2 sm:grid-cols-2 md:grid-cols-[minmax(0,1fr)_16px_minmax(0,1fr)_minmax(108px,auto)_auto]"
                        >
                          <Input
                            type="time"
                            step={300}
                            value={slot.startTime}
                            className="h-9"
                            onChange={(event) =>
                              updateOverrideSlot(slotIndex, {
                                startTime: event.target.value,
                              })
                            }
                          />
                          <span className="hidden text-center text-sm text-muted-foreground md:block">-</span>
                          <Input
                            type="time"
                            step={300}
                            value={slot.endTime}
                            className="h-9"
                            onChange={(event) =>
                              updateOverrideSlot(slotIndex, {
                                endTime: event.target.value,
                              })
                            }
                          />
                          <select
                            className={`${selectClassName} h-9 w-full min-w-0`}
                            value={slot.status}
                            onChange={(event) =>
                              updateOverrideSlot(slotIndex, {
                                status: event.target.value as "active" | "inactive",
                              })
                            }
                          >
                            <option value="active">Ativo</option>
                            <option value="inactive">Inativo</option>
                          </select>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            className="w-full border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive md:w-auto md:px-3"
                            onClick={() => removeOverrideSlot(slotIndex)}
                            disabled={overrideSlots.length === 1}
                          >
                            Remover
                          </Button>
                        </div>
                      ))
                    : null}
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={addOverrideSlot}
                    disabled={overrideAllDayUnavailable}
                  >
                    + Horário
                  </Button>
                </div>
              </div>
            ) : null}
          </div>
          {feedback ? <p className="text-xs text-destructive">{feedback}</p> : null}
        </div>
        <DialogFooter>
          <Button variant="outline" type="button" onClick={handleClose}>
            Cancelar
          </Button>
          <Button type="button" onClick={handleSave} disabled={isPending}>
            {isPending ? "Salvando..." : "Salvar disponibilidade"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function toIsoDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function parseIsoDate(isoDate: string) {
  const parts = isoDate.split("-");
  const year = Number(parts[0] ?? "1970");
  const month = Number(parts[1] ?? "1");
  const day = Number(parts[2] ?? "1");
  const safeYear = Number.isFinite(year) ? year : 1970;
  const safeMonth = Number.isFinite(month) ? month : 1;
  const safeDay = Number.isFinite(day) ? day : 1;
  return new Date(safeYear, safeMonth - 1, safeDay, 12, 0, 0);
}

function formatIsoDate(isoDate: string) {
  const date = parseIsoDate(isoDate);
  return date.toLocaleDateString("pt-BR", {
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function formatTimezoneOffset(timezone: string) {
  try {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
      timeZoneName: "shortOffset",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).formatToParts(new Date());
    const offsetName = parts.find((part) => part.type === "timeZoneName")?.value ?? "";
    const match = offsetName.match(/^GMT([+-]\d{1,2})(?::?(\d{2}))?$/);
    if (match) {
      const hours = Number(match[1]);
      const minutes = Number(match[2] ?? "0");
      return toUtcOffsetString(hours * 60 + Math.sign(hours || 1) * minutes);
    }
  } catch {
    // Fallback below.
  }

  try {
    const now = new Date();
    const utc = new Date(now.toLocaleString("en-US", { timeZone: "UTC" }));
    const zoned = new Date(now.toLocaleString("en-US", { timeZone: timezone }));
    const diffMinutes = Math.round((zoned.getTime() - utc.getTime()) / 60000);
    return toUtcOffsetString(diffMinutes);
  } catch {
    return "UTC";
  }
}

function toUtcOffsetString(totalMinutes: number) {
  const sign = totalMinutes >= 0 ? "+" : "-";
  const absoluteMinutes = Math.abs(totalMinutes);
  const hours = String(Math.floor(absoluteMinutes / 60)).padStart(2, "0");
  const minutes = String(absoluteMinutes % 60).padStart(2, "0");
  return `UTC${sign}${hours}:${minutes}`;
}
