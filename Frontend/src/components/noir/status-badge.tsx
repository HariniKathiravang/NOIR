import { AlertTriangle, Check, Clock3 } from "lucide-react";
import { cn } from "@/lib/utils";

type Status = "Normal" | "Warning" | "Alert" | "Pending" | "Verified" | "Resolved";

export function StatusBadge({ status }: { status: Status }) {
  const isSuccess = status === "Normal" || status === "Verified" || status === "Resolved";
  const isWarning = status === "Warning" || status === "Pending";
  const Icon = isSuccess ? Check : isWarning ? Clock3 : AlertTriangle;
  return (
    <span className={cn("inline-flex h-6 items-center gap-1.5 rounded-md border px-2 text-xs font-semibold", isSuccess && "border-success/20 bg-success-soft text-success", isWarning && "border-warning/25 bg-warning-soft text-warning", !isSuccess && !isWarning && "border-destructive/20 bg-destructive-soft text-destructive")}>
      <Icon className="size-3.5" aria-hidden="true" />
      {status === "Verified" ? "Verified" : status}
    </span>
  );
}