import DxfParser from 'dxf-parser';

export interface CadPoint {
  x: number;
  y: number;
}

export type CadEntity =
  | {
      type: 'line';
      layer: string;
      color: string;
      start: CadPoint;
      end: CadPoint;
    }
  | {
      type: 'polyline';
      layer: string;
      color: string;
      points: CadPoint[];
      closed?: boolean;
    }
  | {
      type: 'circle';
      layer: string;
      color: string;
      center: CadPoint;
      radius: number;
    }
  | {
      type: 'arc';
      layer: string;
      color: string;
      center: CadPoint;
      radius: number;
      startAngle: number;
      endAngle: number;
    }
  | {
      type: 'ellipse';
      layer: string;
      color: string;
      center: CadPoint;
      rx: number;
      ry: number;
      rotation: number;
      startAngle: number;
      endAngle: number;
    }
  | {
      type: 'text';
      layer: string;
      color: string;
      position: CadPoint;
      text: string;
      height: number;
      rotation?: number;
    };

export interface CadLayer {
  name: string;
  color: string;
  visible: boolean;
}

export interface CadDocument {
  entities: CadEntity[];
  layers: CadLayer[];
  bounds: { minX: number; minY: number; maxX: number; maxY: number };
  entityCount: number;
  format: 'DXF' | 'DWG';
}

// Standard AutoCAD Color Index (ACI) for common indices 1-9 + fallback
const ACI_COLORS: Record<number, string> = {
  1: '#ef4444', // Red
  2: '#eab308', // Yellow
  3: '#22c55e', // Green
  4: '#06b6d4', // Cyan
  5: '#3b82f6', // Blue
  6: '#d946ef', // Magenta
  7: '#e2e8f0', // White / Black (adapts to theme)
  8: '#64748b', // Dark Gray
  9: '#94a3b8', // Light Gray
};

function aciToHex(colorIndex?: number, rawColor?: number): string {
  if (typeof rawColor === 'number' && rawColor > 0xffffff === false && rawColor > 0) {
    return `#${rawColor.toString(16).padStart(6, '0')}`;
  }
  const idx = Math.abs(colorIndex ?? 7);
  if (ACI_COLORS[idx]) return ACI_COLORS[idx];
  if (idx === 0 || idx === 256) return '#e2e8f0';
  // Deterministic vibrant hue for extended ACI indices 10..255
  const hue = ((idx * 37) % 360);
  return `hsl(${hue}, 78%, 62%)`;
}

function cleanCadText(raw: string): string {
  if (!raw) return '';
  return raw
    .replace(/\\P/g, '\n')
    .replace(/\\[fFhHwWcCaAqQtT][^;]*;/g, '')
    .replace(/[{}]/g, '')
    .trim();
}

// Expand bulge segment between p1 and p2 into intermediate points
function expandBulgeSegment(
  p1: CadPoint,
  p2: CadPoint,
  bulge: number,
  segments = 16
): CadPoint[] {
  if (!bulge || Math.abs(bulge) < 1e-6) return [p2];
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  const chord = Math.hypot(dx, dy);
  if (chord < 1e-9) return [p2];

  const theta = 4 * Math.atan(bulge);
  const radius = chord / (2 * Math.sin(Math.abs(theta) / 2));
  const midX = (p1.x + p2.x) / 2;
  const midY = (p1.y + p2.y) / 2;
  const sagitta = (chord / 2) / Math.tan(theta / 2);
  const ux = -dy / chord;
  const uy = dx / chord;
  const cx = midX + sagitta * ux;
  const cy = midY + sagitta * uy;

  const startAngle = Math.atan2(p1.y - cy, p1.x - cx);
  const pts: CadPoint[] = [];
  for (let i = 1; i <= segments; i++) {
    const a = startAngle + (theta * i) / segments;
    pts.push({
      x: cx + radius * Math.cos(a),
      y: cy + radius * Math.sin(a),
    });
  }
  return pts;
}

