import { PrismaClient } from '@prisma/client';

declare global { var __prisma_vendor: PrismaClient | undefined; }
export const prisma: PrismaClient = global.__prisma_vendor ?? new PrismaClient({ log: process.env.NODE_ENV !== 'production' ? ['error'] : ['error'] });
if (process.env.NODE_ENV !== 'production') global.__prisma_vendor = prisma;
export const connectDatabase = () => prisma.$connect();
export const disconnectDatabase = () => prisma.$disconnect();
