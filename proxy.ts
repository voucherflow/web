import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isProtectedRoute = createRouteMatcher([
  "/compare(.*)",
  "/dashboard(.*)",
  "/new-deal(.*)",
  "/deals(.*)",
  "/assistant(.*)",
  "/zip-insights(.*)",
  "/inspection(.*)",
  "/inspection-reports(.*)",
]);

export default clerkMiddleware(async (auth, req) => {
  if (!isProtectedRoute(req)) return;

  const { userId, redirectToSignIn } = await auth();

  if (!userId) {
    return redirectToSignIn({ returnBackUrl: req.url });
  }
});

export const config = {
  matcher: ["/((?!_next|.*\\..*).*)"],
};
