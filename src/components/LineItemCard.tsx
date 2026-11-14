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
  ChevronDown,
  ChevronUp,
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
    <section
      aria-label={`Line item ${index + 1}: ${item.tag || 'Untitled'}`}
      className="bg-white rounded-2xl border border-black/[0.06] shadow-[0_1px_4px_rgba(0,0,0,0.03)] overflow-hidden transition-shadow hover:shadow-[0_4px_16px_rgba(0,0,0,0.05)]"
    >
      {/* Card Header */}
      <div className="px-4 sm:px-5 py-3.5 border-b border-slate-100 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <span className="flex items-center justify-center w-7 h-7 rounded-full bg-[#007AFF]/10 text-[#007AFF] text-xs font-semibold tabular-nums shrink-0">
            {index + 1}
          </span>
          <input
            type="text"
            value={item.tag}
            onChange={(e) => onUpdate({ ...item, tag: e.target.value })}
            placeholder="Location tag (e.g. Conference Room East)"
            aria-label="Panel location tag"
            className="text-[15px] font-semibold text-slate-900 placeholder:text-slate-400 bg-transparent rounded-lg px-2 py-1 -mx-2 hover:bg-slate-50 focus:bg-slate-50 focus:outline-hidden focus:ring-2 focus:ring-[#007AFF]/20 flex-1 min-w-0 transition-colors"
          />
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={onViewDrawing}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#007AFF] bg-[#007AFF]/8 hover:bg-[#007AFF]/15 rounded-full transition-colors"
            title="Preview CAD Shop Drawing"
          >
            <Eye className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">CAD</span>
          </button>

          <button
            type="button"
            onClick={onDuplicate}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors"
            aria-label="Duplicate panel"
            title="Duplicate"
          >
            <Copy className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={onDelete}
            className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-full transition-colors"
            aria-label="Delete panel"
            title="Delete"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Card Body */}
      <div className="p-4 sm:p-5 space-y-4">
        {/* Dimensions & Quick Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-12 gap-3">
          {/* Quantity */}
          <div className="col-span-2 sm:col-span-2">
            <label
              htmlFor={`qty-${item.id}`}
              className="block text-[11px] font-medium text-slate-500 mb-1.5 px-0.5"
            >
              Qty
            </label>
            <input
              id={`qty-${item.id}`}
              type="number"
              min="1"
              max="999"
              value={item.quantity}
              onChange={(e) => handleQtyChange(parseInt(e.target.value) || 1)}
              className="w-full tabular-nums text-sm font-semibold text-slate-900 bg-[#F2F2F7]/80 border border-transparent rounded-xl px-3.5 py-2.5 focus:bg-white focus:border-[#007AFF] focus:ring-2 focus:ring-[#007AFF]/20 focus:outline-hidden transition-all"
            />
          </div>

          {/* Width */}
          <div className="col-span-1 sm:col-span-3">
            <div className="flex items-center justify-between mb-1.5 px-0.5">
              <label
                htmlFor={`width-${item.id}`}
                className="text-[11px] font-medium text-slate-500"
              >
                Width (in)
              </label>
              {item.width > 0 && (
                <span className="text-[11px] tabular-nums text-[#007AFF] font-medium">
                  {item.width.toFixed(3)}&Prime;
                </span>
              )}
            </div>
            <input
              id={`width-${item.id}`}
              type="text"
              value={item.widthRaw}
              onChange={(e) => handleWidthChange(e.target.value)}
              placeholder='36 1/2'
              className="w-full tabular-nums text-sm font-semibold text-slate-900 bg-[#F2F2F7]/80 border border-transparent rounded-xl px-3.5 py-2.5 focus:bg-white focus:border-[#007AFF] focus:ring-2 focus:ring-[#007AFF]/20 focus:outline-hidden transition-all"
            />
          </div>

          {/* Height */}
          <div className="col-span-1 sm:col-span-3">
            <div className="flex items-center justify-between mb-1.5 px-0.5">
              <label
                htmlFor={`height-${item.id}`}
                className="text-[11px] font-medium text-slate-500"
              >
                Height (in)
              </label>
              {item.height > 0 && (
                <span className="text-[11px] tabular-nums text-[#007AFF] font-medium">
                  {item.height.toFixed(3)}&Prime;
                </span>
              )}
            </div>
            <input
              id={`height-${item.id}`}
              type="text"
              value={item.heightRaw}
              onChange={(e) => handleHeightChange(e.target.value)}
              placeholder='84'
              className="w-full tabular-nums text-sm font-semibold text-slate-900 bg-[#F2F2F7]/80 border border-transparent rounded-xl px-3.5 py-2.5 focus:bg-white focus:border-[#007AFF] focus:ring-2 focus:ring-[#007AFF]/20 focus:outline-hidden transition-all"
            />
          </div>

          {/* Live Summary */}
          <div className="col-span-2 sm:col-span-4 bg-[#F2F2F7]/60 rounded-xl px-3.5 py-2.5 flex flex-col justify-center gap-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500">Area</span>
              <span className="font-semibold text-slate-900 tabular-nums">
                {metrics.grossSqFtPerUnit.toFixed(2)} SF
                <span className="text-slate-400 font-normal ml-1">
                  ({metrics.totalGrossSqFt.toFixed(1)} tot)
                </span>
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500">Weight</span>
              <span className="font-semibold text-slate-900 tabular-nums">
                {metrics.weightPerUnitLbs.toFixed(1)} lbs
                <span className="text-slate-400 font-normal ml-1">
                  ({metrics.totalWeightLbs.toFixed(0)} tot)
                </span>
              </span>
            </div>
          </div>
        </div>

        {/* Film Cut Size Callout */}
        <div className="bg-sky-50/80 border border-sky-200/60 rounded-xl px-3.5 py-2.5 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="text-xs font-medium text-sky-900">
              Active Film Cut Size
            </span>
            <span className="text-xs font-semibold text-[#007AFF] bg-white px-2.5 py-1 rounded-lg shadow-2xs tabular-nums">
              {formatFraction(metrics.filmWidth)} &times; {formatFraction(metrics.filmHeight)}
            </span>
            <span className="text-[11px] tabular-nums text-sky-700/80 hidden sm:inline">
              {metrics.filmWidth.toFixed(3)}&Prime; &times; {metrics.filmHeight.toFixed(3)}&Prime;
            </span>
          </div>
          <span className="text-[11px] text-sky-700/75">
            3/8&Prime; perimeter setback applied
          </span>
        </div>

        {/* Assembly Stack & Presets */}
        <div className="pt-1 space-y-2.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-slate-400" />
              <span className="text-xs font-semibold text-slate-700">
                Assembly Stack
              </span>
              <span className="text-xs text-slate-400 tabular-nums">
                &middot; {item.layers.length} layers &middot; {formatFraction(metrics.totalNominalThickness)}
              </span>
            </div>

            <div className="flex items-center gap-1.5 flex-wrap">
              {GLASS_PRESETS.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => applyPreset(p.id)}
                  className="text-[11px] font-medium px-2.5 py-1 rounded-full bg-slate-100 hover:bg-slate-200/80 text-slate-700 transition-colors"
                  title={p.description}
                >
                  {p.category}
                </button>
              ))}

              <button
                type="button"
                onClick={() => setShowAdvancedLayers(!showAdvancedLayers)}
                className="flex items-center gap-1 text-xs font-semibold text-[#007AFF] hover:text-[#0062CC] pl-2 py-1 transition-colors"
              >
                <span>{showAdvancedLayers ? 'Done' : 'Edit Layers'}</span>
                {showAdvancedLayers ? (
                  <ChevronUp className="w-3.5 h-3.5" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
          </div>

          {/* Makeup Summary Pill */}
          <div className="text-xs text-slate-600 bg-[#F2F2F7]/60 px-3.5 py-2 rounded-xl tabular-nums leading-relaxed">
            {metrics.layerMakeupString}
          </div>

          {/* Expanded Layer Editor */}
          {showAdvancedLayers && (
            <div className="mt-2 space-y-2 bg-[#F2F2F7]/60 p-3 rounded-2xl border border-black/[0.04]">
              <div className="text-[11px] font-medium text-slate-500 px-1">
                Outboard to Inboard
              </div>

              {item.layers.map((layer, lIdx) => (
                <div
                  key={layer.id || lIdx}
                  className="bg-white rounded-xl p-2.5 border border-black/[0.05] flex flex-wrap items-center justify-between gap-2 shadow-2xs"
                >
                  <div className="flex items-center gap-2 flex-1 min-w-[240px]">
                    <span className="text-[11px] tabular-nums text-slate-400 w-5 text-center">
                      {lIdx + 1}
                    </span>

                    <span
                      className={`text-[11px] px-2 py-0.5 rounded-full font-medium shrink-0 ${
                        layer.kind === 'glass'
                          ? 'bg-sky-100 text-sky-800'
                          : layer.kind === 'interlayer'
                          ? 'bg-amber-100 text-amber-800'
                          : layer.kind === 'active_film'
                          ? 'bg-[#007AFF]/12 text-[#007AFF]'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {layer.kind === 'active_film'
                        ? 'ASG Film'
                        : layer.kind === 'glass'
                        ? 'Glass'
                        : layer.kind === 'interlayer'
                        ? 'Interlayer'
                        : 'Spacer'}
                    </span>

                    {layer.kind === 'glass' && (
                      <div className="flex items-center gap-1.5 flex-wrap text-xs">
                        <select
                          aria-label="Glass thickness"
                          value={layer.thickness}
                          onChange={(e) =>
                            updateLayer(lIdx, {
                              ...layer,
                              thickness: e.target.value as GlassThickness,
                            })
                          }
                          className="bg-[#F2F2F7] rounded-lg px-2 py-1 text-xs font-medium text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-[#007AFF]/20"
                        >
                          <option value='1/8"'>1/8&quot;</option>
                          <option value='5/32"'>5/32&quot;</option>
                          <option value='3/16"'>3/16&quot;</option>
                          <option value='1/4"'>1/4&quot;</option>
                          <option value='5/16"'>5/16&quot;</option>
                          <option value='3/8"'>3/8&quot;</option>
                          <option value='1/2"'>1/2&quot;</option>
                          <option value='5/8"'>5/8&quot;</option>
                          <option value='3/4"'>3/4&quot;</option>
                        </select>

                        <select
                          aria-label="Glass type"
                          value={layer.glassType}
                          onChange={(e) =>
                            updateLayer(lIdx, {
                              ...layer,
                              glassType: e.target.value as GlassType,
                            })
                          }
                          className="bg-[#F2F2F7] rounded-lg px-2 py-1 text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-[#007AFF]/20"
                        >
                          <option value="Ultra-Clear Low Iron">Low Iron (Starphire)</option>
                          <option value="Clear">Clear</option>
                          <option value="Grey Tint">Grey Tint</option>
                          <option value="Bronze Tint">Bronze Tint</option>
                          <option value="Low-E Surface 1">Low-E Surface 1</option>
                          <option value="Low-E Surface 2">Low-E Surface 2</option>
                        </select>

                        <select
                          aria-label="Glass process"
                          value={layer.process}
                          onChange={(e) =>
                            updateLayer(lIdx, {
                              ...layer,
                              process: e.target.value as GlassProcess,
                            })
                          }
                          className="bg-[#F2F2F7] rounded-lg px-2 py-1 text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-[#007AFF]/20"
                        >
                          <option value="Fully Tempered">Fully Tempered</option>
                          <option value="Heat Strengthened">Heat Strengthened</option>
                          <option value="Annealed">Annealed</option>
                        </select>
                      </div>
                    )}

                    {layer.kind === 'interlayer' && (
                      <div className="flex items-center gap-1.5 flex-wrap text-xs">
                        <select
                          aria-label="Interlayer material"
                          value={layer.material}
                          onChange={(e) =>
                            updateLayer(lIdx, {
                              ...layer,
                              material: e.target.value as InterlayerMaterial,
                            })
                          }
                          className="bg-[#F2F2F7] rounded-lg px-2 py-1 text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-[#007AFF]/20"
                        >
                          <option value="PVB">PVB Interlayer</option>
                          <option value="SentryGlas (SG)">SentryGlas Structural</option>
                        </select>

                        <select
                          aria-label="Interlayer thickness"
                          value={layer.thickness}
                          onChange={(e) =>
                            updateLayer(lIdx, {
                              ...layer,
                              thickness: e.target.value as InterlayerThickness,
                            })
                          }
                          className="bg-[#F2F2F7] rounded-lg px-2 py-1 text-xs font-medium text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-[#007AFF]/20"
                        >
                          <option value='0.030"'>0.030&quot; (0.76mm)</option>
                          <option value='0.045"'>0.045&quot; (1.14mm)</option>
                          <option value='0.060"'>0.060&quot; (1.52mm)</option>
                          <option value='0.090"'>0.090&quot; (2.28mm)</option>
                        </select>
                      </div>
                    )}

                    {layer.kind === 'active_film' && (
                      <div className="flex items-center gap-2 flex-wrap text-xs">
                        <span className="text-slate-500 text-xs">
                          PDLC 0.015&Prime;
                        </span>
                        <select
                          aria-label="Busbar location"
                          value={layer.busbarLocation}
                          onChange={(e) =>
                            updateLayer(lIdx, {
                              ...layer,
                              busbarLocation: e.target.value as BusbarLocation,
                            })
                          }
                          className="bg-[#F2F2F7] rounded-lg px-2 py-1 text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-[#007AFF]/20"
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
                      <div className="flex items-center gap-1.5 flex-wrap text-xs">
                        <select
                          aria-label="Spacer thickness"
                          value={layer.thickness}
                          onChange={(e) =>
                            updateLayer(lIdx, {
                              ...layer,
                              thickness: e.target.value as SpacerThickness,
                            })
                          }
                          className="bg-[#F2F2F7] rounded-lg px-2 py-1 text-xs font-medium text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-[#007AFF]/20"
                        >
                          <option value='1/4"'>1/4&quot; Cavity</option>
                          <option value='3/8"'>3/8&quot; Cavity</option>
                          <option value='1/2"'>1/2&quot; Cavity</option>
                          <option value='5/8"'>5/8&quot; Cavity</option>
                        </select>

                        <select
                          aria-label="Spacer color"
                          value={layer.color}
                          onChange={(e) =>
                            updateLayer(lIdx, {
                              ...layer,
                              color: e.target.value as SpacerColor,
                            })
                          }
                          className="bg-[#F2F2F7] rounded-lg px-2 py-1 text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-[#007AFF]/20"
                        >
                          <option value="Warm Edge Black">Warm Edge Black</option>
                          <option value="Clear / Mill Anodized">Clear Mill Anodized</option>
                          <option value="Dark Bronze">Dark Bronze</option>
                        </select>
                      </div>
                    )}
                  </div>

                  {/* Move & Delete */}
                  <div className="flex items-center gap-0.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => moveLayer(lIdx, 'up')}
                      disabled={lIdx === 0}
                      className="p-1.5 text-slate-400 hover:text-slate-700 disabled:opacity-25 rounded-full hover:bg-slate-100"
                      aria-label="Move layer outboard"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => moveLayer(lIdx, 'down')}
                      disabled={lIdx === item.layers.length - 1}
                      className="p-1.5 text-slate-400 hover:text-slate-700 disabled:opacity-25 rounded-full hover:bg-slate-100"
                      aria-label="Move layer inboard"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => removeLayer(lIdx)}
                      disabled={item.layers.length <= 1}
                      className="p-1.5 text-slate-400 hover:text-rose-600 disabled:opacity-25 rounded-full hover:bg-rose-50"
                      aria-label="Remove layer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}

              {/* Add Layer Chips */}
              <div className="pt-1.5 flex flex-wrap items-center gap-1.5">
                <span className="text-[11px] font-medium text-slate-500 mr-1">
                  Add:
                </span>
                <button
                  type="button"
                  onClick={() => addLayer('glass')}
                  className="text-xs font-medium px-2.5 py-1 rounded-full bg-white text-sky-700 hover:bg-sky-50 border border-black/[0.06] transition-colors flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" /> Glass
                </button>
                <button
                  type="button"
                  onClick={() => addLayer('interlayer')}
                  className="text-xs font-medium px-2.5 py-1 rounded-full bg-white text-amber-700 hover:bg-amber-50 border border-black/[0.06] transition-colors flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" /> Interlayer
                </button>
                <button
                  type="button"
                  onClick={() => addLayer('active_film')}
                  className="text-xs font-medium px-2.5 py-1 rounded-full bg-white text-[#007AFF] hover:bg-sky-50 border border-black/[0.06] transition-colors flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" /> ASG Film
                </button>
                <button
                  type="button"
                  onClick={() => addLayer('spacer')}
                  className="text-xs font-medium px-2.5 py-1 rounded-full bg-white text-slate-700 hover:bg-slate-100 border border-black/[0.06] transition-colors flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" /> Spacer
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Pricing Row (Fabricator Cost & End-Client Price) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-[#F2F2F7]/50 rounded-xl p-3 border border-black/[0.04]">
          <div>
            <label
              htmlFor={`fab-cost-${item.id}`}
              className="block text-[11px] font-medium text-slate-500 mb-1"
            >
              Fabricator Cost / Lite ($)
            </label>
            <input
              id={`fab-cost-${item.id}`}
              type="number"
              min="0"
              step="0.01"
              value={item.fabricatorCost ?? ''}
              onChange={(e) => {
                const val = e.target.value === '' ? undefined : parseFloat(e.target.value);
                onUpdate({ ...item, fabricatorCost: val });
              }}
              placeholder="0.00"
              className="w-full tabular-nums text-xs font-semibold text-slate-800 bg-white border border-black/[0.06] rounded-lg px-3 py-1.5 focus:border-[#007AFF] focus:ring-2 focus:ring-[#007AFF]/20 focus:outline-hidden"
            />
          </div>

          <div>
            <label
              htmlFor={`unit-price-${item.id}`}
              className="block text-[11px] font-medium text-slate-500 mb-1"
            >
              Client Unit Price / Lite ($)
            </label>
            <input
              id={`unit-price-${item.id}`}
              type="number"
              min="0"
              step="0.01"
              value={item.unitPrice ?? ''}
              onChange={(e) => {
                const val = e.target.value === '' ? undefined : parseFloat(e.target.value);
                onUpdate({ ...item, unitPrice: val });
              }}
              placeholder="0.00"
              className="w-full tabular-nums text-xs font-semibold text-[#007AFF] bg-white border border-black/[0.06] rounded-lg px-3 py-1.5 focus:border-[#007AFF] focus:ring-2 focus:ring-[#007AFF]/20 focus:outline-hidden"
            />
          </div>

          <div className="flex flex-col justify-center sm:items-end px-1">
            <span className="text-[11px] font-medium text-slate-500">
              Client Line Total
            </span>
            <span className="text-sm font-bold text-slate-900 tabular-nums">
              ${((item.quantity || 1) * (item.unitPrice || 0)).toLocaleString('en-US', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </span>
          </div>
        </div>

        {/* Glazing Notes */}
        <div>
          <input
            type="text"
            value={item.notes || ''}
            onChange={(e) => onUpdate({ ...item, notes: e.target.value })}
            placeholder="Add glazing or installation note..."
            aria-label="Glazing notes"
            className="w-full text-xs text-slate-600 placeholder:text-slate-400 bg-[#F2F2F7]/50 hover:bg-[#F2F2F7]/80 focus:bg-white border border-transparent focus:border-[#007AFF] focus:ring-2 focus:ring-[#007AFF]/20 focus:outline-hidden rounded-xl px-3.5 py-2 transition-all"
          />
        </div>
      </div>
    </section>
  );
};
