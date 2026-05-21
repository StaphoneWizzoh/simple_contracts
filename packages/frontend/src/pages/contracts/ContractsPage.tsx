import { useState, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useGetCurrentUserQuery } from "@/store/services/authApi";
import { useGetOrgQuery } from "@/store/services/orgApi";
import { useGetContractsQuery } from "@/store/services/contractApi";
import type { ContractQueryParams } from "@/types/contracts";
import SearchBar from "@/components/search/SearchBar";
import FilterPanel from "@/components/search/FilterPanel";
import FilterChips from "@/components/search/FilterChips";
import SavedSearchModal from "@/components/search/SavedSearchModal";

const STATUS_LABEL: Record<string, string> = {
    DRAFT: "Draft",
    REVIEW: "In Review",
    SENT_FOR_SIGNING: "Sent for Signing",
    ACTIVE: "Active",
    EXPIRED: "Expired",
    TERMINATED: "Terminated",
};

function statusColor(status: string) {
    switch (status) {
        case "DRAFT": return "text-yellow-400 bg-yellow-400/10 border-yellow-400/30";
        case "REVIEW": return "text-blue-400 bg-blue-400/10 border-blue-400/30";
        case "SENT_FOR_SIGNING": return "text-violet-400 bg-violet-400/10 border-violet-400/30";
        case "ACTIVE": return "text-emerald-400 bg-emerald-400/10 border-emerald-400/30";
        case "EXPIRED": return "text-gray-400 bg-gray-400/10 border-gray-400/30";
        case "TERMINATED": return "text-red-400 bg-red-400/10 border-red-400/30";
        default: return "text-gray-400 bg-gray-400/10 border-gray-400/30";
    }
}

function formatValue(minor: number | null, currency: string): string {
    if (minor == null) return "";
    return new Intl.NumberFormat("en-US", { style: "currency", currency, maximumFractionDigits: 0 }).format(minor / 100);
}

function paramsToFilters(sp: URLSearchParams): ContractQueryParams {
    return {
        search: sp.get("search") ?? undefined,
        status: sp.get("status") ?? undefined,
        contractType: sp.get("contractType") ?? undefined,
        counterparty: sp.get("counterparty") ?? undefined,
        dateField: (sp.get("dateField") as ContractQueryParams["dateField"]) ?? undefined,
        dateFrom: sp.get("dateFrom") ?? undefined,
        dateTo: sp.get("dateTo") ?? undefined,
        valueMin: sp.get("valueMin") ? Number(sp.get("valueMin")) : undefined,
        valueMax: sp.get("valueMax") ? Number(sp.get("valueMax")) : undefined,
        sortBy: (sp.get("sortBy") as ContractQueryParams["sortBy"]) ?? undefined,
        sortOrder: (sp.get("sortOrder") as ContractQueryParams["sortOrder"]) ?? undefined,
        page: sp.get("page") ? Number(sp.get("page")) : 1,
        limit: sp.get("limit") ? Number(sp.get("limit")) : 25,
    };
}

function filtersToParams(filters: ContractQueryParams): Record<string, string> {
    const out: Record<string, string> = {};
    for (const [k, v] of Object.entries(filters)) {
        if (v != null && v !== "") out[k] = String(v);
    }
    return out;
}

