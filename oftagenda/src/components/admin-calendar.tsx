"use client";

import { DndContext, type DragEndEvent, useDraggable, useDroppable } from "@dnd-kit/core";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { appendParallelRouteOrigin } from "@/lib/parallel-route-origin";
import type { ReservationStatus } from "@/lib/reservation-status";
import { reservationStatusLabel } from "@/lib/reservation-status";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

type CalendarItem = {
  _id: string;
  reservationId: string;
  startsAt: number;
  endsAt: number;
  status: ReservationStatus;
  eventTypeTitle: string;
  kind: "consulta" | "procedimento" | "exame";
  clerkUserId: string;
  eventTypeId: string;
  availabilityId: string;
  notes: string;
  patientName: string;
  patientEmail: string;
  patientPhone: string;
  patientBirthDate?: string;
};

type AdminCalendarProps = {
  items: CalendarItem[];
};

type OptimisticMove = {
  reservationId: string;
  toDate: string;
  toTime: string;
  status: "pending" | "confirmed";
};

const KIND_CLASS: Record<CalendarItem["kind"], string> = {
  consulta: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-200",
  exame: "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-200",
  procedimento: "bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-200",
};

const STATUS_CARD_CLASS: Record<ReservationStatus, string> = {
  pending: "border border-amber-200 bg-amber-100 text-amber-900 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-100",
  awaiting_patient:
    "border border-amber-200 bg-amber-100 text-amber-900 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-100",
  awaiting_reschedule:
    "border border-amber-200 bg-amber-100 text-amber-900 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-100",
  confirmed: "border border-emerald-200 bg-emerald-100 text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-100",
  in_care: "border border-emerald-200 bg-emerald-100 text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-100",
  surgery_planned: "border border-slate-200 bg-slate-100 text-slate-800 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200",
  postop_followup: "border border-slate-200 bg-slate-100 text-slate-800 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200",
  completed: "border border-slate-200 bg-slate-100 text-slate-800 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200",
  cancelled: "border border-rose-200 bg-rose-100 text-rose-900 dark:border-rose-900 dark:bg-rose-950 dark:text-rose-100",
  no_show: "border border-rose-200 bg-rose-100 text-rose-900 dark:border-rose-900 dark:bg-rose-950 dark:text-rose-100",
};

type ViewMode = "week" | "day";
const SLOT_ID_PREFIX = "slot";
const RESERVATION_ID_PREFIX = "reservation";
const SLOT_DURATION_MINUTES = 30;
const CALENDAR_START_HOUR = 7;
const CALENDAR_END_HOUR = 20;
const DRAG_DROP_RESCHEDULE_CONFIRMED_EVENT = "agenda-drag-drop-reschedule-confirmed";
const ADMIN_CALENDAR_DND_CONTEXT_ID = "admin-calendar-dnd-context";

function startOfWeek(date: Date) {
  const next = new Date(date);
  const diff = next.getDay();
  next.setHours(0, 0, 0, 0);
  next.setDate(next.getDate() - diff);
  return next;
}

function toDateInput(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function toTimeInput(date: Date) {
  const h = String(date.getHours()).padStart(2, "0");
  const m = String(date.getMinutes()).padStart(2, "0");
  return `${h}:${m}`;
}

function weekdayLabel(date: Date) {
  return date.toLocaleDateString("pt-BR", {
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
  });
}

function formatPhoneLabel(phone: string) {
  const digits = phone.replace(/\D+/g, "");
  if (digits.length === 11) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  }
  if (digits.length === 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }
  return phone || "Não informado";
}

function calculateAge(date: Date) {
  const today = new Date();
  let age = today.getFullYear() - date.getFullYear();
  const hasBirthdayPassed =
    today.getMonth() > date.getMonth() ||
    (today.getMonth() === date.getMonth() && today.getDate() >= date.getDate());
  if (!hasBirthdayPassed) {
    age -= 1;
  }
  return age >= 0 ? age : null;
}

function parseBirthDate(value?: string) {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return null;
  }
  const [yearPart, monthPart, dayPart] = value.split("-");
  const year = Number(yearPart);
  const month = Number(monthPart);
  const day = Number(dayPart);
  if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) {
    return null;
  }
  const parsed = new Date(year, month - 1, day, 12, 0, 0);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function formatBirthDateLabel(value?: string) {
  if (!value) {
    return "Não informada";
  }
  const parsed = parseBirthDate(value);
  if (parsed) {
    const age = calculateAge(parsed);
    const formattedDate = new Intl.DateTimeFormat("pt-BR", { dateStyle: "short" }).format(parsed);
    return age === null ? formattedDate : `${formattedDate} (${age} anos)`;
  }
  return value;
}

