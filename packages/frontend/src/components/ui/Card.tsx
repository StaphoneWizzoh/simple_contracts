import { cn } from "@/lib/cn";

export type CardVariant = "default" | "elevated" | "brand" | "danger" | "warning";

const variantStyles: Record<CardVariant, string> = {
    default:  "border-gray-700/60 bg-gray-900/60",
    elevated: "border-gray-700/40 bg-gray-900/80 shadow-card",
    brand:    "border-brand-500/20 bg-brand-900/20",
    danger:   "border-red-500/20 bg-red-900/10",
    warning:  "border-yellow-500/20 bg-yellow-900/10",
};

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
    variant?: CardVariant;
    /** Add hover lift + border highlight effect */
    interactive?: boolean;
    padding?: "none" | "sm" | "md" | "lg";
}

const paddingStyles = {
    none: "",
    sm:   "p-4",
    md:   "p-5",
    lg:   "p-6",
};

export function Card({
    variant = "default",
    interactive = false,
    padding = "md",
    className,
    children,
    ...props
}: CardProps) {
    return (
        <div
            className={cn(
                "rounded-2xl border transition",
                variantStyles[variant],
                paddingStyles[padding],
                interactive && "cursor-pointer hover:border-brand-500/40 hover:bg-gray-900 hover:shadow-card-hover",
                className,
            )}
            {...props}
        >
            {children}
        </div>
    );
}
