import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "./db";

export const auth = betterAuth({
    database: prismaAdapter(prisma, { provider: "sqlite" }),
    secret: process.env.BETTER_AUTH_SECRET || "default-secret-change-me",
    basePath: "/auth",
    baseURL: process.env.BETTER_AUTH_URL || "http://localhost:3000",
    trustedOrigins: process.env.BETTER_AUTH_TRUSTED_ORIGINS
        ? process.env.BETTER_AUTH_TRUSTED_ORIGINS.split(",").map((origin) =>
              origin.trim(),
          )
        : ["http://localhost:5173"],
    emailAndPassword: {
        enabled: true,
        maxPasswordLength: 128,
    },
});
