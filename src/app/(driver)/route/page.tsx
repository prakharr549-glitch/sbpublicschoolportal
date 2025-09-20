
"use client";

import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Map, Loader2, Play, Square, MapPin } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth, db } from "@/lib/firebase";
import { doc, setDoc, deleteDoc, serverTimestamp } from "firebase/firestore";

export default function DriverRoutePage() {
  const [user] = useAuthState(auth);
  const { toast } = useToast();
  const [isTracking, setIsTracking] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const watchId = useRef<number | null>(null);

  useEffect(() => {
    // Clean up watcher when component unmounts
    return () => {
      if (watchId.current !== null) {
        navigator.geolocation.clearWatch(watchId.current);
      }
    };
  }, []);

  const handleStartTracking = () => {
    if (!user) {
      toast({ variant: "destructive", title: "Authentication Error", description: "You must be logged in." });
      return;
    }
    
    if (!navigator.geolocation) {
      toast({ variant: "destructive", title: "Geolocation Not Supported", description: "Your browser does not support location tracking." });
      return;
    }

    setIsLoading(true);

    watchId.current = navigator.geolocation.watchPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        const newLocation = { latitude, longitude };
        setLocation(newLocation);
        
        try {
          await setDoc(doc(db, "driverLocations", user.uid), {
            location: newLocation,
            timestamp: serverTimestamp(),
          });
          
          if (!isTracking) {
             setIsTracking(true);
             toast({ title: "Location Sharing Started", description: "Your location is now being shared." });
          }

        } catch (error) {
          console.error("Error updating location:", error);
          toast({ variant: "destructive", title: "Error", description: "Could not update your location." });
        } finally {
            setIsLoading(false);
        }
      },
      (error) => {
        console.error("Geolocation error:", error);
        toast({
          variant: "destructive",
          title: "Location Access Denied",
          description: "Please enable location permissions to use this feature.",
        });
        setIsTracking(false);
        setIsLoading(false);
        if (watchId.current !== null) {
          navigator.geolocation.clearWatch(watchId.current);
          watchId.current = null;
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 20000,
        maximumAge: 0,
      }
    );
  };

  const handleStopTracking = async () => {
    if (!user) return;

    if (watchId.current !== null) {
      navigator.geolocation.clearWatch(watchId.current);
      watchId.current = null;
    }
    setIsTracking(false);
    setLocation(null);
    try {
      await deleteDoc(doc(db, "driverLocations", user.uid));
      toast({ title: "Location Sharing Stopped", description: "You are no longer sharing your location." });
    } catch (error) {
      console.error("Error deleting location:", error);
      toast({ variant: "destructive", title: "Error", description: "Could not stop sharing your location." });
    }
  };

  return (
    <div className="flex flex-col gap-6">
       <div className="flex items-center gap-4">
        <Map className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-bold tracking-tight font-headline">
          My Route
        </h1>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Live Location Sharing</CardTitle>
          <CardDescription>Start sharing your location when you begin your route.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center gap-4">
            {isTracking && location ? (
                <div className="text-center p-4 border rounded-lg bg-muted">
                    <p className="font-semibold">Currently Sharing Location:</p>
                    <p className="text-sm text-muted-foreground">Lat: {location.latitude.toFixed(5)}, Lon: {location.longitude.toFixed(5)}</p>
                </div>
            ) : (
                <div className="text-center p-4">
                    <p className="text-muted-foreground">Your location is not being shared.</p>
                </div>
            )}
            {!isTracking ? (
                <Button size="lg" onClick={handleStartTracking} disabled={isLoading}>
                    {isLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Play className="mr-2 h-5 w-5" />}
                    Start Sharing Location
                </Button>
            ) : (
                <Button size="lg" variant="destructive" onClick={handleStopTracking}>
                    <Square className="mr-2 h-5 w-5" />
                    Stop Sharing
                </Button>
            )}
        </CardContent>
      </Card>
    </div>
  );
}
