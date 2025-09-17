import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
  } from "@/components/ui/card";
  
  export default function AdminDashboardPage() {
    return (
      <div className="flex flex-col gap-6">
        <h1 className="text-3xl font-bold tracking-tight font-headline">
          Admin Dashboard
        </h1>
        <Card>
            <CardHeader>
                <CardTitle>Welcome, Admin!</CardTitle>
                <CardDescription>This is the central control panel for managing the school portal.</CardDescription>
            </CardHeader>
            <CardContent>
                <p>From here you can manage users, oversee content, and monitor site activity.</p>
            </CardContent>
        </Card>
      </div>
    );
  }
  