import { useState } from "react";
import { useNavigate } from "react-router-dom";

import ContractEditor from "@/components/contracts/ContractEditor";
import { useGetCurrentUserQuery } from "@/store/authApi";
import {
    usePublishContractMutation,
    useSaveDraftMutation,
} from "@/store/contractApi";

function getErrorMessage(error: unknown): string {
    if (!error || typeof error !== "object") {
        return "Request failed";
    }

    const maybeError = error as {
        data?: { message?: string; statusMessage?: string };
        error?: string;
    };

    return (
        maybeError.data?.message ||
        maybeError.data?.statusMessage ||
        maybeError.error ||
        "Request failed"
    );
}

export default function ContractEditorPage() {
    const navigate = useNavigate();
    const [draftHtml, setDraftHtml] = useState("");
    const [title, setTitle] = useState("Service Agreement");
    const [description, setDescription] = useState("");
    const [counterpartyName, setCounterpartyName] = useState("");
    const [contractId, setContractId] = useState<string | undefined>(undefined);
    const [notice, setNotice] = useState<string>("");

    const {
        data: currentUser,
        isLoading: isSessionLoading,
        isError: isSessionError,
    } = useGetCurrentUserQuery();
    const [saveDraft, { isLoading: isSavingDraft }] = useSaveDraftMutation();
    const [publishContract, { isLoading: isPublishing }] =
        usePublishContractMutation();

    const isLoggedIn = Boolean(currentUser?.id);

    const handleSaveDraft = async () => {
        if (!isLoggedIn) {
            setNotice("Please login to save drafts.");
            return;
        }

        try {
            const response = await saveDraft({
                contractId,
                title,
                description,
                counterpartyName,
                contentHtml: draftHtml,
            }).unwrap();

            setContractId(response.contractId);
            setNotice(
                `Draft saved: ${response.contractId} (v${response.versionNumber})`,
            );
        } catch (error) {
            setNotice(`Could not save draft: ${getErrorMessage(error)}`);
        }
    };

    const handlePublish = async () => {
        if (!isLoggedIn) {
            setNotice("Please login to publish a contract.");
            return;
        }

        if (!contractId) {
            setNotice("Save a draft first before publishing.");
            return;
        }

        try {
            const response = await publishContract({
                contractId,
                title,
                description,
                counterpartyName,
                contentHtml: draftHtml,
            }).unwrap();

            setNotice(
                `Contract moved to ${response.status} (v${response.versionNumber})`,
            );
        } catch (error) {
            setNotice(`Could not publish contract: ${getErrorMessage(error)}`);
        }
    };

    return (
        <main className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 px-4 py-10 md:px-10">
            <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
                <header className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                    <div>
                        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-indigo-300/80">
                            Contracts
                        </p>
                        <h1 className="text-3xl font-bold tracking-tight text-white md:text-4xl">
                            New Contract Draft
                        </h1>
                        <p className="mt-2 max-w-2xl text-gray-300">
                            This editor is powered by Tiptap and can be
                            connected directly to your Prisma contract schema
                            for autosave, versioning, and signature workflows.
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={() => navigate("/")}
                        className="inline-flex items-center rounded-lg border border-gray-700 bg-gray-800 px-4 py-2 text-sm font-medium text-gray-100 transition hover:bg-gray-700"
                    >
                        Back to Landing
                    </button>
                </header>

                <section className="grid gap-4 rounded-2xl border border-indigo-500/20 bg-gray-900/60 p-5 md:grid-cols-3">
                    <label className="flex flex-col gap-2 md:col-span-2">
                        <span className="text-sm font-medium text-gray-200">
                            Contract title
                        </span>
                        <input
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="rounded-lg border border-gray-700 bg-gray-800 px-4 py-2.5 text-gray-100 outline-none ring-indigo-500 placeholder:text-gray-500 focus:ring-2"
                            placeholder="MSA - Acme Inc"
                        />
                    </label>

                    <label className="flex flex-col gap-2">
                        <span className="text-sm font-medium text-gray-200">
                            Counterparty
                        </span>
                        <input
                            value={counterpartyName}
                            onChange={(e) =>
                                setCounterpartyName(e.target.value)
                            }
                            className="rounded-lg border border-gray-700 bg-gray-800 px-4 py-2.5 text-gray-100 outline-none ring-indigo-500 placeholder:text-gray-500 focus:ring-2"
                            placeholder="Acme Inc"
                        />
                    </label>

                    <label className="flex flex-col gap-2 md:col-span-3">
                        <span className="text-sm font-medium text-gray-200">
                            Summary
                        </span>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="min-h-20 rounded-lg border border-gray-700 bg-gray-800 px-4 py-2.5 text-gray-100 outline-none ring-indigo-500 placeholder:text-gray-500 focus:ring-2"
                            placeholder="Short summary of the contract intent"
                        />
                    </label>

                    <div className="md:col-span-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="text-sm text-gray-300">
                            {isSessionLoading && "Checking session..."}
                            {!isSessionLoading &&
                                isLoggedIn &&
                                `Logged in as ${currentUser?.email}`}
                            {!isSessionLoading &&
                                !isLoggedIn &&
                                "You are not logged in. Save is disabled until login."}
                            {isSessionError &&
                                " Session check failed. Verify backend health endpoint."}
                        </div>
                        <div className="flex flex-wrap gap-3">
                            <button
                                type="button"
                                onClick={handleSaveDraft}
                                disabled={
                                    !isLoggedIn ||
                                    isSavingDraft ||
                                    !title ||
                                    !draftHtml
                                }
                                className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                {isSavingDraft ? "Saving..." : "Save Draft"}
                            </button>
                            <button
                                type="button"
                                onClick={handlePublish}
                                disabled={
                                    !isLoggedIn || isPublishing || !contractId
                                }
                                className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                {isPublishing
                                    ? "Publishing..."
                                    : "Publish Contract"}
                            </button>
                        </div>
                    </div>
                    {notice && (
                        <p className="md:col-span-3 text-sm text-indigo-200">
                            {notice}
                        </p>
                    )}
                    {contractId && (
                        <p className="md:col-span-3 text-xs text-gray-400">
                            Contract ID: {contractId}
                        </p>
                    )}
                </section>

                <ContractEditor onChange={setDraftHtml} />

                <section className="rounded-2xl border border-gray-700 bg-gray-900/60 p-5 shadow-sm">
                    <h2 className="text-lg font-semibold text-white">
                        Draft HTML Preview
                    </h2>
                    <p className="mt-1 text-sm text-gray-400">
                        You can post this content to an API endpoint and store
                        it as the current contract version.
                    </p>
                    <pre className="mt-4 max-h-72 overflow-auto rounded-lg bg-black/50 p-4 text-xs text-gray-100">
                        {draftHtml ||
                            "Start typing in the editor to see serialized HTML output..."}
                    </pre>
                </section>
            </div>
        </main>
    );
}
