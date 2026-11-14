import React from 'react';
import {
  GlassLineItem,
  ProjectInfo,
  ActiveFilmLayer,
  BusbarLocation,
} from '../types/glass';
import {
  calculateItemMetrics,
  formatFraction,
  formatCadDimension,
} from '../utils/dimensions';
import { BrandLogo } from './BrandLogo';

interface CadShopDrawingProps {
  item: GlassLineItem;
  itemIndex: number;
  totalItems: number;
  project: ProjectInfo;
  sheetNumber: number;
  totalSheets: number;
  isPrintPreview?: boolean;
}

export const CadShopDrawing: React.FC<CadShopDrawingProps> = ({
  item,
  itemIndex,
  project,
  sheetNumber,
  totalSheets,
  isPrintPreview = false,
}) => {
  const metrics = calculateItemMetrics(item);
  const w = item.width;
  const h = item.height;

  // Aspect ratio calculation for elevation drawing box
  // Drawing area within SVG: available width ~460px, height ~320px
  const maxDrawW = 440;
  const maxDrawH = 290;
  const aspect = w / (h || 1);

  let drawW = maxDrawW;
  let drawH = drawW / aspect;

  if (drawH > maxDrawH) {
    drawH = maxDrawH;
    drawW = drawH * aspect;
  }

  // Center drawing in elevation viewport (viewBox: 0 0 540 380)
  const elevStartX = 65 + (maxDrawW - drawW) / 2;
  const elevStartY = 45 + (maxDrawH - drawH) / 2;

  // Film perimeter deduction scaled
  const filmOffsetScaledX = Math.max(4, Math.min(18, (0.375 / (w || 1)) * drawW * 1.6));
  const filmOffsetScaledY = Math.max(4, Math.min(18, (0.375 / (h || 1)) * drawH * 1.6));

  const filmW = Math.max(10, drawW - filmOffsetScaledX * 2);
  const filmH = Math.max(10, drawH - filmOffsetScaledY * 2);

  // Active film busbar location geometry
  const activeFilmLayer = item.layers.find(
    (l): l is ActiveFilmLayer => l.kind === 'active_film'
  );
  const busbarLocation: BusbarLocation =
    activeFilmLayer?.busbarLocation ?? 'Top Edge (Center)';

  const filmX = elevStartX + filmOffsetScaledX;
  const filmY = elevStartY + filmOffsetScaledY;
  const barLenH = Math.min(80, Math.max(24, filmW * 0.45));
  const barLenV = Math.min(90, Math.max(24, filmH * 0.45));

  const getBusbarCoords = () => {
    switch (busbarLocation) {
      case 'Top Edge (Left)': {
        const bx = filmX + 8;
        const cx = bx + barLenH / 2;
        const cy = filmY;
        return {
          rect: { x: bx, y: filmY - 2, width: barLenH, height: 4 },
          dot: { cx, cy },
          line: { x1: cx, y1: cy, x2: cx + 15, y2: elevStartY - 12 },
          text: {
            x: cx + 19,
            y: elevStartY - 10,
            anchor: 'start' as const,
            label: 'BUSBAR (TOP LEFT) · 18 AWG LEADS',
          },
        };
      }
      case 'Top Edge (Right)': {
        const bx = filmX + filmW - barLenH - 8;
        const cx = bx + barLenH / 2;
        const cy = filmY;
        return {
          rect: { x: bx, y: filmY - 2, width: barLenH, height: 4 },
          dot: { cx, cy },
          line: { x1: cx, y1: cy, x2: cx - 15, y2: elevStartY - 12 },
          text: {
            x: cx - 19,
            y: elevStartY - 10,
            anchor: 'end' as const,
            label: 'BUSBAR (TOP RIGHT) · 18 AWG LEADS',
          },
        };
      }
      case 'Bottom Edge': {
        const bx = filmX + (filmW - barLenH) / 2;
        const cx = filmX + filmW / 2;
        const cy = filmY + filmH;
        return {
          rect: { x: bx, y: filmY + filmH - 2, width: barLenH, height: 4 },
          dot: { cx, cy },
          line: { x1: cx, y1: cy, x2: cx + 18, y2: elevStartY + drawH + 14 },
          text: {
            x: cx + 22,
            y: elevStartY + drawH + 17,
            anchor: 'start' as const,
            label: 'BUSBAR (BOTTOM) · 18 AWG LEADS',
          },
        };
      }
      case 'Side Edge (Right)': {
        const by = filmY + (filmH - barLenV) / 2;
        const cx = filmX + filmW;
        const cy = filmY + filmH / 2;
        return {
          rect: { x: filmX + filmW - 2, y: by, width: 4, height: barLenV },
          dot: { cx, cy },
          line: { x1: cx, y1: cy, x2: cx - 18, y2: cy - 16 },
          text: {
            x: cx - 22,
            y: cy - 13,
            anchor: 'end' as const,
            label: 'BUSBAR (RIGHT) · 18 AWG LEADS',
          },
        };
      }
      case 'Top Edge (Center)':
      default: {
        const bx = filmX + (filmW - barLenH) / 2;
        const cx = filmX + filmW / 2;
        const cy = filmY;
        return {
          rect: { x: bx, y: filmY - 2, width: barLenH, height: 4 },
          dot: { cx, cy },
          line: { x1: cx, y1: cy, x2: cx + 18, y2: elevStartY - 12 },
          text: {
            x: cx + 22,
            y: elevStartY - 10,
            anchor: 'start' as const,
            label: 'BUSBAR (TOP CENTER) · 18 AWG LEADS',
          },
        };
      }
    }
  };

  const busbar = getBusbarCoords();

  // Cross section calculations
  const totalNomThicknessStr = formatFraction(metrics.totalNominalThickness);

  return (
    <div
      className={`bg-white text-slate-900 border border-slate-300 shadow-sm print-page ${
        isPrintPreview ? 'mx-auto' : ''
      }`}
      style={{
        width: '8.5in',
        minHeight: '11in',
        height: '11in',
        boxSizing: 'border-box',
      }}
    >
      {/* Outer CAD Border with Grid Reference */}
      <div className="h-full w-full border-2 border-slate-800 p-2.5 flex flex-col justify-between relative bg-[#FCFDFD]">
        {/* CAD Grid Coordinates Stamp */}
        <div className="absolute top-0.5 left-6 text-[8px] font-mono text-slate-400 select-none">
          ZONE A &nbsp;&nbsp;|&nbsp;&nbsp; 1 &nbsp;&nbsp;&nbsp;&nbsp; 2
          &nbsp;&nbsp;&nbsp;&nbsp; 3 &nbsp;&nbsp;&nbsp;&nbsp; 4
        </div>
        <div className="absolute top-6 left-0.5 text-[8px] font-mono text-slate-400 select-none flex flex-col gap-16">
          <span>A</span>
          <span>B</span>
          <span>C</span>
          <span>D</span>
        </div>

        {/* Top Header Strip inside CAD Sheet */}
        <div className="flex items-center justify-between border-b-2 border-slate-800 pb-2 px-2">
          <div className="flex items-center gap-3">
            <BrandLogo className="h-9" variant="cad-title" />
            <div>
              <div className="text-[13px] font-black tracking-wide text-slate-900 uppercase">
                American Switch Glass &middot; Technical Submittal
              </div>
              <div className="text-[10px] text-slate-600 font-mono">
                CAD FABRICATION DRAWING &amp; GLASS ASSEMBLY SPECIFICATION
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-[11px] font-bold text-[#004F8A] font-mono">
              DOC #{project.docId}
            </div>
            <div className="text-[9px] text-slate-500 font-mono">
              DWG: ASG-DWG-{String(itemIndex + 1).padStart(3, '0')} &middot; REV 0
            </div>
          </div>
        </div>

        {/* Main CAD Canvas: Split between Elevation View and Cross-Section Detail */}
        <div className="flex-1 grid grid-rows-12 gap-2 py-2 px-1">
          {/* Top 7 Rows: Elevation View & Dimensional Cut Size */}
          <div className="row-span-7 border border-slate-300 bg-[#F8FAFC] relative rounded-sm flex flex-col p-2 overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-200 pb-1 mb-1">
              <span className="text-[11px] font-bold text-slate-800 tracking-wider font-mono uppercase flex items-center gap-2">
                <span className="w-2 h-2 bg-[#004F8A] inline-block"></span>
                ELEVATION VIEW &mdash; DIMENSIONAL PERIMETER &amp; ASG FILM CUT SIZE
              </span>
              <span className="text-[9px] font-mono text-slate-500 bg-white px-2 py-0.5 border border-slate-200">
                SCALE: N.T.S. (NOT TO SCALE)
              </span>
            </div>

            {/* SVG Elevation Drawing */}
            <div className="flex-1 w-full flex items-center justify-center relative">
              <svg
                viewBox="0 0 540 370"
                className="w-full h-full max-h-[300px]"
                xmlns="http://www.w3.org/2000/svg"
              >
                <defs>
                  {/* Marker Arrow Start */}
                  <marker
                    id="arrow-start"
                    viewBox="0 0 10 10"
                    refX="0"
                    refY="5"
                    markerWidth="6"
                    markerHeight="6"
                    orient="auto-start-reverse"
                  >
                    <path d="M 0 5 L 10 0 L 7 5 L 10 10 z" fill="#002D54" />
                  </marker>
                  {/* Marker Arrow End */}
                  <marker
                    id="arrow-end"
                    viewBox="0 0 10 10"
                    refX="10"
                    refY="5"
                    markerWidth="6"
                    markerHeight="6"
                    orient="auto"
                  >
                    <path d="M 0 0 L 10 5 L 0 10 L 3 5 z" fill="#002D54" />
                  </marker>
                  {/* Film Texture Hatch */}
                  <pattern
                    id="filmHatch"
                    width="12"
                    height="12"
                    patternTransform="rotate(45 0 0)"
                    patternUnits="userSpaceOnUse"
                  >
                    <line
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="12"
                      stroke="#0284C7"
                      strokeWidth="0.8"
                      strokeOpacity="0.3"
                    />
                  </pattern>
                </defs>

                {/* Outer Glass Perimeter */}
                <rect
                  x={elevStartX}
                  y={elevStartY}
                  width={drawW}
                  height={drawH}
                  fill="#EFF6FF"
                  stroke="#002D54"
                  strokeWidth="2.5"
                  rx="1"
                />

                {/* Inner ASG Active Privacy Film with 3/8" deduction boundary */}
                <rect
                  x={elevStartX + filmOffsetScaledX}
                  y={elevStartY + filmOffsetScaledY}
                  width={filmW}
                  height={filmH}
                  fill="url(#filmHatch)"
                  stroke="#0284C7"
                  strokeWidth="1.8"
                  strokeDasharray="5 3"
                />

                {/* Dynamic Busbar Strip & Lead Wire Callout */}
                {activeFilmLayer && (
                  <>
                    <rect
                      x={busbar.rect.x}
                      y={busbar.rect.y}
                      width={busbar.rect.width}
                      height={busbar.rect.height}
                      fill="#D97706"
                      stroke="#78350F"
                      strokeWidth="0.75"
                    />
                    <line
                      x1={busbar.line.x1}
                      y1={busbar.line.y1}
                      x2={busbar.line.x2}
                      y2={busbar.line.y2}
                      stroke="#78350F"
                      strokeWidth="1"
                    />
                    <circle
                      cx={busbar.dot.cx}
                      cy={busbar.dot.cy}
                      r="2"
                      fill="#D97706"
                    />
                    <text
                      x={busbar.text.x}
                      y={busbar.text.y}
                      textAnchor={busbar.text.anchor}
                      fontSize="8.5"
                      fontFamily="monospace"
                      fontWeight="bold"
                      fill="#92400E"
                    >
                      {busbar.text.label}
                    </text>
                  </>
                )}

                {/* Top Width Dimension Line */}
                <line
                  x1={elevStartX}
                  y1={elevStartY - 24}
                  x2={elevStartX + drawW}
                  y2={elevStartY - 24}
                  stroke="#002D54"
                  strokeWidth="1.2"
                  markerStart="url(#arrow-start)"
                  markerEnd="url(#arrow-end)"
                />
                {/* Extension lines */}
                <line
                  x1={elevStartX}
                  y1={elevStartY - 30}
                  x2={elevStartX}
                  y2={elevStartY + 3}
                  stroke="#64748B"
                  strokeWidth="0.75"
                />
                <line
                  x1={elevStartX + drawW}
                  y1={elevStartY - 30}
                  x2={elevStartX + drawW}
                  y2={elevStartY + 3}
                  stroke="#64748B"
                  strokeWidth="0.75"
                />
                {/* Width Label */}
                <text
                  x={elevStartX + drawW / 2}
                  y={elevStartY - 30}
                  textAnchor="middle"
                  fontSize="11"
                  fontFamily="monospace"
                  fontWeight="bold"
                  fill="#002D54"
                >
                  WIDTH: {formatCadDimension(w)}
                </text>

                {/* Left Height Dimension Line */}
                <line
                  x1={elevStartX - 28}
                  y1={elevStartY}
                  x2={elevStartX - 28}
                  y2={elevStartY + drawH}
                  stroke="#002D54"
                  strokeWidth="1.2"
                  markerStart="url(#arrow-start)"
                  markerEnd="url(#arrow-end)"
                />
                {/* Extension lines */}
                <line
                  x1={elevStartX - 34}
                  y1={elevStartY}
                  x2={elevStartX + 3}
                  y2={elevStartY}
                  stroke="#64748B"
                  strokeWidth="0.75"
                />
                <line
                  x1={elevStartX - 34}
                  y1={elevStartY + drawH}
                  x2={elevStartX + 3}
                  y2={elevStartY + drawH}
                  stroke="#64748B"
                  strokeWidth="0.75"
                />
                {/* Height Label (rotated) */}
                <text
                  x={-(elevStartY + drawH / 2)}
                  y={elevStartX - 34}
                  transform="rotate(-90)"
                  textAnchor="middle"
                  fontSize="11"
                  fontFamily="monospace"
                  fontWeight="bold"
                  fill="#002D54"
                >
                  HEIGHT: {formatCadDimension(h)}
                </text>

                {/* Architectural Leader Line to Film Callout Badge */}
                <line
                  x1={elevStartX + drawW / 2}
                  y1={elevStartY + drawH / 2}
                  x2={elevStartX + drawW / 2 + 50}
                  y2={elevStartY + drawH / 2 + 40}
                  stroke="#0284C7"
                  strokeWidth="1.2"
                />
                <line
                  x1={elevStartX + drawW / 2 + 50}
                  y1={elevStartY + drawH / 2 + 40}
                  x2={elevStartX + drawW / 2 + 130}
                  y2={elevStartY + drawH / 2 + 40}
                  stroke="#0284C7"
                  strokeWidth="1.2"
                />
                <circle
                  cx={elevStartX + drawW / 2}
                  cy={elevStartY + drawH / 2}
                  r="2.5"
                  fill="#0284C7"
                />

                {/* Film Callout Badge */}
                <g
                  transform={`translate(${Math.min(
                    340,
                    elevStartX + drawW / 2 + 20
                  )}, ${Math.min(290, elevStartY + drawH / 2 + 45)})`}
                >
                  <rect
                    x="0"
                    y="0"
                    width="190"
                    height="38"
                    rx="3"
                    fill="#FFFFFF"
                    stroke="#0284C7"
                    strokeWidth="1.2"
                    filter="drop-shadow(0px 1px 2px rgba(0,0,0,0.06))"
                  />
                  <text
                    x="8"
                    y="13"
                    fontSize="7.5"
                    fontFamily="monospace"
                    fontWeight="bold"
                    fill="#0284C7"
                  >
                    ASG FILM CUT SIZE (-3/8&quot; PERIMETER):
                  </text>
                  <text
                    x="8"
                    y="27"
                    fontSize="10"
                    fontFamily="monospace"
                    fontWeight="bold"
                    fill="#002D54"
                  >
                    {formatFraction(metrics.filmWidth)} &times; {formatFraction(metrics.filmHeight)}
                  </text>
                  <text
                    x="8"
                    y="35"
                    fontSize="6.5"
                    fontFamily="monospace"
                    fill="#64748B"
                  >
                    [{metrics.filmWidth.toFixed(3)}&quot; &times; {metrics.filmHeight.toFixed(3)}&quot;]
                  </text>
                </g>

                {/* Setback Note indicator bottom */}
                <text
                  x={elevStartX + 5}
                  y={elevStartY + drawH - 6}
                  fontSize="7.5"
                  fontFamily="monospace"
                  fill="#0369A1"
                  fontWeight="bold"
                >
                  &rarr; 3/8&quot; [0.375&quot;] HERMETIC EDGE SEAL MARGIN
                </text>
              </svg>
            </div>
          </div>

          {/* Bottom 5 Rows: Cross-Section Layer Detail & Technical Specifications */}
          <div className="row-span-5 grid grid-cols-12 gap-2">
            {/* Cross-Section View (Cols 1-7) */}
            <div className="col-span-7 border border-slate-300 bg-[#F8FAFC] rounded-sm p-2 flex flex-col justify-between">
              <div className="flex items-center justify-between border-b border-slate-200 pb-1 mb-1">
                <span className="text-[10px] font-bold text-slate-800 font-mono tracking-wider uppercase flex items-center gap-1.5">
                  <span className="w-2 h-2 bg-[#0284C7] inline-block"></span>
                  LAMINATION CROSS-SECTION DETAIL (THRU THICKNESS)
                </span>
                <span className="text-[8.5px] font-mono text-slate-600 bg-white px-1.5 py-0.5 border border-slate-200 font-bold">
                  NOM. THICKNESS: {totalNomThicknessStr} &plusmn; 1/32&quot;
                </span>
              </div>

              {/* Cross-Section SVG Diagram with Hatching & Layer Leaders */}
              <div className="flex-1 w-full flex items-center justify-center">
                <svg
                  viewBox="0 0 320 120"
                  className="w-full h-full max-h-[110px]"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <defs>
                    <pattern
                      id="glassHatch"
                      width="8"
                      height="8"
                      patternTransform="rotate(45 0 0)"
                      patternUnits="userSpaceOnUse"
                    >
                      <line x1="0" y1="0" x2="0" y2="8" stroke="#38BDF8" strokeWidth="0.75" />
                    </pattern>
                    <pattern
                      id="spacerVoid"
                      width="6"
                      height="6"
                      patternUnits="userSpaceOnUse"
                    >
                      <circle cx="3" cy="3" r="1" fill="#94A3B8" />
                    </pattern>
                  </defs>

                  {/* Render Visual Stack horizontally */}
                  {(() => {
                    const startX = 25;
                    const sectionW = 270;
                    const startY = 15;
                    const layerHeights: number[] = [];
                    const totalThick = metrics.totalNominalThickness || 0.5;

                    // calculate relative heights for layers in cross section
                    const totalPixelH = 65;
                    item.layers.forEach((l) => {
                      let t = 0.05;
                      if (l.kind === 'glass') t = 0.25;
                      else if (l.kind === 'spacer') t = 0.35;
                      else if (l.kind === 'interlayer') t = 0.06;
                      else if (l.kind === 'active_film') t = 0.04;
                      layerHeights.push((t / (totalThick || 0.5)) * totalPixelH);
                    });

                    // Normalize so sum equals totalPixelH
                    const sumH = layerHeights.reduce((a, b) => a + b, 0);
                    const normH = layerHeights.map((h) => Math.max(6, (h / sumH) * totalPixelH));

                    let currY = startY;
                    return item.layers.map((layer, idx) => {
                      const h = normH[idx];
                      const y = currY;
                      currY += h;

                      let fill = '#E0F2FE';
                      let stroke = '#0284C7';
                      let pattern = '';

                      if (layer.kind === 'glass') {
                        fill = '#BAE6FD';
                        stroke = '#0369A1';
                      } else if (layer.kind === 'interlayer') {
                        fill = '#E2E8F0';
                        stroke = '#94A3B8';
                      } else if (layer.kind === 'active_film') {
                        fill = '#004F8A';
                        stroke = '#002D54';
                      } else if (layer.kind === 'spacer') {
                        fill = '#F1F5F9';
                        stroke = '#475569';
                        pattern = 'url(#spacerVoid)';
                      }

                      return (
                        <g key={layer.id || idx}>
                          <rect
                            x={startX}
                            y={y}
                            width={sectionW}
                            height={h}
                            fill={pattern || fill}
                            stroke={stroke}
                            strokeWidth="0.8"
                          />
                          {/* Layer Label on right side */}
                          <line
                            x1={startX + sectionW}
                            y1={y + h / 2}
                            x2={startX + sectionW + 4}
                            y2={y + h / 2}
                            stroke="#64748B"
                            strokeWidth="0.75"
                          />
                          <text
                            x={startX + 6}
                            y={y + h / 2 + 2.5}
                            fontSize="6.5"
                            fontFamily="monospace"
                            fontWeight="bold"
                            fill={layer.kind === 'active_film' ? '#FFFFFF' : '#0F172A'}
                          >
                            {layer.kind === 'glass' &&
                              `${layer.thickness} ${layer.glassType.replace('Ultra-Clear ', '')} (${layer.process.substring(0, 3)})`}
                            {layer.kind === 'interlayer' &&
                              `${layer.thickness} ${layer.material}`}
                            {layer.kind === 'active_film' &&
                              `ASG ACTIVE PDLC FILM CORE`}
                            {layer.kind === 'spacer' &&
                              `${layer.thickness} ${layer.color} (Argon)`}
                          </text>
                        </g>
                      );
                    });
                  })()}

                  {/* Assembly Thickness Dimension Line at Left */}
                  <line
                    x1="12"
                    y1="15"
                    x2="12"
                    y2="80"
                    stroke="#002D54"
                    strokeWidth="1"
                    markerStart="url(#arrow-start)"
                    markerEnd="url(#arrow-end)"
                  />
                  <text
                    x="-48"
                    y="8"
                    transform="rotate(-90)"
                    fontSize="7"
                    fontFamily="monospace"
                    fontWeight="bold"
                    fill="#002D54"
                  >
                    {totalNomThicknessStr}
                  </text>
                </svg>
              </div>

              {/* Fabrication Tolerance Footer Note */}
              <div className="text-[8px] font-mono text-slate-500 border-t border-slate-200 pt-1 flex justify-between">
                <span>ASTM C1172 / ASTM C1036 COMPLIANT</span>
                <span className="font-semibold text-slate-700">
                  TOTAL WEIGHT: {metrics.weightPerUnitLbs.toFixed(1)} LBS/UNIT
                </span>
              </div>
            </div>

            {/* Engineering & Glazing Specification Box (Cols 8-12) */}
            <div className="col-span-5 border border-slate-300 bg-white rounded-sm p-2 flex flex-col justify-between text-[8px] font-mono text-slate-700 leading-tight">
              <div>
                <div className="text-[9px] font-bold text-slate-900 uppercase border-b border-slate-200 pb-0.5 mb-1 flex items-center justify-between">
                  <span>GLAZING &amp; WIRING NOTES</span>
                  <span className="text-[#004F8A]">ASG-STD</span>
                </div>
                <ol className="list-decimal pl-3 space-y-1 text-slate-600">
                  <li>
                    <strong className="text-slate-800">Sealant Compatibility:</strong> Use 100%
                    Neutral Cure Silicone ONLY (Dow Corning 795 or 995). Acidic cure silicone
                    strictly voids warranty.
                  </li>
                  <li>
                    <strong className="text-slate-800">Wiring &amp; Power:</strong> 18 AWG Teflon
                    leads connect to ASG Step-down Transformer (48V–65V AC output). Do not connect
                    directly to line voltage.
                  </li>
                  <li>
                    <strong className="text-slate-800">Setting Blocks:</strong> Place 80-90
                    Durometer neoprene/silicone blocks at 1/4 points. Never allow busbar to bear
                    weight.
                  </li>
                  <li>
                    <strong className="text-slate-800">Dry Fit:</strong> Bench-test optical switch
                    transparency prior to final structural glazing setting.
                  </li>
                </ol>
              </div>

              <div className="border-t border-slate-200 pt-1 text-[7.5px] text-slate-500">
                <span>WARRANTY: 5-YEAR ASG LAMINATED PDLC WARRANTY</span>
              </div>
            </div>
          </div>
        </div>

        {/* CAD Official Title Block (Bottom of Sheet) */}
        <div className="border-2 border-slate-800 grid grid-cols-12 bg-white mt-1 divide-x-2 divide-slate-800">
          {/* Logo & Company Section (Cols 1-4) */}
          <div className="col-span-4 p-2 flex flex-col justify-between">
            <div className="flex items-center gap-2">
              <BrandLogo className="h-7" variant="compact" showSubtitle={false} />
              <div>
                <div className="text-[11px] font-black text-slate-900 uppercase">
                  American Switch Glass
                </div>
                <div className="text-[7.5px] text-slate-500">
                  www.americanswitchglass.com &middot; (800) 555-SWCH
                </div>
              </div>
            </div>
            <div className="text-[7.5px] text-slate-500 font-mono mt-1">
              PROPRIETARY &amp; CONFIDENTIAL COMMERCIAL SUBMITTAL
            </div>
          </div>

          {/* Project & Tag Info (Cols 5-8) */}
          <div className="col-span-5 p-2 flex flex-col justify-between">
            <div>
              <div className="text-[7px] text-slate-400 font-mono uppercase tracking-wider">
                PROJECT &amp; LOCATION TAG
              </div>
              <div className="text-[10px] font-bold text-slate-900 truncate">
                {project.projectName}
              </div>
              <div className="text-[9px] font-semibold text-[#004F8A] truncate font-mono">
                TAG: {item.tag}
              </div>
            </div>
            <div className="flex items-center gap-3 text-[7.5px] font-mono text-slate-600 border-t border-slate-200 pt-1 mt-1">
              <span>QTY: <strong className="text-slate-900">{item.quantity} UNITS</strong></span>
              <span>&middot;</span>
              <span>GROSS: <strong className="text-slate-900">{metrics.grossSqFtPerUnit.toFixed(2)} SQ FT</strong></span>
              <span>&middot;</span>
              <span>WT: <strong className="text-slate-900">{metrics.weightPerUnitLbs.toFixed(1)} LBS</strong></span>
            </div>
          </div>

          {/* Drawing Numbers & Sign-off (Cols 9-12) */}
          <div className="col-span-3 p-2 flex flex-col justify-between bg-[#F8FAFC]">
            <div className="grid grid-cols-2 gap-1 text-[7.5px] font-mono">
              <div>
                <span className="text-slate-400">DATE:</span>
                <div className="font-bold text-slate-800">{project.date}</div>
              </div>
              <div>
                <span className="text-slate-400">SCALE:</span>
                <div className="font-bold text-slate-800">N.T.S.</div>
              </div>
              <div>
                <span className="text-slate-400">DRAWN BY:</span>
                <div className="font-bold text-slate-800">ASG ENG</div>
              </div>
              <div>
                <span className="text-slate-400">STATUS:</span>
                <div className="font-bold text-emerald-700">SUBMITTAL</div>
              </div>
            </div>

            <div className="border-t border-slate-300 pt-1 mt-1 flex items-center justify-between font-mono">
              <span className="text-[8px] text-slate-500 font-bold">
                SHEET {sheetNumber} OF {totalSheets}
              </span>
              <span className="text-[9px] font-black text-[#004F8A]">
                REV 0
              </span>
            </div>
          </div>
        </div>

        {/* Outer Fine Footer */}
        <div className="flex items-center justify-between text-[7px] font-mono text-slate-400 pt-1 px-1">
          <span>&copy; {new Date().getFullYear()} American Switch Glass Corporation. All Rights Reserved.</span>
          <span>SUBMITTAL PACKAGE &middot; 8.5&quot; &times; 11&quot; LETTER STANDARDS</span>
        </div>
      </div>
    </div>
  );
};
