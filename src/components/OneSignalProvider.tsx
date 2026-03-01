'use client';

import { useEffect, useState } from 'react';
import OneSignal from 'react-onesignal';
import { useAuth } from '@clerk/nextjs';

export default function OneSignalProvider() {
    const { userId, isLoaded } = useAuth();
    const [initialized, setInitialized] = useState(false);

    useEffect(() => {
        async function initOneSignal() {
            if (initialized) return;

            const appId = process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID;

            if (!appId) {
                console.warn('[OneSignal Client] App ID não configurado. Verifique NEXT_PUBLIC_ONESIGNAL_APP_ID.');
                return;
            }

            console.log('[OneSignal Client] Inicializando com appId:', appId.substring(0, 8) + '...');

            try {
                await OneSignal.init({
                    appId,
                    allowLocalhostAsSecureOrigin: true,
                    // @ts-ignore
                    notifyButton: { enable: true },
                });

                console.log('[OneSignal Client] ✅ SDK inicializado com sucesso');

                // Check current permission
                const permission = Notification.permission;
                console.log('[OneSignal Client] Browser Notification Permission:', permission);

                if (permission === 'default') {
                    console.log('[OneSignal Client] Pedindo permissão ao usuário...');
                    OneSignal.Slidedown.promptPush();
                } else if (permission === 'denied') {
                    console.warn('[OneSignal Client] ⚠️ Notificações BLOQUEADAS pelo browser! O usuário precisa liberar nas configurações do navegador.');
                } else {
                    console.log('[OneSignal Client] ✅ Permissão já concedida');
                }

                setInitialized(true);
            } catch (error) {
                console.error('[OneSignal Client] ❌ Erro ao inicializar:', error);
            }
        }

        initOneSignal();
    }, [initialized]);

    useEffect(() => {
        if (initialized && isLoaded && userId) {
            console.log('[OneSignal Client] Fazendo login com userId:', userId);
            OneSignal.login(userId).catch(err => console.error("[OneSignal Client] Login error:", err));
        } else if (initialized && isLoaded && !userId) {
            console.log('[OneSignal Client] Fazendo logout (sem userId)');
            OneSignal.logout().catch(err => console.error("[OneSignal Client] Logout error:", err));
        }
    }, [initialized, isLoaded, userId]);

    return null;
}

