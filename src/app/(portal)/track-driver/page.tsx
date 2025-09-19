import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin } from "lucide-react";

export default function TrackDriverPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-4">
        <MapPin className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-bold tracking-tight font-headline">
          Track Driver
        </h1>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Live Driver Tracking</CardTitle>
        </CardHeader>
        <CardContent>
          <p>
            This is where you will be able to track the school bus in real-time.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
