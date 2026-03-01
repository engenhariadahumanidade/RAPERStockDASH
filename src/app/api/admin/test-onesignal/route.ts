import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import { sendPushNotification } from "@/lib/onesignal";

export async function GET() {
    try {
        const { userId } = await auth();
        if (!userId) return NextResponse.json({ error: "Sessão não encontrada (Clerk userId vazio)" }, { status: 401 });

        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user) return NextResponse.json({ error: `Usuário ${userId} não encontrado no banco` }, { status: 401 });
        if (!user.isAdmin) return NextResponse.json({ error: `Usuário ${userId} não é admin` }, { status: 403 });

        return NextResponse.json({
            appIdConfigured: !!process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID,
            restApiKeyConfigured: !!process.env.ONESIGNAL_REST_API_KEY,
            appIdPreview: process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID
                ? `${process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID.substring(0, 8)}...`
                : null,
            restApiKeyPreview: process.env.ONESIGNAL_REST_API_KEY
                ? `${process.env.ONESIGNAL_REST_API_KEY.substring(0, 12)}...`
                : null,
        });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

export async function POST() {
    try {
        const { userId } = await auth();
        if (!userId) return NextResponse.json({ success: false, error: "Sessão não encontrada (Clerk userId vazio)" }, { status: 401 });

        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user) return NextResponse.json({ success: false, error: `Usuário ${userId} não encontrado no banco` }, { status: 401 });
        if (!user.isAdmin) return NextResponse.json({ success: false, error: `Usuário ${userId} não é admin` }, { status: 403 });

        const result = await sendPushNotification(
            "🚀 Notificação Push",
            "A API do OneSignal está configurada e rodando 100% no seu servidor!"
        );

        return NextResponse.json({
            success: result.success,
            error: result.error || null,
            notificationId: result.data?.id || null,
            recipients: result.data?.recipients ?? null,
            rawResponse: result.data || null,
        });
    } catch (e: any) {
        return NextResponse.json({ success: false, error: e.message }, { status: 500 });
    }
}
