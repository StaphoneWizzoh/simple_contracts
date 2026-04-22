import { forwardRef } from "react";
import { cn } from "@/lib/cn";

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
    error?: boolean;
}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
    ({ error = false, className, ...props }, ref) => {
        return (
            <textarea
                ref={ref}
                className={cn(
                    "w-full rounded-lg border bg-surface-2 px-4 py-2.5 text-sm text-content-primary placeholder:text-content-disabled",
                    "outline-none transition resize-y min-h-20",
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

Textarea.displayName = "Textarea";
export default Textarea;
