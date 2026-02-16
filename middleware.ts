import { auth } from "@/lib/auth";

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const isAdminRoute = req.nextUrl.pathname.startsWith("/admin");
  const isAuthRoute = req.nextUrl.pathname.startsWith("/sign-in") || req.nextUrl.pathname.startsWith("/sign-up");
  const isProtectedRoute = req.nextUrl.pathname.startsWith("/profile") || req.nextUrl.pathname.startsWith("/checkout");

  // Redirect logged-in users away from auth pages
  if (isAuthRoute && isLoggedIn) {
    return Response.redirect(new URL("/", req.nextUrl));
  }

  // Protect user routes
  if (isProtectedRoute && !isLoggedIn) {
    return Response.redirect(new URL("/sign-in", req.nextUrl));
  }

  // Protect admin routes
  if (isAdminRoute && !isLoggedIn) {
    return Response.redirect(new URL("/sign-in", req.nextUrl));
  }

  // Admin role check would happen at the page level since we need DB access
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|images).*)"],
};
