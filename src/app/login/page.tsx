"use client";

import { SchoolLogo } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { auth } from "@/lib/firebase";
import { GoogleAuthProvider, signInWithPopup, getAdditionalUserInfo } from "firebase/auth";
import { useRouter } from "next/navigation";
import { useAuthState } from "react-firebase-hooks/auth";
import { Loader2 } from "lucide-react";
import { useEffect } from "react";

export default function LoginPage() {
  const router = useRouter();
  const [user, loading] = useAuthState(auth);

  useEffect(() => {
    if (user) {
      // If user object has no display name, it's likely a new user.
      // This is a proxy for isNewUser, which is only available on initial sign-in.
      if (!user.displayName) {
        router.push("/profile");
      } else {
        router.push("/dashboard");
      }
    }
  }, [user, router]);


  const handleSignIn = async () => {
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const additionalUserInfo = getAdditionalUserInfo(result);
      // Explicitly check for new user on sign-in and redirect
      if (additionalUserInfo?.isNewUser) {
        router.push("/profile");
      } else {
        router.push("/dashboard");
      }
    } catch (error) {
      console.error("Error signing in with Google", error);
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
        <Button onClick={handleSignIn} className="w-full bg-accent hover:bg-accent/90">
          Sign in with Google
        </Button>
        <p className="mt-6 text-center text-xs text-muted-foreground">
          &copy; {new Date().getFullYear()} S.B Public School. All rights reserved.
        </p>
      </div>
    </div>
  );
}
