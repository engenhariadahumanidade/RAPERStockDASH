import '@testing-library/jest-dom'
import { vi } from 'vitest'

// Mock Prisma
vi.mock('@/lib/prisma', () => ({
    default: {
        stock: {
            findMany: vi.fn(),
            findUnique: vi.fn(),
            update: vi.fn(),
            create: vi.fn(),
        },
        settings: {
            findUnique: vi.fn(),
            update: vi.fn(),
        },
        systemLog: {
            create: vi.fn(),
            findMany: vi.fn(),
        },
        user: {
            findUnique: vi.fn(),
        },
    },
}))

// Mock Clerk
vi.mock('@clerk/nextjs', () => ({
    auth: vi.fn(() => ({ userId: 'test-user-id' })),
    currentUser: vi.fn(() => Promise.resolve({ id: 'test-user-id', emailAddresses: [{ emailAddress: 'test@example.com' }] })),
}))

// Mock Webhooks
vi.mock('@/lib/webhook', () => ({
    sendWebhookMessage: vi.fn(() => Promise.resolve()),
}))
