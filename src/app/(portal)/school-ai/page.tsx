import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
  } from "@/components/ui/card";
  import { Bot } from "lucide-react";
  
  export default function SchoolAiPage() {
    return (
      <div className="flex flex-col gap-6">
        <div className="flex items-center gap-4">
            <Bot className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold tracking-tight font-headline">
            School AI Assistant
            </h1>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Welcome to the Future of Learning</CardTitle>
            <CardDescription>
              Our AI assistant is here to help with your questions.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p>AI features will be implemented here.</p>
          </CardContent>
        </Card>
      </div>
    );
  }
  