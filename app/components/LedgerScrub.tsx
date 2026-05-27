"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import styles from "./LedgerSection.module.css";

export type LedgerMode = "problem" | "solution";

type LedgerScrubProps = {
  value: LedgerMode;
  onChange: (mode: LedgerMode) => void;
};

function modeToRatio(mode: LedgerMode): number {
  return mode === "solution" ? 1 : 0;
}

export function LedgerScrub({ value, onChange }: LedgerScrubProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);
  const liveRatio = useRef(modeToRatio(value));
  const [ratio, setRatio] = useState(() => modeToRatio(value));

  useEffect(() => {
    if (!dragging.current) {
      const r = modeToRatio(value);
      liveRatio.current = r;
      setRatio(r);
    }
  }, [value]);

  const commitRatio = useCallback(
    (r: number) => {
      const next: LedgerMode = r >= 0.5 ? "solution" : "problem";
      setRatio(modeToRatio(next));
      onChange(next);
    },
    [onChange]
  );

  const setFromClientX = useCallback((clientX: number) => {
    const el = trackRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const pad = 26;
    const inner = Math.max(rect.width - pad * 2, 1);
    const x = Math.min(Math.max(clientX - rect.left - pad, 0), inner);
    const r = x / inner;
    liveRatio.current = r;
    setRatio(r);
  }, []);

  const onPointerDownTrack = (e: React.PointerEvent) => {
    if ((e.target as HTMLElement).closest("button")) return;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    dragging.current = true;
    setFromClientX(e.clientX);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragging.current) return;
    setFromClientX(e.clientX);
  };

  const onPointerUp = (e: React.PointerEvent) => {
    if (!dragging.current) return;
    dragging.current = false;
    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      /* ignore */
    }
    commitRatio(liveRatio.current);
  };

  const onThumbPointerDown = (e: React.PointerEvent) => {
    e.stopPropagation();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    dragging.current = true;
    setFromClientX(e.clientX);
  };

  const thumbLeftPercent = ratio * 100;

  return (
    <div className={styles.scrub}>
      <div
        ref={trackRef}
        className={styles.scrubTrack}
        role="slider"
        aria-valuemin={0}
        aria-valuemax={1}
        aria-valuenow={ratio}
        aria-valuetext={value === "problem" ? "Problem" : "Solution"}
        aria-label="Problem or solution"
        onPointerDown={onPointerDownTrack}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        <span className={styles.scrubLabels} aria-hidden>
          <span>Problem</span>
          <span>Solution</span>
        </span>
        <span
          className={styles.scrubFill}
          style={{
            left: 26,
            width: `calc((100% - 52px) * ${ratio})`,
            maxWidth: "calc(100% - 52px)",
          }}
        />
        <button
          type="button"
          className={styles.scrubThumb}
          style={{
            left: `calc(26px + (100% - 52px) * ${ratio})`,
          }}
          aria-label="Drag seal between problem and solution"
          onPointerDown={onThumbPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
        />
      </div>
    </div>
  );
}
