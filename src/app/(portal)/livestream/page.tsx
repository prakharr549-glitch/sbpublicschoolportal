
"use client";

import { useRef, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Radio, Eye, Video, VideoOff, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";

export default function LiveStreamPage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [isWatching, setIsWatching] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [user, authLoading] = useAuthState(auth);
  const { toast } = useToast();
  
  useEffect(() => {
    async function fetchUserRole() {
      if (user) {
        const userDocRef = doc(db, "users", user.uid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          setUserRole(userDoc.data().role);
        }
      }
      setIsLoading(false);
    }
    if (!authLoading) {
      fetchUserRole();
    }
  }, [user, authLoading]);


  const handleStartStream = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setIsStreaming(true);
      toast({
        title: "Broadcast Started",
        description: "You are now live.",
      });
    } catch (error) {
      console.error("Error accessing media devices.", error);
      toast({
        variant: "destructive",
        title: "Camera/Mic Access Denied",
        description: "Please enable permissions in your browser settings.",
      });
    }
  };

  const handleStopStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsStreaming(false);
    toast({
      title: "Broadcast Stopped",
    });
  };

  const handleWatchStream = () => {
    setIsWatching(true);
    toast({
      title: "Viewer Mode Active",
      description: "You are now watching the stream. If nothing appears, the stream may be offline.",
    });
  };

  const handleExitViewer = () => {
    setIsWatching(false);
  }
  
  const showOfflineMessage = isWatching && !isStreaming;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-4">
        <Radio className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-bold tracking-tight font-headline">
          Live Stream
        </h1>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>School Events Live</CardTitle>
          <CardDescription>
            Watch live events happening at the school, or start a broadcast if you're an admin.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-4">
            <div className="w-full max-w-2xl border bg-muted rounded-lg overflow-hidden relative">
                <video ref={videoRef} className="w-full aspect-video" autoPlay muted playsInline poster="https://picsum.photos/seed/livestream/1200/675" />
                 {showOfflineMessage && (
                     <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 text-white p-4 text-center">
                        <VideoOff className="h-12 w-12 mb-4" />
                        <h3 className="text-lg font-semibold">Live Stream Offline</h3>
                        <p className="text-sm">There is no live stream currently active. Please check back later.</p>
                    </div>
                )}
            </div>
        </CardContent>
        <CardFooter className="justify-center gap-4">
            {isLoading || authLoading ? (
                 <Loader2 className="h-8 w-8 animate-spin" />
            ) : userRole === 'Admin' ? (
                <>
                    {!isStreaming ? (
                        <Button size="lg" onClick={handleStartStream}>
                            <Video className="mr-2 h-5 w-5" />
                            Start Stream
                        </Button>
                    ) : (
                        <Button size="lg" variant="destructive" onClick={handleStopStream}>
                            <VideoOff className="mr-2 h-5 w-5" />
                            Stop Stream
                        </Button>
                    )}
                </>
            ) : null}

            {!isWatching ? (
                 <Button size="lg" onClick={handleWatchStream}>
                    <Eye className="mr-2 h-5 w-5" />
                    Watch Stream
                </Button>
            ) : (
                 <Button size="lg" variant="outline" onClick={handleExitViewer}>
                    <Eye className="mr-2 h-5 w-5" />
                    Exit Viewer
                </Button>
            )}
        </CardFooter>
      </Card>
    </div>
  );
}
