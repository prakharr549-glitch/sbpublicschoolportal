
"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, MapPin, Phone, User, Truck } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, query } from "firebase/firestore";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

type Driver = {
  id: string;
  name: string;
  mobile: string;
  vanNo: string;
  photoURL?: string; 
};

const WhatsAppIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
    </svg>
  );

export default function TrackDriverPage() {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const q = query(collection(db, "drivers"));
    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        const driversData: Driver[] = [];
        querySnapshot.forEach((doc) => {
          driversData.push({ id: doc.id, ...(doc.data() as Omit<Driver, 'id'>) });
        });
        setDrivers(driversData);
        setIsLoading(false);
      },
      (error) => {
        console.error("Error fetching drivers:", error);
        toast({
          variant: "destructive",
          title: "Permission Denied",
          description: "You do not have permission to view driver data.",
        });
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [toast]);
  
  const handleTrackClick = (driverName: string) => {
    toast({
        title: "Tracking Feature",
        description: `Live tracking for ${driverName} is not yet implemented.`,
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-4">
        <MapPin className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-bold tracking-tight font-headline">
          Track a Driver
        </h1>
      </div>

      {isLoading ? (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
      ) : drivers.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {drivers.map((driver) => (
            <Card key={driver.id} className="flex flex-col">
              <CardHeader>
                <div className="flex items-center gap-4">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={driver.photoURL} />
                    <AvatarFallback><User /></AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle>{driver.name}</CardTitle>
                    <CardDescription>Van No: {driver.vanNo}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="flex-grow">
                 <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Phone className="h-4 w-4" />
                    <span>{driver.mobile}</span>
                </div>
              </CardContent>
              <CardFooter className="grid grid-cols-3 gap-2">
                <Button asChild variant="outline" size="sm">
                   <a href={`tel:${driver.mobile}`}>
                    <Phone />
                    <span className="sr-only">Call</span>
                   </a>
                </Button>
                <Button asChild variant="outline" size="sm">
                    <a href={`https://wa.me/${driver.mobile}`} target="_blank" rel="noopener noreferrer">
                        <WhatsAppIcon />
                        <span className="sr-only">WhatsApp</span>
                    </a>
                </Button>
                <Button size="sm" onClick={() => handleTrackClick(driver.name)}>
                    <MapPin className="mr-2 h-4 w-4" />
                    Track
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-12">
            <div className="text-center text-muted-foreground">
              <Truck className="mx-auto h-12 w-12" />
              <h3 className="mt-4 text-lg font-semibold">No Drivers Found</h3>
              <p className="mt-2 text-sm">
                There are no registered drivers to display at the moment.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
