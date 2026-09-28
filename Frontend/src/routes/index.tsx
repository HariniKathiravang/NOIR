import { createFileRoute, Link } from "@tanstack/react-router";
import { Battery, BatteryLow, MapPin, Radio, Thermometer, Waves } from "lucide-react";
import { AppShell } from "@/components/noir/app-shell";
import { StatusBadge } from "@/components/noir/status-badge";
import { devices } from "@/lib/noir-data";

export const Route = createFileRoute("/")({
  head: () => ({ meta: [
    { title: "Device Overview — NOIR" },
    { name: "description", content: "Monitor registered cold-chain devices, environmental readings, and compliance status." },
    { property: "og:title", content: "Device Overview — NOIR" },
    { property: "og:description", content: "Monitor registered cold-chain devices, environmental readings, and compliance status." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ]}),
  component: DeviceOverview,
});

function DeviceOverview() {
  const normal = devices.filter((device) => device.status === "Normal").length;
  const warnings = devices.filter((device) => device.status === "Warning").length;
  const alerts = devices.filter((device) => device.status === "Alert").length;
  return (
    <AppShell title="Device overview" description="Live environmental monitoring across your registered fleet.">
      <section className="mb-6 grid grid-cols-2 border-y bg-card md:grid-cols-4" aria-label="Fleet summary">
        {[{ label: "Registered", value: devices.length, tone: "text-foreground" }, { label: "Normal", value: normal, tone: "text-success" }, { label: "Warnings", value: warnings, tone: "text-warning" }, { label: "Active alerts", value: alerts, tone: "text-destructive" }].map((item) => (
          <div key={item.label} className="border-r p-4 last:border-r-0 md:px-5"><p className="text-xs font-medium text-muted-foreground">{item.label}</p><p className={`mt-1 text-2xl font-semibold tabular-nums ${item.tone}`}>{item.value}</p></div>
        ))}
      </section>
      <div className="mb-4 flex items-center justify-between"><h2 className="text-sm font-semibold">Registered devices</h2><span className="flex items-center gap-2 text-xs text-muted-foreground"><Radio className="size-3.5 text-success" />Live readings</span></div>
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {devices.map((device) => <DeviceCard key={device.id} device={device} />)}
      </section>
    </AppShell>
  );
}

function DeviceCard({ device }: { device: (typeof devices)[number] }) {
  const BatteryIcon = device.battery < 30 ? BatteryLow : Battery;
  return (
    <Link to="/device/$deviceId" params={{ deviceId: device.id }} className="group rounded-lg border bg-card p-5 shadow-sm transition-[border-color,box-shadow,transform] hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-ring">
      <div className="flex items-start justify-between gap-4"><div className="min-w-0"><h3 className="truncate text-base font-semibold group-hover:text-primary">{device.name}</h3><p className="mt-1 flex items-center gap-1.5 truncate text-xs text-muted-foreground"><MapPin className="size-3" />{device.location}</p></div><StatusBadge status={device.status} /></div>
      <div className="my-5 grid grid-cols-2 divide-x rounded-md border bg-muted/25 py-3"><div className="flex items-center gap-3 px-4"><Thermometer className="size-4 text-primary" /><div><p className="text-[11px] text-muted-foreground">Temperature</p><p className="mt-0.5 text-xl font-semibold tabular-nums">{device.temperature.toFixed(1)}°C</p></div></div><div className="flex items-center gap-3 px-4"><Waves className="size-4 text-primary" /><div><p className="text-[11px] text-muted-foreground">Humidity</p><p className="mt-0.5 text-xl font-semibold tabular-nums">{device.humidity}%</p></div></div></div>
      <div className="flex items-center justify-between border-t pt-4 text-xs text-muted-foreground"><span>Seen {device.lastSeen}</span><span className="flex items-center gap-1.5"><BatteryIcon className="size-4" /><span className="tabular-nums">{device.battery}%</span></span></div>
    </Link>
  );
}