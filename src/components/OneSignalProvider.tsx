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
                    promptOptions: {
                        slidedown: {
                            prompts: [{
                                type: "push",
                                autoPrompt: true,
                                delay: { pageViews: 1, timeDelay: 3 },
                                text: {
                                    actionMessage: "Deseja receber alertas de mercado e sinais da sua carteira em tempo real?",
                                    acceptButton: "Sim, quero!",
                                    cancelButton: "Agora não",
                                },
                            }],
                        },
                    },
                    notifyButton: {
                        enable: true,
                        size: 'medium',
                        prenotify: true,
                        showCredit: false,
                        text: {
                            'tip.state.unsubscribed': 'Ativar notificações',
                            'tip.state.subscribed': 'Notificações ativadas',
                            'tip.state.blocked': 'Notificações bloqueadas',
                            'message.prenotify': 'Clique para receber alertas de mercado',
                            'message.action.subscribed': 'Obrigado por ativar!',
                            'message.action.subscribing': 'Ativando...',
                            'message.action.resubscribed': 'Notificações reativadas!',
                            'message.action.unsubscribed': 'Você não receberá mais notificações.',
                            'dialog.main.title': 'Gerenciar Notificações',
                            'dialog.main.button.subscribe': 'ATIVAR',
                            'dialog.main.button.unsubscribe': 'DESATIVAR',
                            'dialog.blocked.title': 'Desbloquear Notificações',
                            'dialog.blocked.message': 'Siga as instruções para liberar notificações no seu navegador.',
                        },
                    },
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

