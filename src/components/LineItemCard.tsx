import React, { useState } from 'react';
import {
  GlassLineItem,
  GlassStackLayer,
  GlassThickness,
  GlassType,
  GlassProcess,
  InterlayerMaterial,
  InterlayerThickness,
  SpacerThickness,
  SpacerColor,
  BusbarLocation,
} from '../types/glass';
import {
  parseGlassDimension,
  formatFraction,
  calculateItemMetrics,
} from '../utils/dimensions';
import {
  GLASS_PRESETS,
  clonePresetLayers,
  generateLayerId,
} from '../utils/presets';
import {
  Layers,
  ArrowUp,
  ArrowDown,
  Trash2,
  Copy,
  Plus,
  Eye,
  Sliders,
  Sparkles,
} from 'lucide-react';

interface LineItemCardProps {
  item: GlassLineItem;
  index: number;
  totalItems: number;
  onUpdate: (updated: GlassLineItem) => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onViewDrawing: () => void;
}

export const LineItemCard: React.FC<LineItemCardProps> = ({
  item,
  index,
  onUpdate,
  onDelete,
  onDuplicate,
  onViewDrawing,
}) => {
  const [showAdvancedLayers, setShowAdvancedLayers] = useState(false);
  const metrics = calculateItemMetrics(item);

  // Dimension change handlers
  const handleWidthChange = (val: string) => {
    const parsed = parseGlassDimension(val);
    onUpdate({
      ...item,
      widthRaw: val,
      width: parsed,
    });
  };

  const handleHeightChange = (val: string) => {
    const parsed = parseGlassDimension(val);
    onUpdate({
      ...item,
      heightRaw: val,
      height: parsed,
    });
  };

  const handleQtyChange = (qty: number) => {
    onUpdate({
      ...item,
      quantity: Math.max(1, qty),
    });
  };

  // Layer stack actions
  const applyPreset = (presetId: string) => {
    const newLayers = clonePresetLayers(presetId);
    onUpdate({
      ...item,
      layers: newLayers,
    });
  };

  const moveLayer = (layerIdx: number, direction: 'up' | 'down') => {
    const targetIdx = direction === 'up' ? layerIdx - 1 : layerIdx + 1;
    if (targetIdx < 0 || targetIdx >= item.layers.length) return;

    const newLayers = [...item.layers];
    const temp = newLayers[layerIdx];
    newLayers[layerIdx] = newLayers[targetIdx];
    newLayers[targetIdx] = temp;

    onUpdate({
      ...item,
      layers: newLayers,
    });
  };

  const removeLayer = (layerIdx: number) => {
    if (item.layers.length <= 1) return;
    const newLayers = item.layers.filter((_, idx) => idx !== layerIdx);
    onUpdate({
      ...item,
      layers: newLayers,
    });
  };

  const updateLayer = (layerIdx: number, updatedLayer: GlassStackLayer) => {
    const newLayers = [...item.layers];
    newLayers[layerIdx] = updatedLayer;
    onUpdate({
      ...item,
      layers: newLayers,
    });
  };

  const addLayer = (kind: 'glass' | 'interlayer' | 'active_film' | 'spacer') => {
    let newLayer: GlassStackLayer;
    if (kind === 'glass') {
      newLayer = {
        id: generateLayerId(),
        kind: 'glass',
        thickness: '1/4"',
        glassType: 'Ultra-Clear Low Iron',
        process: 'Fully Tempered',
      };
    } else if (kind === 'interlayer') {
      newLayer = {
        id: generateLayerId(),
        kind: 'interlayer',
        material: 'PVB',
        thickness: '0.045"',
      };
    } else if (kind === 'active_film') {
      newLayer = {
        id: generateLayerId(),
        kind: 'active_film',
        material: 'ASG PDLC Switchable Film',
        nominalThickness: 0.015,
        offsetDeduction: 0.375,
        busbarLocation: 'Top Edge (Center)',
        leadLength: '12 ft Teflon leads',
      };
    } else {
      newLayer = {
        id: generateLayerId(),
        kind: 'spacer',
        thickness: '1/2"',
        color: 'Warm Edge Black',
        gasFill: '90% Argon / 10% Dry Air',
      };
    }

    onUpdate({
      ...item,
      layers: [...item.layers, newLayer],
    });
  };

  return (
    <div className="bg-white border border-slate-200 rounded-lg shadow-xs hover:border-slate-300 transition-all overflow-hidden">
      {/* Card Header Bar */}
      <div className="bg-slate-50/80 px-4 py-3 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 flex-1 min-w-[260px]">
          <span className="flex items-center justify-center w-6 h-6 rounded-md bg-[#004F8A] text-white font-mono text-xs font-bold shrink-0">
            {index + 1}
          </span>
          <input
            type="text"
            value={item.tag}
            onChange={(e) => onUpdate({ ...item, tag: e.target.value })}
            placeholder="Item location tag (e.g. Conference Room East Lite)"
            className="font-semibold text-slate-800 text-sm bg-transparent border-b border-dashed border-slate-300 hover:border-slate-400 focus:border-[#004F8A] focus:outline-hidden px-1 py-0.5 flex-1 min-w-[180px]"
          />
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={onViewDrawing}
            className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-[#004F8A] bg-blue-50/70 hover:bg-blue-100 rounded-md transition-colors"
            title="Preview CAD Shop Drawing Sheet"
          >
            <Eye className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">CAD View</span>
          </button>

          <button
            onClick={onDuplicate}
            className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-200/60 rounded-md transition-colors"
            title="Duplicate Line Item"
          >
            <Copy className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={onDelete}
            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
            title="Delete Line Item"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Card Body */}
      <div className="p-4 space-y-4">
        {/* Dimensions & Quantity Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
          {/* Quantity */}
          <div className="sm:col-span-2">
            <label className="block text-xs font-mono text-slate-500 mb-1">
              Quantity
            </label>
            <input
              type="number"
              min="1"
              max="999"
              value={item.quantity}
              onChange={(e) => handleQtyChange(parseInt(e.target.value) || 1)}
              className="w-full font-mono text-sm font-bold text-slate-800 bg-slate-50 border border-slate-200 rounded-md px-3 py-1.5 focus:border-[#004F8A] focus:outline-hidden"
            />
          </div>

          {/* Width Input */}
          <div className="sm:col-span-3">
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-mono text-slate-500">
                Width (inches)
              </label>
              <span className="text-[10px] font-mono text-[#004F8A]">
                {item.width ? `${item.width.toFixed(3)}"` : ''}
              </span>
            </div>
            <input
              type="text"
              value={item.widthRaw}
              onChange={(e) => handleWidthChange(e.target.value)}
              placeholder="e.g. 36 1/2 or 36.5"
              className="w-full font-mono text-sm font-semibold text-slate-800 bg-slate-50 border border-slate-200 rounded-md px-3 py-1.5 focus:border-[#004F8A] focus:outline-hidden"
            />
          </div>

          {/* Height Input */}
          <div className="sm:col-span-3">
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-mono text-slate-500">
                Height (inches)
              </label>
              <span className="text-[10px] font-mono text-[#004F8A]">
                {item.height ? `${item.height.toFixed(3)}"` : ''}
              </span>
            </div>
            <input
              type="text"
              value={item.heightRaw}
              onChange={(e) => handleHeightChange(e.target.value)}
              placeholder="e.g. 84 or 84 1/4"
              className="w-full font-mono text-sm font-semibold text-slate-800 bg-slate-50 border border-slate-200 rounded-md px-3 py-1.5 focus:border-[#004F8A] focus:outline-hidden"
            />
          </div>

          {/* Live Engineering Metrics Quick Summary */}
          <div className="sm:col-span-4 bg-slate-50/90 border border-slate-200 rounded-md p-2 flex flex-col justify-center">
            <div className="flex items-center justify-between text-xs font-mono text-slate-600">
              <span>Gross Area:</span>
              <strong className="text-slate-900">
                {metrics.grossSqFtPerUnit.toFixed(2)} sq ft ({metrics.totalGrossSqFt.toFixed(1)} tot)
              </strong>
            </div>
            <div className="flex items-center justify-between text-xs font-mono text-slate-600 mt-0.5">
              <span>Glass Weight:</span>
              <strong className="text-slate-900">
                {metrics.weightPerUnitLbs.toFixed(1)} lbs ({metrics.totalWeightLbs.toFixed(0)} tot)
              </strong>
            </div>
          </div>
        </div>

        {/* ASG Film Cut Size Banner (PRD Feature & Formula) */}
        <div className="bg-[#EFF6FF] border border-[#BFDBFE] rounded-md px-3.5 py-2 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#004F8A] animate-pulse"></span>
            <span className="text-xs font-mono font-bold text-[#002D54]">
              ASG ACTIVE PRIVACY FILM CUT SIZE:
            </span>
            <span className="text-xs font-mono font-bold text-[#0284C7] bg-white px-2 py-0.5 rounded border border-blue-200">
              {formatFraction(metrics.filmWidth)} &times; {formatFraction(metrics.filmHeight)}
            </span>
            <span className="text-[11px] font-mono text-slate-500 hidden md:inline">
              [{metrics.filmWidth.toFixed(3)}&quot; &times; {metrics.filmHeight.toFixed(3)}&quot;]
            </span>
          </div>

          <div className="text-[11px] font-mono text-slate-500">
            Standard 3/8&quot; perimeter hermetic edge seal setback applied
          </div>
        </div>

        {/* Layer Stack Header & 1-Click Presets */}
        <div className="border-t border-slate-100 pt-3">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-[#004F8A]" />
              <span className="text-xs font-semibold text-slate-800">
                Assembly Layer Stack
              </span>
              <span className="text-xs font-mono text-slate-500">
                ({item.layers.length} layers &middot; {formatFraction(metrics.totalNominalThickness)} Nom. Thickness)
              </span>
            </div>

            {/* Presets Quick Dropdown */}
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] text-slate-500 font-mono hidden sm:inline flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-500" /> Presets:
              </span>
              <div className="flex items-center gap-1">
                {GLASS_PRESETS.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => applyPreset(p.id)}
                    className="text-[11px] px-2 py-0.5 rounded-sm bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors font-mono"
                    title={p.description}
                  >
                    {p.category}
                  </button>
                ))}
              </div>

              <button
                onClick={() => setShowAdvancedLayers(!showAdvancedLayers)}
                className="text-xs text-[#004F8A] hover:text-[#002D54] flex items-center gap-1 ml-2 font-medium"
              >
                <Sliders className="w-3.5 h-3.5" />
                {showAdvancedLayers ? 'Compact' : 'Edit Layers'}
              </button>
            </div>
          </div>

          {/* Layer Makeup String Representation */}
          <div className="text-xs font-mono text-slate-700 bg-slate-50 p-2 rounded border border-slate-200">
            {metrics.layerMakeupString}
          </div>

          {/* Advanced Layer Stack Editor (Expanded) */}
          {showAdvancedLayers && (
            <div className="mt-3 space-y-2 bg-slate-50/60 p-3 rounded-lg border border-slate-200">
              <div className="text-[11px] font-mono text-slate-500 uppercase tracking-wider mb-2">
                Layers from Outboard to Inboard:
              </div>

              {item.layers.map((layer, lIdx) => (
                <div
                  key={layer.id || lIdx}
                  className="bg-white border border-slate-200 rounded p-2 flex flex-wrap items-center justify-between gap-2 shadow-2xs"
                >
                  <div className="flex items-center gap-2 flex-1 min-w-[280px]">
                    <span className="text-[11px] font-mono text-slate-400 w-4">
                      #{lIdx + 1}
                    </span>

                    {/* Kind Pill / Label */}
                    <span
                      className={`text-[10px] font-mono px-1.5 py-0.5 rounded font-bold uppercase ${
                        layer.kind === 'glass'
                          ? 'bg-sky-100 text-sky-800'
                          : layer.kind === 'interlayer'
                          ? 'bg-amber-100 text-amber-800'
                          : layer.kind === 'active_film'
                          ? 'bg-blue-100 text-blue-900 border border-blue-300'
                          : 'bg-slate-200 text-slate-800'
                      }`}
                    >
                      {layer.kind === 'active_film'
                        ? 'ASG Film'
                        : layer.kind}
                    </span>

                    {/* Specific Layer Controls */}
                    {layer.kind === 'glass' && (
                      <div className="flex items-center gap-2 flex-wrap text-xs">
                        {/* Thickness */}
                        <select
                          value={layer.thickness}
                          onChange={(e) =>
                            updateLayer(lIdx, {
                              ...layer,
                              thickness: e.target.value as GlassThickness,
                            })
                          }
                          className="font-mono bg-slate-50 border border-slate-200 rounded px-1.5 py-0.5 text-xs text-slate-800"
                        >
                          <option value="1/8&quot;">1/8&quot;</option>
                          <option value="5/32&quot;">5/32&quot;</option>
                          <option value="3/16&quot;">3/16&quot;</option>
                          <option value="1/4&quot;">1/4&quot;</option>
                          <option value="5/16&quot;">5/16&quot;</option>
                          <option value="3/8&quot;">3/8&quot;</option>
                          <option value="1/2&quot;">1/2&quot;</option>
                          <option value="5/8&quot;">5/8&quot;</option>
                          <option value="3/4&quot;">3/4&quot;</option>
                        </select>

                        {/* Glass Type */}
                        <select
                          value={layer.glassType}
                          onChange={(e) =>
                            updateLayer(lIdx, {
                              ...layer,
                              glassType: e.target.value as GlassType,
                            })
                          }
                          className="bg-slate-50 border border-slate-200 rounded px-1.5 py-0.5 text-xs text-slate-800"
                        >
                          <option value="Ultra-Clear Low Iron">Low Iron (Starphire)</option>
                          <option value="Clear">Clear</option>
                          <option value="Grey Tint">Grey Tint</option>
                          <option value="Bronze Tint">Bronze Tint</option>
                          <option value="Low-E Surface 1">Low-E Surface 1</option>
                          <option value="Low-E Surface 2">Low-E Surface 2</option>
                        </select>

                        {/* Process */}
                        <select
                          value={layer.process}
                          onChange={(e) =>
                            updateLayer(lIdx, {
                              ...layer,
                              process: e.target.value as GlassProcess,
                            })
                          }
                          className="bg-slate-50 border border-slate-200 rounded px-1.5 py-0.5 text-xs text-slate-800"
                        >
                          <option value="Fully Tempered">Fully Tempered</option>
                          <option value="Heat Strengthened">Heat Strengthened</option>
                          <option value="Annealed">Annealed</option>
                        </select>
                      </div>
                    )}

                    {layer.kind === 'interlayer' && (
                      <div className="flex items-center gap-2 flex-wrap text-xs">
                        <select
                          value={layer.material}
                          onChange={(e) =>
                            updateLayer(lIdx, {
                              ...layer,
                              material: e.target.value as InterlayerMaterial,
                            })
                          }
                          className="bg-slate-50 border border-slate-200 rounded px-1.5 py-0.5 text-xs text-slate-800"
                        >
                          <option value="PVB">PVB Interlayer</option>
                          <option value="SentryGlas (SG)">SentryGlas Structural</option>
                        </select>

                        <select
                          value={layer.thickness}
                          onChange={(e) =>
                            updateLayer(lIdx, {
                              ...layer,
                              thickness: e.target.value as InterlayerThickness,
                            })
                          }
                          className="font-mono bg-slate-50 border border-slate-200 rounded px-1.5 py-0.5 text-xs text-slate-800"
                        >
                          <option value="0.030&quot;">0.030&quot; (0.76mm)</option>
                          <option value="0.045&quot;">0.045&quot; (1.14mm)</option>
                          <option value="0.060&quot;">0.060&quot; (1.52mm)</option>
                          <option value="0.090&quot;">0.090&quot; (2.28mm)</option>
                        </select>
                      </div>
                    )}

                    {layer.kind === 'active_film' && (
                      <div className="flex items-center gap-2 flex-wrap text-xs">
                        <span className="font-mono text-slate-600 text-xs">
                          PDLC Core (0.015&quot;)
                        </span>
                        <select
                          value={layer.busbarLocation}
                          onChange={(e) =>
                            updateLayer(lIdx, {
                              ...layer,
                              busbarLocation: e.target.value as BusbarLocation,
                            })
                          }
                          className="bg-slate-50 border border-slate-200 rounded px-1.5 py-0.5 text-xs text-slate-800 font-mono"
                        >
                          <option value="Top Edge (Center)">Busbar: Top Center</option>
                          <option value="Top Edge (Right)">Busbar: Top Right</option>
                          <option value="Top Edge (Left)">Busbar: Top Left</option>
                          <option value="Bottom Edge">Busbar: Bottom Edge</option>
                          <option value="Side Edge (Right)">Busbar: Right Side</option>
                        </select>
                      </div>
                    )}

                    {layer.kind === 'spacer' && (
                      <div className="flex items-center gap-2 flex-wrap text-xs">
                        <select
                          value={layer.thickness}
                          onChange={(e) =>
                            updateLayer(lIdx, {
                              ...layer,
                              thickness: e.target.value as SpacerThickness,
                            })
                          }
                          className="font-mono bg-slate-50 border border-slate-200 rounded px-1.5 py-0.5 text-xs text-slate-800"
                        >
                          <option value="1/4&quot;">1/4&quot; Cavity</option>
                          <option value="3/8&quot;">3/8&quot; Cavity</option>
                          <option value="1/2&quot;">1/2&quot; Cavity</option>
                          <option value="5/8&quot;">5/8&quot; Cavity</option>
                        </select>

                        <select
                          value={layer.color}
                          onChange={(e) =>
                            updateLayer(lIdx, {
                              ...layer,
                              color: e.target.value as SpacerColor,
                            })
                          }
                          className="bg-slate-50 border border-slate-200 rounded px-1.5 py-0.5 text-xs text-slate-800"
                        >
                          <option value="Warm Edge Black">Warm Edge Black</option>
                          <option value="Clear / Mill Anodized">Clear Mill Anodized</option>
                          <option value="Dark Bronze">Dark Bronze</option>
                        </select>
                      </div>
                    )}
                  </div>

                  {/* Move & Delete Buttons */}
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => moveLayer(lIdx, 'up')}
                      disabled={lIdx === 0}
                      className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-20 rounded"
                      title="Move Layer Outboard"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => moveLayer(lIdx, 'down')}
                      disabled={lIdx === item.layers.length - 1}
                      className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-20 rounded"
                      title="Move Layer Inboard"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => removeLayer(lIdx)}
                      disabled={item.layers.length <= 1}
                      className="p-1 text-slate-400 hover:text-rose-600 disabled:opacity-20 rounded"
                      title="Delete Layer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}

              {/* Add Layer Buttons */}
              <div className="pt-2 flex flex-wrap items-center gap-2">
                <span className="text-[11px] font-mono text-slate-500">
                  + Add Layer:
                </span>
                <button
                  onClick={() => addLayer('glass')}
                  className="text-xs px-2 py-1 rounded bg-sky-50 text-sky-700 hover:bg-sky-100 border border-sky-200 transition-colors flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" /> Glass Pane
                </button>
                <button
                  onClick={() => addLayer('interlayer')}
                  className="text-xs px-2 py-1 rounded bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200 transition-colors flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" /> Interlayer (PVB/SG)
                </button>
                <button
                  onClick={() => addLayer('active_film')}
                  className="text-xs px-2 py-1 rounded bg-blue-50 text-blue-800 hover:bg-blue-100 border border-blue-200 transition-colors flex items-center gap-1 font-semibold"
                >
                  <Plus className="w-3 h-3" /> ASG Active Film
                </button>
                <button
                  onClick={() => addLayer('spacer')}
                  className="text-xs px-2 py-1 rounded bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-300 transition-colors flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" /> IGU Spacer
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Notes Line */}
        <div>
          <input
            type="text"
            value={item.notes || ''}
            onChange={(e) => onUpdate({ ...item, notes: e.target.value })}
            placeholder="Glazing notes: e.g. 'Top-hung sliding door with concealed pocket channel'"
            className="w-full text-xs font-mono text-slate-600 bg-transparent border-b border-dashed border-slate-200 hover:border-slate-300 focus:border-[#004F8A] focus:outline-hidden py-1"
          />
        </div>
      </div>
    </div>
  );
};
