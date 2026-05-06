import { PrismaClient } from '@prisma/client';
declare global { var __prisma_notif: PrismaClient | undefined; }
export const prisma: PrismaClient = global.__prisma_notif ?? new PrismaClient({ log: ['error'] });
if (process.env.NODE_ENV !== 'production') global.__prisma_notif = prisma;
export const connectDatabase = () => prisma.$connect();
export const disconnectDatabase = () => prisma.$disconnect();
