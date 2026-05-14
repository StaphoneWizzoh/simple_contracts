import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useListTemplatesQuery, useDeleteTemplateMutation } from "@/store/services/templateApi";
import { toast } from "sonner";

export default function TemplatesPage() {
    const navigate = useNavigate();
    const { data, isLoading } = useListTemplatesQuery();
    const [deleteTemplate, { isLoading: isDeleting }] = useDeleteTemplateMutation();
    const [deletingId, setDeletingId] = useState<string | null>(null);

    const templates = data?.templates ?? [];

    const handleDelete = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        if (!confirm("Delete this template? This cannot be undone.")) return;
        setDeletingId(id);
        try {
            await deleteTemplate(id).unwrap();
            toast.success("Template deleted");
        } catch {
            toast.error("Failed to delete template");
        } finally {
            setDeletingId(null);
        }
    };

    return (
        <main className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950">
            {/* Header */}
            <header className="border-b border-gray-800 px-6 py-4">
                <div className="mx-auto max-w-7xl flex items-center justify-between">
                    <div>
                        <button
                            onClick={() => navigate("/")}
                            className="mb-1 text-xs text-gray-500 hover:text-indigo-400 transition"
                        >
                            ← Home
                        </button>
                        <h1 className="text-3xl font-bold text-white">Contract Templates</h1>
                        <p className="mt-1 text-sm text-gray-400">Reusable templates for common contract types</p>
                    </div>
                    <button
                        onClick={() => navigate("/templates/new")}
                        className="rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500 transition"
                    >
                        + New Template
                    </button>
                </div>
            </header>

            {/* Content */}
            <div className="mx-auto max-w-7xl px-6 py-8">
                {/* Loading state */}
                {isLoading && (
                    <div className="rounded-xl border border-gray-700 bg-gray-900/60 p-8 text-center">
                        <p className="text-gray-400">Loading templates…</p>
                    </div>
                )}

                {/* Empty state */}
                {!isLoading && templates.length === 0 && (
                    <div className="rounded-xl border border-gray-700 bg-gray-900/60 p-12 text-center">
                        <div className="text-4xl mb-3">📋</div>
                        <h2 className="text-lg font-semibold text-white">No templates yet</h2>
                        <p className="text-sm text-gray-400 mt-1 mb-4">
                            Create your first template to speed up contract creation
                        </p>
                        <button
                            onClick={() => navigate("/templates/new")}
                            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500"
                        >
                            Create Template
                        </button>
                    </div>
                )}

                {/* Template list */}
                {!isLoading && templates.length > 0 && (
                    <div className="space-y-3">
                        {templates.map((template) => (
                            <div
                                key={template.id}
                                className="group rounded-lg border border-gray-700 bg-gray-900/40 p-4 hover:bg-gray-900/60 transition cursor-pointer"
                                onClick={() => navigate(`/templates/${template.id}`)}
                            >
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-semibold text-white group-hover:text-indigo-300">
                                            {template.title}
                                        </h3>
                                        {template.description && (
                                            <p className="mt-1 text-sm text-gray-400 truncate">{template.description}</p>
                                        )}
                                        <div className="mt-2 flex items-center gap-2 text-xs text-gray-500">
                                            <span className="inline-block rounded bg-gray-800 px-2 py-0.5">
                                                {template.contractType}
                                            </span>
                                            <span>by {template.createdByUser.name}</span>
                                            <span>•</span>
                                            <span>{new Date(template.createdAt).toLocaleDateString()}</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0">
                                        <button
                                            className="rounded-lg px-3 py-1 text-sm font-medium text-indigo-400 hover:bg-indigo-600/20 transition"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                navigate(`/contracts/new?templateId=${template.id}`);
                                            }}
                                        >
                                            Use
                                        </button>
                                        <button
                                            className="rounded-lg px-3 py-1 text-sm font-medium text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition"
                                            disabled={isDeleting && deletingId === template.id}
                                            onClick={(e) => handleDelete(e, template.id)}
                                        >
                                            {isDeleting && deletingId === template.id ? "…" : "Delete"}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </main>
    );
}
