import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Bell, Calendar, BookOpen, Building } from "lucide-react";
import Link from 'next/link';

const overviewItems = [
  {
    title: "New Announcements",
    value: "3",
    icon: Bell,
    link: "/announcements",
    description: "Recent updates from the school administration."
  },
  {
    title: "Upcoming Events",
    value: "5",
    icon: Calendar,
    link: "/events",
    description: "Sports days, parent-teacher meetings, and more."
  },
  {
    title: "Curriculum Areas",
    value: "12",
    icon: BookOpen,
    link: "/curriculum",
    description: "Subjects and topics for each grade level."
  },
  {
    title: "School History",
    value: "Since 1998",
    icon: Building,
    link: "/about",
    description: "Learn about our mission and values."
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
          <Link href={item.link} key={item.title}>
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
            <Link href="/contact" className="p-4 rounded-lg bg-secondary hover:bg-secondary/80 transition-colors">
              <h3 className="font-semibold">Contact Us</h3>
              <p className="text-sm text-muted-foreground">Get in touch with the office.</p>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
