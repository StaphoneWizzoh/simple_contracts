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
import {
    PageShell, PageHeader, TabButton,
    Card, Button, Input, FormField, SectionLabel, Badge, EmptyState,
} from "@/components/ui";

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
        setFormName(""); setFormDesc(""); setFormPerms([]);
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

    const tabs = (
        <>
            <TabButton onClick={() => navigate("/org/settings")}>Settings</TabButton>
            <TabButton onClick={() => navigate("/org/members")}>Members</TabButton>
            <TabButton variant="ghost" onClick={() => navigate("/contracts")}>Contracts</TabButton>
        </>
    );

    return (
        <PageShell maxWidth="6xl">
            <PageHeader eyebrow="Organisation" title="Roles & Permissions" tabs={tabs} />

            <div className="flex flex-col lg:flex-row gap-6">
                {/* Roles list */}
                <div className="flex-1 flex flex-col gap-3">
                    {isLoading ? (
                        <p className="text-sm text-content-muted">Loading…</p>
                    ) : roles.length === 0 ? (
                        <EmptyState title="No roles yet" action={canManage ? { label: "Create first role", onClick: openCreate } : undefined} />
                    ) : (
                        roles.map((role) => (
                            <Card
                                key={role.id}
                                interactive={canManage}
                                onClick={() => canManage ? openEdit(role) : undefined}
                                className={editingRole?.id === role.id ? "border-brand-500/60 bg-brand-900/20" : ""}
                            >
                                <div className="flex items-start justify-between gap-3">
                                    <div className="flex flex-col gap-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <span className="font-semibold text-content-primary text-sm">{role.name}</span>
                                            {role.isSystemRole && (
                                                <Badge variant="brand">System</Badge>
                                            )}
                                        </div>
                                        {role.description && <p className="text-xs text-content-muted">{role.description}</p>}
                                        <p className="text-xs text-content-disabled mt-1">
                                            {role.memberCount ?? 0} member{role.memberCount !== 1 ? "s" : ""}
                                        </p>
                                    </div>
                                    <div className="flex gap-2 shrink-0">
                                        {canManage && !role.isSystemRole && (
                                            <Button
                                                variant="danger-ghost"
                                                size="sm"
                                                onClick={(e) => { e.stopPropagation(); handleDelete(role); }}
                                            >
                                                Delete
                                            </Button>
                                        )}
                                        {canManage && (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={(e) => { e.stopPropagation(); openEdit(role); }}
                                            >
                                                Edit
                                            </Button>
                                        )}
                                    </div>
                                </div>
                                <div className="mt-3 flex flex-wrap gap-1.5">
                                    {role.permissions.length === 0 ? (
                                        <span className="text-xs text-content-disabled italic">No permissions (read-only)</span>
                                    ) : (
                                        role.permissions.map((p) => (
                                            <Badge key={p} variant="brand">
                                                {ALL_PERMISSIONS.find((ap) => ap.key === p)?.label ?? p}
                                            </Badge>
                                        ))
                                    )}
                                </div>
                            </Card>
                        ))
                    )}

                    {canManage && !showCreate && !editingRole && (
                        <button
                            onClick={openCreate}
                            className="rounded-2xl border border-dashed border-gray-700 px-5 py-4 text-sm text-content-muted hover:border-brand-500/50 hover:text-brand-300 transition text-left"
                        >
                            + Create custom role
                        </button>
                    )}
                </div>

                {/* Create / Edit panel */}
                {canManage && (showCreate || editingRole) && (
                    <div className="w-full lg:w-80 shrink-0">
                        <Card variant="brand">
                            <h3 className="text-sm font-bold text-content-primary mb-4">
                                {editingRole ? `Edit "${editingRole.name}"` : "New Role"}
                            </h3>
                            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                                <FormField label="Name" required>
                                    <Input
                                        value={formName}
                                        onChange={(e) => setFormName(e.target.value)}
                                        placeholder="e.g. Legal Manager"
                                        required
                                    />
                                </FormField>
                                <FormField label="Description">
                                    <Input
                                        value={formDesc}
                                        onChange={(e) => setFormDesc(e.target.value)}
                                        placeholder="Optional description"
                                    />
                                </FormField>
                                <div className="flex flex-col gap-2">
                                    <SectionLabel>Permissions</SectionLabel>
                                    <div className="flex flex-col gap-2 mt-1">
                                        {ALL_PERMISSIONS.map((p) => (
                                            <label key={p.key} className="flex items-center gap-2.5 cursor-pointer group">
                                                <input
                                                    type="checkbox"
                                                    checked={formPerms.includes(p.key)}
                                                    onChange={() => togglePerm(p.key)}
                                                    className="rounded border-gray-600 bg-surface-2 text-brand-500 focus:ring-brand-500"
                                                />
                                                <span className="text-xs text-content-secondary group-hover:text-content-primary transition">
                                                    {p.label}
                                                </span>
                                            </label>
                                        ))}
                                    </div>
                                </div>

                                <div className="flex gap-2 pt-1">
                                    <Button
                                        type="submit"
                                        loading={isCreating || isUpdating}
                                        disabled={!formName.trim()}
                                        className="flex-1"
                                    >
                                        {editingRole ? "Update" : "Create"}
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="secondary"
                                        onClick={() => { setEditingRole(null); setShowCreate(false); }}
                                    >
                                        Cancel
                                    </Button>
                                </div>
                            </form>
                        </Card>
                    </div>
                )}
            </div>
        </PageShell>
    );
}
