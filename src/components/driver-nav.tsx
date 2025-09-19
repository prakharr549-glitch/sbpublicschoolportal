"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Map,
  List,
  Bell,
  LayoutDashboard
} from "lucide-react";

import { cn } from "@/lib/utils";
import { SchoolLogo } from "@/components/icons";

const navItems = [
  { href: "/driver-dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/driver/route", label: "My Route", icon: Map },
  { href: "/driver/student-list", label: "Student List", icon: List },
  { href: "/driver/notifications", label: "Notifications", icon: Bell },
];

export function DriverNav({ className }: React.HTMLAttributes<HTMLElement>) {
  const pathname = usePathname();

  return (
    <nav className={cn("flex flex-col gap-4", className)}>
      <Link href="/driver-dashboard" className="flex items-center gap-2 px-4 text-lg font-bold text-primary">
        <SchoolLogo className="h-8 w-8" />
        <span className="font-headline">Driver Portal</span>
      </Link>
      <div className="flex flex-col gap-1 px-4">
        {navItems.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-foreground/80 transition-all hover:text-primary hover:bg-primary/10",
              (pathname === href) ? "bg-primary/10 text-primary font-medium" : ""
            )}
          >
            <Icon className="h-4 w-4" />
            {label}
          </Link>
        ))}
      </div>
    </nav>
  );
}
