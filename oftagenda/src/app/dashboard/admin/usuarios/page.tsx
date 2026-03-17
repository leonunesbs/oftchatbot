import { formatMoney, getAdminSnapshot } from "@/app/dashboard/admin/_lib/admin-dashboard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AdminUsersDataTable } from "@/components/admin-users-data-table";

export default async function AdminUsersPage() {
  const data = await getAdminSnapshot();

  return (
    <Card variant="flat-mobile" className="border-border/70">
      <CardHeader>
        <CardTitle>Usuários</CardTitle>
        <CardDescription>Atividade agregada por usuário Clerk.</CardDescription>
      </CardHeader>
      <CardContent>
        <AdminUsersDataTable users={data.users} formatMoney={formatMoney} />
      </CardContent>
    </Card>
  );
}
