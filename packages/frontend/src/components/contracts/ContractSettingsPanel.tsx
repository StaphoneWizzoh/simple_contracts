import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useUpdateSettingsMutation } from "@/store/services/contractApi";
import type { ContractDetail, ContractSettingsRequest } from "@/store/services/contractApi";

const CONTRACT_TYPES = [
    { value: "OTHER", label: "Other" },
    { value: "NDA", label: "Non-Disclosure Agreement" },
    { value: "SERVICE_AGREEMENT", label: "Service Agreement" },
    { value: "EMPLOYMENT", label: "Employment Contract" },
    { value: "CONSULTING", label: "Consulting Agreement" },
    { value: "LEASE", label: "Lease Agreement" },
    { value: "PURCHASE", label: "Purchase Agreement" },
    { value: "PARTNERSHIP", label: "Partnership Agreement" },
];

const CURRENCIES = ["USD", "EUR", "GBP", "KES", "ZAR", "NGN", "GHS", "UGX", "TZS"];

const EXPIRY_DAYS = [7, 14, 30, 60];

function toDateInput(iso: string | null | undefined): string {
    if (!iso) return "";
    return iso.slice(0, 10);
}

function getErrorMessage(error: unknown): string {
    if (!error || typeof error !== "object") return "Failed to save settings";
    const e = error as { data?: { message?: string; statusMessage?: string } };
    return e.data?.message || e.data?.statusMessage || "Failed to save settings";
}

type Props = {
    contract: ContractDetail;
    isEditable: boolean;
};

