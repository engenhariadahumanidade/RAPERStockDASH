import { describe, it, expect, vi, beforeEach } from 'vitest';
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

    beforeEach(() => {
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

        it('should NOT send alert if content hash has not changed', async () => {
            // Content matches old hash (MD5 of "SignalNo suggestions")
            // We'll just mock the hash calculation behavior by providing same strings
            const alerts = ['Signal'];
            const suggestions = []; // This maps to "Nenhuma grande oportunidade no momento." in the code

            // Re-calculate hash for the test to match expectation
            // In alert.service.ts: const contentForHash = alertsText + suggestionsText;
            const alertsText = 'Signal';
            const suggestionsText = 'Nenhuma grande oportunidade no momento.';
            const crypto = await import('crypto');
            const hash = crypto.createHash('md5').update(alertsText + suggestionsText).digest('hex');

            const settings = { ...mockSettings, lastAlertHash: hash };

            await processAlerts(alerts, [], settings, [], [], mockUser, 'User', false);

            expect(sendWebhookMessage).not.toHaveBeenCalled();
        });

        it('should send alert if content changed', async () => {
            const settings = { ...mockSettings, lastAlertHash: 'completely-different' };
            await processAlerts(['New Signal'], [], settings, [], [], mockUser, 'User', false);

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