function expandPolylineVertices(
  vertices: Array<{ x: number; y: number; bulge?: number }>,
  closed?: boolean
): CadPoint[] {
  if (!vertices || vertices.length === 0) return [];
  const pts: CadPoint[] = [{ x: vertices[0].x, y: vertices[0].y }];
  for (let i = 0; i < vertices.length - 1; i++) {
    const v1 = vertices[i];
    const v2 = vertices[i + 1];
    pts.push(...expandBulgeSegment(v1, v2, v1.bulge || 0));
  }
  if (closed && vertices.length > 2) {
    const last = vertices[vertices.length - 1];
    const first = vertices[0];
    if (last.bulge && Math.abs(last.bulge) > 1e-6) {
      pts.push(...expandBulgeSegment(last, first, last.bulge));
    }
  }
  return pts;
}

function transformPoint(
  p: CadPoint,
  tx: number,
  ty: number,
  sx: number,
  sy: number,
  rotRad: number
): CadPoint {
  const xScaled = p.x * sx;
  const yScaled = p.y * sy;
  const cos = Math.cos(rotRad);
  const sin = Math.sin(rotRad);
  return {
    x: tx + xScaled * cos - yScaled * sin,
    y: ty + xScaled * sin + yScaled * cos,
  };
}

function computeBounds(entities: CadEntity[]): CadDocument['bounds'] {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  const expand = (x: number, y: number) => {
    if (!Number.isFinite(x) || !Number.isFinite(y)) return;
    if (x < minX) minX = x;
    if (y < minY) minY = y;
    if (x > maxX) maxX = x;
    if (y > maxY) maxY = y;
  };

  for (const e of entities) {
    switch (e.type) {
      case 'line':
        expand(e.start.x, e.start.y);
        expand(e.end.x, e.end.y);
        break;
      case 'polyline':
        for (const p of e.points) expand(p.x, p.y);
        break;
      case 'circle':
        expand(e.center.x - e.radius, e.center.y - e.radius);
        expand(e.center.x + e.radius, e.center.y + e.radius);
        break;
      case 'arc': {
        let sweep = e.endAngle - e.startAngle;
        if (sweep <= 0) sweep += Math.PI * 2;
        const steps = 24;
        for (let i = 0; i <= steps; i++) {
          const a = e.startAngle + (sweep * i) / steps;
          expand(
            e.center.x + e.radius * Math.cos(a),
            e.center.y + e.radius * Math.sin(a)
          );
        }
        break;
      }
      case 'ellipse':
        expand(e.center.x - Math.max(e.rx, e.ry), e.center.y - Math.max(e.rx, e.ry));
        expand(e.center.x + Math.max(e.rx, e.ry), e.center.y + Math.max(e.rx, e.ry));
        break;
      case 'text':
        expand(e.position.x, e.position.y);
        break;
    }
  }

  if (!Number.isFinite(minX)) {
    return { minX: 0, minY: 0, maxX: 100, maxY: 100 };
  }
  return { minX, minY, maxX, maxY };
}

