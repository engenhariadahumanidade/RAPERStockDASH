import axios from 'axios';

export async function sendWebhookMessage(webhookUrl: string, phone: string, msg: string) {
    if (!webhookUrl || !phone) {
        throw new Error('Webhook URL and phone number are required');
    }

    try {
        const response = await axios.post(webhookUrl, {
            phone,
            msg,
        });
        return response.data;
    } catch (error) {
        console.error('Error sending webhook message:', error);
        throw error;
    }
}
