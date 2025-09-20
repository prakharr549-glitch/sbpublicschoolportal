
"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Loader2, PlusCircle, Radio, Trash2, CalendarIcon, Youtube } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { db, auth } from "@/lib/firebase";
import { addDoc, collection, onSnapshot, query, orderBy, Timestamp, doc, deleteDoc, getDoc } from "firebase/firestore";
import { useAuthState } from "react-firebase-hooks/auth";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import Link from "next/link";

const streamFormSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters."),
  description: z.string().min(10, "Description must be at least 10 characters."),
  date: z.date({ required_error: "A date is required." }),
  youtubeUrl: z.string().url("Please enter a valid YouTube URL."),
});

type StreamFormValues = z.infer<typeof streamFormSchema>;

type Stream = {
  id: string;
  title: string;
  description: string;
  date: Timestamp;
  youtubeUrl: string;
};

export default function LiveStreamPage() {
  const [streams, setStreams] = useState<Stream[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDataLoading, setIsDataLoading] = useState(true);
  const { toast } = useToast();
  const [user, authLoading] = useAuthState(auth);
  const [userRole, setUserRole] = useState<string | null>(null);

  const form = useForm<StreamFormValues>({
    resolver: zodResolver(streamFormSchema),
    defaultValues: {
      title: "",
      description: "",
      youtubeUrl: "",
    },
  });

  useEffect(() => {
    async function fetchUserRole() {
      if (user) {
        const userDocRef = doc(db, "users", user.uid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          setUserRole(userDoc.data().role);
        }
      }
    }
    if (!authLoading) {
      fetchUserRole();
    }
  }, [user, authLoading]);

  useEffect(() => {
    const q = query(collection(db, "streams"), orderBy("date", "desc"));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const streamsData: Stream[] = [];
      querySnapshot.forEach((doc) => {
        streamsData.push({ id: doc.id, ...(doc.data() as Omit<Stream, 'id'>) });
      });
      setStreams(streamsData);
      setIsDataLoading(false);
    }, (error) => {
        console.error("Error fetching streams:", error);
        toast({
            variant: "destructive",
            title: "Permission Denied",
            description: "You do not have permission to view streams.",
        });
        setIsDataLoading(false);
    });

    return () => unsubscribe();
  }, [toast]);

  async function onSubmit(data: StreamFormValues) {
    try {
      await addDoc(collection(db, "streams"), {
        ...data,
        date: Timestamp.fromDate(data.date),
      });
      toast({
        title: "Stream Added",
        description: "The new stream has been added to the list.",
      });
      form.reset();
      setIsDialogOpen(false);
    } catch (error) {
      console.error("Error adding stream: ", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "There was a problem adding the stream.",
      });
    }
  }

  async function handleDelete(streamId: string) {
    try {
      await deleteDoc(doc(db, "streams", streamId));
      toast({
        title: "Stream Deleted",
        description: "The stream has been successfully removed.",
      });
    } catch (error) {
      console.error("Error deleting stream:", error);
      toast({
        variant: "destructive",
        title: "Deletion Failed",
        description: "There was a problem deleting the stream.",
      });
    }
  }
  
  const isLoading = authLoading || isDataLoading;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
            <Radio className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold tracking-tight font-headline">
                Live Streams
            </h1>
        </div>
        {userRole === 'Admin' && (
            <Button onClick={() => setIsDialogOpen(true)}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Add New Stream
            </Button>
        )}
      </div>

       <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>Add New Stream</DialogTitle>
                <DialogDescription>
                  Fill in the details for the YouTube stream.
                </DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Stream Title</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Annual Day Function 2024" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Provide details about the stream."
                            className="resize-none"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                   <FormField
                    control={form.control}
                    name="date"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Stream Date</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant={"outline"}
                                className={cn(
                                  "w-full pl-3 text-left font-normal",
                                  !field.value && "text-muted-foreground"
                                )}
                              >
                                {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value}
                              onSelect={field.onChange}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="youtubeUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>YouTube URL</FormLabel>
                        <FormControl>
                          <Input placeholder="https://www.youtube.com/watch?v=..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                    <Button type="submit" disabled={form.formState.isSubmitting}>
                      {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Add Stream
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>

      <div className="flex flex-col gap-4">
        {isLoading ? (
             <div className="flex justify-center items-center h-48">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
             </div>
        ) : streams.length > 0 ? (
          streams.map((stream) => (
            <Card key={stream.id}>
              <CardHeader>
                <div className="flex justify-between items-start gap-4">
                  <div>
                    <CardTitle className="font-headline">{stream.title}</CardTitle>
                    <CardDescription>
                      Scheduled for {stream.date.toDate().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                    </CardDescription>
                  </div>
                  {userRole === 'Admin' && (
                     <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                           <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete this stream link.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            className="bg-destructive hover:bg-destructive/90"
                            onClick={() => handleDelete(stream.id)}>
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-foreground/80">{stream.description}</p>
              </CardContent>
              <CardFooter>
                 <Button asChild className="w-full">
                    <Link href={stream.youtubeUrl} target="_blank" rel="noopener noreferrer">
                        <Youtube className="mr-2 h-5 w-5" />
                        Watch on YouTube
                    </Link>
                </Button>
              </CardFooter>
            </Card>
          ))
        ) : (
            <Card>
                <CardContent className="py-12">
                    <div className="text-center text-muted-foreground">
                        <Radio className="mx-auto h-12 w-12" />
                        <h3 className="mt-4 text-lg font-semibold">No Live Streams</h3>
                        <p className="mt-2 text-sm">There are no upcoming or live streams scheduled.</p>
                    </div>
                </CardContent>
            </Card>
        )}
      </div>
    </div>
  );
}

    