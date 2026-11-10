import {
  GlassLineItem,
  CalculatedItemMetrics,
  ProjectTotals,
  GlassStackLayer,
} from '../types/glass';

/**
 * Parses free-form input into decimal inches.
 * Supports:
 * - Mixed fractions: "20 1/2", "20-1/2", "36 5/8\""
 * - Pure fractions: "3/16", "5/8"
 * - Decimals and integers: "20.5", "84", "84.25\""
 */
export function parseGlassDimension(input: string | number): number {
  if (input === null || input === undefined || input === '') return 0;
  if (typeof input === 'number') return isNaN(input) ? 0 : input;

  let str = input.toString().replace(/["']/g, '').trim();

  // Mixed fraction: "20 1/2" or "20-1/2"
  const mixedRegex = /^(\d+)[ -]+(\d+)\/(\d+)$/;
  const mixedMatch = str.match(mixedRegex);
  if (mixedMatch) {
    const whole = parseFloat(mixedMatch[1]);
    const num = parseFloat(mixedMatch[2]);
    const den = parseFloat(mixedMatch[3]);
    return den !== 0 ? whole + num / den : whole;
  }

  // Pure fraction: "3/16"
  const fracRegex = /^(\d+)\/(\d+)$/;
  const fracMatch = str.match(fracRegex);
  if (fracMatch) {
    const num = parseFloat(fracMatch[1]);
    const den = parseFloat(fracMatch[2]);
    return den !== 0 ? num / den : 0;
  }

  // Decimal or integer: "20.5" or "20"
  const val = parseFloat(str);
  return isNaN(val) ? 0 : val;
}

/**
 * Converts decimal thickness string (e.g. '3/16"', '0.045"') to numeric inches.
 */
export function getLayerThicknessInches(layer: GlassStackLayer): number {
  switch (layer.kind) {
    case 'glass': {
      const map: Record<string, number> = {
        '1/8"': 0.125,
        '5/32"': 0.15625,
        '3/16"': 0.1875,
        '1/4"': 0.25,
        '5/16"': 0.3125,
        '3/8"': 0.375,
        '1/2"': 0.5,
        '5/8"': 0.625,
        '3/4"': 0.75,
      };
      return map[layer.thickness] ?? parseGlassDimension(layer.thickness);
    }
    case 'interlayer': {
      const map: Record<string, number> = {
        '0.030"': 0.03,
        '0.045"': 0.045,
        '0.060"': 0.06,
        '0.090"': 0.09,
      };
      return map[layer.thickness] ?? parseGlassDimension(layer.thickness);
    }
    case 'active_film': {
      return layer.nominalThickness || 0.015;
    }
    case 'spacer': {
      const map: Record<string, number> = {
        '1/4"': 0.25,
        '3/8"': 0.375,
        '1/2"': 0.5,
        '5/8"': 0.625,
      };
      return map[layer.thickness] ?? parseGlassDimension(layer.thickness);
    }
    default:
      return 0;
  }
}

/**
 * Converts decimal inches into architectural fraction notation (to nearest 1/16" or 1/32").
 * Examples:
 * 35.625 -> "35 5/8\""
 * 20.5 -> "20 1/2\""
 * 0.1875 -> "3/16\""
 */
export function formatFraction(val: number, includeQuotes = true): string {
  if (!val || isNaN(val)) return `0${includeQuotes ? '"' : ''}`;

  const precision = 32; // snap to nearest 1/32"
  const sign = val < 0 ? '-' : '';
  const absVal = Math.abs(val);
  const whole = Math.floor(absVal);
  const remainder = absVal - whole;

  if (remainder < 0.005) {
    return `${sign}${whole}${includeQuotes ? '"' : ''}`;
  }

  // Find nearest fraction of precision
  let num = Math.round(remainder * precision);
  let den = precision;

  if (num === precision) {
    return `${sign}${whole + 1}${includeQuotes ? '"' : ''}`;
  }
  if (num === 0) {
    return `${sign}${whole}${includeQuotes ? '"' : ''}`;
  }

  // Simplify fraction by greatest common divisor
  const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));
  const divisor = gcd(num, den);
  num = num / divisor;
  den = den / divisor;

  const fracStr = `${num}/${den}`;
  const result = whole === 0 ? `${sign}${fracStr}` : `${sign}${whole} ${fracStr}`;
  return `${result}${includeQuotes ? '"' : ''}`;
}

/**
 * Format decimal dimension with both fraction and decimal in brackets for CAD clarity.
 * e.g., 35.625 -> 35-5/8" [35.625"]
 */
