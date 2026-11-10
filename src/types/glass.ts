export type GlassThickness = '1/8"' | '5/32"' | '3/16"' | '1/4"' | '5/16"' | '3/8"' | '1/2"' | '5/8"' | '3/4"';
export type GlassType = 'Clear' | 'Ultra-Clear Low Iron' | 'Bronze Tint' | 'Grey Tint' | 'Low-E Surface 1' | 'Low-E Surface 2';
export type GlassProcess = 'Annealed' | 'Heat Strengthened' | 'Fully Tempered';

export type InterlayerMaterial = 'PVB' | 'SentryGlas (SG)';
export type InterlayerThickness = '0.030"' | '0.045"' | '0.060"' | '0.090"';

export type SpacerThickness = '1/4"' | '3/8"' | '1/2"' | '5/8"';
export type SpacerColor = 'Clear / Mill Anodized' | 'Warm Edge Black' | 'Dark Bronze';

export type BusbarLocation = 'Top Edge (Center)' | 'Top Edge (Right)' | 'Top Edge (Left)' | 'Bottom Edge' | 'Side Edge (Right)';

export interface GlassLayer {
  id: string;
  kind: 'glass';
  thickness: GlassThickness;
  glassType: GlassType;
  process: GlassProcess;
}

export interface InterlayerLayer {
  id: string;
  kind: 'interlayer';
  material: InterlayerMaterial;
  thickness: InterlayerThickness;
}

export interface ActiveFilmLayer {
  id: string;
  kind: 'active_film';
  material: 'ASG PDLC Switchable Film';
  nominalThickness: number; // typically 0.015"
  offsetDeduction: number; // 0.375" (3/8")
  busbarLocation: BusbarLocation;
  leadLength: string; // e.g. "12 ft Teflon leads"
}

export interface SpacerLayer {
  id: string;
  kind: 'spacer';
  thickness: SpacerThickness;
  color: SpacerColor;
  gasFill: '90% Argon / 10% Dry Air' | 'Dry Desiccant Air';
}

export type GlassStackLayer = GlassLayer | InterlayerLayer | ActiveFilmLayer | SpacerLayer;

export interface GlassLineItem {
  id: string;
  tag: string; // e.g. "Conference Room Window A"
  quantity: number;
  widthRaw: string; // e.g. "36 1/2"
  heightRaw: string; // e.g. "84"
  width: number; // decimal inches
  height: number; // decimal inches
  layers: GlassStackLayer[];
  notes?: string;
  unitPrice?: number; // optional commercial price estimate
}

export interface ProjectInfo {
  docId: string; // e.g. "ASG-EST-1001"
  projectName: string;
  clientName: string;
  contactPerson: string;
  contactEmail: string;
  contactPhone: string;
  projectAddress: string;
  date: string;
  validUntil: string;
  leadTime: string; // e.g. "3-4 Weeks from Approved Shop Drawings"
  paymentTerms: string; // e.g. "50% Deposit, Balance Prior to Crating"
  preparedBy: string; // e.g. "ASG Technical Sales Engineering"
}

export interface CalculatedItemMetrics {
  grossSqFtPerUnit: number;
  totalGrossSqFt: number;
  totalNominalThickness: number; // decimal inches
  totalGlassNominalThickness: number; // decimal inches (glass plies only, for weight)
  weightPerUnitLbs: number;
  totalWeightLbs: number;
  filmWidth: number; // W - 3/8"
  filmHeight: number; // H - 3/8"
  filmAreaSqFt: number;
  layerMakeupString: string;
}

export interface ProjectTotals {
  totalItems: number;
  totalPanels: number;
  totalGrossSqFt: number;
  totalWeightLbs: number;
  totalFilmSqFt: number;
  totalPrice?: number;
}
