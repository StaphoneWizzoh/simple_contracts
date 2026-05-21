import { prisma } from "../../../../db";
import { requirePermission, PERMISSIONS } from "../../../../utils/permissions";

function escapeCell(value: unknown): string {
    const str = value == null ? "" : String(value);
    if (str.includes(",") || str.includes('"') || str.includes("\n")) {
        return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
}

function toRow(cells: unknown[]): string {
    return cells.map(escapeCell).join(",");
}

export default defineEventHandler(async (event) => {
    const ctx = await requirePermission(event, PERMISSIONS.VIEW_REPORTS);
    const query = getQuery(event);

    const statusRaw = typeof query.status === "string" ? query.status : undefined;
    const statuses = statusRaw ? statusRaw.split(",").filter(Boolean) : undefined;
    const contractType = typeof query.contractType === "string" ? query.contractType : undefined;
    const dateFrom = typeof query.dateFrom === "string" ? new Date(query.dateFrom) : undefined;
    const dateTo = typeof query.dateTo === "string" ? new Date(query.dateTo) : undefined;

    const contracts = await prisma.contract.findMany({
        where: {
            organizationId: ctx.organizationId,
            ...(statuses?.length ? { status: { in: statuses } } : {}),
            ...(contractType ? { contractType } : {}),
            ...(dateFrom || dateTo ? { createdAt: { ...(dateFrom ? { gte: dateFrom } : {}), ...(dateTo ? { lte: dateTo } : {}) } } : {}),
        },
        include: {
            ownerUser: { select: { name: true, email: true } },
            currentVersion: { select: { versionNumber: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 5000,
    });

    const header = toRow([
        "Contract Number", "Title", "Status", "Type", "Counterparty",
        "Currency", "Value", "Effective Date", "Expiry Date",
        "Owner", "Owner Email", "Version", "Created At", "Updated At",
    ]);

    const rows = contracts.map((c) =>
        toRow([
            c.contractNumber,
            c.title,
            c.status,
            c.contractType,
            c.counterpartyName ?? "",
            c.currencyCode,
            c.totalValueMinor != null ? (c.totalValueMinor / 100).toFixed(2) : "",
            c.effectiveAt?.toISOString().split("T")[0] ?? "",
            c.expiresAt?.toISOString().split("T")[0] ?? "",
            c.ownerUser.name,
            c.ownerUser.email,
            c.currentVersion?.versionNumber ?? 1,
            c.createdAt.toISOString(),
            c.updatedAt.toISOString(),
        ]),
    );

    const csv = [header, ...rows].join("\r\n");

    setHeader(event, "Content-Type", "text/csv; charset=utf-8");
    setHeader(event, "Content-Disposition", `attachment; filename="contracts-${new Date().toISOString().split("T")[0]}.csv"`);
    return csv;
});
