import { createFileRoute } from "@tanstack/react-router";
import { AlertTriangle, Check, ChevronDown, ExternalLink, LoaderCircle, ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { shortHash } from "@/lib/noir-data";

export const Route = createFileRoute("/verify/$batchId")({
  validateSearch: (search: Record<string, unknown>) => ({ fail: search["fail"] === true || search["fail"] === "true" }),
  head: ({ params }) => ({ meta: [
    { title: `Verify ${params.batchId} — NOIR` }, { name: "description", content: `Public integrity verification for NOIR compliance batch ${params.batchId}.` },
    { property: "og:title", content: `Verify ${params.batchId} — NOIR` }, { property: "og:description", content: `Public integrity verification for NOIR compliance batch ${params.batchId}.` },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" },
  ]}), component: VerifyPage,
});

function VerifyPage() {
  const { batchId } = Route.useParams(); const { fail } = Route.useSearch(); const [checking, setChecking] = useState(true);
  useEffect(() => { const timer = window.setTimeout(() => setChecking(false), 1200); return () => window.clearTimeout(timer); }, [fail]);
  return <main className="grid min-h-screen place-items-center bg-background px-4 py-10"><div className="w-full max-w-xl"><div className="mb-6 flex items-center justify-center gap-2"><span className="grid size-9 place-items-center rounded-md bg-foreground text-background"><ShieldCheck className="size-5" /></span><span className="text-xl font-bold">NOIR</span></div><section className="rounded-lg border bg-card p-6 text-center shadow-sm md:p-10">{checking ? <div className="py-14"><LoaderCircle className="mx-auto size-10 animate-spin text-primary" /><h1 className="mt-5 text-xl font-semibold">Checking record integrity...</h1><p className="mt-2 text-sm text-muted-foreground">Comparing the record against its blockchain proof.</p></div> : fail ? <ResultFailure batchId={batchId} /> : <ResultSuccess batchId={batchId} />}</section><p className="mt-5 text-center text-xs text-muted-foreground">Public verification · No account required</p></div></main>;
}

function ResultSuccess({ batchId }: { batchId: string }) { return <><span className="mx-auto grid size-16 place-items-center rounded-full bg-success-soft text-success"><Check className="size-8" /></span><p className="mt-5 text-xs font-semibold uppercase text-success">Integrity confirmed</p><h1 className="mx-auto mt-2 max-w-md text-2xl font-semibold">Verified — this record has not been altered</h1><p className="mt-3 text-sm text-muted-foreground">Anchored Sep 27, 2026 at 16:04 UTC</p><div className="mt-7 rounded-md border bg-muted/25 px-4 py-3 text-left"><p className="text-[11px] font-semibold uppercase text-muted-foreground">Batch ID</p><p className="mt-1 font-mono text-sm">{batchId}</p></div><Proof /></>; }
function ResultFailure({ batchId }: { batchId: string }) { return <><span className="mx-auto grid size-16 place-items-center rounded-full bg-destructive-soft text-destructive"><AlertTriangle className="size-8" /></span><p className="mt-5 text-xs font-semibold uppercase text-destructive">Integrity check failed</p><h1 className="mx-auto mt-2 max-w-md text-2xl font-semibold">Verification failed — this record does not match the blockchain record</h1><p className="mt-3 text-sm text-muted-foreground">Do not rely on this certificate. Contact the issuing exporter.</p><div className="mt-7 rounded-md border border-destructive/20 bg-destructive-soft px-4 py-3 text-left"><p className="text-[11px] font-semibold uppercase text-destructive">Affected batch</p><p className="mt-1 font-mono text-sm">{batchId}</p></div><Proof /></>; }
function Proof() { return <Collapsible className="mt-4 rounded-md border"><CollapsibleTrigger asChild><Button variant="ghost" className="h-11 w-full justify-between px-4">View technical proof<ChevronDown /></Button></CollapsibleTrigger><CollapsibleContent className="border-t px-4 py-4 text-left"><p className="text-[11px] font-semibold uppercase text-muted-foreground">Merkle root</p><code className="mt-1 block text-xs">{shortHash("0x1e64b9fa178c9d7d348edaa27e3dbd839d506fe1")}</code><p className="mt-4 text-[11px] font-semibold uppercase text-muted-foreground">Transaction</p><a href="#transaction" className="mt-1 inline-flex items-center gap-1 font-mono text-xs text-primary hover:underline">0x71bc4e...cd8a<ExternalLink className="size-3" /></a></CollapsibleContent></Collapsible>; }