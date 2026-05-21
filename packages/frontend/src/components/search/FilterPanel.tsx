import { useGetContractTypesQuery } from "@/store/services/contractApi";
import type { ContractQueryParams } from "@/types/contracts";

const ALL_STATUSES = ["DRAFT", "REVIEW", "SENT_FOR_SIGNING", "ACTIVE", "EXPIRED", "TERMINATED"];
const STATUS_LABELS: Record<string, string> = {
    DRAFT: "Draft", REVIEW: "In Review", SENT_FOR_SIGNING: "Sent for Signing",
    ACTIVE: "Active", EXPIRED: "Expired", TERMINATED: "Terminated",
};

type Props = {
    filters: ContractQueryParams;
    onChange: (filters: ContractQueryParams) => void;
};

export default function FilterPanel({ filters, onChange }: Props) {
    const { data: typesData } = useGetContractTypesQuery();
    const contractTypes = typesData?.types ?? [];

    function set<K extends keyof ContractQueryParams>(key: K, value: ContractQueryParams[K]) {
        onChange({ ...filters, [key]: value, page: 1 });
    }

    function toggleStatus(status: string) {
        const current = filters.status ? filters.status.split(",").filter(Boolean) : [];
        const updated = current.includes(status)
            ? current.filter((s) => s !== status)
            : [...current, status];
        set("status", updated.join(",") || undefined);
    }

    const activeStatuses = filters.status ? filters.status.split(",").filter(Boolean) : [];

    return (
        <div className="flex flex-col gap-5 rounded-xl border border-gray-700/60 bg-gray-900/60 p-5">
            {/* Status */}
            <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500">Status</p>
                <div className="flex flex-wrap gap-2">
                    {ALL_STATUSES.map((s) => (
                        <button
                            key={s}
                            onClick={() => toggleStatus(s)}
                            className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
                                activeStatuses.includes(s)
                                    ? "border-indigo-500 bg-indigo-600/30 text-indigo-200"
                                    : "border-gray-700 bg-gray-800 text-gray-400 hover:border-gray-600"
                            }`}
                        >
                            {STATUS_LABELS[s]}
                        </button>
                    ))}
                </div>
            </div>

            {/* Contract type */}
            <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500">Contract Type</p>
                <select
                    value={filters.contractType ?? ""}
                    onChange={(e) => set("contractType", e.target.value || undefined)}
                    className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none"
                >
                    <option value="">All types</option>
                    {contractTypes.map((t) => (
                        <option key={t} value={t}>{t.replace(/_/g, " ")}</option>
                    ))}
                </select>
            </div>

            {/* Counterparty */}
            <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500">Counterparty</p>
                <input
                    type="text"
                    value={filters.counterparty ?? ""}
                    onChange={(e) => set("counterparty", e.target.value || undefined)}
                    placeholder="Filter by counterparty..."
                    className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white placeholder-gray-500 focus:border-indigo-500 focus:outline-none"
                />
            </div>

            {/* Date range */}
            <div>
                <div className="mb-2 flex items-center justify-between">
                    <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Date Range</p>
                    <select
                        value={filters.dateField ?? "createdAt"}
                        onChange={(e) => set("dateField", e.target.value as ContractQueryParams["dateField"])}
                        className="rounded border border-gray-700 bg-gray-800 px-2 py-0.5 text-xs text-gray-300 focus:outline-none"
                    >
                        <option value="createdAt">Created</option>
                        <option value="effectiveAt">Effective</option>
                        <option value="expiresAt">Expiry</option>
                        <option value="updatedAt">Updated</option>
                    </select>
                </div>
                <div className="flex gap-2">
                    <input
                        type="date"
                        value={filters.dateFrom ?? ""}
                        onChange={(e) => set("dateFrom", e.target.value || undefined)}
                        className="flex-1 rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none"
                    />
                    <span className="self-center text-gray-500 text-sm">to</span>
                    <input
                        type="date"
                        value={filters.dateTo ?? ""}
                        onChange={(e) => set("dateTo", e.target.value || undefined)}
                        className="flex-1 rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none"
                    />
                </div>
            </div>

            {/* Value range */}
            <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500">Value Range (USD)</p>
                <div className="flex gap-2">
                    <input
                        type="number"
                        min={0}
                        placeholder="Min"
                        value={filters.valueMin != null ? filters.valueMin / 100 : ""}
                        onChange={(e) => set("valueMin", e.target.value ? Math.round(parseFloat(e.target.value) * 100) : undefined)}
                        className="flex-1 rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white placeholder-gray-500 focus:border-indigo-500 focus:outline-none"
                    />
                    <span className="self-center text-gray-500 text-sm">–</span>
                    <input
                        type="number"
                        min={0}
                        placeholder="Max"
                        value={filters.valueMax != null ? filters.valueMax / 100 : ""}
                        onChange={(e) => set("valueMax", e.target.value ? Math.round(parseFloat(e.target.value) * 100) : undefined)}
                        className="flex-1 rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white placeholder-gray-500 focus:border-indigo-500 focus:outline-none"
                    />
                </div>
            </div>
        </div>
    );
}
