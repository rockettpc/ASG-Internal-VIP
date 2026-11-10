import { GlassStackLayer, GlassLineItem, ProjectInfo } from '../types/glass';

export interface PresetMakeup {
  id: string;
  name: string;
  category: 'Switchable' | 'Laminated' | 'Insulated';
  description: string;
  layers: GlassStackLayer[];
}

export function generateLayerId(): string {
  return `layer-${Math.random().toString(36).substring(2, 9)}`;
}

export function generateItemId(): string {
  return `item-${Math.random().toString(36).substring(2, 9)}`;
}

export const GLASS_PRESETS: PresetMakeup[] = [
  {
    id: 'preset-standard-asg',
    name: 'Standard ASG Switchable Privacy Glass',
    category: 'Switchable',
    description: '5/16" Nom. (1/4" Low Iron Tempered + 0.045" PVB + ASG PDLC Film + 0.045" PVB + 1/4" Low Iron Tempered)',
    layers: [
      {
        id: 'p1-1',
        kind: 'glass',
        thickness: '1/4"',
        glassType: 'Ultra-Clear Low Iron',
        process: 'Fully Tempered',
      },
      {
        id: 'p1-2',
        kind: 'interlayer',
        material: 'PVB',
        thickness: '0.045"',
      },
      {
        id: 'p1-3',
        kind: 'active_film',
        material: 'ASG PDLC Switchable Film',
        nominalThickness: 0.015,
        offsetDeduction: 0.375,
        busbarLocation: 'Top Edge (Center)',
        leadLength: '12 ft Teflon leads',
      },
      {
        id: 'p1-4',
        kind: 'interlayer',
        material: 'PVB',
        thickness: '0.045"',
      },
      {
        id: 'p1-5',
        kind: 'glass',
        thickness: '1/4"',
        glassType: 'Ultra-Clear Low Iron',
        process: 'Fully Tempered',
      },
    ],
  },
  {
    id: 'preset-arch-laminated',
    name: 'Standard Architectural Laminated Glass',
    category: 'Laminated',
    description: '9/16" Nom. (1/4" Clear Tempered + 0.060" PVB Interlayer + 1/4" Clear Tempered)',
    layers: [
      {
        id: 'p2-1',
        kind: 'glass',
        thickness: '1/4"',
        glassType: 'Clear',
        process: 'Fully Tempered',
      },
      {
        id: 'p2-2',
        kind: 'interlayer',
        material: 'PVB',
        thickness: '0.060"',
      },
      {
        id: 'p2-3',
        kind: 'glass',
        thickness: '1/4"',
        glassType: 'Clear',
        process: 'Fully Tempered',
      },
    ],
  },
  {
    id: 'preset-asg-igu',
    name: 'ASG Insulated Glass Unit (IGU)',
    category: 'Insulated',
    description: '1-1/16" Nom. Dual-glazed IGU with exterior Low-E and interior ASG Switchable Privacy Laminated inboard lite.',
    layers: [
      {
        id: 'p3-1',
        kind: 'glass',
        thickness: '1/4"',
        glassType: 'Low-E Surface 2',
        process: 'Fully Tempered',
      },
      {
        id: 'p3-2',
        kind: 'spacer',
        thickness: '1/2"',
        color: 'Warm Edge Black',
        gasFill: '90% Argon / 10% Dry Air',
      },
      {
        id: 'p3-3',
        kind: 'glass',
        thickness: '1/4"',
        glassType: 'Ultra-Clear Low Iron',
        process: 'Fully Tempered',
      },
      {
        id: 'p3-4',
        kind: 'interlayer',
        material: 'PVB',
        thickness: '0.045"',
      },
      {
        id: 'p3-5',
        kind: 'active_film',
        material: 'ASG PDLC Switchable Film',
        nominalThickness: 0.015,
        offsetDeduction: 0.375,
        busbarLocation: 'Top Edge (Right)',
        leadLength: '12 ft Teflon leads',
      },
      {
        id: 'p3-6',
        kind: 'interlayer',
        material: 'PVB',
        thickness: '0.045"',
      },
      {
        id: 'p3-7',
        kind: 'glass',
        thickness: '1/4"',
        glassType: 'Ultra-Clear Low Iron',
        process: 'Fully Tempered',
      },
    ],
  },
  {
    id: 'preset-security-switchable',
    name: 'Acoustic / High-Security Switchable',
    category: 'Switchable',
    description: '13/16" Heavy-duty laminated safety makeup with SentryGlas structural interlayer.',
    layers: [
      {
        id: 'p4-1',
        kind: 'glass',
        thickness: '3/8"',
        glassType: 'Ultra-Clear Low Iron',
        process: 'Fully Tempered',
      },
      {
        id: 'p4-2',
        kind: 'interlayer',
        material: 'SentryGlas (SG)',
        thickness: '0.060"',
      },
      {
        id: 'p4-3',
        kind: 'active_film',
        material: 'ASG PDLC Switchable Film',
        nominalThickness: 0.015,
        offsetDeduction: 0.375,
        busbarLocation: 'Top Edge (Center)',
        leadLength: '15 ft Teflon leads',
      },
      {
        id: 'p4-4',
        kind: 'interlayer',
        material: 'SentryGlas (SG)',
        thickness: '0.060"',
      },
      {
        id: 'p4-5',
        kind: 'glass',
        thickness: '3/8"',
        glassType: 'Ultra-Clear Low Iron',
        process: 'Fully Tempered',
      },
    ],
  },
];

