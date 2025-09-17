import Image from "next/image";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PlaceHolderImages } from "@/lib/placeholder-images";

export default function AboutPage() {
  const schoolImage = PlaceHolderImages.find(img => img.id === 'school-campus');

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
          <CardTitle>Our Heritage and Commitment</CardTitle>
          <CardDescription>Nurturing minds since 1998.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 text-foreground/90">
          <div>
            <h2 className="text-xl font-semibold font-headline text-primary mb-2">Our History</h2>
            <p>
              Founded in 1998, S.B Public School has grown from a small institution into a leading center for academic excellence. Our journey has been one of continuous improvement, driven by a commitment to providing a holistic education that prepares students for the challenges of the future.
            </p>
          </div>
          <div>
            <h2 className="text-xl font-semibold font-headline text-primary mb-2">Our Mission</h2>
            <p>
              Our mission is to foster a stimulating and inclusive learning environment where students can achieve their full potential. We aim to develop critical thinking, creativity, and a strong sense of social responsibility, empowering our students to become compassionate and effective leaders in a global society.
            </p>
          </div>
          <div>
            <h2 className="text-xl font-semibold font-headline text-primary mb-2">Our Vision</h2>
            <p>
              We envision a future where our graduates are recognized for their academic achievements, strong character, and positive contributions to their communities. We strive to be at the forefront of educational innovation, constantly adapting our methods to meet the evolving needs of our students and the world.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
