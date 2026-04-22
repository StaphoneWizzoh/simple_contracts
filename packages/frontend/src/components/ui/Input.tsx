import { forwardRef } from "react";
import { cn } from "@/lib/cn";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    error?: boolean;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
    ({ error = false, className, ...props }, ref) => {
        return (
            <input
                ref={ref}
                className={cn(
                    "w-full rounded-lg border bg-surface-2 px-4 py-2.5 text-sm text-content-primary placeholder:text-content-disabled",
                    "outline-none transition",
                    error
                        ? "border-red-500/60 focus:border-red-500 focus:shadow-focus-danger"
                        : "border-gray-700/60 focus:border-brand-500 focus:shadow-focus-brand",
                    "disabled:cursor-not-allowed disabled:opacity-50",
                    className,
                )}
                {...props}
            />
        );
    },
);

Input.displayName = "Input";
export default Input;