function convertDxfParsed(dxf: any): CadDocument {
  const layerMap = new Map<string, CadLayer>();
  const rawLayers = dxf?.tables?.layer?.layers || {};
  for (const [name, info] of Object.entries<any>(rawLayers)) {
    layerMap.set(name, {
      name,
      color: aciToHex(info?.colorIndex, info?.color),
      visible: info?.visible !== false && !info?.frozen,
    });
  }

  const getLayerColor = (layerName: string, ent: any): string => {
    if (typeof ent?.colorIndex === 'number' && ent.colorIndex !== 256) {
      return aciToHex(ent.colorIndex, ent.color);
    }
    if (typeof ent?.color === 'number' && ent.color > 0) {
      return aciToHex(undefined, ent.color);
    }
    return layerMap.get(layerName)?.color || '#e2e8f0';
  };

  const entities: CadEntity[] = [];
  const blocks = dxf?.blocks || {};

  const pushEntity = (
    ent: any,
    tx = 0,
    ty = 0,
    sx = 1,
    sy = 1,
    rotRad = 0,
    depth = 0
  ) => {
    if (!ent || depth > 5) return;
    const layer = ent.layer || '0';
    if (!layerMap.has(layer)) {
      layerMap.set(layer, { name: layer, color: '#e2e8f0', visible: true });
    }
    const color = getLayerColor(layer, ent);
    const tp = (p: CadPoint) => transformPoint(p, tx, ty, sx, sy, rotRad);

    switch (ent.type) {
      case 'LINE': {
        if (ent.vertices?.length >= 2) {
          entities.push({
            type: 'line',
            layer,
            color,
            start: tp(ent.vertices[0]),
            end: tp(ent.vertices[1]),
          });
        }
        break;
      }
      case 'LWPOLYLINE':
      case 'POLYLINE': {
        const pts = expandPolylineVertices(ent.vertices || [], Boolean(ent.shape || ent.closed));
        if (pts.length >= 2) {
          entities.push({
            type: 'polyline',
            layer,
            color,
            points: pts.map(tp),
            closed: Boolean(ent.shape || ent.closed),
          });
        }
        break;
      }
      case 'SPLINE': {
        const pts = ent.controlPoints || ent.fitPoints || [];
        if (pts.length >= 2) {
          entities.push({
            type: 'polyline',
            layer,
            color,
            points: pts.map(tp),
            closed: false,
          });
        }
        break;
      }
      case 'CIRCLE': {
        if (ent.center && ent.radius > 0) {
          const avgScale = (Math.abs(sx) + Math.abs(sy)) / 2;
          entities.push({
            type: 'circle',
            layer,
            color,
            center: tp(ent.center),
            radius: ent.radius * avgScale,
          });
        }
        break;
      }
      case 'ARC': {
        if (ent.center && ent.radius > 0) {
          const avgScale = (Math.abs(sx) + Math.abs(sy)) / 2;
          entities.push({
            type: 'arc',
            layer,
            color,
            center: tp(ent.center),
            radius: ent.radius * avgScale,
            startAngle: (ent.startAngle || 0) + rotRad,
            endAngle: (ent.endAngle || 0) + rotRad,
          });
        }
        break;
      }
      case 'ELLIPSE': {
        if (ent.center && ent.majorAxisEndPoint) {
          const rx = Math.hypot(ent.majorAxisEndPoint.x, ent.majorAxisEndPoint.y) * Math.abs(sx);
          const ry = rx * (ent.axisRatio || 1);
          const angle = Math.atan2(ent.majorAxisEndPoint.y, ent.majorAxisEndPoint.x) + rotRad;
          entities.push({
            type: 'ellipse',
            layer,
            color,
            center: tp(ent.center),
            rx,
            ry,
            rotation: angle,
            startAngle: ent.startAngle ?? 0,
            endAngle: ent.endAngle ?? Math.PI * 2,
          });
        }
        break;
      }
      case 'TEXT':
      case 'MTEXT': {
        const pos = ent.startPoint || ent.position;
        const text = cleanCadText(ent.text || '');
        if (pos && text) {
          entities.push({
            type: 'text',
            layer,
            color,
            position: tp(pos),
            text,
            height: (ent.textHeight || ent.height || 10) * Math.abs(sy),
            rotation: ((ent.rotation || 0) * Math.PI) / 180 + rotRad,
          });
        }
        break;
      }
      case 'SOLID':
      case '3DFACE': {
        const pts = (ent.points || ent.vertices || []).filter((p: any) => p && typeof p.x === 'number');
        if (pts.length >= 3) {
          entities.push({
            type: 'polyline',
            layer,
            color,
            points: pts.map(tp),
            closed: true,
          });
        }
        break;
      }
      case 'INSERT': {
        const blk = blocks[ent.name];
        if (blk?.entities?.length) {
          const pos = ent.position || { x: 0, y: 0 };
          const insRot = ((ent.rotation || 0) * Math.PI) / 180;
          const insSx = ent.xScale ?? 1;
          const insSy = ent.yScale ?? 1;
          const base = blk.position || { x: 0, y: 0 };
          const worldOrigin = tp({ x: pos.x - base.x * insSx, y: pos.y - base.y * insSy });
          for (const child of blk.entities) {
            pushEntity(
              child,
              worldOrigin.x,
              worldOrigin.y,
              sx * insSx,
              sy * insSy,
              rotRad + insRot,
              depth + 1
            );
          }
        }
        break;
      }
    }
  };

  for (const ent of dxf?.entities || []) {
    pushEntity(ent);
  }

  return {
    entities,
    layers: Array.from(layerMap.values()),
    bounds: computeBounds(entities),
    entityCount: entities.length,
    format: 'DXF',
  };
}

