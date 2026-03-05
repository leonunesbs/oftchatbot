import BookingPopup from "./BookingPopup";

function CalendarIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}

export default function BookingFloatButton() {
  return (
    <div className="fixed bottom-6 left-6 z-50">
      <BookingPopup
        size="lg"
        className="h-14 gap-2 rounded-full px-5 shadow-lg hover:shadow-xl"
        triggerAriaLabel="Abrir agendamento online"
      >
        <CalendarIcon className="size-5" />
        <span className="hidden sm:inline">Agendar Online</span>
      </BookingPopup>
    </div>
  );
}
