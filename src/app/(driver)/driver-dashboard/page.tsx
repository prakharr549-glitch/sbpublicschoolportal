import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
  } from "@/components/ui/card";
  
  export default function DriverDashboardPage() {
    return (
      <div className="flex flex-col gap-6">
        <h1 className="text-3xl font-bold tracking-tight font-headline">
          Driver Dashboard
        </h1>
        <Card>
            <CardHeader>
                <CardTitle>Welcome, Driver!</CardTitle>
                <CardDescription>Your hub for route information and schedules.</CardDescription>
            </CardHeader>
            <CardContent>
                <p>Check your assigned routes, view student lists, and receive updates.</p>
            </CardContent>
        </Card>
      </div>
    );
  }
  