import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { processAlerts } from '../alert.service';
import prisma from '@/lib/prisma';
import { sendWebhookMessage } from '@/lib/webhook';

// Mock dependencies with explicit factories
vi.mock('@/lib/prisma', () => ({
    default: {
        systemLog: {
            create: vi.fn().mockResolvedValue({ id: 1 }),
        },
        settings: {
            update: vi.fn().mockResolvedValue({ id: 1 }),
        },
    },
}));

vi.mock('@/lib/webhook', () => ({
    sendWebhookMessage: vi.fn().mockResolvedValue({ success: true }),
}));

vi.mock('@/lib/onesignal', () => ({
    sendPushNotification: vi.fn().mockResolvedValue(true),
}));

describe('AlertService', () => {
    const mockUser = 'test-user';
    const mockSettings = {
        id: 1,
        webhookUrl: 'http://webhook.com',
        phoneNumber: '123456',
        autoAlerts: true,
        lastAlertHash: 'old-hash',
        lastAlertTime: new Date('2026-01-01T12:00:00Z'),
        workStart: '00:00',
        workEnd: '23:59',
    };

    afterEach(() => {
        vi.useRealTimers();
    });

    beforeEach(() => {
        vi.useFakeTimers();
        // 10:05 BRT (13:05 UTC) -> dentro de inWorkingHours (10-19) e isHoraCheia (<= 15 mins)
        vi.setSystemTime(new Date('2026-03-01T13:05:00Z'));
        vi.clearAllMocks();
    });

    describe('processAlerts', () => {
        it('should NOT send alert if autoAlerts is disabled and not a test', async () => {
            const settings = { ...mockSettings, autoAlerts: false };
            await processAlerts(['Signal'], [], settings, [], [], mockUser, 'User', false);

            expect(sendWebhookMessage).not.toHaveBeenCalled();
        });

        it('should send alert if isTest is true, even if autoAlerts is disabled', async () => {
            const settings = { ...mockSettings, autoAlerts: false };
            await processAlerts(['Signal'], [], settings, [], [], mockUser, 'User', true);

            expect(sendWebhookMessage).toHaveBeenCalled();
            expect(prisma.systemLog.create).toHaveBeenCalledWith(expect.objectContaining({
                data: expect.objectContaining({
                    message: expect.stringContaining('Disparo de teste manual enviado com sucesso')
                })
            }));
        });

        it('should NOT send alert if it is not hora cheia (e.g. minute 30)', async () => {
            const alerts = ['Signal'];
            const settings = { ...mockSettings, lastAlertTime: new Date('2026-03-01T11:00:00Z') };

            vi.setSystemTime(new Date('2026-03-01T13:30:00Z')); // 10:30 BRT, NEW HOUR but NOT HORA CHEIA

            await processAlerts(alerts, [], settings, [], [], mockUser, 'User', false);

            expect(sendWebhookMessage).not.toHaveBeenCalled();
        });

        it('should send alert if new hour and hora cheia', async () => {
            const settings = { ...mockSettings, lastAlertTime: new Date('2026-03-01T11:00:00Z') }; // 08:00 BRT
            await processAlerts(['New Signal'], [], settings, [], [], mockUser, 'User', false);

            // Time is 10:05 BRT, last alert was 08:00 BRT -> New Hour!
            expect(sendWebhookMessage).toHaveBeenCalled();
        });

        it('should format message correctly with template tags', async () => {
            const settings = {
                ...mockSettings,
                customMessage: "Alerts: {{alerts}} | Suggestions: {{suggestions}} | Panorama: {{panorama}}"
            };

            await processAlerts(['S1'], [{ symbol: 'S2', reason: 'R', price: 10, changePercent: 0, rsi: 50, sma50: 10, sma200: 10, action: 'Hold', dy: 5, logo: '' }], settings, [], [], mockUser, 'User', true);

            const [url, phone, msg] = (sendWebhookMessage as any).mock.calls[0];
            expect(msg).toContain('Alerts: S1');
            expect(msg).toContain('Suggestions: • [S2] - Motivo: R');
        });
    });
});
