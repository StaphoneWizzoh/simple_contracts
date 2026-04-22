import { cn } from "@/lib/cn";

type MaxWidth = "3xl" | "4xl" | "5xl" | "6xl" | "7xl";

const maxWidthStyles: Record<MaxWidth, string> = {
    "3xl": "max-w-3xl",
    "4xl": "max-w-4xl",
    "5xl": "max-w-5xl",
    "6xl": "max-w-6xl",
    "7xl": "max-w-7xl",
};

/* ── Page shell — full-screen page wrapper ───────────────────────── */
export function PageShell({
    children,
    maxWidth = "5xl",
    className,
}: {
    children: React.ReactNode;
    maxWidth?: MaxWidth;
    className?: string;
}) {
    return (
        <main className="min-h-screen bg-linear-to-br from-gray-950 via-gray-900 to-gray-950 px-4 py-10 md:px-10">
            <div className={cn("mx-auto w-full", maxWidthStyles[maxWidth], className)}>
                {children}
            </div>
        </main>
    );
}

/* ── Page header — title + eyebrow + optional right slot ─────────── */
export interface PageHeaderProps {
    eyebrow?: string;
    title: string;
    description?: string;
    actions?: React.ReactNode;
    tabs?: React.ReactNode;
    className?: string;
}

export function PageHeader({ eyebrow, title, description, actions, tabs, className }: PageHeaderProps) {
    return (
        <header className={cn("flex flex-col gap-4 mb-8", className)}>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                    {eyebrow && (
                        <p className="text-xs font-bold uppercase tracking-[0.2em] text-brand-400 mb-0.5">
                            {eyebrow}
                        </p>
                    )}
                    <h1 className="text-2xl font-bold text-white">{title}</h1>
                    {description && (
                        <p className="mt-1 text-sm text-content-muted">{description}</p>
                    )}
                </div>
                {actions && <div className="flex shrink-0 flex-wrap gap-2">{actions}</div>}
            </div>
            {tabs && <div className="flex flex-wrap gap-2">{tabs}</div>}
        </header>
    );
}

/* ── Tab button — used in PageHeader tabs ─────────────────────────── */
export function TabButton({
    active = false,
    variant = "default",
    onClick,
    children,
}: {
    active?: boolean;
    variant?: "default" | "ghost";
    onClick: () => void;
    children: React.ReactNode;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={cn(
                "rounded-lg px-4 py-2 text-sm font-medium transition",
                active
                    ? "bg-brand-600/20 border border-brand-500/40 text-brand-300"
                    : variant === "ghost"
                    ? "border border-gray-700 bg-surface-2 text-content-disabled hover:text-content-primary hover:border-gray-600"
                    : "border border-brand-500/30 bg-brand-900/30 text-brand-300 hover:bg-brand-800/40",
            )}
        >
            {children}
        </button>
    );
}

/* ── Spinner — inline loading indicator ──────────────────────────── */
export function Spinner({ className }: { className?: string }) {
    return (
        <span
            className={cn(
                "inline-block size-5 rounded-full border-2 border-gray-700 border-t-brand-400 animate-spin",
                className,
            )}
        />
    );
}

/* ── Full-page loader ─────────────────────────────────────────────── */
export function PageLoader() {
    return (
        <div className="min-h-screen bg-linear-to-br from-gray-950 via-gray-900 to-gray-950 flex items-center justify-center">
            <Spinner className="size-8" />
        </div>
    );
}
