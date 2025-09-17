import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
  } from "@/components/ui/card";
  
  export default function HomeworkPage() {
    return (
      <div className="flex flex-col gap-6">
        <h1 className="text-3xl font-bold tracking-tight font-headline">
          Homework
        </h1>
        <Card>
          <CardHeader>
            <CardTitle>Upcoming Assignments</CardTitle>
            <CardDescription>
              Here is a list of homework assignments.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p>Homework details will be displayed here.</p>
          </CardContent>
        </Card>
      </div>
    );
  }
  