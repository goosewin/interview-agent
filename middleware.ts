import { clerkMiddleware } from "@clerk/nextjs/server";

export default clerkMiddleware({
  // // Public routes that don't require authentication
  // publicRoutes: ["/", "/sign-in", "/sign-up", "/api/recording"],
  // // Routes that can be accessed by anyone, but will still have session information
  // ignoredRoutes: ["/api/recording"],
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
}; 
