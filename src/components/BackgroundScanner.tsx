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

                // Adjust interval based on server response
                if (data.nextCheck && data.nextCheck !== intervalRef.current) {
                    setupInterval(data.nextCheck);
                }
            } catch (err) {
                console.error('[BackgroundScanner] Erro na varredura:', err);
            } finally {
                isRunningRef.current = false;
            }
        }

        function setupInterval(ms: number) {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
            intervalRef.current = setInterval(triggerScan, ms);
            console.log(`[BackgroundScanner] ⏰ Próxima varredura em ${Math.round(ms / 60000)} minutos`);
        }

        // Initial scan after a short delay (let the page load first)
        const initialTimeout = setTimeout(() => {
            triggerScan();
            setupInterval(DEFAULT_INTERVAL_MS);
        }, INITIAL_DELAY_MS);

        // Handle visibility change - trigger scan when tab becomes visible again
        function handleVisibilityChange() {
            if (document.visibilityState === 'visible') {
                console.log('[BackgroundScanner] 👀 Tab visível novamente, disparando varredura...');
                triggerScan();
            }
        }
        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            clearTimeout(initialTimeout);
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, []);

    return null;
}
