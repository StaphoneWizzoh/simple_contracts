import type { ContractQueryParams } from "@/types/contracts";

const STATUS_LABELS: Record<string, string> = {
    DRAFT: "Draft", REVIEW: "In Review", SENT_FOR_SIGNING: "Sent for Signing",
    ACTIVE: "Active", EXPIRED: "Expired", TERMINATED: "Terminated",
};

type Props = {
    filters: ContractQueryParams;
    onChange: (filters: ContractQueryParams) => void;
};

type Chip = { label: string; onRemove: () => void };

export default function FilterChips({ filters, onChange }: Props) {
    const chips: Chip[] = [];

    if (filters.search) {
        chips.push({ label: `Search: "${filters.search}"`, onRemove: () => onChange({ ...filters, search: undefined, page: 1 }) });
    }
    if (filters.status) {
        filters.status.split(",").filter(Boolean).forEach((s) => {
            chips.push({
                label: STATUS_LABELS[s] ?? s,
                onRemove: () => {
                    const rest = filters.status!.split(",").filter((x) => x !== s).join(",");
                    onChange({ ...filters, status: rest || undefined, page: 1 });
                },
            });
        });
    }
    if (filters.contractType) {
        chips.push({ label: `Type: ${filters.contractType.replace(/_/g, " ")}`, onRemove: () => onChange({ ...filters, contractType: undefined, page: 1 }) });
    }
    if (filters.counterparty) {
        chips.push({ label: `Party: ${filters.counterparty}`, onRemove: () => onChange({ ...filters, counterparty: undefined, page: 1 }) });
    }
    if (filters.dateFrom || filters.dateTo) {
        const field = filters.dateField ?? "created";
        const label = `${field}: ${filters.dateFrom ?? "…"} → ${filters.dateTo ?? "…"}`;
        chips.push({ label, onRemove: () => onChange({ ...filters, dateFrom: undefined, dateTo: undefined, page: 1 }) });
    }
    if (filters.valueMin != null || filters.valueMax != null) {
        const min = filters.valueMin != null ? `$${(filters.valueMin / 100).toLocaleString()}` : "any";
        const max = filters.valueMax != null ? `$${(filters.valueMax / 100).toLocaleString()}` : "any";
        chips.push({ label: `Value: ${min} – ${max}`, onRemove: () => onChange({ ...filters, valueMin: undefined, valueMax: undefined, page: 1 }) });
    }

    if (!chips.length) return null;

    return (
        <div className="flex flex-wrap items-center gap-2">
            {chips.map((chip, i) => (
                <span
                    key={i}
                    className="inline-flex items-center gap-1.5 rounded-full border border-indigo-500/40 bg-indigo-600/10 px-3 py-1 text-xs font-medium text-indigo-300"
                >
                    {chip.label}
                    <button onClick={chip.onRemove} className="hover:text-white transition" aria-label="Remove filter">
                        ✕
                    </button>
                </span>
            ))}
            {chips.length > 1 && (
                <button
                    onClick={() => onChange({ page: 1, limit: filters.limit })}
                    className="text-xs text-gray-500 hover:text-gray-300 transition underline"
                >
                    Clear all
                </button>
            )}
        </div>
    );
}
