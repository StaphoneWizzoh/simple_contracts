import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { PDFDownloadLink } from "@react-pdf/renderer";
import { toast } from "sonner";

import ContractEditor from "@/components/contracts/ContractEditor";
import ContractPdfDocument from "@/components/contracts/ContractPdfDocument";
import ContractSettingsPanel from "@/components/contracts/ContractSettingsPanel";
import ContractApprovalPanel from "@/components/contracts/ContractApprovalPanel";
import ContractSignatoryPanel from "@/components/contracts/ContractSignatoryPanel";
import ContractAuditLogPanel from "@/components/contracts/ContractAuditLogPanel";
import { useGetCurrentUserQuery, useLogoutMutation } from "@/store/services/authApi";
import { useGetOrgQuery } from "@/store/services/orgApi";
import { useGetSignatoriesQuery } from "@/store/services/signingApi";
import {
    useGetContractQuery,
    usePublishContractMutation,
    useSaveDraftMutation,
    useTerminateContractMutation,
} from "@/store/services/contractApi";

function getErrorMessage(error: unknown): string {
    if (!error || typeof error !== "object") return "Request failed";
    const e = error as { data?: { message?: string; statusMessage?: string }; error?: string };
    return e.data?.message || e.data?.statusMessage || e.error || "Request failed";
}

const STATUS_LABEL: Record<string, string> = {
    DRAFT: "Draft",
    REVIEW: "In Review",
    SENT_FOR_SIGNING: "Sent for Signing",
    ACTIVE: "Active",
    EXPIRED: "Expired",
    TERMINATED: "Terminated",
};

const STATUS_COLOR: Record<string, string> = {
    DRAFT: "text-yellow-300 bg-yellow-400/10 border-yellow-400/30",
    REVIEW: "text-blue-300 bg-blue-400/10 border-blue-400/30",
    SENT_FOR_SIGNING: "text-violet-300 bg-violet-400/10 border-violet-400/30",
    ACTIVE: "text-emerald-300 bg-emerald-400/10 border-emerald-400/30",
    EXPIRED: "text-gray-400 bg-gray-400/10 border-gray-400/30",
    TERMINATED: "text-red-300 bg-red-400/10 border-red-400/30",
};

