import { useGetAuditLogQuery } from "@/store/services/contractApi";

interface Props {
    contractId: string;
}

const EVENT_CONFIG: Record<string, { label: string; icon: string; color: string }> = {
    CONTRACT_CREATED:       { label: "Contract created",           icon: "📄", color: "text-indigo-300 bg-indigo-500/10 border-indigo-500/30" },
    VERSION_SAVED:          { label: "Draft saved",                icon: "💾", color: "text-gray-300 bg-gray-500/10 border-gray-500/30" },
    STATUS_CHANGED:         { label: "Status changed",             icon: "🔄", color: "text-blue-300 bg-blue-500/10 border-blue-500/30" },
    REVIEWER_ASSIGNED:      { label: "Reviewers assigned",         icon: "👥", color: "text-blue-300 bg-blue-500/10 border-blue-500/30" },
    APPROVED:               { label: "Approved",                   icon: "✅", color: "text-emerald-300 bg-emerald-500/10 border-emerald-500/30" },
    REJECTED:               { label: "Rejected",                   icon: "❌", color: "text-red-300 bg-red-500/10 border-red-500/30" },
    SIGNATORY_ADDED:        { label: "Signatory added",            icon: "➕", color: "text-violet-300 bg-violet-500/10 border-violet-500/30" },
    SIGNATORY_REMOVED:      { label: "Signatory removed",          icon: "➖", color: "text-gray-300 bg-gray-500/10 border-gray-500/30" },
    SIGNING_LINK_GENERATED: { label: "Signing link generated",     icon: "🔗", color: "text-violet-300 bg-violet-500/10 border-violet-500/30" },
    SIGNATORY_VIEWED:       { label: "Signing link opened",        icon: "👁",  color: "text-blue-300 bg-blue-500/10 border-blue-500/30" },
    SIGNATORY_SIGNED:       { label: "Contract signed",            icon: "✍️",  color: "text-emerald-300 bg-emerald-500/10 border-emerald-500/30" },
    SIGNATORY_DECLINED:     { label: "Signing declined",           icon: "🚫", color: "text-red-300 bg-red-500/10 border-red-500/30" },
    CONTRACT_ACTIVATED:     { label: "Contract activated",         icon: "🟢", color: "text-emerald-300 bg-emerald-500/10 border-emerald-500/30" },
    CONTRACT_EXPIRED:       { label: "Contract expired",           icon: "⏰", color: "text-gray-400 bg-gray-500/10 border-gray-500/30" },
    CONTRACT_TERMINATED:    { label: "Contract terminated",        icon: "🔴", color: "text-red-300 bg-red-500/10 border-red-500/30" },
};

function formatDateTime(dateStr: string): string {
    return new Date(dateStr).toLocaleString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
}

