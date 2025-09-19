import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users } from "lucide-react";

export default function MyClassesPage() {
  return (
    <div className="flex flex-col gap-6">
       <div className="flex items-center gap-4">
        <Users className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-bold tracking-tight font-headline">
          My Classes
        </h1>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Your Class Roster</CardTitle>
        </CardHeader>
        <CardContent>
          <p>This is where you will see a list of your classes and students.</p>
        </CardContent>
      </Card>
    </div>
  );
}
