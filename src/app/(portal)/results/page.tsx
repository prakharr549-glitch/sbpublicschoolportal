import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Download } from "lucide-react";

export default function ResultsPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-4">
        <Download className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-bold tracking-tight font-headline">
          Download Result
        </h1>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Download Your Results</CardTitle>
        </CardHeader>
        <CardContent>
          <p>
            This is where you will be able to download your academic results.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
