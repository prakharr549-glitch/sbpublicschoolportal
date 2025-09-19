
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
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SchoolLogo } from "@/components/icons";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { auth, db } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  updateProfile,
  sendEmailVerification
} from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import Link from "next/link";
import { Separator } from "@/components/ui/separator";

const signUpSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters."),
  email: z.string().email(),
  password: z.string().min(6, "Password must be at least 6 characters."),
  accessCode: z.string().refine(code => code === '000555', {
    message: "Invalid access code. Please contact the school admin.",
  }),
});

const signInSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1, "Password is required."),
});

type SignUpFormValues = z.infer<typeof signUpSchema>;
type SignInFormValues = z.infer<typeof signInSchema>;

export default function LoginPage() {
  const { toast } = useToast();
  const router = useRouter();

  const signUpForm = useForm<SignUpFormValues>({
    resolver: zodResolver(signUpSchema),
    defaultValues: { name: "", email: "", password: "", accessCode: "" },
  });

  const signInForm = useForm<SignInFormValues>({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: "", password: "" },
  });

  const handleSignUp = async (data: SignUpFormValues) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        data.email,
        data.password
      );
      const user = userCredential.user;
      
      await updateProfile(user, { displayName: data.name });
      
      await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        name: data.name,
        email: user.email,
      });

      await sendEmailVerification(user);

      toast({
        title: "Account Created",
        description: "A verification email has been sent. Please check your inbox.",
      });

      router.push("/profile");
    } catch (error: any) {
      console.error("Sign up error:", error);
      toast({
        variant: "destructive",
        title: "Sign Up Failed",
        description: error.message || "An unexpected error occurred.",
      });
    }
  };

  const handleSignIn = async (data: SignInFormValues) => {
    try {
      await signInWithEmailAndPassword(auth, data.email, data.password);
      toast({
        title: "Signed In",
        description: "Welcome back!",
      });
      router.push("/dashboard");
    } catch (error: any) {
      console.error("Sign in error:", error);
      const errorCode = error.code;
      let errorMessage = error.message;

      if (errorCode === 'auth/popup-closed-by-user') {
        return;
      }
      
      if (errorCode === 'auth/wrong-password' || errorCode === 'auth/user-not-found' || errorCode === 'auth/invalid-credential') {
        errorMessage = "Invalid email or password. Please try again.";
      }

      toast({
        variant: "destructive",
        title: "Sign In Failed",
        description: errorMessage,
      });
    }
  };

  const isSignUpSubmitting = signUpForm.formState.isSubmitting;
  const isSignInSubmitting = signInForm.formState.isSubmitting;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <div className="mb-8 flex flex-col items-center justify-center gap-4">
          <SchoolLogo className="h-12 w-12 text-primary" />
          <h1 className="text-2xl font-bold text-center font-headline">
            SB Public Portal
          </h1>
        </div>

        <Tabs defaultValue="signin" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="signin">Sign In</TabsTrigger>
            <TabsTrigger value="signup">Sign Up</TabsTrigger>
          </TabsList>
          <TabsContent value="signin">
            <Card>
              <CardHeader>
                <CardTitle>Welcome Back</CardTitle>
                <CardDescription>
                  Enter your credentials to access your account.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...signInForm}>
                  <form onSubmit={signInForm.handleSubmit(handleSignIn)} className="space-y-6">
                    <FormField
                      control={signInForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input placeholder="you@example.com" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={signInForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Password</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="••••••••" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button type="submit" className="w-full" disabled={isSignInSubmitting}>
                      {isSignInSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Sign In
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="signup">
            <Card>
              <CardHeader>
                <CardTitle>Create an Account</CardTitle>
                <CardDescription>
                  Enter the school access code to register.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...signUpForm}>
                  <form onSubmit={signUpForm.handleSubmit(handleSignUp)} className="space-y-6">
                    <FormField
                      control={signUpForm.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Full Name</FormLabel>
                          <FormControl>
                            <Input placeholder="John Doe" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={signUpForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input placeholder="you@example.com" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={signUpForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Password</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="••••••••" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                     <FormField
                      control={signUpForm.control}
                      name="accessCode"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>School Access Code</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="Enter code" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button type="submit" className="w-full" disabled={isSignUpSubmitting}>
                      {isSignUpSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Sign Up
                    </Button>
                  </form>
                </Form>
              </CardContent>
              <CardFooter className="flex-col items-center text-sm text-muted-foreground pt-4 gap-4">
                  <div className="flex items-center w-full">
                    <Separator className="flex-1" />
                    <p className="px-2">OR</p>
                    <Separator className="flex-1" />
                  </div>
                  <p>If you don't have an access code, apply for one:</p>
                  <Button variant="outline" className="w-full" asChild>
                     <Link href="/admission-form">
                        Submit Admission Form
                    </Link>
                  </Button>
                </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
        <p className="mt-6 text-center text-xs text-muted-foreground">
          &copy; {new Date().getFullYear()} S.B Public School. All rights reserved.
        </p>
      </div>
    </div>
  );
}
