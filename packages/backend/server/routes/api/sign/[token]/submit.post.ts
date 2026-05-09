import { prisma } from "../../../../db";
import { createHash } from "crypto";
import type { SubmitSignatureBody } from "../../../../types/contracts";

export default defineEventHandler(async (event) => {
    const token = getRouterParam(event, "token");
    const body = await readBody<SubmitSignatureBody>(event);

    if (!token) throw createError({ statusCode: 400, statusMessage: "Token required" });
    if (!body?.signatureData) throw createError({ statusCode: 400, statusMessage: "Signature data required" });
    if (!body?.signatureType || !["TYPED", "DRAWN"].includes(body.signatureType)) {
        throw createError({ statusCode: 400, statusMessage: "Invalid signature type" });
    }

    const tokenHash = createHash("sha256").update(token).digest("hex");

    const signingToken = await prisma.signingToken.findUnique({
        where: { token: tokenHash },
        include: {
            contractSignature: {
                include: {
                    party: true,
                    contract: {
                        include: {
                            signatures: {
                                include: { party: { select: { signingOrder: true } } },
                            },
                        },
                    },
                },
            },
        },
    });

    if (!signingToken) throw createError({ statusCode: 404, statusMessage: "Invalid signing link" });
    if (signingToken.usedAt) throw createError({ statusCode: 410, statusMessage: "This signing link has already been used" });
    if (signingToken.expiresAt < new Date()) throw createError({ statusCode: 410, statusMessage: "This signing link has expired" });

    const sig = signingToken.contractSignature;
    const contract = sig.contract;

    if (contract.status !== "SENT_FOR_SIGNING") {
        throw createError({ statusCode: 422, statusMessage: "Contract is not in signing stage" });
    }

    // Sequential signing: block if an earlier-order signatory hasn't signed yet
    if (contract.signingWorkflow === "SEQUENTIAL" && sig.party.signingOrder !== null) {
        const pendingBefore = contract.signatures.some(
            (s) => s.id !== sig.id
                && s.party.signingOrder !== null
                && s.party.signingOrder < sig.party.signingOrder!
                && s.status !== "SIGNED",
        );
        if (pendingBefore) {
            throw createError({ statusCode: 422, statusMessage: "Previous signatories must sign first" });
        }
    }

    const ipAddress = (event.node.req.headers["x-forwarded-for"] as string | undefined)?.split(",")[0]?.trim()
        ?? (event.node.req.socket as { remoteAddress?: string })?.remoteAddress
        ?? null;
    const userAgent = (event.node.req.headers["user-agent"] as string | undefined) ?? null;
    const now = new Date();

    await prisma.$transaction(async (tx) => {
        await tx.signingToken.update({ where: { id: signingToken.id }, data: { usedAt: now } });

        await tx.contractSignature.update({
            where: { id: sig.id },
            data: {
                status: "SIGNED",
                signedAt: now,
                signatureData: body.signatureData,
                signatureType: body.signatureType,
                ipAddress,
                userAgent,
            },
        });

        await tx.contractAuditLog.create({
            data: {
                contractId: sig.contractId,
                eventType: "SIGNATORY_SIGNED",
                details: JSON.stringify({
                    partyId: sig.partyId,
                    legalName: sig.party.legalName,
                    email: sig.party.email,
                    signatureType: body.signatureType,
                    ipAddress,
                    userAgent,
                    signedAt: now.toISOString(),
                }),
            },
        });

        // Auto-activate if all signatories have now signed
        const remaining = contract.signatures.filter((s) => s.id !== sig.id && s.status !== "SIGNED");
        if (remaining.length === 0) {
            await tx.contract.update({ where: { id: sig.contractId }, data: { status: "ACTIVE" } });
            await tx.contractAuditLog.create({
                data: {
                    contractId: sig.contractId,
                    eventType: "STATUS_CHANGED",
                    details: JSON.stringify({ from: "SENT_FOR_SIGNING", to: "ACTIVE", reason: "All signatories signed" }),
                },
            });
        }
    });

    return { success: true };
});
