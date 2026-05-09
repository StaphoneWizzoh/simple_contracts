import { prisma } from "../../../../db";
import { createHash } from "crypto";
import type { DeclineSignatureBody } from "../../../../types/contracts";
import { enforceRateLimit } from "../../../../utils/rateLimit";

export default defineEventHandler(async (event) => {
    enforceRateLimit(event, 10, 60_000);

    const token = getRouterParam(event, "token");
    const body = await readBody<DeclineSignatureBody>(event);

    if (!token) throw createError({ statusCode: 400, statusMessage: "Token required" });

    const tokenHash = createHash("sha256").update(token).digest("hex");

    const signingToken = await prisma.signingToken.findUnique({
        where: { token: tokenHash },
        include: {
            contractSignature: {
                include: { party: true },
            },
        },
    });

    if (!signingToken) throw createError({ statusCode: 404, statusMessage: "Invalid signing link" });
    if (signingToken.usedAt) throw createError({ statusCode: 410, statusMessage: "This signing link has already been used" });
    if (signingToken.expiresAt < new Date()) throw createError({ statusCode: 410, statusMessage: "This signing link has expired" });

    const sig = signingToken.contractSignature;
    const ipAddress = (event.node.req.headers["x-forwarded-for"] as string | undefined)?.split(",")[0]?.trim()
        ?? (event.node.req.socket as { remoteAddress?: string })?.remoteAddress
        ?? null;
    const userAgent = (event.node.req.headers["user-agent"] as string | undefined) ?? null;
    const now = new Date();

    await prisma.$transaction(async (tx) => {
        await tx.signingToken.update({ where: { id: signingToken.id }, data: { usedAt: now } });

        await tx.contractSignature.update({
            where: { id: sig.id },
            data: { status: "DECLINED", declinedAt: now, reason: body?.reason ?? null, ipAddress },
        });

        await tx.contractAuditLog.create({
            data: {
                contractId: sig.contractId,
                eventType: "SIGNATORY_DECLINED",
                details: JSON.stringify({
                    partyId: sig.partyId,
                    legalName: sig.party.legalName,
                    email: sig.party.email,
                    reason: body?.reason ?? null,
                    ipAddress,
                    userAgent,
                }),
            },
        });
    });

    return { success: true };
});
