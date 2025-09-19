
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
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
  } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
  } from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, PlusCircle, Trash2, Phone, MoreHorizontal, Lock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { db } from "@/lib/firebase";
import { addDoc, collection, onSnapshot, query, doc, deleteDoc } from "firebase/firestore";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useRouter } from "next/navigation";

const studentFormSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters."),
  class: z.string().min(1, "Class is required."),
  rollNumber: z.string().min(1, "Roll number is required."),
  phone: z.string().regex(/^\d{10}$/, "Please enter a valid 10-digit phone number."),
  address: z.string().min(5, "Address must be at least 5 characters."),
});

type StudentFormValues = z.infer<typeof studentFormSchema>;

type Student = StudentFormValues & { id: string };

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

export default function StudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDataLoading, setIsDataLoading] = useState(true);
  const [classFilter, setClassFilter] = useState("all");
  const { toast } = useToast();
  const router = useRouter();

  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(true);
  const [passwordInput, setPasswordInput] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [isVerified, setIsVerified] = useState(false);

  const form = useForm<StudentFormValues>({
    resolver: zodResolver(studentFormSchema),
    defaultValues: {
      name: "",
      class: "",
      rollNumber: "",
      phone: "",
      address: "",
    },
  });

  useEffect(() => {
    if (!isVerified) return;

    const q = query(collection(db, "students"));
    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        const studentsData: Student[] = [];
        querySnapshot.forEach((doc) => {
          studentsData.push({ id: doc.id, ...(doc.data() as StudentFormValues) });
        });
        setStudents(studentsData);
        setIsDataLoading(false);
      },
      (error) => {
        console.error("Error fetching students:", error);
        toast({
          variant: "destructive",
          title: "Permission Denied",
          description: "You do not have permission to view this data.",
        });
        setIsDataLoading(false);
      }
    );

    return () => unsubscribe();
  }, [toast, isVerified]);

  const handlePasswordVerification = () => {
    if (passwordInput === '355995') {
      setIsVerified(true);
      setIsPasswordDialogOpen(false);
      setPasswordError('');
    } else {
      setPasswordError('Incorrect password. Please try again.');
    }
  };

  const handlePasswordDialogClose = (isOpen: boolean) => {
    if (!isOpen && !isVerified) {
      router.push('/dashboard');
    }
    setIsPasswordDialogOpen(isOpen);
  };

  async function onSubmit(data: StudentFormValues) {
    try {
      await addDoc(collection(db, "students"), data);
      toast({
        title: "Student Added",
        description: `${data.name} has been added.`,
      });
      form.reset();
      setIsDialogOpen(false);
    } catch (error) {
      console.error("Error adding student: ", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "There was a problem adding the student.",
      });
    }
  }

  async function handleDelete(studentId: string) {
    try {
      await deleteDoc(doc(db, "students", studentId));
      toast({
        title: "Student Deleted",
        description: "The student has been successfully removed.",
      });
    } catch (error) {
      console.error("Error deleting student:", error);
      toast({
        variant: "destructive",
        title: "Deletion Failed",
        description: "There was a problem deleting the student.",
      });
    }
  }

  const isLoading = (isVerified && isDataLoading);
  
  const availableClasses = ["all", ...Array.from(new Set(students.map(s => s.class)))];
  
  const filteredStudents = students.filter(student => {
    if (classFilter === "all") return true;
    return student.class === classFilter;
  });

  if (!isVerified) {
    return (
        <Dialog open={isPasswordDialogOpen} onOpenChange={handlePasswordDialogClose}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Access Required</DialogTitle>
                    <DialogDescription>
                        Please enter the password to view student information.
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
                        <Button variant="outline" type="button" onClick={() => handlePasswordDialogClose(false)}>Cancel</Button>
                        <Button type="submit">
                            <Lock className="mr-2 h-4 w-4"/>
                            Verify
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
      </Dialog>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight font-headline">
          Student Management
        </h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              Add New Student
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Add New Student</DialogTitle>
              <DialogDescription>
                Fill in the details below to add a new student.
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4 max-h-[60vh] overflow-y-auto pr-2">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Alex Johnson" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="class"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Class</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Grade 10A" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="rollNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Roll Number</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., 25" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone Number</FormLabel>
                        <FormControl>
                          <Input type="tel" placeholder="e.g., 9876543210" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                <FormField
                    control={form.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Address</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Enter student's address" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                <DialogFooter className="mt-4 pt-4 border-t sticky bottom-0 bg-background">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={form.formState.isSubmitting}>
                    {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Save Student
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Student List</CardTitle>
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
            </div>
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
                  <TableHead>Class</TableHead>
                  <TableHead>Roll No.</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Address</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStudents.length > 0 ? (
                  filteredStudents.map((student) => (
                    <TableRow key={student.id}>
                      <TableCell className="font-medium">{student.name}</TableCell>
                      <TableCell>{student.class}</TableCell>
                      <TableCell>{student.rollNumber}</TableCell>
                      <TableCell>{student.phone}</TableCell>
                      <TableCell>{student.address}</TableCell>
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
                                <a href={`tel:${student.phone}`}>
                                  <Phone className="mr-2 h-4 w-4" />
                                  <span>Call</span>
                                </a>
                              </DropdownMenuItem>
                              <DropdownMenuItem asChild>
                                <a
                                  href={`https://wa.me/${student.phone}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  <WhatsAppIcon className="mr-2 h-4 w-4" />
                                  <span>WhatsApp</span>
                                </a>
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <AlertDialogTrigger asChild>
                                <DropdownMenuItem className="text-destructive focus:text-destructive">
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
                                This action cannot be undone. This will permanently delete the student record for {student.name}.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                className="bg-destructive hover:bg-destructive/90"
                                onClick={() => handleDelete(student.id)}
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
                    <TableCell colSpan={6} className="h-24 text-center">
                      No students found for the selected filter.
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
