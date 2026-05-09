import { useState } from "react";
import { toast } from "sonner";
import {
    useGetSignatoriesQuery,
    useAddSignatoryMutation,
    useRemoveSignatoryMutation,
    useGenerateSigningLinkMutation,
} from "@/store/services/signingApi";

interface Props {
    contractId: string;
    contractTitle: string;
    contractStatus: string;
    userPermissions: string[];
}

type LinkData = { url: string; expiresAt: string };

function getErrorMessage(error: unknown): string {
    if (!error || typeof error !== "object") return "Request failed";
    const e = error as { data?: { message?: string; statusMessage?: string }; error?: string };
    return e.data?.message || e.data?.statusMessage || e.error || "Request failed";
}

const STATUS_BADGE: Record<string, string> = {
    PENDING: "text-yellow-300 bg-yellow-400/10 border-yellow-400/30",
    VIEWED: "text-blue-300 bg-blue-400/10 border-blue-400/30",
    SIGNED: "text-emerald-300 bg-emerald-400/10 border-emerald-400/30",
    DECLINED: "text-red-300 bg-red-400/10 border-red-400/30",
};

const STATUS_LABEL: Record<string, string> = {
    PENDING: "Awaiting link",
    VIEWED: "Link opened",
    SIGNED: "Signed",
    DECLINED: "Declined",
    NOT_SENT: "No link yet",
};

function buildMailtoHref(email: string, contractTitle: string, signingUrl: string, signatoryName: string): string {
    const subject = encodeURIComponent(`Action required: Please sign "${contractTitle}"`);
    const body = encodeURIComponent(
        `Hi ${signatoryName},\n\nYou have been requested to review and sign the following contract:\n\n"${contractTitle}"\n\nPlease click the link below to open the signing page:\n\n${signingUrl}\n\nThis link is unique to you. Please do not share it.\n\nIf you have any questions, please contact the sender directly.\n\nThank you.`,
    );
    return `mailto:${email}?subject=${subject}&body=${body}`;
}

