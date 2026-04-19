import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { PDFDownloadLink } from "@react-pdf/renderer";
import { toast } from "sonner";

import ContractEditor from "@/components/contracts/ContractEditor";
import ContractPdfDocument from "@/components/contracts/ContractPdfDocument";
import { useGetCurrentUserQuery, useLogoutMutation } from "@/store/services/authApi";
import {
    useGetContractQuery,
    usePublishContractMutation,
    useSaveDraftMutation,
} from "@/store/services/contractApi";

function getErrorMessage(error: unknown): string {
    if (!error || typeof error !== "object") return "Request failed";
    const e = error as { data?: { message?: string; statusMessage?: string }; error?: string };
    return e.data?.message || e.data?.statusMessage || e.error || "Request failed";
}

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

    const { data: currentUser, isLoading: isSessionLoading } = useGetCurrentUserQuery();
    const [logout] = useLogoutMutation();

    const { data: existingContract, isLoading: isLoadingContract } = useGetContractQuery(
        routeId!,
        { skip: !routeId },
    );

    const [saveDraft, { isLoading: isSavingDraft }] = useSaveDraftMutation();
    const [publishContract, { isLoading: isPublishing }] = usePublishContractMutation();

    const isLoggedIn = Boolean(currentUser?.id);

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
        } catch (error) {
            toast.error(`Could not save draft: ${getErrorMessage(error)}`);
        }
    };

    const handlePublish = async () => {
        if (!isLoggedIn) { toast.error("Please login to publish."); return; }
        if (!contractId) { toast.error("Save a draft first before publishing."); return; }
        try {
            const response = await publishContract({
                contractId,
                title,
                description,
                counterpartyName,
                contentHtml: draftHtml,
            }).unwrap();
            toast.success(`Contract moved to ${response.status} (v${response.versionNumber})`);
        } catch (error) {
            toast.error(`Could not publish: ${getErrorMessage(error)}`);
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

    return (
        <main className="min-h-screen bg-linear-to-br from-gray-950 via-gray-900 to-gray-950 px-4 py-10 md:px-10">
            <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">

                <header className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                    <div>
                        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-indigo-300/80">
                            {isEditMode ? "Edit Contract" : "New Contract"}
                        </p>
                        <h1 className="text-3xl font-bold tracking-tight text-white md:text-4xl">
                            {isEditMode ? title : "New Contract Draft"}
                        </h1>
                        {isEditMode && existingContract && (
                            <p className="mt-1 text-sm text-gray-400">
                                Status:{" "}
                                <span className="font-medium text-indigo-300">
                                    {existingContract.status}
                                </span>{" "}
                                · v{existingContract.versionNumber}
                            </p>
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
                            onChange={(e) => setTitle(e.target.value)}
                            className="rounded-lg border border-gray-700 bg-gray-800 px-4 py-2.5 text-gray-100 outline-none ring-indigo-500 placeholder:text-gray-500 focus:ring-2"
                            placeholder="MSA — Acme Inc"
                        />
                    </label>

                    <label className="flex flex-col gap-2">
                        <span className="text-sm font-medium text-gray-200">Counterparty</span>
                        <input
                            value={counterpartyName}
                            onChange={(e) => setCounterpartyName(e.target.value)}
                            className="rounded-lg border border-gray-700 bg-gray-800 px-4 py-2.5 text-gray-100 outline-none ring-indigo-500 placeholder:text-gray-500 focus:ring-2"
                            placeholder="Acme Inc"
                        />
                    </label>

                    <label className="flex flex-col gap-2 md:col-span-3">
                        <span className="text-sm font-medium text-gray-200">Summary</span>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="min-h-16 rounded-lg border border-gray-700 bg-gray-800 px-4 py-2.5 text-gray-100 outline-none ring-indigo-500 placeholder:text-gray-500 focus:ring-2"
                            placeholder="Short summary of the contract intent"
                        />
                    </label>

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
                                    Not logged in — save is disabled.{" "}
                                    <button
                                        onClick={() => navigate("/auth/login")}
                                        className="underline hover:text-amber-300"
                                    >
                                        Login
                                    </button>
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
                                onClick={handlePublish}
                                disabled={!isLoggedIn || isPublishing || !contractId}
                                className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                {isPublishing ? "Publishing…" : "Publish Contract"}
                            </button>
                        </div>
                    </div>

                    {contractId && (
                        <p className="md:col-span-3 text-xs text-gray-500">
                            Contract ID: {contractId}
                        </p>
                    )}
                </section>

                {/* Editor */}
                <ContractEditor
                    key={initialContent ?? "new"}
                    initialContent={initialContent}
                    onChange={setDraftHtml}
                />
            </div>
        </main>
    );
}
