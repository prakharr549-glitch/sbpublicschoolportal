"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { getEmergencyAnalysis } from "./actions";
import type { EmergencyBroadcastsOutput } from "@/ai/flows/emergency-broadcasts";
import { AlertCircle, CheckCircle, Loader2 } from "lucide-react";

const formSchema = z.object({
  headline: z
    .string()
    .min(10, "Headline must be at least 10 characters long.")
    .max(200, "Headline must be 200 characters or less."),
});

export default function EmergencyBroadcastClient() {
  const [analysis, setAnalysis] = useState<EmergencyBroadcastsOutput | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      headline: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    setAnalysis(null);
    try {
      const result = await getEmergencyAnalysis(values.headline);
      setAnalysis(result);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Analysis Failed",
        description:
          error instanceof Error ? error.message : "An unknown error occurred.",
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Analyze News Headline</CardTitle>
          <CardDescription>
            Enter a news headline to analyze its potential impact on school
            operations.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="headline"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>News Headline</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="e.g., 'Major highway closure near downtown due to a chemical spill'"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={isLoading}>
                {isLoading && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Analyze Headline
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
      
      <div className="flex items-center justify-center">
        {isLoading && (
            <div className="flex flex-col items-center gap-4 text-muted-foreground">
                <Loader2 className="h-12 w-12 animate-spin text-primary"/>
                <p>Analyzing headline with AI...</p>
            </div>
        )}
        {analysis && (
          <Card className="w-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {analysis.isEmergency ? (
                  <AlertCircle className="h-6 w-6 text-destructive" />
                ) : (
                  <CheckCircle className="h-6 w-6 text-green-500" />
                )}
                Analysis Result
              </CardTitle>
              <CardDescription>
                AI-powered assessment of the situation.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold">Is it an Emergency?</h3>
                <p
                  className={`font-bold text-lg ${
                    analysis.isEmergency
                      ? "text-destructive"
                      : "text-green-600"
                  }`}
                >
                  {analysis.isEmergency ? "Yes" : "No"}
                </p>
              </div>
              <div>
                <h3 className="font-semibold">Reasoning</h3>
                <p className="text-muted-foreground">{analysis.reason}</p>
              </div>
              <div>
                <h3 className="font-semibold">Urgency Score</h3>
                <div className="flex items-center gap-4">
                  <Progress value={analysis.urgencyScore} className="w-full" />
                  <span className="font-bold text-lg text-primary">
                    {analysis.urgencyScore}
                  </span>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <p className="text-xs text-muted-foreground">
                This is an AI-generated analysis and should be verified by a human administrator.
              </p>
            </CardFooter>
          </Card>
        )}
         {!isLoading && !analysis && (
          <div className="text-center text-muted-foreground">
            <p>Analysis results will appear here.</p>
          </div>
        )}
      </div>
    </div>
  );
}
