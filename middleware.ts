import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

const isProtectedRoute = createRouteMatcher([
  '/dashboard(.*)',
  '/candidates(.*)',
  '/problems(.*)',
  '/interviews(.*)',
  '/api/candidates(.*)',
  '/api/chat(.*)',
  '/api/cron(.*)',
  '/api/get-signed-url(.*)',
  '/api/interviews(.*)',
  '/api/messages(.*)',
  '/api/problems(.*)',
  '/api/recording(.*)',
  // Exclude /api/tools/* from protection
  '!/api/tools/(.*)',
]);

export default clerkMiddleware(
  async (auth, req) => {
    // Skip auth for /api/tools routes
    if (req.nextUrl.pathname.startsWith('/api/tools/')) return;

    if (isProtectedRoute(req)) await auth.protect();
  },
  {
    afterSignUpUrl: '/dashboard',
    afterSignInUrl: '/dashboard',
  }
);

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    // '/(api|trpc)(.*)',
  ],
};
