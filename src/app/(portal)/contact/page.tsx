import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Phone, Mail, Clock } from "lucide-react";

const contactDetails = [
  {
    department: "Main Office",
    phone: "+1 (555) 123-4567",
    email: "office@sbpublic.edu",
    hours: "Mon-Fri, 8:00 AM - 4:00 PM",
  },
  {
    department: "Admissions",
    phone: "+1 (555) 123-4568",
    email: "admissions@sbpublic.edu",
    hours: "Mon-Fri, 9:00 AM - 3:00 PM",
  },
  {
    department: "IT Support",
    phone: "+1 (555) 123-4569",
    email: "support@sbpublic.edu",
    hours: "Mon-Fri, 7:30 AM - 5:00 PM",
  },
];

export default function ContactPage() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-3xl font-bold tracking-tight font-headline">
        Contact Us
      </h1>
      <p className="text-muted-foreground">We're here to help. Reach out to the appropriate department below.</p>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {contactDetails.map((contact) => (
          <Card key={contact.department}>
            <CardHeader>
              <CardTitle>{contact.department}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <Phone className="h-5 w-5 text-primary" />
                <span className="text-sm">{contact.phone}</span>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-primary" />
                <a href={`mailto:${contact.email}`} className="text-sm hover:underline">
                  {contact.email}
                </a>
              </div>
              <div className="flex items-center gap-3">
                <Clock className="h-5 w-5 text-primary" />
                <span className="text-sm">{contact.hours}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      <Card>
        <CardHeader>
            <CardTitle>Our Location</CardTitle>
            <CardDescription>123 Education Lane, Knowledge City, 45678</CardDescription>
        </CardHeader>
        <CardContent>
            <div className="aspect-video w-full rounded-lg bg-muted overflow-hidden">
                {/* Placeholder for a map */}
                <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                    Map will be displayed here
                </div>
            </div>
        </CardContent>
      </Card>
    </div>
  );
}
