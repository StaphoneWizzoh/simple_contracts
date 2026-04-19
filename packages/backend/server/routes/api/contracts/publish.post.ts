import { prisma } from "../../../db";
import { requirePermission, PERMISSIONS } from "../../../utils/permissions";

type PublishBody = {
    contractId?: string;
    title?: string;
    description?: string;
    counterpartyName?: string;
    contentHtml?: string;
};

export default defineEventHandler(async (event) => {
    const ctx = await requirePermission(event, PERMISSIONS.CREATE_CONTRACTS);

    const body = (await readBody(event)) as PublishBody;
    if (!body?.contentHtml || !body?.title?.trim()) {
        throw createError({ statusCode: 400, statusMessage: "title and contentHtml are required" });
    }
    if (!body.contractId) {
        throw createError({ statusCode: 400, statusMessage: "contractId is required to publish" });
    }

    const existing = await prisma.contract.findFirst({
        where: { id: body.contractId, organizationId: ctx.organizationId },
        include: { versions: { orderBy: { versionNumber: "desc" }, take: 1 } },
    });

    if (!existing) {
        throw createError({ statusCode: 404, statusMessage: "Contract not found" });
    }

    const nextVersionNumber = (existing.versions[0]?.versionNumber ?? 0) + 1;

    const version = await prisma.contractVersion.create({
        data: {
            contractId: existing.id,
            versionNumber: nextVersionNumber,
            title: body.title.trim(),
            contentHtml: body.contentHtml,
            contentText: body.contentHtml.replace(/<[^>]+>/g, " ").trim(),
            createdByUserId: ctx.userId,
            changeSummary: "Submitted for review",
        },
    });

    await prisma.contract.update({
        where: { id: existing.id },
        data: {
            title: body.title.trim(),
            description: body.description,
            counterpartyName: body.counterpartyName,
            status: "REVIEW",
            currentVersionId: version.id,
        },
    });

    await prisma.contractAuditLog.create({
        data: {
            contractId: existing.id,
            actorUserId: ctx.userId,
            eventType: "STATUS_CHANGED",
            details: JSON.stringify({ from: existing.status, to: "REVIEW", versionNumber: nextVersionNumber }),
        },
    });

    return {
        contractId: existing.id,
        versionId: version.id,
        versionNumber: version.versionNumber,
        status: "REVIEW",
    };
});
