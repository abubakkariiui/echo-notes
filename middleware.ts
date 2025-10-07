import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

const isProtectedRoute = createRouteMatcher([
  '/notes(.*)',
  '/api/process(.*)',
]);

export default clerkMiddleware((auth, request) => {
  if (isProtectedRoute(request)) {
    return auth.protect();
  }
});

export const config = {
  matcher: [
    '/((?!.+\\.[\\w]+$|_next).*)',
    '/',
    '/(api|trpc)(.*)',
  ],
};
