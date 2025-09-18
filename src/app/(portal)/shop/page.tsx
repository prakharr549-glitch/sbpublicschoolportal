import Image from "next/image";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const shopItems = [
    {
      id: "notebook",
      name: "School Notebook",
      description: "A high-quality notebook with the school logo.",
      price: "₹50",
      imageUrl: "https://picsum.photos/seed/shop1/400/400",
      imageHint: "notebook"
    },
    {
      id: "tshirt",
      name: "School T-Shirt",
      description: "Comfortable cotton t-shirt with school branding.",
      price: "₹300",
      imageUrl: "https://picsum.photos/seed/shop2/400/400",
      imageHint: "t-shirt"
    },
    {
      id: "bag",
      name: "School Bag",
      description: "Durable and spacious bag for all your books.",
      price: "₹700",
      imageUrl: "https://picsum.photos/seed/shop3/400/400",
      imageHint: "school bag"
    },
    {
      id: "bottle",
      name: "Water Bottle",
      description: "Stay hydrated with this branded water bottle.",
      price: "₹150",
      imageUrl: "https://picsum.photos/seed/shop4/400/400",
      imageHint: "water bottle"
    },
  ];

export default function ShopPage() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-3xl font-bold tracking-tight font-headline">
        School Shop
      </h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {shopItems.map((item) => (
          <Card key={item.id} className="flex flex-col">
            <div className="relative aspect-square w-full">
              <Image
                src={item.imageUrl}
                alt={item.name}
                fill
                className="object-cover rounded-t-lg"
                data-ai-hint={item.imageHint}
              />
            </div>
            <CardHeader>
              <CardTitle>{item.name}</CardTitle>
              <CardDescription>{item.description}</CardDescription>
            </CardHeader>
            <CardContent className="flex-grow">
                <p className="text-2xl font-bold">{item.price}</p>
            </CardContent>
            <CardFooter>
              <Button className="w-full">Add to Cart</Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
