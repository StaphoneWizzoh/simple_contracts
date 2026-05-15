import { prisma } from "../../../../db";
import { getOrgContext } from "../../../../utils/permissions";

export default defineEventHandler(async (event) => {
    const ctx = await getOrgContext(event);
    const contractId = getRouterParam(event, "id");

    if (!contractId) throw createError({ statusCode: 400, statusMessage: "Contract ID required" });

    const contract = await prisma.contract.findFirst({
        where: { id: contractId, organizationId: ctx.organizationId },
        select: { signedPdfBytes: true, contractNumber: true, title: true },
    });

    if (!contract) throw createError({ statusCode: 404, statusMessage: "Contract not found" });
    if (!contract.signedPdfBytes) {
        throw createError({ statusCode: 404, statusMessage: "Signed PDF not yet available for this contract" });
    }

    const filename = `${contract.contractNumber ?? contractId}-signed.pdf`
        .replace(/[^a-zA-Z0-9._-]/g, "-");

    setResponseHeader(event, "Content-Type", "application/pdf");
    setResponseHeader(event, "Content-Disposition", `attachment; filename="${filename}"`);
    setResponseHeader(event, "Content-Length", String(contract.signedPdfBytes.length));

    return contract.signedPdfBytes;
});
