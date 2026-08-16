"use client";

import React, {
  createContext,
  useContext,
  useMemo,
  useRef,
  useState,
  type MouseEvent as ReactMouseEvent,
  type ReactNode,
} from "react";

interface MagicBentoProps {
  children: ReactNode;
  className?: string;
  gridClassName?: string;
  textAutoHide?: boolean;
  enableStars?: boolean;
  enableSpotlight?: boolean;
  enableBorderGlow?: boolean;
  enableTilt?: boolean;
  enableMagnetism?: boolean;
  clickEffect?: boolean;
  spotlightRadius?: number;
  particleCount?: number;
  glowColor?: string; // "r, g, b" - no rgba() wrapper, just the numbers
  disableAnimations?: boolean;
}

const BentoHoverContext = createContext(false);

// Wrap any secondary text inside a card's children with this to have it
// fade/expand in only while that specific card is hovered (textAutoHide).
export function BentoAutoHideText({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  const hovered = useContext(BentoHoverContext);
  return (
    <div
      className={`overflow-hidden transition-all duration-300 ${className}`}
      style={{ maxHeight: hovered ? 100 : 0, opacity: hovered ? 1 : 0 }}
    >
      {children}
    </div>
  );
}

function Ripple({ x, y, color }: { x: number; y: number; color: string }) {
  return (
    <span
      className="pointer-events-none absolute rounded-full"
      style={{
        left: x,
        top: y,
        width: 10,
        height: 10,
        marginLeft: -5,
        marginTop: -5,
        background: `rgba(${color}, 0.5)`,
        animation: "bento-ripple 600ms ease-out forwards",
      }}
    />
  );
}

type CardEffectProps = Required<
  Omit<MagicBentoProps, "children" | "className" | "gridClassName">
>;

function BentoCard({ children, ...fx }: { children: ReactNode } & CardEffectProps) {
  const {
    enableStars,
    enableSpotlight,
    enableBorderGlow,
    enableTilt,
    enableMagnetism,
    clickEffect,
    spotlightRadius,
    particleCount,
    glowColor,
    disableAnimations,
  } = fx;

  const cardRef = useRef<HTMLDivElement>(null);
  const [hovered, setHovered] = useState(false);
  const [spot, setSpot] = useState({ x: 0, y: 0 });
  const [tilt, setTilt] = useState({ rx: 0, ry: 0 });
  const [magnet, setMagnet] = useState({ x: 0, y: 0 });
  const [ripples, setRipples] = useState<{ id: number; x: number; y: number }[]>([]);
  const rippleId = useRef(0);

  const stars = useMemo(
    () =>
      Array.from({ length: particleCount }, () => ({
        top: Math.random() * 100,
        left: Math.random() * 100,
        delay: Math.random() * 2,
        duration: 1.5 + Math.random() * 2,
      })),
    [particleCount]
  );

  const handleMouseMove = (e: ReactMouseEvent<HTMLDivElement>) => {
    if (disableAnimations || !cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (enableSpotlight) setSpot({ x, y });

    if (enableTilt) {
      const cx = rect.width / 2;
      const cy = rect.height / 2;
      setTilt({ rx: -((y - cy) / cy) * 8, ry: ((x - cx) / cx) * 8 });
    }

    if (enableMagnetism) {
      const cx = rect.width / 2;
      const cy = rect.height / 2;
      setMagnet({ x: (x - cx) * 0.08, y: (y - cy) * 0.08 });
    }
  };

  const handleMouseLeave = () => {
    setHovered(false);
    setTilt({ rx: 0, ry: 0 });
    setMagnet({ x: 0, y: 0 });
  };

  const handleClick = (e: ReactMouseEvent<HTMLDivElement>) => {
    if (disableAnimations || !clickEffect || !cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const id = rippleId.current++;
    setRipples((r) => [...r, { id, x: e.clientX - rect.left, y: e.clientY - rect.top }]);
    setTimeout(() => setRipples((r) => r.filter((rp) => rp.id !== id)), 650);
  };

  const transform = disableAnimations
    ? undefined
    : `translate(${magnet.x}px, ${magnet.y}px) perspective(600px) rotateX(${tilt.rx}deg) rotateY(${tilt.ry}deg)`;

  return (
    <BentoHoverContext.Provider value={hovered}>
      <div
        ref={cardRef}
        onMouseEnter={() => setHovered(true)}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onClick={handleClick}
        className="card relative overflow-hidden p-5 transition-transform duration-200 ease-out will-change-transform"
        style={{
          transform,
          borderColor:
            enableBorderGlow && hovered && !disableAnimations
              ? `rgba(${glowColor}, 0.5)`
              : undefined,
          boxShadow:
            enableBorderGlow && hovered && !disableAnimations
              ? `0 0 0 1px rgba(${glowColor}, 0.25), 0 8px 24px -8px rgba(${glowColor}, 0.35)`
              : undefined,
        }}
      >
        {enableSpotlight && !disableAnimations && (
          <div
            className="pointer-events-none absolute inset-0 transition-opacity duration-300"
            style={{
              opacity: hovered ? 1 : 0,
              background: `radial-gradient(circle ${spotlightRadius}px at ${spot.x}px ${spot.y}px, rgba(${glowColor}, 0.16), transparent 70%)`,
            }}
          />
        )}

        {enableStars && !disableAnimations && (
          <div className="pointer-events-none absolute inset-0">
            {stars.map((s, i) => (
              <span
                key={i}
                className="absolute rounded-full"
                style={{
                  top: `${s.top}%`,
                  left: `${s.left}%`,
                  width: 2,
                  height: 2,
                  background: `rgba(${glowColor}, 0.8)`,
                  opacity: hovered ? 0.9 : 0,
                  transition: "opacity 300ms ease",
                  animation: hovered
                    ? `bento-twinkle ${s.duration}s ease-in-out ${s.delay}s infinite`
                    : "none",
                }}
              />
            ))}
          </div>
        )}

        {clickEffect &&
          !disableAnimations &&
          ripples.map((r) => <Ripple key={r.id} x={r.x} y={r.y} color={glowColor} />)}

        <div className="relative z-10">{children}</div>
      </div>
    </BentoHoverContext.Provider>
  );
}

export default function MagicBento({
  children,
  className = "",
  gridClassName = "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4",
  textAutoHide = true,
  enableStars = true,
  enableSpotlight = true,
  enableBorderGlow = true,
  enableTilt = false,
  enableMagnetism = false,
  clickEffect = true,
  spotlightRadius = 300,
  particleCount = 8,
  glowColor = "59, 91, 219", // primary blue
  disableAnimations = false,
}: MagicBentoProps) {
  const items = React.Children.toArray(children);

  return (
    <div className={className}>
      <div className={gridClassName}>
        {items.map((child, i) => (
          <BentoCard
            key={i}
            textAutoHide={textAutoHide}
            enableStars={enableStars}
            enableSpotlight={enableSpotlight}
            enableBorderGlow={enableBorderGlow}
            enableTilt={enableTilt}
            enableMagnetism={enableMagnetism}
            clickEffect={clickEffect}
            spotlightRadius={spotlightRadius}
            particleCount={particleCount}
            glowColor={glowColor}
            disableAnimations={disableAnimations}
          >
            {child}
          </BentoCard>
        ))}
      </div>
    </div>
  );
}