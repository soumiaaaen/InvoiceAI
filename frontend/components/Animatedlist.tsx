"use client";

import {
  useEffect,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type ReactNode,
} from "react";

interface AnimatedListProps<T> {
  items: T[];
  onItemSelect?: (item: T, index: number) => void;
  renderItem?: (item: T, index: number, isSelected: boolean) => ReactNode;
  showGradients?: boolean;
  enableArrowNavigation?: boolean;
  displayScrollbar?: boolean;
  maxHeight?: number | string;
  className?: string;
  itemClassName?: string;
}

// One row - reveals itself (fade + slide up) the first time it scrolls
// into view, via IntersectionObserver, rather than all at once on mount.
function AnimatedItem({
  children,
  onClick,
  selected,
  itemClassName,
}: {
  children: ReactNode;
  onClick: () => void;
  selected: boolean;
  itemClassName?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      onClick={onClick}
      data-selected={selected}
      className={`transition-all duration-400 ease-out ${itemClassName ?? ""}`}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0px)" : "translateY(16px)",
      }}
    >
      {children}
    </div>
  );
}

export default function AnimatedList<T>({
  items,
  onItemSelect,
  renderItem,
  showGradients = true,
  enableArrowNavigation = true,
  displayScrollbar = true,
  maxHeight = 480,
  className = "",
  itemClassName = "",
}: AnimatedListProps<T>) {
  const containerRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [topGradientOpacity, setTopGradientOpacity] = useState(0);
  const [bottomGradientOpacity, setBottomGradientOpacity] = useState(1);

  const updateGradients = () => {
    const el = containerRef.current;
    if (!el) return;
    const { scrollTop, scrollHeight, clientHeight } = el;
    setTopGradientOpacity(Math.min(scrollTop / 40, 1));
    const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
    setBottomGradientOpacity(scrollHeight <= clientHeight ? 0 : Math.min(distanceFromBottom / 40, 1));
  };

  useEffect(() => {
    updateGradients();
  }, [items.length]);

  const selectItem = (index: number) => {
    setSelectedIndex(index);
    onItemSelect?.(items[index], index);
  };

  const handleKeyDown = (e: ReactKeyboardEvent<HTMLDivElement>) => {
    if (!enableArrowNavigation) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      const next = Math.min(selectedIndex + 1, items.length - 1);
      setSelectedIndex(next);
      itemRefs.current[next]?.scrollIntoView({ block: "nearest", behavior: "smooth" });
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      const prev = Math.max(selectedIndex - 1, 0);
      setSelectedIndex(prev);
      itemRefs.current[prev]?.scrollIntoView({ block: "nearest", behavior: "smooth" });
    } else if (e.key === "Enter" && selectedIndex >= 0) {
      e.preventDefault();
      selectItem(selectedIndex);
    }
  };

  return (
    <div className={`relative ${className}`}>
      <div
        ref={containerRef}
        tabIndex={enableArrowNavigation ? 0 : undefined}
        onKeyDown={handleKeyDown}
        onScroll={updateGradients}
        className={`overflow-y-auto outline-none ${!displayScrollbar ? "no-scrollbar" : ""}`}
        style={{
          maxHeight,
          scrollbarWidth: displayScrollbar ? "thin" : "none",
        }}
      >
        {items.map((item, i) => (
          <div
            key={i}
            ref={(el) => {
              itemRefs.current[i] = el;
            }}
          >
            <AnimatedItem
              onClick={() => selectItem(i)}
              selected={selectedIndex === i}
              itemClassName={itemClassName}
            >
              {renderItem ? renderItem(item, i, selectedIndex === i) : String(item)}
            </AnimatedItem>
          </div>
        ))}
      </div>

      {showGradients && (
        <>
          <div
            className="pointer-events-none absolute top-0 left-0 right-0 h-10 transition-opacity duration-150"
            style={{
              opacity: topGradientOpacity,
              background: "linear-gradient(to bottom, var(--color-surface), transparent)",
            }}
          />
          <div
            className="pointer-events-none absolute bottom-0 left-0 right-0 h-10 transition-opacity duration-150"
            style={{
              opacity: bottomGradientOpacity,
              background: "linear-gradient(to top, var(--color-surface), transparent)",
            }}
          />
        </>
      )}
    </div>
  );
}