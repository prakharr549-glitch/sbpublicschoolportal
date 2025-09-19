
"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, PlusCircle, Phone, MoreHorizontal, Trash2, Lock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { db } from "@/lib/firebase";
import { addDoc, collection, onSnapshot, query, doc, deleteDoc } from "firebase/firestore";
import { Label } from "@/components/ui/label";

const teacherFormSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters."),
  subject: z.string().min(2, "Subject must be at least 2 characters."),
  mobile: z.string().regex(/^\d{10}$/, "Please enter a valid 10-digit mobile number."),
});

type TeacherFormValues = z.infer<typeof teacherFormSchema>;

type Teacher = TeacherFormValues & { id: string };

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

export default function TeachersPage() {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDataLoading, setIsDataLoading] = useState(true);
  const { toast } = useToast();

  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [protectedAction, setProtectedAction] = useState<(() => void) | null>(null);

  const form = useForm<TeacherFormValues>({
    resolver: zodResolver(teacherFormSchema),
    defaultValues: {
      name: "",
      subject: "",
      mobile: "",
    },
  });

  useEffect(() => {
    const q = query(collection(db, "teachers"));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const teachersData: Teacher[] = [];
      querySnapshot.forEach((doc) => {
        teachersData.push({ id: doc.id, ...(doc.data() as TeacherFormValues) });
      });
      setTeachers(teachersData);
      setIsDataLoading(false);
    }, (error) => {
        console.error("Error fetching teachers:", error);
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
    if (passwordInput === '355995') {
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

  async function onSubmit(data: TeacherFormValues) {
    try {
      await addDoc(collection(db, "teachers"), data);
      toast({
        title: "Teacher Added",
        description: `${data.name} has been added.`,
      });
      form.reset();
      setIsDialogOpen(false);
    } catch (error) {
      console.error("Error adding teacher: ", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "There was a problem adding the teacher.",
      });
    }
  }

  async function handleDelete(teacherId: string) {
    try {
      await deleteDoc(doc(db, "teachers", teacherId));
      toast({
        title: "Teacher Deleted",
        description: "The teacher has been successfully removed.",
      });
    } catch (error) {
      console.error("Error deleting teacher:", error);
      toast({
        variant: "destructive",
        title: "Deletion Failed",
        description: "There was a problem deleting the teacher.",
      });
    }
  }


  const isLoading = isDataLoading;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight font-headline">
          Teacher Management
        </h1>
        <Button onClick={() => requestPassword(() => setIsDialogOpen(true))}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Add New Teacher
        </Button>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
            <DialogTitle>Add New Teacher</DialogTitle>
            <DialogDescription>
                Fill in the details below to add a new teacher.
            </DialogDescription>
            </DialogHeader>
            <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
                <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Full Name</FormLabel>
                    <FormControl>
                        <Input placeholder="e.g., Jane Smith" {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
                <FormField
                control={form.control}
                name="subject"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Subject</FormLabel>
                    <FormControl>
                        <Input placeholder="e.g., Mathematics" {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
                <FormField
                control={form.control}
                name="mobile"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Mobile Number</FormLabel>
                    <FormControl>
                        <Input type="tel" placeholder="e.g., 9876543210" {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
                <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={form.formState.isSubmitting}>
                    {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Save Teacher
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


      <Card>
        <CardHeader>
          <CardTitle>Teacher List</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center h-24">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Mobile Number</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {teachers.length > 0 ? (
                  teachers.map((teacher) => (
                    <TableRow key={teacher.id}>
                      <TableCell className="font-medium">{teacher.name}</TableCell>
                      <TableCell>{teacher.subject}</TableCell>
                      <TableCell>{teacher.mobile}</TableCell>
                      <TableCell className="text-right">
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
                            <DropdownMenuItem asChild>
                                <a href={`tel:${teacher.mobile}`}>
                                    <Phone className="mr-2 h-4 w-4" />
                                    <span>Call</span>
                                </a>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                                <a href={`https://wa.me/${teacher.mobile}`} target="_blank" rel="noopener noreferrer">
                                <WhatsAppIcon className="mr-2 h-4 w-4" />
                                <span>WhatsApp</span>
                                </a>
                            </DropdownMenuItem>
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
                                This action cannot be undone. This will permanently delete the record for {teacher.name}.
                            </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                                className="bg-destructive hover:bg-destructive/90"
                                onClick={() => requestPassword(() => handleDelete(teacher.id))}
                            >
                                Continue
                            </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                        </AlertDialog>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} className="h-24 text-center">
                      No teachers found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
