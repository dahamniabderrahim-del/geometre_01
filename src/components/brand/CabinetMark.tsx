import { cn } from "@/lib/utils";
import { useState } from "react";

type CabinetMarkProps = {
  className?: string;
  strokeWidth?: number;
};

export function CabinetMark({ className, strokeWidth = 1.9 }: CabinetMarkProps) {
  const [imageFailed, setImageFailed] = useState(false);

  if (!imageFailed) {
    return (
      <img
        src="/cabinet-logo.svg?v=20260227-1"
        alt="Logo du cabinet"
        className={cn("shrink-0 object-contain", className)}
        onError={() => setImageFailed(true)}
      />
    );
  }

  return (
    <svg
      viewBox="0 0 24 24"
      className={cn("shrink-0", className)}
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12 2.8L4.5 7v6.4c0 4.1 2.8 7 7.5 8.3 4.7-1.3 7.5-4.2 7.5-8.3V7L12 2.8z" />
      <path d="M12 7.4v6.2" />
      <path d="M8.8 13.1h6.4" />
      <circle cx="12" cy="5.8" r="0.9" fill="currentColor" stroke="none" />
    </svg>
  );
}
