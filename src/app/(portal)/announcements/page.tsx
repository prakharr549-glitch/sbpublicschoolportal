
"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { Loader2, PlusCircle, Megaphone, Trash2, Lock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { db } from "@/lib/firebase";
import { addDoc, collection, onSnapshot, query, orderBy, Timestamp, doc, deleteDoc } from "firebase/firestore";
import { Label } from "@/components/ui/label";

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
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDataLoading, setIsDataLoading] = useState(true);
  const { toast } = useToast();

  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [protectedAction, setProtectedAction] = useState<(() => void) | null>(null);

  const form = useForm<AnnouncementFormValues>({
    resolver: zodResolver(announcementFormSchema),
    defaultValues: {
      title: "",
      content: "",
    },
  });

  useEffect(() => {
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
  }, [toast]);

  const handlePasswordVerification = () => {
    if (passwordInput === '6395') {
      if (protectedAction) {
        protectedAction();
      }
      setIsPasswordDialogOpen(false);
      setPasswordInput('');
      setPasswordError('');
      setProtectedAction(null);
    } else {
      setPasswordError('Incorrect password. Please try again.');
    }
  };
  
  const requestPassword = (action: () => void) => {
    setProtectedAction(() => action);
    setIsPasswordDialogOpen(true);
  }

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

  async function handleDelete(announcementId: string) {
    try {
      await deleteDoc(doc(db, "announcements", announcementId));
      toast({
        title: "Announcement Deleted",
        description: "The announcement has been successfully removed.",
      });
    } catch (error) {
      console.error("Error deleting announcement:", error);
      toast({
        variant: "destructive",
        title: "Deletion Failed",
        description: "There was a problem deleting the announcement.",
      });
    }
  }
  
  const isLoading = isDataLoading;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
            <Megaphone className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold tracking-tight font-headline">
                School Announcements
            </h1>
        </div>
        <Button onClick={() => requestPassword(() => setIsDialogOpen(true))}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Add Announcement
        </Button>
      </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
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

        <Dialog open={isPasswordDialogOpen} onOpenChange={(isOpen) => {
            if (!isOpen) {
                setPasswordInput('');
                setPasswordError('');
                setProtectedAction(null);
            }
            setIsPasswordDialogOpen(isOpen);
        }}>
        <DialogContent className="sm:max-w-md">
            <DialogHeader>
                <DialogTitle>Admin Access Required</DialogTitle>
                <DialogDescription>
                    Please enter the administrator password to continue.
                </DialogDescription>
            </DialogHeader>
            <form onSubmit={(e) => { e.preventDefault(); handlePasswordVerification(); }}>
                <div className="space-y-4 py-2 pb-4">
                    <div className="space-y-2">
                        <Label htmlFor="password">Password</Label>
                        <Input
                            id="password"
                            type="password"
                            value={passwordInput}
                            onChange={(e) => setPasswordInput(e.target.value)}
                            placeholder="Enter password"
                        />
                        {passwordError && <p className="text-sm text-destructive">{passwordError}</p>}
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" type="button" onClick={() => setIsPasswordDialogOpen(false)}>Cancel</Button>
                    <Button type="submit">
                        <Lock className="mr-2 h-4 w-4"/>
                        Verify
                    </Button>
                </DialogFooter>
            </form>
        </DialogContent>
      </Dialog>

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
              <CardFooter className="flex justify-end border-t pt-4">
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="sm">
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete this
                        announcement.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction 
                        className="bg-destructive hover:bg-destructive/90"
                        onClick={() => requestPassword(() => handleDelete(announcement.id))}>
                        Continue
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </CardFooter>
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
