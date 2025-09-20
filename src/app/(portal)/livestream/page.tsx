
"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Radio, Eye, VideoOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function LiveStreamPage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isWatching, setIsWatching] = useState(false);
  const { toast } = useToast();
  
  const handleWatchStream = () => {
    setIsWatching(true);
    toast({
      title: "Viewer Mode Active",
      description: "You are now watching the stream. If nothing appears, the stream may be offline.",
    });
  };

  const handleExitViewer = () => {
    setIsWatching(false);
    toast({
        title: "Viewer Mode Deactivated",
        description: "You have stopped watching the stream."
    })
  }

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
            Watch live events happening at the school.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-4">
            <div className="w-full max-w-2xl border bg-muted rounded-lg overflow-hidden relative">
                <video ref={videoRef} className="w-full aspect-video" autoPlay muted playsInline poster="https://picsum.photos/seed/livestream/1200/675" />
                 {isWatching && (
                     <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 text-white p-4 text-center">
                        <VideoOff className="h-12 w-12 mb-4" />
                        <h3 className="text-lg font-semibold">Live Stream Offline</h3>
                        <p className="text-sm">There is no live stream currently active. Please check back later.</p>
                    </div>
                )}
            </div>
        </CardContent>
        <CardFooter className="justify-center gap-4">
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
