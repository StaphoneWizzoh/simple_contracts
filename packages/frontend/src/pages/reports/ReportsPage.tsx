import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
    LineChart, Line, XAxis, YAxis, CartesianGrid, Legend,
    BarChart, Bar,
} from "recharts";
import {
    useGetReportSummaryQuery,
    useGetReportByStatusQuery,
    useGetReportByTypeQuery,
    useGetExpiringSoonQuery,
    useGetSigningTurnaroundQuery,
    useGetApprovalTurnaroundQuery,
    useGetOverdueApprovalsQuery,
    useGetValueSummaryQuery,
} from "@/store/services/contractApi";

const STATUS_COLORS: Record<string, string> = {
    DRAFT: "#facc15",
    REVIEW: "#60a5fa",
    SENT_FOR_SIGNING: "#a78bfa",
    ACTIVE: "#34d399",
    EXPIRED: "#6b7280",
    TERMINATED: "#f87171",
};
const STATUS_LABELS: Record<string, string> = {
    DRAFT: "Draft", REVIEW: "In Review", SENT_FOR_SIGNING: "Sent for Signing",
    ACTIVE: "Active", EXPIRED: "Expired", TERMINATED: "Terminated",
};
const CHART_COLORS = ["#6366f1", "#34d399", "#60a5fa", "#facc15", "#f87171", "#a78bfa", "#fb923c"];

function fmt(minor: number | null | undefined) {
    if (minor == null) return "—";
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(minor / 100);
}
function days(n: number | null | undefined) {
    if (n == null) return "—";
    return `${n}d`;
}

type SummaryCardProps = { label: string; value: string | number; sub?: string; color?: string };
function SummaryCard({ label, value, sub, color = "text-white" }: SummaryCardProps) {
    return (
        <div className="rounded-xl border border-gray-700/60 bg-gray-900/60 p-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">{label}</p>
            <p className={`mt-1 text-3xl font-bold ${color}`}>{value}</p>
            {sub && <p className="mt-0.5 text-xs text-gray-500">{sub}</p>}
        </div>
    );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <section className="flex flex-col gap-4">
            <h2 className="text-lg font-semibold text-white border-b border-gray-800 pb-2">{title}</h2>
            {children}
        </section>
    );
}

