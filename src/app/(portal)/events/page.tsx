import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";

export default function EventsPage() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-3xl font-bold tracking-tight font-headline">
        Events Calendar
      </h1>
      <Card>
        <CardHeader>
          <CardTitle>Upcoming School Events</CardTitle>
          <CardDescription>
            Select a date to see scheduled events.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center">
            <Calendar
              mode="single"
              selected={new Date()}
              className="rounded-md border"
            />
          </div>
          <div className="mt-4 space-y-2">
            <h3 className="font-semibold text-lg">Events for Today:</h3>
            <ul className="list-disc list-inside text-muted-foreground">
              <li>Morning Assembly - All Grades</li>
              <li>Basketball Practice - Grades 9-12</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
