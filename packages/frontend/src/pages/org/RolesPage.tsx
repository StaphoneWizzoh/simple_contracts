import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
    useGetRolesQuery,
    useGetOrgQuery,
    useCreateRoleMutation,
    useUpdateRoleMutation,
    useDeleteRoleMutation,
    ALL_PERMISSIONS,
    type OrgRole,
} from "@/store/services/orgApi";

export default function RolesPage() {
    const navigate = useNavigate();
    const { data: orgData } = useGetOrgQuery();
    const { data: rolesData, isLoading } = useGetRolesQuery();
    const [createRole, { isLoading: isCreating }] = useCreateRoleMutation();
    const [updateRole, { isLoading: isUpdating }] = useUpdateRoleMutation();
    const [deleteRole] = useDeleteRoleMutation();

    const canManage = orgData?.permissions.includes("manage_roles") ?? false;
    const roles = rolesData?.roles ?? [];

    const [editingRole, setEditingRole] = useState<OrgRole | null>(null);
    const [showCreate, setShowCreate] = useState(false);
    const [formName, setFormName] = useState("");
    const [formDesc, setFormDesc] = useState("");
    const [formPerms, setFormPerms] = useState<string[]>([]);

    const openCreate = () => {
        setEditingRole(null);
        setFormName("");
        setFormDesc("");
        setFormPerms([]);
        setShowCreate(true);
    };

    const openEdit = (role: OrgRole) => {
        setShowCreate(false);
        setEditingRole(role);
        setFormName(role.name);
        setFormDesc(role.description ?? "");
        setFormPerms(role.permissions);
    };

    const togglePerm = (key: string) =>
        setFormPerms((prev) => prev.includes(key) ? prev.filter((p) => p !== key) : [...prev, key]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formName.trim()) return;
        try {
            if (editingRole) {
                await updateRole({ roleId: editingRole.id, name: formName.trim(), description: formDesc.trim() || undefined, permissions: formPerms }).unwrap();
                toast.success(`Role "${formName.trim()}" updated.`);
                setEditingRole(null);
            } else {
                await createRole({ name: formName.trim(), description: formDesc.trim() || undefined, permissions: formPerms }).unwrap();
                toast.success(`Role "${formName.trim()}" created.`);
                setShowCreate(false);
            }
        } catch (err: unknown) {
            const e = err as { data?: { statusMessage?: string } };
            toast.error(e.data?.statusMessage ?? "Failed to save role");
        }
    };

    const handleDelete = async (role: OrgRole) => {
        if (!confirm(`Delete role "${role.name}"? This cannot be undone.`)) return;
        try {
            await deleteRole(role.id).unwrap();
            toast.success(`Role "${role.name}" deleted.`);
        } catch (err: unknown) {
            const e = err as { data?: { statusMessage?: string } };
            toast.error(e.data?.statusMessage ?? "Failed to delete role");
        }
    };

    return (
        <PageShell>
            <header className="flex items-center justify-between mb-8">
                <div>
                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-indigo-400">Organisation</p>
                    <h1 className="text-2xl font-bold text-white mt-0.5">Roles & Permissions</h1>
                </div>
                <nav className="flex gap-2">
                    <TabBtn onClick={() => navigate("/org/settings")}>Settings</TabBtn>
                    <TabBtn onClick={() => navigate("/org/members")}>Members</TabBtn>
                    <TabBtn onClick={() => navigate("/contracts")} variant="ghost">Contracts</TabBtn>
                </nav>
            </header>

            <div className="flex flex-col lg:flex-row gap-6">
                {/* Roles list */}
                <div className="flex-1 flex flex-col gap-3">
                    {isLoading ? (
                        <p className="text-gray-400 text-sm">Loading…</p>
                    ) : (
                        roles.map((role) => (
                            <div
                                key={role.id}
                                className={`rounded-xl border px-5 py-4 transition cursor-pointer ${editingRole?.id === role.id ? "border-indigo-500/60 bg-indigo-900/20" : "border-gray-700/60 bg-gray-900/60 hover:border-gray-600"}`}
                                onClick={() => canManage ? openEdit(role) : undefined}
                            >
                                <div className="flex items-start justify-between gap-3">
                                    <div className="flex flex-col gap-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <span className="font-semibold text-white text-sm">{role.name}</span>
                                            {role.isSystemRole && (
                                                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400 border border-indigo-500/30 rounded-full px-2 py-0.5">System</span>
                                            )}
                                        </div>
                                        {role.description && <p className="text-xs text-gray-400">{role.description}</p>}
                                        <p className="text-xs text-gray-500 mt-1">{role.memberCount ?? 0} member{role.memberCount !== 1 ? "s" : ""}</p>
                                    </div>
                                    <div className="flex gap-2 shrink-0">
                                        {canManage && !role.isSystemRole && (
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleDelete(role); }}
                                                className="text-xs text-red-400 hover:text-red-300"
                                            >
                                                Delete
                                            </button>
                                        )}
                                        {canManage && (
                                            <button
                                                onClick={(e) => { e.stopPropagation(); openEdit(role); }}
                                                className="text-xs text-indigo-400 hover:text-indigo-300"
                                            >
                                                Edit
                                            </button>
                                        )}
                                    </div>
                                </div>
                                <div className="mt-3 flex flex-wrap gap-1.5">
                                    {role.permissions.length === 0 ? (
                                        <span className="text-xs text-gray-500 italic">No permissions (read-only)</span>
                                    ) : (
                                        role.permissions.map((p) => (
                                            <span key={p} className="text-[10px] font-medium bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 rounded-full px-2 py-0.5">
                                                {ALL_PERMISSIONS.find((ap) => ap.key === p)?.label ?? p}
                                            </span>
                                        ))
                                    )}
                                </div>
                            </div>
                        ))
                    )}

                    {canManage && !showCreate && !editingRole && (
                        <button
                            onClick={openCreate}
                            className="rounded-xl border border-dashed border-gray-700 px-5 py-4 text-sm text-gray-400 hover:border-indigo-500/50 hover:text-indigo-300 transition text-left"
                        >
                            + Create custom role
                        </button>
                    )}
                </div>

                {/* Create / Edit panel */}
                {canManage && (showCreate || editingRole) && (
                    <div className="w-full lg:w-80 shrink-0">
                        <div className="rounded-2xl border border-indigo-500/20 bg-gray-900/60 p-5">
                            <h3 className="text-sm font-bold text-white mb-4">
                                {editingRole ? `Edit "${editingRole.name}"` : "New Role"}
                            </h3>
                            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                                <label className="flex flex-col gap-1.5">
                                    <span className="text-xs font-medium text-gray-300">Name *</span>
                                    <input
                                        value={formName}
                                        onChange={(e) => setFormName(e.target.value)}
                                        placeholder="e.g. Legal Manager"
                                        required
                                        className="rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-gray-100 outline-none ring-indigo-500 focus:ring-2"
                                    />
                                </label>
                                <label className="flex flex-col gap-1.5">
                                    <span className="text-xs font-medium text-gray-300">Description</span>
                                    <input
                                        value={formDesc}
                                        onChange={(e) => setFormDesc(e.target.value)}
                                        placeholder="Optional description"
                                        className="rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-gray-100 outline-none ring-indigo-500 focus:ring-2"
                                    />
                                </label>
                                <div className="flex flex-col gap-2">
                                    <span className="text-xs font-medium text-gray-300">Permissions</span>
                                    <div className="flex flex-col gap-2">
                                        {ALL_PERMISSIONS.map((p) => (
                                            <label key={p.key} className="flex items-center gap-2.5 cursor-pointer group">
                                                <input
                                                    type="checkbox"
                                                    checked={formPerms.includes(p.key)}
                                                    onChange={() => togglePerm(p.key)}
                                                    className="rounded border-gray-600 bg-gray-800 text-indigo-500 focus:ring-indigo-500"
                                                />
                                                <span className="text-xs text-gray-300 group-hover:text-white transition">{p.label}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>

                                <div className="flex gap-2">
                                    <button
                                        type="submit"
                                        disabled={isCreating || isUpdating || !formName.trim()}
                                        className="flex-1 rounded-lg bg-indigo-600 py-2 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {isCreating || isUpdating ? "Saving…" : editingRole ? "Update" : "Create"}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => { setEditingRole(null); setShowCreate(false); }}
                                        className="rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-gray-400 hover:text-gray-100"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </PageShell>
    );
}

function PageShell({ children }: { children: React.ReactNode }) {
    return (
        <main className="min-h-screen bg-linear-to-br from-gray-950 via-gray-900 to-gray-950 px-4 py-10 md:px-10">
            <div className="mx-auto w-full max-w-5xl">{children}</div>
        </main>
    );
}

function TabBtn({ onClick, children, variant = "default" }: { onClick: () => void; children: React.ReactNode; variant?: "default" | "ghost" }) {
    const base = "rounded-lg px-4 py-2 text-sm font-medium transition";
    const styles = variant === "ghost"
        ? `${base} border border-gray-700 bg-gray-800 text-gray-400 hover:text-gray-100`
        : `${base} border border-indigo-500/30 bg-indigo-900/30 text-indigo-300 hover:bg-indigo-800/40`;
    return <button type="button" onClick={onClick} className={styles}>{children}</button>;
}
