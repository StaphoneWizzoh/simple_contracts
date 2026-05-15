export const CONTRACT_STATUSES = {
    DRAFT: "DRAFT",
    REVIEW: "REVIEW",
    SENT_FOR_SIGNING: "SENT_FOR_SIGNING",
    ACTIVE: "ACTIVE",
    EXPIRED: "EXPIRED",
    TERMINATED: "TERMINATED",
} as const;

export type ContractStatus = typeof CONTRACT_STATUSES[keyof typeof CONTRACT_STATUSES];

const ALLOWED_TRANSITIONS: Record<ContractStatus, ContractStatus[]> = {
    DRAFT: ["REVIEW"],
    REVIEW: ["DRAFT", "SENT_FOR_SIGNING"],
    SENT_FOR_SIGNING: ["ACTIVE"],
    ACTIVE: ["EXPIRED", "TERMINATED", "SENT_FOR_SIGNING"],
    EXPIRED: [],
    TERMINATED: [],
};

export function canTransition(from: string, to: ContractStatus): boolean {
    return (ALLOWED_TRANSITIONS[from as ContractStatus] ?? []).includes(to);
}

export function assertTransition(from: string, to: ContractStatus): void {
    if (!canTransition(from, to)) {
        throw createError({
            statusCode: 422,
            statusMessage: `Cannot move contract from ${from} to ${to}`,
        });
    }
}
