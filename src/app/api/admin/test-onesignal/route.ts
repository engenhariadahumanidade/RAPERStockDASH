import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import { sendPushNotification } from "@/lib/onesignal";

export async function POST() {
    try {
        const { userId } = await auth();
        if (!userId) return new NextResponse("Unauthorized", { status: 401 });

        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user?.isAdmin) return new NextResponse("Unauthorized", { status: 401 });

        // Envia notificação para todos os inscritos (broadcast de teste)
        const result = await sendPushNotification(
            "🚀 Notificação Push",
            "A API do OneSignal está configurada e rodando 100% no seu servidor!"
        );

        if (!result.success) {
            return NextResponse.json({ success: false, error: result.error });
        }

        return NextResponse.json({ success: true });
    } catch (e: any) {
        return NextResponse.json({ success: false, error: e.message }, { status: 500 });
    }
}