export default function ContractSettingsPanel({ contract, isEditable }: Props) {
    const [contractType, setContractType] = useState(contract.contractType ?? "OTHER");
    const [effectiveAt, setEffectiveAt] = useState(toDateInput(contract.effectiveAt));
    const [expiresAt, setExpiresAt] = useState(toDateInput(contract.expiresAt));
    const [currencyCode, setCurrencyCode] = useState(contract.currencyCode ?? "USD");
    const [totalValue, setTotalValue] = useState(
        contract.totalValueMinor != null ? String(contract.totalValueMinor / 100) : "",
    );
    const [approvalWorkflow, setApprovalWorkflow] = useState(contract.approvalWorkflow ?? "SIMULTANEOUS");
    const [signingWorkflow, setSigningWorkflow] = useState(contract.signingWorkflow ?? "SIMULTANEOUS");
    const [signatureType, setSignatureType] = useState(contract.signatureType ?? "BOTH");
    const [signingLinkExpiryDays, setSigningLinkExpiryDays] = useState(
        contract.signingLinkExpiryDays ?? 14,
    );
    const [isDirty, setIsDirty] = useState(false);

    const [updateSettings, { isLoading }] = useUpdateSettingsMutation();

    useEffect(() => {
        setContractType(contract.contractType ?? "OTHER");
        setEffectiveAt(toDateInput(contract.effectiveAt));
        setExpiresAt(toDateInput(contract.expiresAt));
        setCurrencyCode(contract.currencyCode ?? "USD");
        setTotalValue(contract.totalValueMinor != null ? String(contract.totalValueMinor / 100) : "");
        setApprovalWorkflow(contract.approvalWorkflow ?? "SIMULTANEOUS");
        setSigningWorkflow(contract.signingWorkflow ?? "SIMULTANEOUS");
        setSignatureType(contract.signatureType ?? "BOTH");
        setSigningLinkExpiryDays(contract.signingLinkExpiryDays ?? 14);
        setIsDirty(false);
    }, [contract.id]);

    const handleSave = async () => {
        const parsedValue = totalValue ? Math.round(parseFloat(totalValue) * 100) : null;
        const settings: ContractSettingsRequest = {
            contractType,
            effectiveAt: effectiveAt || null,
            expiresAt: expiresAt || null,
            currencyCode,
            totalValueMinor: parsedValue,
            approvalWorkflow,
            signingWorkflow,
            signatureType,
            signingLinkExpiryDays,
        };
        try {
            await updateSettings({ contractId: contract.id, ...settings }).unwrap();
            toast.success("Settings saved");
            setIsDirty(false);
        } catch (err) {
            toast.error(getErrorMessage(err));
        }
    };

    const mark = () => setIsDirty(true);

    const fieldCls = `rounded-lg border bg-gray-800 px-3 py-2 text-sm text-gray-100 outline-none ring-indigo-500 focus:ring-2 ${
        isEditable ? "border-gray-700 placeholder:text-gray-500" : "border-gray-800 opacity-60 cursor-not-allowed"
    }`;

    const radioGroup = (
        label: string,
        value: string,
        onChange: (v: string) => void,
        options: { value: string; label: string }[],
    ) => (
        <div className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">{label}</span>
            <div className="flex gap-3">
                {options.map((opt) => (
                    <label
                        key={opt.value}
                        className={`flex items-center gap-2 cursor-pointer ${!isEditable ? "cursor-not-allowed opacity-60" : ""}`}
                    >
                        <input
                            type="radio"
                            name={label}
                            value={opt.value}
                            checked={value === opt.value}
                            disabled={!isEditable}
                            onChange={() => { onChange(opt.value); mark(); }}
                            className="accent-indigo-500"
                        />
                        <span className="text-sm text-gray-300">{opt.label}</span>
                    </label>
                ))}
            </div>
        </div>
    );

    return (
        <section className="rounded-2xl border border-indigo-500/10 bg-gray-900/50 p-5 flex flex-col gap-5">
            <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wide">
                    Contract Settings
                </h2>
                {isEditable && isDirty && (
                    <button
                        type="button"
                        onClick={handleSave}
                        disabled={isLoading}
                        className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-500 disabled:opacity-50"
                    >
                        {isLoading ? "Saving…" : "Save Settings"}
                    </button>
                )}
            </div>

            {/* Type + Dates + Value */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <label className="flex flex-col gap-1.5">
                    <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">Contract Type</span>
                    <select
                        value={contractType}
                        disabled={!isEditable}
                        onChange={(e) => { setContractType(e.target.value); mark(); }}
                        className={fieldCls}
                    >
                        {CONTRACT_TYPES.map((t) => (
                            <option key={t.value} value={t.value}>{t.label}</option>
                        ))}
                    </select>
                </label>

                <label className="flex flex-col gap-1.5">
                    <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">Effective Date</span>
                    <input
                        type="date"
                        value={effectiveAt}
                        disabled={!isEditable}
                        onChange={(e) => { setEffectiveAt(e.target.value); mark(); }}
                        className={fieldCls}
                    />
                </label>

                <label className="flex flex-col gap-1.5">
                    <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">Expiry Date</span>
                    <input
                        type="date"
                        value={expiresAt}
                        disabled={!isEditable}
                        onChange={(e) => { setExpiresAt(e.target.value); mark(); }}
                        className={fieldCls}
                    />
                </label>

                <label className="flex flex-col gap-1.5">
                    <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">Currency</span>
                    <select
                        value={currencyCode}
                        disabled={!isEditable}
                        onChange={(e) => { setCurrencyCode(e.target.value); mark(); }}
                        className={fieldCls}
                    >
                        {CURRENCIES.map((c) => (
                            <option key={c} value={c}>{c}</option>
                        ))}
                    </select>
                </label>

                <label className="flex flex-col gap-1.5">
                    <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">Contract Value</span>
                    <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={totalValue}
                        disabled={!isEditable}
                        placeholder="0.00"
                        onChange={(e) => { setTotalValue(e.target.value); mark(); }}
                        className={fieldCls}
                    />
                </label>

                <label className="flex flex-col gap-1.5">
                    <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">Signing Link Expiry</span>
                    <select
                        value={signingLinkExpiryDays}
                        disabled={!isEditable}
                        onChange={(e) => { setSigningLinkExpiryDays(Number(e.target.value)); mark(); }}
                        className={fieldCls}
                    >
                        {EXPIRY_DAYS.map((d) => (
                            <option key={d} value={d}>{d} days</option>
                        ))}
                    </select>
                </label>
            </div>

            {/* Workflow settings */}
            <div className="grid gap-5 sm:grid-cols-3 border-t border-gray-800 pt-4">
                {radioGroup("Approval Workflow", approvalWorkflow, setApprovalWorkflow, [
                    { value: "SIMULTANEOUS", label: "Simultaneous" },
                    { value: "SEQUENTIAL", label: "Sequential" },
                ])}
                {radioGroup("Signing Order", signingWorkflow, setSigningWorkflow, [
                    { value: "SIMULTANEOUS", label: "Simultaneous" },
                    { value: "SEQUENTIAL", label: "Sequential" },
                ])}
                {radioGroup("Signature Type", signatureType, setSignatureType, [
                    { value: "BOTH", label: "Either" },
                    { value: "TYPED", label: "Typed" },
                    { value: "DRAWN", label: "Drawn" },
                ])}
            </div>
        </section>
    );
}
