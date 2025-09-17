import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

const curriculumData = [
  {
    grade: "Grade 1-5 (Primary)",
    subjects: [
      { name: "English", description: "Foundational reading, writing, and comprehension skills." },
      { name: "Mathematics", description: "Basic arithmetic, shapes, and problem-solving." },
      { name: "Science", description: "Introduction to the natural world, plants, and animals." },
      { name: "Social Studies", description: "Understanding community, culture, and basic history." },
    ],
  },
  {
    grade: "Grade 6-8 (Middle School)",
    subjects: [
      { name: "English Literature", description: "Analysis of classic and modern texts." },
      { name: "Algebra & Geometry", description: "Advanced mathematical concepts and reasoning." },
      { name: "Physics, Chemistry, Biology", description: "In-depth study of physical and life sciences." },
      { name: "History & Civics", description: "World history, government structures, and citizen rights." },
    ],
  },
  {
    grade: "Grade 9-12 (High School)",
    subjects: [
      { name: "Advanced English", description: "Critical analysis, research papers, and public speaking." },
      { name: "Calculus & Statistics", description: "Higher-level mathematics for college preparation." },
      { name: "Specialized Sciences", description: "Options for advanced placement in Physics, Chemistry, and Biology." },
      { name: "Economics & Global Studies", description: "Understanding economic principles and global interconnectedness." },
    ],
  },
];

export default function CurriculumPage() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-3xl font-bold tracking-tight font-headline">
        Curriculum Overview
      </h1>
      <Card>
        <CardHeader>
          <CardTitle>Academic Program</CardTitle>
          <CardDescription>An overview of the subjects taught at each level.</CardDescription>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible className="w-full">
            {curriculumData.map((level) => (
              <AccordionItem value={level.grade} key={level.grade}>
                <AccordionTrigger className="font-semibold text-lg">{level.grade}</AccordionTrigger>
                <AccordionContent>
                  <ul className="space-y-4 pl-4">
                    {level.subjects.map((subject) => (
                       <li key={subject.name} className="border-l-2 border-primary pl-4">
                         <h4 className="font-semibold">{subject.name}</h4>
                         <p className="text-muted-foreground">{subject.description}</p>
                       </li>
                    ))}
                  </ul>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </CardContent>
      </Card>
    </div>
  );
}
