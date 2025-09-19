import Image from "next/image";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { CheckCircle } from "lucide-react";

export default function AboutPage() {
  const schoolImage = PlaceHolderImages.find(img => img.id === 'school-campus');

  const facilities = [
    "Science Lab",
    "Computer Lab",
    "Smart Classes",
    "CCTV Surveillance",
    "Basketball Ground",
    "Badminton Ground",
    "Large Playground",
  ];

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-3xl font-bold tracking-tight font-headline">
        About S.B Public School
      </h1>
      <Card>
        {schoolImage && (
          <div className="relative h-64 w-full">
             <Image
              src={schoolImage.imageUrl}
              alt={schoolImage.description}
              fill
              className="object-cover rounded-t-lg"
              data-ai-hint={schoolImage.imageHint}
            />
          </div>
        )}
        <CardHeader>
          <CardTitle>Excellence in Education Since 2014</CardTitle>
          <CardDescription>Fostering the next generation of leaders and innovators.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 text-foreground/90">
          <div>
            <h2 className="text-xl font-semibold font-headline text-primary mb-2">Our Vision</h2>
            <p>
             Our vision is to provide the best possible education, empowering students to build successful careers and become confident, capable individuals. We are committed to nurturing talent and providing a clear path to a bright future.
            </p>
          </div>
          <div>
            <h2 className="text-xl font-semibold font-headline text-primary mb-2">Our Legacy</h2>
            <p>
             Established in 2014, S.B Public School has quickly become a cornerstone of the community. We are proud of our history of academic excellence and the many students who have gone on to achieve great success in their chosen careers.
            </p>
          </div>
          <div>
            <h2 className="text-xl font-semibold font-headline text-primary mb-2">Our Facilities</h2>
            <p className="mb-4">
                We provide a state-of-the-art learning environment with a wide range of facilities to support academic and extracurricular development.
            </p>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                {facilities.map((facility) => (
                    <div key={facility} className="flex items-center gap-2">
                        <CheckCircle className="h-5 w-5 text-green-500" />
                        <span>{facility}</span>
                    </div>
                ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
