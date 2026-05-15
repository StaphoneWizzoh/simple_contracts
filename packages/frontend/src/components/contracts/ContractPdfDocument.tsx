import {
    Document,
    Page,
    Text,
    View,
    Image,
    StyleSheet,
} from "@react-pdf/renderer";
import { htmlToPdfElements } from "@/utils/htmlToPdfElements";
import type { ContractDetail } from "@/store/services/contractApi";
import type { AuditLogEntry } from "@/types/contracts";
import type { Signatory } from "@/types/signing";

const INDIGO = "#4f46e5";
const DARK = "#111827";
const MUTED = "#6b7280";
const BORDER = "#e5e7eb";
const BG_LIGHT = "#f9fafb";
const GREEN = "#059669";
const RED = "#dc2626";
const AMBER = "#d97706";

const styles = StyleSheet.create({
    page: {
        fontFamily: "Helvetica",
        fontSize: 11,
        color: DARK,
        paddingTop: 52,
        paddingBottom: 64,
        paddingHorizontal: 52,
        backgroundColor: "#ffffff",
    },
    headerBand: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-start",
        borderBottom: `2px solid ${INDIGO}`,
        paddingBottom: 12,
        marginBottom: 20,
    },
    appName: {
        fontSize: 9,
        fontWeight: 700,
        color: INDIGO,
        textTransform: "uppercase",
        letterSpacing: 1.5,
    },
    contractNumber: {
        fontSize: 9,
        color: MUTED,
        letterSpacing: 0.5,
    },
    statusBadge: {
        fontSize: 8,
        fontWeight: 700,
        color: INDIGO,
        textTransform: "uppercase",
        letterSpacing: 1,
        border: `1px solid ${INDIGO}`,
        borderRadius: 3,
        paddingHorizontal: 6,
        paddingVertical: 2,
    },
    contractTitle: {
        fontSize: 22,
        fontWeight: 700,
        color: DARK,
        marginBottom: 6,
        lineHeight: 1.25,
    },
    contractType: {
        fontSize: 10,
        color: MUTED,
        marginBottom: 16,
        textTransform: "uppercase",
        letterSpacing: 1,
    },
    metaGrid: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 0,
        backgroundColor: BG_LIGHT,
        borderRadius: 6,
        border: `1px solid ${BORDER}`,
        marginBottom: 20,
        padding: 14,
    },
    metaCell: {
        width: "50%",
        marginBottom: 10,
    },
    metaLabel: {
        fontSize: 8,
        fontWeight: 700,
        color: MUTED,
        textTransform: "uppercase",
        letterSpacing: 1,
        marginBottom: 2,
    },
    metaValue: {
        fontSize: 10,
        color: DARK,
    },
    descriptionBox: {
        backgroundColor: "#eef2ff",
        borderLeft: `3px solid ${INDIGO}`,
        borderRadius: 4,
        padding: 10,
        marginBottom: 20,
    },
    descriptionLabel: {
        fontSize: 8,
        fontWeight: 700,
        color: INDIGO,
        textTransform: "uppercase",
        letterSpacing: 1,
        marginBottom: 4,
    },
    descriptionText: {
        fontSize: 10,
        color: "#3730a3",
        lineHeight: 1.5,
    },
    sectionDivider: {
        borderBottom: `1px solid ${BORDER}`,
        marginBottom: 16,
        paddingBottom: 4,
    },
    sectionTitle: {
        fontSize: 9,
        fontWeight: 700,
        color: MUTED,
        textTransform: "uppercase",
        letterSpacing: 1.5,
        marginBottom: 12,
    },
    contentArea: {
        marginBottom: 24,
    },
    // Signature section
    signatureSection: {
        marginTop: 28,
        borderTop: `2px solid ${BORDER}`,
        paddingTop: 16,
    },
    signatureTitle: {
        fontSize: 9,
        fontWeight: 700,
        color: MUTED,
        textTransform: "uppercase",
        letterSpacing: 1.5,
        marginBottom: 16,
    },
    signatureGrid: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 12,
    },
    signatureBox: {
        flex: 1,
        minWidth: 180,
        border: `1px solid ${BORDER}`,
        borderRadius: 6,
        padding: 12,
    },
    signatureBoxSigned: {
        border: `1px solid ${GREEN}`,
        backgroundColor: "#f0fdf4",
    },
    signatureBoxDeclined: {
        border: `1px solid ${RED}`,
        backgroundColor: "#fef2f2",
    },
    signatureBoxPending: {
        border: `1px solid ${AMBER}`,
        backgroundColor: "#fffbeb",
    },
    signatureRole: {
        fontSize: 8,
        color: MUTED,
        textTransform: "uppercase",
        letterSpacing: 1,
        marginBottom: 2,
    },
    signatureName: {
        fontSize: 11,
        fontWeight: 700,
        color: DARK,
        marginBottom: 1,
    },
    signatureOrg: {
        fontSize: 9,
        color: MUTED,
        marginBottom: 10,
    },
    signatureEmail: {
        fontSize: 8,
        color: MUTED,
        marginBottom: 10,
    },
    // Blank signature line (for unsigned)
    signatureLine: {
        borderBottom: `1px solid ${DARK}`,
        marginBottom: 4,
        height: 32,
    },
    // Typed signature rendering
    typedSignatureContainer: {
        height: 32,
        justifyContent: "flex-end",
        borderBottom: `1px solid ${DARK}`,
        marginBottom: 4,
    },
    typedSignatureText: {
        fontSize: 18,
        fontFamily: "Helvetica-Oblique",
        color: DARK,
        marginBottom: 2,
    },
    // Drawn signature image
    signatureImage: {
        height: 48,
        objectFit: "contain",
        objectPositionX: "left",
        marginBottom: 4,
        borderBottom: `1px solid ${DARK}`,
    },
    signatureStatusLabel: {
        fontSize: 8,
        color: MUTED,
    },
    signatureStatusSigned: {
        fontSize: 8,
        color: GREEN,
        fontWeight: 700,
    },
    signatureStatusDeclined: {
        fontSize: 8,
        color: RED,
        fontWeight: 700,
    },
    signatureStatusPending: {
        fontSize: 8,
        color: AMBER,
    },
    signedDate: {
        fontSize: 8,
        color: MUTED,
        marginTop: 2,
    },
    // Footer
    footer: {
        position: "absolute",
        bottom: 28,
        left: 52,
        right: 52,
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        borderTop: `1px solid ${BORDER}`,
        paddingTop: 8,
    },
    footerText: {
        fontSize: 8,
        color: MUTED,
    },
    pageNumber: {
        fontSize: 8,
        color: MUTED,
    },
    // Audit trail page
    auditTable: {
        marginTop: 8,
    },
    auditHeaderRow: {
        flexDirection: "row",
        backgroundColor: BG_LIGHT,
        borderRadius: 4,
        paddingHorizontal: 8,
        paddingVertical: 5,
        marginBottom: 2,
    },
    auditRow: {
        flexDirection: "row",
        paddingHorizontal: 8,
        paddingVertical: 5,
        borderBottom: `1px solid ${BORDER}`,
    },
    auditRowAlt: {
        backgroundColor: BG_LIGHT,
    },
    auditColEvent: { width: "24%", fontSize: 9 },
    auditColActor: { width: "20%", fontSize: 9 },
    auditColDetail: { width: "36%", fontSize: 9 },
    auditColTime: { width: "20%", fontSize: 9 },
    auditHeaderText: {
        fontSize: 8,
        fontWeight: 700,
        color: MUTED,
        textTransform: "uppercase",
        letterSpacing: 0.8,
    },
    auditCellText: {
        fontSize: 8,
        color: DARK,
        lineHeight: 1.4,
    },
    auditCellMuted: {
        fontSize: 8,
        color: MUTED,
        lineHeight: 1.4,
    },
});

