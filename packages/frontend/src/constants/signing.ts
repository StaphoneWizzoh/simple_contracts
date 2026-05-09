export const SIGNATURE_TYPES = {
    TYPED: "TYPED",
    DRAWN: "DRAWN",
} as const;

export type SignatureType = (typeof SIGNATURE_TYPES)[keyof typeof SIGNATURE_TYPES];

export const SIGNATURE_STATUSES = {
    PENDING: "PENDING",
    VIEWED: "VIEWED",
    SIGNED: "SIGNED",
    DECLINED: "DECLINED",
    NOT_SENT: "NOT_SENT",
} as const;

export type SignatureStatus = (typeof SIGNATURE_STATUSES)[keyof typeof SIGNATURE_STATUSES];

export const CONTRACT_STATUSES = {
    DRAFT: "DRAFT",
    UNDER_REVIEW: "UNDER_REVIEW",
    SENT_FOR_SIGNING: "SENT_FOR_SIGNING",
    ACTIVE: "ACTIVE",
    TERMINATED: "TERMINATED",
    EXPIRED: "EXPIRED",
} as const;
