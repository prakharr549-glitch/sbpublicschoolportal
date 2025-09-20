
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
import { Loader2, MapPin, Phone, User, Truck, MessageSquare } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { auth, db } from "@/lib/firebase";
import { collection, onSnapshot, query, where, getDocs, doc, getDoc, Timestamp } from "firebase/firestore";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useRouter } from "next/navigation";
import { useAuthState } from "react-firebase-hooks/auth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import dynamic from 'next/dynamic';

const Map = dynamic(() => import('@/components/map'), { ssr: false });


type Driver = {
  id: string;
  name:string;
  mobile: string;
  vanNo: string;
  photoURL?: string; 
  email?: string;
  uid?: string;
};

type DriverLocation = {
    location: {
        latitude: number;
        longitude: number;
    };
    timestamp: Timestamp;
}

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
  const [trackingStates, setTrackingStates] = useState<{[key: string]: boolean}>({});
  const { toast } = useToast();
  const router = useRouter();
  const [currentUser] = useAuthState(auth);
  const [isMapOpen, setIsMapOpen] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<[number, number] | null>(null);
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);


  useEffect(() => {
    const q = query(collection(db, "drivers"));
    const unsubscribe = onSnapshot(
      q,
      async (querySnapshot) => {
        const driversData: Driver[] = [];
        for (const docSnapshot of querySnapshot.docs) {
          const driverData = docSnapshot.data();
          const userQuery = query(collection(db, "users"), where("role", "==", "Driver"), where("name", "==", driverData.name));
          const userSnapshot = await getDocs(userQuery);
          
          let photoURL: string | undefined = undefined;
          let email: string | undefined = undefined;
          let uid: string | undefined = undefined;

          if (!userSnapshot.empty) {
            const userData = userSnapshot.docs[0].data();
            uid = userSnapshot.docs[0].id;
            photoURL = userData.photoURL;
            email = userData.email;
          }

          driversData.push({ id: docSnapshot.id, ...(driverData as Omit<Driver, 'id' | 'photoURL' | 'email' | 'uid'>), photoURL, email, uid });
        }
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
  
  const handleCreateChat = async (driver: Driver) => {
    if (!currentUser || !driver.uid) {
        toast({
            title: "Chat Error",
            description: "Cannot start chat. Driver is not a registered user.",
            variant: "destructive"
        });
        return;
    }

    const sortedUsers = [currentUser.uid, driver.uid].sort();
    const existingChatQuery = query(
      collection(db, "chats"),
      where("users", "==", sortedUsers)
    );

    const existingChatSnapshot = await getDocs(existingChatQuery);

    if (!existingChatSnapshot.empty) {
      const chatId = existingChatSnapshot.docs[0].id;
      router.push(`/chat/${chatId}`);
    } else {
      const newChatRef = await addDoc(collection(db, "chats"), {
        users: sortedUsers,
        userNames: {
          [currentUser.uid]: currentUser.displayName,
          [driver.uid]: driver.name,
        },
        userAvatars: {
          [currentUser.uid]: currentUser.photoURL || "",
          [driver.uid]: driver.photoURL || "",
        },
        createdAt: serverTimestamp(),
      });
      router.push(`/chat/${newChatRef.id}`);
    }
  };
  
  const handleTrackClick = async (driver: Driver) => {
    if (!driver.uid) {
        toast({ title: "Cannot Track Driver", description: "Driver account is not set up for tracking.", variant: "destructive" });
        return;
    }
    
    setTrackingStates(prev => ({...prev, [driver.id]: true}));
    setSelectedDriver(driver);

    try {
        const locationDocRef = doc(db, "driverLocations", driver.uid);
        const locationDoc = await getDoc(locationDocRef);

        if (locationDoc.exists()) {
            const data = locationDoc.data() as DriverLocation;
            setSelectedLocation([data.location.latitude, data.location.longitude]);
            setIsMapOpen(true);
        } else {
            toast({ title: "Driver Offline", description: "This driver is not currently sharing their location." });
        }
    } catch (error) {
        console.error("Error fetching driver location:", error);
        toast({ title: "Error", description: "Could not fetch driver location.", variant: "destructive" });
    } finally {
        setTrackingStates(prev => ({...prev, [driver.id]: false}));
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-4">
        <MapPin className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-bold tracking-tight font-headline">
          Track a Driver
        </h1>
      </div>

       <Dialog open={isMapOpen} onOpenChange={setIsMapOpen}>
            <DialogContent className="sm:max-w-3xl h-[80vh]">
                <DialogHeader>
                    <DialogTitle>Live Driver Location</DialogTitle>
                    <DialogDescription>
                        Tracking {selectedDriver?.name}. The location updates in real-time.
                    </DialogDescription>
                </DialogHeader>
                <div className="h-full w-full rounded-lg overflow-hidden">
                    {selectedLocation && <Map position={selectedLocation} />}
                </div>
            </DialogContent>
        </Dialog>

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
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm">
                            <MessageSquare />
                            <span className="sr-only">Chat</span>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                         <DropdownMenuItem onSelect={() => handleCreateChat(driver)}>
                            <MessageSquare className="mr-2 h-4 w-4"/>
                            <span>School Chat</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                            <a href={`https://wa.me/${driver.mobile}`} target="_blank" rel="noopener noreferrer">
                                <WhatsAppIcon className="mr-2 h-4 w-4" />
                                <span>WhatsApp</span>
                            </a>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
                <Button size="sm" onClick={() => handleTrackClick(driver)} disabled={trackingStates[driver.id]}>
                    {trackingStates[driver.id] ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <MapPin className="mr-2 h-4 w-4" />}
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
