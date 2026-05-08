import { prisma } from "../db";

export default defineNitroPlugin((_nitro) => {
    async function expireContracts() {
        try {
            const toExpire = await prisma.contract.findMany({
                where: { status: "ACTIVE", expiresAt: { lt: new Date() } },
                select: { id: true },
            });

            if (toExpire.length === 0) return;

            await prisma.$transaction(async (tx) => {
                for (const contract of toExpire) {
                    await tx.contract.update({
                        where: { id: contract.id },
                        data: { status: "EXPIRED" },
                    });
                    await tx.contractAuditLog.create({
                        data: {
                            contractId: contract.id,
                            eventType: "STATUS_CHANGED",
                            details: JSON.stringify({ from: "ACTIVE", to: "EXPIRED", automatic: true }),
                        },
                    });
                }
            });

            console.log(`[expire-contracts] Expired ${toExpire.length} contract(s)`);
        } catch (err) {
            console.error("[expire-contracts] Error:", err);
        }
    }

    expireContracts();
    setInterval(expireContracts, 60 * 60 * 1000);
});