export default function ReportsPage() {
    const navigate = useNavigate();
    const [expDays, setExpDays] = useState(90);
    const [overdueDays, setOverdueDays] = useState(3);

    const { data: summary, isLoading: sumLoading } = useGetReportSummaryQuery();
    const { data: byStatus } = useGetReportByStatusQuery({ months: 6 });
    const { data: byType } = useGetReportByTypeQuery({});
    const { data: expiring } = useGetExpiringSoonQuery({ days: expDays });
    const { data: sigTurnaround } = useGetSigningTurnaroundQuery({});
    const { data: appTurnaround } = useGetApprovalTurnaroundQuery({});
    const { data: overdue } = useGetOverdueApprovalsQuery({ thresholdDays: overdueDays });
    const { data: valueSummary } = useGetValueSummaryQuery({});

    const statusPieData = byStatus?.current.filter((d) => d.count > 0).map((d) => ({
        name: STATUS_LABELS[d.status] ?? d.status,
        value: d.count,
        fill: STATUS_COLORS[d.status] ?? "#6b7280",
    })) ?? [];

    const trendKeys = byStatus?.trend.length
        ? Object.keys(byStatus.trend[0]).filter((k) => k !== "month")
        : [];

    const typePieData = byType?.types.slice(0, 7).map((t, i) => ({
        name: t.contractType.replace(/_/g, " "),
        value: t.count,
        fill: CHART_COLORS[i % CHART_COLORS.length],
    })) ?? [];

    return (
        <main className="min-h-screen bg-linear-to-br from-gray-950 via-gray-900 to-gray-950 px-4 py-10 md:px-10">
            <div className="mx-auto w-full max-w-6xl flex flex-col gap-10">

                {/* Header */}
                <header className="flex items-end justify-between">
                    <div>
                        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-indigo-300/80">Analytics</p>
                        <h1 className="text-3xl font-bold tracking-tight text-white md:text-4xl">Reports</h1>
                    </div>
                    <div className="flex gap-3">
                        <a
                            href="/api/reports/export/contracts.csv"
                            download
                            className="rounded-lg border border-emerald-500/40 px-4 py-2 text-sm font-semibold text-emerald-300 hover:bg-emerald-600/20 transition"
                        >
                            Export CSV
                        </a>
                        <button
                            onClick={() => navigate("/contracts")}
                            className="rounded-lg border border-gray-700 bg-gray-800 px-4 py-2 text-sm font-medium text-gray-300 hover:bg-gray-700 transition"
                        >
                            ← Contracts
                        </button>
                    </div>
                </header>

                {/* Summary cards */}
                {sumLoading ? (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {Array.from({ length: 8 }).map((_, i) => (
                            <div key={i} className="rounded-xl border border-gray-700/60 bg-gray-900/60 h-24 animate-pulse" />
                        ))}
                    </div>
                ) : summary && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <SummaryCard label="Total Contracts" value={summary.total} />
                        <SummaryCard label="Active" value={summary.byStatus["ACTIVE"] ?? 0} color="text-emerald-400" />
                        <SummaryCard label="In Review" value={summary.byStatus["REVIEW"] ?? 0} color="text-blue-400" />
                        <SummaryCard label="Sent for Signing" value={summary.byStatus["SENT_FOR_SIGNING"] ?? 0} color="text-violet-400" />
                        <SummaryCard label="Expiring (30d)" value={summary.expiringSoon.days30} color="text-yellow-400" />
                        <SummaryCard label="Expiring (60d)" value={summary.expiringSoon.days60} color="text-yellow-300" />
                        <SummaryCard label="Expiring (90d)" value={summary.expiringSoon.days90} color="text-orange-400" />
                        <SummaryCard
                            label="Total Contract Value"
                            value={fmt(summary.value.totalMinor)}
                            sub={`avg ${fmt(summary.value.avgMinor)} · ${summary.value.contractsWithValue} contracts`}
                            color="text-emerald-300"
                        />
                    </div>
                )}

                {/* Charts row */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Status donut */}
                    <Section title="Contracts by Status">
                        {statusPieData.length > 0 ? (
                            <div className="rounded-xl border border-gray-700/60 bg-gray-900/60 p-5">
                                <ResponsiveContainer width="100%" height={240}>
                                    <PieChart>
                                        <Pie data={statusPieData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={60} outerRadius={100}>
                                            {statusPieData.map((entry, i) => (
                                                <Cell key={i} fill={entry.fill} />
                                            ))}
                                        </Pie>
                                        <Tooltip
                                            contentStyle={{ backgroundColor: "#111827", border: "1px solid #374151", borderRadius: 8 }}
                                            labelStyle={{ color: "#fff" }}
                                            itemStyle={{ color: "#d1d5db" }}
                                        />
                                        <Legend formatter={(value) => <span style={{ color: "#9ca3af", fontSize: 12 }}>{value}</span>} />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        ) : (
                            <p className="text-gray-500 text-sm">No data yet.</p>
                        )}
                    </Section>

                    {/* Type donut */}
                    <Section title="Contracts by Type">
                        {typePieData.length > 0 ? (
                            <div className="rounded-xl border border-gray-700/60 bg-gray-900/60 p-5">
                                <ResponsiveContainer width="100%" height={240}>
                                    <PieChart>
                                        <Pie data={typePieData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={60} outerRadius={100}>
                                            {typePieData.map((entry, i) => (
                                                <Cell key={i} fill={entry.fill} />
                                            ))}
                                        </Pie>
                                        <Tooltip
                                            contentStyle={{ backgroundColor: "#111827", border: "1px solid #374151", borderRadius: 8 }}
                                            itemStyle={{ color: "#d1d5db" }}
                                        />
                                        <Legend formatter={(value) => <span style={{ color: "#9ca3af", fontSize: 12 }}>{value}</span>} />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        ) : (
                            <p className="text-gray-500 text-sm">No data yet.</p>
                        )}
                    </Section>
                </div>

                {/* Trend line chart */}
                {byStatus?.trend && byStatus.trend.length > 0 && (
                    <Section title="Contract Creation Trend (Last 6 Months)">
                        <div className="rounded-xl border border-gray-700/60 bg-gray-900/60 p-5">
                            <ResponsiveContainer width="100%" height={240}>
                                <LineChart data={byStatus.trend} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                                    <XAxis dataKey="month" tick={{ fill: "#6b7280", fontSize: 11 }} />
                                    <YAxis tick={{ fill: "#6b7280", fontSize: 11 }} allowDecimals={false} />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: "#111827", border: "1px solid #374151", borderRadius: 8 }}
                                        itemStyle={{ color: "#d1d5db" }}
                                    />
                                    <Legend formatter={(value) => <span style={{ color: "#9ca3af", fontSize: 12 }}>{STATUS_LABELS[value] ?? value}</span>} />
                                    {trendKeys.map((key, i) => (
                                        <Line
                                            key={key}
                                            type="monotone"
                                            dataKey={key}
                                            stroke={STATUS_COLORS[key] ?? CHART_COLORS[i % CHART_COLORS.length]}
                                            strokeWidth={2}
                                            dot={false}
                                        />
                                    ))}
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </Section>
                )}

                {/* Value by type bar chart */}
                {valueSummary && valueSummary.byType.length > 0 && (
                    <Section title="Contract Value by Type">
                        <div className="rounded-xl border border-gray-700/60 bg-gray-900/60 p-5">
                            <ResponsiveContainer width="100%" height={220}>
                                <BarChart
                                    data={valueSummary.byType.map((t) => ({
                                        name: t.contractType.replace(/_/g, " "),
                                        value: Math.round(t.totalMinor / 100),
                                        count: t.count,
                                    }))}
                                    layout="vertical"
                                    margin={{ top: 0, right: 20, left: 80, bottom: 0 }}
                                >
                                    <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" horizontal={false} />
                                    <XAxis type="number" tick={{ fill: "#6b7280", fontSize: 11 }} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                                    <YAxis type="category" dataKey="name" tick={{ fill: "#9ca3af", fontSize: 11 }} width={80} />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: "#111827", border: "1px solid #374151", borderRadius: 8 }}
                                        formatter={(v) => [`$${Number(v).toLocaleString()}`, "Total Value"]}
                                    />
                                    <Bar dataKey="value" fill="#6366f1" radius={[0, 4, 4, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </Section>
                )}

                {/* Turnaround stats */}
                <Section title="Process Turnaround">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="rounded-xl border border-gray-700/60 bg-gray-900/60 p-5">
                            <p className="text-sm font-semibold text-gray-300 mb-3">Signing Turnaround</p>
                            {sigTurnaround && sigTurnaround.count > 0 ? (
                                <div className="grid grid-cols-3 gap-3 text-center">
                                    <div>
                                        <p className="text-2xl font-bold text-indigo-300">{days(sigTurnaround.avgDays)}</p>
                                        <p className="text-xs text-gray-500">Average</p>
                                    </div>
                                    <div>
                                        <p className="text-2xl font-bold text-emerald-400">{days(sigTurnaround.minDays)}</p>
                                        <p className="text-xs text-gray-500">Fastest</p>
                                    </div>
                                    <div>
                                        <p className="text-2xl font-bold text-orange-400">{days(sigTurnaround.maxDays)}</p>
                                        <p className="text-xs text-gray-500">Slowest</p>
                                    </div>
                                </div>
                            ) : (
                                <p className="text-gray-500 text-sm">No completed signings yet.</p>
                            )}
                        </div>
                        <div className="rounded-xl border border-gray-700/60 bg-gray-900/60 p-5">
                            <p className="text-sm font-semibold text-gray-300 mb-3">Approval Turnaround</p>
                            {appTurnaround && appTurnaround.count > 0 ? (
                                <div className="grid grid-cols-2 gap-3 text-center">
                                    <div>
                                        <p className="text-2xl font-bold text-indigo-300">{days(appTurnaround.avgDays)}</p>
                                        <p className="text-xs text-gray-500">Avg time to decide</p>
                                    </div>
                                    <div>
                                        <p className="text-lg font-semibold text-gray-300">
                                            <span className="text-emerald-400">{appTurnaround.approvedCount}</span>
                                            {" "}/{" "}
                                            <span className="text-red-400">{appTurnaround.rejectedCount}</span>
                                        </p>
                                        <p className="text-xs text-gray-500">Approved / Rejected</p>
                                    </div>
                                </div>
                            ) : (
                                <p className="text-gray-500 text-sm">No completed approvals yet.</p>
                            )}
                        </div>
                    </div>
                </Section>

                {/* Expiring soon table */}
                <Section title="Expiring Soon">
                    <div className="flex items-center gap-3 mb-2">
                        <span className="text-sm text-gray-400">Show contracts expiring in:</span>
                        {[30, 60, 90, 180].map((d) => (
                            <button
                                key={d}
                                onClick={() => setExpDays(d)}
                                className={`rounded-full px-3 py-1 text-xs font-medium border transition ${
                                    expDays === d
                                        ? "border-indigo-500 bg-indigo-600/30 text-indigo-200"
                                        : "border-gray-700 text-gray-400 hover:border-gray-600"
                                }`}
                            >
                                {d}d
                            </button>
                        ))}
                    </div>
                    {expiring && expiring.contracts.length > 0 ? (
                        <div className="overflow-x-auto rounded-xl border border-gray-700/60">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-gray-700 bg-gray-900/80">
                                        <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">Contract</th>
                                        <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">Party</th>
                                        <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">Expires</th>
                                        <th className="text-right px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">Days Left</th>
                                        <th className="text-right px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">Value</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-800">
                                    {expiring.contracts.map((c) => (
                                        <tr key={c.id} className="hover:bg-gray-900/40 transition">
                                            <td className="px-4 py-3 font-medium text-white">{c.title}</td>
                                            <td className="px-4 py-3 text-gray-400">{c.counterpartyName ?? "—"}</td>
                                            <td className="px-4 py-3 text-gray-400">
                                                {c.expiresAt ? new Date(c.expiresAt).toLocaleDateString() : "—"}
                                            </td>
                                            <td className={`px-4 py-3 text-right font-semibold ${
                                                (c.daysUntilExpiry ?? 999) <= 30 ? "text-red-400" :
                                                (c.daysUntilExpiry ?? 999) <= 60 ? "text-yellow-400" : "text-gray-300"
                                            }`}>
                                                {c.daysUntilExpiry ?? "—"}
                                            </td>
                                            <td className="px-4 py-3 text-right text-gray-400">{fmt(c.totalValueMinor)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <p className="text-gray-500 text-sm">No active contracts expiring in the next {expDays} days.</p>
                    )}
                </Section>

                {/* Overdue approvals */}
                <Section title="Overdue Approvals">
                    <div className="flex items-center gap-3 mb-2">
                        <span className="text-sm text-gray-400">Stuck for more than:</span>
                        {[1, 3, 7, 14].map((d) => (
                            <button
                                key={d}
                                onClick={() => setOverdueDays(d)}
                                className={`rounded-full px-3 py-1 text-xs font-medium border transition ${
                                    overdueDays === d
                                        ? "border-indigo-500 bg-indigo-600/30 text-indigo-200"
                                        : "border-gray-700 text-gray-400 hover:border-gray-600"
                                }`}
                            >
                                {d}d
                            </button>
                        ))}
                    </div>
                    {overdue && overdue.contracts.length > 0 ? (
                        <div className="overflow-x-auto rounded-xl border border-gray-700/60">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-gray-700 bg-gray-900/80">
                                        <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">Contract</th>
                                        <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">Status</th>
                                        <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">Owner</th>
                                        <th className="text-right px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">Days Stale</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-800">
                                    {overdue.contracts.map((c) => (
                                        <tr key={c.id} className="hover:bg-gray-900/40 transition">
                                            <td className="px-4 py-3 font-medium text-white">{c.title}</td>
                                            <td className="px-4 py-3 text-gray-400">{STATUS_LABELS[c.status] ?? c.status}</td>
                                            <td className="px-4 py-3 text-gray-400">{c.ownerUser?.name ?? "—"}</td>
                                            <td className="px-4 py-3 text-right font-semibold text-red-400">{c.staleDays}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <p className="text-gray-500 text-sm">No contracts stale for more than {overdueDays} day{overdueDays !== 1 ? "s" : ""}.</p>
                    )}
                </Section>

            </div>
        </main>
    );
}
