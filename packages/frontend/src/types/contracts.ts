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
    contractType: string;
    counterpartyName: string | null;
    currencyCode: string;
    totalValueMinor: number | null;
    effectiveAt: string | null;
    expiresAt: string | null;
    versionNumber: number;
    updatedAt: string;
    createdAt: string;
};

export type ContractQueryParams = {
    search?: string;
    status?: string;
    contractType?: string;
    counterparty?: string;
    dateField?: "createdAt" | "effectiveAt" | "expiresAt" | "updatedAt";
    dateFrom?: string;
    dateTo?: string;
    reviewerId?: string;
    valueMin?: number;
    valueMax?: number;
    sortBy?: "updatedAt" | "createdAt" | "expiresAt" | "effectiveAt" | "totalValueMinor" | "title" | "status";
    sortOrder?: "asc" | "desc";
    page?: number;
    limit?: number;
};

export type ContractListResponse = {
    contracts: ContractListItem[];
    pagination: { page: number; limit: number; total: number; totalPages: number };
};

export type SavedSearch = {
    id: string;
    name: string;
    filters: ContractQueryParams;
    createdAt: string;
};

// ---- Report types ----

export type ReportFilters = {
    dateFrom?: string;
    dateTo?: string;
    contractType?: string;
};

export type SummaryReport = {
    total: number;
    byStatus: Record<string, number>;
    expiringSoon: { days30: number; days60: number; days90: number };
    value: { totalMinor: number; avgMinor: number; contractsWithValue: number };
};

export type StatusReport = {
    current: { status: string; count: number }[];
    trend: ({ month: string } & Record<string, number>)[];
};

export type TypeReport = {
    types: { contractType: string; count: number; totalValueMinor: number }[];
};

export type ExpiringContract = {
    id: string;
    title: string;
    contractType: string;
    counterpartyName: string | null;
    expiresAt: string | null;
    totalValueMinor: number | null;
    currencyCode: string;
    daysUntilExpiry: number | null;
    ownerUser: { id: string; name: string; email: string } | null;
};

export type ExpiringReport = {
    days: number;
    contracts: ExpiringContract[];
};

export type TurnaroundReport = {
    count: number;
    avgDays: number | null;
    minDays: number | null;
    maxDays: number | null;
};

export type ApprovalTurnaroundReport = TurnaroundReport & {
    approvedCount: number;
    rejectedCount: number;
};

export type CreatorReport = {
    creators: {
        userId: string;
        user: { id: string; name: string; email: string } | null;
        count: number;
        totalValueMinor: number;
    }[];
};

export type OverdueApprovalContract = {
    id: string;
    title: string;
    status: string;
    contractType: string;
    counterpartyName: string | null;
    updatedAt: string;
    createdAt: string;
    staleDays: number;
    ownerUser: { id: string; name: string; email: string } | null;
    approvals: { approver: { id: string; name: string; email: string }; order: number }[];
};

export type OverdueReport = {
    thresholdDays: number;
    contracts: OverdueApprovalContract[];
};

export type ValueSummaryReport = {
    overall: { totalMinor: number; avgMinor: number; maxMinor: number; minMinor: number; count: number };
    byStatus: { status: string; totalMinor: number; count: number }[];
    byType: { contractType: string; totalMinor: number; count: number }[];
};

export type RenewalPipelineReport = {
    buckets: { days: number; contracts: ExpiringContract[] }[];
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
