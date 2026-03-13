import { cn } from "@/lib/utils";
import { getScoreStyle } from "@/lib/scoring";

interface ScoreBadgeProps {
  score: number;
  size?: "sm" | "md";
}

export function ScoreBadge({ score, size = "sm" }: ScoreBadgeProps) {
  const { className } = getScoreStyle(score);
  return (
    <span
      className={cn(
        "inline-flex items-center justify-center rounded-full border font-bold",
        className,
        size === "sm" ? "w-8 h-8 text-xs" : "w-10 h-10 text-sm",
      )}>
      {score}
    </span>
  );
}
