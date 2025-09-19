
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
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
import { Loader2 } from "lucide-react";
import { updateProfile } from "firebase/auth";
import { useRouter } from "next/navigation";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { useAuthState } from "react-firebase-hooks/auth";
import { SchoolLogo } from "@/components/icons";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

const userRoles = ["Student", "Teacher", "Admin", "Driver"] as const;

const profileFormSchema = z.object({
  name: z.string().min(2, {
    message: "Name must be at least 2 characters.",
  }),
  email: z.string().email(),
  photoURL: z.string().url({ message: "Please enter a valid URL." }).optional().or(z.literal('')),
  role: z.enum(userRoles, {
    required_error: "Please select a role.",
  }),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

const avatarOptions = Array.from({ length: 10 }, (_, i) => `https://picsum.photos/seed/avatar${i + 1}/200`);

export default function ProfilePage() {
  const { toast } = useToast();
  const [user, loading] = useAuthState(auth);
  const router = useRouter();
  const [isProfileLoading, setIsProfileLoading] = useState(true);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      name: "",
      email: "",
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
          photoURL: data.photoURL || user.photoURL || "",
          role: data.role || "Student",
        });
      } else {
        form.reset({
          name: user.displayName || "",
          email: user.email || "",
          photoURL: user.photoURL || "",
          role: "Student",
        });
      }
      setIsProfileLoading(false);
    }

    fetchProfile();
  }, [user, loading, form, router]);

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
                <div className="flex items-center justify-center">
                    <Avatar className="h-24 w-24">
                        <AvatarImage src={photoURL || undefined} alt={form.getValues("name")} />
                        <AvatarFallback>{form.getValues("name")?.charAt(0) || 'U'}</AvatarFallback>
                    </Avatar>
                </div>

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
                  name="photoURL"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Profile Picture</FormLabel>
                      <FormControl>
                        <div className="grid grid-cols-5 gap-2">
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
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
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
    </div>
  );
}
