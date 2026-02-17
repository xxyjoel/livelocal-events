"use client";

import { useState } from "react";
import Link from "next/link";
import {
  MenuIcon,
  LayoutDashboardIcon,
  CalendarIcon,
  MapPinIcon,
  InboxIcon,
  RefreshCwIcon,
  GlobeIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetClose,
} from "@/components/ui/sheet";

const adminLinks = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboardIcon },
  { href: "/admin/events", label: "Events", icon: CalendarIcon },
  { href: "/admin/venues", label: "Venues", icon: MapPinIcon },
  { href: "/admin/submissions", label: "Submissions", icon: InboxIcon },
  { href: "/admin/sources", label: "Sources", icon: RefreshCwIcon },
  { href: "/admin/facebook-pages", label: "Facebook Pages", icon: GlobeIcon },
];

export function AdminMobileNav() {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <Button
        variant="ghost"
        size="icon"
        className="min-h-11 min-w-11"
        onClick={() => setOpen(true)}
        aria-label="Open admin menu"
      >
        <MenuIcon className="size-5" />
      </Button>
      <SheetContent side="right" className="w-72">
        <SheetHeader>
          <SheetTitle>Admin Navigation</SheetTitle>
        </SheetHeader>
        <nav className="flex flex-col gap-1 px-4">
          {adminLinks.map((link) => (
            <SheetClose asChild key={link.href}>
              <Link
                href={link.href}
                className="flex items-center gap-3 rounded-md px-3 py-3 text-sm font-medium hover:bg-accent min-h-11"
              >
                <link.icon className="size-4" />
                {link.label}
              </Link>
            </SheetClose>
          ))}
        </nav>
      </SheetContent>
    </Sheet>
  );
}
