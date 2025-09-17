import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const announcements = [
  {
    title: "Annual Sports Day 2024",
    date: "2024-08-15",
    category: "Event",
    content:
      "Join us for our annual sports day on September 5th. All students are encouraged to participate. Parents are welcome to cheer on the participants.",
  },
  {
    title: "Parent-Teacher Meeting Schedule",
    date: "2024-08-10",
    category: "Academic",
    content:
      "The upcoming parent-teacher meetings are scheduled for the last week of August. Please book your slot with the respective class teachers.",
  },
  {
    title: "School Reopens after Summer Break",
    date: "2024-08-01",
    category: "General",
    content:
      "The school will reopen on August 15th for the new academic session. We look forward to welcoming all our students back.",
  },
  {
    title: "Science Fair Submissions Open",
    date: "2024-07-25",
    category: "Academic",
    content:
      "Submissions for the annual science fair are now open. The last date for submission is August 20th. Please contact your science teacher for more details.",
  },
];

export default function AnnouncementsPage() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-3xl font-bold tracking-tight font-headline">
        School Announcements
      </h1>
      <div className="flex flex-col gap-4">
        {announcements.map((announcement, index) => (
          <Card key={index}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="font-headline">{announcement.title}</CardTitle>
                  <CardDescription>
                    Posted on {new Date(announcement.date).toLocaleDateString()}
                  </CardDescription>
                </div>
                 <Badge variant={announcement.category === 'Event' ? 'default' : 'secondary'}>{announcement.category}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-foreground/80">{announcement.content}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