function convertLibreDwgDb(db: any, format: 'DXF' | 'DWG'): CadDocument {
  const layerMap = new Map<string, CadLayer>();
  for (const layer of db?.tables?.LAYER?.entries || []) {
    const name = layer.name || '0';
    layerMap.set(name, {
      name,
      color: aciToHex(layer.colorIndex, layer.color),
      visible: !layer.frozen && !layer.off,
    });
  }

  const blockMap = new Map<string, any>();
  for (const blk of db?.tables?.BLOCK_RECORD?.entries || []) {
    if (blk?.name) blockMap.set(blk.name, blk);
  }

  const entities: CadEntity[] = [];

  const pushEntity = (
    ent: any,
    tx = 0,
    ty = 0,
    sx = 1,
    sy = 1,
    rotRad = 0,
    depth = 0
  ) => {
    if (!ent || depth > 5) return;
    const layer = ent.layer || '0';
    if (!layerMap.has(layer)) {
      layerMap.set(layer, { name: layer, color: '#e2e8f0', visible: true });
    }
    const color =
      typeof ent.colorIndex === 'number' && ent.colorIndex !== 256
        ? aciToHex(ent.colorIndex, ent.color)
        : layerMap.get(layer)?.color || '#e2e8f0';
    const tp = (p: CadPoint) => transformPoint(p, tx, ty, sx, sy, rotRad);

    switch (ent.type) {
      case 'LINE': {
        if (ent.startPoint && ent.endPoint) {
          entities.push({
            type: 'line',
            layer,
            color,
            start: tp(ent.startPoint),
            end: tp(ent.endPoint),
          });
        }
        break;
      }
      case 'LWPOLYLINE':
      case 'POLYLINE2D':
      case 'POLYLINE3D': {
        const rawVerts = ent.vertices || [];
        const pts = expandPolylineVertices(rawVerts, Boolean(ent.closed || (ent.flag & 1)));
        if (pts.length >= 2) {
          entities.push({
            type: 'polyline',
            layer,
            color,
            points: pts.map(tp),
            closed: Boolean(ent.closed || (ent.flag & 1)),
          });
        }
        break;
      }
      case 'SPLINE': {
        const pts = ent.controlPoints || ent.fitPoints || [];
        if (pts.length >= 2) {
          entities.push({
            type: 'polyline',
            layer,
            color,
            points: pts.map(tp),
            closed: Boolean(ent.closed),
          });
        }
        break;
      }
      case 'CIRCLE': {
        if (ent.center && ent.radius > 0) {
          const avgScale = (Math.abs(sx) + Math.abs(sy)) / 2;
          entities.push({
            type: 'circle',
            layer,
            color,
            center: tp(ent.center),
            radius: ent.radius * avgScale,
          });
        }
        break;
      }
      case 'ARC': {
        if (ent.center && ent.radius > 0) {
          const avgScale = (Math.abs(sx) + Math.abs(sy)) / 2;
          entities.push({
            type: 'arc',
            layer,
            color,
            center: tp(ent.center),
            radius: ent.radius * avgScale,
            startAngle: (ent.startAngle || 0) + rotRad,
            endAngle: (ent.endAngle || 0) + rotRad,
          });
        }
        break;
      }
      case 'ELLIPSE': {
        if (ent.center && ent.majorAxisEndPoint) {
          const rx = Math.hypot(ent.majorAxisEndPoint.x, ent.majorAxisEndPoint.y) * Math.abs(sx);
          const ry = rx * (ent.axisRatio || 1);
          const angle = Math.atan2(ent.majorAxisEndPoint.y, ent.majorAxisEndPoint.x) + rotRad;
          entities.push({
            type: 'ellipse',
            layer,
            color,
            center: tp(ent.center),
            rx,
            ry,
            rotation: angle,
            startAngle: ent.startParameter ?? 0,
            endAngle: ent.endParameter ?? Math.PI * 2,
          });
        }
        break;
      }
      case 'TEXT':
      case 'MTEXT': {
        const pos = ent.startPoint || ent.insertionPoint || ent.position;
        const text = cleanCadText(ent.text || ent.contents || '');
        if (pos && text) {
          entities.push({
            type: 'text',
            layer,
            color,
            position: tp(pos),
            text,
            height: (ent.textHeight || ent.height || 10) * Math.abs(sy),
            rotation: (ent.rotation || 0) + rotRad,
          });
        }
        break;
      }
      case 'INSERT': {
        const blk = blockMap.get(ent.name);
        if (blk?.entities?.length) {
          const pos = ent.insertionPoint || { x: 0, y: 0 };
          const insRot = ent.rotation || 0;
          const insSx = ent.xScale ?? 1;
          const insSy = ent.yScale ?? 1;
          const worldOrigin = tp(pos);
          for (const child of blk.entities) {
            pushEntity(
              child,
              worldOrigin.x,
              worldOrigin.y,
              sx * insSx,
              sy * insSy,
              rotRad + insRot,
              depth + 1
            );
          }
        }
        break;
      }
    }
  };

  for (const ent of db?.entities || []) {
    pushEntity(ent);
  }

  return {
    entities,
    layers: Array.from(layerMap.values()),
    bounds: computeBounds(entities),
    entityCount: entities.length,
    format,
  };
}

