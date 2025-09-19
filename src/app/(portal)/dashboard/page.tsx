
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Bot, FileText, Map, FlaskConical, Computer, Presentation, Camera, Dribbble, Users } from "lucide-react";
import Link from 'next/link';

const overviewItems = [
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

const Shuttlecock = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <path d="M10 17.5a1.5 1.5 0 0 1-3 0V3c0-1.1.9-2 2-2s2 .9 2 2v14.5Z"/><path d="M10 9H7"/><path d="m17 8-4 4-4-4"/><path d="m17 14-4-4-4 4"/><path d="m17 2-4 4-4-4"/>
    </svg>
)

const facilityItems = [
    { name: "Science Lab", icon: FlaskConical },
    { name: "Computer Lab", icon: Computer },
    { name: "Smart Classes", icon: Presentation },
    { name: "CCTV Surveillance", icon: Camera },
    { name: "Basketball Ground", icon: Dribbble },
    { name: "Badminton Ground", icon: Shuttlecock },
    { name: "Large Playground", icon: Users },
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
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
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

      <div className="grid gap-6 md:grid-cols-1">
        <Card>
          <CardHeader>
            <CardTitle>Our Facilities</CardTitle>
            <CardDescription>
              State-of-the-art amenities for a modern learning experience.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {facilityItems.map((facility) => (
                <div key={facility.name} className="flex items-center gap-2 p-2 rounded-lg bg-secondary">
                  <facility.icon className="h-5 w-5 text-primary" />
                  <span className="text-sm font-medium">{facility.name}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
