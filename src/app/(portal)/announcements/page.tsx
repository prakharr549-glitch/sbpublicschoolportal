
"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, PlusCircle, Megaphone } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { db, auth } from "@/lib/firebase";
import { addDoc, collection, onSnapshot, query, orderBy, Timestamp } from "firebase/firestore";
import { useAuthState } from "react-firebase-hooks/auth";

const announcementCategories = ["Event", "Academic", "General"] as const;

const announcementFormSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters."),
  category: z.enum(announcementCategories, {
    required_error: "Please select a category.",
  }),
  content: z.string().min(10, "Content must be at least 10 characters."),
});

type AnnouncementFormValues = z.infer<typeof announcementFormSchema>;

type Announcement = {
  id: string;
  title: string;
  category: "Event" | "Academic" | "General";
  content: string;
  date: Timestamp;
};

export default function AnnouncementsPage() {
  const [user, authLoading] = useAuthState(auth);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDataLoading, setIsDataLoading] = useState(true);
  const { toast } = useToast();

  const form = useForm<AnnouncementFormValues>({
    resolver: zodResolver(announcementFormSchema),
    defaultValues: {
      title: "",
      content: "",
    },
  });

  useEffect(() => {
    if (authLoading) return;
    if(!user) {
        setIsDataLoading(false);
        return;
    }

    const q = query(collection(db, "announcements"), orderBy("date", "desc"));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const announcementsData: Announcement[] = [];
      querySnapshot.forEach((doc) => {
        announcementsData.push({ id: doc.id, ...(doc.data() as Omit<Announcement, 'id'>) });
      });
      setAnnouncements(announcementsData);
      setIsDataLoading(false);
    }, (error) => {
        console.error("Error fetching announcements:", error);
        toast({
            variant: "destructive",
            title: "Permission Denied",
            description: "You do not have permission to view this data.",
        });
        setIsDataLoading(false);
    });

    return () => unsubscribe();
  }, [user, authLoading, toast]);

  async function onSubmit(data: AnnouncementFormValues) {
    try {
      await addDoc(collection(db, "announcements"), {
        ...data,
        date: Timestamp.now(),
      });
      toast({
        title: "Announcement Added",
        description: "The new announcement has been posted.",
      });
      form.reset();
      setIsDialogOpen(false);
    } catch (error) {
      console.error("Error adding announcement: ", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "There was a problem adding the announcement.",
      });
    }
  }
  
  const isLoading = authLoading || isDataLoading;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
            <Megaphone className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold tracking-tight font-headline">
                School Announcements
            </h1>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              Add Announcement
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Add New Announcement</DialogTitle>
              <DialogDescription>
                Fill in the details below to post a new announcement.
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Annual Sports Day" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {announcementCategories.map((category) => (
                            <SelectItem key={category} value={category}>
                              {category}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="content"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Content</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Provide the full details of the announcement."
                          className="resize-none"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                  <Button type="submit" disabled={form.formState.isSubmitting}>
                    {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Post Announcement
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex flex-col gap-4">
        {isLoading ? (
             <div className="flex justify-center items-center h-48">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
             </div>
        ) : announcements.length > 0 ? (
          announcements.map((announcement) => (
            <Card key={announcement.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="font-headline">{announcement.title}</CardTitle>
                    <CardDescription>
                      Posted on {announcement.date.toDate().toLocaleDateString()}
                    </CardDescription>
                  </div>
                  <Badge variant={announcement.category === 'Event' ? 'default' : 'secondary'}>{announcement.category}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-foreground/80">{announcement.content}</p>
              </CardContent>
            </Card>
          ))
        ) : (
            <Card>
                <CardContent className="py-12">
                    <div className="text-center text-muted-foreground">
                        <Megaphone className="mx-auto h-12 w-12" />
                        <h3 className="mt-4 text-lg font-semibold">No announcements yet</h3>
                        <p className="mt-2 text-sm">Check back later for new updates.</p>
                    </div>
                </CardContent>
            </Card>
        )}
      </div>
    </div>
  );
}
