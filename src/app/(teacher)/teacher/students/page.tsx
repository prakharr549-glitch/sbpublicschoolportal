import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function MyStudentsPage() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-3xl font-bold tracking-tight font-headline">
        My Students
      </h1>
      <Card>
        <CardHeader>
          <CardTitle>Student Roster</CardTitle>
        </CardHeader>
        <CardContent>
          <p>This is where you will see a list of your students.</p>
        </CardContent>
      </Card>
    </div>
  );
}
