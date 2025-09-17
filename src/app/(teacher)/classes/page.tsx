import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function MyClassesPage() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-3xl font-bold tracking-tight font-headline">
        My Classes
      </h1>
      <Card>
        <CardHeader>
          <CardTitle>Class Schedule</CardTitle>
        </CardHeader>
        <CardContent>
          <p>This is where you will see your class schedule and details.</p>
        </CardContent>
      </Card>
    </div>
  );
}