function buildSlotDropId(date: string, time: string) {
  return `${SLOT_ID_PREFIX}:${date}:${time}`;
}

function parseSlotDropId(rawId: string) {
  if (!rawId.startsWith(`${SLOT_ID_PREFIX}:`)) {
    return null;
  }
  const [, date, time] = rawId.split(":");
  if (!date || !time) {
    return null;
  }
  return { date, time };
}

function buildReservationDragId(reservationId: string) {
  return `${RESERVATION_ID_PREFIX}:${reservationId}`;
}

function parseReservationDragId(rawId: string) {
  if (!rawId.startsWith(`${RESERVATION_ID_PREFIX}:`)) {
    return null;
  }
  const reservationId = rawId.slice(`${RESERVATION_ID_PREFIX}:`.length);
  return reservationId ? { reservationId } : null;
}

function toTimestampFromDateAndTime(date: string, time: string) {
  const dateMatch = date.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  const timeMatch = time.match(/^(\d{2}):(\d{2})$/);
  if (!dateMatch || !timeMatch) {
    return null;
  }
  const [, year, month, day] = dateMatch;
  const [, hour, minute] = timeMatch;
  const parsed = new Date(
    Number(year),
    Number(month) - 1,
    Number(day),
    Number(hour),
    Number(minute),
    0,
    0,
  );
  return Number.isNaN(parsed.getTime()) ? null : parsed.getTime();
}

function parseReagendarReservationId(pathname: string) {
  const match = pathname.match(/\/reagendar\/([^/]+)/);
  return match?.[1] ?? null;
}

function DraggableReservationCard({
  item,
  agendaPath,
  originHref,
  dragEnabled,
}: {
  item: CalendarItem;
  agendaPath: string;
  originHref: string;
  dragEnabled: boolean;
}) {
  const router = useRouter();
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: buildReservationDragId(item.reservationId),
    disabled: !dragEnabled,
  });
  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
      }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`block w-full select-none rounded-md px-2 py-1 text-left text-[11px] ${
        dragEnabled ? "cursor-grab active:cursor-grabbing" : "cursor-pointer"
      } ${
        STATUS_CARD_CLASS[item.status]
      } ${isDragging ? "cursor-grabbing opacity-70" : ""}`}
      onClick={() =>
        router.push(
          appendParallelRouteOrigin(
            `${agendaPath}/status/${item.reservationId}`,
            originHref,
          ),
        )}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          router.push(
            appendParallelRouteOrigin(
              `${agendaPath}/status/${item.reservationId}`,
              originHref,
            ),
          );
        }
      }}
      {...listeners}
      {...attributes}
    >
      <p className="font-medium">{item.eventTypeTitle}</p>
      <p className="text-[10px]">
        <span className={`mr-1 inline-block rounded px-1 py-0.5 align-middle ${KIND_CLASS[item.kind]}`}>{item.kind}</span>
        <span className="align-middle">{reservationStatusLabel[item.status]}</span>
      </p>
      <p className="truncate text-[10px] font-medium">{item.patientName || "Sem nome"}</p>
      <p className="truncate text-[10px]">{formatPhoneLabel(item.patientPhone)}</p>
      <p className="truncate text-[10px]">{formatBirthDateLabel(item.patientBirthDate)}</p>
    </div>
  );
}

