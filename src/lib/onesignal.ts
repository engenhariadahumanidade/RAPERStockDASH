export async function sendPushNotification(title: string, message: string, userIds?: string[]): Promise<{ success: boolean; error?: string }> {
    const appId = process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID;
    const restApiKey = process.env.ONESIGNAL_REST_API_KEY;

    if (!appId || !restApiKey) {
        console.warn("OneSignal credentials not configured.");
        return { success: false, error: "Credenciais do OneSignal não configuradas." };
    }

    const payload: any = {
        app_id: appId,
        headings: { en: title, pt: title },
        contents: { en: message, pt: message },
        url: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000/dashboard",
    };

    if (userIds && userIds.length > 0) {
        // Send to specific users via External ID mapped securely through OneSignal.login(userId)
        payload.include_aliases = {
            external_id: userIds
        };
        payload.target_channel = "push";
    } else {
        // Send to everyone (broadcast)
        payload.included_segments = ["Subscribed Users"];
    }

    try {
        const response = await fetch("https://api.onesignal.com/notifications", {
            method: "POST",
            headers: {
                "Content-Type": "application/json; charset=utf-8",
                Authorization: `Basic ${restApiKey}`,
                "Accept": "application/json"
            },
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`OneSignal API Error (${response.status}):`, errorText);
            return { success: false, error: `HTTP ${response.status}: ${errorText}` };
        }

        const data = await response.json();
        if (data.errors && data.errors.length > 0) {
            console.warn("OneSignal API returned logical errors:", data.errors);
            return { success: false, error: data.errors.join(", ") };
        }

        return { success: true };
    } catch (error: any) {
        console.error("Failed to send OneSignal push notification:", error);
        return { success: false, error: error.message || "Erro desconhecido na requisição." };
    }
}