export function formatCadDimension(val: number): string {
  const frac = formatFraction(val, true);
  return `${frac} [${val.toFixed(3)}"]`;
}

/**
 * Generates an architectural summary string for a glass stack makeup.
 * e.g. "1/4\" Low Iron Tmp + 0.045\" PVB + ASG Active Film + 0.045\" PVB + 1/4\" Low Iron Tmp"
 */
export function getLayerMakeupSummary(layers: GlassStackLayer[]): string {
  if (!layers || layers.length === 0) return 'Monolithic Glass (Unspecified)';

  return layers
    .map((l) => {
      if (l.kind === 'glass') {
        const processShort =
          l.process === 'Fully Tempered'
            ? 'Tmp'
            : l.process === 'Heat Strengthened'
            ? 'HS'
            : 'Ann';
        const typeShort = l.glassType.replace('Ultra-Clear ', '');
        return `${l.thickness} ${typeShort} ${processShort}`;
      }
      if (l.kind === 'interlayer') {
        const mat = l.material === 'SentryGlas (SG)' ? 'SentryGlas' : 'PVB';
        return `${l.thickness} ${mat}`;
      }
      if (l.kind === 'active_film') {
        return 'ASG PDLC Active Film';
      }
      if (l.kind === 'spacer') {
        return `${l.thickness} Air/Argon Spacer`;
      }
      return '';
    })
    .filter(Boolean)
    .join(' + ');
}

/**
 * Calculates metrics for an individual glass line item according to engineering standards:
 * - Area = (W * H) / 144
 * - Weight = Total Glass Plies Thickness * 13 lbs/sqft/inch * Area
 * - Film Cut Size = (W - 3/8") x (H - 3/8")
 */
export function calculateItemMetrics(item: GlassLineItem): CalculatedItemMetrics {
  const w = item.width || parseGlassDimension(item.widthRaw);
  const h = item.height || parseGlassDimension(item.heightRaw);
  const qty = Math.max(1, item.quantity || 1);

  const grossSqFtPerUnit = (w * h) / 144;
  const totalGrossSqFt = grossSqFtPerUnit * qty;

  // Calculate glass thickness (only glass plies contribute to standard glass structural weight)
  let totalGlassThickness = 0;
  let totalAssemblyThickness = 0;

  for (const layer of item.layers) {
    const t = getLayerThicknessInches(layer);
    totalAssemblyThickness += t;
    if (layer.kind === 'glass') {
      totalGlassThickness += t;
    }
  }

  // Weight formula: Glass Weight = Area * (Total Glass Thickness * 13 lbs/sq ft per inch)
  const weightPerUnitLbs = grossSqFtPerUnit * totalGlassThickness * 13;
  const totalWeightLbs = weightPerUnitLbs * qty;

  // ASG Film Cut Size: 3/8" deduction (0.375") on both Width and Height
  const filmWidth = Math.max(0, w - 0.375);
  const filmHeight = Math.max(0, h - 0.375);
  const filmAreaSqFt = (filmWidth * filmHeight) / 144;

  const layerMakeupString = getLayerMakeupSummary(item.layers);

  return {
    grossSqFtPerUnit,
    totalGrossSqFt,
    totalNominalThickness: totalAssemblyThickness,
    totalGlassNominalThickness: totalGlassThickness,
    weightPerUnitLbs,
    totalWeightLbs,
    filmWidth,
    filmHeight,
    filmAreaSqFt,
    layerMakeupString,
  };
}

/**
 * Calculates project-level totals across all glass line items.
 */
export function calculateProjectTotals(items: GlassLineItem[]): ProjectTotals {
  let totalPanels = 0;
  let totalGrossSqFt = 0;
  let totalWeightLbs = 0;
  let totalFilmSqFt = 0;
  let totalPrice = 0;

  for (const item of items) {
    const metrics = calculateItemMetrics(item);
    const qty = Math.max(1, item.quantity || 1);
    totalPanels += qty;
    totalGrossSqFt += metrics.totalGrossSqFt;
    totalWeightLbs += metrics.totalWeightLbs;
    totalFilmSqFt += metrics.filmAreaSqFt * qty;
    if (item.unitPrice) {
      totalPrice += item.unitPrice * qty;
    }
  }

  return {
    totalItems: items.length,
    totalPanels,
    totalGrossSqFt,
    totalWeightLbs,
    totalFilmSqFt,
    totalPrice: totalPrice > 0 ? totalPrice : undefined,
  };
}
