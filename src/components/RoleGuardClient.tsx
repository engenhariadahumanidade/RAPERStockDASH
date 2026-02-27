'use client';

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function RoleGuardClient({ children }: { children: React.ReactNode }) {
    const [authorized, setAuthorized] = useState<boolean | null>(null);
    const pathname = usePathname();
    const router = useRouter();

    useEffect(() => {
        let mounted = true;

        if (pathname === "/unauthorized") {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setAuthorized(true);
            return;
        }

        fetch("/api/auth/me")
            .then(res => res.json())
            .then(data => {
                if (!mounted) return;

                if (pathname.startsWith("/admin") && !data.isAdmin) {
                    router.push("/unauthorized");
                    return;
                }
                if (!data.isAllowed && !data.isAdmin) {
                    router.push("/unauthorized");
                    return;
                }
                setAuthorized(true);
            })
            .catch(() => {
                if (!mounted) return;
                setAuthorized(false);
            });

        return () => {
            mounted = false;
        };
    }, [pathname, router]);

    if (authorized === null && pathname !== "/unauthorized") {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh]">
                <Loader2 className="w-12 h-12 text-brand-500 animate-spin mb-4" />
                <h2 className="text-xl font-medium tracking-wider text-slate-300 animate-pulse">
                    Verificando acesso...
                </h2>
            </div>
        );
    }

    if (authorized === false && pathname !== "/unauthorized") {
        return null;
    }

    return <>{children}</>;
}
