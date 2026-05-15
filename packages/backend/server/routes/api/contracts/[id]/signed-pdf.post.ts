import { prisma } from "../../../../db";
import { getOrgContext } from "../../../../utils/permissions";

export default defineEventHandler(async (event) => {
    const ctx = await getOrgContext(event);
    const contractId = getRouterParam(event, "id");

    if (!contractId) throw createError({ statusCode: 400, statusMessage: "Contract ID required" });

    const body = await readBody<{ pdfBase64?: string }>(event);
    if (!body?.pdfBase64) throw createError({ statusCode: 400, statusMessage: "pdfBase64 is required" });

    const contract = await prisma.contract.findFirst({
        where: { id: contractId, organizationId: ctx.organizationId },
        select: { id: true, status: true, signedPdfGeneratedAt: true },
    });

    if (!contract) throw createError({ statusCode: 404, statusMessage: "Contract not found" });
    if (contract.status !== "ACTIVE") {
        throw createError({ statusCode: 422, statusMessage: "Signed PDF can only be stored for active contracts" });
    }

    // Idempotent — if already stored, do nothing
    if (contract.signedPdfGeneratedAt) {
        return { success: true };
    }

    const pdfBytes = Buffer.from(body.pdfBase64, "base64");
    const now = new Date();

    await prisma.$transaction(async (tx) => {
        await tx.contract.update({
            where: { id: contractId },
            data: { signedPdfBytes: pdfBytes, signedPdfGeneratedAt: now },
        });

        await tx.contractAuditLog.create({
            data: {
                contractId,
                actorUserId: ctx.userId,
                eventType: "SIGNED_PDF_STORED",
                details: JSON.stringify({ generatedAt: now.toISOString(), sizeBytes: pdfBytes.length }),
            },
        });
    });

    return { success: true };
});
