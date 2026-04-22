import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
    useGetMembersQuery,
    useGetRolesQuery,
    useGetInvitesQuery,
    useGetOrgQuery,
    useUpdateMemberRoleMutation,
    useRemoveMemberMutation,
    useSendInviteMutation,
    useRevokeInviteMutation,
} from "@/store/services/orgApi";
import {
    PageShell, PageHeader, TabButton,
    Card, Button, Input, Select, FormField, SectionLabel, EmptyState,
    type SingleValue,
} from "@/components/ui";

type RoleOption = { value: string; label: string };

export default function MembersPage() {
    const navigate = useNavigate();
    const { data: orgData } = useGetOrgQuery();
    const { data: membersData, isLoading: loadingMembers } = useGetMembersQuery();
    const { data: rolesData } = useGetRolesQuery();
    const { data: invitesData } = useGetInvitesQuery();

    const [updateRole] = useUpdateMemberRoleMutation();
    const [removeMember] = useRemoveMemberMutation();
    const [sendInvite, { isLoading: isSending }] = useSendInviteMutation();
    const [revokeInvite] = useRevokeInviteMutation();

    const [inviteEmail, setInviteEmail] = useState("");
    const [inviteRole, setInviteRole] = useState<SingleValue<RoleOption>>(null);
    const [inviteLink, setInviteLink] = useState("");

    const canManage = orgData?.permissions.includes("manage_users") ?? false;
    const roles = rolesData?.roles ?? [];
    const members = membersData?.members ?? [];
    const invites = invitesData?.invites ?? [];

    const roleOptions: RoleOption[] = roles.map((r) => ({ value: r.id, label: r.name }));

    const handleUpdateRole = async (memberId: string, roleId: string, memberName: string) => {
        try {
            await updateRole({ memberId, roleId }).unwrap();
            toast.success(`Role updated for ${memberName}.`);
        } catch (err: unknown) {
            const e = err as { data?: { statusMessage?: string } };
            toast.error(e.data?.statusMessage ?? "Failed to update role.");
        }
    };

    const handleRemoveMember = async (memberId: string, memberName: string) => {
        if (!confirm(`Remove ${memberName} from the organisation?`)) return;
        try {
            await removeMember(memberId).unwrap();
            toast.success(`${memberName} has been removed.`);
        } catch (err: unknown) {
            const e = err as { data?: { statusMessage?: string } };
            toast.error(e.data?.statusMessage ?? "Failed to remove member.");
        }
    };

    const handleRevokeInvite = async (inviteId: string, email: string) => {
        try {
            await revokeInvite(inviteId).unwrap();
            toast.success(`Invite for ${email} revoked.`);
        } catch (err: unknown) {
            const e = err as { data?: { statusMessage?: string } };
            toast.error(e.data?.statusMessage ?? "Failed to revoke invite.");
        }
    };

    const handleSendInvite = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!inviteEmail.trim() || !inviteRole) return;
        setInviteLink("");
        try {
            const res = await sendInvite({ email: inviteEmail.trim(), roleId: inviteRole.value }).unwrap();
            const link = `${window.location.origin}/invites/${res.invite.token}`;
            setInviteLink(link);
            toast.success(`Invite sent to ${res.invite.email}`);
            setInviteEmail("");
            setInviteRole(null);
        } catch (err: unknown) {
            const e = err as { data?: { statusMessage?: string } };
            toast.error(e.data?.statusMessage ?? "Failed to send invite");
        }
    };

    const tabs = (
        <>
            <TabButton onClick={() => navigate("/org/settings")}>Settings</TabButton>
            <TabButton onClick={() => navigate("/org/roles")}>Roles</TabButton>
            <TabButton variant="ghost" onClick={() => navigate("/contracts")}>Contracts</TabButton>
        </>
    );

    return (
        <PageShell>
            <PageHeader eyebrow="Organisation" title="Members" tabs={tabs} />

            {/* Current members */}
            <section className="mb-8">
                <SectionLabel className="mb-3">Current Members</SectionLabel>
                {loadingMembers ? (
                    <p className="text-sm text-content-muted">Loading…</p>
                ) : members.length === 0 ? (
                    <EmptyState title="No members yet" description="Invite team members below." />
                ) : (
                    <div className="flex flex-col gap-2">
                        {members.map((m) => (
                            <Card key={m.id} padding="none" className="flex items-center justify-between px-5 py-3">
                                <div className="flex flex-col gap-0.5">
                                    <span className="text-sm font-semibold text-content-primary">{m.name}</span>
                                    <span className="text-xs text-content-muted">{m.email}</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    {canManage ? (
                                        <Select<RoleOption>
                                            options={roleOptions}
                                            value={roleOptions.find((r) => r.value === m.roleId) ?? null}
                                            onChange={(opt) => opt && handleUpdateRole(m.id, opt.value, m.name)}
                                            isSearchable={false}
                                            className="w-44"
                                        />
                                    ) : (
                                        <span className="text-xs font-medium text-brand-300 border border-brand-500/30 rounded-full px-2.5 py-1">
                                            {m.roleName}
                                        </span>
                                    )}
                                    {canManage && (
                                        <Button
                                            variant="danger-ghost"
                                            size="sm"
                                            onClick={() => handleRemoveMember(m.id, m.name)}
                                        >
                                            Remove
                                        </Button>
                                    )}
                                </div>
                            </Card>
                        ))}
                    </div>
                )}
            </section>

            {/* Pending invites */}
            {invites.length > 0 && (
                <section className="mb-8">
                    <SectionLabel className="mb-3">Pending Invites</SectionLabel>
                    <div className="flex flex-col gap-2">
                        {invites.map((inv) => (
                            <Card key={inv.id} variant="warning" padding="none" className="flex items-center justify-between px-5 py-3">
                                <div className="flex flex-col gap-0.5">
                                    <span className="text-sm text-content-primary">{inv.email}</span>
                                    <span className="text-xs text-content-muted">
                                        Role: {inv.roleName} · Invited by {inv.invitedBy} · Expires {new Date(inv.expiresAt).toLocaleDateString()}
                                    </span>
                                </div>
                                {canManage && (
                                    <Button
                                        variant="danger-ghost"
                                        size="sm"
                                        onClick={() => handleRevokeInvite(inv.id, inv.email)}
                                    >
                                        Revoke
                                    </Button>
                                )}
                            </Card>
                        ))}
                    </div>
                </section>
            )}

            {/* Invite form */}
            {canManage && (
                <section>
                    <SectionLabel className="mb-3">Invite a Member</SectionLabel>
                    <Card variant="brand" className="max-w-lg">
                        <form onSubmit={handleSendInvite} className="flex flex-col gap-4">
                            <FormField label="Email address">
                                <Input
                                    type="email"
                                    value={inviteEmail}
                                    onChange={(e) => setInviteEmail(e.target.value)}
                                    placeholder="colleague@company.com"
                                    required
                                />
                            </FormField>
                            <FormField label="Role">
                                <Select<RoleOption>
                                    options={roleOptions}
                                    value={inviteRole}
                                    onChange={(opt) => setInviteRole(opt)}
                                    placeholder="Select a role…"
                                />
                            </FormField>

                            {inviteLink && (
                                <FormField label="Share this invite link">
                                    <div className="flex gap-2">
                                        <Input readOnly value={inviteLink} className="text-xs text-status-active border-status-active/30" />
                                        <Button
                                            type="button"
                                            variant="secondary"
                                            size="sm"
                                            className="shrink-0"
                                            onClick={() => { navigator.clipboard.writeText(inviteLink); toast.success("Link copied!"); }}
                                        >
                                            Copy
                                        </Button>
                                    </div>
                                </FormField>
                            )}

                            <Button
                                type="submit"
                                loading={isSending}
                                disabled={!inviteEmail || !inviteRole}
                                className="self-start"
                            >
                                Send Invite
                            </Button>
                        </form>
                    </Card>
                </section>
            )}
        </PageShell>
    );
}
