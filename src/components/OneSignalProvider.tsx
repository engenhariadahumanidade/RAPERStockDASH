'use client';

import { useEffect, useState } from 'react';
import OneSignal from 'react-onesignal';
import { useAuth } from '@clerk/nextjs';

export default function OneSignalProvider() {
    const { userId, isLoaded } = useAuth();
    const [initialized, setInitialized] = useState(false);

    useEffect(() => {
        async function initOneSignal() {
            // Avoid initializing multiple times
            if (initialized) return;

            const appId = process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID;

            if (!appId) {
                console.warn('OneSignal App ID não configurado.');
                return;
            }

            try {
                await OneSignal.init({
                    appId,
                    allowLocalhostAsSecureOrigin: true, // Permite rodar e testar no localhost
                    // @ts-ignore
                    notifyButton: { enable: true },
                });

                // Exibe o prompt para pedir permissão ao usuário
                OneSignal.Slidedown.promptPush();

                setInitialized(true);
            } catch (error) {
                console.error('Erro ao inicializar o OneSignal', error);
            }
        }

        initOneSignal();
    }, [initialized]);

    // Handle User Id Mapping
    useEffect(() => {
        if (initialized && isLoaded && userId) {
            // Quando o usuário loga e o Clerk tem o ID, vinculamos no OneSignal
            OneSignal.login(userId).catch(err => console.error("OneSignal login error", err));
        } else if (initialized && isLoaded && !userId) {
            OneSignal.logout().catch(err => console.error("OneSignal logout error", err));
        }
    }, [initialized, isLoaded, userId]);

    return null; // Este componente não renderiza nada visualmente por si mesmo (apenas scripts do OneSignal e o sino injetado)
}
