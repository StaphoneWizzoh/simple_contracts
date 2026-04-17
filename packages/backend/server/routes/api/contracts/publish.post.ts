import { auth } from "../../../auth";
import { prisma } from "../../../db";

type PublishBody = {
    contractId?: string;
    title?: string;
    description?: string;
    counterpartyName?: string;
    contentHtml?: string;
};

export default defineEventHandler(async (event) => {
    const session = await auth.api.getSession({
        headers: event.node.req.headers,
    });

    if (!session?.user?.id) {
        throw createError({ statusCode: 401, statusMessage: "Unauthorized" });
    }

    const body = (await readBody(event)) as PublishBody;
    if (!body?.contentHtml || !body?.title?.trim()) {
        throw createError({
            statusCode: 400,
            statusMessage: "title and contentHtml are required",
        });
    }

    const userId = session.user.id;

    if (!body.contractId) {
        throw createError({
            statusCode: 400,
            statusMessage: "contractId is required to publish",
        });
    }

    const existing = await prisma.contract.findFirst({
        where: {
            id: body.contractId,
            organization: {
                members: {
                    some: {
                        userId,
                    },
                },
            },
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
            actorUserId: userId,
            eventType: "STATUS_CHANGED",
            details: JSON.stringify({
                from: existing.status,
                to: "REVIEW",
                versionNumber: nextVersionNumber,
            }),
        },
    });

    return {
        contractId: existing.id,
        versionId: version.id,
        versionNumber: version.versionNumber,
        status: "REVIEW",
    };
});
