
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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { FileText, Loader2 } from "lucide-react";

const admissionFormSchema = z.object({
  name: z.string().min(2, {
    message: "Name must be at least 2 characters.",
  }),
  class: z.string().min(1, {
    message: "Class is required.",
  }),
  parentName: z.string().min(2, {
    message: "Parent's name must be at least 2 characters.",
  }),
  phone: z.string().regex(/^\d{10}$/, "Please enter a valid 10-digit phone number."),
  address: z.string().min(10, {
    message: "Address must be at least 10 characters.",
  }),
  description: z.string().optional(),
});

type AdmissionFormValues = z.infer<typeof admissionFormSchema>;

export default function AdmissionFormPage() {
  const { toast } = useToast();

  const form = useForm<AdmissionFormValues>({
    resolver: zodResolver(admissionFormSchema),
    defaultValues: {
      name: "",
      class: "",
      parentName: "",
      phone: "",
      address: "",
      description: "",
    },
  });

  function onSubmit(data: AdmissionFormValues) {
    const phoneNumber = "6392702249";
    const message = `
*New Admission Request*

*Student Name:* ${data.name}
*Class:* ${data.class}
*Parent's Name:* ${data.parentName}
*Phone Number:* ${data.phone}
*Address:* ${data.address}
*Description:* ${data.description || "N/A"}
    `.trim();

    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;

    try {
      window.open(whatsappUrl, "_blank");
      toast({
        title: "Redirecting to WhatsApp",
        description: "Please send the pre-filled message to complete the request.",
      });
      form.reset();
    } catch (error) {
      console.error("Failed to open WhatsApp:", error);
      toast({
        variant: "destructive",
        title: "Submission Failed",
        description: "Could not open WhatsApp. Please try again.",
      });
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-4">
        <FileText className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-bold tracking-tight font-headline">
          Admission Form
        </h1>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Apply for Admission</CardTitle>
          <CardDescription>
            Fill out the form below to begin your application process. This will
            generate a WhatsApp message to send to our admissions office.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Student's Full Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., John Doe" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                    control={form.control}
                    name="class"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Class to Apply For</FormLabel>
                        <FormControl>
                        <Input placeholder="e.g., Grade 5" {...field} />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="parentName"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Parent's Full Name</FormLabel>
                        <FormControl>
                        <Input placeholder="e.g., Jane Doe" {...field} />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />
              </div>

               <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone Number</FormLabel>
                    <FormControl>
                      <Input type="tel" placeholder="e.g., 9876543210" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Residential Address</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Please provide your full residential address"
                        className="resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Additional Information (Optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Any other information you'd like to share"
                        className="resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Generate WhatsApp Message
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
