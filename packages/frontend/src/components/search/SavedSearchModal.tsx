import { useState } from "react";
import type { ContractQueryParams, SavedSearch } from "@/types/contracts";
import {
    useGetSavedSearchesQuery,
    useCreateSavedSearchMutation,
    useDeleteSavedSearchMutation,
} from "@/store/services/contractApi";

type Props = {
    currentFilters: ContractQueryParams;
    onApply: (filters: ContractQueryParams) => void;
    onClose: () => void;
};

export default function SavedSearchModal({ currentFilters, onApply, onClose }: Props) {
    const { data } = useGetSavedSearchesQuery();
    const [createSavedSearch, { isLoading: isSaving }] = useCreateSavedSearchMutation();
    const [deleteSavedSearch] = useDeleteSavedSearchMutation();
    const [name, setName] = useState("");
    const [tab, setTab] = useState<"load" | "save">("load");

    const savedSearches: SavedSearch[] = data?.savedSearches ?? [];

    async function handleSave() {
        if (!name.trim()) return;
        const { page: _p, limit: _l, ...filtersToSave } = currentFilters;
        await createSavedSearch({ name: name.trim(), filters: filtersToSave });
        setName("");
        setTab("load");
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4" onClick={onClose}>
            <div
                className="w-full max-w-md rounded-2xl border border-gray-700 bg-gray-900 p-6 shadow-2xl"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-white">Saved Searches</h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-300">✕</button>
                </div>

                <div className="mb-4 flex gap-1 rounded-lg border border-gray-700 p-1">
                    {(["load", "save"] as const).map((t) => (
                        <button
                            key={t}
                            onClick={() => setTab(t)}
                            className={`flex-1 rounded-md py-1.5 text-sm font-medium transition ${tab === t ? "bg-indigo-600 text-white" : "text-gray-400 hover:text-gray-200"}`}
                        >
                            {t === "load" ? "Load" : "Save Current"}
                        </button>
                    ))}
                </div>

                {tab === "load" && (
                    <div className="flex flex-col gap-2 max-h-72 overflow-y-auto">
                        {savedSearches.length === 0 && (
                            <p className="text-center text-sm text-gray-500 py-6">No saved searches yet.</p>
                        )}
                        {savedSearches.map((s) => (
                            <div key={s.id} className="flex items-center justify-between rounded-lg border border-gray-700 bg-gray-800 px-4 py-3">
                                <button
                                    className="flex-1 text-left text-sm font-medium text-white hover:text-indigo-300 transition"
                                    onClick={() => { onApply(s.filters); onClose(); }}
                                >
                                    {s.name}
                                </button>
                                <button
                                    onClick={() => deleteSavedSearch(s.id)}
                                    className="ml-3 text-gray-600 hover:text-red-400 transition text-xs"
                                    title="Delete"
                                >
                                    Delete
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                {tab === "save" && (
                    <div className="flex flex-col gap-3">
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Name this search..."
                            className="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:border-indigo-500 focus:outline-none"
                            onKeyDown={(e) => e.key === "Enter" && handleSave()}
                        />
                        <button
                            onClick={handleSave}
                            disabled={!name.trim() || isSaving}
                            className="rounded-lg bg-indigo-600 py-2 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-50 transition"
                        >
                            {isSaving ? "Saving..." : "Save Search"}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
