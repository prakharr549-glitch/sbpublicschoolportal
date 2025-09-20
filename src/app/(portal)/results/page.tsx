
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Loader2, Upload, Trash2, Search, Award } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { db, auth } from "@/lib/firebase";
import { addDoc, collection, onSnapshot, query, orderBy, Timestamp, doc, deleteDoc, getDoc } from "firebase/firestore";
import { useAuthState } from "react-firebase-hooks/auth";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";

const resultFormSchema = z.object({
  studentName: z.string().min(2, "Student name must be at least 2 characters."),
  class: z.string().min(1, "Class is required."),
  rollNumber: z.string().min(1, "Roll number is required."),
  subject: z.string().min(2, "Subject is required."),
  totalMarks: z.preprocess(
    (a) => parseInt(z.string().parse(a), 10),
    z.number().positive("Total marks must be a positive number.")
  ),
  gainedMarks: z.preprocess(
    (a) => parseInt(z.string().parse(a), 10),
    z.number().nonnegative("Gained marks must be a non-negative number.")
  ),
  behaviorDescription: z.string().min(10, "Description must be at least 10 characters.").optional(),
  rank: z.string().optional(),
  status: z.enum(["Pass", "Fail"], { required_error: "Please select a status." }),
});

type ResultFormValues = z.infer<typeof resultFormSchema>;

type Result = {
  id: string;
  studentName: string;
  class: string;
  rollNumber: string;
  subject: string;
  totalMarks: number;
  gainedMarks: number;
  behaviorDescription?: string;
  rank?: string;
  status: "Pass" | "Fail";
  uploadedAt: Timestamp;
};

