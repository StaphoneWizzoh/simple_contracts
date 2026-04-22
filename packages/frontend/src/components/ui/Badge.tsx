import { cn } from "@/lib/cn";

/* ── Contract status badges ──────────────────────────────────────── */
type ContractStatus =
    | "DRAFT"
    | "REVIEW"
    | "SENT_FOR_SIGNING"
    | "ACTIVE"
    | "EXPIRED"
    | "TERMINATED";

const statusStyles: Record<ContractStatus, string> = {
    DRAFT:            "text-status-draft   bg-status-draft/10   border-status-draft/30",
    REVIEW:           "text-status-review  bg-status-review/10  border-status-review/30",
    SENT_FOR_SIGNING: "text-status-signing bg-status-signing/10 border-status-signing/30",
    ACTIVE:           "text-status-active  bg-status-active/10  border-status-active/30",
    EXPIRED:          "text-status-expired bg-status-expired/10 border-status-expired/30",
    TERMINATED:       "text-status-terminated bg-status-terminated/10 border-status-terminated/30",
};

const statusLabels: Record<ContractStatus, string> = {
    DRAFT:            "Draft",
    REVIEW:           "In Review",
    SENT_FOR_SIGNING: "Sent for Signing",
    ACTIVE:           "Active",
    EXPIRED:          "Expired",
    TERMINATED:       "Terminated",
};

export function StatusBadge({ status, className }: { status: string; className?: string }) {
    const known = status as ContractStatus;
    return (
        <span
            className={cn(
                "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold",
                statusStyles[known] ?? "text-gray-400 bg-gray-400/10 border-gray-400/30",
                className,
            )}
        >
            {statusLabels[known] ?? status}
        </span>
    );
}

/* ── Generic badge ──────────────────────────────────────────────── */
export type BadgeVariant = "default" | "brand" | "success" | "warning" | "danger" | "info";

const badgeVariants: Record<BadgeVariant, string> = {
    default: "text-gray-400 bg-gray-400/10 border-gray-400/20",
    brand:   "text-brand-300 bg-brand-500/10 border-brand-500/20",
    success: "text-status-active bg-status-active/10 border-status-active/20",
    warning: "text-status-signing bg-status-signing/10 border-status-signing/20",
    danger:  "text-red-400 bg-red-400/10 border-red-400/20",
    info:    "text-status-review bg-status-review/10 border-status-review/20",
};

export interface BadgeProps {
    variant?: BadgeVariant;
    className?: string;
    children: React.ReactNode;
}

export function Badge({ variant = "default", className, children }: BadgeProps) {
    return (
        <span
            className={cn(
                "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold",
                badgeVariants[variant],
                className,
            )}
        >
            {children}
        </span>
    );
}