function EventDetail({ eventType, details }: { eventType: string; details: Record<string, unknown> | null }) {
    if (!details) return null;

    switch (eventType) {
        case "STATUS_CHANGED": {
            const from = details.from as string | undefined;
            const to = details.to as string | undefined;
            const reason = details.reason as string | undefined;
            return (
                <span className="text-xs text-gray-400">
                    {from && to ? (
                        <>
                            <span className="text-gray-500">{from.replace(/_/g, " ")}</span>
                            {" → "}
                            <span className="text-gray-300">{to.replace(/_/g, " ")}</span>
                        </>
                    ) : null}
                    {reason && <span className="text-gray-500"> · {reason}</span>}
                </span>
            );
        }

        case "APPROVED":
        case "REJECTED": {
            const comment = details.comment as string | undefined;
            const approverName = details.approverName as string | undefined;
            return (
                <span className="text-xs text-gray-400">
                    {approverName && <span>{approverName}</span>}
                    {comment && <span className="text-gray-500"> · "{comment}"</span>}
                </span>
            );
        }

        case "SIGNATORY_ADDED":
        case "SIGNATORY_REMOVED":
        case "SIGNING_LINK_GENERATED":
        case "SIGNATORY_VIEWED":
        case "SIGNATORY_SIGNED":
        case "SIGNATORY_DECLINED": {
            const name = details.legalName as string | undefined;
            const email = details.email as string | undefined;
            const sigType = details.signatureType as string | undefined;
            const reason = details.reason as string | undefined;
            const ip = details.ipAddress as string | undefined;
            return (
                <span className="text-xs text-gray-400">
                    {name && <span className="text-gray-200">{name}</span>}
                    {email && <span className="text-gray-500"> &lt;{email}&gt;</span>}
                    {sigType && <span className="text-gray-500"> · {sigType.toLowerCase()} signature</span>}
                    {reason && <span className="text-gray-500"> · "{reason}"</span>}
                    {ip && <span className="text-gray-600"> · {ip}</span>}
                </span>
            );
        }

        case "REVIEWER_ASSIGNED": {
            const count = (details.approverIds as string[] | undefined)?.length;
            const workflow = details.workflow as string | undefined;
            return (
                <span className="text-xs text-gray-400">
                    {count !== undefined && <span>{count} reviewer{count !== 1 ? "s" : ""}</span>}
                    {workflow && <span className="text-gray-500"> · {workflow.toLowerCase()}</span>}
                </span>
            );
        }

        default:
            return null;
    }
}

export default function ContractAuditLogPanel({ contractId }: Props) {
    const { data, isLoading } = useGetAuditLogQuery(contractId);
    const logs = data?.auditLog ?? [];

    // Sort chronologically for timeline display (oldest first)
    const sorted = [...logs].sort(
        (a, b) => new Date(a.createdAt as string).getTime() - new Date(b.createdAt as string).getTime(),
    );

    return (
        <section className="rounded-2xl border border-gray-700/50 bg-gray-900/60 p-5 space-y-4">
            <div>
                <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-400">Activity Log</h2>
                <p className="text-xs text-gray-600 mt-0.5">Complete audit trail for this contract.</p>
            </div>

            {isLoading ? (
                <p className="text-sm text-gray-500">Loading…</p>
            ) : sorted.length === 0 ? (
                <p className="text-sm text-gray-500 italic">No activity recorded yet.</p>
            ) : (
                <ol className="relative border-l border-gray-700/60 ml-2 space-y-0">
                    {sorted.map((entry, idx) => {
                        const cfg = EVENT_CONFIG[entry.eventType] ?? {
                            label: entry.eventType.replace(/_/g, " ").toLowerCase(),
                            icon: "•",
                            color: "text-gray-400 bg-gray-500/10 border-gray-500/30",
                        };
                        const isLast = idx === sorted.length - 1;

                        return (
                            <li key={entry.id} className={`ml-5 ${isLast ? "pb-0" : "pb-5"}`}>
                                {/* Timeline dot */}
                                <span className={`absolute -left-2.5 flex h-5 w-5 items-center justify-center rounded-full border text-[10px] ${cfg.color}`}>
                                    {cfg.icon}
                                </span>

                                <div className="space-y-0.5">
                                    <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                                        <span className="text-sm font-semibold text-gray-200">
                                            {cfg.label}
                                        </span>
                                        {(entry.actorName || entry.actorEmail) && (
                                            <span className="text-xs text-gray-500">
                                                by {entry.actorName ?? entry.actorEmail}
                                            </span>
                                        )}
                                        {!entry.actorName && !entry.actorEmail && (
                                            <span className="text-xs text-gray-600">system</span>
                                        )}
                                    </div>

                                    <EventDetail
                                        eventType={entry.eventType}
                                        details={entry.details as Record<string, unknown> | null}
                                    />

                                    <time className="block text-xs text-gray-600">
                                        {formatDateTime(entry.createdAt as string)}
                                    </time>
                                </div>
                            </li>
                        );
                    })}
                </ol>
            )}
        </section>
    );
}