export default function ContractEditorPage() {
    const navigate = useNavigate();
    const { id: routeId } = useParams<{ id?: string }>();
    const isEditMode = Boolean(routeId);

    const [draftHtml, setDraftHtml] = useState("");
    const [title, setTitle] = useState("Service Agreement");
    const [description, setDescription] = useState("");
    const [counterpartyName, setCounterpartyName] = useState("");
    const [contractId, setContractId] = useState<string | undefined>(routeId);
    const [initialContent, setInitialContent] = useState<string | undefined>(undefined);
    const [terminateReason, setTerminateReason] = useState("");
    const [showTerminateForm, setShowTerminateForm] = useState(false);

    const { data: currentUser, isLoading: isSessionLoading } = useGetCurrentUserQuery();
    const { data: orgData } = useGetOrgQuery(undefined, { skip: !currentUser?.id });
    const [logout] = useLogoutMutation();

    const { data: existingContract, isLoading: isLoadingContract } = useGetContractQuery(
        routeId!,
        { skip: !routeId },
    );

    const { data: signatoriesData } = useGetSignatoriesQuery(routeId!, { skip: !routeId });
    const signatories = signatoriesData?.signatories ?? [];

    const [saveDraft, { isLoading: isSavingDraft }] = useSaveDraftMutation();
    const [publishContract, { isLoading: isPublishing }] = usePublishContractMutation();
    const [terminateContract, { isLoading: isTerminating }] = useTerminateContractMutation();

    const isLoggedIn = Boolean(currentUser?.id);
    const userPermissions = orgData?.permissions ?? [];
    const isDraft = existingContract?.status === "DRAFT" || !isEditMode;
    const isReview = existingContract?.status === "REVIEW";
    const isActive = existingContract?.status === "ACTIVE";
    const isSentForSigning = existingContract?.status === "SENT_FOR_SIGNING";
    const isLocked = isEditMode && !isDraft;

    useEffect(() => {
        if (existingContract) {
            setTitle(existingContract.title);
            setDescription(existingContract.description ?? "");
            setCounterpartyName(existingContract.counterpartyName ?? "");
            setContractId(existingContract.id);
            setInitialContent(existingContract.contentHtml);
        }
    }, [existingContract]);

    const handleSaveDraft = async () => {
        if (!isLoggedIn) { toast.error("Please login to save drafts."); return; }
        try {
            const response = await saveDraft({
                contractId,
                title,
                description,
                counterpartyName,
                contentHtml: draftHtml,
            }).unwrap();
            setContractId(response.contractId);
            toast.success(`Draft saved (v${response.versionNumber})`);
            if (!routeId) navigate(`/contracts/${response.contractId}`, { replace: true });
        } catch (error) {
            toast.error(`Could not save draft: ${getErrorMessage(error)}`);
        }
    };

    const handleSubmitForReview = async () => {
        if (!isLoggedIn) { toast.error("Please login."); return; }
        if (!contractId) { toast.error("Save a draft first."); return; }
        try {
            const response = await publishContract({
                contractId,
                title,
                description,
                counterpartyName,
                contentHtml: draftHtml,
            }).unwrap();
            toast.success(`Contract submitted for review (v${response.versionNumber})`);
        } catch (error) {
            toast.error(`Could not submit: ${getErrorMessage(error)}`);
        }
    };

    const handleTerminate = async () => {
        if (!contractId) return;
        try {
            await terminateContract({ contractId, reason: terminateReason || undefined }).unwrap();
            toast.success("Contract terminated");
            setShowTerminateForm(false);
        } catch (error) {
            toast.error(getErrorMessage(error));
        }
    };

    const handleLogout = async () => {
        await logout();
        navigate("/auth/login");
    };

    if (isEditMode && isLoadingContract) {
        return (
            <main className="min-h-screen bg-linear-to-br from-gray-950 via-gray-900 to-gray-950 flex items-center justify-center">
                <p className="text-gray-400">Loading contract…</p>
            </main>
        );
    }

    const contractStatus = existingContract?.status ?? "DRAFT";

    return (
        <main className="min-h-screen bg-linear-to-br from-gray-950 via-gray-900 to-gray-950 px-4 py-10 md:px-10">
            <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">

                {/* Header */}
                <header className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                    <div>
                        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-indigo-300/80">
                            {isEditMode ? "Contract" : "New Contract"}
                        </p>
                        <h1 className="text-3xl font-bold tracking-tight text-white md:text-4xl">
                            {isEditMode ? title : "New Contract Draft"}
                        </h1>
                        {isEditMode && existingContract && (
                            <div className="mt-1.5 flex flex-wrap items-center gap-2">
                                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${STATUS_COLOR[contractStatus] ?? STATUS_COLOR.DRAFT}`}>
                                    {STATUS_LABEL[contractStatus] ?? contractStatus}
                                </span>
                                <span className="text-sm text-gray-500">
                                    v{existingContract.versionNumber}
                                </span>
                                {existingContract.contractNumber && (
                                    <span className="text-sm text-gray-500">
                                        · {existingContract.contractNumber}
                                    </span>
                                )}
                                {existingContract.terminatedAt && (
                                    <span className="text-sm text-red-400">
                                        Terminated {new Date(existingContract.terminatedAt).toLocaleDateString()}
                                        {existingContract.terminationReason && ` — ${existingContract.terminationReason}`}
                                    </span>
                                )}
                            </div>
                        )}
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <button
                            type="button"
                            onClick={() => navigate("/contracts")}
                            className="inline-flex items-center rounded-lg border border-gray-700 bg-gray-800 px-4 py-2 text-sm font-medium text-gray-100 hover:bg-gray-700"
                        >
                            My Contracts
                        </button>
                        {isEditMode && existingContract && (
                            <PDFDownloadLink
                                document={
                                    <ContractPdfDocument
                                        contract={{
                                            ...existingContract,
                                            contentHtml: draftHtml || existingContract.contentHtml,
                                        }}
                                        orgName={orgData?.org?.name}
                                        signatories={signatories.length > 0 ? signatories : undefined}
                                    />
                                }
                                fileName={`${existingContract.contractNumber ?? existingContract.id}-${existingContract.title.replace(/\s+/g, "-").toLowerCase()}.pdf`}
                                className="inline-flex items-center rounded-lg border border-indigo-500/50 bg-indigo-900/40 px-4 py-2 text-sm font-medium text-indigo-300 transition hover:bg-indigo-800/50 hover:text-indigo-100"
                            >
                                {({ loading }) => loading ? "Preparing PDF…" : "Download PDF"}
                            </PDFDownloadLink>
                        )}
                        {isLoggedIn && (
                            <button
                                type="button"
                                onClick={handleLogout}
                                className="inline-flex items-center rounded-lg border border-gray-700 bg-gray-800 px-4 py-2 text-sm font-medium text-gray-400 hover:bg-gray-700 hover:text-gray-100"
                            >
                                Logout
                            </button>
                        )}
                    </div>
                </header>

                {/* Metadata */}
                <section className="grid gap-4 rounded-2xl border border-indigo-500/20 bg-gray-900/60 p-5 md:grid-cols-3">
                    <label className="flex flex-col gap-2 md:col-span-2">
                        <span className="text-sm font-medium text-gray-200">Contract title</span>
                        <input
                            value={title}
                            disabled={isLocked}
                            onChange={(e) => setTitle(e.target.value)}
                            className="rounded-lg border border-gray-700 bg-gray-800 px-4 py-2.5 text-gray-100 outline-none ring-indigo-500 placeholder:text-gray-500 focus:ring-2 disabled:opacity-60 disabled:cursor-not-allowed"
                            placeholder="MSA — Acme Inc"
                        />
                    </label>

                    <label className="flex flex-col gap-2">
                        <span className="text-sm font-medium text-gray-200">Counterparty</span>
                        <input
                            value={counterpartyName}
                            disabled={isLocked}
                            onChange={(e) => setCounterpartyName(e.target.value)}
                            className="rounded-lg border border-gray-700 bg-gray-800 px-4 py-2.5 text-gray-100 outline-none ring-indigo-500 placeholder:text-gray-500 focus:ring-2 disabled:opacity-60 disabled:cursor-not-allowed"
                            placeholder="Acme Inc"
                        />
                    </label>

                    <label className="flex flex-col gap-2 md:col-span-3">
                        <span className="text-sm font-medium text-gray-200">Summary</span>
                        <textarea
                            value={description}
                            disabled={isLocked}
                            onChange={(e) => setDescription(e.target.value)}
                            className="min-h-16 rounded-lg border border-gray-700 bg-gray-800 px-4 py-2.5 text-gray-100 outline-none ring-indigo-500 placeholder:text-gray-500 focus:ring-2 disabled:opacity-60 disabled:cursor-not-allowed"
                            placeholder="Short summary of the contract intent"
                        />
                    </label>

                    {/* Action bar — DRAFT */}
                    {isDraft && (
                        <div className="md:col-span-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div className="text-sm text-gray-400">
                                {isSessionLoading && "Checking session…"}
                                {!isSessionLoading && isLoggedIn && (
                                    <span>
                                        Logged in as{" "}
                                        <span className="text-indigo-300">{currentUser?.email}</span>
                                    </span>
                                )}
                                {!isSessionLoading && !isLoggedIn && (
                                    <span className="text-amber-400">
                                        Not logged in —{" "}
                                        <button onClick={() => navigate("/auth/login")} className="underline hover:text-amber-300">Login</button>
                                    </span>
                                )}
                            </div>
                            <div className="flex flex-wrap gap-3">
                                <button
                                    type="button"
                                    onClick={handleSaveDraft}
                                    disabled={!isLoggedIn || isSavingDraft || !title || !draftHtml}
                                    className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    {isSavingDraft ? "Saving…" : "Save Draft"}
                                </button>
                                <button
                                    type="button"
                                    onClick={handleSubmitForReview}
                                    disabled={!isLoggedIn || isPublishing || !contractId}
                                    className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    {isPublishing ? "Submitting…" : "Submit for Review"}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Locked status banner */}
                    {isLocked && (
                        <div className="md:col-span-3 rounded-lg bg-blue-950/30 border border-blue-500/20 px-4 py-2.5 text-sm text-blue-300">
                            This contract is <strong>{STATUS_LABEL[contractStatus]}</strong> and cannot be edited.
                            {isReview && " Use the approval panel below to approve, reject, or send for signing."}
                        </div>
                    )}

                    {contractId && (
                        <p className="md:col-span-3 text-xs text-gray-500">
                            Contract ID: {contractId}
                        </p>
                    )}
                </section>

                {/* Contract Settings Panel */}
                {existingContract && (
                    <ContractSettingsPanel
                        contract={existingContract}
                        isEditable={isDraft || isReview}
                    />
                )}

                {/* Approval Panel (REVIEW status only) */}
                {isEditMode && existingContract && isReview && currentUser?.id && (
                    <ContractApprovalPanel
                        contractId={existingContract.id}
                        contractStatus={existingContract.status}
                        currentUserId={currentUser.id}
                        userPermissions={userPermissions}
                    />
                )}

                {/* Signatory Panel (pre-signing and signing stage) */}
                {isEditMode && existingContract && (isReview || isSentForSigning || isActive) && (
                    <ContractSignatoryPanel
                        contractId={existingContract.id}
                        contractTitle={existingContract.title}
                        contractStatus={existingContract.status}
                        userPermissions={userPermissions}
                    />
                )}

                {/* Terminate action (ACTIVE only) */}
                {isActive && userPermissions.includes("manage_org") && (
                    <section className="rounded-2xl border border-red-500/20 bg-gray-900/50 p-5">
                        <div className="flex items-center justify-between flex-wrap gap-3">
                            <div>
                                <h2 className="text-sm font-semibold text-red-300 uppercase tracking-wide">Danger Zone</h2>
                                <p className="text-xs text-gray-500 mt-0.5">Terminating a contract is irreversible.</p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setShowTerminateForm((v) => !v)}
                                className="rounded-lg border border-red-500/40 bg-red-900/20 px-3 py-1.5 text-xs font-semibold text-red-300 hover:bg-red-800/30"
                            >
                                Terminate Contract
                            </button>
                        </div>
                        {showTerminateForm && (
                            <div className="mt-4 flex flex-col gap-3 rounded-lg border border-red-500/30 bg-red-950/20 p-4">
                                <input
                                    value={terminateReason}
                                    onChange={(e) => setTerminateReason(e.target.value)}
                                    placeholder="Reason for termination (optional)"
                                    className="rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-gray-100 outline-none placeholder:text-gray-500"
                                />
                                <div className="flex gap-2">
                                    <button
                                        type="button"
                                        onClick={handleTerminate}
                                        disabled={isTerminating}
                                        className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-500 disabled:opacity-50"
                                    >
                                        {isTerminating ? "Terminating…" : "Confirm Termination"}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setShowTerminateForm(false)}
                                        className="text-sm text-gray-500 hover:text-gray-300"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        )}
                    </section>
                )}

                {/* Audit log — all existing contracts */}
                {isEditMode && existingContract && (
                    <ContractAuditLogPanel contractId={existingContract.id} />
                )}

                {/* Content Editor (DRAFT) or Read-only view (all other statuses) */}
                {isDraft ? (
                    <ContractEditor
                        key={initialContent ?? "new"}
                        initialContent={initialContent}
                        onChange={setDraftHtml}
                    />
                ) : existingContract ? (
                    <section className="rounded-2xl border border-gray-700/60 bg-gray-900/60 p-6">
                        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-4">
                            Contract Content — Read Only
                        </p>
                        <div
                            className="prose prose-invert prose-sm max-w-none text-gray-300"
                            dangerouslySetInnerHTML={{ __html: existingContract.contentHtml }}
                        />
                    </section>
                ) : null}
            </div>
        </main>
    );
}