export default function ContractSignatoryPanel({ contractId, contractTitle, contractStatus, userPermissions }: Props) {
    const canManage = userPermissions?.includes?.("send_for_signing") ?? false;
    const isSentForSigning = contractStatus === "SENT_FOR_SIGNING";

    const { data, isLoading } = useGetSignatoriesQuery(contractId);
    const [addSignatory, { isLoading: isAdding }] = useAddSignatoryMutation();
    const [removeSignatory] = useRemoveSignatoryMutation();
    const [generateLink, { isLoading: isGenerating }] = useGenerateSigningLinkMutation();

    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState({ legalName: "", email: "", title: "", organization: "", signingOrder: "" });
    const [generatingFor, setGeneratingFor] = useState<string | null>(null);
    const [linkData, setLinkData] = useState<Record<string, LinkData>>({});

    const signatories = data?.signatories ?? [];
    const pendingCount = signatories.filter((s) => {
        const status = s.signatures[0]?.status ?? "NOT_SENT";
        return status !== "SIGNED" && status !== "DECLINED";
    }).length;

    const handleAdd = async () => {
        if (!form.legalName.trim() || !form.email.trim()) {
            toast.error("Name and email are required");
            return;
        }
        try {
            await addSignatory({
                contractId,
                legalName: form.legalName.trim(),
                email: form.email.trim(),
                title: form.title.trim() || undefined,
                organization: form.organization.trim() || undefined,
                signingOrder: form.signingOrder ? parseInt(form.signingOrder) : undefined,
            }).unwrap();
            toast.success("Signatory added");
            setForm({ legalName: "", email: "", title: "", organization: "", signingOrder: "" });
            setShowForm(false);
        } catch (err) {
            toast.error(getErrorMessage(err));
        }
    };

    const handleRemove = async (partyId: string) => {
        try {
            await removeSignatory({ contractId, partyId }).unwrap();
            toast.success("Signatory removed");
        } catch (err) {
            toast.error(getErrorMessage(err));
        }
    };

    const handleGenerateLink = async (partyId: string, signatoryEmail: string | null) => {
        setGeneratingFor(partyId);
        try {
            const result = await generateLink({ contractId, partyId }).unwrap();
            const fullUrl = `${window.location.origin}${result.signingUrl}`;
            setLinkData((prev) => ({ ...prev, [partyId]: { url: fullUrl, expiresAt: result.expiresAt } }));

            if (signatoryEmail) {
                toast.success("Signing link ready — use Send Email or Copy Link to share it.");
            } else {
                await navigator.clipboard.writeText(fullUrl);
                toast.success("Signing link copied to clipboard");
            }
        } catch (err) {
            toast.error(getErrorMessage(err));
        } finally {
            setGeneratingFor(null);
        }
    };

    const handleCopyLink = async (partyId: string) => {
        const link = linkData[partyId]?.url;
        if (!link) return;
        await navigator.clipboard.writeText(link);
        toast.success("Link copied to clipboard");
    };

    return (
        <section className="rounded-2xl border border-violet-500/20 bg-gray-900/60 p-5 space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                    <h2 className="text-sm font-semibold uppercase tracking-wide text-violet-300">Signatories</h2>
                    <p className="text-xs text-gray-500 mt-0.5">
                        {isSentForSigning
                            ? "Generate a signing link for each signatory, then send it to them via email."
                            : "Add signatories before sending for signing."}
                    </p>
                </div>
                {canManage && !isSentForSigning && (
                    <button
                        type="button"
                        onClick={() => setShowForm((v) => !v)}
                        className="rounded-lg border border-violet-500/40 bg-violet-900/20 px-3 py-1.5 text-xs font-semibold text-violet-300 hover:bg-violet-800/30"
                    >
                        {showForm ? "Cancel" : "+ Add Signatory"}
                    </button>
                )}
            </div>

            {/* Action-needed banner — shown when the contract is awaiting signatures */}
            {isSentForSigning && pendingCount > 0 && canManage && (
                <div className="rounded-xl border border-amber-500/30 bg-amber-950/20 px-4 py-3 flex items-start gap-3">
                    <span className="text-amber-400 text-base mt-0.5">⚠</span>
                    <div className="text-xs text-amber-200 space-y-1">
                        <p className="font-semibold">
                            {pendingCount} {pendingCount === 1 ? "signatory has" : "signatories have"} not yet received a signing link.
                        </p>
                        <p className="text-amber-300/70">
                            Generate a link for each signatory below, then use <strong>Send Email</strong> or <strong>Copy Link</strong> to share it with them. Signatories will not be notified automatically.
                        </p>
                    </div>
                </div>
            )}

            {/* Add signatory form */}
            {showForm && (
                <div className="rounded-xl border border-gray-700 bg-gray-800/60 p-4 space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <label className="flex flex-col gap-1">
                            <span className="text-xs text-gray-400">Full Name *</span>
                            <input
                                value={form.legalName}
                                onChange={(e) => setForm((f) => ({ ...f, legalName: e.target.value }))}
                                placeholder="Jane Doe"
                                className="rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-gray-100 outline-none ring-violet-500 focus:ring-2 placeholder:text-gray-500"
                            />
                        </label>
                        <label className="flex flex-col gap-1">
                            <span className="text-xs text-gray-400">Email *</span>
                            <input
                                type="email"
                                value={form.email}
                                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                                placeholder="jane@example.com"
                                className="rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-gray-100 outline-none ring-violet-500 focus:ring-2 placeholder:text-gray-500"
                            />
                        </label>
                        <label className="flex flex-col gap-1">
                            <span className="text-xs text-gray-400">Title</span>
                            <input
                                value={form.title}
                                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                                placeholder="CEO"
                                className="rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-gray-100 outline-none ring-violet-500 focus:ring-2 placeholder:text-gray-500"
                            />
                        </label>
                        <label className="flex flex-col gap-1">
                            <span className="text-xs text-gray-400">Organisation</span>
                            <input
                                value={form.organization}
                                onChange={(e) => setForm((f) => ({ ...f, organization: e.target.value }))}
                                placeholder="Acme Inc"
                                className="rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-gray-100 outline-none ring-violet-500 focus:ring-2 placeholder:text-gray-500"
                            />
                        </label>
                        <label className="flex flex-col gap-1">
                            <span className="text-xs text-gray-400">Signing Order (for sequential)</span>
                            <input
                                type="number"
                                min="1"
                                value={form.signingOrder}
                                onChange={(e) => setForm((f) => ({ ...f, signingOrder: e.target.value }))}
                                placeholder="1"
                                className="rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-gray-100 outline-none ring-violet-500 focus:ring-2 placeholder:text-gray-500"
                            />
                        </label>
                    </div>
                    <div className="flex gap-2">
                        <button
                            type="button"
                            onClick={handleAdd}
                            disabled={isAdding}
                            className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-500 disabled:opacity-50"
                        >
                            {isAdding ? "Adding…" : "Add Signatory"}
                        </button>
                        <button
                            type="button"
                            onClick={() => setShowForm(false)}
                            className="text-sm text-gray-500 hover:text-gray-300"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}

            {/* Signatory list */}
            {isLoading ? (
                <p className="text-sm text-gray-500">Loading…</p>
            ) : signatories.length === 0 ? (
                <p className="text-sm text-gray-500 italic">No signatories added yet.</p>
            ) : (
                <ul className="space-y-3">
                    {signatories.map((s) => {
                        const latestSig = s.signatures[0];
                        const status = latestSig?.status ?? "NOT_SENT";
                        const currentLink = linkData[s.id];
                        const hasLink = Boolean(currentLink);
                        const canShare = isSentForSigning && canManage && status !== "SIGNED" && status !== "DECLINED";

                        return (
                            <li key={s.id} className="rounded-xl border border-gray-700/60 bg-gray-800/40 p-4">
                                <div className="flex flex-col gap-3">
                                    {/* Signatory details row */}
                                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                                        <div className="space-y-0.5">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <span className="text-sm font-semibold text-gray-100">{s.legalName}</span>
                                                {s.title && <span className="text-xs text-gray-400">{s.title}</span>}
                                                {s.organization && <span className="text-xs text-gray-500">· {s.organization}</span>}
                                            </div>
                                            {s.email && <p className="text-xs text-gray-400">{s.email}</p>}
                                            {s.signingOrder !== null && (
                                                <p className="text-xs text-gray-500">Signing order: {s.signingOrder}</p>
                                            )}
                                            <span className={`inline-block mt-1 text-xs font-semibold px-2 py-0.5 rounded-full border ${STATUS_BADGE[status] ?? "text-gray-400 bg-gray-400/10 border-gray-400/30"}`}>
                                                {STATUS_LABEL[status] ?? status}
                                            </span>
                                            {latestSig?.signedAt && (
                                                <p className="text-xs text-gray-500 ml-0.5">
                                                    {new Date(latestSig.signedAt).toLocaleString()}
                                                </p>
                                            )}
                                            {latestSig?.declinedAt && (
                                                <p className="text-xs text-red-400 ml-0.5">
                                                    Declined {new Date(latestSig.declinedAt).toLocaleString()}
                                                </p>
                                            )}
                                        </div>

                                        {/* Action buttons */}
                                        <div className="flex flex-wrap gap-2 shrink-0">
                                            {canShare && (
                                                <button
                                                    type="button"
                                                    onClick={() => handleGenerateLink(s.id, s.email)}
                                                    disabled={isGenerating && generatingFor === s.id}
                                                    className="rounded-lg border border-violet-500/40 bg-violet-900/20 px-3 py-1.5 text-xs font-semibold text-violet-300 hover:bg-violet-800/30 disabled:opacity-50"
                                                >
                                                    {isGenerating && generatingFor === s.id
                                                        ? "Generating…"
                                                        : hasLink ? "Regenerate Link" : "Generate Link"}
                                                </button>
                                            )}
                                            {!isSentForSigning && canManage && (
                                                <button
                                                    type="button"
                                                    onClick={() => handleRemove(s.id)}
                                                    className="rounded-lg border border-red-500/30 bg-red-900/10 px-3 py-1.5 text-xs font-semibold text-red-400 hover:bg-red-800/20"
                                                >
                                                    Remove
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    {/* Link sharing row — only shown after generation */}
                                    {canShare && hasLink && currentLink && (
                                        <div className="rounded-lg border border-violet-500/20 bg-violet-950/20 px-3 py-2.5 space-y-2">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <span className="text-xs text-violet-300 font-semibold">Signing link ready</span>
                                                <span className="text-xs text-gray-500">
                                                    · expires {new Date(currentLink.expiresAt).toLocaleDateString()}
                                                </span>
                                            </div>
                                            <p className="text-xs text-gray-500 font-mono break-all leading-relaxed">
                                                {currentLink.url}
                                            </p>
                                            <p className="text-xs text-amber-300/70">
                                                Share this link with <strong className="text-amber-200">{s.legalName}</strong>. They do not need an account to sign.
                                            </p>
                                            <div className="flex flex-wrap gap-2 pt-0.5">
                                                {s.email && (
                                                    <a
                                                        href={buildMailtoHref(s.email, contractTitle, currentLink.url, s.legalName)}
                                                        className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-500"
                                                    >
                                                        ✉ Send Email
                                                    </a>
                                                )}
                                                <button
                                                    type="button"
                                                    onClick={() => handleCopyLink(s.id)}
                                                    className="rounded-lg border border-gray-600 bg-gray-700/40 px-3 py-1.5 text-xs font-semibold text-gray-300 hover:bg-gray-700"
                                                >
                                                    Copy Link
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </li>
                        );
                    })}
                </ul>
            )}
        </section>
    );
}