const AUDIT_EVENT_LABELS: Record<string, string> = {
    CONTRACT_CREATED:       "Created",
    VERSION_SAVED:          "Draft saved",
    STATUS_CHANGED:         "Status changed",
    REVIEWER_ASSIGNED:      "Reviewers assigned",
    APPROVED:               "Approved",
    REJECTED:               "Rejected",
    SIGNATORY_ADDED:        "Signatory added",
    SIGNATORY_REMOVED:      "Signatory removed",
    SIGNING_LINK_GENERATED: "Signing link sent",
    SIGNATORY_VIEWED:       "Link opened",
    SIGNATORY_SIGNED:       "Signed",
    SIGNATORY_DECLINED:     "Declined",
    CONTRACT_ACTIVATED:     "Activated",
    CONTRACT_EXPIRED:       "Expired",
    CONTRACT_TERMINATED:    "Terminated",
    SIGNED_PDF_STORED:      "PDF sealed",
};

function auditDetailSummary(eventType: string, details: Record<string, unknown> | null): string {
    if (!details) return "";
    switch (eventType) {
        case "STATUS_CHANGED": {
            const from = details.from as string | undefined;
            const to = details.to as string | undefined;
            return from && to ? `${from.replace(/_/g, " ")} → ${to.replace(/_/g, " ")}` : "";
        }
        case "APPROVED":
        case "REJECTED": {
            const comment = details.comment as string | undefined;
            return comment ? `"${comment}"` : "";
        }
        case "SIGNATORY_ADDED":
        case "SIGNATORY_REMOVED":
        case "SIGNING_LINK_GENERATED":
        case "SIGNATORY_VIEWED":
        case "SIGNATORY_SIGNED":
        case "SIGNATORY_DECLINED": {
            const name = details.legalName as string | undefined;
            const sigType = details.signatureType as string | undefined;
            const reason = details.reason as string | undefined;
            return [name, sigType ? `${sigType.toLowerCase()} sig` : null, reason ? `"${reason}"` : null]
                .filter(Boolean).join(" · ");
        }
        case "REVIEWER_ASSIGNED": {
            const count = (details.approverIds as string[] | undefined)?.length;
            const workflow = details.workflow as string | undefined;
            return [count !== undefined ? `${count} reviewer${count !== 1 ? "s" : ""}` : null, workflow?.toLowerCase()]
                .filter(Boolean).join(" · ");
        }
        case "SIGNED_PDF_STORED": {
            const sizeBytes = details.sizeBytes as number | undefined;
            return sizeBytes ? `${Math.round(sizeBytes / 1024)} KB` : "";
        }
        default:
            return "";
    }
}

