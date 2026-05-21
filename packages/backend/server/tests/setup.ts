import { vi } from "vitest";
import { PrismaClient } from "@prisma/client";

// Shim H3 globals that Nitro auto-injects at runtime but are absent in test environment
(global as any).createError = ({ statusCode, statusMessage }: { statusCode: number; statusMessage: string }) => {
  const err = Object.assign(new Error(statusMessage), { statusCode, statusMessage });
  return err;
};

(global as any).defineEventHandler = (handler: any) => handler;

(global as any).getRouterParam = (event: any, param: string) => event.params?.[param];

(global as any).readBody = async (event: any) => event.body;

// Test Prisma instance for actual database operations
export const testPrisma = new PrismaClient();

// Mock Better Auth's session lookup — tests will override mockResolvedValue per scenario
vi.mock("../auth", () => ({
  auth: { api: { getSession: vi.fn() } },
}));