export async function parseCadAttachment(
  buffer: ArrayBuffer,
  fileName: string
): Promise<CadDocument> {
  const lower = fileName.toLowerCase();

  // Try fast pure-JS ASCII DXF parser first for .dxf
  if (lower.endsWith('.dxf')) {
    try {
      const text = new TextDecoder('utf-8').decode(buffer);
      if (text.includes('SECTION') && text.includes('ENTITIES')) {
        const parser = new DxfParser();
        const parsed = parser.parseSync(text);
        if (parsed) {
          return convertDxfParsed(parsed);
        }
      }
    } catch {
      // Fall through to libredwg for binary DXF or edge-case DXFs
    }
  }

  // Lazy-load LibreDWG WASM for .dwg (or binary .dxf)
  const { LibreDwg, Dwg_File_Type } = await import('@mlightcad/libredwg-web');
  const libredwg = await LibreDwg.create('/wasm');
  const fileType = lower.endsWith('.dxf') ? Dwg_File_Type.DXF : Dwg_File_Type.DWG;
  const dwgPtr = libredwg.dwg_read_data(buffer, fileType);
  if (!dwgPtr) {
    throw new Error(`Unable to parse ${lower.endsWith('.dxf') ? 'DXF' : 'DWG'} file`);
  }
  try {
    const db = libredwg.convert(dwgPtr);
    return convertLibreDwgDb(db, lower.endsWith('.dxf') ? 'DXF' : 'DWG');
  } finally {
    libredwg.dwg_free(dwgPtr);
  }
}

