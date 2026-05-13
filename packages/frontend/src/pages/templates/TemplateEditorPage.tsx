import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useGetTemplateQuery, useCreateTemplateMutation, useUpdateTemplateMutation } from "@/store/services/templateApi";
import ContractEditor from "@/components/contracts/ContractEditor";
import { toast } from "sonner";

const CONTRACT_TYPES = [
    "NDA",
    "Service Agreement",
    "Employment",
    "Consulting",
    "Lease",
    "Purchase",
    "Partnership",
    "Other",
];

export default function TemplateEditorPage() {
    const navigate = useNavigate();
    const { id: templateId } = useParams<{ id?: string }>();
    const isEditing = !!templateId;

    const { data: templateData, isLoading: isFetching } = useGetTemplateQuery(templateId!, {
        skip: !templateId,
    });

    const [createTemplate] = useCreateTemplateMutation();
    const [updateTemplate] = useUpdateTemplateMutation();

    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [contractType, setContractType] = useState("Other");
    const [contentHtml, setContentHtml] = useState("");
    const [initialContent, setInitialContent] = useState<string | undefined>(undefined);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (templateData?.template) {
            const t = templateData.template;
            setTitle(t.title);
            setDescription(t.description ?? "");
            setContractType(t.contractType);
            setInitialContent(t.contentHtml);
            setContentHtml(t.contentHtml);
        }
    }, [templateData]);

    const handleSave = async () => {
        if (!title.trim()) {
            toast.error("Title is required");
            return;
        }
        if (!contentHtml.trim()) {
            toast.error("Content is required");
            return;
        }

        setIsSaving(true);
        try {
            if (isEditing) {
                await updateTemplate({
                    id: templateId!,
                    body: {
                        title: title.trim(),
                        description: description.trim() || undefined,
                        contractType,
                        contentHtml,
                    },
                }).unwrap();
                toast.success("Template updated");
            } else {
                await createTemplate({
                    title: title.trim(),
                    description: description.trim() || undefined,
                    contractType,
                    contentHtml,
                }).unwrap();
                toast.success("Template created");
                navigate("/templates");
            }
        } catch (err) {
            const msg = (err as any)?.data?.statusMessage || "Failed to save template";
            toast.error(msg);
        } finally {
            setIsSaving(false);
        }
    };

    if (isFetching) {
        return (
            <main className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 flex items-center justify-center">
                <p className="text-gray-400">Loading template…</p>
            </main>
        );
    }

    return (
        <main className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950">
            {/* Header */}
            <header className="border-b border-gray-800 px-6 py-4 sticky top-0 bg-gray-950/80 backdrop-blur z-10">
                <div className="mx-auto max-w-7xl flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-white">
                            {isEditing ? "Edit Template" : "New Template"}
                        </h1>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => navigate("/templates")}
                            className="rounded-lg border border-gray-700 px-4 py-2 text-sm font-medium text-gray-300 hover:bg-gray-800 transition"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={isSaving}
                            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50 transition"
                        >
                            {isSaving ? "Saving…" : "Save Template"}
                        </button>
                    </div>
                </div>
            </header>

            {/* Content */}
            <div className="mx-auto max-w-7xl px-6 py-8">
                <div className="grid gap-8 lg:grid-cols-4">
                    {/* Sidebar */}
                    <div className="space-y-6 lg:col-span-1">
                        <div className="rounded-lg border border-gray-700 bg-gray-900/60 p-4 space-y-4">
                            <div>
                                <label className="block text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2">
                                    Template Title
                                </label>
                                <input
                                    type="text"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    placeholder="e.g., Standard NDA"
                                    className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white placeholder:text-gray-500 focus:ring-2 focus:ring-indigo-500 outline-none"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2">
                                    Description
                                </label>
                                <textarea
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="Optional description…"
                                    rows={3}
                                    className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white placeholder:text-gray-500 focus:ring-2 focus:ring-indigo-500 outline-none"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2">
                                    Contract Type
                                </label>
                                <select
                                    value={contractType}
                                    onChange={(e) => setContractType(e.target.value)}
                                    className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                                >
                                    {CONTRACT_TYPES.map((type) => (
                                        <option key={type} value={type}>
                                            {type}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="rounded-lg border border-gray-700 bg-gray-900/60 p-4">
                            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2">
                                💡 Variables
                            </p>
                            <p className="text-xs text-gray-500">
                                Type placeholder text in the editor: <code className="bg-gray-800 px-1 rounded">{"{{variable_name}}"}</code>. Users can edit them when creating contracts from this template.
                            </p>
                        </div>
                    </div>

                    {/* Editor — key forces remount when initialContent loads for edit mode */}
                    <div className="lg:col-span-3">
                        <div className="rounded-lg border border-gray-700 bg-gray-900/60 overflow-hidden">
                            {(!isEditing || initialContent !== undefined) && (
                                <ContractEditor
                                    key={initialContent ?? "new"}
                                    initialContent={initialContent}
                                    onChange={setContentHtml}
                                />
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}
