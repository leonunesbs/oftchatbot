import {
  createEventTypeAction,
  createReservationAction,
  deleteEventTypeAction,
  deleteReservationAction,
  setEventTypeActiveAction,
  updateReservationAction,
} from "@/app/dashboard/admin/actions";
import {
  buildAvailabilityGroups,
  formatDateForInput,
  formatDateTime24h,
  formatMoney,
  formatTimeForInput,
  getAdminSnapshot,
  getAvailabilityById,
  selectClassName,
} from "@/app/dashboard/admin/_lib/admin-dashboard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import Link from "next/link";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { ActionToastForm } from "@/components/action-toast-form";

const kindFilters = ["all", "consulta", "exame", "procedimento"] as const;

const kindClassName: Record<"consulta" | "exame" | "procedimento", string> = {
  consulta: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-200",
  exame: "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-200",
  procedimento: "bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-200",
};

const paymentModeLabels: Record<string, string> = {
  booking_fee: "Taxa de reserva",
  full_payment: "Reserva completa",
  in_person: "Pagamento presencial",
};

const paymentModeClassName: Record<string, string> = {
  booking_fee: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200",
  full_payment: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200",
  in_person: "bg-slate-100 text-slate-800 dark:bg-slate-950 dark:text-slate-200",
};

export default async function AdminEventsPage({
  searchParams,
}: {
  searchParams?: Promise<{ kind?: string }>;
}) {
  const data = await getAdminSnapshot();
  const availabilityById = getAvailabilityById(data);
  const availabilityGroups = buildAvailabilityGroups(data);
  const resolvedSearchParams = (await searchParams) ?? {};
  const selectedKind = kindFilters.includes((resolvedSearchParams.kind as (typeof kindFilters)[number]) ?? "all")
    ? ((resolvedSearchParams.kind as (typeof kindFilters)[number]) ?? "all")
    : "all";
  const eventTypes = data.eventTypes.filter((eventType) =>
    selectedKind === "all" ? true : (eventType.kind ?? "consulta") === selectedKind,
  );

  return (
    <Card variant="flat-mobile" className="border-border/70">
      <CardHeader>
        <CardTitle>Eventos</CardTitle>
        <CardDescription>CRUD completo para eventos que representam os locais da reserva.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2">
          {kindFilters.map((kind) => (
            <Button key={kind} variant={selectedKind === kind ? "default" : "outline"} size="sm" asChild>
              <Link href={kind === "all" ? "/dashboard/admin/eventos" : `/dashboard/admin/eventos?kind=${kind}`}>
                {kind === "all" ? "todos" : kind}
              </Link>
            </Button>
          ))}
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button disabled={availabilityGroups.length === 0}>Cadastrar evento</Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Novo evento</DialogTitle>
              <DialogDescription>Preencha os dados para cadastrar um novo evento.</DialogDescription>
            </DialogHeader>
            <ActionToastForm
              action={createEventTypeAction}
              className="grid gap-2"
              successMessage="Evento criado com sucesso."
              errorMessage="Não foi possível criar o evento."
            >
              <Label htmlFor="event-slug">Slug</Label>
              <Input id="event-slug" name="slug" required placeholder="consulta-oftalmologica" />
              <Label htmlFor="event-name">Nome do evento</Label>
              <Input id="event-name" name="name" required placeholder="Consulta oftalmológica inicial" />
              <Label htmlFor="event-address">Endereço</Label>
              <Input id="event-address" name="address" required placeholder="Rua Exemplo, 123 - Centro" />
              <Label htmlFor="event-notes">Observações</Label>
              <Textarea id="event-notes" name="notes" placeholder="Complemento opcional" />
              <div className="space-y-2">
                <Label htmlFor="event-duration">Duração (min)</Label>
                <Input id="event-duration" name="durationMinutes" type="number" min={5} defaultValue={30} />
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div className="space-y-2">
                  <Label htmlFor="event-kind">Tipo</Label>
                  <select id="event-kind" name="kind" className={selectClassName} defaultValue="consulta">
                    <option value="consulta">consulta</option>
                    <option value="procedimento">procedimento</option>
                    <option value="exame">exame</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="event-payment-mode">Modo de pagamento</Label>
                  <select id="event-payment-mode" name="paymentMode" className={selectClassName} defaultValue="booking_fee">
                    <option value="booking_fee">Taxa de reserva</option>
                    <option value="full_payment">Reserva completa</option>
                    <option value="in_person">Pagamento presencial</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="event-availability">Disponibilidade</Label>
                  <select
                    id="event-availability"
                    name="availabilityId"
                    className={selectClassName}
                    defaultValue={availabilityGroups[0]?.representativeId}
                    required
                    disabled={availabilityGroups.length === 0}
                  >
                    {availabilityGroups.map((group) => (
                      <option key={`event-create-availability-${group.representativeId}`} value={group.representativeId}>
                        {group.name} ({group.slots.length} faixa(s))
                      </option>
                    ))}
                  </select>
                </div>
                <input type="hidden" name="location" value="fortaleza" />
              </div>
              <Button type="submit" disabled={availabilityGroups.length === 0}>
                Criar evento
              </Button>
            </ActionToastForm>
          </DialogContent>
        </Dialog>
        {availabilityGroups.length === 0 ? (
          <p className="text-xs text-muted-foreground">Crie uma disponibilidade global antes de cadastrar eventos.</p>
        ) : null}

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Evento</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Duração</TableHead>
                <TableHead>Preço</TableHead>
                <TableHead>Pagamento</TableHead>
                <TableHead>Disponibilidade</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Reservas</TableHead>
                <TableHead className="w-[240px]">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {eventTypes.map((eventType) => {
                const linkedAvailability = eventType.availabilityId
                  ? availabilityById.get(String(eventType.availabilityId)) ?? null
                  : null;
                const linkedAvailabilityGroup = linkedAvailability
                  ? availabilityGroups.find((group) =>
                      group.slots.some((slot) => String(slot._id) === String(linkedAvailability._id)),
                    ) ?? null
                  : null;
                const eventReservations = data.reservations.filter((reservation) => reservation.eventTypeId === eventType._id);

                return (
                  <TableRow key={eventType._id}>
                    <TableCell className="font-medium">{eventType.name ?? eventType.title}</TableCell>
                    <TableCell>{eventType.slug}</TableCell>
                    <TableCell>
                      <Badge className={kindClassName[eventType.kind ?? "consulta"]}>{eventType.kind ?? "consulta"}</Badge>
                    </TableCell>
                    <TableCell>{eventType.durationMinutes} min</TableCell>
                    <TableCell>{formatMoney(eventType.priceCents ?? 0)}</TableCell>
                    <TableCell>
                      <Badge className={paymentModeClassName[eventType.paymentMode ?? "booking_fee"] ?? ""}>
                        {paymentModeLabels[eventType.paymentMode ?? "booking_fee"] ?? "Taxa de reserva"}
                      </Badge>
                    </TableCell>
                    <TableCell>{linkedAvailabilityGroup?.name ?? "Sem grupo"}</TableCell>
                    <TableCell>
                      <Badge variant={eventType.active ? "default" : "outline"}>
                        {eventType.active ? "Ativo" : "Inativo"}
                      </Badge>
                    </TableCell>
                    <TableCell>{eventReservations.length}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-2">
                        <Button size="sm" variant="outline" asChild>
                          <Link
                            href={
                              selectedKind === "all"
                                ? `/dashboard/admin/eventos/editar/${eventType._id}`
                                : `/dashboard/admin/eventos/editar/${eventType._id}?kind=${selectedKind}`
                            }
                          >
                            Editar
                          </Link>
                        </Button>

                        <Dialog>
                          <DialogTrigger asChild>
                            <Button size="sm" disabled={!eventType.availabilityId}>
                              Reservas
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-4xl">
                            <DialogHeader>
                              <DialogTitle>Reservas do evento</DialogTitle>
                              <DialogDescription>
                                Crie novas reservas e gerencie as já vinculadas a este evento.
                              </DialogDescription>
                            </DialogHeader>

                            <ActionToastForm
                              action={createReservationAction}
                              className="grid gap-2 rounded-md border p-2"
                              successMessage="Reserva criada com sucesso."
                              errorMessage="Não foi possível criar a reserva."
                            >
                              <input type="hidden" name="eventTypeId" value={eventType._id} />
                              <input type="hidden" name="availabilityId" value={eventType.availabilityId ?? ""} />
                              <Input name="clerkUserId" placeholder="user_..." required />
                              <div className="grid grid-cols-3 gap-2">
                                <Input name="date" type="date" required />
                                <Input
                                  name="time"
                                  type="time"
                                  step={300}
                                  required
                                  aria-label="Horário"
                                  title="Use formato 24h (HH:mm)"
                                />
                                <select name="status" className={selectClassName} defaultValue="pending">
                                  <option value="pending">pending</option>
                                  <option value="awaiting_patient">awaiting_patient</option>
                                  <option value="confirmed">confirmed</option>
                                  <option value="in_care">in_care</option>
                                  <option value="surgery_planned">surgery_planned</option>
                                  <option value="postop_followup">postop_followup</option>
                                  <option value="cancelled">cancelled</option>
                                  <option value="completed">completed</option>
                                  <option value="no_show">no_show</option>
                                </select>
                              </div>
                              {linkedAvailability ? (
                                <p className="text-xs text-muted-foreground">
                                  Usando grupo: {linkedAvailabilityGroup?.name ?? "Disponibilidade"}
                                </p>
                              ) : (
                                <p className="text-xs text-destructive">
                                  Vincule uma disponibilidade ao evento para criar reservas.
                                </p>
                              )}
                              <Input name="notes" placeholder="Observação opcional" />
                              <Button size="sm" type="submit" disabled={!eventType.availabilityId}>
                                Salvar reserva
                              </Button>
                            </ActionToastForm>

                            <div className="rounded-md border">
                              <Table>
                                <TableHeader>
                                  <TableRow>
                                    <TableHead>Data/Hora</TableHead>
                                    <TableHead>Usuário</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Observação</TableHead>
                                    <TableHead className="w-[190px]">Ações</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {eventReservations.map((reservation) => (
                                    <TableRow key={reservation._id}>
                                      <TableCell>
                                        {formatDateTime24h(reservation.startsAt)}
                                        <p className="text-xs text-muted-foreground">{reservation.availabilityLabel}</p>
                                      </TableCell>
                                      <TableCell className="text-xs">{reservation.clerkUserId}</TableCell>
                                      <TableCell>{reservation.status}</TableCell>
                                      <TableCell className="text-xs text-muted-foreground">{reservation.notes ?? "-"}</TableCell>
                                      <TableCell>
                                        <Dialog>
                                          <DialogTrigger asChild>
                                            <Button size="sm" variant="outline">
                                              Editar reserva
                                            </Button>
                                          </DialogTrigger>
                                          <DialogContent className="max-w-xl">
                                            <DialogHeader>
                                              <DialogTitle>Editar reserva</DialogTitle>
                                              <DialogDescription>Atualize dados, horário e status da reserva.</DialogDescription>
                                            </DialogHeader>
                                            <ActionToastForm
                                              action={updateReservationAction}
                                              className="grid gap-2"
                                              successMessage="Reserva atualizada com sucesso."
                                              errorMessage="Não foi possível atualizar a reserva."
                                            >
                                              <input type="hidden" name="reservationId" value={reservation._id} />
                                              <input type="hidden" name="eventTypeId" value={eventType._id} />
                                              <input
                                                type="hidden"
                                                name="availabilityId"
                                                value={eventType.availabilityId ?? reservation.availabilityId}
                                              />
                                              <Input name="clerkUserId" defaultValue={reservation.clerkUserId} required />
                                              <div className="grid grid-cols-3 gap-2">
                                                <Input
                                                  name="date"
                                                  type="date"
                                                  defaultValue={formatDateForInput(reservation.startsAt)}
                                                />
                                                <Input
                                                  name="time"
                                                  type="time"
                                                  step={300}
                                                  defaultValue={formatTimeForInput(reservation.startsAt)}
                                                  aria-label="Horário"
                                                  title="Use formato 24h (HH:mm)"
                                                />
                                                <select name="status" className={selectClassName} defaultValue={reservation.status}>
                                                  <option value="pending">pending</option>
                                                  <option value="awaiting_patient">awaiting_patient</option>
                                                  <option value="confirmed">confirmed</option>
                                                  <option value="in_care">in_care</option>
                                                  <option value="surgery_planned">surgery_planned</option>
                                                  <option value="postop_followup">postop_followup</option>
                                                  <option value="cancelled">cancelled</option>
                                                  <option value="completed">completed</option>
                                                  <option value="no_show">no_show</option>
                                                </select>
                                              </div>
                                              <Input name="notes" defaultValue={reservation.notes ?? ""} placeholder="Observação" />
                                              <Button size="sm" variant="secondary" type="submit">
                                                Salvar reserva
                                              </Button>
                                            </ActionToastForm>
                                            <ActionToastForm
                                              action={deleteReservationAction}
                                              successMessage="Reserva excluída com sucesso."
                                              errorMessage="Não foi possível excluir a reserva."
                                            >
                                              <input type="hidden" name="reservationId" value={reservation._id} />
                                              <AlertDialog>
                                                <AlertDialogTrigger asChild>
                                                  <Button size="sm" variant="destructive" type="button">
                                                    Excluir reserva
                                                  </Button>
                                                </AlertDialogTrigger>
                                                <AlertDialogContent>
                                                  <AlertDialogHeader>
                                                    <AlertDialogTitle>Excluir esta reserva?</AlertDialogTitle>
                                                    <AlertDialogDescription>
                                                      Esta acao e irreversivel e remove a reserva da agenda.
                                                    </AlertDialogDescription>
                                                  </AlertDialogHeader>
                                                  <AlertDialogFooter>
                                                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                                    <AlertDialogAction type="submit">Excluir</AlertDialogAction>
                                                  </AlertDialogFooter>
                                                </AlertDialogContent>
                                              </AlertDialog>
                                            </ActionToastForm>
                                          </DialogContent>
                                        </Dialog>
                                      </TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            </div>
                          </DialogContent>
                        </Dialog>

                        <ActionToastForm
                          action={setEventTypeActiveAction}
                          successMessage={eventType.active ? "Evento inativado com sucesso." : "Evento ativado com sucesso."}
                          errorMessage="Não foi possível atualizar o status do evento."
                        >
                          <input type="hidden" name="eventTypeId" value={eventType._id} />
                          <input type="hidden" name="active" value={String(!eventType.active)} />
                          <Button variant="outline" size="sm" type="submit">
                            {eventType.active ? "Inativar" : "Ativar"}
                          </Button>
                        </ActionToastForm>
                        <ActionToastForm
                          action={deleteEventTypeAction}
                          successMessage="Evento excluído com sucesso."
                          errorMessage="Não foi possível excluir o evento."
                        >
                          <input type="hidden" name="eventTypeId" value={eventType._id} />
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="destructive" size="sm" type="button">
                                Excluir
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Excluir este evento?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Esta acao remove o tipo de evento e nao pode ser desfeita.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction type="submit">Excluir</AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </ActionToastForm>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
        <p className="text-[11px] text-muted-foreground">
          Exclusão de evento só funciona sem reservas ou agendamentos vinculados.
        </p>
      </CardContent>
    </Card>
  );
}
