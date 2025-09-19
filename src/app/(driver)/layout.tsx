
"use client";
import { Header } from "@/components/header";
import { DriverNav } from "@/components/driver-nav";

export default function DriverLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="grid min-h-screen w-full md:grid-cols-[280px_1fr]">
      <div className="hidden border-r bg-card md:block">
        <div className="flex h-full max-h-screen flex-col gap-2 py-4">
          <DriverNav />
        </div>
      </div>
      <div className="flex flex-col">
        <Header />
        <main className="flex flex-1 flex-col gap-4 p-4 md:p-8 lg:gap-6">
          {children}
        </main>
      </div>
    </div>
  );
}
