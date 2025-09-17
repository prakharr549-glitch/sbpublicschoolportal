"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Bot, Loader2, User } from "lucide-react";
import { useState } from "react";
import { answerQuestion } from "@/ai/flows/school-ai-flow";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const questionFormSchema = z.object({
  question: z.string().min(10, {
    message: "Question must be at least 10 characters.",
  }),
});

type QuestionFormValues = z.infer<typeof questionFormSchema>;

export default function SchoolAiPage() {
  const { toast } = useToast();
  const [conversation, setConversation] = useState<{ role: 'user' | 'assistant'; content: string }[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<QuestionFormValues>({
    resolver: zodResolver(questionFormSchema),
    defaultValues: {
      question: "",
    },
  });

  async function onSubmit(data: QuestionFormValues) {
    setIsLoading(true);
    setConversation(prev => [...prev, { role: 'user', content: data.question }]);

    try {
      const response = await answerQuestion(data.question);
      setConversation(prev => [...prev, { role: 'assistant', content: response }]);
    } catch (error) {
      console.error("Error getting answer:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "There was a problem getting an answer from the AI.",
      });
    } finally {
      setIsLoading(false);
      form.reset();
    }
  }

  return (
    <div className="flex flex-col gap-6 h-full">
      <div className="flex items-center gap-4">
        <Bot className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-bold tracking-tight font-headline">
          School AI Assistant
        </h1>
      </div>

      <div className="flex-1 flex flex-col gap-4">
        <Card className="flex-1">
          <CardHeader>
            <CardTitle>Conversation</CardTitle>
            <CardDescription>
              Your chat with the AI assistant.
            </CardDescription>
          </CardHeader>
          <CardContent className="h-[400px] overflow-y-auto space-y-4">
            {conversation.length === 0 ? (
              <div className="flex h-full items-center justify-center text-muted-foreground">
                Ask a question below to start the conversation.
              </div>
            ) : (
              conversation.map((entry, index) => (
                <div key={index} className={`flex items-start gap-4 ${entry.role === 'user' ? 'justify-end' : ''}`}>
                   {entry.role === 'assistant' && (
                     <Avatar className="h-8 w-8">
                       <AvatarFallback><Bot size={20} /></AvatarFallback>
                     </Avatar>
                   )}
                  <div className={`rounded-lg p-3 max-w-[80%] ${entry.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                    <p className="text-sm whitespace-pre-wrap">{entry.content}</p>
                  </div>
                   {entry.role === 'user' && (
                     <Avatar className="h-8 w-8">
                       <AvatarFallback><User size={20} /></AvatarFallback>
                     </Avatar>
                   )}
                </div>
              ))
            )}
             {isLoading && (
              <div className="flex items-start gap-4">
                <Avatar className="h-8 w-8">
                  <AvatarFallback><Bot size={20} /></AvatarFallback>
                </Avatar>
                <div className="rounded-lg p-3 bg-muted">
                  <Loader2 className="h-5 w-5 animate-spin" />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Ask a Question</CardTitle>
            <CardDescription>
              Get help with homework or ask any question.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="question"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Your Question</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="e.g., 'Explain the Pythagorean theorem' or 'What was the main cause of World War I?'"
                          className="resize-none"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Ask Assistant
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
