import {
    Document,
    Page,
    Text,
    View,
    StyleSheet,
} from "@react-pdf/renderer";
import { htmlToPdfElements } from "@/utils/htmlToPdfElements";
import type { ContractDetail } from "@/store/services/contractApi";

const INDIGO = "#4f46e5";
const DARK = "#111827";
const MUTED = "#6b7280";
const BORDER = "#e5e7eb";
const BG_LIGHT = "#f9fafb";

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
    // Header band
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
    // Title block
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
    // Metadata grid
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
    // Description box
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
    // Section divider
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
    // Content area
    contentArea: {
        marginBottom: 24,
    },
    // Signature block
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
        gap: 20,
    },
    signatureBox: {
        flex: 1,
        border: `1px solid ${BORDER}`,
        borderRadius: 6,
        padding: 12,
    },
    signatureRole: {
        fontSize: 8,
        color: MUTED,
        textTransform: "uppercase",
        letterSpacing: 1,
        marginBottom: 4,
    },
    signatureName: {
        fontSize: 11,
        fontWeight: 700,
        color: DARK,
        marginBottom: 2,
    },
    signatureOrg: {
        fontSize: 9,
        color: MUTED,
        marginBottom: 16,
    },
    signatureLine: {
        borderBottom: `1px solid ${DARK}`,
        marginBottom: 4,
        height: 28,
    },
    signatureLineLabel: {
        fontSize: 8,
        color: MUTED,
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
});

function formatDate(dateStr: string | null | undefined): string {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
    });
}

function formatStatus(status: string): string {
    return status.replace(/_/g, " ");
}

interface ContractPdfDocumentProps {
    contract: ContractDetail;
    orgName?: string;
}

export default function ContractPdfDocument({ contract, orgName }: ContractPdfDocumentProps) {
    const contentNodes = htmlToPdfElements(contract.contentHtml);
    const generatedAt = new Date().toLocaleString("en-US", {
        dateStyle: "medium",
        timeStyle: "short",
    });

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
                    <View style={styles.signatureGrid}>
                        <View style={styles.signatureBox}>
                            <Text style={styles.signatureRole}>Issuing Party</Text>
                            <Text style={styles.signatureName}>{orgName ?? "Organisation"}</Text>
                            <Text style={styles.signatureOrg}> </Text>
                            <View style={styles.signatureLine} />
                            <Text style={styles.signatureLineLabel}>Signature &amp; Date</Text>
                        </View>
                        <View style={styles.signatureBox}>
                            <Text style={styles.signatureRole}>Counterparty</Text>
                            <Text style={styles.signatureName}>{contract.counterpartyName ?? "—"}</Text>
                            <Text style={styles.signatureOrg}> </Text>
                            <View style={styles.signatureLine} />
                            <Text style={styles.signatureLineLabel}>Signature &amp; Date</Text>
                        </View>
                    </View>
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
        </Document>
    );
}
