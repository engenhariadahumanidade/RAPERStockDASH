import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";

export async function GET() {
    const { sessionClaims } = await auth();
    const email = (sessionClaims?.email as string) || "";

    // Check if the current user is admin to allow listing
    const isMasterAdmin = email.toLowerCase() === "engenhariadahumanidade@gmail.com" || email === process.env.ADMIN_EMAIL;
    const user = await prisma.user.findUnique({ where: { email } }).catch(() => null);
    if (!user?.isAdmin && !isMasterAdmin) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const allowed = await prisma.allowedUser.findMany({
        orderBy: { createdAt: "desc" }
    });

    const registeredUsers = await prisma.user.findMany({
        orderBy: { createdAt: "desc" }
    });

    return NextResponse.json({ allowed, registeredUsers });
}

export async function POST(req: Request) {
    const { sessionClaims } = await auth();
    const emailAdmin = (sessionClaims?.email as string) || "";

    const isMasterAdmin = emailAdmin.toLowerCase() === "engenhariadahumanidade@gmail.com" || emailAdmin === process.env.ADMIN_EMAIL;
    const user = await prisma.user.findUnique({ where: { email: emailAdmin } }).catch(() => null);
    if (!user?.isAdmin && !isMasterAdmin) {
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

    const isMasterAdmin = emailAdmin.toLowerCase() === "engenhariadahumanidade@gmail.com" || emailAdmin === process.env.ADMIN_EMAIL;
    const user = await prisma.user.findUnique({ where: { email: emailAdmin } }).catch(() => null);
    if (!user?.isAdmin && !isMasterAdmin) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const emailToDelete = searchParams.get("email");

    if (!id && !emailToDelete) {
        return NextResponse.json({ error: "ID or Email required" }, { status: 400 });
    }

    try {
        if (id) {
            await prisma.allowedUser.delete({
                where: { id: parseInt(id) }
            });
        } else if (emailToDelete) {
            await prisma.allowedUser.delete({
                where: { email: emailToDelete }
            });
        }
        return NextResponse.json({ success: true });
    } catch (e) {
        return NextResponse.json({ error: "User not found or operation failed" }, { status: 400 });
    }
}
