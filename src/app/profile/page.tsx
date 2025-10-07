
"use client";

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { auth, db } from "@/lib/firebase";
import { useEffect, useState } from "react";
import { Loader2, Lock } from "lucide-react";
import { updateProfile } from "firebase/auth";
import { useRouter } from "next/navigation";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { useAuthState } from "react-firebase-hooks/auth";
import { SchoolLogo } from "@/components/icons";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Label } from "@/components/ui/label";

const userRoles = ["Student", "Teacher", "Admin", "Driver"] as const;
type UserRole = (typeof userRoles)[number];
const protectedRoles: UserRole[] = ["Admin", "Teacher", "Driver"];

const profileFormSchema = z.object({
  name: z.string().min(2, {
    message: "Name must be at least 2 characters.",
  }),
  email: z.string().email(),
  phone: z.string().regex(/^\d{10}$/, "Please enter a valid 10-digit phone number.").optional().or(z.literal('')),
  photoURL: z.string().url({ message: "Please enter a valid URL." }).optional().or(z.literal('')),
  role: z.enum(userRoles, {
    required_error: "Please select a role.",
  }),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

const avatarOptions = Array.from({ length: 30 }, (_, i) => `https://picsum.photos/seed/avatar${i + 1}/200`);

export default function ProfilePage() {
  const { toast } = useToast();
  const [user, loading] = useAuthState(auth);
  const router = useRouter();
  const [isProfileLoading, setIsProfileLoading] = useState(true);

  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [roleToSet, setRoleToSet] = useState<UserRole | null>(null);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      photoURL: "",
      role: "Student",
    },
  });
  
  const photoURL = form.watch("photoURL");

  useEffect(() => {
    if (loading) {
      return;
    }
    if (!user) {
      router.push('/login');
      return;
    }

    async function fetchProfile() {
      const userDoc = await getDoc(doc(db, "users", user.uid));
      if (userDoc.exists()) {
        const data = userDoc.data();
        form.reset({
          name: data.name || user.displayName || "",
          email: data.email || user.email || "",
          phone: data.phone || "",
          photoURL: data.photoURL || user.photoURL || "",
          role: data.role || "Student",
        });
      } else {
        form.reset({
          name: user.displayName || "",
          email: user.email || "",
          phone: "",
          photoURL: user.photoURL || "",
          role: "Student",
        });
      }
      setIsProfileLoading(false);
    }

    fetchProfile();
  }, [user, loading, form, router]);

  const handleRoleChange = (selectedRole: UserRole) => {
    if (protectedRoles.includes(selectedRole)) {
      setRoleToSet(selectedRole);
      setIsPasswordDialogOpen(true);
    } else {
      form.setValue("role", selectedRole);
    }
  };

  const handlePasswordVerification = () => {
    if (passwordInput === '355995') {
      if (roleToSet) {
        form.setValue("role", roleToSet);
      }
      setIsPasswordDialogOpen(false);
      setPasswordInput('');
      setPasswordError('');
      setRoleToSet(null);
    } else {
      setPasswordError('Incorrect password. Please try again.');
    }
  };

  const handlePasswordDialogClose = () => {
    setIsPasswordDialogOpen(false);
    setPasswordInput('');
    setPasswordError('');
    setRoleToSet(null);
  };


  async function onSubmit(data: ProfileFormValues) {
    if (!user) {
        toast({
            variant: "destructive",
            title: "Error",
            description: "You must be logged in to update your profile.",
        });
        return;
    }

    try {
        await updateProfile(user, { 
            displayName: data.name,
            photoURL: data.photoURL 
        });
        
        await setDoc(doc(db, "users", user.uid), { 
            name: data.name,
            email: data.email,
            phone: data.phone,
            photoURL: data.photoURL,
            role: data.role,
        }, { merge: true });
        
        toast({
            title: "Profile Updated",
            description: "Your profile has been successfully updated.",
        });

        router.push('/dashboard');

    } catch (error) {
        console.error("Error updating profile:", error);
        toast({
            variant: "destructive",
            title: "Update Failed",
            description: "There was an error updating your profile.",
        });
    }
  }
  
  if (loading || isProfileLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <div className="w-full max-w-2xl">
      <div className="mb-8 flex flex-col items-center justify-center gap-4">
          <SchoolLogo className="h-12 w-12 text-primary" />
        </div>
        <Card>
          <CardHeader>
            <CardTitle className="text-center">Your Profile</CardTitle>
            <CardDescription className="text-center">
              Manage your profile details below.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                 <FormField
                  control={form.control}
                  name="photoURL"
                  render={({ field }) => (
                    <FormItem className="flex flex-col items-center">
                      <FormLabel>Profile Picture</FormLabel>
                      <FormControl>
                        <Popover>
                          <PopoverTrigger asChild>
                            <button type="button" className="relative">
                                <Avatar className="h-24 w-24">
                                    <AvatarImage src={photoURL || undefined} alt={form.getValues("name")} />
                                    <AvatarFallback>{form.getValues("name")?.charAt(0) || 'U'}</AvatarFallback>
                                </Avatar>
                                <div className="absolute bottom-0 right-0 rounded-full bg-primary p-1">
                                    <Loader2 className="h-4 w-4 text-primary-foreground" />
                                </div>
                            </button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0">
                            <ScrollArea className="h-72 w-96">
                                <div className="p-4 grid grid-cols-5 gap-2">
                                  {avatarOptions.map((url) => (
                                    <button
                                      type="button"
                                      key={url}
                                      className={cn(
                                        "rounded-full transition-all",
                                        field.value === url
                                          ? "ring-2 ring-primary ring-offset-2"
                                          : "hover:scale-105"
                                      )}
                                      onClick={() => field.onChange(url)}
                                    >
                                      <Avatar className="h-16 w-16">
                                        <AvatarImage src={url} alt="Avatar" />
                                        <AvatarFallback>AV</AvatarFallback>
                                      </Avatar>
                                    </button>
                                  ))}
                                </div>
                            </ScrollArea>
                          </PopoverContent>
                        </Popover>
                      </FormControl>
                       <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Your full name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email Address</FormLabel>
                      <FormControl>
                        <Input placeholder="Your email" {...field} disabled />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone Number (Optional)</FormLabel>
                      <FormControl>
                        <Input type="tel" placeholder="e.g., 9876543210" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <FormField
                  control={form.control}
                  name="role"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Role</FormLabel>
                      <Select
                        onValueChange={(value: UserRole) => handleRoleChange(value)}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select your role" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {userRoles.map((role) => (
                            <SelectItem key={role} value={role}>
                              {role}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
                  {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save and Continue to Dashboard
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>

       <Dialog open={isPasswordDialogOpen} onOpenChange={handlePasswordDialogClose}>
        <DialogContent className="sm:max-w-md">
            <DialogHeader>
                <DialogTitle>Admin Access Required</DialogTitle>
                <DialogDescription>
                    Please enter the administrator password to select this role.
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
                    <Button variant="outline" type="button" onClick={handlePasswordDialogClose}>Cancel</Button>
                    <Button type="submit">
                        <Lock className="mr-2 h-4 w-4"/>
                        Verify
                    </Button>
                </DialogFooter>
            </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
