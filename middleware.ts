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

        // Check if user is in allowed list or is the site owner
        // We'll treat the FIRST user to ever sign in as an Admin if no one else is,
        // or we'll check against our AllowedUser table.

        const allowed = await prisma.allowedUser.findUnique({
            where: { email }
        });

        const dbUser = await prisma.user.findUnique({
            where: { email }
        });

        // If the user is not allowed and not in the DB, and it's not the owner email
        // IMPORTANT: Edit the admin email below or use the AllowedUser table
        const isAdmin = dbUser?.isAdmin || email === process.env.ADMIN_EMAIL;

        if (!allowed && !isAdmin) {
            // Redireciona para uma página de "Sem acesso" ou home se não permitido
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
