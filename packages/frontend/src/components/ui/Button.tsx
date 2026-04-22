import { forwardRef } from "react";
import { cn } from "@/lib/cn";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger" | "danger-ghost" | "outline-brand";
export type ButtonSize = "sm" | "md" | "lg" | "icon-sm" | "icon-md";

const variantStyles: Record<ButtonVariant, string> = {
    primary:
        "bg-brand-600 text-white hover:bg-brand-500 focus-visible:shadow-focus-brand disabled:bg-brand-800 disabled:text-brand-400",
    secondary:
        "bg-surface-2 border border-gray-700/60 text-gray-100 hover:bg-gray-700 hover:border-gray-600 focus-visible:shadow-focus-brand disabled:text-gray-500",
    ghost:
        "text-gray-400 hover:text-gray-100 hover:bg-gray-800 focus-visible:shadow-focus-brand disabled:text-gray-600",
    danger:
        "bg-red-600 text-white hover:bg-red-500 focus-visible:shadow-focus-danger disabled:bg-red-900 disabled:text-red-400",
    "danger-ghost":
        "text-red-400 hover:text-red-300 hover:bg-red-400/10 focus-visible:shadow-focus-danger disabled:text-red-700",
    "outline-brand":
        "border border-brand-500/30 bg-brand-900/30 text-brand-300 hover:bg-brand-800/40 hover:border-brand-400/50 focus-visible:shadow-focus-brand",
};

const sizeStyles: Record<ButtonSize, string> = {
    sm:      "px-3 py-1.5 text-xs",
    md:      "px-4 py-2 text-sm",
    lg:      "px-5 py-2.5 text-sm",
    "icon-sm": "p-1.5",
    "icon-md": "p-2",
};

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: ButtonVariant;
    size?: ButtonSize;
    loading?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
    ({ variant = "primary", size = "md", loading = false, disabled, className, children, ...props }, ref) => {
        return (
            <button
                ref={ref}
                disabled={disabled || loading}
                className={cn(
                    "inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50",
                    variantStyles[variant],
                    sizeStyles[size],
                    className,
                )}
                {...props}
            >
                {loading && (
                    <span className="size-3.5 shrink-0 rounded-full border-2 border-current border-t-transparent animate-spin" />
                )}
                {children}
            </button>
        );
    },
);

Button.displayName = "Button";
export default Button;
