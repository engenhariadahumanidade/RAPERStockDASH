import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const email = 'engenhariadahumanidade@gmail.com';

    // Add to allowed users
    const allowed = await prisma.allowedUser.upsert({
        where: { email },
        update: {},
        create: { email },
    });
    console.log('User added to AllowedUser:', allowed);

    // Mark as admin if user profile exists
    const user = await prisma.user.upsert({
        where: { email },
        update: { isAdmin: true },
        create: {
            id: 'placeholder_id', // This will be updated on first login
            email,
            isAdmin: true,
        },
    });
    console.log('User marked as Admin:', user);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
