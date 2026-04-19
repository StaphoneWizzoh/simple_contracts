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
    const [inviteRoleId, setInviteRoleId] = useState("");
    const [inviteLink, setInviteLink] = useState("");

    const canManage = orgData?.permissions.includes("manage_users") ?? false;
    const roles = rolesData?.roles ?? [];
    const members = membersData?.members ?? [];
    const invites = invitesData?.invites ?? [];

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
        if (!inviteEmail.trim() || !inviteRoleId) return;
        setInviteLink("");
        try {
            const res = await sendInvite({ email: inviteEmail.trim(), roleId: inviteRoleId }).unwrap();
            const link = `${window.location.origin}/invites/${res.invite.token}`;
            setInviteLink(link);
            toast.success(`Invite sent to ${res.invite.email}`);
            setInviteEmail("");
            setInviteRoleId("");
        } catch (err: unknown) {
            const e = err as { data?: { statusMessage?: string } };
            toast.error(e.data?.statusMessage ?? "Failed to send invite");
        }
    };

    return (
        <PageShell>
            <header className="flex items-center justify-between mb-8">
                <div>
                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-indigo-400">Organisation</p>
                    <h1 className="text-2xl font-bold text-white mt-0.5">Members</h1>
                </div>
                <nav className="flex gap-2">
                    <TabBtn onClick={() => navigate("/org/settings")}>Settings</TabBtn>
                    <TabBtn onClick={() => navigate("/org/roles")}>Roles</TabBtn>
                    <TabBtn onClick={() => navigate("/contracts")} variant="ghost">Contracts</TabBtn>
                </nav>
            </header>

            {/* Current members */}
            <section className="mb-8">
                <h2 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-3">Current Members</h2>
                {loadingMembers ? (
                    <p className="text-gray-400 text-sm">Loading…</p>
                ) : (
                    <div className="flex flex-col gap-2">
                        {members.map((m) => (
                            <div key={m.id} className="flex items-center justify-between rounded-xl border border-gray-700/60 bg-gray-900/60 px-5 py-3">
                                <div className="flex flex-col gap-0.5">
                                    <span className="text-sm font-semibold text-white">{m.name}</span>
                                    <span className="text-xs text-gray-400">{m.email}</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    {canManage ? (
                                        <select
                                            value={m.roleId}
                                            onChange={(e) => handleUpdateRole(m.id, e.target.value, m.name)}
                                            className="rounded-lg border border-gray-700 bg-gray-800 px-3 py-1.5 text-sm text-gray-200 outline-none focus:ring-2 ring-indigo-500"
                                        >
                                            {roles.map((r) => (
                                                <option key={r.id} value={r.id}>{r.name}</option>
                                            ))}
                                        </select>
                                    ) : (
                                        <span className="text-xs font-medium text-indigo-300 border border-indigo-500/30 rounded-full px-2.5 py-1">{m.roleName}</span>
                                    )}
                                    {canManage && (
                                        <button
                                            onClick={() => handleRemoveMember(m.id, m.name)}
                                            className="text-xs text-red-400 hover:text-red-300 transition"
                                        >
                                            Remove
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </section>

            {/* Pending invites */}
            {invites.length > 0 && (
                <section className="mb-8">
                    <h2 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-3">Pending Invites</h2>
                    <div className="flex flex-col gap-2">
                        {invites.map((inv) => (
                            <div key={inv.id} className="flex items-center justify-between rounded-xl border border-yellow-500/20 bg-yellow-400/5 px-5 py-3">
                                <div className="flex flex-col gap-0.5">
                                    <span className="text-sm text-white">{inv.email}</span>
                                    <span className="text-xs text-gray-400">Role: {inv.roleName} · Invited by {inv.invitedBy} · Expires {new Date(inv.expiresAt).toLocaleDateString()}</span>
                                </div>
                                {canManage && (
                                    <button
                                        onClick={() => handleRevokeInvite(inv.id, inv.email)}
                                        className="text-xs text-red-400 hover:text-red-300 transition"
                                    >
                                        Revoke
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {/* Invite form */}
            {canManage && (
                <section>
                    <h2 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-3">Invite a Member</h2>
                    <div className="rounded-2xl border border-indigo-500/20 bg-gray-900/60 p-5 max-w-lg">
                        <form onSubmit={handleSendInvite} className="flex flex-col gap-4">
                            <label className="flex flex-col gap-2">
                                <span className="text-sm font-medium text-gray-300">Email address</span>
                                <input
                                    type="email"
                                    value={inviteEmail}
                                    onChange={(e) => setInviteEmail(e.target.value)}
                                    placeholder="colleague@company.com"
                                    required
                                    className="rounded-lg border border-gray-700 bg-gray-800 px-4 py-2.5 text-gray-100 outline-none ring-indigo-500 placeholder:text-gray-500 focus:ring-2"
                                />
                            </label>
                            <label className="flex flex-col gap-2">
                                <span className="text-sm font-medium text-gray-300">Role</span>
                                <select
                                    value={inviteRoleId}
                                    onChange={(e) => setInviteRoleId(e.target.value)}
                                    required
                                    className="rounded-lg border border-gray-700 bg-gray-800 px-4 py-2.5 text-gray-200 outline-none ring-indigo-500 focus:ring-2"
                                >
                                    <option value="">Select a role…</option>
                                    {roles.map((r) => (
                                        <option key={r.id} value={r.id}>{r.name}</option>
                                    ))}
                                </select>
                            </label>

                            {inviteLink && (
                                <div className="flex flex-col gap-1.5">
                                    <span className="text-xs font-medium text-gray-400">Share this invite link:</span>
                                    <div className="flex items-center gap-2">
                                        <input
                                            readOnly
                                            value={inviteLink}
                                            className="flex-1 rounded-lg border border-emerald-500/30 bg-emerald-400/5 px-3 py-2 text-xs text-emerald-300 outline-none"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => { navigator.clipboard.writeText(inviteLink); toast.success("Link copied!"); }}
                                            className="rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-xs text-gray-300 hover:text-white transition"
                                        >
                                            Copy
                                        </button>
                                    </div>
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={isSending || !inviteEmail || !inviteRoleId}
                                className="self-start rounded-lg bg-indigo-600 px-5 py-2 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isSending ? "Sending…" : "Send Invite"}
                            </button>
                        </form>
                    </div>
                </section>
            )}
        </PageShell>
    );
}

function PageShell({ children }: { children: React.ReactNode }) {
    return (
        <main className="min-h-screen bg-linear-to-br from-gray-950 via-gray-900 to-gray-950 px-4 py-10 md:px-10">
            <div className="mx-auto w-full max-w-4xl">{children}</div>
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
