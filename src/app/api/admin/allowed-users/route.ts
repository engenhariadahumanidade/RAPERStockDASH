import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";

export async function GET() {
    const { sessionClaims } = await auth();
    const email = (sessionClaims?.email as string) || "";

    // Check if the current user is admin to allow listing
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user?.isAdmin && email !== process.env.ADMIN_EMAIL) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const allowed = await prisma.allowedUser.findMany({
        orderBy: { createdAt: "desc" }
    });
    return NextResponse.json(allowed);
}

export async function POST(req: Request) {
    const { sessionClaims } = await auth();
    const emailAdmin = (sessionClaims?.email as string) || "";

    const user = await prisma.user.findUnique({ where: { email: emailAdmin } });
    if (!user?.isAdmin && emailAdmin !== process.env.ADMIN_EMAIL) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { email } = await req.json();
    if (!email) return NextResponse.json({ error: "Email required" }, { status: 400 });

    try {
        const newUser = await prisma.allowedUser.create({
            data: { email: email.toLowerCase() }
        });
        return NextResponse.json(newUser);
    } catch (e) {
        return NextResponse.json({ error: "Email already exists" }, { status: 400 });
    }
}

export async function DELETE(req: Request) {
    const { sessionClaims } = await auth();
    const emailAdmin = (sessionClaims?.email as string) || "";

    const user = await prisma.user.findUnique({ where: { email: emailAdmin } });
    if (!user?.isAdmin && emailAdmin !== process.env.ADMIN_EMAIL) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

    await prisma.allowedUser.delete({
        where: { id: parseInt(id) }
    });

    return NextResponse.json({ success: true });
}
