import { useState } from "react";
import { toast } from "sonner";
import Select from "react-select";
import {
    useGetApprovalsQuery,
    useAssignReviewersMutation,
    useApproveContractMutation,
    useRejectContractMutation,
    useSendForSigningMutation,
} from "@/store/services/contractApi";
import { useGetMembersQuery } from "@/store/services/orgApi";
import type { ContractApproval } from "@/store/services/contractApi";

function getErrorMessage(error: unknown): string {
    if (!error || typeof error !== "object") return "Request failed";
    const e = error as { data?: { message?: string; statusMessage?: string } };
    return e.data?.message || e.data?.statusMessage || "Request failed";
}

function ApprovalStatusBadge({ status }: { status: ContractApproval["status"] }) {
    const cls = {
        PENDING: "bg-yellow-400/10 text-yellow-300 border-yellow-400/30",
        APPROVED: "bg-emerald-400/10 text-emerald-300 border-emerald-400/30",
        REJECTED: "bg-red-400/10 text-red-300 border-red-400/30",
    }[status];
    const label = { PENDING: "Pending", APPROVED: "Approved", REJECTED: "Rejected" }[status];
    return (
        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${cls}`}>
            {label}
        </span>
    );
}

type Props = {
    contractId: string;
    contractStatus: string;
    currentUserId: string;
    userPermissions: string[];
};

export default function ContractApprovalPanel({
    contractId,
    contractStatus,
    currentUserId,
    userPermissions,
}: Props) {
    const [showAssignForm, setShowAssignForm] = useState(false);
    const [selectedApprovers, setSelectedApprovers] = useState<string[]>([]);
    const [workflow, setWorkflow] = useState<"SEQUENTIAL" | "SIMULTANEOUS">("SIMULTANEOUS");
    const [approveComment, setApproveComment] = useState("");
    const [rejectComment, setRejectComment] = useState("");
    const [showRejectForm, setShowRejectForm] = useState(false);
    const [actioningId, setActioningId] = useState<string | null>(null);

    const { data: approvalsData, isLoading: loadingApprovals } = useGetApprovalsQuery(contractId);
    const { data: membersData } = useGetMembersQuery();

    const [assignReviewers, { isLoading: assigning }] = useAssignReviewersMutation();
    const [approveContract, { isLoading: approving }] = useApproveContractMutation();
    const [rejectContract, { isLoading: rejecting }] = useRejectContractMutation();
    const [sendForSigning, { isLoading: sending }] = useSendForSigningMutation();

    const canAssign = userPermissions.includes("approve_contracts");
    const canSendForSigning = userPermissions.includes("send_for_signing");

    const approvals = approvalsData?.approvals ?? [];
    const myPendingApproval = approvals.find(
        (a) => a.approverId === currentUserId && a.status === "PENDING",
    );
    const allApproved =
        approvals.length > 0 && approvals.every((a) => a.status === "APPROVED");
    const hasRejection = approvals.some((a) => a.status === "REJECTED");
    const hasPending = approvals.some((a) => a.status === "PENDING");
    const canSend = canSendForSigning && !hasPending;

    const memberOptions =
        membersData?.members.map((m) => ({
            value: m.userId,
            label: `${m.name} (${m.email})`,
        })) ?? [];

    const handleAssign = async () => {
        if (selectedApprovers.length === 0) {
            toast.error("Select at least one approver");
            return;
        }
        try {
            await assignReviewers({
                contractId,
                approverIds: selectedApprovers,
                workflow,
            }).unwrap();
            toast.success("Reviewers assigned");
            setShowAssignForm(false);
            setSelectedApprovers([]);
        } catch (err) {
            toast.error(getErrorMessage(err));
        }
    };

    const handleApprove = async (approvalId: string) => {
        setActioningId(approvalId);
        try {
            await approveContract({ contractId, comment: approveComment || undefined }).unwrap();
            toast.success("Contract approved");
            setApproveComment("");
        } catch (err) {
            toast.error(getErrorMessage(err));
        } finally {
            setActioningId(null);
        }
    };

    const handleReject = async () => {
        try {
            await rejectContract({ contractId, comment: rejectComment || undefined }).unwrap();
            toast.success("Contract rejected — moved back to Draft");
            setShowRejectForm(false);
            setRejectComment("");
        } catch (err) {
            toast.error(getErrorMessage(err));
        }
    };

    const handleSendForSigning = async () => {
        try {
            await sendForSigning(contractId).unwrap();
            toast.success("Contract sent for signing");
        } catch (err) {
            toast.error(getErrorMessage(err));
        }
    };

    if (contractStatus !== "REVIEW") return null;

    return (
        <section className="rounded-2xl border border-blue-500/20 bg-gray-900/50 p-5 flex flex-col gap-5">
            <div className="flex items-center justify-between flex-wrap gap-3">
                <h2 className="text-sm font-semibold text-blue-300 uppercase tracking-wide">
                    Review & Approval
                </h2>
                <div className="flex gap-2 flex-wrap">
                    {canAssign && (
                        <button
                            type="button"
                            onClick={() => setShowAssignForm((v) => !v)}
                            className="rounded-lg border border-blue-500/40 bg-blue-900/30 px-3 py-1.5 text-xs font-semibold text-blue-300 hover:bg-blue-800/40 transition"
                        >
                            {showAssignForm ? "Cancel" : "Assign Reviewers"}
                        </button>
                    )}
                    {canSend && (
                        <button
                            type="button"
                            onClick={handleSendForSigning}
                            disabled={sending}
                            className="rounded-lg bg-violet-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-violet-500 disabled:opacity-50 transition"
                        >
                            {sending ? "Sending…" : "Send for Signing"}
                        </button>
                    )}
                    {hasPending && canSendForSigning && (
                        <span className="text-xs text-gray-400 self-center">
                            Waiting on {approvals.filter((a) => a.status === "PENDING").length} approval(s)
                        </span>
                    )}
                </div>
            </div>

            {/* Assign form */}
            {showAssignForm && (
                <div className="rounded-xl border border-blue-500/20 bg-blue-950/20 p-4 flex flex-col gap-3">
                    <p className="text-xs text-gray-400">
                        Select org members to assign as approvers for this contract.
                    </p>
                    <Select
                        isMulti
                        options={memberOptions}
                        value={memberOptions.filter((o) => selectedApprovers.includes(o.value))}
                        onChange={(selected) =>
                            setSelectedApprovers(selected.map((s) => s.value))
                        }
                        placeholder="Select approvers…"
                        styles={{
                            control: (base) => ({
                                ...base,
                                backgroundColor: "#1f2937",
                                borderColor: "#374151",
                                color: "#f3f4f6",
                            }),
                            menu: (base) => ({ ...base, backgroundColor: "#1f2937" }),
                            option: (base, state) => ({
                                ...base,
                                backgroundColor: state.isFocused ? "#374151" : "#1f2937",
                                color: "#f3f4f6",
                            }),
                            multiValue: (base) => ({ ...base, backgroundColor: "#312e81" }),
                            multiValueLabel: (base) => ({ ...base, color: "#c7d2fe" }),
                            input: (base) => ({ ...base, color: "#f3f4f6" }),
                        }}
                    />
                    <div className="flex items-center gap-4">
                        <span className="text-xs text-gray-400">Workflow:</span>
                        {(["SIMULTANEOUS", "SEQUENTIAL"] as const).map((w) => (
                            <label key={w} className="flex items-center gap-1.5 cursor-pointer">
                                <input
                                    type="radio"
                                    value={w}
                                    checked={workflow === w}
                                    onChange={() => setWorkflow(w)}
                                    className="accent-indigo-500"
                                />
                                <span className="text-sm text-gray-300">{w === "SIMULTANEOUS" ? "Simultaneous" : "Sequential"}</span>
                            </label>
                        ))}
                    </div>
                    <div className="flex gap-2">
                        <button
                            type="button"
                            onClick={handleAssign}
                            disabled={assigning || selectedApprovers.length === 0}
                            className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-500 disabled:opacity-50"
                        >
                            {assigning ? "Assigning…" : "Assign"}
                        </button>
                        <button
                            type="button"
                            onClick={() => setShowAssignForm(false)}
                            className="rounded-lg border border-gray-700 px-3 py-1.5 text-xs font-medium text-gray-400 hover:text-gray-100"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}

            {/* Approvals list */}
            {loadingApprovals ? (
                <p className="text-sm text-gray-500">Loading approvals…</p>
            ) : approvals.length === 0 ? (
                <p className="text-sm text-gray-500">
                    No reviewers assigned.{" "}
                    {canSendForSigning && "You can send for signing directly, or assign reviewers first."}
                </p>
            ) : (
                <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
                        <span>Workflow:</span>
                        <span className="font-medium text-gray-300">
                            {approvalsData?.approvalWorkflow === "SEQUENTIAL" ? "Sequential" : "Simultaneous"}
                        </span>
                        {allApproved && (
                            <span className="text-emerald-400 font-semibold ml-2">✓ All approved</span>
                        )}
                        {hasRejection && (
                            <span className="text-red-400 font-semibold ml-2">✗ Rejected</span>
                        )}
                    </div>
                    {approvals.map((a) => (
                        <div
                            key={a.id}
                            className="flex items-center justify-between gap-3 rounded-lg border border-gray-800 bg-gray-900 px-4 py-2.5"
                        >
                            <div className="flex items-center gap-3 min-w-0">
                                {approvalsData?.approvalWorkflow === "SEQUENTIAL" && (
                                    <span className="text-xs text-gray-500 shrink-0">#{a.order + 1}</span>
                                )}
                                <div className="min-w-0">
                                    <p className="text-sm font-medium text-gray-200 truncate">{a.approverName}</p>
                                    <p className="text-xs text-gray-500 truncate">{a.approverEmail}</p>
                                    {a.comment && (
                                        <p className="text-xs text-gray-400 mt-0.5 italic">"{a.comment}"</p>
                                    )}
                                </div>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                                <ApprovalStatusBadge status={a.status} />
                                {a.actedAt && (
                                    <span className="text-xs text-gray-600">
                                        {new Date(a.actedAt).toLocaleDateString()}
                                    </span>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* My action area */}
            {myPendingApproval && (
                <div className="border-t border-gray-800 pt-4 flex flex-col gap-3">
                    <p className="text-sm font-medium text-gray-200">Your action required</p>
                    <textarea
                        value={approveComment}
                        onChange={(e) => setApproveComment(e.target.value)}
                        placeholder="Optional comment…"
                        rows={2}
                        className="rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-gray-100 outline-none ring-indigo-500 focus:ring-2 resize-none placeholder:text-gray-500"
                    />
                    <div className="flex gap-2">
                        <button
                            type="button"
                            onClick={() => handleApprove(myPendingApproval.id)}
                            disabled={approving && actioningId === myPendingApproval.id}
                            className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500 disabled:opacity-50"
                        >
                            {approving ? "Approving…" : "Approve"}
                        </button>
                        <button
                            type="button"
                            onClick={() => setShowRejectForm((v) => !v)}
                            className="rounded-lg border border-red-500/40 bg-red-900/20 px-4 py-2 text-sm font-semibold text-red-300 hover:bg-red-800/30"
                        >
                            Reject
                        </button>
                    </div>
                    {showRejectForm && (
                        <div className="flex flex-col gap-2 rounded-lg border border-red-500/30 bg-red-950/20 p-3">
                            <p className="text-xs text-red-300">
                                Rejecting will move this contract back to Draft status.
                            </p>
                            <textarea
                                value={rejectComment}
                                onChange={(e) => setRejectComment(e.target.value)}
                                placeholder="Rejection reason (recommended)…"
                                rows={2}
                                className="rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-gray-100 outline-none resize-none placeholder:text-gray-500"
                            />
                            <div className="flex gap-2">
                                <button
                                    type="button"
                                    onClick={handleReject}
                                    disabled={rejecting}
                                    className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-500 disabled:opacity-50"
                                >
                                    {rejecting ? "Rejecting…" : "Confirm Rejection"}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setShowRejectForm(false)}
                                    className="text-xs text-gray-500 hover:text-gray-300"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Reject action for approve_contracts holders */}
            {!myPendingApproval && canAssign && !hasRejection && approvals.length > 0 && (
                <div className="border-t border-gray-800 pt-4">
                    <button
                        type="button"
                        onClick={() => setShowRejectForm((v) => !v)}
                        className="rounded-lg border border-red-500/40 bg-red-900/20 px-3 py-1.5 text-xs font-semibold text-red-300 hover:bg-red-800/30"
                    >
                        Reject Contract
                    </button>
                    {showRejectForm && (
                        <div className="mt-3 flex flex-col gap-2 rounded-lg border border-red-500/30 bg-red-950/20 p-3">
                            <p className="text-xs text-red-300">
                                Rejecting will move this contract back to Draft status.
                            </p>
                            <textarea
                                value={rejectComment}
                                onChange={(e) => setRejectComment(e.target.value)}
                                placeholder="Rejection reason…"
                                rows={2}
                                className="rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-gray-100 outline-none resize-none placeholder:text-gray-500"
                            />
                            <div className="flex gap-2">
                                <button
                                    type="button"
                                    onClick={handleReject}
                                    disabled={rejecting}
                                    className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-500 disabled:opacity-50"
                                >
                                    {rejecting ? "Rejecting…" : "Confirm Rejection"}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setShowRejectForm(false)}
                                    className="text-xs text-gray-500 hover:text-gray-300"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </section>
    );
}
