import { createFileRoute, Link } from "@tanstack/react-router";
import { AlertTriangle, ArrowLeft, Check, Copy, Download, ExternalLink, FileCheck2, MapPin } from "lucide-react";
import { useState } from "react";
import { CartesianGrid, Line, LineChart, ReferenceLine, XAxis, YAxis } from "recharts";
import { AppShell } from "@/components/noir/app-shell";
import { StatusBadge } from "@/components/noir/status-badge";
import { Button } from "@/components/ui/button";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { batchesFor, getDevice, shortHash, temperatureData, type Batch } from "@/lib/noir-data";

export const Route = createFileRoute("/device/$deviceId")({
  head: ({ params }) => { const device = getDevice(params.deviceId); return { meta: [
    { title: `${device.name} — NOIR` },
    { name: "description", content: `Temperature history and tamper-proof compliance batches for ${device.name}.` },
    { property: "og:title", content: `${device.name} — NOIR` },
    { property: "og:description", content: `Temperature history and tamper-proof compliance batches for ${device.name}.` },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ]}; },
  component: DeviceDetail,
});

const chartConfig = { temperature: { label: "Temperature", color: "var(--primary)" } } satisfies ChartConfig;

function DeviceDetail() {
  const { deviceId } = Route.useParams();
  const device = getDevice(deviceId);
  const batches = batchesFor(device.id);
  return (
    <AppShell title={device.name} description={`${device.serial} · ${device.location}`} actions={<Button variant="outline" asChild><Link to="/"><ArrowLeft />All devices</Link></Button>}>
      <div className="mb-6 grid gap-3 sm:grid-cols-3"><Metric label="Current temperature" value={`${device.temperature.toFixed(1)}°C`} note="Target 2–5°C" /><Metric label="Current humidity" value={`${device.humidity}%`} note="Target 55–70%" /><div className="rounded-lg border bg-card p-4"><p className="text-xs text-muted-foreground">Device status</p><div className="mt-2"><StatusBadge status={device.status} /></div><p className="mt-2 text-xs text-muted-foreground">Seen {device.lastSeen}</p></div></div>
      <section className="rounded-lg border bg-card p-4 shadow-sm md:p-6">
        <div className="mb-6 flex flex-wrap items-start justify-between gap-3"><div><h2 className="font-semibold">Temperature · last 24 hours</h2><p className="mt-1 text-xs text-muted-foreground">2-minute sampling · UTC</p></div><div className="flex items-center gap-2 rounded-md bg-destructive-soft px-2.5 py-1.5 text-xs font-medium text-destructive"><AlertTriangle className="size-3.5" />Spike detected at 15:00</div></div>
        <ChartContainer config={chartConfig} className="h-[260px] w-full aspect-auto md:h-[320px]">
          <LineChart accessibilityLayer data={temperatureData} margin={{ left: 0, right: 14, top: 8, bottom: 0 }}><CartesianGrid vertical={false} strokeDasharray="3 3" /><XAxis dataKey="time" tickLine={false} axisLine={false} tickMargin={10} interval={1} /><YAxis domain={[0, 10]} tickLine={false} axisLine={false} tickFormatter={(value) => `${value}°`} width={34} /><ChartTooltip content={<ChartTooltipContent indicator="line" />} /><ReferenceLine y={8} stroke="var(--destructive)" strokeDasharray="5 5" label={{ value: "Limit", fill: "var(--destructive)", fontSize: 11 }} /><Line dataKey="temperature" type="monotone" stroke="var(--color-temperature)" strokeWidth={2.5} dot={false} activeDot={{ r: 4 }} /></LineChart>
        </ChartContainer>
      </section>
      <section className="mt-6"><div className="mb-3"><h2 className="font-semibold">Batch timeline</h2><p className="mt-1 text-xs text-muted-foreground">Immutable reading groups anchored to the Polygon network.</p></div><div className="overflow-hidden rounded-lg border bg-card shadow-sm"><div className="hidden grid-cols-[1.1fr_1.5fr_.6fr_.8fr_1fr_auto] gap-4 border-b bg-muted/40 px-5 py-3 text-[11px] font-semibold uppercase text-muted-foreground lg:grid"><span>Batch ID</span><span>Time range</span><span>Readings</span><span>Status</span><span>Transaction</span><span>Certificate</span></div>{batches.map((batch) => <BatchRow key={batch.id} batch={batch} deviceName={device.name} />)}</div></section>
    </AppShell>
  );
}

function Metric({ label, value, note }: { label: string; value: string; note: string }) { return <div className="rounded-lg border bg-card p-4"><p className="text-xs text-muted-foreground">{label}</p><p className="mt-1 text-2xl font-semibold tabular-nums">{value}</p><p className="mt-1 text-xs text-muted-foreground">{note}</p></div>; }

