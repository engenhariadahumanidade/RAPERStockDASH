import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

const isProtectedRoute = createRouteMatcher([
    '/dashboard(.*)',
    '/settings(.*)',
    '/manage(.*)',
    '/admin(.*)',
    '/'
]);

const isPublicRoute = createRouteMatcher([
    '/api/cron',
    '/api/dashboard',
    '/api/webhook(.*)',
    '/api/hello'
]);

export default clerkMiddleware(async (auth, req) => {
    const { userId, sessionClaims } = await auth();

    // 1. Check if the route is protected
    if (isProtectedRoute(req) && !isPublicRoute(req)) {
        // Force login
        if (!userId) {
            return (await auth()).redirectToSignIn();
        }

        // 2. Access Control Check (Allowed Users)
        const email = (sessionClaims?.email as string) || "";

        const allowed = await prisma.allowedUser.findUnique({
            where: { email }
        });

        const dbUser = await prisma.user.findUnique({
            where: { email }
        });

        const isAdmin = dbUser?.isAdmin || email === "engenhariadahumanidade@gmail.com";

        if (!allowed && !isAdmin) {
            return NextResponse.redirect(new URL('/unauthorized', req.url));
        }

        // 3. Admin Route Protection
        if (req.nextUrl.pathname.startsWith('/admin') && !isAdmin) {
            return NextResponse.redirect(new URL('/', req.url));
        }
    }
});

export const config = {
    matcher: [
        // Skip Next.js internals and all static files, unless found in search params
        "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
        // Always run for API routes
        "/(api|trpc)(.*)",
    ],
};
