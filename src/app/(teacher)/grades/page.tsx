import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function GradesPage() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-3xl font-bold tracking-tight font-headline">
        Grades
      </h1>
      <Card>
        <CardHeader>
          <CardTitle>Gradebook</CardTitle>
        </CardHeader>
        <CardContent>
          <p>This is where you will manage student grades.</p>
        </CardContent>
      </Card>
    </div>
  );
}