export function clonePresetLayers(presetId: string): GlassStackLayer[] {
  const preset = GLASS_PRESETS.find((p) => p.id === presetId) || GLASS_PRESETS[0];
  return preset.layers.map((l) => ({
    ...l,
    id: generateLayerId(),
  }));
}

export const INITIAL_PROJECT_INFO: ProjectInfo = {
  docId: 'ASG-EST-1048',
  projectName: 'Apex Financial HQ - 42nd Floor Executive Suite',
  clientName: 'Metro Glazing & Facades Corp.',
  contactPerson: 'David Miller, Senior Project Manager',
  contactEmail: 'dmiller@metroglazing.com',
  contactPhone: '(415) 890-3321',
  projectAddress: '555 California Street, Suite 4200, San Francisco, CA',
  date: new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }),
  validUntil: '30 Days from Issue',
  leadTime: '3-4 Weeks ARO (Approved Shop Drawings)',
  paymentTerms: '50% Upon Order Placement, Balance Net 30 Upon Delivery',
  preparedBy: 'ASG Commercial Engineering Desk',
};

export const INITIAL_LINE_ITEMS: GlassLineItem[] = [
  {
    id: 'item-101',
    tag: 'Conference Room 402 - East Glazing Lite 1',
    quantity: 2,
    widthRaw: '36 1/2',
    heightRaw: '84',
    width: 36.5,
    height: 84.0,
    layers: clonePresetLayers('preset-standard-asg'),
    notes: 'Top-hung sliding entrance panel. Busbar concealed in head channel.',
    unitPrice: 1850,
  },
  {
    id: 'item-102',
    tag: 'Boardroom West Elevation - Center Vision Panel',
    quantity: 1,
    widthRaw: '48',
    heightRaw: '96',
    width: 48.0,
    height: 96.0,
    layers: [
      {
        id: generateLayerId(),
        kind: 'glass',
        thickness: '3/16"',
        glassType: 'Clear',
        process: 'Fully Tempered',
      },
      {
        id: generateLayerId(),
        kind: 'interlayer',
        material: 'PVB',
        thickness: '0.045"',
      },
      {
        id: generateLayerId(),
        kind: 'active_film',
        material: 'ASG PDLC Switchable Film',
        nominalThickness: 0.015,
        offsetDeduction: 0.375,
        busbarLocation: 'Top Edge (Center)',
        leadLength: '12 ft Teflon leads',
      },
      {
        id: generateLayerId(),
        kind: 'interlayer',
        material: 'PVB',
        thickness: '0.045"',
      },
      {
        id: generateLayerId(),
        kind: 'glass',
        thickness: '3/16"',
        glassType: 'Clear',
        process: 'Fully Tempered',
      },
    ],
    notes: 'Calculates exact weight test unit: 48"x96" two 3/16" plies = 156 lbs.',
    unitPrice: 2450,
  },
  {
    id: 'item-103',
    tag: 'Executive Office 410 - Perimeter Demising Wall',
    quantity: 3,
    widthRaw: '36',
    heightRaw: '84',
    width: 36.0,
    height: 84.0,
    layers: clonePresetLayers('preset-standard-asg'),
    notes: 'Standard 36" x 84" panel (Film cut: 35-5/8" x 83-5/8"). Neutral silicone seal.',
    unitPrice: 1790,
  },
];
