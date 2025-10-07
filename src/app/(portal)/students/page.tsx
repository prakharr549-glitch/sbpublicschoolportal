
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
import { addDoc, collection, onSnapshot, query, doc, deleteDoc, where } from "firebase/firestore";
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
  const [isDataLoading, setIsDataLoading] = useState(true);
  const [classFilter, setClassFilter] = useState("all");
  const { toast } = useToast();
  const router = useRouter();

  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(true);
  const [passwordInput, setPasswordInput] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [isVerified, setIsVerified] = useState(false);
  const [protectedAction, setProtectedAction] = useState<(() => void) | null>(null);

  useEffect(() => {
    if (!isVerified) return;

    const q = query(collection(db, "users"), where("role", "==", "Student"));
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
  
  const handleMainPasswordVerification = () => {
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
  
  const handleActionPasswordVerification = () => {
    if (passwordInput === '355995') {
      if (protectedAction) {
        protectedAction();
      }
      setProtectedAction(null); // Close the dialog by resetting the action
      setPasswordInput('');
      setPasswordError('');
    } else {
      setPasswordError('Incorrect password. Please try again.');
    }
  };
  
  const requestPassword = (action: () => void) => {
    setProtectedAction(() => action);
  }

  const isLoading = (isVerified && isDataLoading);
  
  const availableClasses = ["all", ...Array.from(new Set(students.map(s => s.class)))];
  
  const filteredStudents = students.filter(student => {
    if (classFilter === "all" || !student.class) return true;
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
                <form onSubmit={(e) => { e.preventDefault(); handleMainPasswordVerification(); }}>
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
      <h1 className="text-3xl font-bold tracking-tight font-headline">
        Student Directory
      </h1>
        
        <Dialog open={protectedAction !== null} onOpenChange={(isOpen) => {
          if (!isOpen) {
              setPasswordInput('');
              setPasswordError('');
              setProtectedAction(null);
          }
      }}>
        <DialogContent className="sm:max-w-md">
            <DialogHeader>
                <DialogTitle>Admin Access Required</DialogTitle>
                <DialogDescription>
                    Please enter the administrator password to continue.
                </DialogDescription>
            </DialogHeader>
            <form onSubmit={(e) => { e.preventDefault(); handleActionPasswordVerification(); }}>
                <div className="space-y-4 py-2 pb-4">
                    <div className="space-y-2">
                        <Label htmlFor="password-action">Password</Label>
                        <Input
                            id="password-action"
                            type="password"
                            value={passwordInput}
                            onChange={(e) => setPasswordInput(e.target.value)}
                            placeholder="Enter password"
                        />
                        {passwordError && <p className="text-sm text-destructive">{passwordError}</p>}
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" type="button" onClick={() => setProtectedAction(null)}>Cancel</Button>
                    <Button type="submit">
                        <Lock className="mr-2 h-4 w-4"/>
                        Verify
                    </Button>
                </DialogFooter>
            </form>
        </DialogContent>
      </Dialog>


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
            <div className="w-full overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Class</TableHead>
                    <TableHead>Roll No.</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredStudents.length > 0 ? (
                    filteredStudents.map((student) => (
                      <TableRow key={student.id}>
                        <TableCell className="font-medium whitespace-nowrap">{student.name}</TableCell>
                        <TableCell>{student.class || "N/A"}</TableCell>
                        <TableCell>{student.rollNumber || "N/A"}</TableCell>
                        <TableCell>{student.phone || "N/A"}</TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <span className="sr-only">Open menu</span>
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                {student.phone ? (
                                    <>
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
                                    </>
                                ) : (
                                    <DropdownMenuItem disabled>No contact info</DropdownMenuItem>
                                )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="h-24 text-center">
                        No students found for the selected filter.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
