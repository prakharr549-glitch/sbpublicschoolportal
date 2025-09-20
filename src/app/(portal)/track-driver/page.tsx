
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
import { collection, onSnapshot, query, where, getDocs, addDoc, serverTimestamp } from "firebase/firestore";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useRouter } from "next/navigation";
import { useAuthState } from "react-firebase-hooks/auth";


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
  const router = useRouter();
  const [currentUser] = useAuthState(auth);

  useEffect(() => {
    // We also need to fetch the driver's user account ID from the 'users' collection
    // to enable internal chat. We can do this by matching the mobile number.
    const q = query(collection(db, "drivers"));
    const unsubscribe = onSnapshot(
      q,
      async (querySnapshot) => {
        const driversData: Driver[] = [];
        const userPromises = [];

        for (const docSnapshot of querySnapshot.docs) {
            const driverData = docSnapshot.data();
            const usersRef = collection(db, "users");
            // Assuming driver's mobile is unique and stored in their user profile's 'phone' field
            // Note: This assumes the 'users' collection has a 'phone' field to match.
            // If the schema is different, this query needs adjustment.
            const userQuery = query(usersRef, where("role", "==", "Driver"), where("name", "==", driverData.name));
            userPromises.push(getDocs(userQuery).then(userSnapshot => {
                 let userId = docSnapshot.id; // Fallback to driver doc id if no user found
                 if (!userSnapshot.empty) {
                    userId = userSnapshot.docs[0].id;
                 }
                 driversData.push({ id: userId, ...(driverData as Omit<Driver, 'id'>) });
            }));
        }

        await Promise.all(userPromises);
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

  const handleCreateChat = async (otherUser: Driver) => {
    if (!currentUser) return;

    // Check if a user account exists for this driver to enable chat
    const userDocRef = doc(db, "users", otherUser.id);
    const userDoc = await getDoc(userDocRef);

    if (!userDoc.exists()) {
        toast({
            variant: "destructive",
            title: "Chat Not Available",
            description: "This driver does not have a chat-enabled user account.",
        });
        return;
    }
    const otherUserData = userDoc.data();

    // Check if chat already exists
    const sortedUsers = [currentUser.uid, otherUser.id].sort();
    const existingChatQuery = query(
      collection(db, "chats"),
      where("users", "==", sortedUsers)
    );

    const existingChatSnapshot = await getDocs(existingChatQuery);

    if (!existingChatSnapshot.empty) {
      // Chat already exists, navigate to it
      const chatId = existingChatSnapshot.docs[0].id;
      router.push(`/chat/${chatId}`);
    } else {
      // Create new chat
      const newChatRef = await addDoc(collection(db, "chats"), {
        users: sortedUsers,
        userNames: {
          [currentUser.uid]: currentUser.displayName,
          [otherUser.id]: otherUserData.name,
        },
        userAvatars: {
          [currentUser.uid]: currentUser.photoURL || "",
          [otherUser.id]: otherUserData.photoURL || "",
        },
        createdAt: serverTimestamp(),
      });
      router.push(`/chat/${newChatRef.id}`);
    }
  };

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
                 <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm">
                            <MessageSquare />
                             <span className="sr-only">Chat</span>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                            <a href={`https://wa.me/${driver.mobile}`} target="_blank" rel="noopener noreferrer">
                                <WhatsAppIcon className="mr-2 h-4 w-4" />
                                <span>WhatsApp</span>
                            </a>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleCreateChat(driver)}>
                            <MessageSquare className="mr-2 h-4 w-4" />
                            <span>School Chat</span>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
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
