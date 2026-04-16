"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { motion, useReducedMotion } from "framer-motion";

interface AnimatedGridPatternProps {
  className?: string;
  /** Grid cell size in px */
  cellSize?: number;
  /** Max number of simultaneously lit cells */
  maxActive?: number;
  /** How often new cells light up (ms) */
  interval?: number;
  /** Color of lit cells */
  color?: string;
  /** Whether the grid reacts to mouse position */
  interactive?: boolean;
}

export function AnimatedGridPattern({
  className = "",
  cellSize = 40,
  maxActive = 15,
  interval = 300,
  color = "rgba(255, 170, 0, 0.12)",
  interactive = true,
}: AnimatedGridPatternProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const prefersReducedMotion = useReducedMotion();
  const [cells, setCells] = useState<{ id: string; x: number; y: number; opacity: number }[]>([]);
  const mousePos = useRef({ x: -1, y: -1 });
  const [dimensions, setDimensions] = useState({ cols: 0, rows: 0 });

  useEffect(() => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    setDimensions({
      cols: Math.ceil(rect.width / cellSize),
      rows: Math.ceil(rect.height / cellSize),
    });
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) {
        setDimensions({
          cols: Math.ceil(entry.contentRect.width / cellSize),
          rows: Math.ceil(entry.contentRect.height / cellSize),
        });
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [cellSize]);

  useEffect(() => {
    if (prefersReducedMotion || dimensions.cols === 0) return;

    const timer = setInterval(() => {
      setCells((prev) => {
        // Remove old cells
        const filtered = prev.filter((c) => c.opacity > 0.05);
        if (filtered.length >= maxActive) {
          filtered.shift();
        }

        // Add new random cell, biased toward mouse position
        let col = Math.floor(Math.random() * dimensions.cols);
        let row = Math.floor(Math.random() * dimensions.rows);

        if (interactive && mousePos.current.x >= 0) {
          const mouseCol = Math.floor(mousePos.current.x / cellSize);
          const mouseRow = Math.floor(mousePos.current.y / cellSize);
          // 60% chance to spawn near mouse
          if (Math.random() < 0.6) {
            col = mouseCol + Math.floor(Math.random() * 7) - 3;
            row = mouseRow + Math.floor(Math.random() * 7) - 3;
            col = Math.max(0, Math.min(col, dimensions.cols - 1));
            row = Math.max(0, Math.min(row, dimensions.rows - 1));
          }
        }

        return [
          ...filtered,
          {
            id: `${col}-${row}-${Date.now()}`,
            x: col * cellSize,
            y: row * cellSize,
            opacity: 0.5 + Math.random() * 0.5,
          },
        ];
      });
    }, interval);

    return () => clearInterval(timer);
  }, [dimensions, maxActive, interval, cellSize, interactive, prefersReducedMotion]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    mousePos.current = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  }, []);

  if (prefersReducedMotion) return null;

  return (
    <div
      ref={containerRef}
      className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`}
      onMouseMove={interactive ? handleMouseMove : undefined}
      style={interactive ? { pointerEvents: "auto" } : undefined}
    >
      {/* Static grid lines */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)
          `,
          backgroundSize: `${cellSize}px ${cellSize}px`,
        }}
      />

      {/* Animated cells */}
      {cells.map((cell) => (
        <motion.div
          key={cell.id}
          className="absolute"
          style={{
            left: cell.x,
            top: cell.y,
            width: cellSize - 1,
            height: cellSize - 1,
            backgroundColor: color,
          }}
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: cell.opacity, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{
            opacity: { duration: 0.4, ease: "easeOut" },
            scale: { duration: 0.3, ease: [0.16, 1, 0.3, 1] },
          }}
        >
          <motion.div
            className="w-full h-full"
            animate={{ opacity: 0 }}
            transition={{ duration: 2, delay: 0.3, ease: "easeOut" }}
          />
        </motion.div>
      ))}

      {/* Mouse proximity glow */}
      {interactive && (
        <div
          className="absolute w-[300px] h-[300px] rounded-full pointer-events-none"
          style={{
            left: mousePos.current.x - 150,
            top: mousePos.current.y - 150,
            background: `radial-gradient(circle, ${color.replace(/[\d.]+\)$/, "0.06)")}, transparent 70%)`,
            transition: "left 0.3s ease-out, top 0.3s ease-out",
          }}
        />
      )}
    </div>
  );
}
