export interface CalEventType {
  id: number;
  slug: string;
  title: string;
  lengthInMinutes?: number;
}

export interface CalApiListResponse<T> {
  status: "success" | "error";
  data: T;
}

export interface CalSlotRange {
  start: string;
  end?: string;
}

export type CalSlotsByDate = Record<string, CalSlotRange[]>;

export interface CalCreateBookingAttendee {
  name: string;
  email: string;
  timeZone: string;
  phoneNumber?: string;
  language?: string;
}

export interface CalCreateBookingInput {
  start: string;
  eventTypeId: number;
  attendee: CalCreateBookingAttendee;
  bookingFieldsResponses?: Record<string, unknown>;
}

export interface CalBookingData {
  id?: number;
  uid?: string;
  title?: string;
  start?: string;
  end?: string;
  status?: string;
  paymentRequired?: boolean;
  paymentUid?: string;
  paymentUrl?: string;
  [key: string]: unknown;
}
