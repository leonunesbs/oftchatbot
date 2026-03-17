import Link from "next/link";
import { buildAvailabilityGroups, getAdminSnapshot } from "@/app/dashboard/admin/_lib/admin-dashboard";
import { AdminAvailabilityDataTable } from "@/components/admin-availability-data-table";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default async function AdminAvailabilityPage() {
  const data = await getAdminSnapshot();
  const availabilityGroups = buildAvailabilityGroups(data);

  return (
    <Card variant="flat-mobile" className="border-border/70">
      <CardHeader>
        <CardTitle>Disponibilidade</CardTitle>
        <CardDescription>Visualize as disponibilidades cadastradas e abra a edição de horários.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex justify-end">
          <Button size="sm" asChild>
            <Link href="/dashboard/admin/nova-disponibilidade">Nova disponibilidade</Link>
          </Button>
        </div>
        <AdminAvailabilityDataTable availabilityGroups={availabilityGroups} />
      </CardContent>
    </Card>
  );
}
