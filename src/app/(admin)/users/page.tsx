import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function ManageUsersPage() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-3xl font-bold tracking-tight font-headline">
        Manage Users
      </h1>
      <Card>
        <CardHeader>
          <CardTitle>User Management</CardTitle>
        </CardHeader>
        <CardContent>
          <p>This is where you will manage user roles and permissions.</p>
        </CardContent>
      </Card>
    </div>
  );
}
