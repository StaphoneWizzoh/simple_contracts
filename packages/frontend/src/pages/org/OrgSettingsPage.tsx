import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useGetOrgQuery, useUpdateOrgMutation } from "@/store/services/orgApi";
import { PageShell, PageHeader, TabButton, Card, FormField, Button, Input } from "@/components/ui";

export default function OrgSettingsPage() {
    const navigate = useNavigate();
    const { data, isLoading } = useGetOrgQuery();
    const [updateOrg, { isLoading: isSaving }] = useUpdateOrgMutation();

    const [name, setName] = useState("");
    const [legalName, setLegalName] = useState("");

    const canManage = data?.permissions.includes("manage_org") ?? false;

    useEffect(() => {
        if (data?.org) {
            setName(data.org.name);
            setLegalName(data.org.legalName ?? "");
        }
    }, [data]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) return;
        try {
            await updateOrg({ name: name.trim(), legalName: legalName.trim() || undefined }).unwrap();
            toast.success("Organisation updated.");
        } catch {
            toast.error("Failed to update organisation.");
        }
    };

    const tabs = (
        <>
            <TabButton onClick={() => navigate("/org/members")}>Members</TabButton>
            <TabButton onClick={() => navigate("/org/roles")}>Roles</TabButton>
            <TabButton variant="ghost" onClick={() => navigate("/contracts")}>Contracts</TabButton>
        </>
    );

    if (isLoading) {
        return (
            <PageShell>
                <p className="text-content-muted">Loading…</p>
            </PageShell>
        );
    }

    return (
        <PageShell>
            <PageHeader eyebrow="Organisation" title="Settings" tabs={tabs} />

            <Card variant="brand" className="max-w-lg">
                <p className="text-xs font-bold uppercase tracking-wider text-content-disabled mb-5">General</p>
                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                    <FormField label="Organisation name" required>
                        <Input
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            disabled={!canManage}
                        />
                    </FormField>
                    <FormField label="Legal name" hint="optional">
                        <Input
                            value={legalName}
                            onChange={(e) => setLegalName(e.target.value)}
                            disabled={!canManage}
                            placeholder="Optional registered legal name"
                        />
                    </FormField>
                    {canManage && (
                        <Button
                            type="submit"
                            loading={isSaving}
                            disabled={!name.trim()}
                            className="self-start"
                        >
                            Save Changes
                        </Button>
                    )}
                </form>
            </Card>
        </PageShell>
    );
}
