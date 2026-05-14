import { prisma } from "../../../../db";
import { requirePermission, PERMISSIONS } from "../../../../utils/permissions";

interface CreateFromTemplateBody {
    title?: string;
}

export default defineEventHandler(async (event) => {
    const ctx = await requirePermission(event, PERMISSIONS.CREATE_CONTRACTS);
    const templateId = getRouterParam(event, "templateId");
    const body = await readBody<CreateFromTemplateBody>(event);

    if (!templateId) {
        throw createError({ statusCode: 400, statusMessage: "Template ID required" });
    }

    const template = await prisma.contractTemplate.findFirst({
        where: {
            id: templateId,
            organizationId: ctx.organizationId,
            isActive: true,
        },
    });

    if (!template) {
        throw createError({ statusCode: 404, statusMessage: "Template not found" });
    }

    // Generate contract number
    const lastContract = await prisma.contract.findFirst({
        where: { organizationId: ctx.organizationId },
        orderBy: { createdAt: "desc" },
        select: { contractNumber: true },
    });
    const lastNum = lastContract?.contractNumber ? parseInt(lastContract.contractNumber.split("-")[1] ?? "0") : 0;
    const contractNumber = `${ctx.organizationId.slice(0, 8)}-${String(lastNum + 1).padStart(6, "0")}`;

    const contract = await prisma.contract.create({
        data: {
            organizationId: ctx.organizationId,
            ownerUserId: ctx.userId,
            createdByUserId: ctx.userId,
            contractNumber,
            title: body.title?.trim() ?? template.title,
            description: template.description ?? null,
            contractType: template.contractType,
            status: "DRAFT",
        },
        include: { currentVersion: true },
    });

    const version = await prisma.contractVersion.create({
        data: {
            contractId: contract.id,
            versionNumber: 1,
            title: body.title?.trim() ?? template.title,
            contentHtml: template.contentHtml,
            contentJson: template.contentJson,
            contentText: template.contentText,
            createdByUserId: ctx.userId,
        },
    });

    await prisma.contract.update({
        where: { id: contract.id },
        data: { currentVersionId: version.id },
    });

    await prisma.contractAuditLog.create({
        data: {
            contractId: contract.id,
            actorUserId: ctx.userId,
            eventType: "CONTRACT_CREATED",
            details: JSON.stringify({
                fromTemplate: true,
                templateId: template.id,
                templateTitle: template.title,
            }),
        },
    });

    return {
        contract: {
            id: contract.id,
            contractNumber: contract.contractNumber,
            title: contract.title,
            status: contract.status,
        },
    };
});
