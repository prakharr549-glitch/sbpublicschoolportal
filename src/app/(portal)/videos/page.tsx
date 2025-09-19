import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Video } from "lucide-react";

export default function SchoolVideosPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-4">
        <Video className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-bold tracking-tight font-headline">
          School Videos
        </h1>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Video Gallery</CardTitle>
        </CardHeader>
        <CardContent>
          <p>
            This is where a gallery of school videos will be displayed.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
