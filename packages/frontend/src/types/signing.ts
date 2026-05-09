export type Signatory = {
    id: string;
    legalName: string;
    email: string | null;
    title: string | null;
    organization: string | null;
    signingOrder: number | null;
    signatures: {
        id: string;
        status: string;
        requestedAt: string;
        viewedAt: string | null;
        signedAt: string | null;
        declinedAt: string | null;
        signatureData: string | null;
        signatureType: string | null;
        ipAddress: string | null;
        signingToken: {
            expiresAt: string;
            usedAt: string | null;
        } | null;
    }[];
};

export type AddSignatoryRequest = {
    legalName: string;
    email: string;
    title?: string;
    organization?: string;
    signingOrder?: number;
};

export type GenerateSigningLinkResponse = {
    signingUrl: string;
    expiresAt: string;
};

export type SigningContext = {
    signatory: {
        id: string;
        legalName: string;
        email: string | null;
        title: string | null;
        organization: string | null;
    };
    contract: {
        id: string;
        title: string;
        contentHtml: string;
        signatureType: string;
        status: string;
    };
    signatureStatus: string;
    expiresAt: string;
};

export type SubmitSignatureRequest = {
    signatureData: string;
    signatureType: "TYPED" | "DRAWN";
};
