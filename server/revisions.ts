import {
  GlassLineItem,
  GlassStackLayer,
  LiteRevisionEntry,
} from '../src/types/glass';

function describeLayer(layer: GlassStackLayer): string {
  switch (layer.kind) {
    case 'glass':
      return `${layer.thickness} ${layer.glassType} (${layer.process})`;
    case 'interlayer':
      return `${layer.thickness} ${layer.material}`;
    case 'active_film':
      return `ASG Switchable Film (Busbar: ${layer.busbarLocation}, Leads: ${layer.leadLength}, Offset: ${layer.offsetDeduction}")`;
    case 'spacer':
      return `${layer.thickness} ${layer.color} Spacer (${layer.gasFill})`;
  }
}

function normalizeLayerForCompare(layer: GlassStackLayer): Omit<GlassStackLayer, 'id'> {
  const { id: _id, ...rest } = layer;
  return rest;
}

export function diffLiteDrawingFields(
  prev: GlassLineItem,
  next: GlassLineItem
): string[] {
  const changes: string[] = [];

  if (Number(prev.quantity) !== Number(next.quantity)) {
    changes.push(`Qty: ${prev.quantity} → ${next.quantity}`);
  }

  const widthChanged =
    Math.abs(Number(prev.width) - Number(next.width)) > 1e-4 ||
    (prev.widthRaw || '') !== (next.widthRaw || '');
  if (widthChanged) {
    changes.push(
      `Width: ${prev.widthRaw || prev.width}" → ${next.widthRaw || next.width}"`
    );
  }

  const heightChanged =
    Math.abs(Number(prev.height) - Number(next.height)) > 1e-4 ||
    (prev.heightRaw || '') !== (next.heightRaw || '');
  if (heightChanged) {
    changes.push(
      `Height: ${prev.heightRaw || prev.height}" → ${next.heightRaw || next.height}"`
    );
  }

  const prevLayers = prev.layers || [];
  const nextLayers = next.layers || [];

  if (prevLayers.length !== nextLayers.length) {
    changes.push(
      `Assembly Stack: ${prevLayers.length} layers → ${nextLayers.length} layers`
    );
    const prevSummary = prevLayers.map(describeLayer).join(' + ');
    const nextSummary = nextLayers.map(describeLayer).join(' + ');
    changes.push(`Makeup: ${prevSummary} → ${nextSummary}`);
  } else {
    for (let i = 0; i < nextLayers.length; i++) {
      const pNorm = JSON.stringify(normalizeLayerForCompare(prevLayers[i]));
      const nNorm = JSON.stringify(normalizeLayerForCompare(nextLayers[i]));
      if (pNorm !== nNorm) {
        changes.push(
          `Layer ${i + 1}: ${describeLayer(prevLayers[i])} → ${describeLayer(nextLayers[i])}`
        );
      }
    }
  }

  return changes;
}

export function createSnapshot(item: GlassLineItem): LiteRevisionEntry['snapshot'] {
  return {
    tag: item.tag,
    quantity: Number(item.quantity || 1),
    widthRaw: item.widthRaw || String(item.width || 0),
    heightRaw: item.heightRaw || String(item.height || 0),
    width: Number(item.width || 0),
    height: Number(item.height || 0),
    layers: item.layers || [],
  };
}

export function buildInitialRevision(item: GlassLineItem, nowIso: string): {
  revision: number;
  revisionHistory: LiteRevisionEntry[];
} {
  if (
    Array.isArray(item.revisionHistory) &&
    item.revisionHistory.length > 0 &&
    typeof item.revision === 'number'
  ) {
    return {
      revision: item.revision,
      revisionHistory: item.revisionHistory,
    };
  }
  return {
    revision: 0,
    revisionHistory: [
      {
        rev: 0,
        timestamp: nowIso,
        changes: ['Initial drawing release'],
        snapshot: createSnapshot(item),
      },
    ],
  };
}

export function computeNextRevision(
  prev: GlassLineItem,
  next: GlassLineItem,
  nowIso: string
): {
  revision: number;
  revisionHistory: LiteRevisionEntry[];
} {
  const prevRev = typeof prev.revision === 'number' ? prev.revision : 0;
  const prevHistory: LiteRevisionEntry[] =
    Array.isArray(prev.revisionHistory) && prev.revisionHistory.length > 0
      ? prev.revisionHistory
      : [
          {
            rev: prevRev,
            timestamp: nowIso,
            changes: ['Baseline drawing recorded'],
            snapshot: createSnapshot(prev),
          },
        ];

  const changes = diffLiteDrawingFields(prev, next);
  if (changes.length === 0) {
    return {
      revision: prevRev,
      revisionHistory: prevHistory,
    };
  }

  const nextRev = prevRev + 1;
  return {
    revision: nextRev,
    revisionHistory: [
      ...prevHistory,
      {
        rev: nextRev,
        timestamp: nowIso,
        changes,
        snapshot: createSnapshot(next),
      },
    ],
  };
}

