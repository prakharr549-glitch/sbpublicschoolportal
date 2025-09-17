
"use client";

import { SchoolLogo } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { auth } from "@/lib/firebase";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { useRouter } from "next/navigation";
import { useAuthState } from "react-firebase-hooks/auth";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";

export default function LoginPage() {
  const router = useRouter();
  const [user, loading] = useAuthState(auth);
  const [isSigningIn, setIsSigningIn] = useState(false);

  useEffect(() => {
    if (!loading && user) {
      router.push("/profile");
    }
  }, [user, loading, router]);

  const handleSignIn = async () => {
    setIsSigningIn(true);
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      // The useEffect will handle the redirect once the user state is updated.
    } catch (error) {
      console.error("Error signing in with Google", error);
      setIsSigningIn(false); // Reset on error
    }
  };

  if (loading || user) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm rounded-lg border bg-card p-8 shadow-sm">
        <div className="mb-8 flex flex-col items-center justify-center gap-4">
          <SchoolLogo className="h-12 w-12 text-primary" />
          <h1 className="text-2xl font-bold text-center font-headline">
            SB Public Portal
          </h1>
          <p className="text-center text-muted-foreground">
            Sign in to access the school's information portal.
          </p>
        </div>
        <Button onClick={handleSignIn} className="w-full bg-accent hover:bg-accent/90" disabled={isSigningIn}>
           {isSigningIn && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Sign in with Google
        </Button>
        <p className="mt-6 text-center text-xs text-muted-foreground">
          &copy; {new Date().getFullYear()} S.B Public School. All rights reserved.
        </p>
      </div>
    </div>
  );
}
