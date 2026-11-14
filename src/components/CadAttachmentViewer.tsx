import React, { useEffect, useRef, useState, useCallback } from 'react';
import { CadDocument, parseCadAttachment } from '../utils/cadParser';
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  Layers,
  Sun,
  Moon,
  AlertCircle,
} from 'lucide-react';

interface CadAttachmentViewerProps {
  url: string;
  fileName: string;
}

export const CadAttachmentViewer: React.FC<CadAttachmentViewerProps> = ({
  url,
  fileName,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [doc, setDoc] = useState<CadDocument | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [darkBg, setDarkBg] = useState(true);
  const [showLayers, setShowLayers] = useState(false);
  const [hiddenLayers, setHiddenLayers] = useState<Set<string>>(new Set());

  // Camera state: scale (px per drawing unit) and pan offset (screen px)
  const [camera, setCamera] = useState({ scale: 1, offsetX: 0, offsetY: 0 });
  const dragRef = useRef<{
    dragging: boolean;
    startX: number;
    startY: number;
    origOffsetX: number;
    origOffsetY: number;
  }>({ dragging: false, startX: 0, startY: 0, origOffsetX: 0, origOffsetY: 0 });

  const fitToView = useCallback((cadDoc: CadDocument) => {
    const container = containerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const w = Math.max(rect.width, 320);
    const h = Math.max(rect.height, 360);
    const dx = Math.max(cadDoc.bounds.maxX - cadDoc.bounds.minX, 1e-3);
    const dy = Math.max(cadDoc.bounds.maxY - cadDoc.bounds.minY, 1e-3);
    const padding = 0.86;
    const scale = Math.min((w * padding) / dx, (h * padding) / dy);
    const cx = (cadDoc.bounds.minX + cadDoc.bounds.maxX) / 2;
    const cy = (cadDoc.bounds.minY + cadDoc.bounds.maxY) / 2;

    setCamera({
      scale,
      offsetX: w / 2 - cx * scale,
      offsetY: h / 2 + cy * scale, // Y is flipped in CAD (+Y up)
    });
  }, []);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setError(null);
    setDoc(null);

    (async () => {
      try {
        const res = await fetch(url);
        if (!res.ok) throw new Error(`Failed to fetch file (${res.status})`);
        const buffer = await res.arrayBuffer();
        const parsed = await parseCadAttachment(buffer, fileName);
        if (cancelled) return;

        const initiallyHidden = new Set(
          parsed.layers.filter((l) => !l.visible).map((l) => l.name)
        );
        setHiddenLayers(initiallyHidden);
        setDoc(parsed);
        requestAnimationFrame(() => fitToView(parsed));
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : 'Unable to render this CAD drawing'
          );
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [url, fileName, fitToView]);

  // Draw CAD entities onto Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container || !doc) return;

    const dpr = window.devicePixelRatio || 1;
    const width = container.clientWidth;
    const height = container.clientHeight;
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = darkBg ? '#0f172a' : '#ffffff';
    ctx.fillRect(0, 0, width, height);

    const toScreenX = (x: number) => x * camera.scale + camera.offsetX;
    const toScreenY = (y: number) => -y * camera.scale + camera.offsetY;

    const adaptColor = (hex: string) => {
      if (!darkBg && (hex.toLowerCase() === '#e2e8f0' || hex.toLowerCase() === '#ffffff')) {
        return '#0f172a';
      }
      if (darkBg && hex.toLowerCase() === '#000000') {
        return '#e2e8f0';
      }
      return hex;
    };

    ctx.lineWidth = 1.25;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    for (const ent of doc.entities) {
      if (hiddenLayers.has(ent.layer)) continue;
      const stroke = adaptColor(ent.color);
      ctx.strokeStyle = stroke;
      ctx.fillStyle = stroke;

      switch (ent.type) {
        case 'line': {
          ctx.beginPath();
          ctx.moveTo(toScreenX(ent.start.x), toScreenY(ent.start.y));
          ctx.lineTo(toScreenX(ent.end.x), toScreenY(ent.end.y));
          ctx.stroke();
          break;
        }
        case 'polyline': {
          if (ent.points.length < 2) break;
          ctx.beginPath();
          ctx.moveTo(toScreenX(ent.points[0].x), toScreenY(ent.points[0].y));
          for (let i = 1; i < ent.points.length; i++) {
            ctx.lineTo(toScreenX(ent.points[i].x), toScreenY(ent.points[i].y));
          }
          if (ent.closed) ctx.closePath();
          ctx.stroke();
          break;
        }
        case 'circle': {
          const r = ent.radius * camera.scale;
          if (r < 0.25) break;
          ctx.beginPath();
          ctx.arc(toScreenX(ent.center.x), toScreenY(ent.center.y), r, 0, Math.PI * 2);
          ctx.stroke();
          break;
        }
        case 'arc': {
          const r = ent.radius * camera.scale;
          if (r < 0.25) break;
          // Canvas Y is flipped so angles negate and draw counterclockwise
          ctx.beginPath();
          ctx.arc(
            toScreenX(ent.center.x),
            toScreenY(ent.center.y),
            r,
            -ent.startAngle,
            -ent.endAngle,
            true
          );
          ctx.stroke();
          break;
        }
        case 'ellipse': {
          const rx = ent.rx * camera.scale;
          const ry = ent.ry * camera.scale;
          if (rx < 0.25 && ry < 0.25) break;
          ctx.beginPath();
          ctx.ellipse(
            toScreenX(ent.center.x),
            toScreenY(ent.center.y),
            Math.max(rx, 0.5),
            Math.max(ry, 0.5),
            -ent.rotation,
            -ent.endAngle,
            -ent.startAngle
          );
          ctx.stroke();
          break;
        }
        case 'text': {
          const fontSize = Math.max(8, Math.min(48, ent.height * camera.scale));
          if (ent.height * camera.scale < 2.5) break;
          ctx.save();
          ctx.translate(toScreenX(ent.position.x), toScreenY(ent.position.y));
          if (ent.rotation) ctx.rotate(-ent.rotation);
          ctx.font = `${fontSize}px -apple-system, BlinkMacSystemFont, sans-serif`;
          const lines = ent.text.split('\n');
          lines.forEach((line, idx) => {
            ctx.fillText(line, 0, idx * fontSize * 1.15);
          });
          ctx.restore();
          break;
        }
      }
    }
  }, [doc, camera, darkBg, hiddenLayers]);

  const zoomAt = (factor: number, clientX?: number, clientY?: number) => {
    const container = containerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const cx = clientX !== undefined ? clientX - rect.left : rect.width / 2;
    const cy = clientY !== undefined ? clientY - rect.top : rect.height / 2;

    setCamera((prev) => {
      const nextScale = Math.max(1e-5, Math.min(1e5, prev.scale * factor));
      const ratio = nextScale / prev.scale;
      return {
        scale: nextScale,
        offsetX: cx - (cx - prev.offsetX) * ratio,
        offsetY: cy - (cy - prev.offsetY) * ratio,
      };
    });
  };

  const toggleLayer = (name: string) => {
    setHiddenLayers((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };

  const widthSpan = doc ? (doc.bounds.maxX - doc.bounds.minX).toFixed(2) : '0';
  const heightSpan = doc ? (doc.bounds.maxY - doc.bounds.minY).toFixed(2) : '0';

  return (
    <div className="relative w-full h-[72vh] rounded-xl overflow-hidden border border-slate-200 bg-slate-900 flex flex-col">
      {/* Top Toolbar */}
      <div className="px-3 py-2 bg-slate-800/95 border-b border-white/10 flex items-center justify-between gap-2 text-xs text-slate-200 z-10">
        <div className="flex items-center gap-2 min-w-0">
          <span className="px-2 py-0.5 rounded-md bg-[#007AFF]/20 text-sky-300 font-semibold">
            {doc?.format || (fileName.toLowerCase().endsWith('.dwg') ? 'DWG' : 'DXF')}
          </span>
          {doc && (
            <span className="text-slate-400 truncate tabular-nums">
              {doc.entityCount.toLocaleString()} entities · {doc.layers.length} layers ·{' '}
              {widthSpan} × {heightSpan}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={() => zoomAt(1.25)}
            className="p-1.5 rounded-lg hover:bg-white/10 text-slate-200 transition-colors"
            title="Zoom in"
            aria-label="Zoom in"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => zoomAt(0.8)}
            className="p-1.5 rounded-lg hover:bg-white/10 text-slate-200 transition-colors"
            title="Zoom out"
            aria-label="Zoom out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => doc && fitToView(doc)}
            className="p-1.5 rounded-lg hover:bg-white/10 text-slate-200 transition-colors"
            title="Fit to screen"
            aria-label="Fit to screen"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => setDarkBg((v) => !v)}
            className="p-1.5 rounded-lg hover:bg-white/10 text-slate-200 transition-colors"
            title={darkBg ? 'Switch to light background' : 'Switch to dark background'}
            aria-label="Toggle canvas theme"
          >
            {darkBg ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
          {doc && doc.layers.length > 0 && (
            <button
              type="button"
              onClick={() => setShowLayers((v) => !v)}
              className={`flex items-center gap-1 px-2 py-1 rounded-lg transition-colors ${
                showLayers
                  ? 'bg-[#007AFF] text-white'
                  : 'hover:bg-white/10 text-slate-200'
              }`}
              title="Toggle layers"
            >
              <Layers className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Layers</span>
            </button>
          )}
        </div>
      </div>

      {/* Canvas Viewport */}
      <div
        ref={containerRef}
        className="relative flex-1 overflow-hidden cursor-grab active:cursor-grabbing select-none"
        onWheel={(e) => {
          e.preventDefault();
          zoomAt(e.deltaY < 0 ? 1.15 : 0.87, e.clientX, e.clientY);
        }}
        onPointerDown={(e) => {
          dragRef.current = {
            dragging: true,
            startX: e.clientX,
            startY: e.clientY,
            origOffsetX: camera.offsetX,
            origOffsetY: camera.offsetY,
          };
          (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
        }}
        onPointerMove={(e) => {
          if (!dragRef.current.dragging) return;
          const dx = e.clientX - dragRef.current.startX;
          const dy = e.clientY - dragRef.current.startY;
          setCamera((prev) => ({
            ...prev,
            offsetX: dragRef.current.origOffsetX + dx,
            offsetY: dragRef.current.origOffsetY + dy,
          }));
        }}
        onPointerUp={() => {
          dragRef.current.dragging = false;
        }}
        onPointerCancel={() => {
          dragRef.current.dragging = false;
        }}
      >
        <canvas ref={canvasRef} className="block w-full h-full" />

        {isLoading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/90 text-slate-200 gap-2">
            <div className="w-6 h-6 border-2 border-sky-400 border-t-transparent rounded-full animate-spin" />
            <span className="text-xs font-medium">
              Parsing CAD drawing...
            </span>
          </div>
        )}

        {error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/95 text-slate-200 p-6 text-center gap-2">
            <AlertCircle className="w-7 h-7 text-amber-400" />
            <div className="text-sm font-semibold">Could not preview CAD file</div>
            <div className="text-xs text-slate-400 max-w-md">{error}</div>
          </div>
        )}

        {/* Layer Drawer */}
        {showLayers && doc && (
          <div
            onPointerDown={(e) => e.stopPropagation()}
            className="absolute top-2 right-2 w-56 max-h-[calc(100%-16px)] overflow-y-auto rounded-xl bg-slate-900/95 border border-white/15 shadow-xl p-2.5 text-xs text-slate-200"
          >
            <div className="font-semibold text-[11px] uppercase tracking-wider text-slate-400 mb-2">
              Layers ({doc.layers.length})
            </div>
            <div className="space-y-1">
              {doc.layers.map((layer) => {
                const visible = !hiddenLayers.has(layer.name);
                return (
                  <label
                    key={layer.name}
                    className="flex items-center gap-2 px-1.5 py-1 rounded-lg hover:bg-white/10 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={visible}
                      onChange={() => toggleLayer(layer.name)}
                      className="rounded accent-[#007AFF]"
                    />
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0 border border-white/20"
                      style={{ backgroundColor: layer.color }}
                    />
                    <span className="truncate">{layer.name}</span>
                  </label>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

