import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t bg-background">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          {/* Logo + tagline */}
          <div className="space-y-3">
            <Link href="/" className="text-xl font-bold">
              LiveLocal
            </Link>
            <p className="text-sm text-muted-foreground">
              Discover local events and live music
            </p>
          </div>

          {/* Links */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold">Links</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link href="/about" className="hover:text-foreground">
                  About
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-foreground">
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          {/* For Artists / Promoters */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold">Get Involved</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link href="/submit" className="hover:text-foreground">
                  For Artists
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-foreground">
                  For Promoters
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 border-t pt-8 text-center text-sm text-muted-foreground">
          &copy; {new Date().getFullYear()} LiveLocal. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
