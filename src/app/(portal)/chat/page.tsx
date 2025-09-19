import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageSquare } from "lucide-react";

export default function ChatPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-4">
        <MessageSquare className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-bold tracking-tight font-headline">
          Chat
        </h1>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>AI Chat Assistant</CardTitle>
        </CardHeader>
        <CardContent>
          <p>
            This is where the AI-powered chat assistant will be. You can ask it questions about the school.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