function AgendaSlotCell({
  dayKey,
  slot,
  slotItems,
  day,
  openEmptySlotRoute,
  agendaPath,
  originHref,
  liveMarkerOffsetPercent,
  isDraggingReservation,
  dragEnabled,
}: {
  dayKey: string;
  slot: string;
  slotItems: CalendarItem[];
  day: Date;
  openEmptySlotRoute: (day: Date, slot: string) => void;
  agendaPath: string;
  originHref: string;
  liveMarkerOffsetPercent: number | null;
  isDraggingReservation: boolean;
  dragEnabled: boolean;
}) {
  const isEmptySlot = slotItems.length === 0;
  const { isOver, setNodeRef } = useDroppable({
    id: buildSlotDropId(dayKey, slot),
    disabled: !dragEnabled,
  });

  return (
    <div
      ref={setNodeRef}
      className={`relative min-h-12 border-b border-l p-1 text-left ${
        isDraggingReservation ? "cursor-copy" : isEmptySlot ? "cursor-pointer hover:bg-muted/40" : ""
      } ${isOver ? "bg-primary/10" : ""}`}
      role={isEmptySlot ? "button" : undefined}
      tabIndex={isEmptySlot ? 0 : undefined}
      onClick={() => {
        if (isEmptySlot) {
          openEmptySlotRoute(day, slot);
        }
      }}
      onKeyDown={(event) => {
        if (!isEmptySlot) {
          return;
        }
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          openEmptySlotRoute(day, slot);
        }
      }}
    >
      {liveMarkerOffsetPercent !== null ? (
        <div
          className="pointer-events-none absolute inset-x-0 z-10 border-t-2 border-rose-500"
          style={{ top: `${liveMarkerOffsetPercent}%` }}
          aria-hidden
        />
      ) : null}
      <div className="space-y-1">
        {slotItems.map((item) => (
          <DraggableReservationCard
            key={item._id}
            item={item}
            agendaPath={agendaPath}
            originHref={originHref}
            dragEnabled={dragEnabled}
          />
        ))}
      </div>
    </div>
  );
}

