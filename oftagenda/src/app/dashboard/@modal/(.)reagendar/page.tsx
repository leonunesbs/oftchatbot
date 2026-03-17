import { getPatientRescheduleData } from "@/app/dashboard/_lib/patient-reschedule";
import { PatientRescheduleDialog } from "@/components/patient-reschedule-dialog";

export default async function DashboardRescheduleModalPage() {
  const rescheduleData = await getPatientRescheduleData();
  if (!rescheduleData) {
    return null;
  }

  return (
    <PatientRescheduleDialog
      policy={rescheduleData.policy}
      fixedEventType={rescheduleData.fixedEventType}
      fixedEventTypeOption={rescheduleData.fixedEventTypeOption}
      dateOptions={rescheduleData.dateOptions}
      availabilityError={rescheduleData.availabilityError}
      backHref="/dashboard"
    />
  );
}
