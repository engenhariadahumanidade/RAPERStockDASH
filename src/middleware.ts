import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

// Define as rotas públicas (que não precisam de login)
const isPublicRoute = createRouteMatcher([
    '/api/(.*)',
    '/unauthorized',
    '/.well-known/(.*)'
]);

export default clerkMiddleware(async (auth, req) => {
    // Se não for uma rota pública, exige login
    if (!isPublicRoute(req)) {
        await auth.protect();
    }
});

export const config = {
    matcher: [
        // Padrão recomendado pelo Clerk para Next.js 15+
        '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
        '/(api|trpc)(.*)',
    ],
};
