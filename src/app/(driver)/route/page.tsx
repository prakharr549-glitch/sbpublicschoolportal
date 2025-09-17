import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function MyRoutePage() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-3xl font-bold tracking-tight font-headline">
        My Route
      </h1>
      <Card>
        <CardHeader>
          <CardTitle>Route Information</CardTitle>
        </CardHeader>
        <CardContent>
          <p>This is where your route details and map will be displayed.</p>
        </CardContent>
      </Card>
    </div>
  );
}
