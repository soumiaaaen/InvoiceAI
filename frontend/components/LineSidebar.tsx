"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type Falloff = "smooth" | "linear" | "sharp";

interface LineSidebarProps {
  items: string[];
  accentColor?: string;
  textColor?: string;
  markerColor?: string;
  showIndex?: boolean;
  showMarker?: boolean;
  proximityRadius?: number;
  maxShift?: number;
  falloff?: Falloff;
  markerLength?: number;
  markerGap?: number;
  tickScale?: number;
  scaleTick?: boolean;
  itemGap?: number;
  fontSize?: number;
  smoothing?: number;
  defaultActive?: number;
  activeIndex?: number; // optional controlled override - see integration notes
  onItemClick?: (index: number, label: string) => void;
  className?: string;
}

export default function LineSidebar({
  items,
  accentColor = "#A855F7",
  textColor = "#c4c4c4",
  markerColor = "#6c6c6c",
  showIndex = false,
  showMarker = true,
  proximityRadius = 100,
  maxShift = 30,
  falloff = "smooth",
  markerLength = 60,
  markerGap = 0,
  tickScale = 0.5,
  scaleTick = false,
  itemGap = 20,
  fontSize = 1.1,
  smoothing = 100,
  defaultActive = 0,
  activeIndex,
  onItemClick,
  className = "",
}: LineSidebarProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [proximities, setProximities] = useState<number[]>(() => items.map(() => 0));
  const [internalActive, setInternalActive] = useState(defaultActive);
  const active = activeIndex ?? internalActive;
  const rafRef = useRef<number | null>(null);
  const mouseYRef = useRef<number | null>(null);

  // Falloff curve mapping distance (0..proximityRadius) to a 0..1 influence factor
  const falloffFn = useCallback(
    (distance: number) => {
      const t = Math.min(distance / proximityRadius, 1);
      switch (falloff) {
        case "linear":
          return 1 - t;
        case "sharp":
          return Math.pow(1 - t, 3);
        case "smooth":
        default:
          return (Math.cos(t * Math.PI) + 1) / 2;
      }
    },
    [proximityRadius, falloff]
  );

  const updateProximities = useCallback(() => {
    const mouseY = mouseYRef.current;
    if (mouseY == null) {
      setProximities(items.map(() => 0));
      return;
    }
    const next = itemRefs.current.map((el) => {
      if (!el) return 0;
      const rect = el.getBoundingClientRect();
      const centerY = rect.top + rect.height / 2;
      const distance = Math.abs(mouseY - centerY);
      if (distance > proximityRadius) return 0;
      return falloffFn(distance);
    });
    setProximities(next);
  }, [items, proximityRadius, falloffFn]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mouseYRef.current = e.clientY;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(updateProximities);
    };
    const handleMouseLeave = () => {
      mouseYRef.current = null;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(updateProximities);
    };

    const node = containerRef.current;
    node?.addEventListener("mousemove", handleMouseMove);
    node?.addEventListener("mouseleave", handleMouseLeave);
    return () => {
      node?.removeEventListener("mousemove", handleMouseMove);
      node?.removeEventListener("mouseleave", handleMouseLeave);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [updateProximities]);

  return (
    <div ref={containerRef} className={`flex flex-col ${className}`} style={{ gap: itemGap }}>
      {items.map((label, i) => {
        const p = proximities[i] ?? 0;
        const isActive = active === i;
        const shift = maxShift * p;
        const scale = scaleTick ? 1 + tickScale * p : 1;
        const color = isActive ? accentColor : textColor;
        const mColor = isActive ? accentColor : markerColor;

        return (
          <div
            key={label}
            ref={(el) => {
              itemRefs.current[i] = el;
            }}
            onClick={() => {
              setInternalActive(i);
              onItemClick?.(i, label);
            }}
            className="flex items-center cursor-pointer select-none"
            style={{
              gap: markerGap,
              transform: `translateX(${shift}px)`,
              transition: `transform ${smoothing}ms ease-out`,
            }}
          >
            {showMarker && (
              <span
                style={{
                  display: "inline-block",
                  height: 1,
                  width: markerLength * scale,
                  backgroundColor: mColor,
                  transition: `width ${smoothing}ms ease-out, background-color ${smoothing}ms ease-out`,
                  flexShrink: 0,
                }}
              />
            )}
            {showIndex && (
              <span
                style={{
                  fontSize: fontSize * 0.6 + "rem",
                  color: mColor,
                  fontFamily: "var(--font-mono, monospace)",
                  minWidth: "1.5em",
                  transition: `color ${smoothing}ms ease-out`,
                }}
              >
                {String(i + 1).padStart(2, "0")}
              </span>
            )}
            <span
              style={{
                fontSize: fontSize + "rem",
                color,
                fontWeight: isActive ? 600 : 400,
                transition: `color ${smoothing}ms ease-out, font-weight ${smoothing}ms ease-out`,
                whiteSpace: "nowrap",
              }}
            >
              {label}
            </span>
          </div>
        );
      })}
    </div>
  );
}