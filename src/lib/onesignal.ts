export async function sendPushNotification(title: string, message: string, userIds?: string[]): Promise<{ success: boolean; error?: string; data?: any }> {
    const appId = process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID;
    const restApiKey = process.env.ONESIGNAL_REST_API_KEY;

    console.log("[OneSignal] Attempting to send push notification...");
    console.log("[OneSignal] App ID configured:", !!appId);
    console.log("[OneSignal] REST API Key configured:", !!restApiKey);
    console.log("[OneSignal] Target userIds:", userIds || "broadcast");

    if (!appId || !restApiKey) {
        console.error("[OneSignal] MISSING CREDENTIALS - appId:", !!appId, "restApiKey:", !!restApiKey);
        return { success: false, error: "Credenciais do OneSignal não configuradas." };
    }

    const payload: any = {
        app_id: appId,
        headings: { en: title, pt: title },
        contents: { en: message, pt: message },
        url: process.env.NEXT_PUBLIC_APP_URL || "https://raperstockdash.vercel.app/dashboard",
    };

    if (userIds && userIds.length > 0) {
        payload.include_aliases = {
            external_id: userIds
        };
        payload.target_channel = "push";
    } else {
        payload.included_segments = ["Subscribed Users"];
    }

    console.log("[OneSignal] Payload:", JSON.stringify(payload, null, 2));

    try {
        const response = await fetch("https://api.onesignal.com/notifications", {
            method: "POST",
            headers: {
                "Content-Type": "application/json; charset=utf-8",
                "Authorization": `Key ${restApiKey}`,
                "Accept": "application/json"
            },
            body: JSON.stringify(payload),
        });

        const responseText = await response.text();
        console.log(`[OneSignal] Response Status: ${response.status}`);
        console.log("[OneSignal] Response Body:", responseText);

        if (!response.ok) {
            return { success: false, error: `HTTP ${response.status}: ${responseText}` };
        }

        let data;
        try {
            data = JSON.parse(responseText);
        } catch {
            return { success: false, error: `Invalid JSON response: ${responseText}` };
        }

        if (data.errors && data.errors.length > 0) {
            console.warn("[OneSignal] API returned errors:", data.errors);
            return { success: false, error: data.errors.join(", "), data };
        }

        console.log(`[OneSignal] SUCCESS - Notification ID: ${data.id}, Recipients: ${data.recipients}`);
        return { success: true, data };
    } catch (error: any) {
        console.error("[OneSignal] Request failed:", error);
        return { success: false, error: error.message || "Erro desconhecido na requisição." };
    }
}
