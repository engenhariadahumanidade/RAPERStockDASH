import { NextResponse } from 'next/server';
import prisma from "@/lib/prisma";
import { auth, currentUser } from "@clerk/nextjs/server";

export async function GET() {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ isAllowed: false, isAdmin: false }, { status: 401 });
        }

        const clerkUser = await currentUser();
        const email = clerkUser?.emailAddresses[0]?.emailAddress || "";

        if (!email) {
            return NextResponse.json({ isAllowed: false, isAdmin: false }, { status: 403 });
        }

        // Hardcode master admin email or check DB
        const isMasterAdmin = email.toLowerCase() === "engenhariadahumanidade@gmail.com" || email === process.env.ADMIN_EMAIL;
        let isAdmin = isMasterAdmin;
        let isAllowed = isMasterAdmin;

        try {
            const dbUser = await prisma.user.upsert({
                where: { id: userId },
                update: { email },
                create: { id: userId, email }
            });
            if (dbUser.isAdmin) isAdmin = true;
            isAllowed = isAdmin;

            if (!isAllowed) {
                const allowedRecord = await prisma.allowedUser.findUnique({
                    where: { email: email.toLowerCase() }
                });
                isAllowed = !!allowedRecord;
            }
        } catch (dbError) {
            console.error("Database error in /api/auth/me:", dbError);
            // Fallback: master admin is always allowed even if DB is down.
            // Other users will be blocked.
        }

        return NextResponse.json({
            isAllowed,
            isAdmin,
            email
        });
    } catch (e) {
        console.error("Auth me error:", e);
        return NextResponse.json({ isAllowed: false, isAdmin: false }, { status: 500 });
    }
}
