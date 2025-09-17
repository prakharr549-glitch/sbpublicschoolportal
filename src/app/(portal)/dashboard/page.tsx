import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Bot, FileText, Map } from "lucide-react";
import Link from 'next/link';

const overviewItems = [
  {
    title: "School AI",
    value: "Since 2014",
    icon: Bot,
    link: "/school-ai",
    description: "Engage with our AI-powered school assistant."
  },
  {
    title: "Admission Form",
    value: "Submission",
    icon: FileText,
    link: "/admission-form",
    description: "Submit your application for the new session."
  },
  {
    title: "Get Directions",
    value: "Location",
    icon: Map,
    link: "https://www.google.com/maps/dir/?api=1&destination=S.B%20PUBLIC%20SCHOOL%2C%20BHAWANIPUR%20JAIRAMPUR%2C%20ITAYE%20ROAD%2C%20Mariahu",
    description: "Find the quickest route to our campus."
  },
];

export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex-1 space-y-4">
        <h1 className="text-3xl font-bold tracking-tight font-headline">
          Welcome to the SB Public Portal
        </h1>
        <p className="text-muted-foreground">
          Here's a quick overview of what's happening at school.
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {overviewItems.map((item) => (
          <Link href={item.link} key={item.title} target={item.link.startsWith('http') ? '_blank' : '_self'}>
            <Card className="hover:bg-muted/50 transition-colors">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{item.title}</CardTitle>
                <item.icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{item.value}</div>
                <p className="text-xs text-muted-foreground">
                  {item.description}
                </p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Quick Links</CardTitle>
          <CardDescription>
            Access important resources and information.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <Link href="/announcements" className="p-4 rounded-lg bg-secondary hover:bg-secondary/80 transition-colors">
              <h3 className="font-semibold">Announcements</h3>
              <p className="text-sm text-muted-foreground">Read the latest news.</p>
            </Link>
            <Link href="/events" className="p-4 rounded-lg bg-secondary hover:bg-secondary/80 transition-colors">
              <h3 className="font-semibold">Events</h3>
              <p className="text-sm text-muted-foreground">View the school calendar.</p>
            </Link>
            <Link href="/homework" className="p-4 rounded-lg bg-secondary hover:bg-secondary/80 transition-colors">
              <h3 className="font-semibold">Homework</h3>
              <p className="text-sm text-muted-foreground">Check your assignments.</p>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
