import Link from "next/link";
import {
  LayoutDashboardIcon,
  CalendarIcon,
  MapPinIcon,
  InboxIcon,
  RefreshCwIcon,
  GlobeIcon,
  ChevronLeftIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { AdminMobileNav } from "@/components/admin/admin-mobile-nav";

const sidebarLinks = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboardIcon },
  { href: "/admin/events", label: "Events", icon: CalendarIcon },
  { href: "/admin/venues", label: "Venues", icon: MapPinIcon },
  { href: "/admin/submissions", label: "Submissions", icon: InboxIcon },
  { href: "/admin/sources", label: "Sources", icon: RefreshCwIcon },
  { href: "/admin/facebook-pages", label: "Facebook Pages", icon: GlobeIcon },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="hidden w-64 shrink-0 border-r bg-sidebar md:block">
        <div className="flex h-16 items-center gap-2 px-6">
          <Button asChild variant="ghost" size="icon-sm">
            <Link href="/">
              <ChevronLeftIcon className="size-4" />
            </Link>
          </Button>
          <Link href="/admin" className="text-lg font-bold">
            Admin
          </Link>
        </div>
        <Separator />
        <nav className="flex flex-col gap-1 p-4">
          {sidebarLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            >
              <link.icon className="size-4" />
              {link.label}
            </Link>
          ))}
        </nav>
      </aside>

      {/* Mobile header */}
      <div className="flex flex-1 flex-col">
        <header className="flex h-16 items-center gap-4 border-b px-4 md:hidden">
          <Button asChild variant="ghost" size="icon-sm">
            <Link href="/">
              <ChevronLeftIcon className="size-4" />
            </Link>
          </Button>
          <Link href="/admin" className="text-lg font-bold">
            Admin
          </Link>
          <div className="flex-1" />
          <AdminMobileNav />
        </header>

        {/* Main content */}
        <main className="flex-1 p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}
