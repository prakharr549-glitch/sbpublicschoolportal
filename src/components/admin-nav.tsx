
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Users,
  Settings,
  ShoppingBag,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { SchoolLogo } from "@/components/icons";

const navItems = [
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/orders", label: "Orders", icon: ShoppingBag },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

export function AdminNav({ className }: React.HTMLAttributes<HTMLElement>) {
  const pathname = usePathname();

  return (
    <nav className={cn("flex flex-col gap-4", className)}>
      <Link href="/admin" className="flex items-center gap-2 px-4 text-lg font-bold text-primary">
        <SchoolLogo className="h-8 w-8" />
        <span className="font-headline">Admin Portal</span>
      </Link>
      <div className="flex flex-col gap-1 px-4">
        {navItems.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-foreground/80 transition-all hover:text-primary hover:bg-primary/10",
              (pathname.startsWith(href)) ? "bg-primary/10 text-primary font-medium" : ""
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
