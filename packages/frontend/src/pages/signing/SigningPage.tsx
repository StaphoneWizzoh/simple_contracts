import { useRef, useState } from "react";
import { useParams } from "react-router-dom";
import SignatureCanvas from "react-signature-canvas";
import DOMPurify from "dompurify";
import { toast } from "sonner";
import {
    useGetSigningContextQuery,
    useSubmitSignatureMutation,
    useDeclineSignatureMutation,
} from "@/store/services/signingApi";

function getErrorMessage(error: unknown): string {
    if (!error || typeof error !== "object") return "Request failed";
    const e = error as { data?: { message?: string; statusMessage?: string }; error?: string };
    return e.data?.message || e.data?.statusMessage || e.error || "Request failed";
}

export default function SigningPage() {
    const { token } = useParams<{ token: string }>();
    const { data, isLoading, error } = useGetSigningContextQuery(token!, { skip: !token });
    const [submitSignature, { isLoading: isSubmitting }] = useSubmitSignatureMutation();
    const [declineSignature, { isLoading: isDeclining }] = useDeclineSignatureMutation();

    const [mode, setMode] = useState<"TYPED" | "DRAWN">("TYPED");
    const [typedName, setTypedName] = useState("");
    const [consent, setConsent] = useState(false);
    const [showDeclineForm, setShowDeclineForm] = useState(false);
    const [declineReason, setDeclineReason] = useState("");
    const [done, setDone] = useState<"signed" | "declined" | null>(null);
    const sigPadRef = useRef<SignatureCanvas>(null);

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-950 flex items-center justify-center">
                <p className="text-gray-400">Loading signing page…</p>
            </div>
        );
    }

    if (error || !data) {
        const errMsg = getErrorMessage(error);
        return (
            <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
                <div className="max-w-md text-center space-y-3">
                    <div className="text-4xl">🔒</div>
                    <h1 className="text-xl font-bold text-white">Link Unavailable</h1>
                    <p className="text-gray-400 text-sm">{errMsg}</p>
                </div>
            </div>
        );
    }

    if (done === "signed") {
        return (
            <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
                <div className="max-w-md text-center space-y-4">
                    <div className="text-5xl">✅</div>
                    <h1 className="text-2xl font-bold text-white">Contract Signed</h1>
                    <p className="text-gray-400 text-sm">
                        Thank you, <strong className="text-white">{data.signatory.legalName}</strong>. Your signature has been recorded.
                    </p>
                    <p className="text-xs text-gray-500">You may close this window.</p>
                </div>
            </div>
        );
    }

    if (done === "declined") {
        return (
            <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
                <div className="max-w-md text-center space-y-4">
                    <div className="text-5xl">❌</div>
                    <h1 className="text-2xl font-bold text-white">Signing Declined</h1>
                    <p className="text-gray-400 text-sm">You have declined to sign this contract. The sender has been notified.</p>
                    <p className="text-xs text-gray-500">You may close this window.</p>
                </div>
            </div>
        );
    }

    if (data.signatureStatus === "SIGNED") {
        return (
            <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
                <div className="max-w-md text-center space-y-3">
                    <div className="text-4xl">✅</div>
                    <h1 className="text-xl font-bold text-white">Already Signed</h1>
                    <p className="text-gray-400 text-sm">This contract has already been signed.</p>
                </div>
            </div>
        );
    }

    if (data.signatureStatus === "DECLINED") {
        return (
            <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
                <div className="max-w-md text-center space-y-3">
                    <div className="text-4xl">❌</div>
                    <h1 className="text-xl font-bold text-white">Already Declined</h1>
                    <p className="text-gray-400 text-sm">You previously declined to sign this contract.</p>
                </div>
            </div>
        );
    }

    const signatureType = data.contract.signatureType; // TYPED | DRAWN | BOTH
    const showTyped = signatureType === "TYPED" || signatureType === "BOTH";
    const showDrawn = signatureType === "DRAWN" || signatureType === "BOTH";
    const effectiveMode = signatureType === "TYPED" ? "TYPED" : signatureType === "DRAWN" ? "DRAWN" : mode;

    const canSign = consent && (
        effectiveMode === "TYPED"
            ? typedName.trim().length > 0
            : !sigPadRef.current?.isEmpty()
    );

    const handleSign = async () => {
        let signatureData = "";
        if (effectiveMode === "TYPED") {
            signatureData = typedName.trim();
        } else {
            signatureData = sigPadRef.current?.toDataURL("image/png") ?? "";
        }

        try {
            await submitSignature({ token: token!, signatureData, signatureType: effectiveMode }).unwrap();
            setDone("signed");
        } catch (err) {
            toast.error(getErrorMessage(err));
        }
    };

    const handleDecline = async () => {
        try {
            await declineSignature({ token: token!, reason: declineReason || undefined }).unwrap();
            setDone("declined");
        } catch (err) {
            toast.error(getErrorMessage(err));
        }
    };

    return (
        <div className="min-h-screen bg-gray-950 text-gray-100">
            {/* Header */}
            <header className="border-b border-gray-800 px-6 py-4">
                <p className="text-xs font-semibold uppercase tracking-widest text-indigo-400">SimpleContracts</p>
                <h1 className="text-lg font-bold text-white mt-0.5">Signing Request</h1>
            </header>

            <div className="mx-auto max-w-3xl px-4 py-8 space-y-6">
                {/* Signatory info */}
                <section className="rounded-2xl border border-gray-700/50 bg-gray-900/60 p-5 space-y-1">
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Requested for</p>
                    <p className="text-lg font-semibold text-white">{data.signatory.legalName}</p>
                    {data.signatory.title && <p className="text-sm text-gray-400">{data.signatory.title}</p>}
                    {data.signatory.organization && <p className="text-sm text-gray-400">{data.signatory.organization}</p>}
                    {data.signatory.email && <p className="text-sm text-gray-500">{data.signatory.email}</p>}
                    <p className="text-xs text-gray-600 pt-1">
                        Link expires {new Date(data.expiresAt).toLocaleDateString()}
                    </p>
                </section>

                {/* Contract content */}
                <section className="rounded-2xl border border-gray-700/50 bg-gray-900/60 p-5">
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-3">
                        {data.contract.title}
                    </p>
                    <div
                        className="prose prose-invert prose-sm max-w-none text-gray-300 max-h-[50vh] overflow-y-auto pr-2"
                        dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(data.contract.contentHtml) }}
                    />
                </section>

                {/* Signature section */}
                <section className="rounded-2xl border border-indigo-500/20 bg-gray-900/60 p-5 space-y-5">
                    <h2 className="text-sm font-semibold uppercase tracking-wide text-indigo-300">Your Signature</h2>

                    {/* Mode toggle (only shown when BOTH types are accepted) */}
                    {showTyped && showDrawn && (
                        <div className="flex rounded-lg border border-gray-700 overflow-hidden w-fit">
                            <button
                                type="button"
                                onClick={() => setMode("TYPED")}
                                className={`px-4 py-2 text-xs font-semibold transition ${mode === "TYPED" ? "bg-indigo-600 text-white" : "bg-gray-800 text-gray-400 hover:text-gray-200"}`}
                            >
                                Type Name
                            </button>
                            <button
                                type="button"
                                onClick={() => setMode("DRAWN")}
                                className={`px-4 py-2 text-xs font-semibold transition ${mode === "DRAWN" ? "bg-indigo-600 text-white" : "bg-gray-800 text-gray-400 hover:text-gray-200"}`}
                            >
                                Draw Signature
                            </button>
                        </div>
                    )}

                    {/* Typed name input */}
                    {(effectiveMode === "TYPED") && (
                        <div className="space-y-2">
                            <label className="text-xs text-gray-400">Type your full legal name</label>
                            <input
                                value={typedName}
                                onChange={(e) => setTypedName(e.target.value)}
                                placeholder="Jane Doe"
                                className="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-3 text-lg font-serif italic text-white outline-none ring-indigo-500 focus:ring-2 placeholder:text-gray-500"
                            />
                            {typedName && (
                                <p className="text-2xl font-serif italic text-indigo-200 pl-1">{typedName}</p>
                            )}
                        </div>
                    )}

                    {/* Drawn signature pad */}
                    {(effectiveMode === "DRAWN") && (
                        <div className="space-y-2">
                            <label className="text-xs text-gray-400">Draw your signature below</label>
                            <div
                                className="rounded-xl border-2 border-dashed border-gray-600 bg-white overflow-hidden"
                                role="img"
                                aria-label="Signature drawing area"
                            >
                                <SignatureCanvas
                                    ref={sigPadRef}
                                    penColor="black"
                                    canvasProps={{
                                        className: "w-full",
                                        height: 160,
                                        "aria-label": "Draw your signature here",
                                    }}
                                />
                            </div>
                            <button
                                type="button"
                                onClick={() => sigPadRef.current?.clear()}
                                className="text-xs text-gray-500 hover:text-gray-300 underline"
                                aria-label="Clear signature drawing"
                            >
                                Clear
                            </button>
                        </div>
                    )}

                    {/* Consent checkbox */}
                    <label className="flex items-start gap-3 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={consent}
                            onChange={(e) => setConsent(e.target.checked)}
                            className="mt-0.5 h-4 w-4 rounded border-gray-600 bg-gray-800 text-indigo-600 focus:ring-indigo-500"
                        />
                        <span className="text-sm text-gray-300">
                            I agree this is my legal electronic signature and I consent to signing this document electronically.
                        </span>
                    </label>

                    {/* Actions */}
                    <div className="flex flex-wrap gap-3 pt-1">
                        <button
                            type="button"
                            onClick={handleSign}
                            disabled={!canSign || isSubmitting}
                            className="rounded-lg bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {isSubmitting ? "Submitting…" : "Sign Document"}
                        </button>
                        <button
                            type="button"
                            onClick={() => setShowDeclineForm((v) => !v)}
                            className="rounded-lg border border-red-500/40 bg-red-900/10 px-4 py-2.5 text-sm font-semibold text-red-400 hover:bg-red-900/20"
                        >
                            Decline
                        </button>
                    </div>

                    {/* Decline form */}
                    {showDeclineForm && (
                        <div className="rounded-xl border border-red-500/30 bg-red-950/20 p-4 space-y-3">
                            <p className="text-xs text-red-300 font-semibold">Reason for declining (optional)</p>
                            <textarea
                                value={declineReason}
                                onChange={(e) => setDeclineReason(e.target.value)}
                                placeholder="Provide a reason…"
                                rows={3}
                                className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-gray-100 outline-none placeholder:text-gray-500"
                            />
                            <div className="flex gap-2">
                                <button
                                    type="button"
                                    onClick={handleDecline}
                                    disabled={isDeclining}
                                    className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-500 disabled:opacity-50"
                                >
                                    {isDeclining ? "Declining…" : "Confirm Decline"}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setShowDeclineForm(false)}
                                    className="text-sm text-gray-500 hover:text-gray-300"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    )}
                </section>

                <p className="text-center text-xs text-gray-600 pb-6">
                    This document is secured by SimpleContracts. Your signature is legally binding.
                </p>
            </div>
        </div>
    );
}
