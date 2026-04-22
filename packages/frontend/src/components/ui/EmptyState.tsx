import { cn } from "@/lib/cn";
import Button from "./Button";

export interface EmptyStateProps {
    title: string;
    description?: string;
    action?: {
        label: string;
        onClick: () => void;
    };
    secondaryAction?: {
        label: string;
        onClick: () => void;
    };
    icon?: React.ReactNode;
    className?: string;
}

export function EmptyState({
    title,
    description,
    action,
    secondaryAction,
    icon,
    className,
}: EmptyStateProps) {
    return (
        <div
            className={cn(
                "flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-700 py-16 px-6 text-center",
                className,
            )}
        >
            {icon && (
                <div className="mb-4 text-4xl text-content-disabled">{icon}</div>
            )}
            <p className="text-sm font-semibold text-content-secondary">{title}</p>
            {description && (
                <p className="mt-1.5 text-sm text-content-muted max-w-sm">{description}</p>
            )}
            {(action || secondaryAction) && (
                <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
                    {action && (
                        <Button onClick={action.onClick} size="sm">
                            {action.label}
                        </Button>
                    )}
                    {secondaryAction && (
                        <Button variant="secondary" onClick={secondaryAction.onClick} size="sm">
                            {secondaryAction.label}
                        </Button>
                    )}
                </div>
            )}
        </div>
    );
}
