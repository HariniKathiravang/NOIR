import { createFileRoute, Link } from "@tanstack/react-router";
import { AlertTriangle, ArrowUpRight, CheckCircle2, Clock3 } from "lucide-react";
import { AppShell } from "@/components/noir/app-shell";
import { StatusBadge } from "@/components/noir/status-badge";
import { Button } from "@/components/ui/button";
import { alerts } from "@/lib/noir-data";

export const Route = createFileRoute("/alerts")({
  head: () => ({ meta: [
    { title: "Alerts — NOIR" }, { name: "description", content: "Review cold-chain anomalies and threshold breaches across monitored devices." },
    { property: "og:title", content: "Alerts — NOIR" }, { property: "og:description", content: "Review cold-chain anomalies and threshold breaches across monitored devices." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" },
  ]}), component: AlertsPage,
});

function AlertsPage() {
  return <AppShell title="Alerts" description="Chronological record of threshold breaches and device anomalies."><div className="overflow-hidden rounded-lg border bg-card shadow-sm"><div className="flex items-center justify-between border-b bg-muted/35 px-5 py-3"><span className="text-xs font-medium text-muted-foreground">4 events · last 72 hours</span><Button variant="outline" size="sm">Mark all reviewed</Button></div>{alerts.map((alert) => { const resolved = alert.severity === "Resolved"; const Icon = resolved ? CheckCircle2 : alert.severity === "Warning" ? Clock3 : AlertTriangle; return <article key={alert.id} className="grid gap-4 border-b px-5 py-5 last:border-0 md:grid-cols-[40px_1fr_auto] md:items-start"><span className={`grid size-9 place-items-center rounded-md ${resolved ? "bg-success-soft text-success" : alert.severity === "Warning" ? "bg-warning-soft text-warning" : "bg-destructive-soft text-destructive"}`}><Icon className="size-4" /></span><div><div className="flex flex-wrap items-center gap-2"><h2 className="text-sm font-semibold">{alert.device}</h2><StatusBadge status={alert.severity as "Alert" | "Warning" | "Resolved"} /></div><p className="mt-1 text-sm text-foreground">{alert.detail}</p><p className="mt-2 text-xs text-muted-foreground">{alert.time} · {alert.batchId}</p></div><Button variant="ghost" size="sm" asChild><Link to="/device/$deviceId" params={{ deviceId: alert.deviceId }} hash={alert.batchId}>View batch<ArrowUpRight /></Link></Button></article>; })}</div></AppShell>;
}