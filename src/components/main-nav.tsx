
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ShoppingCart,
  Info,
  BookOpen,
  Megaphone,
  LayoutDashboard,
  Radio,
  Award,
  History,
  Users,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { SchoolLogo } from "@/components/icons";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/announcements", label: "Announcements", icon: Megaphone },
  { href: "/shop", label: "Shop", icon: ShoppingCart },
  { href: "/about", label: "About Us", icon: Info },
  { href: "/homework", label: "Homework", icon: BookOpen },
  { href: "/livestream", label: "Live Stream", icon: Radio },
  { href: "/results", label: "Results", icon: Award },
  { href: "/my-orders", label: "My Orders", icon: History },
  { href: "/users", label: "Users", icon: Users },
];

const studentNavItems = [
    { href: "/students", label: "Students", icon: Users },
]

export function MainNav({ className, userRole }: React.HTMLAttributes<HTMLElement> & { userRole: string | null }) {
  const pathname = usePathname();

  return (
    <nav className={cn("flex flex-col gap-4", className)}>
      <Link href="/dashboard" className="flex items-center gap-2 px-4 text-lg font-bold text-primary">
        <SchoolLogo className="h-8 w-8" />
        <span className="font-headline">SB Public Portal</span>
      </Link>
      <div className="flex-1 overflow-y-auto">
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
          {userRole === 'Student' && studentNavItems.map(({ href, label, icon: Icon }) => (
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
      </div>
    </nav>
  );
}