export default function ResultsPage() {
  const [results, setResults] = useState<Result[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();
  const [user, authLoading] = useAuthState(auth);
  const [userRole, setUserRole] = useState<string | null>(null);

  const form = useForm<ResultFormValues>({
    resolver: zodResolver(resultFormSchema),
    defaultValues: {
      studentName: "",
      class: "",
      rollNumber: "",
      subject: "",
      totalMarks: 100,
      gainedMarks: 0,
      behaviorDescription: "",
      rank: "",
      status: "Pass",
    },
  });
  const [isUploading, setIsUploading] = useState(false);

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
    const q = query(collection(db, "results"), orderBy("uploadedAt", "desc"));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const resultsData: Result[] = [];
      querySnapshot.forEach((doc) => {
        resultsData.push({ id: doc.id, ...(doc.data() as Omit<Result, 'id'>) });
      });
      setResults(resultsData);
      setIsLoading(false);
    }, (error) => {
      console.error("Error fetching results:", error);
      toast({
        variant: "destructive",
        title: "Permission Denied",
        description: "You do not have permission to view results.",
      });
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [toast]);

  async function onSubmit(data: ResultFormValues) {
    setIsUploading(true);

    try {
      await addDoc(collection(db, "results"), {
        ...data,
        uploadedAt: Timestamp.now(),
      });

      toast({
        title: "Result Uploaded",
        description: `Result for ${data.studentName} has been uploaded.`,
      });
      form.reset();
      setIsDialogOpen(false);
    } catch (error) {
      console.error("Error uploading result: ", error);
      toast({
        variant: "destructive",
        title: "Upload Failed",
        description: "There was a problem uploading the result.",
      });
    } finally {
        setIsUploading(false);
    }
  }
  
  async function handleDelete(resultId: string) {
    try {
      await deleteDoc(doc(db, "results", resultId));
      toast({
        title: "Result Deleted",
        description: "The result has been successfully removed.",
      });
    } catch (error) {
      console.error("Error deleting result:", error);
      toast({
        variant: "destructive",
        title: "Deletion Failed",
        description: "There was a problem deleting the result.",
      });
    }
  }
  
  const canManage = userRole === 'Admin' || userRole === 'Teacher';

  const filteredResults = results.filter(result => 
    result.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    result.rollNumber.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
            <Award className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold tracking-tight font-headline">
                Student Results
            </h1>
        </div>
        {canManage && (
            <Button onClick={() => setIsDialogOpen(true)}>
                <Upload className="mr-2 h-4 w-4" />
                Upload Result
            </Button>
        )}
      </div>

       <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>Upload New Result</DialogTitle>
                <DialogDescription>
                  Fill in the student's details and marks.
                </DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4 max-h-[70vh] overflow-y-auto pr-2">
                  <FormField
                    control={form.control}
                    name="studentName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Student Name</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., John Doe" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="class"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Class</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., Grade 10" {...field} />
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
                            <Input placeholder="e.g., 21" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormField
                    control={form.control}
                    name="subject"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Subject / Exam Name</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Final Term, Maths" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <FormField
                        control={form.control}
                        name="totalMarks"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Total Marks</FormLabel>
                            <FormControl>
                                <Input type="number" placeholder="e.g., 100" {...field} />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                        />
                    <FormField
                        control={form.control}
                        name="gainedMarks"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Gained Marks</FormLabel>
                            <FormControl>
                                <Input type="number" placeholder="e.g., 85" {...field} />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                        />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="rank"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Rank (Optional)</FormLabel>
                            <FormControl>
                                <Input placeholder="e.g., 1st" {...field} />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                        />
                     <FormField
                        control={form.control}
                        name="status"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Status</FormLabel>
                                <FormControl>
                                    <RadioGroup
                                    onValueChange={field.onChange}
                                    defaultValue={field.value}
                                    className="flex items-center space-x-4 pt-2"
                                    >
                                    <FormItem className="flex items-center space-x-2 space-y-0">
                                        <FormControl>
                                        <RadioGroupItem value="Pass" />
                                        </FormControl>
                                        <FormLabel className="font-normal">Pass</FormLabel>
                                    </FormItem>
                                    <FormItem className="flex items-center space-x-2 space-y-0">
                                        <FormControl>
                                        <RadioGroupItem value="Fail" />
                                        </FormControl>
                                        <FormLabel className="font-normal">Fail</FormLabel>
                                    </FormItem>
                                    </RadioGroup>
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                        />
                  </div>
                   <FormField
                    control={form.control}
                    name="behaviorDescription"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Behavior Description (Optional)</FormLabel>
                        <FormControl>
                          <Textarea placeholder="e.g., Excellent participation in class activities." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                    <Button type="submit" disabled={isUploading}>
                      {isUploading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Upload
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>

      <Card>
        <CardHeader>
          <CardTitle>Available Results</CardTitle>
           <CardDescription>Search for results by student name or roll number.</CardDescription>
           <div className="relative pt-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search results..." 
              className="pl-9"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
           </div>
        </CardHeader>
        <CardContent>
          {isLoading || authLoading ? (
            <div className="flex justify-center items-center h-24">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student Name</TableHead>
                  <TableHead>Class</TableHead>
                  <TableHead>Roll No.</TableHead>
                  <TableHead>Subject/Exam</TableHead>
                  <TableHead>Marks</TableHead>
                  <TableHead>Rank</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Behavior</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredResults.length > 0 ? (
                  filteredResults.map((result) => (
                    <TableRow key={result.id}>
                      <TableCell className="font-medium">{result.studentName}</TableCell>
                      <TableCell>{result.class}</TableCell>
                      <TableCell>{result.rollNumber}</TableCell>
                      <TableCell>{result.subject}</TableCell>
                      <TableCell>{result.gainedMarks} / {result.totalMarks}</TableCell>
                      <TableCell>{result.rank || 'N/A'}</TableCell>
                      <TableCell>
                        <Badge variant={result.status === 'Pass' ? 'secondary' : 'destructive'}>
                            {result.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{result.behaviorDescription || 'N/A'}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                            {canManage && (
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button variant="destructive" size="sm">
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            This will permanently delete the result for {result.studentName}.
                                        </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction
                                            className="bg-destructive hover:bg-destructive/90"
                                            onClick={() => handleDelete(result.id)}>
                                            Delete
                                        </AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={9} className="h-24 text-center">
                      No results found.
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
