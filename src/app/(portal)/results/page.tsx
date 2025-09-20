
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Loader2, PlusCircle, Download, Upload, Trash2, Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { db, auth, storage } from "@/lib/firebase";
import { addDoc, collection, onSnapshot, query, orderBy, Timestamp, doc, deleteDoc, getDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { useAuthState } from "react-firebase-hooks/auth";
import Link from "next/link";

const resultFormSchema = z.object({
  studentName: z.string().min(2, "Student name must be at least 2 characters."),
  class: z.string().min(1, "Class is required."),
  rollNumber: z.string().min(1, "Roll number is required."),
  subject: z.string().min(2, "Subject is required."),
  resultFile: z.instanceof(File).refine(file => file.size > 0, "A file is required."),
});

type ResultFormValues = z.infer<typeof resultFormSchema>;

type Result = {
  id: string;
  studentName: string;
  class: string;
  rollNumber: string;
  subject: string;
  fileUrl: string;
  fileName: string;
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

  const form = useForm<Omit<ResultFormValues, 'resultFile'>>({
    resolver: zodResolver(resultFormSchema.omit({ resultFile: true })),
    defaultValues: {
      studentName: "",
      class: "",
      rollNumber: "",
      subject: "",
    },
  });
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
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

  async function onSubmit(data: Omit<ResultFormValues, 'resultFile'>) {
    if (!file) {
      setFileError("A result file is required.");
      return;
    }
    setFileError(null);
    setIsUploading(true);

    try {
      const storageRef = ref(storage, `results/${Date.now()}_${file.name}`);
      const uploadTask = await uploadBytes(storageRef, file);
      const fileUrl = await getDownloadURL(uploadTask.ref);

      await addDoc(collection(db, "results"), {
        ...data,
        fileUrl,
        fileName: file.name,
        uploadedAt: Timestamp.now(),
      });

      toast({
        title: "Result Uploaded",
        description: `Result for ${data.studentName} has been uploaded.`,
      });
      form.reset();
      setFile(null);
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
  
  async function handleDelete(result: Result) {
    try {
      // Delete file from storage
      const fileRef = ref(storage, result.fileUrl);
      await deleteObject(fileRef);
      
      // Delete record from firestore
      await deleteDoc(doc(db, "results", result.id));

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
            <Download className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold tracking-tight font-headline">
                Download Result
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
                  Fill in the student's details and upload the result file.
                </DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
                    <FormField control={form.control} name="studentName" render={({ field }) => ( <FormItem> <FormLabel>Student Name</FormLabel> <FormControl> <Input placeholder="e.g., John Doe" {...field} /> </FormControl> <FormMessage /> </FormItem> )}/>
                    <div className="grid grid-cols-2 gap-4">
                        <FormField control={form.control} name="class" render={({ field }) => ( <FormItem> <FormLabel>Class</FormLabel> <FormControl> <Input placeholder="e.g., Grade 10" {...field} /> </FormControl> <FormMessage /> </FormItem> )}/>
                        <FormField control={form.control} name="rollNumber" render={({ field }) => ( <FormItem> <FormLabel>Roll Number</FormLabel> <FormControl> <Input placeholder="e.g., 21" {...field} /> </FormControl> <FormMessage /> </FormItem> )}/>
                    </div>
                    <FormField control={form.control} name="subject" render={({ field }) => ( <FormItem> <FormLabel>Subject / Exam Name</FormLabel> <FormControl> <Input placeholder="e.g., Final Term, Maths" {...field} /> </FormControl> <FormMessage /> </FormItem> )}/>
                    <FormItem>
                        <FormLabel>Result File</FormLabel>
                        <FormControl>
                            <Input type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} />
                        </FormControl>
                        {fileError && <p className="text-sm font-medium text-destructive">{fileError}</p>}
                    </FormItem>
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
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                            <Button asChild variant="outline" size="sm">
                                <Link href={result.fileUrl} target="_blank" download>
                                    <Download className="mr-2 h-4 w-4" /> Download
                                </Link>
                            </Button>
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
                                            onClick={() => handleDelete(result)}>
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
                    <TableCell colSpan={5} className="h-24 text-center">
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

    