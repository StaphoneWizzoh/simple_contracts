import { prisma } from "../../../../db";
import { createHash } from "crypto";
import type { SubmitSignatureBody } from "../../../../types/contracts";
import { enforceRateLimit } from "../../../../utils/rateLimit";

export default defineEventHandler(async (event) => {
    enforceRateLimit(event, 10, 60_000);

    const token = getRouterParam(event, "token");
    const body = await readBody<SubmitSignatureBody>(event);

    if (!token) throw createError({ statusCode: 400, statusMessage: "Token required" });
    if (!body?.signatureData) throw createError({ statusCode: 400, statusMessage: "Signature data required" });
    if (!body?.signatureType || !["TYPED", "DRAWN"].includes(body.signatureType)) {
        throw createError({ statusCode: 400, statusMessage: "Invalid signature type" });
    }

    if (body.signatureType === "DRAWN") {
        if (!body.signatureData.startsWith("data:image/png;base64,")) {
            throw createError({ statusCode: 400, statusMessage: "Drawn signature must be a PNG data URL" });
        }
        if (body.signatureData.length > 500_000) {
            throw createError({ statusCode: 400, statusMessage: "Signature image is too large" });
        }
    } else {
        const trimmed = body.signatureData.trim();
        if (trimmed.length === 0 || trimmed.length > 255) {
            throw createError({ statusCode: 400, statusMessage: "Typed signature must be 1–255 characters" });
        }
    }

    const tokenHash = createHash("sha256").update(token).digest("hex");

    const signingToken = await prisma.signingToken.findUnique({
        where: { token: tokenHash },
        include: {
            contractSignature: {
                include: {
                    party: true,
                    contract: { select: { id: true, status: true, signingWorkflow: true, currentVersionId: true } },
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

    const ipAddress = (event.node.req.headers["x-forwarded-for"] as string | undefined)?.split(",")[0]?.trim()
        ?? (event.node.req.socket as { remoteAddress?: string })?.remoteAddress
        ?? null;
    const userAgent = (event.node.req.headers["user-agent"] as string | undefined) ?? null;
    const now = new Date();

    await prisma.$transaction(async (tx) => {
        // Re-query signatures inside the transaction to avoid a sequential-signing race condition.
        // Any concurrent sign request will block until this transaction commits.
        if (contract.signingWorkflow === "SEQUENTIAL" && sig.party.signingOrder !== null) {
            const allSigs = await tx.contractSignature.findMany({
                where: { contractId: sig.contractId },
                include: { party: { select: { signingOrder: true } } },
            });
            const pendingBefore = allSigs.some(
                (s) => s.id !== sig.id
                    && s.party.signingOrder !== null
                    && s.party.signingOrder < sig.party.signingOrder!
                    && s.status !== "SIGNED",
            );
            if (pendingBefore) {
                throw createError({ statusCode: 422, statusMessage: "Previous signatories must sign first" });
            }
        }

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

        // Auto-activate only when every party on the contract has a SIGNED signature.
        // We must compare against ContractParty (all intended signatories), NOT ContractSignature
        // (which only contains rows for parties that received a link). A party with no signature
        // row has not signed, so the contract must stay in SENT_FOR_SIGNING.
        const totalParties = await tx.contractParty.count({ where: { contractId: sig.contractId } });
        const allSigsAfter = await tx.contractSignature.findMany({ where: { contractId: sig.contractId } });
        const allSigned = allSigsAfter.length === totalParties && allSigsAfter.every((s) => s.status === "SIGNED");
        if (allSigned) {
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
