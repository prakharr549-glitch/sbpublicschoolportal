import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function DriverNotificationsPage() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-3xl font-bold tracking-tight font-headline">
        Notifications
      </h1>
      <Card>
        <CardHeader>
          <CardTitle>Route Alerts</CardTitle>
        </CardHeader>
        <CardContent>
          <p>This is where you will receive important notifications and alerts.</p>
        </CardContent>
      </Card>
    </div>
  );
}
