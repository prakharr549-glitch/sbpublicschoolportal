
"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Radio, Video, VideoOff, Eye } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function LiveStreamPage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isWatching, setIsWatching] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (!isStreaming) {
        // Stop camera when not streaming
        if (videoRef.current && videoRef.current.srcObject) {
            const stream = video_ref.current.srcObject as MediaStream;
            stream.getTracks().forEach(track => track.stop());
            videoRef.current.srcObject = null;
        }
        return;
    }

    const getCameraPermission = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        setHasCameraPermission(true);

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (error) {
        console.error("Error accessing camera:", error);
        setHasCameraPermission(false);
        toast({
          variant: "destructive",
          title: "Camera Access Denied",
          description: "Please enable camera permissions in your browser settings to use this feature.",
        });
      }
    };

    getCameraPermission();

    return () => {
        if (videoRef.current && videoRef.current.srcObject) {
            const stream = videoRef.current.srcObject as MediaStream;
            stream.getTracks().forEach(track => track.stop());
        }
    }
  }, [isStreaming, toast]);

  const handleStartStream = () => {
    setIsStreaming(true);
    setIsWatching(false);
    toast({
      title: "Streaming Started",
      description: "You are now live!",
    });
  };

  const handleStopStream = () => {
    setIsStreaming(false);
    toast({
      title: "Streaming Stopped",
      description: "Your live stream has ended.",
    });
  };
  
  const handleWatchStream = () => {
    setIsWatching(true);
    setIsStreaming(false);
    toast({
      title: "Viewer Mode",
      description: "You are now watching the stream.",
    });
  };

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
            Broadcast or watch live events happening at the school.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-4">
            <div className="w-full max-w-2xl border bg-muted rounded-lg overflow-hidden relative">
                <video ref={videoRef} className="w-full aspect-video" autoPlay muted playsInline poster="https://picsum.photos/seed/livestream/1200/675" />
                {isStreaming && hasCameraPermission === false && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 text-white p-4">
                        <VideoOff className="h-12 w-12 mb-4" />
                        <h3 className="text-lg font-semibold">Camera Not Available</h3>
                        <p className="text-center text-sm">Please grant camera permissions to start streaming.</p>
                    </div>
                )}
                 {isWatching && (
                     <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 text-white p-4">
                        <h3 className="text-lg font-semibold">Live Stream Offline</h3>
                        <p className="text-center text-sm">There is no live stream currently active. Please check back later.</p>
                    </div>
                )}
            </div>
          {isStreaming && hasCameraPermission === false && (
            <Alert variant="destructive" className="w-full max-w-2xl">
              <AlertTitle>Camera Access Required</AlertTitle>
              <AlertDescription>
                Please allow camera access in your browser settings to use this feature.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
        <CardFooter className="justify-center gap-4">
            {!isStreaming ? (
                <Button size="lg" onClick={handleStartStream} variant={isWatching ? "outline" : "default"}>
                    <Video className="mr-2 h-5 w-5" />
                    Start Stream
                </Button>
            ) : (
                <Button size="lg" variant="destructive" onClick={handleStopStream}>
                    <VideoOff className="mr-2 h-5 w-5" />
                    Stop Stream
                </Button>
            )}
            {!isWatching ? (
                 <Button size="lg" onClick={handleWatchStream} variant={isStreaming ? "outline" : "default"}>
                    <Eye className="mr-2 h-5 w-5" />
                    Watch Stream
                </Button>
            ) : (
                 <Button size="lg" variant="outline" onClick={() => setIsWatching(false)}>
                    <Eye className="mr-2 h-5 w-5" />
                    Exit Viewer
                </Button>
            )}
        </CardFooter>
      </Card>
    </div>
  );
}

