
"use client";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth, db } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { Header } from "@/components/header";
import { MainNav } from "@/components/main-nav";
import { doc, getDoc } from "firebase/firestore";

export default function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, loading] = useAuthState(auth);
  const router = useRouter();
  const [userRole, setUserRole] = useState<string | null>(null);
  const [isRoleLoading, setIsRoleLoading] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
      return;
    }
    if (user) {
      const userDocRef = doc(db, "users", user.uid);
      getDoc(userDocRef).then((docSnap) => {
        if (docSnap.exists()) {
          setUserRole(docSnap.data().role);
        }
        setIsRoleLoading(false);
      });
    }
  }, [user, loading, router]);

  if (loading || isRoleLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="grid min-h-screen w-full md:grid-cols-[280px_1fr]">
      <div className="hidden border-r bg-card md:block">
        <div className="flex h-full max-h-screen flex-col gap-2 py-4">
          <MainNav userRole={userRole} />
        </div>
      </div>
      <div className="flex flex-col">
        <Header userRole={userRole} />
        <main className="flex flex-1 flex-col gap-4 p-4 md:p-8 lg:gap-6">
          {children}
        </main>
      </div>
    </div>
  );
}
