import {
  createEventTypeAction,
} from "@/app/dashboard/admin/actions";
import {
  buildAvailabilityGroups,
  getAdminSnapshot,
  selectClassName,
} from "@/app/dashboard/admin/_lib/admin-dashboard";
import { AdminEventsManager } from "@/components/admin-events-manager";
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
import { Textarea } from "@/components/ui/textarea";
import Link from "next/link";
import { ActionToastForm } from "@/components/action-toast-form";

const kindFilters = ["all", "consulta", "exame", "procedimento"] as const;

export default async function AdminEventsPage({
  searchParams,
}: {
  searchParams?: Promise<{ kind?: string }>;
}) {
  const data = await getAdminSnapshot();
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
                {kind === "all" ? "Todos" : kind}
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

        <AdminEventsManager
          eventTypes={eventTypes}
          reservations={data.reservations}
          availabilityGroups={availabilityGroups}
          selectedKind={selectedKind}
        />
        <p className="text-[11px] text-muted-foreground">
          Exclusão de evento só funciona sem reservas ou agendamentos vinculados.
        </p>
      </CardContent>
    </Card>
  );
}
