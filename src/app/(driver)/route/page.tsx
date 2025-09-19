import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Map } from "lucide-react";

export default function DriverRoutePage() {
  return (
    <div className="flex flex-col gap-6">
       <div className="flex items-center gap-4">
        <Map className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-bold tracking-tight font-headline">
          My Route
        </h1>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Today's Route Information</CardTitle>
        </CardHeader>
        <CardContent>
          <p>This is where your assigned route details will be displayed.</p>
        </CardContent>
      </Card>
    </div>
  );
}
