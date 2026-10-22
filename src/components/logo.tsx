"use client";

interface DropMarkProps {
  size?: number;
  fill?: string;
  smile?: string;
}

export function DropMark({ size = 32, fill = "#C4572A", smile = "#ffffff" }: DropMarkProps) {
  return (
    <svg viewBox="0 0 100 110" width={size} height={size * 1.1} aria-hidden="true">
      <path
        d="M50 4 C58 12 88 35 88 50 L88 80 A18 18 0 0 1 70 98 L30 98 A18 18 0 0 1 12 80 L12 50 C12 35 42 12 50 4 Z"
        fill={fill}
      />
      <path
        d="M32 70 Q50 86 68 70"
        stroke={smile}
        strokeWidth="6.5"
        fill="none"
        strokeLinecap="round"
      />
    </svg>
  );
}

interface LogoProps {
  size?: number;
  variant?: "light" | "dark" | "white";
  compact?: boolean;
}

export function Logo({ size = 32, variant = "light", compact = false }: LogoProps) {
  const textColor = variant === "dark" || variant === "white" ? "#FFFFFF" : "#1C2B24";
  const markFill = variant === "white" ? "#FFFFFF" : "#C4572A";
  const markSmile = variant === "white" ? "#1A3C2A" : "#ffffff";

  return (
    <div className="flex items-center" style={{ gap: size * 0.28 }}>
      <DropMark size={size} fill={markFill} smile={markSmile} />
      {!compact && (
        <span
          className="font-display font-extrabold tracking-[-0.03em]"
          style={{ fontSize: size * 0.56, color: textColor, lineHeight: 1 }}
        >
          ChopDrop
        </span>
      )}
    </div>
  );
}
