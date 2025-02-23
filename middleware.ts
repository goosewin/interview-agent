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
]);

export default clerkMiddleware(
  async (auth, req) => {
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
