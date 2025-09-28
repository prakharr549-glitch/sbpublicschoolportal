
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
  } from "@/components/ui/select";
import { Loader2, PlusCircle, BookOpen, Trash2, CalendarIcon, MoreHorizontal } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { db, auth } from "@/lib/firebase";
import { addDoc, collection, onSnapshot, query, orderBy, Timestamp, doc, deleteDoc, getDoc } from "firebase/firestore";
import { useAuthState } from "react-firebase-hooks/auth";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

const homeworkFormSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters."),
  subject: z.string().min(3, "Subject must be at least 3 characters."),
  class: z.string().min(1, "Class is required."),
  description: z.string().min(10, "Description must be at least 10 characters."),
  dueDate: z.date({
    required_error: "A due date is required.",
  }),
});

type HomeworkFormValues = z.infer<typeof homeworkFormSchema>;

type Homework = {
  id: string;
  title: string;
  subject: string;
  class: string;
  description: string;
  assignedDate: Timestamp;
  dueDate: Timestamp;
};

export default function HomeworkPage() {
  const [homework, setHomework] = useState<Homework[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDataLoading, setIsDataLoading] = useState(true);
  const [classFilter, setClassFilter] = useState("all");
  const { toast } = useToast();
  const [user, authLoading] = useAuthState(auth);
  const [userRole, setUserRole] = useState<string | null>(null);

  const form = useForm<HomeworkFormValues>({
    resolver: zodResolver(homeworkFormSchema),
    defaultValues: {
      title: "",
      subject: "",
      class: "",
      description: "",
      dueDate: new Date(),
    },
  });

  useEffect(() => {
    if (user && !authLoading) {
      const userDocRef = doc(db, "users", user.uid);
      getDoc(userDocRef).then(userDoc => {
        if (userDoc.exists()) {
          setUserRole(userDoc.data().role);
        }
      });
    }
  }, [user, authLoading]);

  useEffect(() => {
    const q = query(collection(db, "homework"), orderBy("assignedDate", "desc"));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const homeworkData: Homework[] = [];
      querySnapshot.forEach((doc) => {
        homeworkData.push({ id: doc.id, ...(doc.data() as Omit<Homework, 'id'>) });
      });
      setHomework(homeworkData);
      setIsDataLoading(false);
    }, (error) => {
        console.error("Error fetching homework:", error);
        toast({
            variant: "destructive",
            title: "Permission Denied",
            description: "You do not have permission to view homework data.",
        });
        setIsDataLoading(false);
    });

    return () => unsubscribe();
  }, [toast]);
  

  async function onSubmit(data: HomeworkFormValues) {
    try {
      await addDoc(collection(db, "homework"), {
        ...data,
        assignedDate: Timestamp.now(),
        dueDate: Timestamp.fromDate(data.dueDate),
      });
      toast({
        title: "Homework Added",
        description: "The new homework assignment has been posted.",
      });
      form.reset();
      setIsDialogOpen(false);
    } catch (error) {
      console.error("Error adding homework: ", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "There was a problem adding the homework.",
      });
    }
  }

  async function handleDelete(homeworkId: string) {
    try {
      await deleteDoc(doc(db, "homework", homeworkId));
      toast({
        title: "Homework Deleted",
        description: "The homework assignment has been successfully removed.",
      });
    } catch (error) {
      console.error("Error deleting homework:", error);
      toast({
        variant: "destructive",
        title: "Deletion Failed",
        description: "There was a problem deleting the homework.",
      });
    }
  }
  
  const isLoading = authLoading || isDataLoading;
  const canManage = userRole === 'Admin' || userRole === 'Teacher';
  
  const availableClasses = ["all", ...Array.from(new Set(homework.map(hw => hw.class)))];
  
  const filteredHomework = homework.filter(hw => {
    if (classFilter === "all") return true;
    return hw.class === classFilter;
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
            <BookOpen className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold tracking-tight font-headline">
                Homework Assignments
            </h1>
        </div>
        <div className="flex items-center gap-2">
            <Select value={classFilter} onValueChange={setClassFilter}>
                <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filter by class" />
                </SelectTrigger>
                <SelectContent>
                    {availableClasses.map(c => (
                            <SelectItem key={c} value={c}>{c === 'all' ? 'All Classes' : c}</SelectItem>
                    ))}
                </SelectContent>
            </Select>
            {canManage && (
              <Button onClick={() => setIsDialogOpen(true)}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Add Homework
              </Button>
            )}
        </div>
      </div>

       <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>Add New Homework</DialogTitle>
                <DialogDescription>
                  Fill in the details for the new assignment.
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
                          <Input placeholder="e.g., Chapter 5 Reading" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="subject"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Subject</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., History" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="class"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Class</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., Grade 10B" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Provide the full details of the assignment."
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
                    name="dueDate"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Due Date</FormLabel>
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
                                {field.value ? (
                                  format(field.value, "PPP")
                                ) : (
                                  <span>Pick a date</span>
                                )}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value}
                              onSelect={field.onChange}
                              disabled={(date) => date < new Date()}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                    <Button type="submit" disabled={form.formState.isSubmitting}>
                      {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Post Homework
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
        ) : filteredHomework.length > 0 ? (
          filteredHomework.map((hw) => (
            <Card key={hw.id}>
              <CardHeader>
                <div className="flex justify-between items-start gap-4">
                  <div>
                    <CardTitle className="font-headline">{hw.title}</CardTitle>
                    <CardDescription>
                      For {hw.class} | Subject: {hw.subject}
                    </CardDescription>
                     <CardDescription>
                      Due on {hw.dueDate.toDate().toLocaleDateString()}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                     <p className="text-xs text-muted-foreground whitespace-nowrap">
                      Posted on {hw.assignedDate.toDate().toLocaleDateString()}
                    </p>
                    {canManage && (
                      <AlertDialog>
                          <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                  <span className="sr-only">Open menu</span>
                                  <MoreHorizontal className="h-4 w-4" />
                              </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              <AlertDialogTrigger asChild>
                                  <DropdownMenuItem className="text-destructive focus:text-destructive" onSelect={(e) => e.preventDefault()}>
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  <span>Delete</span>
                                  </DropdownMenuItem>
                              </AlertDialogTrigger>
                              </DropdownMenuContent>
                          </DropdownMenu>
                          <AlertDialogContent>
                              <AlertDialogHeader>
                              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                              <AlertDialogDescription>
                                  This action cannot be undone. This will permanently delete this
                                  homework assignment.
                              </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction 
                                  className="bg-destructive hover:bg-destructive/90"
                                  onClick={() => handleDelete(hw.id)}>
                                  Continue
                              </AlertDialogAction>
                              </AlertDialogFooter>
                          </AlertDialogContent>
                          </AlertDialog>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-foreground/80">{hw.description}</p>
              </CardContent>
            </Card>
          ))
        ) : (
            <Card>
                <CardContent className="py-12">
                    <div className="text-center text-muted-foreground">
                        <BookOpen className="mx-auto h-12 w-12" />
                        <h3 className="mt-4 text-lg font-semibold">No homework found</h3>
                        <p className="mt-2 text-sm">There are no assignments for the selected class, or no assignments have been posted yet.</p>
                    </div>
                </CardContent>
            </Card>
        )}
      </div>
    </div>
  );
}
