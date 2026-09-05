import { useEffect, useRef, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import {
  X,
  Plus,
  Minus,
  RotateCcw,
  Maximize2,
  Copy,
  Check,
  Download,
  Hand,
} from "lucide-react";
import { Button } from "@/components/ui/button";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  svg: string;
  chart: string;
  id: string;
  isDark: boolean;
};

const MIN_SCALE = 0.15;
const MAX_SCALE = 10;

export function MermaidModal({
  isOpen,
  onClose,
  svg,
  chart,
  id,
  isDark,
}: Props) {
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  const viewportRef = useRef<HTMLDivElement>(null);
  const svgContainerRef = useRef<HTMLDivElement>(null);

  // Active pointers map for multi-touch (pinch-to-zoom) and drag
  const pointersRef = useRef<Map<number, { x: number; y: number }>>(new Map());
  const dragStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const posStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const hasMovedRef = useRef(false);

  // Pinch zoom tracking
  const pinchDistStartRef = useRef(0);
  const pinchScaleStartRef = useRef(1);
  const pinchMidpointRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Keep latest state in refs for stable listeners
  const scaleRef = useRef(scale);
  scaleRef.current = scale;
  const positionRef = useRef(position);
  positionRef.current = position;

  // Isolate IDs in the modal SVG so they never collide with the document SVG
  const modalSvg = svg ? svg.replaceAll(id, `modal-${id}`) : "";

  // Zoom helpers
  const zoomTo = useCallback((newScale: number, centerX?: number, centerY?: number) => {
    const clampedScale = Math.min(Math.max(newScale, MIN_SCALE), MAX_SCALE);
    const viewport = viewportRef.current;

    if (centerX !== undefined && centerY !== undefined && viewport) {
      const rect = viewport.getBoundingClientRect();
      const pointerX = centerX - (rect.left + rect.width / 2);
      const pointerY = centerY - (rect.top + rect.height / 2);
      const scaleRatio = clampedScale / scaleRef.current;

      setPosition((prevPos) => ({
        x: pointerX - (pointerX - prevPos.x) * scaleRatio,
        y: pointerY - (pointerY - prevPos.y) * scaleRatio,
      }));
    }

    setScale(clampedScale);
  }, []);

  const handleZoomIn = useCallback(() => {
    zoomTo(scaleRef.current * 1.25);
  }, [zoomTo]);

  const handleZoomOut = useCallback(() => {
    zoomTo(scaleRef.current / 1.25);
  }, [zoomTo]);

  const handleReset = useCallback(() => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  }, []);

  const handleFit = useCallback(() => {
    if (svgContainerRef.current && viewportRef.current) {
      const svgEl = svgContainerRef.current.querySelector("svg");
      if (svgEl) {
        const svgRect = svgEl.getBoundingClientRect();
        const vpRect = viewportRef.current.getBoundingClientRect();
        const unscaledW = svgRect.width / scaleRef.current || 500;
        const unscaledH = svgRect.height / scaleRef.current || 300;

        const fitScale = Math.min(
          (vpRect.width * 0.85) / unscaledW,
          (vpRect.height * 0.85) / unscaledH,
          2.0,
        );

        setScale(Math.max(fitScale, MIN_SCALE));
        setPosition({ x: 0, y: 0 });
        return;
      }
    }
    handleReset();
  }, [handleReset]);

  // Lock body scroll and auto-fit on modal open
  useEffect(() => {
    if (!isOpen) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    // Auto-fit diagram to comfortable bounds if it overflows viewport
    const timer = setTimeout(() => {
      if (svgContainerRef.current && viewportRef.current) {
        const svgEl = svgContainerRef.current.querySelector("svg");
        if (svgEl) {
          const svgRect = svgEl.getBoundingClientRect();
          const vpRect = viewportRef.current.getBoundingClientRect();
          const naturalW = svgRect.width / scaleRef.current || 500;
          const naturalH = svgRect.height / scaleRef.current || 300;
          if (naturalW > vpRect.width * 0.88 || naturalH > vpRect.height * 0.88) {
            const fitScale = Math.min(
              (vpRect.width * 0.82) / naturalW,
              (vpRect.height * 0.82) / naturalH,
              1.0,
            );
            setScale(Math.max(fitScale, MIN_SCALE));
            setPosition({ x: 0, y: 0 });
            return;
          }
        }
      }
      setScale(1);
      setPosition({ x: 0, y: 0 });
    }, 40);

    return () => {
      clearTimeout(timer);
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      } else if (e.key === "+" || e.key === "=") {
        e.preventDefault();
        handleZoomIn();
      } else if (e.key === "-" || e.key === "_") {
        e.preventDefault();
        handleZoomOut();
      } else if (e.key === "0") {
        e.preventDefault();
        handleReset();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        setPosition((p) => ({ ...p, x: p.x + 60 }));
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        setPosition((p) => ({ ...p, x: p.x - 60 }));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setPosition((p) => ({ ...p, y: p.y + 60 }));
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        setPosition((p) => ({ ...p, y: p.y - 60 }));
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose, handleZoomIn, handleZoomOut, handleReset]);

  // Mouse wheel and trackpad pinch zoom
  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport || !isOpen) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      e.stopPropagation();

      // Mac trackpad pinch sends ctrlKey=true with high sensitivity
      const sensitivity = e.ctrlKey ? 0.015 : 0.0015;
      const zoomFactor = Math.exp(-e.deltaY * sensitivity);
      const newScale = Math.min(Math.max(scaleRef.current * zoomFactor, MIN_SCALE), MAX_SCALE);

      zoomTo(newScale, e.clientX, e.clientY);
    };

    viewport.addEventListener("wheel", handleWheel, { passive: false });
    return () => {
      viewport.removeEventListener("wheel", handleWheel);
    };
  }, [isOpen, zoomTo]);

  // Pointer events: Click-and-hold drag & pinch-to-zoom
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    // Only primary button or touch
    if (e.button !== 0 && e.pointerType === "mouse") return;
    if ((e.target as HTMLElement).closest("button")) return;

    e.currentTarget.setPointerCapture(e.pointerId);
    pointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (pointersRef.current.size === 1) {
      // Single touch / mouse hold & drag
      dragStartRef.current = { x: e.clientX, y: e.clientY };
      posStartRef.current = { ...positionRef.current };
      hasMovedRef.current = false;
      setIsDragging(true);
    } else if (pointersRef.current.size === 2) {
      // Multi-touch pinch zoom
      const pts = Array.from(pointersRef.current.values());
      pinchDistStartRef.current = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
      pinchScaleStartRef.current = scaleRef.current;
      posStartRef.current = { ...positionRef.current };
      pinchMidpointRef.current = {
        x: (pts[0].x + pts[1].x) / 2,
        y: (pts[0].y + pts[1].y) / 2,
      };
      setIsDragging(true);
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!pointersRef.current.has(e.pointerId)) return;
    pointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (pointersRef.current.size === 1) {
      // Hold & drag pan
      const dx = e.clientX - dragStartRef.current.x;
      const dy = e.clientY - dragStartRef.current.y;
      if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
        hasMovedRef.current = true;
      }
      setPosition({
        x: posStartRef.current.x + dx,
        y: posStartRef.current.y + dy,
      });
    } else if (pointersRef.current.size >= 2) {
      // Pinch to zoom
      hasMovedRef.current = true;
      const pts = Array.from(pointersRef.current.values());
      const currentDist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);

      if (pinchDistStartRef.current > 0) {
        const ratio = currentDist / pinchDistStartRef.current;
        const newScale = Math.min(
          Math.max(pinchScaleStartRef.current * ratio, MIN_SCALE),
          MAX_SCALE,
        );

        const currentMid = {
          x: (pts[0].x + pts[1].x) / 2,
          y: (pts[0].y + pts[1].y) / 2,
        };
        const midDeltaX = currentMid.x - pinchMidpointRef.current.x;
        const midDeltaY = currentMid.y - pinchMidpointRef.current.y;

        setScale(newScale);
        setPosition({
          x: posStartRef.current.x + midDeltaX,
          y: posStartRef.current.y + midDeltaY,
        });
      }
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    pointersRef.current.delete(e.pointerId);
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      /* ignore */
    }

    if (pointersRef.current.size === 1) {
      // Switched from pinch to single finger; re-anchor drag
      const remaining = Array.from(pointersRef.current.values())[0];
      dragStartRef.current = { x: remaining.x, y: remaining.y };
      posStartRef.current = { ...positionRef.current };
    } else if (pointersRef.current.size === 0) {
      setIsDragging(false);
      setTimeout(() => {
        hasMovedRef.current = false;
      }, 60);
    }
  };

  const handleDoubleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest("button")) return;
    if (scaleRef.current !== 1 || positionRef.current.x !== 0 || positionRef.current.y !== 0) {
      handleReset();
    } else {
      zoomTo(1.8, e.clientX, e.clientY);
    }
  };

  // Copy helpers
  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(chart.trim());
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 1500);
    } catch {
      /* ignore */
    }
  };

  const handleDownloadSvg = () => {
    const blob = new Blob([svg], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `mermaid-${Date.now()}.svg`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!isOpen) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-3 sm:p-6 transition-opacity animate-in fade-in duration-150"
      onClick={(e) => {
        // Close if clicking outside the dialog card, but not if user was dragging
        if (e.target === e.currentTarget && !hasMovedRef.current) {
          onClose();
        }
      }}
    >
      <div
        className="relative flex flex-col w-full h-full max-w-6xl max-h-[92vh] rounded-xl border border-border bg-card/98 shadow-2xl overflow-hidden select-none"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Toolbar */}
        <header className="flex items-center justify-between gap-2 px-3 py-2.5 sm:px-4 border-b border-border bg-background/80 backdrop-blur-sm z-10 shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <span className="flex items-center gap-1.5 font-medium text-xs sm:text-sm text-foreground truncate">
              <Hand className="size-4 text-muted-foreground shrink-0 hidden sm:inline" />
              <span>Mermaid Diagram</span>
            </span>
            <span className="hidden md:inline-flex text-[11px] font-mono text-muted-foreground/80 px-2 py-0.5 rounded bg-muted/60 border border-border/60">
              Hold & drag to pan • Pinch / wheel to zoom
            </span>
          </div>

          <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
            {/* Zoom Controls */}
            <div className="flex items-center rounded-md border border-border bg-background/60 p-0.5 shadow-2xs">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-7 sm:size-8"
                onClick={handleZoomOut}
                title="Zoom Out (-)"
                aria-label="Zoom Out"
              >
                <Minus className="size-3.5 sm:size-4" />
              </Button>

              <button
                type="button"
                onClick={handleReset}
                title="Click to reset zoom to 100% (0)"
                className="px-2 py-1 font-mono text-[11px] sm:text-xs text-muted-foreground hover:text-foreground hover:bg-accent rounded transition-colors"
              >
                {Math.round(scale * 100)}%
              </button>

              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-7 sm:size-8"
                onClick={handleZoomIn}
                title="Zoom In (+)"
                aria-label="Zoom In"
              >
                <Plus className="size-3.5 sm:size-4" />
              </Button>
            </div>

            {/* Reset / Fit Controls */}
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="size-7 sm:size-8"
              onClick={handleReset}
              title="Reset View (0)"
              aria-label="Reset View"
            >
              <RotateCcw className="size-3.5 sm:size-4" />
            </Button>

            <Button
              type="button"
              variant="outline"
              size="icon"
              className="size-7 sm:size-8"
              onClick={handleFit}
              title="Fit to screen"
              aria-label="Fit to screen"
            >
              <Maximize2 className="size-3.5 sm:size-4" />
            </Button>

            <div className="h-4 w-[1px] bg-border mx-0.5 sm:mx-1 hidden sm:block" />

            {/* Copy / Export buttons */}
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-7 sm:size-8 hidden sm:inline-flex"
              onClick={handleCopyCode}
              title="Copy Mermaid Code"
              aria-label="Copy Mermaid Code"
            >
              {copiedCode ? (
                <Check className="size-3.5 sm:size-4 text-green-500" />
              ) : (
                <Copy className="size-3.5 sm:size-4" />
              )}
            </Button>

            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-7 sm:size-8 hidden sm:inline-flex"
              onClick={handleDownloadSvg}
              title="Download SVG"
              aria-label="Download SVG"
            >
              <Download className="size-3.5 sm:size-4" />
            </Button>

            <div className="h-4 w-[1px] bg-border mx-0.5 sm:mx-1" />

            {/* Close */}
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-7 sm:size-8 text-muted-foreground hover:text-foreground"
              onClick={onClose}
              title="Close (Esc)"
              aria-label="Close"
            >
              <X className="size-4" />
            </Button>
          </div>
        </header>

        {/* Viewport Canvas: Click and hold to drag & pinch */}
        <div
          ref={viewportRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          onDoubleClick={handleDoubleClick}
          onContextMenu={(e) => e.preventDefault()}
          className={`relative flex-1 w-full h-full overflow-hidden flex items-center justify-center mermaid-modal-canvas touch-none select-none transition-colors ${
            isDragging ? "cursor-grabbing" : "cursor-grab"
          }`}
          style={{
            touchAction: "none",
          }}
        >
          <div
            ref={svgContainerRef}
            style={{
              transform: `translate3d(${position.x}px, ${position.y}px, 0px) scale(${scale})`,
              transformOrigin: "center center",
              transition: isDragging ? "none" : "transform 0.1s ease-out",
            }}
            className="mermaid-modal-svg flex items-center justify-center pointer-events-none p-6"
            dangerouslySetInnerHTML={{ __html: modalSvg }}
          />

          {/* Quick guide bottom badge */}
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-2 px-3 py-1.5 rounded-full bg-background/85 border border-border/80 text-[11px] text-muted-foreground shadow-md backdrop-blur-md pointer-events-none">
            <span>Hold & drag to pan</span>
            <span className="text-border">•</span>
            <span>Pinch or +/- to zoom</span>
            <span className="text-border hidden sm:inline">•</span>
            <span className="hidden sm:inline">Double click to reset</span>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
