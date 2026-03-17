"use client";

import { updateEventTypeAction } from "@/app/dashboard/admin/actions";
import { ActionToastForm } from "@/components/action-toast-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { closeParallelRoute } from "@/lib/parallel-route-navigation";
import { useRouter } from "next/navigation";

const selectClassName = "h-9 rounded-md border border-input bg-input/20 px-2 text-sm";

const weekdayLabels = [
  "Domingo",
  "Segunda-feira",
  "Terça-feira",
  "Quarta-feira",
  "Quinta-feira",
  "Sexta-feira",
  "Sábado",
];

type AvailabilitySlot = {
  _id: string;
  weekday: number;
  startTime: string;
  endTime: string;
  timezone: string;
};

type AvailabilityGroup = {
  name: string;
  representativeId: string;
  slots: AvailabilitySlot[];
};

type EventTypeData = {
  _id: string;
  slug: string;
  name: string;
  address: string;
  notes: string;
  durationMinutes: number;
  priceReais: string;
  kind: "consulta" | "procedimento" | "exame";
  paymentMode: "booking_fee" | "full_payment" | "in_person";
  availabilityId: string;
  location: "fortaleza" | "sao_domingos_do_maranhao" | "fortuna";
  active: boolean;
};

type AdminEventTypeEditorViewProps = {
  eventType: EventTypeData;
  availabilityGroups: AvailabilityGroup[];
  linkedAvailabilityGroup: AvailabilityGroup | null;
  asDrawer: boolean;
  backHref: string;
};

function EventTypeEditorContent({
  eventType,
  availabilityGroups,
  linkedAvailabilityGroup,
}: {
  eventType: EventTypeData;
  availabilityGroups: AvailabilityGroup[];
  linkedAvailabilityGroup: AvailabilityGroup | null;
}) {
  return (
    <div className="space-y-4">
      <ActionToastForm
        action={updateEventTypeAction}
        className="grid gap-3 rounded-md border border-border/70 p-3"
        successMessage="Evento atualizado com sucesso."
        errorMessage="Não foi possível atualizar o evento."
      >
        <input type="hidden" name="eventTypeId" value={eventType._id} />
        <input type="hidden" name="location" value={eventType.location} />

        <p className="text-xs text-muted-foreground">
          Revise os dados com atenção. Campos com impacto na agenda e no pagamento possuem instruções logo abaixo.
        </p>

        <div className="grid gap-3 md:grid-cols-2">
          <div className="space-y-1">
            <Label htmlFor="event-slug">Slug</Label>
            <Input id="event-slug" name="slug" defaultValue={eventType.slug} required aria-describedby="event-slug-help" />
            <p id="event-slug-help" className="text-xs text-muted-foreground">
              Identificador usado na URL e nas integrações.
            </p>
          </div>
          <div className="space-y-1">
            <Label htmlFor="event-name">Nome do evento</Label>
            <Input
              id="event-name"
              name="name"
              defaultValue={eventType.name}
              required
              aria-describedby="event-name-help"
            />
            <p id="event-name-help" className="text-xs text-muted-foreground">
              Nome exibido para equipe e pacientes.
            </p>
          </div>
        </div>

        <div className="space-y-1">
          <Label htmlFor="event-address">Endereço</Label>
          <Input
            id="event-address"
            name="address"
            defaultValue={eventType.address}
            required
            aria-describedby="event-address-help"
          />
          <p id="event-address-help" className="text-xs text-muted-foreground">
            Informe unidade, rua e complemento principal para orientação da pessoa paciente.
          </p>
        </div>

        <div className="space-y-1">
          <Label htmlFor="event-notes">Observações internas</Label>
          <Textarea
            id="event-notes"
            name="notes"
            defaultValue={eventType.notes}
            placeholder="Descrição opcional"
            aria-describedby="event-notes-help"
          />
          <p id="event-notes-help" className="text-xs text-muted-foreground">
            Campo opcional para contexto administrativo.
          </p>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <div className="space-y-1">
            <Label htmlFor="event-duration">Duração (min)</Label>
            <Input
              id="event-duration"
              name="durationMinutes"
              type="number"
              min={5}
              defaultValue={eventType.durationMinutes}
              aria-describedby="event-duration-help"
            />
            <p id="event-duration-help" className="text-xs text-muted-foreground">
              Duração total prevista do atendimento.
            </p>
          </div>
          <div className="space-y-1">
            <Label htmlFor="event-price">Preço (R$)</Label>
            <Input
              id="event-price"
              name="priceReais"
              type="number"
              min={0}
              step="0.01"
              defaultValue={eventType.priceReais}
              aria-describedby="event-price-help"
            />
            <p id="event-price-help" className="text-xs text-muted-foreground">
              Valor cobrado no fluxo de pagamento.
            </p>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <div className="space-y-1">
            <Label htmlFor="event-kind">Tipo</Label>
            <select
              id="event-kind"
              name="kind"
              className={selectClassName}
              defaultValue={eventType.kind}
              aria-describedby="event-kind-help"
            >
              <option value="consulta">consulta</option>
              <option value="procedimento">procedimento</option>
              <option value="exame">exame</option>
            </select>
            <p id="event-kind-help" className="text-xs text-muted-foreground">
              Categoria usada para filtros e organização clínica.
            </p>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <div className="space-y-1">
            <Label htmlFor="event-payment-mode">Modo de pagamento</Label>
            <select
              id="event-payment-mode"
              name="paymentMode"
              className={selectClassName}
              defaultValue={eventType.paymentMode}
              aria-describedby="event-payment-help"
            >
              <option value="booking_fee">Taxa de reserva</option>
              <option value="full_payment">Reserva completa</option>
              <option value="in_person">Pagamento presencial</option>
            </select>
            <p id="event-payment-help" className="text-xs text-muted-foreground">
              Define a forma de cobrança aplicada no agendamento.
            </p>
          </div>
          <div className="space-y-1">
            <Label htmlFor="event-status">Status</Label>
            <select
              id="event-status"
              name="active"
              className={selectClassName}
              defaultValue={String(eventType.active)}
              aria-describedby="event-status-help"
            >
              <option value="true">Ativo</option>
              <option value="false">Inativo</option>
            </select>
            <p id="event-status-help" className="text-xs text-muted-foreground">
              Eventos inativos não devem ser usados para novos agendamentos.
            </p>
          </div>
        </div>

        <div className="grid gap-1">
          <Label htmlFor="event-availability">Grupo de disponibilidade</Label>
          <select
            id="event-availability"
            name="availabilityId"
            className={selectClassName}
            defaultValue={eventType.availabilityId}
            required
            disabled={availabilityGroups.length === 0}
            aria-describedby="event-availability-help"
          >
            {availabilityGroups.length === 0 ? <option value="">Sem disponibilidade cadastrada</option> : null}
            {availabilityGroups.map((group) => (
              <option key={`event-update-availability-${eventType._id}-${group.representativeId}`} value={group.representativeId}>
                {group.name} ({group.slots.length} faixa(s))
              </option>
            ))}
          </select>
          <p id="event-availability-help" className="text-xs text-muted-foreground">
            Selecione o grupo que define os dias e horários disponíveis para este evento.
          </p>
        </div>

        <Button variant="secondary" size="sm" type="submit" disabled={availabilityGroups.length === 0}>
          Salvar alterações
        </Button>
      </ActionToastForm>

      <div className="rounded-md border border-dashed p-3">
        <p className="text-xs font-medium">Horários atualmente aplicados a este evento</p>
        {linkedAvailabilityGroup ? (
          <div className="mt-2 space-y-1">
            <p className="text-xs font-medium">{linkedAvailabilityGroup.name}</p>
            {linkedAvailabilityGroup.slots.map((slot) => (
              <p key={`event-linked-slot-${eventType._id}-${slot._id}`} className="text-xs text-muted-foreground">
                {weekdayLabels[slot.weekday]} - {slot.startTime} às {slot.endTime} ({slot.timezone})
              </p>
            ))}
          </div>
        ) : (
          <p className="mt-2 text-xs text-muted-foreground">Este evento ainda não tem horários configurados.</p>
        )}
      </div>
    </div>
  );
}

