import { prisma } from "../../../db";
import { createHash } from "crypto";
import { enforceRateLimit } from "../../../utils/rateLimit";

export default defineEventHandler(async (event) => {
    enforceRateLimit(event, 30, 60_000);

    const token = getRouterParam(event, "token");

    if (!token) throw createError({ statusCode: 400, statusMessage: "Token required" });

    const tokenHash = createHash("sha256").update(token).digest("hex");

    const signingToken = await prisma.signingToken.findUnique({
        where: { token: tokenHash },
        include: {
            contractSignature: {
                include: {
                    party: true,
                    contract: {
                        include: { currentVersion: true },
                    },
                },
            },
        },
    });

    if (!signingToken) throw createError({ statusCode: 404, statusMessage: "Invalid signing link" });
    if (signingToken.usedAt) throw createError({ statusCode: 410, statusMessage: "This signing link has already been used" });
    if (signingToken.expiresAt < new Date()) throw createError({ statusCode: 410, statusMessage: "This signing link has expired" });

    const sig = signingToken.contractSignature;

    if (!sig.viewedAt) {
        const ipAddress = (event.node.req.headers["x-forwarded-for"] as string | undefined)?.split(",")[0]?.trim()
            ?? (event.node.req.socket as { remoteAddress?: string })?.remoteAddress
            ?? null;
        const userAgent = (event.node.req.headers["user-agent"] as string | undefined) ?? null;

        await prisma.$transaction(async (tx) => {
            await tx.contractSignature.update({
                where: { id: sig.id },
                data: { viewedAt: new Date(), status: "VIEWED" },
            });
            await tx.contractAuditLog.create({
                data: {
                    contractId: sig.contractId,
                    eventType: "SIGNATORY_VIEWED",
                    details: JSON.stringify({ partyId: sig.partyId, legalName: sig.party.legalName, ipAddress, userAgent }),
                },
            });
        });
    }

    return {
        signatory: {
            id: sig.party.id,
            legalName: sig.party.legalName,
            email: sig.party.email,
            title: sig.party.title,
            organization: sig.party.organization,
        },
        contract: {
            id: sig.contract.id,
            title: sig.contract.title,
            contentHtml: sig.contract.currentVersion?.contentHtml ?? "",
            signatureType: sig.contract.signatureType,
            status: sig.contract.status,
        },
        signatureStatus: sig.status,
        expiresAt: signingToken.expiresAt,
    };
});
