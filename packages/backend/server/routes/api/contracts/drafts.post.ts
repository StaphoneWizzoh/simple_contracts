import { auth } from "../../../auth";
import { prisma } from "../../../db";
import { seedDefaultRoles, getAdminRole, PERMISSIONS, getOrgContext } from "../../../utils/permissions";

type SaveDraftBody = {
    contractId?: string;
    title?: string;
    description?: string;
    counterpartyName?: string;
    contentHtml?: string;
};

function createContractNumber() {
    return `CNT-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
}

export default defineEventHandler(async (event) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const session = await auth.api.getSession({ headers: event.node.req.headers as any });
    if (!session?.user?.id) {
        throw createError({ statusCode: 401, statusMessage: "Unauthorized" });
    }

    const body = (await readBody(event)) as SaveDraftBody;
    if (!body?.contentHtml || !body?.title?.trim()) {
        throw createError({ statusCode: 400, statusMessage: "title and contentHtml are required" });
    }

    const userId = session.user.id;

    // Auto-create org for first-time users who skipped onboarding
    const existingMembership = await prisma.organizationMember.findFirst({ where: { userId } });
    if (!existingMembership) {
        const organization = await prisma.organization.create({
            data: { name: `${session.user.name || "User"}'s Organisation` },
        });
        await seedDefaultRoles(organization.id);
        const adminRole = await getAdminRole(organization.id);
        await prisma.organizationMember.create({
            data: { organizationId: organization.id, userId, roleId: adminRole!.id },
        });
    }

    // Now verify the user has permission to create contracts
    const ctx = await getOrgContext(event);
    if (!ctx.permissions.includes(PERMISSIONS.CREATE_CONTRACTS)) {
        throw createError({ statusCode: 403, statusMessage: "You do not have permission to create contracts" });
    }

    const organizationId = ctx.organizationId;

    if (!body.contractId) {
        const contract = await prisma.contract.create({
            data: {
                organizationId,
                ownerUserId: userId,
                createdByUserId: userId,
                contractNumber: createContractNumber(),
                title: body.title.trim(),
                description: body.description,
                counterpartyName: body.counterpartyName,
                status: "DRAFT",
            },
        });

        const version = await prisma.contractVersion.create({
            data: {
                contractId: contract.id,
                versionNumber: 1,
                title: body.title.trim(),
                contentHtml: body.contentHtml,
                contentText: body.contentHtml.replace(/<[^>]+>/g, " ").trim(),
                createdByUserId: userId,
                changeSummary: "Initial draft",
            },
        });

        await prisma.contract.update({
            where: { id: contract.id },
            data: { currentVersionId: version.id },
        });

        await prisma.contractAuditLog.create({
            data: {
                contractId: contract.id,
                actorUserId: userId,
                eventType: "CONTRACT_CREATED",
                details: JSON.stringify({ source: "editor", mode: "draft" }),
            },
        });

        return {
            contractId: contract.id,
            versionId: version.id,
            versionNumber: version.versionNumber,
            status: "DRAFT",
        };
    }

    const existing = await prisma.contract.findFirst({
        where: {
            id: body.contractId,
            organizationId,
        },
        include: {
            versions: {
                orderBy: { versionNumber: "desc" },
                take: 1,
            },
        },
    });

    if (!existing) {
        throw createError({
            statusCode: 404,
            statusMessage: "Contract not found",
        });
    }

    const nextVersionNumber = (existing.versions[0]?.versionNumber ?? 0) + 1;

    const version = await prisma.contractVersion.create({
        data: {
            contractId: existing.id,
            versionNumber: nextVersionNumber,
            title: body.title.trim(),
            contentHtml: body.contentHtml,
            contentText: body.contentHtml.replace(/<[^>]+>/g, " ").trim(),
            createdByUserId: userId,
            changeSummary: "Draft update",
        },
    });

    await prisma.contract.update({
        where: { id: existing.id },
        data: {
            title: body.title.trim(),
            description: body.description,
            counterpartyName: body.counterpartyName,
            status: "DRAFT",
            currentVersionId: version.id,
        },
    });

    await prisma.contractAuditLog.create({
        data: {
            contractId: existing.id,
            actorUserId: userId,
            eventType: "VERSION_CREATED",
            details: JSON.stringify({
                mode: "draft",
                versionNumber: nextVersionNumber,
            }),
        },
    });

    return {
        contractId: existing.id,
        versionId: version.id,
        versionNumber: version.versionNumber,
        status: "DRAFT",
    };
});
