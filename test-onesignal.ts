import { config } from 'dotenv';
import path from 'path';
import fetch from 'node-fetch';

// Load .env variables
config({ path: path.resolve(__dirname, '.env') });

const appId = process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID;
const restApiKey = process.env.ONESIGNAL_REST_API_KEY;

console.log("App ID:", appId ? "Configurado ✅" : "Ausente ❌");
console.log("REST API Key:", restApiKey ? "Configurada ✅" : "Ausente ❌");

if (!appId || !restApiKey) {
    console.error("Faltam variáveis de ambiente para o teste.");
    process.exit(1);
}

async function testPush() {
    console.log("Iniciando envio de notificação push de teste...");

    const payload = {
        app_id: appId,
        included_segments: ["Total Subscriptions"], // "Subscribed Users" often changes depending on account type, "Total Subscriptions" is safer for a generic broadcast test
        headings: { en: "🧪 Teste Sistema Antigravity", pt: "🧪 Teste RAPERStockDASH" },
        contents: { en: "A integração do OneSignal está funcionando perfeitamente!", pt: "A integração do OneSignal está funcionando perfeitamente! 🚀" },
        url: "http://localhost:3000/dashboard"
    };

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

        const data = await response.json();

        if (!response.ok) {
            console.error("❌ Falha no envio:", data);
        } else {
            console.log("✅ Sucesso! Resposta do OneSignal:", data);
        }
    } catch (error) {
        console.error("❌ Erro ao enviar a requisição:", error);
    }
}

testPush();