function AuditTrailPage({
    auditLog,
    orgName,
    contractNumber,
}: {
    auditLog: AuditLogEntry[];
    orgName?: string;
    contractNumber?: string | null;
}) {
    const sorted = [...auditLog].sort(
        (a, b) => new Date(a.createdAt as string).getTime() - new Date(b.createdAt as string).getTime(),
    );
    const generatedAt = new Date().toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" });

    return (
        <Page size="A4" style={styles.page}>
            {/* Header band */}
            <View style={styles.headerBand} fixed>
                <View>
                    <Text style={styles.appName}>{orgName ?? "SimpleContracts"}</Text>
                    <Text style={styles.contractNumber}>{contractNumber ?? ""}</Text>
                </View>
                <Text style={styles.statusBadge}>Audit Trail</Text>
            </View>

            <Text style={{ fontSize: 16, fontWeight: 700, color: DARK, marginBottom: 4 }}>
                Activity Log
            </Text>
            <Text style={{ fontSize: 9, color: MUTED, marginBottom: 16 }}>
                Complete chronological record of all actions taken on this contract.
            </Text>

            {/* Table */}
            <View style={styles.auditTable}>
                {/* Header */}
                <View style={styles.auditHeaderRow}>
                    <View style={styles.auditColEvent}><Text style={styles.auditHeaderText}>Event</Text></View>
                    <View style={styles.auditColActor}><Text style={styles.auditHeaderText}>Actor</Text></View>
                    <View style={styles.auditColDetail}><Text style={styles.auditHeaderText}>Detail</Text></View>
                    <View style={styles.auditColTime}><Text style={styles.auditHeaderText}>Timestamp</Text></View>
                </View>

                {sorted.map((entry, idx) => {
                    const label = AUDIT_EVENT_LABELS[entry.eventType]
                        ?? entry.eventType.replace(/_/g, " ").toLowerCase();
                    const detail = auditDetailSummary(entry.eventType, entry.details as Record<string, unknown> | null);
                    const actor = entry.actorName ?? entry.actorEmail ?? "system";
                    const ts = new Date(entry.createdAt as string).toLocaleString("en-US", {
                        month: "short", day: "numeric", year: "numeric",
                        hour: "2-digit", minute: "2-digit",
                    });

                    return (
                        <View key={entry.id} style={[styles.auditRow, idx % 2 !== 0 ? styles.auditRowAlt : {}]}>
                            <View style={styles.auditColEvent}><Text style={styles.auditCellText}>{label}</Text></View>
                            <View style={styles.auditColActor}><Text style={styles.auditCellMuted}>{actor}</Text></View>
                            <View style={styles.auditColDetail}><Text style={styles.auditCellMuted}>{detail}</Text></View>
                            <View style={styles.auditColTime}><Text style={styles.auditCellMuted}>{ts}</Text></View>
                        </View>
                    );
                })}
            </View>

            {/* Footer */}
            <View style={styles.footer} fixed>
                <Text style={styles.footerText}>
                    Generated {generatedAt} · {contractNumber ?? ""}
                </Text>
                <Text
                    style={styles.pageNumber}
                    render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`}
                />
            </View>
        </Page>
    );
}

function formatDate(dateStr: string | null | undefined): string {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
    });
}

function formatDateTime(dateStr: string | null | undefined): string {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        timeZoneName: "short",
    });
}

function formatStatus(status: string): string {
    return status.replace(/_/g, " ");
}

interface ContractPdfDocumentProps {
    contract: ContractDetail;
    orgName?: string;
    signatories?: Signatory[];
    auditLog?: AuditLogEntry[];
}

function SignatoryBlock({ signatory, orgName }: { signatory: Signatory; orgName?: string }) {
    const sig = signatory.signatures[0];
    const status = sig?.status ?? "NOT_SENT";
    const isSigned = status === "SIGNED";
    const isDeclined = status === "DECLINED";

    const boxStyle = isSigned
        ? [styles.signatureBox, styles.signatureBoxSigned]
        : isDeclined
        ? [styles.signatureBox, styles.signatureBoxDeclined]
        : [styles.signatureBox, styles.signatureBoxPending];

    return (
        <View style={boxStyle}>
            <Text style={styles.signatureRole}>
                {signatory.title
                    ? `${signatory.title}${signatory.organization ? ` · ${signatory.organization}` : ""}`
                    : signatory.organization ?? "Signatory"}
            </Text>
            <Text style={styles.signatureName}>{signatory.legalName}</Text>
            {signatory.email && <Text style={styles.signatureEmail}>{signatory.email}</Text>}

            {isSigned && sig?.signatureType === "DRAWN" && sig?.signatureData ? (
                <Image src={sig.signatureData} style={styles.signatureImage} />
            ) : isSigned && sig?.signatureType === "TYPED" && sig?.signatureData ? (
                <View style={styles.typedSignatureContainer}>
                    <Text style={styles.typedSignatureText}>{sig.signatureData}</Text>
                </View>
            ) : (
                <View style={styles.signatureLine} />
            )}

            {isSigned ? (
                <>
                    <Text style={styles.signatureStatusSigned}>✓ Signed</Text>
                    {sig?.signedAt && (
                        <Text style={styles.signedDate}>{formatDateTime(sig.signedAt)}</Text>
                    )}
                    {sig?.ipAddress && (
                        <Text style={styles.signedDate}>IP: {sig.ipAddress}</Text>
                    )}
                </>
            ) : isDeclined ? (
                <Text style={styles.signatureStatusDeclined}>✗ Declined</Text>
            ) : (
                <Text style={styles.signatureStatusPending}>Awaiting signature</Text>
            )}
        </View>
    );
}

function FallbackSignatureBlock({ orgName, counterpartyName }: { orgName?: string; counterpartyName?: string | null }) {
    return (
        <View style={styles.signatureGrid}>
            <View style={styles.signatureBox}>
                <Text style={styles.signatureRole}>Issuing Party</Text>
                <Text style={styles.signatureName}>{orgName ?? "Organisation"}</Text>
                <Text style={styles.signatureOrg}> </Text>
                <View style={styles.signatureLine} />
                <Text style={styles.signatureStatusLabel}>Signature &amp; Date</Text>
            </View>
            <View style={styles.signatureBox}>
                <Text style={styles.signatureRole}>Counterparty</Text>
                <Text style={styles.signatureName}>{counterpartyName ?? "—"}</Text>
                <Text style={styles.signatureOrg}> </Text>
                <View style={styles.signatureLine} />
                <Text style={styles.signatureStatusLabel}>Signature &amp; Date</Text>
            </View>
        </View>
    );
}

export default function ContractPdfDocument({ contract, orgName, signatories, auditLog }: ContractPdfDocumentProps) {
    const contentNodes = htmlToPdfElements(contract.contentHtml);
    const generatedAt = new Date().toLocaleString("en-US", {
        dateStyle: "medium",
        timeStyle: "short",
    });

    const hasSignatories = signatories && signatories.length > 0;

    return (
        <Document
            title={contract.title}
            author={orgName ?? "SimpleContracts"}
            creator="SimpleContracts"
        >
            <Page size="A4" style={styles.page}>
                {/* Header band */}
                <View style={styles.headerBand} fixed>
                    <View>
                        <Text style={styles.appName}>{orgName ?? "SimpleContracts"}</Text>
                        <Text style={styles.contractNumber}>
                            {contract.contractNumber ?? contract.id}
                        </Text>
                    </View>
                    <Text style={styles.statusBadge}>{formatStatus(contract.status)}</Text>
                </View>

                {/* Title */}
                <Text style={styles.contractTitle}>{contract.title}</Text>
                {contract.contractType && (
                    <Text style={styles.contractType}>{contract.contractType.replace(/_/g, " ")}</Text>
                )}

                {/* Metadata grid */}
                <View style={styles.metaGrid}>
                    <View style={styles.metaCell}>
                        <Text style={styles.metaLabel}>Counterparty</Text>
                        <Text style={styles.metaValue}>{contract.counterpartyName ?? "—"}</Text>
                    </View>
                    <View style={styles.metaCell}>
                        <Text style={styles.metaLabel}>Version</Text>
                        <Text style={styles.metaValue}>v{contract.versionNumber}</Text>
                    </View>
                    <View style={styles.metaCell}>
                        <Text style={styles.metaLabel}>Effective Date</Text>
                        <Text style={styles.metaValue}>{formatDate(contract.effectiveAt)}</Text>
                    </View>
                    <View style={styles.metaCell}>
                        <Text style={styles.metaLabel}>Expiry Date</Text>
                        <Text style={styles.metaValue}>{formatDate(contract.expiresAt)}</Text>
                    </View>
                    <View style={styles.metaCell}>
                        <Text style={styles.metaLabel}>Created</Text>
                        <Text style={styles.metaValue}>{formatDate(contract.createdAt)}</Text>
                    </View>
                    <View style={styles.metaCell}>
                        <Text style={styles.metaLabel}>Last Updated</Text>
                        <Text style={styles.metaValue}>{formatDate(contract.updatedAt)}</Text>
                    </View>
                </View>

                {/* Description */}
                {contract.description && (
                    <View style={styles.descriptionBox}>
                        <Text style={styles.descriptionLabel}>Summary</Text>
                        <Text style={styles.descriptionText}>{contract.description}</Text>
                    </View>
                )}

                {/* Contract content */}
                <View style={styles.sectionDivider}>
                    <Text style={styles.sectionTitle}>Contract Terms</Text>
                </View>
                <View style={styles.contentArea}>
                    {contentNodes}
                </View>

                {/* Signature block */}
                <View style={styles.signatureSection}>
                    <Text style={styles.signatureTitle}>Signatures</Text>
                    {hasSignatories ? (
                        <View style={styles.signatureGrid}>
                            {signatories.map((s) => (
                                <SignatoryBlock key={s.id} signatory={s} orgName={orgName} />
                            ))}
                        </View>
                    ) : (
                        <FallbackSignatureBlock
                            orgName={orgName}
                            counterpartyName={contract.counterpartyName}
                        />
                    )}
                </View>

                {/* Footer */}
                <View style={styles.footer} fixed>
                    <Text style={styles.footerText}>
                        Generated {generatedAt} · {contract.contractNumber ?? contract.id}
                    </Text>
                    <Text
                        style={styles.pageNumber}
                        render={({ pageNumber, totalPages }) =>
                            `Page ${pageNumber} of ${totalPages}`
                        }
                    />
                </View>
            </Page>
            {auditLog && auditLog.length > 0 && (
                <AuditTrailPage
                    auditLog={auditLog}
                    orgName={orgName}
                    contractNumber={contract.contractNumber}
                />
            )}
        </Document>
    );
}
