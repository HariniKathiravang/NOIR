import { Link, useRouterState } from "@tanstack/react-router";
import { Bell, Boxes, Menu, Search, ShieldCheck, X } from "lucide-react";
import { useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const nav = [
  { to: "/" as const, label: "Devices", icon: Boxes },
  { to: "/alerts" as const, label: "Alerts", icon: Bell },
];

export function AppShell({ children, title, description, actions }: { children: ReactNode; title: string; description: string; actions?: ReactNode }) {
  const [open, setOpen] = useState(false);
  const path = useRouterState({ select: (state) => state.location.pathname });
  return (
    <div className="min-h-screen bg-background lg:grid lg:grid-cols-[240px_1fr]">
      <aside className={cn("fixed inset-y-0 left-0 z-40 w-60 border-r border-sidebar-border bg-sidebar transition-transform lg:translate-x-0", open ? "translate-x-0" : "-translate-x-full")}>
        <div className="flex h-16 items-center justify-between border-b border-sidebar-border px-5">
          <Link to="/" className="flex items-center gap-2.5" onClick={() => setOpen(false)}>
            <span className="grid size-8 place-items-center rounded-md bg-sidebar-primary text-sidebar-primary-foreground"><ShieldCheck className="size-5" /></span>
            <span><strong className="block text-base font-bold text-sidebar-foreground">NOIR</strong><span className="block text-[10px] font-medium uppercase text-muted-foreground">Integrity ledger</span></span>
          </Link>
          <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setOpen(false)} aria-label="Close navigation"><X /></Button>
        </div>
        <nav className="space-y-1 p-3" aria-label="Main navigation">
          <p className="px-3 pb-2 pt-3 text-[11px] font-semibold uppercase text-muted-foreground">Workspace</p>
          {nav.map((item) => {
            const active = item.to === "/" ? path === "/" || path.startsWith("/device/") : path.startsWith(item.to);
            return <Link key={item.to} to={item.to} onClick={() => setOpen(false)} className={cn("flex h-9 items-center gap-3 rounded-md px-3 text-sm font-medium transition-colors", active ? "bg-sidebar-accent text-sidebar-accent-foreground" : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-foreground")}><item.icon className="size-4" />{item.label}{item.label === "Alerts" && <span className="ml-auto rounded-md bg-destructive px-1.5 py-0.5 text-[10px] text-destructive-foreground">3</span>}</Link>;
          })}
        </nav>
        <div className="absolute inset-x-3 bottom-4 border-t border-sidebar-border pt-4">
          <div className="flex items-center gap-3 px-3"><span className="grid size-8 place-items-center rounded-full bg-secondary text-xs font-bold text-secondary-foreground">AO</span><span className="min-w-0"><span className="block truncate text-sm font-medium text-sidebar-foreground">Ama Owusu</span><span className="block truncate text-xs text-muted-foreground">Compliance officer</span></span></div>
        </div>
      </aside>
      {open && <div className="fixed inset-0 z-30 bg-overlay lg:hidden" onClick={() => setOpen(false)} />}
      <main className="min-w-0 lg:col-start-2">
        <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b bg-background/95 px-4 backdrop-blur md:px-8">
          <Button variant="outline" size="icon" className="lg:hidden" onClick={() => setOpen(true)} aria-label="Open navigation"><Menu /></Button>
          <div className="relative hidden w-full max-w-sm sm:block"><Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><input className="h-9 w-full rounded-md border bg-muted/40 pl-9 pr-3 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/20" placeholder="Search devices or batch IDs" aria-label="Search" /></div>
          <div className="ml-auto flex items-center gap-2"><span className="hidden items-center gap-2 text-xs font-medium text-muted-foreground md:flex"><span className="size-2 rounded-full bg-success" /> All systems operational</span><Button variant="ghost" size="icon" aria-label="Notifications"><Bell /></Button></div>
        </header>
        <div className="mx-auto max-w-[1500px] px-4 py-6 md:px-8 md:py-8">
          <div className="mb-7 flex flex-col justify-between gap-4 md:flex-row md:items-end"><div><h1 className="text-2xl font-bold text-foreground md:text-[28px]">{title}</h1><p className="mt-1 text-sm text-muted-foreground">{description}</p></div>{actions}</div>
          {children}
        </div>
      </main>
    </div>
  );
}