function BatchRow({ batch, deviceName }: { batch: Batch; deviceName: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => { await navigator.clipboard.writeText(batch.txHash); setCopied(true); window.setTimeout(() => setCopied(false), 1400); };
  return <div id={batch.id} className="grid gap-3 border-b px-5 py-4 last:border-0 lg:grid-cols-[1.1fr_1.5fr_.6fr_.8fr_1fr_auto] lg:items-center lg:gap-4"><div><span className="mb-1 block text-[10px] uppercase text-muted-foreground lg:hidden">Batch ID</span><span className="font-mono text-xs font-semibold">{batch.id}</span></div><div className="text-sm text-muted-foreground">{batch.range}</div><div className="text-sm tabular-nums text-muted-foreground">{batch.readings}</div><div><StatusBadge status={batch.status} /></div><div className="flex items-center gap-1"><code className="text-xs text-primary">{shortHash(batch.txHash)}</code><Button size="icon" variant="ghost" className="size-7" onClick={copy} aria-label={`Copy transaction hash for ${batch.id}`}>{copied ? <Check className="text-success" /> : <Copy />}</Button></div><CertificateDialog batch={batch} deviceName={deviceName} /></div>;
}

function CertificateDialog({ batch, deviceName }: { batch: Batch; deviceName: string }) {
  return <Dialog><DialogTrigger asChild><Button variant="outline" size="sm"><FileCheck2 />Certificate</Button></DialogTrigger><DialogContent className="max-h-[92vh] max-w-3xl overflow-y-auto p-0"><div className="border-b bg-muted/40 px-6 py-4"><DialogHeader><DialogTitle>Compliance certificate</DialogTitle><DialogDescription>Official environmental integrity record</DialogDescription></DialogHeader></div><div className="p-6 md:p-8"><div className="mb-8 flex flex-col justify-between gap-5 border-b pb-7 sm:flex-row"><div><div className="mb-5 flex items-center gap-2"><span className="grid size-9 place-items-center rounded-md bg-foreground text-background"><FileCheck2 className="size-5" /></span><div><p className="text-lg font-bold">NOIR</p><p className="text-[10px] uppercase text-muted-foreground">Compliance certificate</p></div></div><h3 className="text-2xl font-semibold">Cold-chain integrity record</h3><p className="mt-2 font-mono text-sm text-muted-foreground">{batch.id}</p></div><div className="self-start rounded-md border border-success/25 bg-success-soft px-3 py-2 text-xs font-semibold text-success"><span className="flex items-center gap-2"><Check className="size-4" />Verified on blockchain</span></div></div><div className="grid gap-x-8 gap-y-6 sm:grid-cols-2"><CertificateField label="Device" value={deviceName} /><CertificateField label="Date range" value={batch.range} /><CertificateField label="Temperature" value="Min 2.8°C · Avg 4.1°C · Max 8.9°C" /><CertificateField label="Humidity" value="Min 61% · Avg 67% · Max 74%" /></div><div className="mt-8 grid gap-6 border-t pt-7 md:grid-cols-[1fr_auto]"><div className="space-y-5"><div><p className="text-[11px] font-semibold uppercase text-muted-foreground">Merkle root</p><code className="mt-1 block break-all text-xs">{shortHash(batch.merkleRoot)}</code></div><div><p className="text-[11px] font-semibold uppercase text-muted-foreground">Blockchain transaction</p><a href="#proof" className="mt-1 inline-flex items-center gap-1 font-mono text-xs text-primary hover:underline">{shortHash(batch.txHash)}<ExternalLink className="size-3" /></a></div></div><QrMark /></div><div className="mt-8 flex flex-col-reverse justify-between gap-3 border-t pt-5 sm:flex-row sm:items-center"><p className="flex items-center gap-1.5 text-xs text-muted-foreground"><MapPin className="size-3.5" />Issued Sep 27, 2026 at 16:04 UTC</p><Button onClick={() => undefined}><Download />Download as PDF</Button></div></div></DialogContent></Dialog>;
}

function CertificateField({ label, value }: { label: string; value: string }) { return <div><p className="text-[11px] font-semibold uppercase text-muted-foreground">{label}</p><p className="mt-1 text-sm font-medium">{value}</p></div>; }
function QrMark() { const cells = [0,1,2,4,6,7,8,9,11,13,16,18,19,20,22,24,26,27,29,31,32,34,36,38,40,41,42,44,46,48,50,52,54,56,57,58,60,62,64,66,68,70,72,73,74,76,78,80]; return <div className="grid size-24 grid-cols-9 gap-0.5 border bg-card p-2" aria-label="QR code placeholder">{Array.from({ length: 81 }, (_, index) => <span key={index} className={cells.includes(index) ? "bg-foreground" : "bg-card"} />)}</div>; }