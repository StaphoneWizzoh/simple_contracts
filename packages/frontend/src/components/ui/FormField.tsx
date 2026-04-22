import { cn } from "@/lib/cn";

export interface FormFieldProps {
    label?: string;
    required?: boolean;
    hint?: string;
    error?: string;
    children: React.ReactNode;
    className?: string;
}

export function FormField({ label, required, hint, error, children, className }: FormFieldProps) {
    return (
        <div className={cn("flex flex-col gap-1.5", className)}>
            {label && (
                <div className="flex items-baseline justify-between gap-2">
                    <label className="text-sm font-medium text-content-secondary">
                        {label}
                        {required && <span className="ml-0.5 text-red-400">*</span>}
                    </label>
                    {hint && <span className="text-xs text-content-disabled">{hint}</span>}
                </div>
            )}
            {children}
            {error && (
                <p className="text-xs text-red-400">{error}</p>
            )}
        </div>
    );
}

/* ── Label-only component (for use outside FormField) ─────────────── */
export function Label({ children, required, className }: {
    children: React.ReactNode;
    required?: boolean;
    className?: string;
}) {
    return (
        <label className={cn("text-sm font-medium text-content-secondary", className)}>
            {children}
            {required && <span className="ml-0.5 text-red-400">*</span>}
        </label>
    );
}

/* ── Section label (e.g. "General", "Permissions") ───────────────── */
export function SectionLabel({ children, className }: { children: React.ReactNode; className?: string }) {
    return (
        <p className={cn("text-xs font-bold uppercase tracking-[0.15em] text-content-disabled", className)}>
            {children}
        </p>
    );
}
