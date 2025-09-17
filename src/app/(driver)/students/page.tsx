import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function StudentListPage() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-3xl font-bold tracking-tight font-headline">
        Student List
      </h1>
      <Card>
        <CardHeader>
          <CardTitle>Students on Your Route</CardTitle>
        </CardHeader>
        <CardContent>
          <p>This is where the list of students on your bus route will be displayed.</p>
        </CardContent>
      </Card>
    </div>
  );
}
