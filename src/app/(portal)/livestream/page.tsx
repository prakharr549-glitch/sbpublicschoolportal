import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Radio } from "lucide-react";

export default function LiveStreamPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-4">
        <Radio className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-bold tracking-tight font-headline">
          Live Stream
        </h1>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Live School Functions</CardTitle>
        </CardHeader>
        <CardContent>
          <p>
            This is where live streams of school functions will be available.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