export default function ContractsPage() {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const filters = paramsToFilters(searchParams);

    const { data: currentUser, isLoading: isSessionLoading } = useGetCurrentUserQuery();
    const { data: orgData } = useGetOrgQuery(undefined, { skip: !currentUser?.id });
    const { data, isLoading, isFetching, isError } = useGetContractsQuery(filters, {
        skip: !currentUser?.id,
    });

    const [showFilters, setShowFilters] = useState(false);
    const [showSavedModal, setShowSavedModal] = useState(false);

    const setFilters = useCallback((f: ContractQueryParams) => {
        setSearchParams(filtersToParams(f));
    }, [setSearchParams]);

    const contracts = data?.contracts ?? [];
    const pagination = data?.pagination;

    if (isSessionLoading) {
        return (
            <main className="min-h-screen bg-linear-to-br from-gray-950 via-gray-900 to-gray-950 flex items-center justify-center">
                <p className="text-gray-400">Checking session...</p>
            </main>
        );
    }

    if (!currentUser?.id) {
        return (
            <main className="min-h-screen bg-linear-to-br from-gray-950 via-gray-900 to-gray-950 flex items-center justify-center">
                <div className="text-center">
                    <p className="text-gray-300 mb-4">You must be logged in to view contracts.</p>
                    <button
                        onClick={() => navigate("/auth/login")}
                        className="rounded-lg bg-indigo-600 px-5 py-2 text-sm font-semibold text-white hover:bg-indigo-500"
                    >
                        Go to Login
                    </button>
                </div>
            </main>
        );
    }

    const sortBy = filters.sortBy ?? "updatedAt";
    const sortOrder = filters.sortOrder ?? "desc";

    function toggleSort(field: ContractQueryParams["sortBy"]) {
        if (sortBy === field) {
            setFilters({ ...filters, sortBy: field, sortOrder: sortOrder === "asc" ? "desc" : "asc", page: 1 });
        } else {
            setFilters({ ...filters, sortBy: field, sortOrder: "desc", page: 1 });
        }
    }

    function SortIcon({ field }: { field: ContractQueryParams["sortBy"] }) {
        if (sortBy !== field) return <span className="text-gray-600 ml-1">↕</span>;
        return <span className="text-indigo-400 ml-1">{sortOrder === "asc" ? "↑" : "↓"}</span>;
    }

    return (
        <main className="min-h-screen bg-linear-to-br from-gray-950 via-gray-900 to-gray-950 px-4 py-10 md:px-10">
            <div className="mx-auto w-full max-w-5xl flex flex-col gap-5">
                {/* Header */}
                <header className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                    <div>
                        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-indigo-300/80">My Contracts</p>
                        <h1 className="text-3xl font-bold tracking-tight text-white md:text-4xl">Contracts</h1>
                        <p className="mt-1 text-gray-400 text-sm">
                            Logged in as <span className="text-indigo-300">{currentUser?.email}</span>
                        </p>
                    </div>
                    <div className="flex gap-3 flex-wrap">
                        {orgData?.permissions.includes("view_reports") && (
                            <button
                                onClick={() => navigate("/reports")}
                                className="rounded-lg border border-indigo-500/40 px-4 py-2 text-sm font-semibold text-indigo-300 hover:bg-indigo-600/20 transition"
                            >
                                Reports
                            </button>
                        )}
                        <button
                            onClick={() => navigate("/templates")}
                            className="rounded-lg border border-indigo-500/40 px-4 py-2 text-sm font-semibold text-indigo-300 hover:bg-indigo-600/20 transition"
                        >
                            From Template
                        </button>
                        <button
                            onClick={() => navigate("/contracts/new")}
                            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500"
                        >
                            + New Contract
                        </button>
                    </div>
                </header>

                {/* Search bar row */}
                <div className="flex items-center gap-2">
                    <SearchBar
                        value={filters.search ?? ""}
                        onChange={(v) => setFilters({ ...filters, search: v || undefined, page: 1 })}
                    />
                    <button
                        onClick={() => setShowFilters((p) => !p)}
                        className={`flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium transition ${
                            showFilters ? "border-indigo-500 bg-indigo-600/20 text-indigo-300" : "border-gray-700 bg-gray-900 text-gray-400 hover:border-gray-600"
                        }`}
                    >
                        <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path d="M3 4h18M7 12h10M11 20h2" />
                        </svg>
                        Filters
                    </button>
                    <button
                        onClick={() => setShowSavedModal(true)}
                        className="rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-sm font-medium text-gray-400 hover:border-gray-600 transition"
                        title="Saved searches"
                    >
                        ★
                    </button>
                </div>

                {showFilters && (
                    <FilterPanel filters={filters} onChange={setFilters} />
                )}

                <FilterChips filters={filters} onChange={setFilters} />

                {/* Sort bar + count */}
                <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>
                        {pagination ? (
                            isFetching
                                ? "Loading..."
                                : `${pagination.total} contract${pagination.total !== 1 ? "s" : ""}`
                        ) : ""}
                    </span>
                    <div className="flex gap-3">
                        <span className="text-gray-600">Sort:</span>
                        {(["updatedAt", "createdAt", "title", "expiresAt", "totalValueMinor"] as ContractQueryParams["sortBy"][]).map((f) => (
                            <button
                                key={f}
                                onClick={() => toggleSort(f)}
                                className={`hover:text-gray-200 transition ${sortBy === f ? "text-indigo-300" : ""}`}
                            >
                                {f === "updatedAt" ? "Updated" : f === "createdAt" ? "Created" : f === "totalValueMinor" ? "Value" : f === "expiresAt" ? "Expiry" : "Title"}
                                <SortIcon field={f} />
                            </button>
                        ))}
                    </div>
                </div>

                {/* List */}
                {isLoading && <p className="text-gray-400 text-sm">Loading contracts...</p>}
                {isError && <p className="text-red-400 text-sm">Failed to load contracts.</p>}

                {!isLoading && contracts.length === 0 && (
                    <div className="rounded-2xl border border-dashed border-gray-700 p-12 text-center">
                        <p className="text-gray-400">
                            {Object.values(filters).some(v => v != null && v !== "" && v !== 1 && v !== 25)
                                ? "No contracts match your filters."
                                : "No contracts yet."}
                        </p>
                        <div className="mt-4 flex items-center justify-center gap-3">
                            <button
                                onClick={() => navigate("/templates")}
                                className="rounded-lg border border-indigo-500/40 px-5 py-2 text-sm font-semibold text-indigo-300 hover:bg-indigo-600/20 transition"
                            >
                                Browse Templates
                            </button>
                            <button
                                onClick={() => navigate("/contracts/new")}
                                className="rounded-lg bg-indigo-600 px-5 py-2 text-sm font-semibold text-white hover:bg-indigo-500"
                            >
                                Create from scratch
                            </button>
                        </div>
                    </div>
                )}

                {contracts.length > 0 && (
                    <div className="flex flex-col gap-3">
                        {contracts.map((c) => (
                            <button
                                key={c.id}
                                onClick={() => navigate(`/contracts/${c.id}`)}
                                className="text-left rounded-2xl border border-gray-700/60 bg-gray-900/60 p-5 hover:border-indigo-500/40 hover:bg-gray-900 transition group"
                            >
                                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                                    <div className="flex flex-col gap-1">
                                        <h2 className="text-lg font-semibold text-white group-hover:text-indigo-200 transition">
                                            {c.title}
                                        </h2>
                                        <div className="flex flex-wrap gap-3 text-sm text-gray-400">
                                            {c.counterpartyName && <span>Party: {c.counterpartyName}</span>}
                                            {c.contractType && c.contractType !== "OTHER" && (
                                                <span>{c.contractType.replace(/_/g, " ")}</span>
                                            )}
                                            {c.totalValueMinor != null && (
                                                <span className="text-emerald-400/70">{formatValue(c.totalValueMinor, c.currencyCode)}</span>
                                            )}
                                            {c.expiresAt && (
                                                <span>Expires {new Date(c.expiresAt).toLocaleDateString()}</span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3 shrink-0">
                                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${statusColor(c.status)}`}>
                                            {STATUS_LABEL[c.status] ?? c.status}
                                        </span>
                                        <span className="text-xs text-gray-500">v{c.versionNumber}</span>
                                    </div>
                                </div>
                                <p className="mt-2 text-xs text-gray-500">
                                    Updated {new Date(c.updatedAt).toLocaleDateString()}
                                </p>
                            </button>
                        ))}
                    </div>
                )}

                {/* Pagination */}
                {pagination && pagination.totalPages > 1 && (
                    <div className="flex items-center justify-between">
                        <p className="text-sm text-gray-500">
                            Page {pagination.page} of {pagination.totalPages}
                        </p>
                        <div className="flex gap-1">
                            <button
                                onClick={() => setFilters({ ...filters, page: pagination.page - 1 })}
                                disabled={pagination.page <= 1}
                                className="rounded-lg border border-gray-700 bg-gray-900 px-3 py-1.5 text-sm text-gray-300 hover:bg-gray-800 disabled:opacity-30 disabled:cursor-not-allowed transition"
                            >
                                ← Prev
                            </button>
                            {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                                const page = Math.max(1, Math.min(pagination.totalPages - 4, pagination.page - 2)) + i;
                                return (
                                    <button
                                        key={page}
                                        onClick={() => setFilters({ ...filters, page })}
                                        className={`rounded-lg border px-3 py-1.5 text-sm transition ${
                                            page === pagination.page
                                                ? "border-indigo-500 bg-indigo-600/30 text-indigo-200"
                                                : "border-gray-700 bg-gray-900 text-gray-400 hover:bg-gray-800"
                                        }`}
                                    >
                                        {page}
                                    </button>
                                );
                            })}
                            <button
                                onClick={() => setFilters({ ...filters, page: pagination.page + 1 })}
                                disabled={pagination.page >= pagination.totalPages}
                                className="rounded-lg border border-gray-700 bg-gray-900 px-3 py-1.5 text-sm text-gray-300 hover:bg-gray-800 disabled:opacity-30 disabled:cursor-not-allowed transition"
                            >
                                Next →
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {showSavedModal && (
                <SavedSearchModal
                    currentFilters={filters}
                    onApply={setFilters}
                    onClose={() => setShowSavedModal(false)}
                />
            )}
        </main>
    );
}
