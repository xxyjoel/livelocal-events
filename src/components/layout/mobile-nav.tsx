"use client";

import { useState } from "react";
import Link from "next/link";
import { MenuIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetClose,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";

interface MobileNavProps {
  isAuthenticated: boolean;
  isAdmin: boolean;
}

export function MobileNav({ isAuthenticated, isAdmin }: MobileNavProps) {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <Button
        variant="ghost"
        size="icon"
        className="md:hidden"
        onClick={() => setOpen(true)}
        aria-label="Open menu"
      >
        <MenuIcon className="size-5" />
      </Button>
      <SheetContent side="left" className="w-72">
        <SheetHeader>
          <SheetTitle>
            <Link
              href="/"
              onClick={() => setOpen(false)}
              className="text-xl font-bold"
            >
              LiveLocal
            </Link>
          </SheetTitle>
        </SheetHeader>
        <nav className="flex flex-col gap-1 px-4">
          <SheetClose asChild>
            <Link
              href="/"
              className="rounded-md px-3 py-3 text-sm font-medium hover:bg-accent min-h-11"
            >
              Home
            </Link>
          </SheetClose>
          <SheetClose asChild>
            <Link
              href="/"
              className="rounded-md px-3 py-3 text-sm font-medium hover:bg-accent min-h-11"
            >
              Discover
            </Link>
          </SheetClose>
          <SheetClose asChild>
            <Link
              href="/search"
              className="rounded-md px-3 py-3 text-sm font-medium hover:bg-accent min-h-11"
            >
              Search
            </Link>
          </SheetClose>
          <Separator className="my-2" />
          {isAuthenticated ? (
            <>
              <SheetClose asChild>
                <Link
                  href="/profile"
                  className="rounded-md px-3 py-3 text-sm font-medium hover:bg-accent min-h-11"
                >
                  Profile
                </Link>
              </SheetClose>
              <SheetClose asChild>
                <Link
                  href="/profile/tickets"
                  className="rounded-md px-3 py-3 text-sm font-medium hover:bg-accent min-h-11"
                >
                  My Tickets
                </Link>
              </SheetClose>
              {isAdmin && (
                <SheetClose asChild>
                  <Link
                    href="/admin"
                    className="rounded-md px-3 py-3 text-sm font-medium hover:bg-accent min-h-11"
                  >
                    Admin
                  </Link>
                </SheetClose>
              )}
              <Separator className="my-2" />
              <SheetClose asChild>
                <Link
                  href="/api/auth/signout"
                  className="rounded-md px-3 py-3 text-sm font-medium text-destructive hover:bg-accent min-h-11"
                >
                  Sign Out
                </Link>
              </SheetClose>
            </>
          ) : (
            <SheetClose asChild>
              <Link
                href="/api/auth/signin"
                className="rounded-md px-3 py-3 text-sm font-medium hover:bg-accent min-h-11"
              >
                Sign In
              </Link>
            </SheetClose>
          )}
        </nav>
      </SheetContent>
    </Sheet>
  );
}
