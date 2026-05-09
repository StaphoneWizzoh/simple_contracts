export type SaveDraftBody = {
    contractId?: string;
    title?: string;
    description?: string;
    counterpartyName?: string;
    contentHtml?: string;
};

export type PublishBody = {
    contractId?: string;
    title?: string;
    description?: string;
    counterpartyName?: string;
    contentHtml?: string;
};

export type ContractSettingsBody = {
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

export type AssignReviewersBody = {
    approverIds?: string[];
    workflow?: string;
};

export type ApproveBody = {
    comment?: string;
};

export type RejectBody = {
    comment?: string;
};

export type TerminateBody = {
    reason?: string;
};

export type AddSignatoryBody = {
    legalName: string;
    email: string;
    title?: string;
    organization?: string;
    signingOrder?: number;
};

export type SubmitSignatureBody = {
    signatureData: string;
    signatureType: "TYPED" | "DRAWN";
};

export type DeclineSignatureBody = {
    reason?: string;
};
