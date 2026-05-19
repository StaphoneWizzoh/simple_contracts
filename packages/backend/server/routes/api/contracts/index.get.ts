import { prisma } from "../../../db";
import { getOrgContext } from "../../../utils/permissions";

const VALID_SORT_FIELDS = ["updatedAt", "createdAt", "expiresAt", "effectiveAt", "totalValueMinor", "title", "status"] as const;
const VALID_SORT_ORDERS = ["asc", "desc"] as const;
const MAX_LIMIT = 100;
const DEFAULT_LIMIT = 25;

type SortField = typeof VALID_SORT_FIELDS[number];
type SortOrder = typeof VALID_SORT_ORDERS[number];

export default defineEventHandler(async (event) => {
    const ctx = await getOrgContext(event);
    const query = getQuery(event);

    const search = typeof query.search === "string" ? query.search.trim() : undefined;
    const statusRaw = typeof query.status === "string" ? query.status : undefined;
    const statuses = statusRaw ? statusRaw.split(",").filter(Boolean) : undefined;
    const contractType = typeof query.contractType === "string" ? query.contractType.trim() : undefined;
    const counterparty = typeof query.counterparty === "string" ? query.counterparty.trim() : undefined;
    const dateField = (typeof query.dateField === "string" ? query.dateField : "createdAt") as "createdAt" | "effectiveAt" | "expiresAt" | "updatedAt";
    const dateFrom = typeof query.dateFrom === "string" ? new Date(query.dateFrom) : undefined;
    const dateTo = typeof query.dateTo === "string" ? new Date(query.dateTo) : undefined;
    const reviewerId = typeof query.reviewerId === "string" ? query.reviewerId.trim() : undefined;
    const valueMin = typeof query.valueMin === "string" ? parseInt(query.valueMin, 10) : undefined;
    const valueMax = typeof query.valueMax === "string" ? parseInt(query.valueMax, 10) : undefined;

    const sortByRaw = typeof query.sortBy === "string" ? query.sortBy : "updatedAt";
    const sortBy: SortField = (VALID_SORT_FIELDS as readonly string[]).includes(sortByRaw)
        ? (sortByRaw as SortField)
        : "updatedAt";
    const sortOrderRaw = typeof query.sortOrder === "string" ? query.sortOrder : "desc";
    const sortOrder: SortOrder = (VALID_SORT_ORDERS as readonly string[]).includes(sortOrderRaw)
        ? (sortOrderRaw as SortOrder)
        : "desc";

    const page = Math.max(1, parseInt(String(query.page ?? "1"), 10) || 1);
    const limit = Math.min(MAX_LIMIT, Math.max(1, parseInt(String(query.limit ?? String(DEFAULT_LIMIT)), 10) || DEFAULT_LIMIT));

    // Build where clause
    const dateFilter = (dateFrom || dateTo) ? {
        ...(dateFrom ? { gte: dateFrom } : {}),
        ...(dateTo ? { lte: dateTo } : {}),
    } : undefined;

    const where: Parameters<typeof prisma.contract.findMany>[0]["where"] = {
        organizationId: ctx.organizationId,
        ...(statuses?.length ? { status: { in: statuses } } : {}),
        ...(contractType ? { contractType } : {}),
        ...(counterparty ? { counterpartyName: { contains: counterparty } } : {}),
        ...(dateFilter ? { [dateField]: dateFilter } : {}),
        ...(valueMin != null || valueMax != null ? {
            totalValueMinor: {
                ...(valueMin != null ? { gte: valueMin } : {}),
                ...(valueMax != null ? { lte: valueMax } : {}),
            },
        } : {}),
        ...(search ? {
            OR: [
                { title: { contains: search } },
                { counterpartyName: { contains: search } },
                { currentVersion: { is: { contentText: { contains: search } } } },
            ],
        } : {}),
        ...(reviewerId ? {
            approvals: { some: { approverId: reviewerId } },
        } : {}),
    };

    const [contracts, total] = await Promise.all([
        prisma.contract.findMany({
            where,
            include: {
                currentVersion: { select: { versionNumber: true } },
            },
            orderBy: { [sortBy]: sortOrder },
            skip: (page - 1) * limit,
            take: limit,
        }),
        prisma.contract.count({ where }),
    ]);

    return {
        contracts: contracts.map((c) => ({
            id: c.id,
            title: c.title,
            status: c.status,
            contractType: c.contractType,
            counterpartyName: c.counterpartyName,
            currencyCode: c.currencyCode,
            totalValueMinor: c.totalValueMinor,
            effectiveAt: c.effectiveAt,
            expiresAt: c.expiresAt,
            versionNumber: c.currentVersion?.versionNumber ?? 1,
            updatedAt: c.updatedAt,
            createdAt: c.createdAt,
        })),
        pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
        },
    };
});