export function AdminCalendar({ items }: AdminCalendarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [viewMode, setViewMode] = useState<ViewMode>("week");
  const [anchorDate, setAnchorDate] = useState(() => new Date());
  const [now, setNow] = useState(() => new Date());
  const [dragEnabled, setDragEnabled] = useState(false);
  const [isDraggingReservation, setIsDraggingReservation] = useState(false);
  const [optimisticMoves, setOptimisticMoves] = useState<Record<string, OptimisticMove>>({});
  const bodyCursorBeforeDragRef = useRef<string>("");
  const previousPathnameRef = useRef(pathname);
  const agendaPath = pathname.endsWith("/") ? pathname.slice(0, -1) : pathname;
  const originHref = useMemo(() => {
    const query = searchParams.toString();
    return query ? `${pathname}?${query}` : pathname;
  }, [pathname, searchParams]);

  useEffect(() => {
    const updateNow = () => setNow(new Date());
    updateNow();
    let intervalId: number | undefined;
    const msUntilNextMinute = 60_000 - (Date.now() % 60_000);
    const timeoutId = window.setTimeout(() => {
      updateNow();
      intervalId = window.setInterval(updateNow, 60_000);
    }, msUntilNextMinute);
    return () => {
      window.clearTimeout(timeoutId);
      if (intervalId !== undefined) {
        window.clearInterval(intervalId);
      }
    };
  }, []);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(min-width: 640px)");
    const syncDragEnabled = () => setDragEnabled(mediaQuery.matches);
    syncDragEnabled();
    mediaQuery.addEventListener("change", syncDragEnabled);
    return () => {
      mediaQuery.removeEventListener("change", syncDragEnabled);
    };
  }, []);

  useEffect(() => {
    if (!isDraggingReservation) {
      if (bodyCursorBeforeDragRef.current !== "") {
        document.body.style.cursor = bodyCursorBeforeDragRef.current;
        bodyCursorBeforeDragRef.current = "";
      } else {
        document.body.style.removeProperty("cursor");
      }
      return;
    }

    bodyCursorBeforeDragRef.current = document.body.style.cursor;
    document.body.style.cursor = "grabbing";
    return () => {
      if (bodyCursorBeforeDragRef.current !== "") {
        document.body.style.cursor = bodyCursorBeforeDragRef.current;
        bodyCursorBeforeDragRef.current = "";
      } else {
        document.body.style.removeProperty("cursor");
      }
    };
  }, [isDraggingReservation]);

  useEffect(() => {
    function handleRescheduleConfirmed(event: Event) {
      const customEvent = event as CustomEvent<{ reservationId?: string; date?: string; time?: string }>;
      const { reservationId, date, time } = customEvent.detail ?? {};
      if (!reservationId || !date || !time) {
        return;
      }
      setOptimisticMoves((previous) => {
        const current = previous[reservationId];
        if (!current) {
          return previous;
        }
        return {
          ...previous,
          [reservationId]: {
            ...current,
            toDate: date,
            toTime: time,
            status: "confirmed",
          },
        };
      });
    }

    window.addEventListener(DRAG_DROP_RESCHEDULE_CONFIRMED_EVENT, handleRescheduleConfirmed as EventListener);
    return () => {
      window.removeEventListener(DRAG_DROP_RESCHEDULE_CONFIRMED_EVENT, handleRescheduleConfirmed as EventListener);
    };
  }, []);

  useEffect(() => {
    const previousPathname = previousPathnameRef.current;
    previousPathnameRef.current = pathname;

    const previousReagendarId = parseReagendarReservationId(previousPathname);
    const currentReagendarId = parseReagendarReservationId(pathname);
    if (!previousReagendarId || previousReagendarId === currentReagendarId) {
      return;
    }

    setOptimisticMoves((previous) => {
      const move = previous[previousReagendarId];
      if (!move || move.status === "confirmed") {
        return previous;
      }
      const next = { ...previous };
      delete next[previousReagendarId];
      return next;
    });
  }, [pathname]);

  useEffect(() => {
    setOptimisticMoves((previous) => {
      let changed = false;
      const next = { ...previous };
      for (const item of items) {
        const move = previous[item.reservationId];
        if (!move) {
          continue;
        }
        const currentDate = toDateInput(new Date(item.startsAt));
        const currentTime = toTimeInput(new Date(item.startsAt));
        if (currentDate === move.toDate && currentTime === move.toTime) {
          delete next[item.reservationId];
          changed = true;
        }
      }
      return changed ? next : previous;
    });
  }, [items]);

  const displayItems = useMemo(() => {
    return items.map((item) => {
      const move = optimisticMoves[item.reservationId];
      if (!move) {
        return item;
      }
      const nextStartsAt = toTimestampFromDateAndTime(move.toDate, move.toTime);
      if (nextStartsAt === null) {
        return item;
      }
      const duration = item.endsAt - item.startsAt;
      return {
        ...item,
        startsAt: nextStartsAt,
        endsAt: nextStartsAt + duration,
      };
    });
  }, [items, optimisticMoves]);

  const calendarDays = useMemo(() => {
    if (viewMode === "day") {
      const current = new Date(anchorDate);
      current.setHours(0, 0, 0, 0);
      return [current];
    }
    const start = startOfWeek(anchorDate);
    return Array.from({ length: 7 }, (_, index) => {
      const next = new Date(start);
      next.setDate(start.getDate() + index);
      return next;
    });
  }, [anchorDate, viewMode]);

  const itemsByDay = useMemo(() => {
    const map = new Map<string, CalendarItem[]>();
    for (const day of calendarDays) {
      map.set(toDateInput(day), []);
    }
    for (const item of displayItems) {
      const dateKey = toDateInput(new Date(item.startsAt));
      if (!map.has(dateKey)) {
        continue;
      }
      const current = map.get(dateKey) ?? [];
      current.push(item);
      map.set(dateKey, current);
    }
    for (const [key, dayItems] of map.entries()) {
      map.set(
        key,
        dayItems.sort((a, b) => a.startsAt - b.startsAt),
      );
    }
    return map;
  }, [calendarDays, displayItems]);

  const timeSlots = useMemo(() => {
    const slots: string[] = [];
    for (let hour = CALENDAR_START_HOUR; hour <= CALENDAR_END_HOUR; hour += 1) {
      slots.push(`${String(hour).padStart(2, "0")}:00`);
      if (hour < CALENDAR_END_HOUR) {
        slots.push(`${String(hour).padStart(2, "0")}:30`);
      }
    }
    return slots;
  }, []);

  const liveMarker = useMemo(() => {
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const calendarStartMinutes = CALENDAR_START_HOUR * 60;
    const firstSlotIndex = Math.floor((currentMinutes - calendarStartMinutes) / SLOT_DURATION_MINUTES);
    if (firstSlotIndex < 0 || firstSlotIndex >= timeSlots.length) {
      return null;
    }
    const minuteOffsetInsideSlot = (currentMinutes - calendarStartMinutes) % SLOT_DURATION_MINUTES;
    const offsetPercent = (minuteOffsetInsideSlot / SLOT_DURATION_MINUTES) * 100;
    return {
      dayKey: toDateInput(now),
      slot: timeSlots[firstSlotIndex],
      offsetPercent,
    };
  }, [now, timeSlots]);

  function shiftPeriod(direction: "prev" | "next") {
    const next = new Date(anchorDate);
    const step = viewMode === "week" ? 7 : 1;
    next.setDate(next.getDate() + (direction === "next" ? step : -step));
    setAnchorDate(next);
  }

  function openEmptySlotRoute(day: Date, slot: string) {
    const date = toDateInput(day);
    router.push(
      appendParallelRouteOrigin(`${agendaPath}/celula-vazia?date=${date}&time=${slot}`, originHref),
    );
  }

  const nextOperations = useMemo(
    () =>
      [...displayItems]
        .filter((item) => item.status !== "cancelled")
        .sort((a, b) => a.startsAt - b.startsAt)
        .slice(0, 14),
    [displayItems],
  );
  const reservationById = useMemo(() => new Map(displayItems.map((item) => [item.reservationId, item])), [displayItems]);

  function handleDragEnd(event: DragEndEvent) {
    if (!dragEnabled) {
      return;
    }
    if (!event.over) {
      return;
    }
    const source = parseReservationDragId(String(event.active.id));
    const target = parseSlotDropId(String(event.over.id));
    if (!source || !target) {
      return;
    }
    const current = reservationById.get(source.reservationId);
    if (!current) {
      return;
    }
    const currentDate = toDateInput(new Date(current.startsAt));
    const currentTime = toTimeInput(new Date(current.startsAt));
    if (currentDate === target.date && currentTime === target.time) {
      return;
    }
    setOptimisticMoves((previous) => ({
      ...previous,
      [source.reservationId]: {
        reservationId: source.reservationId,
        toDate: target.date,
        toTime: target.time,
        status: "pending",
      },
    }));
    router.push(
      appendParallelRouteOrigin(
        `${agendaPath}/reagendar/${source.reservationId}?date=${target.date}&time=${target.time}&fromDragDrop=true`,
        originHref,
      ),
    );
  }

  return (
    <div className="min-w-0 space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center">
          <Button
            variant={viewMode === "week" ? "default" : "outline"}
            size="sm"
            className="w-full sm:w-auto"
            onClick={() => setViewMode("week")}
          >
            Semana
          </Button>
          <Button
            variant={viewMode === "day" ? "default" : "outline"}
            size="sm"
            className="w-full sm:w-auto"
            onClick={() => setViewMode("day")}
          >
            Dia
          </Button>
        </div>
        <div className="space-y-2 sm:flex sm:items-center sm:gap-2 sm:space-y-0">
          <div className="grid grid-cols-3 gap-2 sm:flex sm:items-center">
            <Button variant="outline" size="sm" className="w-full sm:w-auto" onClick={() => shiftPeriod("prev")}>
              Anterior
            </Button>
            <Button variant="outline" size="sm" className="w-full sm:w-auto" onClick={() => setAnchorDate(new Date())}>
              Hoje
            </Button>
            <Button variant="outline" size="sm" className="w-full sm:w-auto" onClick={() => shiftPeriod("next")}>
              Próxima
            </Button>
          </div>
          <Button asChild className="w-full sm:w-auto">
            <Link href={`${agendaPath}/novo-agendamento`} prefetch={false}>
              Novo agendamento
            </Link>
          </Button>
        </div>
      </div>

      <DndContext
        id={ADMIN_CALENDAR_DND_CONTEXT_ID}
        onDragStart={() => setIsDraggingReservation(true)}
        onDragCancel={() => setIsDraggingReservation(false)}
        onDragEnd={(event) => {
          handleDragEnd(event);
          setIsDraggingReservation(false);
        }}
      >
        <div className="w-full max-w-full overflow-x-auto rounded-xl border">
          <div
            className="grid"
            style={{
              width: `max(100%, ${90 + calendarDays.length * 140}px)`,
              gridTemplateColumns: `90px repeat(${calendarDays.length}, minmax(140px, 1fr))`,
            }}
          >
            <div className="border-b bg-muted/40 p-2 text-xs font-medium">Horário</div>
            {calendarDays.map((day) => (
              <div key={toDateInput(day)} className="border-b border-l bg-muted/40 p-2 text-xs font-medium">
                {weekdayLabel(day)}
              </div>
            ))}

            {timeSlots.map((slot) => (
              <div key={`row-${slot}`} className="contents">
                <div className="border-b p-2 text-xs text-muted-foreground">
                  {slot}
                </div>
                {calendarDays.map((day) => {
                  const dayKey = toDateInput(day);
                  const dayItems = itemsByDay.get(dayKey) ?? [];
                  const slotItems = dayItems.filter((item) => toTimeInput(new Date(item.startsAt)) === slot);
                  return (
                    <AgendaSlotCell
                      key={`${dayKey}-${slot}`}
                      dayKey={dayKey}
                      slot={slot}
                      slotItems={slotItems}
                      day={day}
                      openEmptySlotRoute={openEmptySlotRoute}
                      agendaPath={agendaPath}
                      originHref={originHref}
                      liveMarkerOffsetPercent={
                        liveMarker && liveMarker.dayKey === dayKey && liveMarker.slot === slot ? liveMarker.offsetPercent : null
                      }
                      isDraggingReservation={isDraggingReservation}
                      dragEnabled={dragEnabled}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </DndContext>

      <div className="grid gap-3 px-1 sm:px-0 lg:grid-cols-[1fr_360px]">
        <section className="rounded-xl border border-border/70 bg-card p-4 shadow-sm md:p-5">
          <h2 className="text-base font-semibold tracking-tight">Legenda de leitura rápida</h2>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Badge className={STATUS_CARD_CLASS.pending}>Pendente / aguardando paciente</Badge>
            <Badge className={STATUS_CARD_CLASS.confirmed}>Confirmado / em atendimento</Badge>
            <Badge className={STATUS_CARD_CLASS.surgery_planned}>Planejado / pós-operatório / concluído</Badge>
            <Badge className={STATUS_CARD_CLASS.cancelled}>Cancelado / não compareceu</Badge>
            <Badge className={KIND_CLASS.consulta}>Tipo: consulta</Badge>
            <Badge className={KIND_CLASS.exame}>Tipo: exame</Badge>
            <Badge className={KIND_CLASS.procedimento}>Tipo: procedimento</Badge>
          </div>
        </section>

        <section className="rounded-xl border border-border/70 bg-card p-4 shadow-sm md:p-5">
          <h2 className="text-base font-semibold tracking-tight">Operação rápida da secretária</h2>
          <div className="mt-3 space-y-2.5">
            {nextOperations.length > 0 ? (
              nextOperations.map((item) => (
                <div key={item._id} className="rounded-lg border border-border/60 bg-background/80 p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
                  <p className="truncate text-sm font-medium">{item.patientName}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Intl.DateTimeFormat("pt-BR", {
                      dateStyle: "short",
                      timeStyle: "short",
                      hour12: false,
                    }).format(new Date(item.startsAt))}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-1">
                    <Button asChild variant="outline" size="sm">
                      <Link
                        href={appendParallelRouteOrigin(
                          `${agendaPath}/reagendar/${item.reservationId}`,
                          originHref,
                        )}
                        prefetch={false}
                      >
                        Reagendar
                      </Link>
                    </Button>
                    <Button asChild variant="outline" size="sm">
                      <Link
                        href={appendParallelRouteOrigin(
                          `${agendaPath}/status/${item.reservationId}`,
                          originHref,
                        )}
                        prefetch={false}
                      >
                        Status
                      </Link>
                    </Button>
                    <Button asChild variant="outline" size="sm">
                      <Link
                        href={appendParallelRouteOrigin(
                          `${agendaPath}/contato/${item.reservationId}`,
                          originHref,
                        )}
                        prefetch={false}
                      >
                        Contato
                      </Link>
                    </Button>
                    <Button asChild variant="destructive" size="sm">
                      <Link
                        href={appendParallelRouteOrigin(
                          `${agendaPath}/cancelar/${item.reservationId}`,
                          originHref,
                        )}
                        prefetch={false}
                      >
                        Cancelar
                      </Link>
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">Não há reservas ativas para operação rápida.</p>
            )}
          </div>
        </section>
      </div>

      <section className="mx-1 rounded-xl border border-border/70 bg-card p-4 shadow-sm sm:mx-0 md:p-5">
        <h2 className="text-base font-semibold tracking-tight">Painel de lembretes por e-mail</h2>
        <div className="mt-3 grid gap-3 text-sm text-muted-foreground md:grid-cols-3">
          <p>Abra a ação de contato para disparar lembrete 24h com modelo pronto de e-mail.</p>
          <p>Use a ação de reagendamento para atualizar data e horário sem sair da agenda.</p>
          <p>Os registros recentes ficam disponíveis no drawer da reserva selecionada.</p>
        </div>
      </section>
    </div>
  );
}
