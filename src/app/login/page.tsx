
"use client";

import { SchoolLogo } from "@/components/icons";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function LoginPage() {
  const router = useRouter();

  useEffect(() => {
    router.push("/dashboard");
  }, [router]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm rounded-lg border bg-card p-8 shadow-sm">
        <div className="mb-8 flex flex-col items-center justify-center gap-4">
          <SchoolLogo className="h-12 w-12 text-primary" />
          <h1 className="text-2xl font-bold text-center font-headline">
            SB Public Portal
          </h1>
          <p className="text-center text-muted-foreground">
            Redirecting to the portal...
          </p>
        </div>
        <div className="flex justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
        <p className="mt-6 text-center text-xs text-muted-foreground">
          &copy; {new Date().getFullYear()} S.B Public School. All rights reserved.
        </p>
      </div>
    </div>
  );
}
