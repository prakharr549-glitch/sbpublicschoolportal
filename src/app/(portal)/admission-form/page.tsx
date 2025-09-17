import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
  } from "@/components/ui/card";
  import { FileText } from "lucide-react";
  
  export default function AdmissionFormPage() {
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
              Fill out the form below to begin your application process.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p>The admission form will be displayed here.</p>
          </CardContent>
        </Card>
      </div>
    );
  }
  