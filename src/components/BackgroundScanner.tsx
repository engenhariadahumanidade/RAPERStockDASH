'use client';

import { useEffect, useRef } from 'react';

const DEFAULT_INTERVAL_MS = 15 * 60 * 1000; // 15 minutes fallback
const INITIAL_DELAY_MS = 10_000; // 10 seconds after page load

export default function BackgroundScanner() {
    const intervalRef = useRef<NodeJS.Timeout | null>(null);
    const isRunningRef = useRef(false);

    useEffect(() => {
        async function triggerScan() {
            if (isRunningRef.current) return;
            isRunningRef.current = true;

            try {
                const res = await fetch('/api/scan');
                if (!res.ok) {
                    console.log('[BackgroundScanner] Scan retornou status:', res.status);
                    return;
                }

                const data = await res.json();

                if (data.triggered) {
                    console.log(`[BackgroundScanner] ✅ Varredura executada — ${data.stats.messagesSentTotal} enviadas, ${data.stats.skippedTotal} retidas`);
                } else {
                    console.log(`[BackgroundScanner] ⏳ Scan pulado: ${data.reason} — ${data.message || ''}`);
                }

                // Ajusta para a próxima hora cheia após o scan
                scheduleNextHourlyScan();
            } catch (err) {
                console.error('[BackgroundScanner] Erro na varredura:', err);
                // Tenta novamente em 1 minuto se houver erro
                intervalRef.current = setTimeout(triggerScan, 60000);
            } finally {
                isRunningRef.current = false;
            }
        }

        function scheduleNextHourlyScan() {
            if (intervalRef.current) {
                clearTimeout(intervalRef.current);
            }

            const now = new Date();
            const nextHour = new Date(now);
            nextHour.setHours(now.getHours() + 1, 0, 0, 0);

            const msUntilNextHour = nextHour.getTime() - now.getTime();

            // Usamos setTimeout para bater na hora cheia com precisão
            intervalRef.current = setTimeout(triggerScan, msUntilNextHour);

            console.log(`[BackgroundScanner] ⏰ Próxima varredura programada para às ${nextHour.getHours()}h:00m (${Math.round(msUntilNextHour / 60000)} min restantes)`);
        }

        // Initial scan after a short delay (let the page load first)
        const initialTimeout = setTimeout(() => {
            triggerScan();
        }, INITIAL_DELAY_MS);

        // Handle visibility change - trigger scan if it's past target hour when tab becomes visible
        function handleVisibilityChange() {
            if (document.visibilityState === 'visible') {
                console.log('[BackgroundScanner] 👀 Tab visível novamente.');
                // Se estivermos em uma nova hora e não rodou ainda, dispara
                triggerScan();
            }
        }
        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            clearTimeout(initialTimeout);
            if (intervalRef.current) {
                clearTimeout(intervalRef.current);
            }
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, []);

    return null;
}