export function AdminEventTypeEditorView({
  eventType,
  availabilityGroups,
  linkedAvailabilityGroup,
  asDrawer,
  backHref,
}: AdminEventTypeEditorViewProps) {
  const router = useRouter();
  const handleBack = () => closeParallelRoute(router, backHref);

  if (asDrawer) {
    return (
      <Dialog
        open
        onOpenChange={(open) => {
          if (!open) {
            closeParallelRoute(router, backHref);
          }
        }}
      >
        <DialogContent className="max-h-[90vh] w-full overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Editar evento</DialogTitle>
            <DialogDescription>Atualize os dados principais e o vínculo com a disponibilidade.</DialogDescription>
          </DialogHeader>
          <EventTypeEditorContent
            eventType={eventType}
            availabilityGroups={availabilityGroups}
            linkedAvailabilityGroup={linkedAvailabilityGroup}
          />
          <div className="flex justify-end">
            <Button type="button" variant="outline" size="sm" onClick={handleBack}>
              Voltar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <div className="mx-auto w-full max-w-2xl p-4">
      <Card variant="flat-mobile" className="border-border/70">
        <CardHeader>
          <CardTitle>Editar evento</CardTitle>
          <CardDescription>Ajuste as informações do evento e mantenha sua disponibilidade atualizada.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <EventTypeEditorContent
            eventType={eventType}
            availabilityGroups={availabilityGroups}
            linkedAvailabilityGroup={linkedAvailabilityGroup}
          />
          <div className="flex justify-end">
            <Button type="button" variant="outline" size="sm" onClick={handleBack}>
              Voltar
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
