import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
  } from "@/components/ui/card";
  
  export default function TeacherDashboardPage() {
    return (
      <div className="flex flex-col gap-6">
        <h1 className="text-3xl font-bold tracking-tight font-headline">
          Teacher Dashboard
        </h1>
        <Card>
            <CardHeader>
                <CardTitle>Welcome, Teacher!</CardTitle>
                <CardDescription>Your central hub for managing classes and students.</CardDescription>
            </CardHeader>
            <CardContent>
                <p>Here you can access your class schedules, student information, and grading tools.</p>
            </CardContent>
        </Card>
      </div>
    );
  }
  