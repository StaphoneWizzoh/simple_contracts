export type SaveDraftRequest = {
    contractId?: string;
    title: string;
    description?: string;
    counterpartyName?: string;
    contentHtml: string;
};

export type PublishContractRequest = SaveDraftRequest;

export type ContractSaveResponse = {
    contractId: string;
    versionId: string;
    versionNumber: number;
    status: string;
};

export type ContractListItem = {
    id: string;
    title: string;
    status: string;
    counterpartyName: string | null;
    versionNumber: number;
    updatedAt: string;
    createdAt: string;
};

export type ContractDetail = {
    id: string;
    contractNumber: string | null;
    title: string;
    description: string | null;
    status: string;
    contractType: string | null;
    counterpartyName: string | null;
    effectiveAt: string | null;
    expiresAt: string | null;
    terminatedAt: string | null;
    terminationReason: string | null;
    currencyCode: string;
    totalValueMinor: number | null;
    approvalWorkflow: string;
    signingWorkflow: string;
    signatureType: string;
    signingLinkExpiryDays: number;
    contentHtml: string;
    versionNumber: number;
    signedPdfGeneratedAt: string | null;
    createdAt: string;
    updatedAt: string;
};

export type ContractApproval = {
    id: string;
    approverId: string;
    approverName: string;
    approverEmail: string;
    approverImage: string | null;
    order: number;
    status: "PENDING" | "APPROVED" | "REJECTED";
    comment: string | null;
    actedAt: string | null;
    createdAt: string;
};

export type ApprovalsResponse = {
    approvalWorkflow: string;
    approvals: ContractApproval[];
};

export type AuditLogEntry = {
    id: string;
    eventType: string;
    details: Record<string, unknown> | null;
    actorId: string | null;
    actorName: string | null;
    actorEmail: string | null;
    createdAt: string;
};

export type ContractSettingsRequest = {
    contractType?: string;
    effectiveAt?: string | null;
    expiresAt?: string | null;
    currencyCode?: string;
    totalValueMinor?: number | null;
    approvalWorkflow?: string;
    signingWorkflow?: string;
    signatureType?: string;
    signingLinkExpiryDays?: number;
};

export type AssignReviewersRequest = {
    contractId: string;
    approverIds: string[];
    workflow?: "SEQUENTIAL" | "SIMULTANEOUS";
};

export type ApproveRequest = {
    contractId: string;
    comment?: string;
};

export type RejectRequest = {
    contractId: string;
    comment?: string;
};

export type TerminateRequest = {
    contractId: string;
    reason?: string;
};
