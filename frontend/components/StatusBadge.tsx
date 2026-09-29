import { STATUS_COLORS, STATUS_DOT_COLORS, type NoteStatus } from "@/types";

interface StatusBadgeProps {
  status: NoteStatus;
  size?: "sm" | "md";
}

export function StatusBadge({ status, size = "md" }: StatusBadgeProps) {
  const colorClass = STATUS_COLORS[status];
  const dotColor = STATUS_DOT_COLORS[status];
  const sizeClass = size === "sm" ? "px-2 py-0.5 text-xs" : "px-2.5 py-1 text-xs";

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium rounded-full border ${colorClass} ${sizeClass} whitespace-nowrap`}
    >
      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${dotColor}`} />
      {status}
    </span>
  );
}
