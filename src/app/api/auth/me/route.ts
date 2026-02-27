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

        // Ensure user exists in Prisma
        const dbUser = await prisma.user.upsert({
            where: { id: userId },
            update: { email },
            create: { id: userId, email }
        });

        // Hardcode master admin email or check DB
        const isMasterAdmin = email.toLowerCase() === "engenhariadahumanidade@gmail.com" || email === process.env.ADMIN_EMAIL;
        const isAdmin = dbUser.isAdmin || isMasterAdmin;

        // Check if user is allowed
        let isAllowed = isAdmin;
        if (!isAllowed) {
            const allowedRecord = await prisma.allowedUser.findUnique({
                where: { email: email.toLowerCase() }
            });
            isAllowed = !!allowedRecord;
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
