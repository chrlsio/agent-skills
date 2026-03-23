import { useCallback, useRef, useState, type ReactNode, type PointerEvent } from "react";
import { cn } from "@/lib/utils";

interface RippleState {
  id: number;
  x: number;
  y: number;
}

/**
 * A glass container with liquid-glass interaction effects:
 * - Jelly squish on click (CSS animation)
 * - Expanding ripple from click point
 * - Specular glow pulse
 * - Dynamic border highlight (glass-shine)
 */
export default function LiquidGlass({
  children,
  className,
  as: Tag = "div",
  shine = true,
  ...props
}: {
  children: ReactNode;
  className?: string;
  as?: "div" | "button";
  shine?: boolean;
} & React.HTMLAttributes<HTMLElement>) {
  const [ripples, setRipples] = useState<RippleState[]>([]);
  const nextId = useRef(0);

  const onPointerDown = useCallback((e: PointerEvent<HTMLElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setRipples((prev) => [...prev, { id: nextId.current++, x, y }]);
  }, []);

  const clearRipple = useCallback((id: number) => {
    setRipples((prev) => prev.filter((r) => r.id !== id));
  }, []);

  return (
    <Tag
      {...(props as any)}
      onPointerDown={onPointerDown}
      className={cn(
        "glass glass-liquid",
        shine && "glass-shine",
        className,
      )}
    >
      {children}
      {ripples.map((r) => (
        <span
          key={r.id}
          className="liquid-ripple"
          style={{ left: `${r.x}%`, top: `${r.y}%` }}
          onAnimationEnd={() => clearRipple(r.id)}
        />
      ))}
    </Tag>
  );
}
