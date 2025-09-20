
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
import { collection, onSnapshot, query, where, getDocs, addDoc, serverTimestamp, doc, getDoc } from "firebase/firestore";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useRouter } from "next/navigation";
import { useAuthState } from "react-firebase-hooks/auth";


type Driver = {
  id: string;
  name: string;
  mobile: string;
  vanNo: string;
  photoURL?: string; 
  email?: string;
};

export default function TrackDriverPage() {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const router = useRouter();
  const [currentUser] = useAuthState(auth);

  useEffect(() => {
    const q = query(collection(db, "drivers"));
    const unsubscribe = onSnapshot(
      q,
      async (querySnapshot) => {
        const driversData: Driver[] = [];
        for (const docSnapshot of querySnapshot.docs) {
          const driverData = docSnapshot.data();
          driversData.push({ id: docSnapshot.id, ...(driverData as Omit<Driver, 'id'>) });
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
  
  const handleTrackClick = (driverName: string) => {
    toast({
        title: "Tracking Feature",
        description: `Live tracking for ${driverName} is not yet implemented.`,
    });
  }

  const handleCreateChat = async (otherUser: Driver) => {
    if (!currentUser) return;

    // Find the driver's user account in the 'users' collection to get their UID for chat
    const usersRef = collection(db, "users");
    // Query by a unique field if possible, like email. Fallback to name if email is not available.
    const userQuery = otherUser.email 
      ? query(usersRef, where("email", "==", otherUser.email), where("role", "==", "Driver"))
      : query(usersRef, where("name", "==", otherUser.name), where("role", "==", "Driver"));

    const userSnapshot = await getDocs(userQuery);

    if (userSnapshot.empty) {
        toast({
            variant: "destructive",
            title: "Chat Not Available",
            description: `A chat-enabled user account for ${otherUser.name} could not be found.`,
        });
        return;
    }
    const driverUserDoc = userSnapshot.docs[0];
    const driverUserId = driverUserDoc.id;
    const driverUserData = driverUserDoc.data();

    // Check if chat already exists
    const sortedUsers = [currentUser.uid, driverUserId].sort();
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
          [driverUserId]: driverUserData.name,
        },
        userAvatars: {
          [currentUser.uid]: currentUser.photoURL || "",
          [driverUserId]: driverUserData.photoURL || "",
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
                <Button variant="outline" size="sm" onClick={() => handleCreateChat(driver)}>
                    <MessageSquare />
                    <span className="sr-only">Chat</span>
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
